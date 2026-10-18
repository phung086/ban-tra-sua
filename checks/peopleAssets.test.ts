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
    pose(person,.08,true,0,false,true,1,true);expect(person.imported!.active).toBe('Walk_Carry');
    pose(person,.12,false,0,true,false);expect(person.imported!.active).toBe('SitDown');
    expect(person.imported!.actions.get('SitDown')!.time).toBeCloseTo(person.imported!.actions.get('SitDown')!.getClip().duration);
    w.dispose();expect(w.skeletons.size).toBe(0);
  });
  it('attaches items to the actual imported wrist, not the model origin',()=>{
    const w=new Workshop(),p=makePerson(w,CUSTOMERS.find(c=>c.id==='miu')!);
    expect(p.hand.parent?.name).toBe('FistR');expect(p.leftLeg.name).toBe('UpperLegL');
    p.root.updateMatrixWorld(true);expect(p.hand.getWorldPosition(new T.Vector3()).y).toBeGreaterThan(.5);w.dispose();
  });
  it('drives cadence by travelled phase and shares it between carrying and walking',()=>{
    const w=new Workshop(),p=makePerson(w,CUSTOMERS.find(c=>c.id==='miu')!);
    pose(p,0,true,0,false,true,Math.PI);
    const walk=p.imported!.actions.get('Walk')!;
    expect(walk.time/walk.getClip().duration).toBeCloseTo(.5);
    pose(p,.05,true,0,false,true,Math.PI);
    expect(walk.time/walk.getClip().duration).toBeCloseTo(.5);
    pose(p,.1,true,0,false,true,Math.PI,true);
    const carry=p.imported!.actions.get('Walk_Carry')!;
    expect(carry.time/carry.getClip().duration).toBeCloseTo(.5);
    pose(p,.15,true,0,false,true,Math.PI*1.1,true);
    expect(carry.time/carry.getClip().duration).toBeCloseTo(.55);w.dispose();
  });
  it('settles carrying legs into idle and does not mistake a greeting for an item',()=>{
    const w=new Workshop(),p=makePerson(w,CUSTOMERS.find(c=>c.id==='miu')!);
    pose(p,0,true,0,false,true,2,true);
    for(let i=1;i<=15;i++)pose(p,i/30,false,0,false,true,2,true);
    expect(p.imported!.active).toBe('Idle_Carry');
    const idle=p.imported!.actions.get('Idle')!.getClip(),carry=p.imported!.actions.get('Idle_Carry')!.getClip();
    for(const track of idle.tracks.filter(t=>/^(UpperLeg|LowerLeg|Foot)/.test(t.name)))
      expect([...carry.tracks.find(t=>t.name===track.name)!.values]).toEqual([...track.values]);
    pose(p,.55,false,.35,false,true);expect(p.imported!.active).toBe('Idle');w.dispose();
  });
  it('keeps animated geometry inside conservative culling bounds',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS.find(c=>c.id==='miu')!);
    for(const sitting of [false,true]){
      pose(person,0,!sitting,0,sitting,false);person.root.updateMatrixWorld(true);
      person.root.traverse(o=>{if(o instanceof T.SkinnedMesh){expect(o.frustumCulled).toBe(true);const p=o.geometry.getAttribute('position'),v=new T.Vector3();for(let i=0;i<p.count;i+=5){o.getVertexPosition(i,v);expect(v.distanceTo(o.boundingSphere!.center)).toBeLessThanOrEqual(o.boundingSphere!.radius);}}});
    }w.dispose();
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
