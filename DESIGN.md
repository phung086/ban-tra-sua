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

The Hanoi-inspired city extends this same world with varied façades, terracotta rooflines, a civic plaza, a community temple and a shaded river promenade. Photographic surface textures add weathering to procedural geometry; articulated people and organic tree silhouettes remain authored game models. The warm-paper notebook and rose controls keep the tea shop readable within the larger setting.

**Key Characteristics:**

- Pink counter fluting, pink and cream tiles, rose joinery and striped awning.
- Distinct stainless, glass, ceramic, fabric and wood surfaces.
- Ordinary neighbors with varied ages, body shapes, clothing and small facial differences.
- Readable opaque work panels next to a persistent 3D space.
- Weathered street surfaces, distinct rooflines and branching trees within the established shop world.

The existing concept decision remains: neighborhood tea counter; stainless street cart; tiled café; receipt; ground-floor shop; serving tray; noticeboard. Seed e0aa4a37 assigned the sixth system. Ticket wallet, processed film, tiled station hall, cutting bench and live-code floor were declined because their presentation obscures café service. Sticker album contributes visible collection slots only. None supersedes the user's fixed world.

## Colors

Rose is the action color. Pink and warm paper carry the interface and shop; plants and food retain natural colors. Neutral metal uses environment reflections. Avoid green surfaces taking over management panels.

**The Pink Continuity Rule.** The pink identity must survive every room and camera angle.

## Typography

Self-host Be Vietnam Pro at weights 400 and 600 with Vietnamese glyphs. Main headings are 25px, supporting headings 19px, body 14px and small labels 12px. Compact HUD metadata may be smaller; action text must remain readable.

## Layout

Shop service on desktop: persistent scene left, scrollable work dock right. At 900px and below, shop service stacks the scene and dock with natural page scrolling. Preparation uses one warm-paper panel with a compact service plan, a two-column facts grid, level progress and a full-width open-shop action.

Neighborhood exploration fills the viewport on desktop and phone. Keep location, time and energy at upper left, compact camera/return/settings controls and a mini-map at upper right, and movement near the lower edge. The notebook collapses on both sizes: a 390px dock at bottom right on desktop and a full-width bottom sheet at 900px and below. On phones, expanding it pauses movement while the player chooses activities. Short landscape viewports use a smaller right-hand notebook and hide the location card. Keep action feedback visible without permanently covering the street.

Phone controls use a circular, camera-relative analog stick with a deadzone and immediate release, with camera swipes on the scene. Keep touch targets at least 44px and respect device safe areas. Support keyboard, named destination routes and overview floor selection. Overview drag rotates around the shop or neighborhood.

Neighborhood conversations use a focused native dialogue with authored choices and remembered consequences. Keep live action feedback visible inside both dialogue and notebook, including job limits, closed hours and ways to recover. Returning to shop closes the notebook and restores movement.

The notebook offers separate An Hòa and full-city map scales. Each scale displays its relevant pins; a shared destination list covers all twelve places. Dialogue identifies the resident's personality and labels warm, playful and brusque choices in text as well as with icons. Longer choices wrap and scroll within the dialogue.

**The Service Location Rule.** Show the current guest and counter/table destination through every crafting and carrying step. Seal and pick up before delivery; only enable handoff near the correct place.

## Elevation & Depth

Real geometry, warm sunlight, cool sky fill, soft contact shadows and weathered surfaces provide depth. Paving, asphalt, bark and roof tiles use bundled CC0 photographic albedo and normal maps, decoded to 512px canvases before scene construction; other surfaces and unavailable photographs use deterministic procedural albedo and normals. The eight original 1k JPEGs total approximately 7.55 MB and are attributed in public/textures/sources.json. Natural foliage silhouettes and geometric lake highlights extend the scene without a separate reflection pass. Tools have distinct silhouettes: stainless urn with tap, clear peach dispenser, matcha ceramic pot and rounded oolong teapot. Cups taper, differ in size, show their actual drink and toppings, and use different seal/foam lids. Doors vary across grocery, repair shop, bakery, salon and laundry façades.

City trees combine tapered trunks, curved branches, roots, irregular canopy volumes and instanced leaf silhouettes. Building façades vary their doors, windows, signs and roofs; the temple uses layered eaves and columns. People add garment seams, small hair strands, fingers and accessories to articulated geometry. These details support conversation-distance readability, without promising photographic people or scanned architecture.

Use one main renderer and one capped 30fps scene loop, shared resources and static instancing. Three.js is the default; Babylon.js loads on selection and uses the same authored scene and gameplay. Dispose the old main renderer before replacement and preserve player position and camera direction. Pause hidden/offscreen scenes; adaptive quality caps DPR, shadow-map resolution and follow-camera distance. Automatic quality starts at Balanced on small screens, with gradual recovery capped at Balanced there; overview keeps its wider camera range. Three.js updates shadows less frequently than scene motion. Load cached portraits when visible. Dispose contexts, textures, geometry, instanced buffers, observers and listeners. Browser rendering samples describe submission work and frame intervals; they do not establish physical-phone performance.

Motion shows arrival, ordering, walking to a table, sitting, receiving and leaving with the served cup. Reduced motion keeps static poses and brief handoff feedback. Scoring and order timers stay independent of animation.

Continuous limb surfaces deform through native GPU skeletons in both renderers. Hands and carried objects follow the elbow, while the player's restrained stride follows actual traveled distance and turns smoothly. During neighborhood exploration, the shop rear wall and awning can cut away when they block the camera-to-player sightline.

## Shapes

Soft edges and curved silhouettes belong to practical shop objects. Rounded buttons and panels provide modest lift; avoid decorative dashboard chrome covering the scene. People have continuous torso and face surfaces, weighted rounded limbs and ordinary proportions. Elbow and knee bends retain a continuous surface rather than separating into stacked parts.

## Components

- StreetWorld: persistent scene, destination controls, carried-cup handoff and accessible fallback.
- Workbench: four manual stations; disabled while the player is away from the counter.
- Customer identity: cached portrait, profession and patience; sixteen save-compatible customers.
- Management panels: stock, equipment, staff, decor, research, reviews, quests and relationships retain existing rules.
- Cup: recipe-driven native 3D model; compact DOM readout repeats measurable preparation state.
- Neighborhood notebook: collapsible warm-paper activity sheet, two map scales and twelve named destinations.
- Resident dialogue: native modal with a cached portrait, personality, saved tone replies, chapter choices and action feedback.
- Movement stick: round rose control with camera-relative analog movement, captured pointer and release-to-stop behavior.
- Sound settings: a full-width music toggle with a visible on/off label, a native rose-accented volume range with percentage output, and a separate sound-effect toggle. Music buttons and the range retain at least 44px height. Disable the range when music is off; show playback or gesture-unlock status in text. Gentle original music lowers during dialogue and pauses in hidden tabs.

## Do's and Don'ts

- **Do** preserve version-3 saves and all economy/progression rules.
- **Do** keep pink visible throughout the world and interface.
- **Do** distinguish objects through shape, material and purpose.
- **Don't** replace varied neighbors with one idealized chibi face.
- **Don't** use duplicated generic vessels as every tool.
- **Don't** claim measured FPS or low-end performance without device measurements.
