# Iteration T3-02 — recurring household utilities bill

- Baseline main SHA: e1b3bda53dac08a0689dbbfd8fb9ff3cd01566fa
- Branch: codex/life-recurring-bills-20261021
- Scope: one optional 30-day utility bill, daily VND reserve, once-only payment and a no-cost extension when the wallet cannot cover the shortfall.
- Runtime integration: EveningCarePanel shows the budget card after the shift; choices use existing v3 reward IDs, story log and city journal, preserving save v3 without a schema bump.
- Amounts are fictional gameplay calibration, not real-world price claims.
- Gates: Vitest, build, browser smoke and screenshot/console checks are pending until the branch CI runs on the exact final SHA.
- No merge/release until exact-SHA CI and browser regression are green.
