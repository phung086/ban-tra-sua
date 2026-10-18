import {describe,it,expect} from 'vitest';
import {hairGeometry} from './hairGeometry';
import {easeCameraClearance} from './followCamera';
describe('coherent actor silhouette and camera recovery',()=>{
  it.each(['short','bob','long','bun','bald'] as const)('%s hair has a closed UV seam and finite outward normals',style=>{
    const g=hairGeometry(style),p=g.getAttribute('position'),n=g.getAttribute('normal');
    for(let row=0;row<=18;row++){
      const a=row*33,b=a+32;
      expect(p.getX(a)).toBeCloseTo(p.getX(b),6);expect(p.getZ(a)).toBeCloseTo(p.getZ(b),6);
      expect(n.getX(a)).toBeCloseTo(n.getX(b),6);expect(n.getZ(a)).toBeCloseTo(n.getZ(b),6);
    }
    for(const value of n.array)expect(Number.isFinite(value)).toBe(true);
    expect(n.getZ(9*33)).toBeGreaterThan(0);
    expect(p.count).toBeLessThan(700);g.dispose();
  });
  it('pulls in immediately and recovers smoothly at 30 and 60 fps',()=>{
    expect(easeCameraClearance(1,.2,1/60,true)).toBe(.2);
    const a=easeCameraClearance(.2,1,1/30,true);
    const b=easeCameraClearance(easeCameraClearance(.2,1,1/60,true),1,1/60,true);
    expect(a).toBeCloseTo(b,10);expect(a).toBeGreaterThan(.2);expect(a).toBeLessThan(.4);
    expect(easeCameraClearance(.2,1,1/30,false)).toBe(1);
  });
});
