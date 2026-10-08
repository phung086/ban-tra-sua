import * as T from 'three';
import {Workshop} from './models';
import {CITY_EXTENDED_BUILDINGS} from '../game/cityMap';
export function texturedGround(w:Workshop,root:T.Group,kind:'paving'|'asphalt'|'brick'|'stone',color:string,x:number,z:number,width:number,depth:number,y=-.075){
  const key=`ground:${kind}:${color}:${width}:${depth}`;
  let material=w.materials.get(key);
  if(!material){material=w.surface(kind,color).clone();for(const slot of ['map','normalMap'] as const){const texture=material[slot]!.clone();texture.repeat.set(width/2,depth/2);texture.needsUpdate=true;w.textures.push(texture);material[slot]=texture;}w.materials.set(key,material);}
  const mesh=new T.Mesh(w.geometry(`ground:${width}:${depth}`,()=>new T.PlaneGeometry(width,depth)),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);return mesh;
}
export function detailedTree(w:Workshop,root:T.Group,x:number,z:number,size=1){
  const group=new T.Group();group.position.set(x,0,z);group.scale.setScalar(size);root.add(group);
  const seed=Math.abs(x*17+z*31),bark=w.surface('bark','#756349');
  const trunk=w.mesh(group,w.geometry('tree-trunk-taper',()=>new T.CylinderGeometry(.12,.26,3.6,12,4)),'#756349',[0,1.8,0]);trunk.material=bark;
  for(let i=0;i<7;i++){
    const angle=i*2.399+seed,dx=Math.sin(angle)*1.15,dz=Math.cos(angle)*1.05;
    const branch=w.line(group,'#756349',[[0,1.5+i*.15,0],[dx*.4,2.8+i%2*.3,dz*.4],[dx,3.5+i%3*.25,dz]],.035+i%2*.018);branch.material=bark;
    const crown=w.mesh(group,w.geometry('organic-crown',()=>new T.SphereGeometry(1,14,10)),i%2?'#678849':'#3f643f',[dx,3.8+i%3*.34,dz],[.9,.65,.83]);crown.material=w.surface('foliage',i%2?'#678849':'#3f643f');
    const rootlet=w.line(group,'#756349',[[0,.08,0],[dx*.3,.03,dz*.3],[dx*.55,0,dz*.55]],.06);rootlet.material=bark;
  }
  // Hundreds of separate leaf silhouettes, one shared instanced draw per tree.
  const leaf=w.geometry('leaf-silhouette',()=>{const shape=new T.Shape();shape.moveTo(0,-.1);shape.bezierCurveTo(-.16,-.02,-.12,.1,0,.16);shape.bezierCurveTo(.12,.1,.16,-.02,0,-.1);return new T.ShapeGeometry(shape,3);});
  const mat=w.material('#547444');mat.side=T.DoubleSide;
  const leaves=new T.InstancedMesh(leaf,mat,440),dummy=new T.Object3D();
  for(let i=0;i<440;i++){
    const angle=i*2.399+seed,latitude=Math.acos(1-2*((i*73%440)+.5)/440),radius=1.8+.25*Math.sin(i*17);
    dummy.position.set(Math.sin(latitude)*Math.cos(angle)*radius,4.2+Math.cos(latitude)*1.05,Math.sin(latitude)*Math.sin(angle)*radius*.85);
    dummy.rotation.set(i*.67,i*.91,i*.31);dummy.scale.setScalar(.85+(i%7)*.12);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
  }leaves.castShadow=true;leaves.receiveShadow=true;leaves.computeBoundingSphere();group.add(leaves);
  for(const side of [-1,1]){w.box(group,'#b7b09b',[side*.82,.02,0],[.13,.16,1.75]);w.box(group,'#b7b09b',[0,.02,side*.82],[1.75,.16,.13]);}
  return group;
}
function bench(w:Workshop,root:T.Group,x:number,z:number){
  for(let i=0;i<5;i++){const plank=w.box(root,'#a47b54',[x,.53,z+(i-2)*.115],[2.2,.065,.1]);plank.material=w.surface('wood','#a47b54');}
  for(let i=0;i<3;i++){const back=w.box(root,'#a47b54',[x,.86+i*.13,z-.35],[2.2,.1,.055]);back.material=w.surface('wood','#a47b54');}
  for(const side of [-1,1]){w.line(root,'#485553',[[x+side*.83,.03,z+.2],[x+side*.83,.53,z+.2],[x+side*.83,.53,z-.32],[x+side*.83,1.17,z-.32]],.045);}
}
export function urbanExpansion(w:Workshop,root:T.Group,house:(w:Workshop,root:T.Group,x:number,z:number,width:number,floors:number,color:string,name?:string)=>T.Group){
  texturedGround(w,root,'paving','#bdb7a4',0,-48,160,104,-.175);
  for(const z of [-24,-60])texturedGround(w,root,'asphalt','#505859',0,z,152,7,-.09);
  for(const x of [-52,-15,15,52])texturedGround(w,root,'asphalt','#505859',x,-48,6,88,-.095);
  for(const z of [-64.2,-55.8])texturedGround(w,root,'paving','#c2b7a1',0,z,150,1.5,-.055);
  for(const x of [-56.2,56.2])texturedGround(w,root,'paving','#c2b7a1',x,-48,1.8,90,-.05);
  for(let i=0;i<23;i++){w.box(root,'#eee5c9',[-70+i*6,-.067,-60],[2.5,.008,.11]);}
  for(const b of CITY_EXTENDED_BUILDINGS){
    const group=house(w,root,b.x,b.z,b.width,b.height,b.color);
    if(b.height<=4){
      for(const side of [-1,1]){const roof=w.box(group,'#9b5b43',[0,b.height*2.9+.7,side*1.4],[b.width+.55,.17,3.3]);roof.rotation.x=side*.38;roof.material=w.surface('roof','#9b5b43');}
      w.box(group,'#b2795a',[0,b.height*2.9+1.3,0],[b.width+.6,.14,.17]);
    }else{
      for(const side of [-1,1])w.box(group,'#6c777a',[side*b.width*.46,b.height*1.45,2.69],[.12,b.height*2.9,.12]);
      w.box(group,'#73898c',[0,b.height*2.9+.8,0],[b.width*.65,1.4,3]);
    }
    if(b.x<-40)w.label(group,['GỐM HẠ · THỦ CÔNG','BÁNH CỐM','CÀ PHÊ SỚM'][Math.abs(Math.round(b.z))%3],[0,2.6,2.75],b.width*.78,.5,'#775541','#fff3d8',60);
  }
  // Old-town row sits west of An Hòa with doors, arches and distinct shopfronts.
  for(let i=0;i<4;i++){
    const h=house(w,root,-66,-12-i*10,7,2+i%2,['#c2a987','#e0c79e','#b4bca6','#c3adb2'][i],['PHỞ SÁNG','GỐM HẠ','HOA TƯƠI','BÁNH MÌ NÓNG'][i]);h.rotation.y=Math.PI/2;
    for(const side of [-1,1]){const roof=w.box(h,'#935d42',[0,(2+i%2)*2.9+.7,side*1.3],[7.5,.14,3.2]);roof.rotation.x=side*.4;roof.material=w.surface('roof','#935d42');}
  }
  // A civic plaza with brick paving, flower beds, fountain and market bunting.
  texturedGround(w,root,'brick','#aa7960',0,-71,22,16,-.045);
  const rim=w.cylinder(root,'#c8c0aa',[0,.25,-76],2.7,.55);rim.material=w.surface('stone','#c8c0aa');
  w.cylinder(root,'#629ca7',[0,.55,-76],2.4,.05);w.cylinder(root,'#c4bead',[0,1.02,-76],.3,1.1);
  w.cylinder(root,'#c4bead',[0,1.6,-76],1,.16);w.cylinder(root,'#c4bead',[0,2,-76],.18,.7);
  w.label(root,'ĐÔNG PHONG · HỘI CHỢ CUỐI TUẦN',[0,2.4,-66],9,.55,'#658678','#fff4da',60);
  for(const side of [-1,1]){bench(w,root,side*7,-71);detailedTree(w,root,side*9,-78,1.1);}
  for(let i=0;i<12;i++){const flag=w.mesh(root,w.geometry('festival-flag',()=>new T.ConeGeometry(.14,.4,3)),['#b96877','#d2a954','#779793'][i%3],[-10+i*1.8,3.5-Math.sin(i/11*Math.PI)*.45,-65]);flag.rotation.z=Math.PI;}
  w.line(root,'#726e5a',[[-11,3.7,-65],[0,3,-65],[11,3.7,-65]],.009);
  // Hanoi-inspired community temple: layered terracotta eaves and carved columns.
  texturedGround(w,root,'brick','#9f7254',-30,-80,19,15,-.04);
  const temple=new T.Group();temple.position.set(-30,0,-87);root.add(temple);
  w.box(temple,'#d5c9aa',[0,.16,0],[17,.4,9]);
  for(const x of [-6,-3,0,3,6]){w.cylinder(temple,'#775039',[x,2,3.5],.18,3.6);w.box(temple,'#986646',[x,1.7,1.5],[2.5,2.8,.14]);}
  for(let tier=0;tier<2;tier++)for(const side of [-1,1]){const roof=w.box(temple,'#955f43',[0,4.2+tier*.65,side*(2.3-tier*.5)],[18-tier*3,.19,5-tier]);roof.rotation.x=side*.31;roof.material=w.surface('roof','#955f43');}
  w.box(temple,'#a57550',[0,5.8,0],[15,.16,.22]);
  w.label(temple,'ĐÌNH HẠ',[0,3.4,3.8],3.2,.58,'#733c2b','#f0d69c',68);
  for(const side of [-1,1]){w.cylinder(temple,'#d7be86',[side*6,2.4,3.7],.23,.45);detailedTree(w,root,-30+side*11,-79,1.25);}
  // River embankment gives a continuous horizon and a walkable shaded promenade.
  texturedGround(w,root,'stone','#c6bca3',62,-48,6,89,-.05);
  w.box(root,'#558e9c',[75,-.2,-47],[17,.18,99]).castShadow=false;
  for(let i=0;i<25;i++){const z=-6-i*3.5;w.cylinder(root,'#7c8983',[65,.65,z],.055,1.3);w.line(root,'#7c8983',[[65,1.1,z],[65,1.1,z-3.5]],.025);}
  for(let i=0;i<11;i++){detailedTree(w,root,60,-9-i*7.5,.88+i%3*.12);if(i%3===1)bench(w,root,62,-9-i*7.5);}
  for(const x of [-48,48])for(let i=0;i<6;i++)detailedTree(w,root,x,-50-i*7.2,.85+i%2*.1);
  for(let i=0;i<9;i++){
    const x=-72+i*18,group=new T.Group();group.position.set(x,0,-104);root.add(group);
    const height=13+i%3*5;const block=w.box(group,'#b4bcb6',[0,height/2,0],[10,height,8]);block.material=w.surface('plaster','#b4bcb6');
    for(let floor=0;floor<height/3;floor++)for(let col=0;col<4;col++)w.box(group,'#657d83',[-3.2+col*2.1,2+floor*2.7,4.02],[1.2,1.6,.035]);
  }
}
