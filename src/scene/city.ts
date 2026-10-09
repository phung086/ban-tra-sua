import * as T from 'three';
import { Workshop, makePerson, pose, type Person } from './models';
import { mergeRigid } from './batching';
import { CUSTOMERS } from '../game/content';
import { CITY_PLACES } from '../game/cityMap';
import { cityWeather } from '../game/city';
import type { GameState } from '../game/types';
import { livedInHouse, streetFurniture } from './cityDetails';
import {RESIDENTS,missionFor,type ResidentId} from '../game/neighborhoodStories';
import {urbanExpansion,detailedTree,texturedGround} from './urbanExpansion';
import {contactShadow,lakeSurface} from './worldAtmosphere';
import {advanceTraffic,vehicleFootprint,type Footprint} from '../game/collision';

function tree(w:Workshop,root:T.Group,x:number,z:number,size=1){return detailedTree(w,root,x,z,size);}
function house(w: Workshop, root: T.Group, x: number, z: number, width: number, floors: number, color: string, name?: string) {
  const group = new T.Group(); group.position.set(x, 0, z); root.add(group);
  w.box(group, color, [0, floors * 1.45, 0], [width, floors * 2.9, 5]);
  w.box(group, '#978779', [0, floors * 2.9 + 0.13, 0], [width + 0.3, 0.25, 5.3]);
  w.box(group, '#807a6b', [0, 1.15, 2.54], [width * 0.8, 2.2, 0.12]);
  for (let y = 0; y < 10; y++) w.box(group, '#c0baad', [0, 0.22 + y * 0.2, 2.62], [width * 0.8, 0.045, 0.05]);
  for (let floor = 1; floor < floors; floor++) {
    for (const side of [-1, 1]) {
      const glass=w.box(group, '#667b7e', [side * width * 0.22, floor * 2.9 + 1.4, 2.55], [width * 0.3, 1.45, 0.1],.22);
      (glass.material as T.MeshStandardMaterial).roughness=.24;
      w.box(group, '#e5e1d4', [side * width * 0.22, floor * 2.9 + 1.4, 2.61], [0.05, 1.48, 0.04]);
    }
    w.box(group, '#c3b5a5', [0, floor * 2.9 + 0.05, 2.95], [width, 0.15, 1]);
    w.line(group, '#72796f', [[-width / 2, floor * 2.9 + 0.95, 3.4], [width / 2, floor * 2.9 + 0.95, 3.4]], 0.035);
    for (let j = 0; j < 9; j++) w.cylinder(group, '#72796f', [(j / 8 - 0.5) * width, floor * 2.9 + 0.5, 3.4], 0.02, 0.9);
    w.box(group, '#e1ddd3', [width * 0.36, floor * 2.9 + 0.5, 2.7], [0.65, 0.43, 0.35]);
    w.cylinder(group, '#a16e57', [-width * 0.3, floor * 2.9 + 0.3, 3], 0.18, 0.3);
    w.ball(group, '#69805a', [-width * 0.3, floor * 2.9 + 0.6, 3], [0.32, 0.4, 0.25]);
  }
  w.cylinder(group, '#bfc5c5', [0.6, floors * 2.9 + 0.75, 0], 0.65, 1.1, 0.7);
  if (name) w.label(group, name, [0, 2.55, 2.68], width * 0.9, 0.62, '#796052', '#fff5e6', 62);
  livedInHouse(w, group, width, floors, color, Math.abs(Math.round(x+z)));
  return group;
}
function scooter(w: Workshop, color: string, rider = true) {
  const group = new T.Group();
  for (const z of [-0.65, 0.65]) {
    const wheel = w.mesh(group, w.geometry('city-wheel', () => new T.TorusGeometry(0.28, 0.07, 8, 16)), '#3c3e3c', [0, 0.32, z]);
    wheel.rotation.y = Math.PI / 2;
    w.cylinder(group, '#b2b9b9', [0, 0.32, z], 0.17, 0.09, 0.65).rotation.z = Math.PI / 2;
  }
  w.box(group, color, [0, 0.6, 0], [0.42, 0.48, 1]);
  w.box(group, '#46433f', [0, 0.87, -0.23], [0.38, 0.12, 0.72]);
  w.box(group, color, [0, 0.91, 0.55], [0.44, 0.7, 0.15]);
  w.line(group, '#747f7b', [[-0.3, 1.25, 0.6], [0.3, 1.25, 0.6]], 0.035);
  w.box(group, '#eee4b5', [0, 1.15, 0.64], [0.22, 0.12, 0.03]);
  for(const side of [-1,1]) {
    w.line(group,'#9baaa4',[[side*0.22,1.25,0.55],[side*0.32,1.43,0.54]],0.012);
    w.ball(group,'#b9c8c5',[side*0.32,1.46,0.54],[0.07,0.045,0.018]);
    w.box(group,'#bd8f50',[side*0.18,1.12,0.64],[0.07,0.035,0.025]);
  }
  w.box(group,'#b45546',[0,0.72,-0.54],[0.14,0.06,0.025]);
  if (rider) {
    w.capsule(group, '#68798e', [0, 1.35, -0.1], [0.22, 0.24, 0.18]);
    w.ball(group, '#d3a381', [0, 1.84, -0.06], [0.16, 0.21, 0.16]);
    w.ball(group, '#eeeadc', [0, 1.99, -0.06], [0.19, 0.13, 0.19]);
    for (const side of [-1, 1]) {
      w.line(group, '#68798e', [[side * 0.22, 1.52, -0.1], [side * 0.28, 1.25, 0.55]], 0.08);
      w.line(group, '#4b505b', [[side * 0.2, 1.02, -0.3], [side * 0.25, 0.72, 0.15], [side * 0.25, 0.4, 0.1]], 0.1);
    }
  }
  return group;
}
export class CityWorld {
  root = new T.Group(); traffic: T.Group[] = []; residents: Person[] = [];
  readonly staticMergeSector=32; // light-overview batching experiment; baseline CI substitutes 16
  lamps = new T.Group(); projects = new Map<string, T.Group>();
  storyProps=new Map<string,T.Group>();
  neighbors=new Map<ResidentId,{person:Person;marker:T.Group;label:T.Mesh}>();
  rain: T.Points; clock = 0;
  ripples:T.Group;
  get trafficBodies():Footprint[]{return this.traffic.map((vehicle,i)=>vehicleFootprint(i,vehicle.position.x,vehicle.position.z));}
  constructor(public w: Workshop) {
    const root = this.root;
    streetFurniture(w,root);
    urbanExpansion(w,root,house);
    w.box(root, '#c3baa5', [0, -0.26, -24], [190, 0.15, 135]).castShadow=false;
    w.box(root, '#646d6b', [0, -0.15, -24], [80, 0.08, 7]).castShadow=false;
    for (const x of [-15, 15]) w.box(root, '#646d6b', [x, -0.15, -26], [6, 0.08, 44]).castShadow=false;
    w.box(root, '#91918a', [0, -0.14, -7], [78, 0.06, 3]);
    texturedGround(w,root,'asphalt','#505859',0,-24,80,7,-.097);
    for(const x of [-15,15])texturedGround(w,root,'asphalt','#505859',x,-26,6,44,-.097);
    for(const z of [-19.9,-28.1])texturedGround(w,root,'paving','#c2b7a1',0,z,78,1.1,-.02);
    for (let i = -7; i <= 7; i++) {
      w.box(root, '#e7dfc0', [i * 5, -0.1, -24], [2.8, 0.01, 0.1]);
      for (const z of [-19.9, -28.1]) w.box(root, '#cfc4b4', [i * 5, -0.08, z], [4.98, 0.11, 1.1]).material=w.surface('paving','#cfc4b4');
    }
    for (const x of [-15, 15]) for (let i = 0; i < 9; i++) w.box(root, '#f0eadb', [x + (i - 4) * 0.5, -0.09, -21.4], [0.24, 0.025, 2.2]);
    // Narrow Vietnamese tube houses border the walkable neighborhood.
    for (let i = 0; i < 8; i++) for (const side of [-1, 1]) {
      const h = house(w, root, side * 41, -6 - i * 5.1, 4.8, 3 + i % 3, ['#c9bd9f', '#c5cfbf', '#dab6a2', '#bdc8ce'][i % 4], i === 0 ? 'BÚN CHẢ • TRÀ ĐÁ' : undefined);
      h.rotation.y = -side * Math.PI / 2;
    }
    for (let i = 0; i < 7; i++) house(w, root, -18 + i * 6, -51, 5.8, 3 + i % 4, ['#c3c3b5', '#e0c8b0', '#b9c6bc'][i % 3]);
    // Market: covered stalls, produce trays, baskets and a corrugated roof.
    w.box(root, '#d5c5ad', [-26, 1.5, -17], [12, 3, 6]).material=w.surface('plaster','#d5c5ad');
    w.box(root, '#7c8b7b', [-26, 3.16, -16], [12.7, 0.12, 9.5]);
    w.label(root, 'CHỢ NGỌC HÀ', [-26, 2.95, -10.42], 7, 0.75, '#935c4b', '#fff1d5', 66);
    for (let i = 0; i < 4; i++) {
      const x = -30.5 + i * 3;
      w.box(root, '#9c7c59', [x, 0.65, -11.4], [2.4, 1.2, 1.3]);
      w.cylinder(root, '#6e6b58', [x, 1.65, -12.2], 0.045, 3.3);
      w.box(root, i % 2 ? '#c68864' : '#8c9f82', [x, 2.6, -11.3], [2.9, 0.12, 2.4]).rotation.x = 0.18;
      for (let j = 0; j < 8; j++) w.ball(root, ['#ddab4d', '#719152', '#ba6a48'][i % 3], [x - 0.8 + j % 4 * 0.5, 1.32 + Math.floor(j / 4) * 0.08, -11.5 + Math.floor(j / 4) * 0.35], [0.2, 0.15, 0.16]);
      w.label(root, ['TRÀ • SỮA', 'RAU SẠCH', 'HOA QUẢ', 'BAO BÌ'][i], [x, 0.85, -10.72], 1.6, 0.4, '#f4e8cf', '#674e3b', 78);
    }
    // Primary school with courtyard and gate.
    house(w, root, 26, -18, 11.5, 2, '#e4cca3');
    for (const x of [20.2, 31.8]) w.box(root, '#cdb898', [x, 1.6, -11.3], [0.55, 3.2, 0.6]);
    w.box(root, '#be9b7e', [26, 3.3, -11.3], [12, 0.6, 0.55]);
    w.label(root, 'TRƯỜNG AN HÒA', [26, 3.3, -10.99], 9, 0.48, '#a45646', '#fff4db', 68);
    // Neighborhood collective housing, with the familiar external stairwell.
    house(w, root, 0, -41, 16.5, 4, '#c4b79e', 'KHU TẬP THỂ AN HÒA');
    for (let floor = 0; floor < 4; floor++) {
      const z = -38.8;
      w.box(root, '#9b9587', [6.2, floor * 2.9 + 1.5, z + 0.4], [2.5, 0.14, 2.5]).rotation.z = 0.7;
      w.line(root, '#666f64', [[5, floor * 2.9 + 2.4, z + 1.5], [7.3, floor * 2.9 + 3.8, z + 1.5]], 0.035);
    }
    for (let i = 0; i < 5; i++) w.box(root, ['#b27b82', '#d4cbb2', '#a4bfc0'][i % 3], [-4 + i * 1.2, 4, -37.7], [0.7, 0.9, 0.03]);
    const books = house(w, root, -26, -36, 11.5, 2, '#cebba9', 'HIỆU SÁCH BÊN PHỐ');
    for (let shelf = 0; shelf < 3; shelf++) for (let j = 0; j < 14; j++) w.box(books, ['#9b6974', '#668889', '#b49661'][j % 3], [-4 + j * 0.6, 0.45 + shelf * 0.65, 2.7], [0.38, 0.52, 0.3]);
    // A lake, embankment and a continuous promenade.
    w.box(root, '#c0b8a0', [26, -0.09, -35.5], [14, 0.2, 13]);
    const water = w.box(root, '#619eaf', [26, -0.02, -35.5], [12.5, 0.08, 11.5]);
    (water.material as T.MeshStandardMaterial).roughness = 0.2;
    this.ripples=lakeSurface(w,root);
    for (const x of [19.1, 32.9]) w.box(root, '#8c9b85', [x, 0.42, -35.5], [0.25, 0.9, 13]);
    w.box(root, '#8c9b85', [26, 0.42, -29], [14, 0.9, 0.25]);
    w.label(root, 'HỒ AN HÒA', [25, 1.25, -28.8], 3, 0.6, '#687a68', '#fff3d7', 80);
    for (const x of [21, 29]) {
      w.box(root, '#9a7859', [x, 0.45, -27.7], [2.6, 0.14, 0.55]);
      w.box(root, '#9a7859', [x, 0.92, -28], [2.6, 0.5, 0.08]);
      for (const dx of [-0.95, 0.95]) w.box(root, '#5e6b60', [x + dx, 0.2, -27.7], [0.07, 0.4, 0.5]);
    }
    // Garden sits in the middle of the residential quarter, across the boulevard.
    w.box(root, '#85916c', [-5, -0.04, -31], [14, 0.1, 5.2]);
    w.box(root, '#c6b9a4', [-5, 0, -29.1], [14, 0.08, 1.2]);
    for (let i = 0; i < 12; i++) w.ball(root, ['#c490a5', '#d4b77a', '#819869'][i % 3], [-11 + i, 0.2, -31.2], [0.38, 0.24, 0.32]);
    w.label(root, 'VƯỜN HOA TỔ DÂN PHỐ', [-6, 1.4, -29.2], 5, 0.65, '#6b7c5e', '#fff0d6', 65);
    for(const x of [-8,-4]) w.cylinder(root,'#6b7659',[x,0.65,-29.22],0.045,1.3);
    for (let i = 0; i < 9; i++) for (const side of [-1, 1]) tree(w, root, side * 10.7, -16 - i * 3.1, 0.75 + i % 3 * 0.08);
    for (const x of [-34.5, 34.5]) for (let i = 0; i < 5; i++) tree(w, root, x, -7 - i * 7, 0.9);
    // Electricity poles, sagging utility wires, tactile curb and street lamps.
    for (const x of [-17.8, 17.8]) {
      for (let i = 0; i < 4; i++) {
        const z = -8 - i * 10;
        w.cylinder(root, '#8c8c7a', [x, 3.3, z], 0.1, 6.6);
        w.box(root, '#5d6b64', [x, 6.25, z], [1.3, 0.1, 0.12]);
        w.line(root, '#777869', [[x, 5.8, z], [x + 0.8, 6, z], [x + 1.3, 5.9, z]], 0.05);
        w.box(this.lamps, '#f9e7ad', [x + 1.3, 5.88, z], [0.44, 0.055, 0.22]);
        if (i < 3) for (let wire = 0; wire < 3; wire++) w.line(root, '#535c55', [[x + wire * 0.3, 6.4, z], [x + wire * 0.3, 5.7, z - 5], [x + wire * 0.3, 6.4, z - 10]], 0.012);
      }
    }
    root.add(this.lamps);
    w.box(root, '#597d71', [-16.7, 2.5, -23], [0.11, 0.16, 3]);
    w.box(root, '#c1c9bd', [-17.5, 1.25, -23], [0.1, 2.5, 3.1]);
    w.label(root, 'XE BUÝT 09\nAN HÒA • PHỐ NHỎ', [-17.42, 1.7, -23], 2, 0.7, '#497267', '#fff4df', 58).rotation.y = Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const bike = scooter(w, ['#997d83', '#62888c', '#b6ad8e'][i % 3]); this.traffic.push(bike); root.add(bike);
    }
    const bus = new T.Group(); root.add(bus); this.traffic.push(bus);
    w.box(bus, '#e6ddbc', [0, 1.3, 0], [1.8, 2.25, 5.6]);
    w.box(bus, '#927251', [0, 0.95, 0], [1.84, 0.55, 5.65]);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) w.box(bus, '#628289', [side * 0.92, 1.82, -2 + i], [0.02, 0.76, 0.78]);
      for (const z of [-1.8, 1.8]) w.cylinder(bus, '#3d4340', [side * 0.87, 0.4, z], 0.36, 0.15).rotation.z = Math.PI / 2;
    }
    w.box(bus, '#628289', [0, 1.72, 2.82], [1.55, 1.1, 0.04]);
    w.label(bus, '09 • AN HÒA', [0, 2.25, 2.86], 1.3, 0.26, '#423e38', '#fff0b8', 80);
    // Neighborhood residents have their own routes, distinct from serving customers.
    for (let i = 0; i < 10; i++) {
      const person = makePerson(w, CUSTOMERS[i%CUSTOMERS.length]); this.residents.push(person); root.add(person.root);
      contactShadow(w,person.root,.5);
    }
    for(const npc of RESIDENTS){
      const customer=CUSTOMERS.find(c=>c.id===npc.customerId)!;
      const person=makePerson(w,customer),p=CITY_PLACES[npc.place];
      contactShadow(w,person.root,.5);
      person.root.position.set(p.x+0.6,0,p.z-0.65);person.root.userData.resident=npc.id;root.add(person.root);
      const marker=new T.Group();marker.position.set(p.x+0.6,0.03,p.z-0.65);root.add(marker);
      const ring=w.mesh(marker,w.geometry('npc-ring',()=>new T.TorusGeometry(0.5,0.025,6,28)),'#b56c92',[0,0,0]);ring.rotation.x=Math.PI/2;
      const label=w.label(marker,npc.name,[0,2.6,0],1.5,0.35,'#fff1f8','#874765',76);
      this.neighbors.set(npc.id,{person,marker,label});
    }
    const extraTrees = new T.Group(); tree(w, extraTrees, -3.5, -6.3, 0.7); tree(w, extraTrees, 5.7, -6.3, 0.7); root.add(extraTrees); this.projects.set('trees', extraTrees);
    const neighborTree=new T.Group();tree(w,neighborTree,-5,-29.7,0.48);root.add(neighborTree);this.storyProps.set('binh-plants',neighborTree);
    const donatedBooks=new T.Group();
    for(let i=0;i<7;i++){w.box(donatedBooks,['#8d9890','#aa7e89','#b7a382'][i%3],[-24,0.65+i*0.065,-29.5],[0.6,0.06,0.4]);w.box(donatedBooks,'#eae5d6',[-24,0.65+i*0.065,-29.29],[0.55,0.04,0.016]);}
    root.add(donatedBooks);this.storyProps.set('thu-books',donatedBooks);
    const club = new T.Group(); w.label(club, 'CLB TRÀ PHỐ NHỎ\nGẶP NHAU MỖI CHIỀU', [-6, 2.2, -30], 4, 0.85, '#a36885', '#fff3f8', 65); root.add(club); this.projects.set('club', club);
    const positions = new Float32Array(480 * 3);
    for (let i = 0; i < 480; i++) { positions[i * 3] = (i * 13.73 % 74) - 37; positions[i * 3 + 1] = i * 0.27 % 12; positions[i * 3 + 2] = -(i * 7.31 % 50); }
    const geometry = w.geometry('city-rain', () => new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(positions, 3)));
    const material = new T.PointsMaterial({ color: '#c1d5dc', size: 0.055, transparent: true, opacity: 0.65 });
    this.rain = new T.Points(geometry, material); root.add(this.rain);
    const register=(key:string,factory:()=>T.BufferGeometry)=>w.geometry(key,factory);
    this.traffic.forEach((vehicle,i)=>mergeRigid(vehicle,[],register,`traffic:${i}`));
    // Keep the near-shop and adjacent storefronts in smaller culling cells
    // when distant streets use sector 32. Extending the near radius from 35
    // to 48 reduced follow triangles but raised balanced overview calls; M1.1u
    // retunes to 42 pending fresh matched production benchmark.
    // The sector-16 baseline remains unchanged.
    const nearShop=this.staticMergeSector>16?{x:0,z:-7,radius:42,sectorSize:16}:undefined;
    mergeRigid(root, [...this.traffic, ...this.residents.map(p => p.root), ...[...this.neighbors.values()].flatMap(n=>[n.person.root,n.marker]), this.lamps, ...this.projects.values(),...this.storyProps.values(),this.ripples],register,'city-static',this.staticMergeSector,nearShop);
  }
  update(game: GameState, dt: number, motion: boolean, player: {x: number; z: number}) {
    if (motion) this.clock += dt;
    const time = this.clock;
    this.ripples.children.forEach((r,i)=>{const pulse=1+Math.sin(time*.6+i)*.12;r.scale.set(1.1*pulse,.48*pulse,1);});
    this.traffic.forEach((vehicle, i) => {
      const direction = i % 2 ? -1 : 1;
      const last = vehicle.userData.roadProgress ?? i*15%76;
      vehicle.userData.roadProgress=advanceTraffic(i,last,dt,motion,player);
      const x=(vehicle.userData.roadProgress-38)*direction;
      vehicle.position.set(x, 0, i % 2 ? -25.7 : -22.5); vehicle.rotation.y = direction * Math.PI / 2;
    });
    this.residents.forEach((person, i) => {
      if (i < 4) {
        const phase = (time * 0.7 + i * 11) % 56;
        const x = phase < 28 ? -14 + phase : 42 - phase;
        person.root.position.set(x, 0, i % 2 ? -28.2 : -19.6);
        person.root.rotation.y = phase < 28 ? Math.PI / 2 : -Math.PI / 2;
        pose(person, time + i, true, 0, false, motion);
      } else {
        const destinations=['oldtown','plaza','riverside'] as const,p=CITY_PLACES[destinations[(i-4)%3]];
        const phase=time*.18+i,dx=Math.sin(phase)*2.1,dz=Math.cos(phase)*1.3;
        person.root.position.set(p.x+dx,0,p.z+dz);person.root.rotation.y=Math.atan2(Math.cos(phase)*2.1,-Math.sin(phase)*1.3);
        pose(person,time+i,true,0,false,motion);
      }
    });
    this.neighbors.forEach(({person,marker,label},id)=>{
      const distance=Math.hypot(player.x-person.root.position.x,player.z-person.root.position.z);
      if(distance<4)person.root.rotation.y=Math.atan2(player.x-person.root.position.x,player.z-person.root.position.z);
      pose(person,time,false,distance<3?0.35:0,false,motion);
      marker.visible=distance<13;
      const status=missionFor(game.city.stories,id)?.status;
      marker.scale.setScalar(status==='ready'?1.08:1);
      label.rotation.y=person.root.rotation.y;
    });
    this.projects.forEach((group, id) => { group.visible = game.city.projects.includes(id as 'trees' | 'club'); });
    this.storyProps.forEach((group,id)=>group.visible=game.city.stories.missions.some(m=>m.id===id&&m.status!=='active'));
    const night = game.city.minutes >= 1080;
    (this.w.material('#f9e7ad')).emissive.set(night ? '#ffe0a3' : '#000000');
    this.rain.visible = cityWeather(game.day).rain;
    if (this.rain.visible && motion) {
      const positions = this.rain.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) positions.setY(i, (positions.getY(i) - dt * 7 + 12) % 12);
      positions.needsUpdate = true;
    }
  }
  dispose() { (this.rain.material as T.Material).dispose(); }
}
