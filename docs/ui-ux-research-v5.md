# UI/UX + Gameplay Research v5

Branch: `feat/dev-port-ui-layout-v5-isolated`

This branch is intentionally isolated from the active gameplay, memory-training, spatial-interaction, and art-direction branches.

## Development ports

- Vite dev server: **4317**
- Vite preview server: **4318**
- `strictPort: true` is enabled so the project fails loudly instead of silently jumping onto another occupied port.

## Current UX diagnosis

The current build has strong feature depth, but the visual hierarchy is weaker than the gameplay depth. The main problems are:

1. **Primary play surface is underweighted on desktop.** The live shop/order column can become visually narrow while the workstation grows very wide.
2. **Too many labels are 6–10 px.** This makes the interface feel like a prototype rather than a finished game and creates readability problems.
3. **Touch targets are inconsistent.** Some compact controls are below common 44–48 point/dp recommendations.
4. **Spacing is locally dense but globally loose.** Cards contain tight micro-spacing while large page areas have inconsistent proportions, creating an unbalanced composition.
5. **Information hierarchy competes with itself.** HUD, status, order, performance, hints, checklist, and crafting controls often have similar visual weight.
6. **The cup/drink preview is too secondary.** In a drink-making game, the product being crafted should remain a visual anchor.
7. **Responsive behavior needs a stronger breakpoint strategy.** Layout should deliberately switch between desktop two-column workbench, tablet stacked/hybrid layout, and mobile single-column play.

## Design direction applied by this branch

### 1. Make the game scene and workstation feel like one workbench

Desktop layout uses a more balanced roughly **44/56 split** rather than letting the left play context collapse. The customer/order side remains large enough to scan while crafting.

### 2. Make the crafted drink a persistent visual anchor

On larger screens, the cup preview becomes a dedicated sticky column inside the workstation. This mirrors successful cooking/café games where the active food/drink object remains central while tools surround it.

### 3. Increase legibility before adding decoration

Text and interaction sizing are raised before adding more visual ornaments. The target is to make the existing content readable and tappable first.

### 4. Establish a spacing system

The override introduces a small spacing/radius/surface token layer so cards and controls feel related rather than individually styled.

### 5. Preserve recognition-first normal gameplay

Order information remains visible in normal play. Memory/recall mechanics can remain an optional challenge mode, rather than making the base interface depend on memorization.

### 6. Strengthen responsive layout

- Desktop: two-column customer/workstation layout.
- Large desktop: wider live scene and 3-column stock.
- Tablet: stacked game columns but two-column craft interior where space allows.
- Mobile: single-column crafting, 2-column drink selection, compact HUD, 5-item bottom navigation with safe-area spacing.

## Gameplay references

### Good Coffee, Great Coffee — TapBlaze

Reference:
https://tapblaze.com/gcgc/
https://tapblaze.com/gcgc/press/

Useful lessons:
- Cozy hand-drawn pastel art supports the fantasy, but the core loop still centers on making the drink.
- Story, customer personality, shop customization, equipment upgrades, and order efficiency all reinforce the same café-owner fantasy.
- The station layout keeps physical equipment and ingredients visually connected to the action rather than presenting everything as generic forms/cards.

### Good Pizza, Great Pizza — TapBlaze lineage

The useful pattern is the **work-surface-first** structure: the food object and ingredients dominate the play area, while HUD/status remain compact. This project should preserve the chibi shop scene, but give the drink and tools a similarly strong gameplay hierarchy.

### Restaurant/café simulation loop

The strongest loop for this project remains:
customer intent → read order → physically prepare → visually verify → serve → immediate reaction/reward → progression/customization.

New systems should reinforce one of those steps rather than becoming independent dashboard widgets.

## UI/UX references and concrete implications

### Nielsen Norman Group — 10 Usability Heuristics
https://www.nngroup.com/articles/ten-usability-heuristics/

Apply:
- Visibility of system status: show current order, progress, selected ingredient, readiness, and result clearly.
- Recognition rather than recall: normal mode should keep required information visible/retrievable.
- Aesthetic/minimalist design: secondary systems should not compete with the current order and active craft action.

### Nielsen Norman Group — Heuristics applied to video games
https://www.nngroup.com/articles/usability-heuristics-applied-video-games/

Apply:
- Show controls/information when they are contextually useful.
- Avoid making players memorize controls or order details unless memory is intentionally the challenge.

### Apple HIG — Designing for games
https://developer.apple.com/design/human-interface-guidelines/designing-for-games/

Apply:
- Keep game text legible across displays.
- Keep primary touch controls around the recommended 44×44 pt minimum.
- Prioritize the playable content instead of surrounding it with UI chrome.

### Apple HIG — Game controls
https://developer.apple.com/design/human-interface-guidelines/game-controls

Apply:
- Put frequent controls in comfortable reach.
- Keep clear pressed/focus states.
- Respect safe areas and device edges.

### Android accessibility guidance
https://developer.android.com/design/ui/mobile/guides/foundations/accessibility

Apply:
- Aim for at least 48 dp touch targets.
- Do not make gestures the only way to complete an action.
- Use visual feedback in addition to haptics.

### W3C WCAG contrast
https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum

Apply:
- Small text should generally reach 4.5:1 contrast.
- Avoid pale pink/gray microcopy on white when it carries gameplay information.

### Game Accessibility Guidelines
https://gameaccessibilityguidelines.com/basic/

Apply:
- Controls should be large and well spaced on touch screens.
- Use readable default text sizing and clear formatting.
- Don’t rely on color alone for essential state.

### Unity multi-resolution/safe-area documentation
https://docs.unity3d.com/Manual/HOWTO-UIMultiResolution.html
https://docs.unity3d.com/ScriptReference/Screen-safeArea.html

Even though this project is React/Vite rather than Unity, the transferable lesson is useful: design against multiple aspect ratios, scale/anchor intentionally, and keep critical controls inside safe areas.

## Visual-reference observations

The screenshots reviewed from café/restaurant simulation games repeatedly show:
- A **dominant physical work surface**, not a dashboard of equal-weight cards.
- A **small persistent HUD** for money/day/satisfaction.
- Ingredients grouped spatially near the preparation object.
- Large readable customer/order communication.
- Pastel/cozy art used as atmosphere while interactive elements keep stronger outlines/contrast.

This branch does not copy any source artwork or layout. The references are used only to derive general interaction and hierarchy principles.

## Next recommended art-direction pass

The active art-direction branch can independently address:
- bespoke illustrated panels and shop props;
- icon/asset consistency;
- stronger character staging;
- richer backgrounds and decorative depth;
- custom typography.

This isolated layout branch deliberately stays focused on proportions, readability, spacing, responsiveness, and touch ergonomics.
