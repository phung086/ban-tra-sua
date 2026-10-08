import * as T from 'three';
import { Workshop, makeCup, type Person } from './models';

export function livedInHouse(w: Workshop, group: T.Group, width: number, floors: number, color: string, variation: number) {
  const base = group.children[0] as T.Mesh;
  base.material = w.surface('plaster', color);
  // Drainpipe, tiled plinth, shutter handle, electric meter and rooftop water tank fittings.
  w.cylinder(group, '#8d9187', [width/2-0.1, floors*1.4, 2.63], 0.055, floors*2.8);
  w.box(group, '#a7a291', [0, 0.16, 2.55], [width, 0.28, 0.15]);
  w.box(group, '#66665c', [width*0.25, 0.34, 2.68], [0.22, 0.045, 0.06],0.65);
  w.box(group, '#859185', [-width*0.4, 1.45, 2.67], [0.35, 0.47, 0.17]);
  w.box(group, '#536463', [-width*0.4, 1.48, 2.77], [0.19, 0.13, 0.025]);
  w.line(group, '#4e5852', [[-width*0.4,1.68,2.7],[-width*0.4,2.84,2.7],[-width/2,2.84,2.7]],0.012);
  w.cylinder(group, '#858d89', [0.6,floors*2.9+1.33,0],0.09,0.06,0.7);
  w.line(group, '#bec2b8', [[0.6,floors*2.9+0.3,0.64],[0.6,floors*2.9+0.3,1.2],[width/2-0.1,floors*2.9+0.3,1.2],[width/2-0.1,floors*2.9,2.6]],0.025);
  const canopy = ['#938669','#8b9b84','#ba8f86','#8b9699'][variation % 4];
  for (let i=0;i<8;i++) w.box(group,i%2?canopy:'#e9e0ce',[(i/7-0.5)*width*0.94,2.69,3.12],[width/8,0.055,1.05]).rotation.x=0.16;
  for (let floor=1;floor<floors;floor++) {
    const y=floor*2.9;
    // Split panes, lintel, privacy curtain, rain staining and ventilated AC front.
    for(const side of [-1,1]) {
      w.box(group,'#b8af9c',[side*width*0.22,y+2.2,2.66],[width*0.32,0.1,0.19]);
      w.box(group,'#adaba0',[side*width*0.22,y+1.38,2.68],[width*0.29,0.04,0.02]);
      if((floor+variation+side)%3===0) w.box(group,'#d1b6a8',[side*width*0.22-width*0.08,y+1.4,2.62],[width*0.13,1.4,0.035]);
    }
    for(let i=0;i<5;i++) w.box(group,'#9b9f91',[width*0.36-0.23+i*0.11,y+0.5,2.885],[0.015,0.29,0.014]);
    if((floor+variation)%2===0) {
      w.line(group,'#7e8170',[[-width*0.25,y+1.6,3.37],[width*0.15,y+1.6,3.37]],0.009);
      for(let j=0;j<3;j++) {
        const x=-width*0.2+j*width*0.12;
        w.box(group,['#a38089','#b2c3c6','#d0c1a3'][j],[x,y+1.18,3.39],[width*0.1,0.65,0.04]);
        w.box(group,'#6f7662',[x,y+1.53,3.41],[0.024,0.06,0.025]);
      }
    }
  }
  if(width<7 && variation%2===0) {
    w.box(group,'#9f8065',[0,floors*2.9+0.45,-1.5],[width*0.82,0.1,1.8]).rotation.x=-0.12;
    for(let j=0;j<9;j++) w.box(group,'#c29a79',[(j/8-0.5)*width*0.8,floors*2.9+0.48,-1.5],[0.05,0.04,1.8]).rotation.x=-0.12;
  }
}
export function streetFurniture(w: Workshop, root: T.Group) {
  for(let i=0;i<6;i++) for(const side of [-1,1]) {
    const x=side*18.4,z=-7-i*6;
    w.box(root,'#525c57',[x,-0.07,z],[0.6,0.025,0.48]);
    for(let slit=0;slit<5;slit++) w.box(root,'#b8b6a8',[x-0.22+slit*0.11,-0.052,z],[0.02,0.005,0.4]);
  }
  for(const x of [-19,19]) {
    w.cylinder(root,'#7c8864',[x,0.43,-20],0.3,0.78);
    w.cylinder(root,'#506653',[x,0.84,-20],0.32,0.075);
    w.box(root,'#3f5146',[x,0.67,-19.71],[0.29,0.15,0.025]);
    for(let i=0;i<6;i++) w.box(root,'#adbd8b',[x,0.2+i*0.08,-19.71],[0.35,0.02,0.025]);
  }
  // Ordinary breakfast spot: aluminium kettle, low plastic stools and ceramic tea cups.
  const tea=new T.Group(); tea.position.set(-34.5,0,-12); root.add(tea);
  w.box(tea,'#8e7157',[0,0.55,0],[1.5,0.09,0.8]);
  for(const x of [-0.6,0.6]) for(const z of [-0.3,0.3]) w.cylinder(tea,'#716453',[x,0.25,z],0.035,0.5);
  w.cylinder(tea,'#b3bfbb',[0,0.81,0],0.18,0.39,0.75);
  w.cylinder(tea,'#bec8c2',[0,1.02,0],0.19,0.045,0.75);
  w.line(tea,'#777f76',[[-0.13,0.98,0],[-0.13,1.15,0],[0.13,1.15,0],[0.13,0.98,0]],0.018);
  w.line(tea,'#b3bfbb',[[0.17,0.85,0],[0.32,0.98,0]],0.03);
  for(const x of [-0.5,0.5]) {
    w.cylinder(tea,'#eee4cd',[x,0.63,0],0.055,0.09);
    w.box(tea,'#a06249',[x,0.32,0.85],[0.45,0.07,0.42]);
    for(const dx of [-0.16,0.16]) for(const dz of [-0.15,0.15]) w.box(tea,'#a06249',[x+dx,0.16,0.85+dz],[0.035,0.29,0.035]);
  }
  // Produce baskets are wicker rings with fruit, not identical box props.
  for(let i=0;i<3;i++) {
    const x=-30+i*3;
    w.cylinder(root,'#987b51',[x,0.3,-13.1],0.4,0.5);
    for(let ring=0;ring<5;ring++) w.mesh(root,w.geometry('basket-rim',()=>new T.TorusGeometry(0.4,0.018,5,16)),'#c4a46d',[x,0.09+ring*0.1,-13.1]).rotation.x=Math.PI/2;
    for(let j=0;j<5;j++) w.ball(root,i%2?'#8f9d55':'#d6a75c',[x+Math.sin(j*2)*0.23,0.57,-13.1+Math.cos(j*2)*0.23],[0.12,0.1,0.12]);
  }
  // The school courtyard has a hoop, board and painted court, seen through its gate.
  w.box(root,'#d8ccad',[26,-0.04,-14],[9.6,0.06,4.2]);
  w.box(root,'#73918c',[29,2.4,-13.8],[0.08,1,1.4]);
  w.cylinder(root,'#687b73',[29,1.3,-14.2],0.045,2.6);
  w.mesh(root,w.geometry('hoop',()=>new T.TorusGeometry(0.27,0.026,7,20)),'#b37356',[28.7,2.15,-13.8]).rotation.x=Math.PI/2;
  // A small pigeon flock on the lakeside paving gives human-scale detail.
  for(let i=0;i<5;i++) {
    const x=23+i*0.6,z=-28.5+(i%2)*0.25;
    w.ball(root,'#7c898b',[x,0.12,z],[0.09,0.1,0.14]);
    w.ball(root,'#616e6c',[x,0.24,z+0.08],[0.05,0.065,0.05]);
    w.box(root,'#b29f77',[x,0.23,z+0.14],[0.026,0.02,0.04]);
  }
}
export function dressBarista(w:Workshop, person:Person) {
  const cloth=w.geometry('curved-barista-apron',()=>{
    const g=new T.PlaneGeometry(.46,.68,14,12),p=g.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i);
      p.setXYZ(i,x,y,.012-.065*(x/.23)**2+.009*Math.sin(x*49)*(1-(y+.34)/.68));
    }
    g.computeVertexNormals();return g;
  });
  const apron=w.mesh(person.body,cloth,'#b96b8b',[0,1.04,.2]);
  apron.material=w.surface('fabric','#b96b8b');
  w.line(person.body,'#ebc8d8',[[-0.13,1.41,0.18],[-0.08,1.59,0.08],[0.08,1.59,0.08],[0.13,1.41,0.18]],0.016);
  w.box(person.body,'#d191ac',[0,0.93,0.219],[0.26,0.17,0.012]);
  w.label(person.body,'PHỐ NHỎ',[0,1.21,0.219],0.27,0.11,'#a45e7a','#fff5f9',80);
  w.line(person.body,'#a05876',[[-0.24,1.01,0.05],[-0.29,1.01,-0.16],[0.29,1.01,-0.16],[0.24,1.01,0.05]],0.017);
}
export function deliveryBag(w:Workshop) {
  const root=new T.Group();
  w.box(root,'#bb9070',[0.52,0.63,0.27],[0.66,0.44,0.43]);
  w.box(root,'#d1ab88',[0.52,0.86,0.27],[0.67,0.04,0.44]);
  w.line(root,'#8e6750',[[0.28,0.85,0.27],[0.28,1.02,0.27],[0.75,1.02,0.27],[0.75,0.85,0.27]],0.017);
  w.label(root,'PHỐ NHỎ',[0.52,0.66,0.492],0.42,0.16,'#cfad8b','#72523f',70);
  const cups=Array.from({length:4},(_,i)=>{
    const cup=makeCup(w); cup.root.scale.setScalar(0.65); cup.root.position.set(0.33+(i%2)*0.34,0.67,0.15+Math.floor(i/2)*0.22); root.add(cup.root); return cup;
  });
  return {root,cups};
}

export function errandCargo(w:Workshop) {
  const bag=new T.Group(),books=new T.Group(),plant=new T.Group();
  for(const root of [bag,books,plant])root.position.set(0.52,0.6,0.26);
  w.box(bag,'#c5a384',[0,0,0],[0.47,0.4,0.32]);
  w.line(bag,'#89664c',[[-0.18,0.2,0],[-0.18,0.38,0],[0.18,0.38,0],[0.18,0.2,0]],0.02);
  w.box(bag,'#eee4cf',[0,0,0.164],[0.2,0.12,0.01]);
  for(let i=0;i<3;i++){
    w.box(books,['#769694','#b57b8b','#b69e72'][i],[0,i*0.085,0],[0.48,0.08,0.34]);
    w.box(books,'#eee8d8',[0,i*0.085,0.175],[0.43,0.055,0.013]);
  }
  w.cylinder(plant,'#ae7960',[0,0,0],0.17,0.28);
  w.cylinder(plant,'#765843',[0,0.15,0],0.14,0.02);
  w.cylinder(plant,'#778667',[0,0.36,0],0.019,0.44);
  for(let i=0;i<5;i++)w.ball(plant,'#75966b',[Math.sin(i*2)*0.12,0.3+i*0.045,Math.cos(i*2)*0.1],[0.12,0.06,0.07]);
  return {bag,books,plant};
}
export function fishingRod(w:Workshop){
  const root=new T.Group();
  w.line(root,'#8c795f',[[0,0,0],[0,1.4,0.6],[0,2.1,1.05]],0.018);
  w.line(root,'#a9b7ac',[[0,2.1,1.05],[0,0.2,1.2]],0.004);
  w.ball(root,'#c88787',[0,0.2,1.2],[0.028,0.07,0.028]);
  w.cylinder(root,'#697c70',[0,-0.07,0],0.036,0.24);
  return root;
}
