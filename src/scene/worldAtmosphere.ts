import * as T from 'three';
import {Workshop} from './models';
export function contactShadow(w:Workshop,parent:T.Group,radius:number){
  const key='contact-shadow';
  let material=w.materials.get(key);
  if(!material){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,5,32,32,31);
    gradient.addColorStop(0,'#30232955');gradient.addColorStop(.5,'#30232920');gradient.addColorStop(1,'#30232900');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    const texture=new T.CanvasTexture(canvas);w.textures.push(texture);
    material=new T.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1,opacity:.8});w.materials.set(key,material);
  }
  const mesh=new T.Mesh(w.geometry('contact-plane',()=>new T.PlaneGeometry(1,1)),material);
  mesh.rotation.x=-Math.PI/2;mesh.position.y=.012;mesh.scale.set(radius*2,radius*1.25,1);mesh.renderOrder=1;parent.add(mesh);
  return mesh;
}
export function lakeSurface(w:Workshop,parent:T.Group){
  // Small geometry highlights read as moving water without a reflection pass.
  const group=new T.Group();parent.add(group);
  for(let i=0;i<6;i++){
    const ring=w.mesh(group,w.geometry('water-ring',()=>new T.RingGeometry(.85,1,40)),'#c8e4e9',[22+i%3*3,.028,-32-Math.floor(i/3)*5],[1.1,.48,1],0,.3);
    ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  }
  return group;
}
