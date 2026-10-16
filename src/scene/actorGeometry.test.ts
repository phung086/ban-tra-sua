import * as T from 'three';
import {describe,it,expect} from 'vitest';
import {Workshop,makePerson,pose} from './models';
import {CUSTOMERS} from '../game/content';
import {advanceNpcLocomotion,initialNpcLocomotion} from './npcLocomotion';

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

  it('animates real eye meshes through a blink and restores them for reduced motion',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    const interval=3.7+person.animation.seed*1.4;
    const start=(2-person.animation.seed)*interval-.22;
    const white=person.eyes[0],pupil=person.eyes[1];
    const whiteHeight=white.userData.blinkHeight as number;
    const pupilHeight=pupil.userData.blinkHeight as number;
    pose(person,start,false,0,false,true);
    expect(white.scale.y).toBeCloseTo(whiteHeight);
    pose(person,start+.22*.43,false,0,false,true);
    expect(white.scale.y).toBeCloseTo(whiteHeight*.12);
    expect(pupil.scale.y).toBeCloseTo(pupilHeight*.12);
    pose(person,start+.22,false,0,false,true);
    expect(white.scale.y).toBeCloseTo(whiteHeight);
    pose(person,start+.22*.43,false,0,false,false);
    expect(white.scale.y).toBeCloseTo(whiteHeight);
    expect(pupil.scale.y).toBeCloseTo(pupilHeight);
    w.dispose();
  });

  it('keeps both pupil meshes aligned and returns to center on walking or reduced motion',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    const pupils=[person.eyes[1],person.eyes[3]];
    const rest=pupils.map(eye=>({x:eye.position.x,y:eye.position.y}));
    const whites= [person.eyes[0],person.eyes[2]].map(eye=>eye.position.x);
    let moved=false;
    for(let frame=0;frame<360;frame++){
      pose(person,frame/30,false,0,false,true);
      const dx=pupils[0].position.x-rest[0].x;
      if(Math.abs(dx)>0.001){
        expect(pupils[1].position.x-rest[1].x).toBeCloseTo(dx,8);
        expect(pupils[1].position.y-rest[1].y).toBeCloseTo(pupils[0].position.y-rest[0].y,8);
        moved=true;
        break;
      }
    }
    expect(moved).toBe(true);
    expect([person.eyes[0],person.eyes[2]].map(eye=>eye.position.x)).toEqual(whites);
    pose(person,20,true,0,false,true);
    expect(pupils.map(eye=>eye.position.x)).toEqual(rest.map(eye=>eye.x));
    pose(person,20.1,false,0,false,false);
    expect(pupils.map(eye=>eye.position.y)).toEqual(rest.map(eye=>eye.y));
    w.dispose();
  });

  it('reduces real leg swing and knee bend during a pivot without changing walk cadence',()=>{
    const w=new Workshop(),straight=makePerson(w,CUSTOMERS[0]),turn=makePerson(w,CUSTOMERS[0]);
    for(let frame=0;frame<=30;frame++){
      const time=frame/30;
      pose(straight,time,true,0,false,true,Math.PI/2,false,1);
      pose(turn,time,true,0,false,true,Math.PI/2,false,.45);
    }
    expect(turn.animation.walkWeight).toBeCloseTo(straight.animation.walkWeight);
    expect(Math.abs(turn.leftLeg.rotation.x)).toBeLessThan(Math.abs(straight.leftLeg.rotation.x)*.6);
    expect(turn.knees[0].rotation.x).toBeLessThan(straight.knees[0].rotation.x*.6);
    expect(turn.animation.turnStride).toBeLessThan(.55);
    pose(turn,1.1,true,0,false,false,Math.PI/2,false,.45);
    expect(turn.leftLeg.rotation.x).toBe(0);
    w.dispose();
  });
  it('holds the shorter braking step while settling to a stationary pose',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    for(let frame=0;frame<=25;frame++)
      pose(person,frame/30,true,0,false,true,Math.PI/2,false,1);
    const cruise=person.animation.turnStride;
    pose(person,.9,true,0,false,true,Math.PI/2,false,.3);
    const braking=person.animation.turnStride;
    expect(braking).toBeLessThan(cruise);
    expect(braking).toBeGreaterThan(.3);
    const lastSwing=Math.abs(person.leftLeg.rotation.x);
    pose(person,.95,false,0,false,true,Math.PI/2,false,1);
    expect(person.animation.turnStride).toBeCloseTo(braking,8);
    expect(Math.abs(person.leftLeg.rotation.x)).toBeLessThan(lastSwing);
    for(let frame=1;frame<=18;frame++)
      pose(person,.95+frame/30,false,0,false,true,Math.PI/2,false,1);
    expect(Math.abs(person.leftLeg.rotation.x)).toBeLessThan(.001);
    pose(person,1.6,false,0,false,false,Math.PI/2);
    expect(person.leftLeg.rotation.x).toBe(0);
    w.dispose();
  });
  it('starts with smaller real mesh leg motion than a settled walking stride',()=>{
    const w=new Workshop(),starting=makePerson(w,CUSTOMERS[0]),cruising=makePerson(w,CUSTOMERS[0]);
    const spawn=advanceNpcLocomotion(initialNpcLocomotion(),0,0,0,true,true,1/30).next;
    const launch=advanceNpcLocomotion(spawn,0,.08,0,true,true,1/30);
    expect(launch.strideScale).toBeLessThan(.7);
    for(let frame=0;frame<=30;frame++){
      const time=frame/30;
      pose(starting,time,true,0,false,true,Math.PI/2,false,launch.strideScale);
      pose(cruising,time,true,0,false,true,Math.PI/2,false,1);
    }
    expect(Math.abs(starting.leftLeg.rotation.x)).toBeLessThan(Math.abs(cruising.leftLeg.rotation.x)*.75);
    expect(starting.knees[0].rotation.x).toBeLessThan(cruising.knees[0].rotation.x*.75);
    w.dispose();
  });

  it('settles real NPC leg and knee meshes before restarting from a planted stance',()=>{
    const w=new Workshop(),person=makePerson(w,CUSTOMERS[0]);
    let state=advanceNpcLocomotion(initialNpcLocomotion(),0,0,0,true,true,1/30).next;
    pose(person,0,false,0,false,true,state.gaitPhase);
    for(let frame=1;frame<=5;frame++){
      const r=advanceNpcLocomotion(state,0,frame*.1,0,true,true,1/30);
      state=r.next;
      pose(person,frame/30,r.stepping,0,false,true,state.gaitPhase,false,r.strideScale);
    }
    for(let frame=6;frame<=21;frame++){
      const r=advanceNpcLocomotion(state,0,.5,0,false,true,1/30);
      state=r.next;
      pose(person,frame/30,r.stepping,0,false,true,state.gaitPhase,false,r.strideScale);
    }
    expect(Math.abs(state.gaitPhase-Math.PI)).toBeLessThan(.001);
    expect(Math.abs(person.leftLeg.rotation.x)).toBeLessThan(.01);
    expect(Math.abs(person.rightLeg.rotation.x)).toBeLessThan(.01);
    expect(person.knees.every(k=>Math.abs(k.rotation.x)<.01)).toBe(true);
    const restart=advanceNpcLocomotion(state,0,.51,0,true,true,1/30);
    pose(person,22/30,restart.stepping,0,false,true,restart.next.gaitPhase,false,restart.strideScale);
    expect(Math.abs(person.leftLeg.rotation.x)).toBeLessThan(.04);
    expect(Math.abs(person.rightLeg.rotation.x)).toBeLessThan(.04);
    w.dispose();
  });

});
