import {it,expect} from 'vitest';
import * as T from 'three';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine';
import {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {Workshop} from './models';
import {continuousLimb} from './actorGeometry';
import {nativeSkeleton,syncNativeBones} from './babylonSkeleton';

it('matches Three skin deformation when switching mid-stride and keeps inverse binds fixed across poses',()=>{
  const engine=new NullEngine(),scene=new Scene(engine),w=new Workshop(),pivot=new T.Group();pivot.position.set(.3,1.4,0);
  const {mesh:source,joint}=continuousLimb(w,pivot,'arm','#fff','#cda48b');
  const destination=new Mesh('arm',scene);
  joint.rotation.x=-.55;pivot.updateMatrixWorld(true);
  const converted=nativeSkeleton(source,scene);destination.skeleton=converted.skeleton;
  const inverse=converted.bones[1].getAbsoluteInverseBindMatrix().clone();
  for(const angle of [-.55,-.2,.15]){
    joint.rotation.x=angle;pivot.updateMatrixWorld(true);syncNativeBones(source,converted.bones);converted.skeleton.prepare(true);
    const matrices=converted.skeleton.getTransformMatrices(destination),positions=source.geometry.getAttribute('position'),indices=source.geometry.getAttribute('skinIndex'),weights=source.geometry.getAttribute('skinWeight');
    for(const index of [100,160,240]){
      const p=new T.Vector3().fromBufferAttribute(positions,index),expected=source.applyBoneTransform(index,p.clone()),actual=new T.Vector3();
      for(let influence=0;influence<2;influence++){
        const bone=indices.getComponent(index,influence),weight=weights.getComponent(index,influence);
        actual.addScaledVector(p.clone().applyMatrix4(new T.Matrix4().fromArray(matrices,bone*16)),weight);
      }
      expect(actual.distanceTo(expected)).toBeLessThan(.00001);
    }
    expect(converted.bones[1].getAbsoluteInverseBindMatrix().equals(inverse)).toBe(true);
  }
  scene.dispose();engine.dispose();w.dispose();
});
