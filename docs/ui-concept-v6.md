# Tea Counter Theater v6

Experimental visual direction for `feat/immersive-tea-counter-v6`.

## Why v5 was not enough

The v5 pass fixed proportions, readability and touch targets, but the composition still read like a polished web dashboard. The v6 direction changes the visual metaphor itself.

## Core metaphor: a physical tea counter

The screen is staged as one shop environment rather than a pile of independent cards:

- **Customer stage**: character, dialogue and shop ambience are the main scene.
- **Receipt board**: the order behaves visually like a pinned paper receipt on a wooden clipboard.
- **POS/readiness display**: order validation becomes a dark counter display rather than another white card.
- **Brew bench**: the whole crafting section becomes one physical counter surface.
- **Current drink pedestal**: the cup is visually central and persistent.
- **Ingredient drawers**: control groups look like trays/compartments rather than generic form cards.
- **Sticker dock**: navigation becomes a playful game dock instead of a standard mobile tab bar.

## Composition

Desktop:
1. Customer stage ~65%
2. Receipt board ~35%
3. Full-width brew bench underneath
4. Cup anchored on the left side of the bench
5. Ingredient/tool trays on the right

Tablet:
- customer and receipt stack;
- cup stays prominent;
- craft trays collapse into fewer columns.

Mobile:
- one-column stage;
- receipt under customer;
- cup then tool drawers;
- nav stays within safe-area reach.

## Reference synthesis

### Good Coffee, Great Coffee / Good Pizza, Great Pizza

The strongest transferable pattern is not their exact art style. It is that the **thing being made** and the **physical station** dominate the view. UI exists around the work surface rather than replacing it.

### Coffee Talk

The useful lesson is staging: customer, counter and atmosphere create a strong place identity. Conversation is part of the shop scene rather than a detached panel.

### Campfire Cat Cafe

The useful lesson is environmental UI: characters, rewards and actions live inside a coherent illustrated place. The screen feels like a world first and an interface second.

### Apple HIG / game controls

Primary controls need to remain large, reachable and contextual. Immersive styling cannot come at the cost of legibility or touch usability.

### NN/g recognition over recall

Normal play keeps order information visible. Memory mechanics remain optional. The visual overhaul should lower cognitive load, not create decorative ambiguity.

## Non-goals

- No change to gameplay rules.
- No change to save format.
- No change to economy/scoring.
- No replacement of the separate art-direction branch.
- No merge into other active branches.

## Files

- `src/App.tsx`: class hooks only.
- `src/styles-v6-theater.css`: visual composition.
- `src/main.tsx`: one import.
- port config and v5 layout inherited from the isolated parent branch.
