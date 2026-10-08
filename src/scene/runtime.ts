import * as T from "three";
import {ThreeSceneRenderer} from './threeRenderer';
import type {RendererFactory,SceneRenderer} from './renderDriver';
import {AdaptiveQuality,constrainedHardware,mobileViewport,type QualityChoice} from './renderQuality';
import {CITY_BLOCKS} from '../game/cityMap';
import {contactShadow} from './worldAtmosphere';
import { getCustomer } from "../game/engine";
import {
  canWalk,
  routeAcross,
  routeTo,
  type Place,
  type Position,
} from "../game/service";
import type { GameState, Screen } from "../game/types";
import { makeCup, makePerson, pose, Workshop, type Person } from "./models";
import { buildShop } from "./shop";
import { Visits, visitPose, type Visit } from "./visits";
import { CityWorld } from './city';
import { CITY_PLACES, type CityPlace } from '../game/cityMap';
import { cityWeather } from '../game/city';
import { deliveryBag, dressBarista,errandCargo,fishingRod } from './cityDetails';
import {movementVector,slideMove,type Stick} from '../game/movement';
import {RESIDENTS,missionDefinition,type ResidentId} from '../game/neighborhoodStories';
import {nearCityPlace} from '../game/cityMap';

type Input = {
  game: GameState;
  screen: Screen;
  carrying: boolean;
  station: number;
  exploring: boolean;
  paused:boolean;
  onTalk:(id:ResidentId)=>void;
};
type Actor = { person: Person; cup: ReturnType<typeof makeCup> };
export class StreetRuntime {
  renderer: SceneRenderer;
  qualityController:AdaptiveQuality;
  renderSamples=0;renderMs=0;frameMs=0;
  submissions=0;submittedTriangles=0;
  sceneColor=new T.Color();
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(65, 1, 0.08, 180);
  workshop = new Workshop();
  shop = buildShop(this.workshop);
  city = new CityWorld(this.workshop);
  avatar = makePerson(this.workshop, getCustomer('miu'));
  parcel = deliveryBag(this.workshop);
  cargo=errandCargo(this.workshop);
  rod=fishingRod(this.workshop);
  sun = new T.DirectionalLight('#fff2ec', 2.5);
  ambient = new T.HemisphereLight('#fff1ed', '#bc91aa', 1.7);
  visits = new Visits();
  actors = new Map<string, Actor>();
  held = makeCup(this.workshop);
  draft = makeCup(this.workshop);
  playerHand = new T.Group();
  player = { x: 0, z: 3.15 };
  yaw = 0;
  pitch = -0.23;
  overview = false;
  keys = new Set<string>();
  stick:Stick={x:0,y:0};
  path: Position[] = [];
  blockedTime=0;
  avatarPhase=0;
  input: Input;
  raf = 0;
  previous = 0;
  lastDraw = 0;
  lastPosition = 0;
  motion = true;
  disposed = false;
  visible = true;
  canvas: HTMLCanvasElement;
  size: ResizeObserver;
  intersection: IntersectionObserver;
  preferences: MutationObserver;
  removeListeners: (() => void)[] = [];
  notify: (position: Position) => void;
  target = new T.Vector3();
  cameraFocus = new T.Vector3();
  cameraMode = '';
  followHeight=5;
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  hit = new T.Vector3();
  constructor(
    container: HTMLElement,
    input: Input,
    notify: (position: Position) => void,
    onLost: () => void,
    factory:RendererFactory=(scene,camera,profile)=>new ThreeSceneRenderer(scene,camera,profile),
    quality:QualityChoice='auto',
    initial?:{position:Position;yaw:number;pitch:number;overview:boolean},
  ) {
    this.input = input;
    this.notify = notify;
    const coarse=matchMedia('(pointer:coarse)').matches;
    const small=mobileViewport(window.innerWidth,window.innerHeight,coarse);
    const memory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory;
    this.qualityController=new AdaptiveQuality(quality,small,constrainedHardware(memory,navigator.hardwareConcurrency));
    this.renderer=factory(this.scene,this.camera,this.qualityController.profile);
    this.canvas=this.renderer.canvas;
    this.canvas.dataset.engine=this.renderer.name;
    if(initial){this.player={...initial.position};this.yaw=initial.yaw;this.pitch=initial.pitch;this.overview=initial.overview;}
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute(
      "aria-label",
      "Không gian tiệm và khu phố 3D. Kéo núm tròn để đi, vuốt cảnh để xoay camera. Bàn phím dùng WASD hoặc phím mũi tên.",
    );
    this.scene.background=this.sceneColor.set('#c8dde9');
    this.scene.fog=new T.Fog('#c8dde9',80,165);
    this.scene.add(this.shop.root);
    this.scene.add(this.city.root, this.avatar.root, this.ambient);
    dressBarista(this.workshop,this.avatar);
    contactShadow(this.workshop,this.avatar.root,.6);
    this.avatar.root.add(this.parcel.root);
    Object.values(this.cargo).forEach(root=>this.avatar.root.add(root));
    this.avatar.hand.add(this.rod);
    const sun = this.sun;
    sun.position.set(-4, 9, -5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(
      this.qualityController.profile.shadowSize,
      this.qualityController.profile.shadowSize,
    );
    sun.shadow.camera.left = sun.shadow.camera.bottom = -9;
    sun.shadow.camera.right = sun.shadow.camera.top = 9;
    sun.shadow.normalBias = 0.025;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);
    this.scene.add(sun.target);
    const indoor = new T.DirectionalLight("#dfecf4", 0.45);
    indoor.position.set(0, 5, 4);
    this.scene.add(indoor);
    this.scene.add(this.draft.root);
    this.draft.root.position.set(0.3, 1.29, 1.17);
    this.camera.add(this.held.root);
    this.held.root.position.set(0.31, -0.45, -0.76);
    this.held.root.rotation.z = -0.07;
    this.camera.add(this.playerHand);
    this.workshop.cylinder(
      this.playerHand,
      "#be916c",
      [0.4, -0.5, -0.64],
      0.064,
      0.46,
    ).rotation.x = -0.45;
    this.workshop.ball(
      this.playerHand,
      "#be916c",
      [0.42, -0.25, -0.73],
      [0.065, 0.095, 0.068],
    );
    this.workshop.ball(
      this.playerHand,
      "#be916c",
      [0.365, -0.2, -0.63],
      [0.031, 0.064, 0.03],
    );
    this.scene.add(this.camera);
    container.appendChild(this.canvas);
    this.size = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (width && height) {
        const small=mobileViewport(window.innerWidth,window.innerHeight,matchMedia('(pointer:coarse)').matches);
        this.qualityController.mobile=small;
        if(this.qualityController.choice==='auto'&&small&&this.qualityController.index>1){
          this.qualityController.index=1;this.renderer.quality(this.qualityController.profile);
          this.sun.shadow.mapSize.set(this.qualityController.profile.shadowSize,this.qualityController.profile.shadowSize);
          this.sun.shadow.map?.dispose();this.sun.shadow.map=null;
        }
        this.renderer.resize(width,height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
    });
    this.size.observe(container);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.resume();
    });
    this.intersection.observe(container);
    const preference = () => {
      this.motion =
        document.documentElement.dataset.motion !== "off" &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches;
    };
    preference();
    this.preferences = new MutationObserver(preference);
    this.preferences.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener("change", preference);
    this.removeListeners.push(() =>
      reduced.removeEventListener("change", preference),
    );
    this.listen(document, "visibilitychange", () => {
      this.keys.clear();
      this.stick={x:0,y:0};
      this.resume();
    });
    this.listen(window, "blur", () => {this.keys.clear();this.stick={x:0,y:0};});
    this.listen(this.canvas, "blur", () => this.keys.clear());
    this.listen(this.canvas, "webglcontextlost", (event) => {
      event.preventDefault();
      onLost();
      this.dispose();
    });
    this.listen(this.canvas, "keydown", (event) => {
      const e = event as KeyboardEvent;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        this.keys.add(key);
        this.path = [];
        this.overview = false;
      }
    });
    this.listen(this.canvas, "keyup", (event) =>
      this.keys.delete((event as KeyboardEvent).key.toLowerCase()),
    );
    let drag: { id:number; x: number; y: number; startX: number; startY: number } | null =
      null;
    this.listen(this.canvas, "pointerdown", (event) => {
      const e = event as PointerEvent;
      if(drag||this.input.paused)return;
      drag = {
        id:e.pointerId,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
      };
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.focus({ preventScroll: true });
    });
    this.listen(this.canvas, "pointermove", (event) => {
      if (!drag || this.input.paused) return;
      const e = event as PointerEvent;
      if(e.pointerId!==drag.id)return;
      this.yaw -= (e.clientX - drag.x) * 0.005;
      this.pitch = T.MathUtils.clamp(
        this.pitch - (e.clientY - drag.y) * 0.004,
        -0.65,
        0.4,
      );
      drag.x = e.clientX;
      drag.y = e.clientY;
    });
    this.listen(this.canvas, "pointerup", (event) => {
      const e = event as PointerEvent;
      if(!drag||e.pointerId!==drag.id)return;
      if (
        drag &&
        Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6 &&
        !this.input.paused
      ) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        this.ray.setFromCamera(this.pointer, this.camera);
        if(this.input.exploring){
          const targets=[...this.city.neighbors.values()].map(n=>n.person.root);
          const hit=this.ray.intersectObjects(targets,true)[0];
          if(hit){
            let object:T.Object3D|null=hit.object;
            while(object&&!object.userData.resident)object=object.parent;
            const npc=RESIDENTS.find(r=>r.id===object?.userData.resident);
            if(npc&&nearCityPlace(this.player,npc.place)){this.keys.clear();this.stick={x:0,y:0};this.path=[];this.input.onTalk(npc.id);drag=null;return;}
          }
        }
        if (
          this.overview &&
          this.ray.ray.intersectPlane(this.plane, this.hit) &&
          canWalk(this.hit, true)
        ) {
          const goal = { x: this.hit.x, z: this.hit.z };
          this.path = routeAcross(this.player, goal, true);
        }
      }
      drag = null;
    });
    this.listen(this.canvas, "pointercancel", () => {
      drag = null;
    });
    this.listen(this.canvas,'lostpointercapture',()=>{drag=null;});
    this.resume();
  }
  listen(target: EventTarget, type: string, fn: EventListener) {
    target.addEventListener(type, fn);
    this.removeListeners.push(() => target.removeEventListener(type, fn));
  }
  update(input: Input) {
    if(!input.exploring && this.input.exploring && this.player.z < -4.3) this.rideHome();
    if(input.paused||input.screen!==this.input.screen||input.exploring!==this.input.exploring){this.keys.clear();this.stick={x:0,y:0};this.path=[];}
    this.input = input;
  }
  analog(stick:Stick) {
    if(this.input.paused){this.stick={x:0,y:0};return;}
    this.stick=stick;
    if(stick.x||stick.y){this.path=[];this.overview=false;}
  }
  go(place: Place) {
    this.stick={x:0,y:0};
    this.keys.clear();
    this.path = routeTo(this.player, place, true);
  }
  goCity(place: CityPlace) {
    this.stick={x:0,y:0};
    this.keys.clear();
    this.path = routeAcross(this.player, CITY_PLACES[place], true);
  }
  leaveShop() {
    if(this.player.z > -5.4) this.path=routeAcross(this.player,{x:0,z:-7},true);
  }
  rideHome() {
    this.keys.clear(); this.path = []; this.player = { x: 0, z: 2.15 };
    this.notify({ ...this.player });
  }
  move(key: string, active: boolean) {
    if (active) {
      this.keys.add(key);
      this.path = [];
      this.overview = false;
    } else this.keys.delete(key);
  }
  resume() {
    cancelAnimationFrame(this.raf);
    this.previous = 0;
    if (!document.hidden && this.visible && !this.disposed)
      this.raf = requestAnimationFrame(this.tick);
  }
  actor(visit: Visit) {
    let actor = this.actors.get(visit.order.id);
    if (!actor) {
      const person = makePerson(
        this.workshop,
        getCustomer(visit.order.customerId),
      );
      const cup = makeCup(this.workshop);
      cup.root.rotation.x = Math.PI / 2;
      person.hand.add(cup.root);
      this.scene.add(person.root);
      actor = { person, cup };
      this.actors.set(visit.order.id, actor);
    }
    return actor;
  }
  tick = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    if (now - this.lastDraw < 1000 / 30) return;
    const frameInterval=now-(this.previous||now);
    const renderStart=performance.now();
    const dt = Math.min(0.05, frameInterval/1000);
    this.previous = now;
    this.lastDraw = now;
    const { game, screen, carrying } = this.input;
    this.city.update(game, dt, this.motion, this.player);
    const night = game.city.minutes >= 1080;
    const rainy = cityWeather(game.day).rain;
    this.sceneColor.set(night?'#38445c':rainy?'#b7c9cf':'#c8dde9');
    (this.scene.fog as T.Fog).color.copy(this.sceneColor);
    this.sun.intensity=night?0.35:rainy?1.15:2.7;
    this.ambient.intensity=night?0.65:rainy?0.85:0.65;
    const focusX=this.input.exploring?(this.overview?0:this.player.x):0;
    const focusZ=this.input.exploring?(this.overview?-47:this.player.z):0;
    this.sun.target.position.set(focusX,0,focusZ);
    this.sun.position.set(focusX-14,22,focusZ-12);
    const shadowRange=this.input.exploring?(this.overview?92:16):9;
    this.sun.shadow.camera.left=this.sun.shadow.camera.bottom=-shadowRange;
    this.sun.shadow.camera.right=this.sun.shadow.camera.top=shadowRange;
    this.sun.shadow.camera.far=100;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.visits.update(game, now, this.motion);
    const visits = [
      ...this.visits.leaving,
      ...(this.visits.active ? [this.visits.active] : []),
    ];
    const alive = new Set(visits.map((v) => v.order.id));
    this.actors.forEach((actor, id) => {
      if (!alive.has(id)) {
        this.scene.remove(actor.person.root);
        this.workshop.releaseSkeletons(actor.person.root);
        this.actors.delete(id);
      }
    });
    for (const visit of visits) {
      const actor = this.actor(visit),
        state = visitPose(visit, now, this.motion);
      actor.person.root.position.set(state.x, state.y, state.z);
      actor.person.root.rotation.y = state.rotation;
      pose(
        actor.person,
        now / 1000,
        state.walking,
        state.gesture,
        state.sitting,
        this.motion,
      );
      actor.cup.root.visible = state.cup;
      if (state.cup) actor.cup.update({ ...visit.drink, sealed: true });
    }
    let dx = 0,
      dz = 0;
    if (screen === "shop" && !this.input.paused) {
      const forward =
        Number(this.keys.has("w") || this.keys.has("arrowup")) -
        Number(this.keys.has("s") || this.keys.has("arrowdown"));
      const side =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      if (forward || side || this.stick.x || this.stick.y) {
        const walkingSpeed=this.input.exploring?(game.city.energy<8?1.6:rainy?2.5:2.9):2.3;
        const delta=movementVector(this.stick.x||this.stick.y?this.stick:{x:side,y:-forward},this.yaw,walkingSpeed,dt);
        dx=delta.x;dz=delta.z;
      } else if (this.path.length) {
        const next = this.path[0],
          distance = Math.hypot(next.x - this.player.x, next.z - this.player.z);
        if (distance < 0.06) {
          this.path.shift();
          if (!this.path.length && !this.overview) {
            if(!this.input.exploring)this.yaw = 0;
            this.pitch = -0.18;
          }
        } else {
          const speed = this.input.exploring ? (game.city.energy < 8 ? 1.6 : rainy ? 2.5 : 2.9) : 2.4;
          const step = Math.min(distance, dt * speed);
          dx = ((next.x - this.player.x) / distance) * step;
          dz = ((next.z - this.player.z) / distance) * step;
          if (!this.overview && !this.input.exploring) this.yaw = Math.atan2(-dx, -dz);
        }
      }
      const next=slideMove(this.player,{x:dx,z:dz},this.input.exploring,this.input.exploring?this.city.trafficBodies:[]);
      const wanted=Math.hypot(dx,dz),actual=Math.hypot(next.x-this.player.x,next.z-this.player.z);
      this.blockedTime=this.path.length&&wanted>.001&&actual<wanted*.2?this.blockedTime+dt:0;
      if(this.input.exploring&&this.blockedTime>.45){
        const destination=this.path.at(-1)!;
        const detour=routeAcross(next,destination,true,this.city.trafficBodies);
        if(detour.length)this.path=detour;
        this.blockedTime=0;
      }
      dx=next.x-this.player.x;dz=next.z-this.player.z;this.player=next;
    }
    if (
      ((dx || dz) && now - this.lastPosition > 80) ||
      this.lastPosition === 0
    ) {
      this.notify({ ...this.player });
      this.lastPosition = now;
    }
    // Publish the final snapped arrival as well as moving samples.
    if(this.path.length===1&&Math.hypot(this.path[0].x-this.player.x,this.path[0].z-this.player.z)<0.06){
      const goal=this.path[0],arrival=slideMove(this.player,{x:goal.x-this.player.x,z:goal.z-this.player.z},this.input.exploring,this.input.exploring?this.city.trafficBodies:[]);
      if(Math.hypot(arrival.x-goal.x,arrival.z-goal.z)<.001){this.player={...goal};this.path=[];this.notify({...this.player});this.lastPosition=now;}
    }
    this.avatar.root.position.set(this.player.x, 0, this.player.z);
    if(dx||dz){const angle=Math.atan2(dx,dz),difference=Math.atan2(Math.sin(angle-this.avatar.root.rotation.y),Math.cos(angle-this.avatar.root.rotation.y));this.avatar.root.rotation.y+=difference*(this.motion?1-Math.exp(-16*dt):1);}
    this.avatar.root.visible = this.input.exploring || this.overview;
    this.parcel.root.visible = !!game.city.contract?.packed;
    const errand=game.city.stories.missions.find(m=>m.status==='active'&&m.step>0);
    const item=errand?missionDefinition(errand.id).steps[errand.step-1].item:'';
    const kind=item?.includes('Sách')||item?.includes('sách')?'books':item?.includes('cây')?'plant':'bag';
    Object.entries(this.cargo).forEach(([id,root])=>root.visible=this.input.exploring&&!this.parcel.root.visible&&!!item&&id===kind);
    this.rod.visible=this.input.exploring&&nearCityPlace(this.player,'lake')&&game.city.life.attempts>0&&!this.parcel.root.visible&&!item;
    if(game.city.contract?.packed) this.parcel.cups.forEach((cup,i)=>{
      cup.root.visible=i<game.city.contract!.count;
      cup.update({size:'M',base:game.city.contract!.base,sugar:game.city.contract!.sugar,ice:50,topping:'none',fill:70,shake:70,sealed:true});
    });
    this.avatarPhase+=Math.hypot(dx,dz)*5.2;
    pose(this.avatar, now / 1000, !!(dx || dz), this.parcel.root.visible||item?0.45:0, false, this.motion,this.avatarPhase);
    const mode = `${screen}:${this.input.exploring}:${this.overview}`;
    if(mode!==this.cameraMode) this.cameraFocus.set(this.player.x,0,this.player.z);
    this.cameraMode=mode;
    if (screen !== "shop") {
      const camera: Record<Exclude<Screen, "shop">, number[]> = {
        stock: [2.3, 2.25, 1.45, 4.35, 1.3, 2.8],
        upgrades: [0, 2.7, 2.7, 0, 1.6, 4.3],
        reviews: [-2.3, 2.45, 2.1, -3.65, 2.5, 4.65],
        goals: [-1.5, 2.7, 1.9, -3.6, 2.65, 4.5],
      };
      const p = camera[screen];
      this.camera.position.set(p[0], p[1], p[2]);
      this.camera.lookAt(p[3], p[4], p[5]);
    } else if (this.overview && this.input.exploring) {
      this.camera.position.set(Math.sin(this.yaw - 0.7) * 106, 74, -45 + Math.cos(this.yaw - 0.7) * 106);
      this.camera.lookAt(0, 0, -47);
    } else if (this.input.exploring) {
      this.cameraFocus.lerp(this.target.set(this.player.x,0,this.player.z),this.motion?1-Math.exp(-12*dt):1);
      const elevation=T.MathUtils.clamp(0.48-this.pitch*0.6,0.28,0.85);
      const distance=7.2*Math.cos(elevation);
      // Raise the camera inside the shop; foreground structures are cut away
      // below when they intersect the player's sightline.
      let height=this.player.z>-5.3?8.5:1.05+7.2*Math.sin(elevation);
      this.camera.position.set(this.cameraFocus.x+Math.sin(this.yaw)*distance,height,this.cameraFocus.z+Math.cos(this.yaw)*distance);
      // Raise the follow camera out of building footprints instead of clipping
      // into a wall. Gameplay collision and camera collision are independent.
      for(const block of CITY_BLOCKS){
        if(Math.abs(this.camera.position.x-block.x)<block.width/2+0.5&&Math.abs(this.camera.position.z-block.z)<block.depth/2+0.5){
          const rise=block.z<-37?14:block.z<-30?8:4.5;
          height=Math.max(height,rise);
        }
      }
      this.followHeight+= (height-this.followHeight)*(this.motion?1-Math.exp(-10*dt):1);
      this.camera.position.y=this.followHeight;
      this.camera.lookAt(this.cameraFocus.x,0.8,this.cameraFocus.z);
    } else if (this.overview) {
      this.camera.position.set(
        Math.sin(this.yaw - 2.45) * 11,
        8,
        Math.cos(this.yaw - 2.45) * 11,
      );
      this.camera.lookAt(0, 0.7, 0.4);
    } else {
      this.camera.position.set(this.player.x, 1.88, this.player.z);
      this.target.set(
        this.player.x - Math.sin(this.yaw) * 5,
        1.88 + Math.sin(this.pitch) * 5,
        this.player.z - Math.cos(this.yaw) * 5,
      );
      this.camera.lookAt(this.target);
    }
    // Cut away only shop structures between the follow camera and the avatar.
    // Their independent batches leave every other pink wall and sign intact.
    this.target.set(this.player.x,1.1,this.player.z);
    this.ray.ray.set(this.target,this.hit.copy(this.camera.position).sub(this.target).normalize());
    const cameraDistance=this.camera.position.distanceTo(this.target);
    for(const part of this.shop.cutaways){
      const obstruction=this.ray.ray.intersectBox(part.bounds,this.hit);
      part.root.visible=!(this.input.exploring&&!this.overview&&obstruction&&this.target.distanceTo(obstruction)<cameraDistance);
    }
    this.held.root.visible = carrying && screen === "shop" && !this.overview;
    this.playerHand.visible = this.held.root.visible;
    this.draft.root.visible = game.phase === "open" && !carrying;
    this.held.update(game.draft);
    this.draft.update(game.draft);
    this.shop.shaker.rotation.z =
      this.motion && this.input.station === 2 && game.draft.shake > 0
        ? Math.sin(now * 0.007) * 0.025
        : 0;
    this.shop.decor.children.forEach((object) => {
      const index = game.equippedDecorations.indexOf(
        object.name as GameState["equippedDecorations"][number],
      );
      object.visible = index >= 0;
      object.position.x = 2.35 + Math.max(0, index) * 0.7;
    });
    this.shop.jars.forEach((jar, i) => {
      const height = Math.min(
        0.4,
        Math.max(0.015, (game.inventory[this.shop.jarKeys[i]] / 40) * 0.4),
      );
      jar.scale.y = height;
      jar.position.y = jar.userData.baseY + height / 2;
    });
    this.shop.indicators.forEach((group, i) =>
      group.children.forEach((pip, j) => {
        pip.visible =
          j < game.upgrades[(["brewer", "shaker", "sealer"] as const)[i]];
      }),
    );
    this.camera.far=this.overview?300:this.qualityController.profile.distance;
    const fog=this.scene.fog as T.Fog;fog.near=this.overview?135:this.camera.far*.68;fog.far=this.overview?290:this.camera.far*.98;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    this.submissions+=this.renderer.info.calls;this.submittedTriangles+=this.renderer.info.triangles;
    const cpu=performance.now()-renderStart;
    this.renderMs=this.renderMs?this.renderMs*.95+cpu*.05:cpu;
    this.frameMs=this.frameMs?this.frameMs*.95+frameInterval*.05:frameInterval;
    if(this.qualityController.sample(frameInterval,cpu)){
      const profile=this.qualityController.profile;
      this.renderer.quality(profile);this.sun.shadow.mapSize.set(profile.shadowSize,profile.shadowSize);
      this.sun.shadow.map?.dispose();this.sun.shadow.map=null;
    }
    if(++this.renderSamples%15===0){
      this.canvas.dataset.drawCalls=String(Math.round(this.submissions/15));
      this.canvas.dataset.triangles=String(Math.round(this.submittedTriangles/15));
      this.canvas.dataset.quality=this.qualityController.profile.id;
      this.canvas.dataset.cpuMs=this.renderMs.toFixed(1);
      this.canvas.dataset.frameMs=this.frameMs.toFixed(1);
      this.submissions=this.submittedTriangles=0;
    }
    this.canvas.dataset.playerX = this.player.x.toFixed(2);
    this.canvas.dataset.playerZ = this.player.z.toFixed(2);
  };
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.size.disconnect();
    this.intersection.disconnect();
    this.preferences.disconnect();
    this.removeListeners.forEach((fn) => fn());
    this.scene.traverse((object) => {
      if (object instanceof T.InstancedMesh) object.dispose();
    });
    this.city.dispose();
    this.workshop.dispose();
    this.scene.clear();
    this.actors.clear();
    this.renderer.dispose();
    this.canvas.remove();
  }
}

const portraits = new Map<string, string>();
let portraitRenderer: T.WebGLRenderer | null = null;
let portraitCleanup: ReturnType<typeof setTimeout> | null = null;
export function portrait(customerId: string) {
  if (portraits.has(customerId)) return portraits.get(customerId)!;
  const w = new Workshop();
  if (portraitCleanup) clearTimeout(portraitCleanup);
  const renderer =
    portraitRenderer ?? new T.WebGLRenderer({ antialias: true, alpha: true });
  portraitRenderer = renderer;
  renderer.setSize(192, 224);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(28, 192 / 224, 0.1, 10);
  const person = makePerson(w, getCustomer(customerId));
  person.root.rotation.y = -0.12;
  scene.add(person.root);
  scene.add(new T.HemisphereLight("#fff2d9", "#93a591", 3));
  const light = new T.DirectionalLight("#fff1da", 2.5);
  light.position.set(-2, 4, 3);
  scene.add(light);
  camera.position.set(0.25, 1.69, 2.65);
  camera.lookAt(0, 1.53, 0);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/webp");
  portraits.set(customerId, url);
  w.dispose();
  scene.clear();
  portraitCleanup = setTimeout(() => {
    portraitRenderer?.dispose();
    portraitRenderer?.forceContextLoss();
    portraitRenderer = null;
    portraitCleanup = null;
  }, 50);
  return url;
}
