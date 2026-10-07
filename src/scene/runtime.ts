import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
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

type Input = {
  game: GameState;
  screen: Screen;
  carrying: boolean;
  station: number;
};
type Actor = { person: Person; cup: ReturnType<typeof makeCup> };
export class StreetRuntime {
  renderer: T.WebGLRenderer;
  environment: T.WebGLRenderTarget;
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(65, 1, 0.08, 60);
  workshop = new Workshop();
  shop = buildShop(this.workshop);
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
  path: Position[] = [];
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
  ray = new T.Raycaster();
  pointer = new T.Vector2();
  plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  hit = new T.Vector3();
  constructor(
    container: HTMLElement,
    input: Input,
    notify: (position: Position) => void,
    onLost: () => void,
  ) {
    this.input = input;
    this.notify = notify;
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "default",
    });
    const pmrem = new T.PMREMGenerator(this.renderer),
      room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environmentIntensity = 0.55;
    this.canvas = this.renderer.domElement;
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute(
      "aria-label",
      "Không gian tiệm 3D. WASD hoặc phím mũi tên để đi; kéo để nhìn. Có thể dùng các nút địa điểm bên dưới.",
    );
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio,
        matchMedia("(max-width: 700px)").matches ? 1.25 : 1.75,
      ),
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.background = new T.Color("#f0dae4");
    this.scene.fog = new T.Fog("#f0dae4", 20, 42);
    this.scene.add(this.shop.root);
    this.scene.add(new T.HemisphereLight("#fff1ed", "#bc91aa", 1.7));
    const sun = new T.DirectionalLight("#fff2ec", 2.5);
    sun.position.set(-4, 9, -5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(
      matchMedia("(max-width: 700px)").matches ? 512 : 1024,
      matchMedia("(max-width: 700px)").matches ? 512 : 1024,
    );
    sun.shadow.camera.left = sun.shadow.camera.bottom = -9;
    sun.shadow.camera.right = sun.shadow.camera.top = 9;
    sun.shadow.normalBias = 0.025;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);
    const indoor = new T.DirectionalLight("#e0eadf", 1.1);
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
        this.renderer.setSize(width, height, false);
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
      this.resume();
    });
    this.listen(window, "blur", () => this.keys.clear());
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
    let drag: { x: number; y: number; startX: number; startY: number } | null =
      null;
    this.listen(this.canvas, "pointerdown", (event) => {
      const e = event as PointerEvent;
      drag = {
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
      };
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.focus({ preventScroll: true });
    });
    this.listen(this.canvas, "pointermove", (event) => {
      if (!drag) return;
      const e = event as PointerEvent;
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
      if (
        drag &&
        Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6 &&
        this.overview
      ) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        this.ray.setFromCamera(this.pointer, this.camera);
        if (
          this.ray.ray.intersectPlane(this.plane, this.hit) &&
          canWalk(this.hit)
        ) {
          const goal = { x: this.hit.x, z: this.hit.z };
          this.path = routeAcross(this.player, goal);
        }
      }
      drag = null;
    });
    this.listen(this.canvas, "pointercancel", () => {
      drag = null;
    });
    this.resume();
  }
  listen(target: EventTarget, type: string, fn: EventListener) {
    target.addEventListener(type, fn);
    this.removeListeners.push(() => target.removeEventListener(type, fn));
  }
  update(input: Input) {
    this.input = input;
  }
  go(place: Place) {
    this.keys.clear();
    this.path = routeTo(this.player, place);
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
    const dt = Math.min(0.05, (now - (this.previous || now)) / 1000);
    this.previous = now;
    this.lastDraw = now;
    const { game, screen, carrying } = this.input;
    this.visits.update(game, now, this.motion);
    const visits = [
      ...this.visits.leaving,
      ...(this.visits.active ? [this.visits.active] : []),
    ];
    const alive = new Set(visits.map((v) => v.order.id));
    this.actors.forEach((actor, id) => {
      if (!alive.has(id)) {
        this.scene.remove(actor.person.root);
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
    if (screen === "shop") {
      const forward =
        Number(this.keys.has("w") || this.keys.has("arrowup")) -
        Number(this.keys.has("s") || this.keys.has("arrowdown"));
      const side =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      if (forward || side) {
        const factor = (2.3 * dt) / Math.max(1, Math.hypot(forward, side));
        dx =
          (side * Math.cos(this.yaw) - forward * Math.sin(this.yaw)) * factor;
        dz =
          (-forward * Math.cos(this.yaw) - side * Math.sin(this.yaw)) * factor;
      } else if (this.path.length) {
        const next = this.path[0],
          distance = Math.hypot(next.x - this.player.x, next.z - this.player.z);
        if (distance < 0.06) {
          this.path.shift();
          if (!this.path.length && !this.overview) {
            this.yaw = 0;
            this.pitch = -0.18;
          }
        } else {
          const step = Math.min(distance, dt * 2.4);
          dx = ((next.x - this.player.x) / distance) * step;
          dz = ((next.z - this.player.z) / distance) * step;
          if (!this.overview) this.yaw = Math.atan2(-dx, -dz);
        }
      }
      if (canWalk({ x: this.player.x + dx, z: this.player.z }))
        this.player.x += dx;
      if (canWalk({ x: this.player.x, z: this.player.z + dz }))
        this.player.z += dz;
    }
    if (
      ((dx || dz) && now - this.lastPosition > 100) ||
      this.lastPosition === 0
    ) {
      this.notify({ ...this.player });
      this.lastPosition = now;
    }
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
    this.renderer.render(this.scene, this.camera);
    this.canvas.dataset.drawCalls = String(this.renderer.info.render.calls);
    this.canvas.dataset.triangles = String(this.renderer.info.render.triangles);
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
    this.environment.dispose();
    this.workshop.dispose();
    this.scene.clear();
    this.actors.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
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
