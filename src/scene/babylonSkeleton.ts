import * as T from 'three';
import {Skeleton} from '@babylonjs/core/Bones/skeleton';
import {Bone} from '@babylonjs/core/Bones/bone';
import {Matrix} from '@babylonjs/core/Maths/math.vector';
import type {Scene} from '@babylonjs/core/scene';

export function nativeSkeleton(source:T.SkinnedMesh,scene:Scene){
  const skeleton=new Skeleton(`actor-${source.id}`,String(source.id),scene),bones:Bone[]=[];
  // Two joints per limb fit in uniforms; no bone texture or per-vertex CPU work.
  skeleton.useTextureToStoreBoneMatrices=false;
  source.skeleton.bones.forEach((bone,i)=>{
    const parent=source.skeleton.bones.indexOf(bone.parent as T.Bone);
    // Engine switches can happen mid-stride: retain the original inverse binds.
    const bind=source.skeleton.boneInverses[i].clone().invert();
    bind.premultiply(parent>=0?source.skeleton.boneInverses[parent]:source.bindMatrix.clone().invert());
    bones.push(new Bone(bone.name,skeleton,parent>=0?bones[parent]:null,Matrix.FromArray(bind.elements),undefined,undefined,i));
  });
  return {skeleton,bones};
}
export function syncNativeBones(source:T.SkinnedMesh,bones:Bone[]){
  bones.forEach((bone,i)=>bone.updateMatrix(Matrix.FromArray(source.skeleton.bones[i].matrix.elements),false,true));
}
