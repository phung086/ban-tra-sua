import { describe, it, expect } from 'vitest';
import { createInitialState } from '../engine';
import { wakeMorning, chooseBreakfast } from './morning';
import { visitMorningMarket } from './marketEncounter';
describe('market',()=>{it('charges once',()=>{const game=chooseBreakfast(wakeMorning(createInitialState()),'street');const next=visitMorningMarket(game,'fruit');expect(next.cash).toBe(game.cash-12000);expect(visitMorningMarket(next,'fruit')).toBe(next);});});
