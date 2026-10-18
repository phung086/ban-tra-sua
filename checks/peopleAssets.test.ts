import {readFile} from 'node:fs/promises';
import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadPeopleAssets} from '../src/scene/peopleAssets';
import {Workshop,makePerson,pose} from '../src/scene/models';
import {CUSTOMERS} from '../src/game/content';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine';
import {Scene} from '@babylonjs/core/scene';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {nativeSkeleton,syncNativeBones} from '../src/scene/babylonSkeleton';

beforeAll(async()=>{
  vi.stubGlobal('fetch',async(url:string)=>new Response(await readFile(`public/models/people/${url.split('/').at(-1)}`)));
  await loadPeopleAssets();
});
afterAll(()=>vi.unstubAllGlobals());
describe('bundled production people',()=>{
  it('evaluates idle before normalization so the feet stand on the pavement',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS.find(c=>c.id==='miu')!);
    expect(person.imported).toBeDefined();person.root.updateMatrixWorld(true);
    const box=new T.Box3().setFromObject(person.root);
    expect(box.min.y).toBeCloseTo(0,2);expect(box.max.y).toBeCloseTo(1.88,2);
    for(let i=0;i<60;i++){pose(person,i/30,false,0,false,true);person.root.updateMatrixWorld(true);person.root.traverse(o=>{if(o instanceof T.SkinnedMesh)o.computeBoundingBox();});expect(Math.abs(new T.Box3().setFromObject(person.root).min.y)).toBeLessThan(.02);}
    pose(person,2,true,0,false,true);pose(person,.04,true,0,false,true);
    expect(person.imported!.active).toBe('Walk');
    pose(person,.08,true,.5,false,true);expect(person.imported!.active).toBe('Walk_Carry');
    pose(person,.12,false,0,true,false);expect(person.imported!.active).toBe('SitDown');
    expect(person.imported!.actions.get('SitDown')!.time).toBeCloseTo(person.imported!.actions.get('SitDown')!.getClip().duration);
    w.dispose();expect(w.skeletons.size).toBe(0);
  });
  it('keeps arbitrary imported joint order identical between Three and Babylon',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS.find(c=>c.id==='miu')!);
    const meshes:T.SkinnedMesh[]=[];person.root.traverse(o=>{if(o instanceof T.SkinnedMesh)meshes.push(o);});
    const source=meshes[0],engine=new NullEngine(),scene=new Scene(engine),destination=new Mesh('person',scene);
    person.root.updateMatrixWorld(true);const converted=nativeSkeleton(source,scene);destination.skeleton=converted.skeleton;
    for(const t of [0,.04,.08]){
      pose(person,t,true,0,false,true);person.root.updateMatrixWorld(true);
      syncNativeBones(source,converted.bones);converted.skeleton.prepare(true);
      const matrices=converted.skeleton.getTransformMatrices(destination),p=source.geometry.getAttribute('position'),indices=source.geometry.getAttribute('skinIndex'),weights=source.geometry.getAttribute('skinWeight');
      for(const i of [0,Math.floor(p.count/2),p.count-1]){
        const point=new T.Vector3().fromBufferAttribute(p,i),actual=new T.Vector3();
        for(let j=0;j<4;j++)actual.addScaledVector(point.clone().applyMatrix4(new T.Matrix4().fromArray(matrices,indices.getComponent(i,j)*16)),weights.getComponent(i,j));
        expect(actual.distanceTo(source.applyBoneTransform(i,point.clone()))).toBeLessThan(.0001);
      }
    }
    scene.dispose();engine.dispose();w.dispose();
  });
});
