import * as T from 'three';
import type {Workshop} from './models';

type Ring={y:number;rx:number;rz:number;x?:number;z?:number;color:string};
// One connected ring surface per garment/limb. Unlike stacked capsules it has
// no cut at the elbow or knee; skin weights bend the continuous surface.
function ringSurface(rings:Ring[],segments=20){
  const positions:number[]=[],colors:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const [row,ring] of rings.entries())for(let col=0;col<=segments;col++){
    const angle=col/segments*Math.PI*2;
    positions.push((ring.x??0)+Math.sin(angle)*ring.rx,ring.y,(ring.z??0)+Math.cos(angle)*ring.rz);
    const color=new T.Color(ring.color),shade=.99+Math.sin(col*19+row*7)*.015;
    colors.push(color.r*shade,color.g*shade,color.b*shade);uvs.push(col/segments,row/(rings.length-1));
    if(row<rings.length-1&&col<segments){const a=row*(segments+1)+col,b=a+segments+1;if(rings[row+1].y>ring.y)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function material(w:Workshop){
  const key='actor:continuous-color';
  if(!w.materials.has(key))w.materials.set(key,new T.MeshStandardMaterial({color:'white',vertexColors:true,roughness:.86}));
  return w.materials.get(key)!;
}
export function continuousTorso(w:Workshop,parent:T.Group,shirt:string,skin:string){
  const rings:Ring[]=[
    {y:.84,rx:.24,rz:.145,color:shirt},{y:.9,rx:.26,rz:.16,color:shirt},
    {y:1.01,rx:.235,rz:.15,color:shirt},{y:1.18,rx:.26,rz:.172,color:shirt},
    {y:1.32,rx:.285,rz:.172,color:shirt},{y:1.41,rx:.29,rz:.15,color:shirt},
    {y:1.47,rx:.21,rz:.12,color:shirt},{y:1.5,rx:.105,rz:.09,color:shirt},
    {y:1.505,rx:.10,rz:.087,color:skin},{y:1.59,rx:.094,rz:.088,color:skin},
    {y:1.67,rx:.10,rz:.095,color:skin},
  ];
  const mesh=new T.Mesh(w.geometry(`torso:${shirt}:${skin}`,()=>ringSurface(rings)),material(w));mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function continuousHips(w:Workshop,parent:T.Group,color:string){
  const mesh=new T.Mesh(w.geometry(`hips:${color}`,()=>ringSurface([{y:.75,rx:.19,rz:.14,color},{y:.8,rx:.25,rz:.16,color},{y:.88,rx:.255,rz:.157,color},{y:.91,rx:.245,rz:.15,color}])),material(w));mesh.castShadow=true;parent.add(mesh);return mesh;
}
export function continuousLimb(w:Workshop,pivot:T.Group,kind:'arm'|'leg',cloth:string,skin:string,side=1){
  const arm=kind==='arm',jointY=arm?-.30:-.42;
  const ys=arm?[.04,0,-.08,-.17,-.245,-.25,-.28,-.30,-.33,-.4,-.48,-.53,-.55]:[.07,0,-.1,-.2,-.3,-.38,-.42,-.46,-.52,-.62,-.7,-.75];
  const rings=ys.map((y,i)=>{
    const radius=arm?(i<5?.09-i*.003:.057+Math.sin(i*.7)*.005):.105-(i/ys.length)*.031;
    return {y,rx:radius,rz:radius*(arm?.96:1.04),x:arm?side*.018*Math.min(1,-y/.25):0,z:arm?.012:0,color:arm&&i>=5||!arm&&y<-.30?skin:cloth};
  });
  const geometry=w.geometry(`continuous:${kind}:${cloth}:${skin}:${side}`,()=>{
    const g=ringSurface(rings),p=g.getAttribute('position'),weights:number[]=[],indices:number[]=[];
    for(let i=0;i<p.count;i++){
      const blend=T.MathUtils.smoothstep(-p.getY(i),-jointY-.075,-jointY+.075);
      indices.push(0,1,0,0);weights.push(1-blend,blend,0,0);
    }
    g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));return g;
  });
  const base=new T.Bone(),joint=new T.Bone();base.name=`${kind}-root`;joint.name=arm?'elbow':'knee';joint.position.y=jointY;base.add(joint);
  const mesh=new T.SkinnedMesh(geometry,material(w));mesh.name=`continuous-${kind}`;mesh.add(base);pivot.add(mesh);mesh.updateMatrixWorld(true);
  const skeleton=new T.Skeleton([base,joint]);mesh.bind(skeleton);w.skeletons.add(skeleton);
  // Conservative animated bounds keep distant limbs out of the draw list.
  mesh.boundingSphere=new T.Sphere(new T.Vector3(0,-.32,0),.9);
  mesh.castShadow=mesh.receiveShadow=true;
  return {mesh,joint};
}
export function faceGeometry(){
  const geometry=new T.SphereGeometry(1,28,22),p=geometry.getAttribute('position');
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const jaw=1-.22*T.MathUtils.smoothstep(-y,0,.85);
    const nose=z>0?Math.exp(-x*x*90-(y+.13)**2*65)*.041:0;
    p.setXYZ(i,x*.208*jaw,y*.267,z*.19+nose);
  }
  geometry.computeVertexNormals();return geometry;
}
