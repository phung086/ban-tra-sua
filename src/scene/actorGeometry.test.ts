import * as T from 'three';
import {describe,it,expect} from 'vitest';
import {Workshop,makePerson,pose} from './models';
import {CUSTOMERS} from '../game/content';

describe('continuous character deformation',()=>{
  it('preserves a connected limb surface and smoothly weights both sides of every bend',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]),limbs:T.SkinnedMesh[]=[];
    person.root.traverse(o=>{if(o instanceof T.SkinnedMesh)limbs.push(o);});
    expect(limbs).toHaveLength(4);
    for(const limb of limbs){
      const g=limb.geometry,p=g.getAttribute('position'),weights=g.getAttribute('skinWeight');
      expect(g.index).not.toBeNull();expect(weights.count).toBe(p.count);
      let blended=0;
      for(let i=0;i<p.count;i++){
        expect(weights.getX(i)+weights.getY(i)).toBeCloseTo(1);
        if(weights.getX(i)>0&&weights.getY(i)>0)blended++;
      }
      expect(blended).toBeGreaterThan(20);
      const edges=new Map<number,Set<number>>();const index=g.index!.array;
      for(let i=0;i<index.length;i+=3)for(const a of [index[i],index[i+1],index[i+2]]){const set=edges.get(a)??new Set<number>();[index[i],index[i+1],index[i+2]].forEach(b=>set.add(b));edges.set(a,set);}
      const seen=new Set<number>(),queue=[index[0]];for(let i=0;i<queue.length;i++){const a=queue[i];if(seen.has(a))continue;seen.add(a);edges.get(a)?.forEach(b=>{if(!seen.has(b))queue.push(b);});}
      expect(seen.size).toBe(p.count);
    }
    pose(person,.7,true,.45,false,true);person.root.updateMatrixWorld(true);
    for(const limb of limbs){limb.skeleton.update();const v=new T.Vector3();for(let i=0;i<limb.geometry.getAttribute('position').count;i++){limb.getVertexPosition(i,v);expect([v.x,v.y,v.z].every(Number.isFinite)).toBe(true);}}
    expect(person.hand.parent).toBe(person.elbows[1]);
    const dispose=limbs[0].skeleton.dispose.bind(limbs[0].skeleton);let released=0;
    limbs[0].skeleton.dispose=()=>{released++;dispose();};
    w.releaseSkeletons(person.root);expect(w.skeletons.size).toBe(0);
    w.releaseSkeletons(person.root);expect(released).toBe(1);w.dispose();expect(released).toBe(1);
  });
});
