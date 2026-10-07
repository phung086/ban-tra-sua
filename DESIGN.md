---
name: Tiệm Trà — Phố nhỏ
description: A pastel pink, dimensional Vietnamese neighborhood tea shop.
colors:
  primary: "#a04773"
  ink: "#553343"
  muted: "#795b6d"
  paper: "#fff9fc"
  background: "#faedf2"
  border: "#e5c7d5"
  copper: "#ab5d7c"
typography:
  body:
    fontFamily: "Be Vietnam Pro, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: "Be Vietnam Pro, Segoe UI, sans-serif"
    fontSize: "25px"
    lineHeight: 1.25
    letterSpacing: "-0.6px"
rounded:
  button: "9px"
  panel: "12px"
spacing:
  compact: "8px"
  normal: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    height: "44px"
    padding: "10px 13px"
---

# Tiệm Trà — Phố nhỏ

## Overview

**Creative North Star: "Tiệm hồng trong một con hẻm quen"**

Pink pastel is a user requirement for the interface and shop. Real dimensional depth, everyday Vietnamese neighbors and physical service are the other fixed requirements. Procedural stylized 3D supports free movement and service; it does not promise photorealistic people.

The serving tray and table-number ritual governs the experience: read the order, prepare manually, seal, pick up, walk to the assigned counter or table and complete the handoff. This is a playable shop, not a landing page.

**Key Characteristics:**

- Pink counter fluting, pink and cream tiles, rose joinery and striped awning.
- Distinct stainless, glass, ceramic, fabric and wood surfaces.
- Ordinary neighbors with varied ages, body shapes, clothing and small facial differences.
- Readable opaque work panels next to a persistent 3D space.

The existing concept decision remains: neighborhood tea counter; stainless street cart; tiled café; receipt; ground-floor shop; serving tray; noticeboard. Seed e0aa4a37 assigned the sixth system. Ticket wallet, processed film, tiled station hall, cutting bench and live-code floor were declined because their presentation obscures café service. Sticker album contributes visible collection slots only. None supersedes the user's fixed world.

## Colors

Rose is the action color. Pink and warm paper carry the interface and shop; plants and food retain natural colors. Neutral metal uses environment reflections. Avoid green surfaces taking over management panels.

**The Pink Continuity Rule.** The pink identity must survive every room and camera angle.

## Typography

Self-host Be Vietnam Pro at weights 400 and 600 with Vietnamese glyphs. Main headings are 25px, supporting headings 19px, body 14px and small labels 12px. Compact HUD metadata may be smaller; action text must remain readable.

## Layout

Desktop: persistent scene left, scrollable work dock right. Below 900px, stack the scene and dock; the page scrolls naturally. Phone controls remain accessible with 44px minimum button height. Support keyboard, drag-to-look, directional touch buttons, named destination routes and overview floor selection. Overview drag rotates around the shop.

**The Service Location Rule.** Show the current guest and counter/table destination through every crafting and carrying step. Seal and pick up before delivery; only enable handoff near the correct place.

## Elevation & Depth

Real geometry, lighting, contact shadows and restrained procedural textures provide depth. Tools have distinct silhouettes: stainless urn with tap, clear peach dispenser, matcha ceramic pot and rounded oolong teapot. Cups taper, differ in size, show their actual drink and toppings, and use different seal/foam lids. Doors vary across grocery, repair shop, bakery, salon and laundry façades.

Use one capped 30fps scene loop, shared resources and static instancing. Pause hidden/offscreen scenes; cap render resolution and shadow size on phones. Load cached portraits when visible. Dispose contexts, textures, geometry, instanced buffers, observers and listeners.

Motion shows arrival, ordering, walking to a table, sitting, receiving and leaving with the served cup. Reduced motion keeps static poses and brief handoff feedback. Scoring and order timers stay independent of animation.

## Shapes

Soft edges and curved silhouettes belong to practical shop objects. Rounded buttons and panels provide modest lift; avoid decorative dashboard chrome covering the scene. People have articulated rounded limbs and ordinary proportions, not the former anime atlas.

## Components

- StreetWorld: persistent scene, destination controls, carried-cup handoff and accessible fallback.
- Workbench: four manual stations; disabled while the player is away from the counter.
- Customer identity: cached portrait, profession and patience; sixteen save-compatible customers.
- Management panels: stock, equipment, staff, decor, research, reviews, quests and relationships retain existing rules.
- Cup: recipe-driven native 3D model; compact DOM readout repeats measurable preparation state.

## Do's and Don'ts

- **Do** preserve version-3 saves and all economy/progression rules.
- **Do** keep pink visible throughout the world and interface.
- **Do** distinguish objects through shape, material and purpose.
- **Don't** replace varied neighbors with one idealized chibi face.
- **Don't** use duplicated generic vessels as every tool.
- **Don't** claim measured FPS or low-end performance without device measurements.
