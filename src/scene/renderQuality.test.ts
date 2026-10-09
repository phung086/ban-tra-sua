import {describe,it,expect} from 'vitest';
import {AdaptiveQuality,castCityShadow,constrainedHardware,mobileViewport} from './renderQuality';
describe('adaptive scene quality',()=>{
  it('detects rotated touch phones without misclassifying wide desktop windows',()=>{
    expect(mobileViewport(390,844,true)).toBe(true);
    expect(mobileViewport(844,390,true)).toBe(true);
    expect(mobileViewport(1280,800,false)).toBe(false);
    expect(mobileViewport(844,390,false)).toBe(false);
    expect(mobileViewport(360,800,false)).toBe(true);
  });
  it('starts constrained devices at light, retains that ceiling, honors manual overrides',()=>{
    expect(constrainedHardware(4,8)).toBe(true);
    expect(constrainedHardware(undefined,4)).toBe(true);
    expect(constrainedHardware(undefined,undefined)).toBe(false);
    expect(constrainedHardware(0,0)).toBe(false);
    expect(constrainedHardware(8,8)).toBe(false);
    const slowPhone=new AdaptiveQuality('auto',true,true);
    expect(slowPhone.profile.id).toBe('light');
    for(let i=0;i<600;i++)slowPhone.sample(34,7);
    expect(slowPhone.profile.id).toBe('light');
    const manual=new AdaptiveQuality('high',true,true);
    expect(manual.profile.id).toBe('high');
    const unknown=new AdaptiveQuality('auto',true,false);
    expect(unknown.profile.id).toBe('balanced');
  });
  it('keeps shadows in follow/indoor/balanced and omits only optimized light overview',()=>{
    expect(castCityShadow('light',true,true,16)).toBe(true);
    expect(castCityShadow('light',true,true,32)).toBe(false);
    expect(castCityShadow('light',true,false,32)).toBe(true);
    expect(castCityShadow('light',false,true,32)).toBe(true);
    expect(castCityShadow('balanced',true,true,32)).toBe(true);
    expect(castCityShadow('high',true,true,32)).toBe(true);
  });
  it('reduces sustained slow frames and keeps a light floor',()=>{
    const quality=new AdaptiveQuality('auto',false);
    for(let i=0;i<90;i++)quality.sample(65,28);
    expect(quality.profile.id).toBe('balanced');
    for(let i=0;i<180;i++)quality.sample(65,28);
    expect(quality.profile.id).toBe('light');
  });
  it('needs a long stable recovery and respects the mobile ceiling',()=>{
    const quality=new AdaptiveQuality('auto',true);
    for(let i=0;i<90;i++)quality.sample(65,28);
    for(let i=0;i<449;i++)quality.sample(34,7);
    expect(quality.profile.id).toBe('light');
    quality.sample(34,7);expect(quality.profile.id).toBe('balanced');
    for(let i=0;i<600;i++)quality.sample(34,7);
    expect(quality.profile.id).toBe('balanced');
  });
  it('ignores background gaps and honors a manual choice',()=>{
    const quality=new AdaptiveQuality('auto',false);
    for(let i=0;i<200;i++){quality.sample(1000,5);quality.sample(NaN,30);}
    expect(quality.profile.id).toBe('high');
    const manual=new AdaptiveQuality('high',true);
    for(let i=0;i<200;i++)manual.sample(65,30);
    expect(manual.profile.id).toBe('high');
  });
  it('recovers from severe actual rendering stalls instead of treating them as tab gaps',()=>{
    const quality=new AdaptiveQuality('auto',false);
    for(let i=0;i<12;i++)quality.sample(400,150);
    expect(quality.profile.id).toBe('balanced');
  });
});
