import * as T from 'three';
import {Skeleton} from '@babylonjs/core/Bones/skeleton';
import {Bone} from '@babylonjs/core/Bones/bone';
import {Matrix} from '@babylonjs/core/Maths/math.vector';
import type {Scene} from '@babylonjs/core/scene';

export function nativeSkeleton(source:T.SkinnedMesh,scene:Scene){
  const skeleton=new Skeleton(`actor-${source.id}`,String(source.id),scene),bones:Bone[]=[];
  // Mesh-local absolute joints preserve glTF inverse binds and arbitrary joint
  // order. Imported rigs do not guarantee that parents precede their children.
  skeleton.useTextureToStoreBoneMatrices=false;
  source.skeleton.bones.forEach((bone,i)=>{
    const bind=source.skeleton.boneInverses[i].clone().invert().premultiply(source.bindMatrix.clone().invert());
    bones.push(new Bone(bone.name,skeleton,null,Matrix.FromArray(bind.elements),undefined,undefined,i));
  });
  return {skeleton,bones};
}
export function syncNativeBones(source:T.SkinnedMesh,bones:Bone[]){
  bones.forEach((bone,i)=>{
    const local=source.skeleton.bones[i].matrixWorld.clone().premultiply(source.bindMatrixInverse);
    bone.updateMatrix(Matrix.FromArray(local.elements),false,true);
  });
}
