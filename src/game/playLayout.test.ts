import { describe, expect, it } from 'vitest';
import { layoutIsMobile, selectPlayLayout } from './playLayout';

describe('auto-fit play layout',()=>{
  it('keeps phone portrait and landscape playable, including >900px landscape phones',()=>{
    expect(selectPlayLayout(360,800,true)).toBe('portrait');
    expect(selectPlayLayout(390,844,true)).toBe('portrait');
    expect(selectPlayLayout(844,390,true)).toBe('landscape');
    expect(selectPlayLayout(932,430,true)).toBe('landscape');
    expect(selectPlayLayout(1024,480,true)).toBe('landscape');
    expect(selectPlayLayout(667,375,true)).toBe('landscape');
  });
  it('preserves wide desktop and tablet layouts where height permits',()=>{
    expect(selectPlayLayout(1440,900,false)).toBe('desktop');
    expect(selectPlayLayout(1024,768,false)).toBe('desktop');
    expect(selectPlayLayout(1180,820,true)).toBe('desktop');
    expect(selectPlayLayout(820,1180,true)).toBe('portrait');
  });
  it('supports short desktop windows and invalid resize measurements',()=>{
    expect(selectPlayLayout(1024,540,false)).toBe('landscape');
    expect(selectPlayLayout(1440,500,false)).toBe('desktop');
    expect(selectPlayLayout(0,0,true)).toBe('desktop');
    expect(selectPlayLayout(NaN,390,true)).toBe('desktop');
    expect(layoutIsMobile('landscape')).toBe(true);
    expect(layoutIsMobile('portrait')).toBe(true);
    expect(layoutIsMobile('desktop')).toBe(false);
  });
});
