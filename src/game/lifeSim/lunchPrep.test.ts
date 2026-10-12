import { describe, expect, it } from 'vitest';
import { createInitialState } from '../engine';
import { wakeMorning, chooseBreakfast, prepareLunch } from './morning';
describe('lunchbox',()=>{it('spends money once',()=>{const g=chooseBreakfast(wakeMorning(createInitialState()),'skip');const a=prepareLunch(g,'lunchbox');expect(a.cash).toBe(g.cash-16000);expect(prepareLunch(a,'lunchbox')).toBe(a);});});
