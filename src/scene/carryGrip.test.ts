import * as T from 'three';
import {describe,it,expect} from 'vitest';
import {carryGripPitch} from './carryGrip';
import {Workshop,makePerson,makeCup,pose} from './models';
import {CUSTOMERS} from '../game/content';
describe('QC-07 cup grip',()=>{
 it('cancels normal arm pitch and bounds extremes',()=>{
  expect(carryGripPitch(-.6,-.36,true)).toBeCloseTo(.96);
  expect(carryGripPitch(-1.05,-.63,true)).toBeCloseTo(1.4);
  expect(carryGripPitch(NaN,-.3,true)).toBe(0);
  expect(carryGripPitch(-.6,-.36,false)).toBe(0);
 });
 it('keeps cup upright in receiving and walking poses',()=>{
  const w=new Workshop(),p=makePerson(w,CUSTOMERS[0]),cup=makeCup(w);
  p.hand.add(cup.root);
  for(const [t,walking,gesture,phase] of [[0,false,1.05,0],[.05,true,.6,Math.PI/2],[.1,true,.6,3*Math.PI/2]] as const){
   pose(p,t,walking,gesture,false,true,phase,true);
   p.root.updateMatrixWorld(true);
   const up=new T.Vector3(0,1,0).transformDirection(cup.root.matrixWorld);
   expect(up.y).toBeGreaterThan(gesture>1?.95:.98);
  }
  pose(p,.15,false,0,false,true,0,false);
  expect(p.hand.rotation.x).toBe(0);
  w.dispose();
 });
});
