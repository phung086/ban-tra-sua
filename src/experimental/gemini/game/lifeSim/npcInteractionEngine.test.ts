import { describe, it, expect } from 'vitest';
import {
  applyOrderRecoveryChoice,
  applySocialInviteChoice,
  buildEndOfDaySummary,
  buildSocialInviteScenario,
  createInitialInteractionLedger,
  evaluateOrderDelivery,
} from './npcInteractionEngine';

describe('npcInteractionEngine — Order Recovery, Social Bill-Split & End-of-Day', () => {
  it('flags mismatched sweetness for Linh and provides 3 recoverable options without hard softlock', () => {
    const assessment = evaluateOrderDelivery({
      orderId: 'ord-101',
      npcId: 'linh',
      basePrice: 35000,
      targetSweetness: 30,
      actualSweetness: 100,
      targetIce: 50,
      actualIce: 50,
      targetTopping: 'jelly',
      actualTopping: 'jelly',
      pourFillRatio: 1.0,
      elapsedSeconds: 28,
    });

    expect(assessment.needsRecovery).toBe(true);
    expect(assessment.issues).toContain('sweetness_mismatch');
    expect(assessment.recoveryOptions).toHaveLength(3);
    expect(assessment.recoveryOptions.map((o) => o.id)).toEqual([
      'remake_quick',
      'partial_discount',
      'full_refund_voucher',
    ]);
  });

  it('prevents double-charging or double-crediting on save reload (idempotency contract)', () => {
    const ledger0 = createInitialInteractionLedger({ day: 3, cash: 100000 });
    const scenario = buildSocialInviteScenario({
      inviteId: 'inv-lan-dinner',
      day: 3,
      npcId: 'lan',
      playerCash: ledger0.cash,
      totalMealCost: 70000,
    });

    // Does not deduct money before applySocialInviteChoice is called
    expect(ledger0.cash).toBe(100000);

    const ledger1 = applySocialInviteChoice(ledger0, scenario, 'split_bill');
    expect(ledger1.cash).toBe(65000);
    expect(ledger1.spentToday).toBe(35000);

    // Second call with same inviteId after reload must be a no-op
    const ledger2 = applySocialInviteChoice(ledger1, scenario, 'split_bill');
    expect(ledger2.cash).toBe(65000);
    expect(ledger2.spentToday).toBe(35000);
  });

  it('synthesizes end-of-day summary with encounters, lessons learned, and tomorrow callbacks', () => {
    let ledger = createInitialInteractionLedger({ day: 4, cash: 120000 });
    const assessment = evaluateOrderDelivery({
      orderId: 'ord-phuc-1',
      npcId: 'phuc',
      basePrice: 40000,
      targetSweetness: 50,
      actualSweetness: 50,
      targetIce: 70,
      actualIce: 70,
      targetTopping: 'boba',
      actualTopping: 'pudding',
      pourFillRatio: 0.82,
      elapsedSeconds: 40,
    });

    ledger = applyOrderRecoveryChoice(ledger, assessment, 'remake_quick');
    const summary = buildEndOfDaySummary(ledger);

    expect(summary.earnedCash).toBe(40000);
    expect(summary.encounters).toHaveLength(1);
    expect(summary.encounters[0].npcId).toBe('phuc');
    expect(summary.lessonsLearned.length).toBeGreaterThan(0);
    expect(summary.tomorrowConsequences.length).toBeGreaterThan(0);
    expect(summary.readyToSleepAndSave).toBe(true);
  });
});
