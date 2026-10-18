import * as T from 'three';
import type {Workshop} from './models';
import {texturedGround} from './urbanExpansion';

/** Street geometry and doors share the existing walkable footprint. */
export function hanoiFrontage(w:Workshop,root:T.Group){
  const facades:T.Group[]=[];
  const palette=['#d0bd91','#bec4ae','#d9c6a4','#c2b6a1','#b3bfad'];
  const names=['TẠP HÓA CÔ HẠNH','SỬA XE BÁC HÙNG','BÁNH MÌ HÀ NỘI','HIỆU TÓC LAN','GIẶT LÀ AN HÒA'];
  texturedGround(w,root,'paving','#a4a18e',0,-9.65,25,1.25,-.025);
  texturedGround(w,root,'asphalt','#6a7069',0,-8.48,35,1.1,-.166);
  for(let i=0;i<5;i++){
    const facade=new T.Group();facade.position.set((i-2)*4.6,0,-11.3);root.add(facade);
    facades.push(facade);
    const height=i===1?8.5:6.3,wall=palette[i],green='#344f45',wood='#685540';
    w.box(facade,wall,[0,height/2,0],[4.5,height,2]).material=w.surface('plaster',wall);
    w.box(facade,'#79766a',[0,.23,1.025],[4.5,.46,.08]);
    for(const x of [-2.12,2.12])w.box(facade,'#d9d1b6',[x,height/2,1.04],[.17,height,.10]);
    // Recessed interior makes doors read as openings instead of stickers.
    w.box(facade,'#26362e',[0,1.22,1.07],[3.25,2.38,.035]);
    for(const x of [-1.64,1.64])w.box(facade,wood,[x,1.25,1.14],[.10,2.5,.16]);
    if(i===1){
      w.box(facade,green,[.8,1.22,1.12],[1.52,2.35,.045]);
      for(let row=0;row<13;row++)w.box(facade,'#587465',[.8,.15+row*.175,1.16],[1.49,.018,.02]);
      const wheel=w.mesh(facade,w.geometry('repair-wheel',()=>new T.TorusGeometry(.38,.045,8,20)),'#333c35',[-.85,1.2,1.12]);
      w.label(facade,'VÁ SĂM · THAY DẦU',[-.7,.44,1.13],1.3,.24,'#c2b58c','#38453b',38);
      wheel.rotation.z=.2;
    }else if(i===0||i===2){
      for(let row=0;row<3;row++){
        w.box(facade,wood,[0,.46+row*.52,1.12],[3.05,.055,.25]);
        for(let j=0;j<8;j++){
          if(i===2)w.capsule(facade,'#b98b45',[-1.25+j*.35,.56+row*.52,1.18],[.07,.025,.14]).rotation.z=.28;
          else w.box(facade,['#99804e','#727a4e','#be9b68'][j%3],[-1.25+j*.35,.65+row*.52,1.12],[.17,.3,.12]);
        }
      }
    }else for(const side of [-1,1]){
      w.box(facade,wood,[side*.79,1.2,1.11],[1.48,2.35,.07]);
      w.box(facade,'#778e82',[side*.79,1.55,1.16],[1.25,1.29,.025],.15);
      w.box(facade,'#bab7a2',[side*1.3,1.2,1.22],[.025,.3,.035],.5);
    }
    w.box(facade,wood,[0,2.77,1.15],[3.65,.57,.10]);
    w.label(facade,names[i],[0,2.77,1.21],3.43,.39,'#685540','#f3e5bd',52);
    const canopy=w.box(facade,i===2?'#a78253':green,[0,2.36,1.44],[3.55,.055,.8]);canopy.rotation.x=.12;
    w.box(facade,'#d6cfb7',[0,3.23,1.18],[4.48,.13,.46]);
    for(let floor=1;floor<(i===1?3:2);floor++){
      const y=3.15*floor;
      for(const side of [-1,1]){
        w.box(facade,'#a49678',[side*.98,y+1.36,1.06],[1.32,1.77,.10]);
        w.box(facade,'#263c33',[side*.98,y+1.36,1.13],[1.14,1.58,.035]);
        for(const shutter of [-1,1]){
          const panel=new T.Group();facade.add(panel);panel.position.set(side*.98+shutter*.6,y+1.36,1.17);panel.rotation.y=shutter*.23;
          w.box(panel,green,[shutter*.24,0,0],[.49,1.59,.065]);
          for(let slat=0;slat<9;slat++)w.box(panel,'#52715d',[shutter*.24,-.65+slat*.16,.045],[.43,.025,.03]);
        }
      }
      w.box(facade,'#9a937c',[0,y+.3,1.44],[3.65,.12,.75]);
      for(let rail=0;rail<12;rail++)w.box(facade,green,[-1.75+rail*.32,y+.75,1.8],[.022,.78,.025]);
      w.box(facade,green,[0,y+1.13,1.8],[3.6,.035,.045]);
      w.cylinder(facade,'#986f48',[-1.43,y+.47,1.55],.12,.24);
      w.ball(facade,'#53734c',[-1.43,y+.74,1.55],[.26,.32,.2]);
    }
    for(const side of [-1,1]){
      const roof=w.box(facade,'#895e43',[0,height+.25,side*.56],[4.75,.12,1.5]);roof.rotation.x=side*.32;roof.material=w.surface('roof','#895e43');
    }
    w.box(facade,'#9d7551',[0,height+.49,0],[4.8,.09,.13]);
    w.cylinder(facade,'#707568',[2.03,height*.48,1.12],.028,height*.96);
    w.label(facade,`${21+i*2}`,[1.85,1.95,1.17],.20,.25,'#274f59','#edeada',36);
    w.line(facade,'#3d443b',[[-2.2,3.48,1.22],[0,3.33,1.34],[2.2,3.48,1.22]],.008);
  }
  // Continuous curbstones, not a wall across the player's route.
  for(let i=0;i<25;i++)w.box(root,'#aaa795',[-12+i,-.075,-9.0],[.985,.18,.14]);
  return facades;
}
