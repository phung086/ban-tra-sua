import {travelPlayback,type TravelSample} from './travelAnimation';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import type {Workshop,Person,Look} from './models';
import type {Customer} from '../game/types';

const templates=new Map<string,GLTF>();
let pending:Promise<void>|undefined;
export function loadPeopleAssets(){
  return pending??=Promise.allSettled(['female','male','elder'].map(async key=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(`${import.meta.env.BASE_URL}models/people/neighbor-${key}.glb`,{signal:controller.signal});
      if(!response.ok)throw new Error('Character unavailable');
      const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
      templates.set(key,gltf);
    }finally{clearTimeout(timer);}
  })).then(()=>undefined);
}

export type ImportedMotion={mixer:T.AnimationMixer;actions:Map<string,T.AnimationAction>;active:string;time:number|null;travel?:TravelSample};
export function importedPerson(w:Workshop,customer:Customer,look:Look):Person|null{
  const female=['miu','lan','lyly','hanh','mai','thu','thao'].includes(customer.id);
  const key=look.old?'elder':female?'female':'male',template=templates.get(key);
  if(!template)return null;
  const model=clone(template.scene),root=new T.Group(),body=new T.Group();root.add(body);body.add(model);
  root.name=`resident:${customer.id}`;root.userData.characterAsset=key;
  const mixer=new T.AnimationMixer(model),actions=new Map<string,T.AnimationAction>();
  for(const clip of template.animations)actions.set(clip.name,mixer.clipAction(clip));
  actions.get('Idle')?.play();mixer.update(0);model.updateMatrixWorld(true);
  model.traverse(o=>{if(o instanceof T.SkinnedMesh)o.computeBoundingBox();});
  // The source file is saved in a non-idle pose. Normalize the evaluated idle
  // surface, otherwise the feet sink when the first animation is applied.
  const box=new T.Box3().setFromObject(model),scale=2.1/(box.max.y-box.min.y);
  model.scale.multiplyScalar(scale);model.position.y=-box.min.y*scale;
  root.scale.set(look.build,look.height/2.1,1);
  const animatedBounds=box.getBoundingSphere(new T.Sphere());animatedBounds.radius*=1.4;
  model.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    object.geometry=w.geometry(`person-asset:${object.geometry.uuid}`,()=>toCreasedNormals(object.geometry.clone(),Math.PI/3));
    const adapt=(source:T.Material)=>{
      const id=`person-material:${customer.id}:${source.uuid}`;
      if(!w.materials.has(id)){
        const m=(source as T.MeshStandardMaterial).clone();
        const color=m.name==='Skin'?look.skin:m.name==='Shirt'?look.shirt:m.name==='Pants'?look.pants:m.name==='Hair'?look.hair:m.name==='Face'?'#34332c':null;
        if(color)m.color.set(color);m.roughness=.88;m.metalness=0;
        w.materials.set(id,m);
      }
      return w.materials.get(id)!;
    };
    object.material=Array.isArray(object.material)?object.material.map(adapt):adapt(object.material);
    object.castShadow=object.receiveShadow=true;
    if(object instanceof T.SkinnedMesh){w.skeletons.add(object.skeleton);object.boundingSphere=animatedBounds.clone();object.frustumCulled=true;}
  });
  const bone=(name:string)=>(model.getObjectByName(name)??body) as T.Group;
  const hand=new T.Group();bone('Fist.R').add(hand);hand.scale.setScalar(1/scale);
  hand.position.set(0,0,0);hand.rotation.z=-Math.PI/2;

  return {root,body,head:bone('Head'),leftArm:bone('UpperArm.L'),rightArm:bone('UpperArm.R'),
    leftLeg:bone('UpperLeg.L'),rightLeg:bone('UpperLeg.R'),hand,eyes:[],
    knees:[bone('LowerLeg.L') as unknown as T.Bone,bone('LowerLeg.R') as unknown as T.Bone],
    elbows:[bone('LowerArm.L') as unknown as T.Bone,bone('LowerArm.R') as unknown as T.Bone],
    animation:{lastTime:null,walkWeight:0,seatWeight:0,seed:0,basePitch:0,turnStride:1},
    imported:{mixer,actions,active:'Idle',time:null}};
}

export function poseImported(person:Person,time:number,walking:boolean,carrying:boolean,sitting:boolean,motion:boolean){
  const rig=person.imported!;
  const dt=rig.time===null?0:Math.max(0,Math.min(.05,time-rig.time));rig.time=time;
  const current={x:person.root.position.x,z:person.root.position.z,time};
  const playback=travelPlayback(rig.travel,current,walking);rig.travel=current;
  const next=sitting?'SitDown':carrying?'Walk_Carry':walking&&motion?'Walk':'Idle';
  if(next!==rig.active){
    const action=rig.actions.get(next),old=rig.actions.get(rig.active);
    if(action){action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(next==='SitDown'){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}
      else action.setLoop(T.LoopRepeat,Infinity);
      if(motion)old?action.crossFadeFrom(old,.2,false):action.fadeIn(.2);else old?.stop();
    }
    rig.active=next;
  }
  // Both walk clips follow metres travelled, including slow analog input,
  // braking, carrying and injured movement; idle remains independent.
  for(const name of ['Walk','Walk_Carry'])rig.actions.get(name)?.setEffectiveTimeScale(motion?playback:0);
  rig.mixer.update(motion?dt:0);
  if(!motion&&sitting){const action=rig.actions.get('SitDown');if(action){action.time=action.getClip().duration;rig.mixer.update(0);}}
}
