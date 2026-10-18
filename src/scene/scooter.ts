import * as T from 'three';
import type {Workshop} from './models';

/** Shared 1.8 m scooter: bodywork follows a side profile, wheels stay on the road. */
export function makeScooter(w:Workshop,color:string){
  const root=new T.Group();
  const shell=(key:string,points:number[][],width:number,tint:string)=>{
    const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();
    const g=w.geometry(`scooter:${key}`,()=>{
      const geometry=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3,steps:1,curveSegments:8});
      geometry.translate(0,0,-width/2);geometry.rotateY(Math.PI/2);return geometry;
    });
    return w.mesh(root,g,tint,[0,0,0]);
  };
  shell('rear',[[-.82,.40],[-.75,.62],[-.30,.75],[.04,.69],[.15,.50],[-.20,.38]],.38,color);
  shell('shield',[[.26,.25],[.35,.53],[.38,.96],[.49,1.10],[.64,1.06],[.66,.86],[.53,.40],[.46,.25]],.30,color);
  w.box(root,'#353937',[0,.25,.13],[.45,.07,.69]);
  w.ball(root,'#39352f',[0,.76,-.36],[.21,.055,.37]);
  for(const z of [-.64,.61]){
    const tire=w.mesh(root,w.geometry('scooter-tire',()=>new T.TorusGeometry(.205,.052,10,24)),'#252a29',[0,.25,z]);tire.rotation.y=Math.PI/2;
    const rim=w.cylinder(root,'#b7b9b4',[0,.25,z],.156,.11,.65);rim.rotation.z=Math.PI/2;
    const hub=w.cylinder(root,'#515e5b',[0,.25,z],.055,.125,.65);hub.rotation.z=Math.PI/2;
    for(const side of [-1,1])w.line(root,'#b9c1bb',[[side*.07,.25,z],[side*.07,.39,z+.05]],.014);
  }
  for(const side of [-1,1]){
    w.line(root,'#939e97',[[side*.11,.27,.61],[side*.11,.83,.48]],.022);
    w.line(root,'#424c48',[[0,1.08,.49],[side*.29,1.09,.45]],.025);
    w.line(root,'#a5b0a9',[[side*.22,1.10,.46],[side*.29,1.32,.44]],.012);
    w.ball(root,'#445552',[side*.30,1.34,.44],[.07,.042,.018]);
    w.ball(root,'#bbcdc9',[side*.30,1.34,.458],[.058,.033,.005]);
    w.ball(root,'#c29a4c',[side*.16,.94,.632],[.036,.025,.018]);
  }
  w.ball(root,'#d9e2d6',[0,1.04,.64],[.115,.068,.028]);
  w.box(root,'#943b2d',[0,.56,-.80],[.21,.06,.04]);
  w.label(root,'29 · HN',[0,.39,-.815],.22,.12,'#ecebda','#333b37',32).rotation.y=Math.PI;
  w.line(root,'#4b534c',[[.11,.29,-.28],[.26,.01,-.4]],.018);
  return root;
}
