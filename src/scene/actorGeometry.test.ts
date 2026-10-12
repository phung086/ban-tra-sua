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
  it('blends walking and standing instead of snapping arms and legs',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    pose(person,0,false,0,false,true,Math.PI/2);
    expect(person.animation.walkWeight).toBe(0);
    pose(person,.1,true,0,false,true,Math.PI/2);
    const first=person.leftLeg.rotation.x;
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(.39);
    pose(person,.15,true,0,false,true,Math.PI/2);
    expect(person.leftLeg.rotation.x).toBeGreaterThan(first);
    pose(person,.2,false,0,false,true,Math.PI/2);
    expect(person.leftLeg.rotation.x).toBeGreaterThan(0);
    const released=person.leftLeg.rotation.x;
    pose(person,.25,false,0,false,true,Math.PI/2);
    expect(person.leftLeg.rotation.x).toBeLessThan(released);
    expect(person.leftArm.rotation.x).toBeCloseTo(-person.leftLeg.rotation.x*.7);
    w.dispose();
  });

  it('preserves seated and reduced-motion poses without head drift',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    pose(person,1,false,0,false,true);
    expect(Math.abs(person.head.rotation.y)+Math.abs(person.head.rotation.z)).toBeGreaterThan(0);
    pose(person,1.1,true,0,true,true);
    expect(person.animation.seatWeight).toBeGreaterThan(0);
    expect(person.animation.seatWeight).toBeLessThan(1);
    expect(person.leftLeg.rotation.x).toBeLessThan(0);
    for(let i=1;i<=30;i++)pose(person,1.1+i/30,false,0,true,true);
    expect(person.animation.seatWeight).toBeGreaterThan(.99);
    expect(person.leftLeg.rotation.x).toBeCloseTo(-1.35,2);
    expect(person.rightLeg.rotation.x).toBeCloseTo(-1.35,2);
    expect(person.knees.every(k=>Math.abs(k.rotation.x-1.35)<.01)).toBe(true);
    pose(person,2.2,true,0,false,false);
    expect(person.animation.seatWeight).toBe(0);
    expect(person.animation.walkWeight).toBe(0);
    expect(person.head.rotation.y).toBeCloseTo(0,5);
    expect(person.head.rotation.x).toBeCloseTo(0,5);
    expect(person.body.position.y).toBeCloseTo(0,5);
    expect(person.eyes.every(eye=>eye.scale.y===eye.userData.blinkHeight)).toBe(true);
    w.dispose();
  });

  it('eases out of sitting without breaking first-frame seated spawns',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    pose(person,0,false,0,true,true);
    expect(person.animation.seatWeight).toBe(1);
    expect(person.leftLeg.rotation.x).toBeCloseTo(-1.35);
    pose(person,1/30,false,0,false,true);
    expect(person.animation.seatWeight).toBeGreaterThan(0);
    expect(person.animation.seatWeight).toBeLessThan(1);
    expect(person.leftLeg.rotation.x).toBeGreaterThan(-1.35);
    for(let i=2;i<=32;i++)pose(person,i/30,false,0,false,true);
    expect(person.animation.seatWeight).toBeLessThan(.01);
    expect(person.leftLeg.rotation.x).toBeCloseTo(0,2);
    w.dispose();
  });

  it('keeps actor idle phases distinct and preserves original body posture',()=>{
    const w=new Workshop(),first=makePerson(w,CUSTOMERS[0]),second=makePerson(w,CUSTOMERS[1]);
    first.body.rotation.x=.09;
    first.animation.basePitch=.09;
    pose(first,2.3,false,.3,false,true);
    pose(second,2.3,false,.3,false,true);
    expect(first.body.rotation.x).toBeCloseTo(.09);
    expect(first.head.rotation.y).not.toBeCloseTo(second.head.rotation.y);
    expect(first.hand.parent).toBe(first.elbows[1]);
    expect(first.rightArm.rotation.x).toBeCloseTo(-.3);
    w.dispose();
  });

});
