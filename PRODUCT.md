# Tiệm Trà Chibi

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

A Vietnamese browser/PWA tea-shop game. The player prepares ingredients, opens the shop, reads orders, manually makes drinks, serves customers, and grows the business through equipment, staff, decorations, research and relationships.

## Operating Context

The player works behind the counter and can move around the shop. Dine-in customers receive drinks at tables; takeaway customers receive drinks at the counter. This was explicitly requested on 2026-10-07.

The shop belongs to fictional An Hòa, Hanoi. Mobile is the primary play surface: a round analog joystick, camera swipes, nearby interactions and a collapsible notebook. The connected city has twelve destinations, including four additional districts: Phố Lò Gốm, Quảng trường Đông Phong, Đường ven sông and Sân đình Hạ. Six residents have distinct personalities, authored warm/playful/brusque responses, saved tone preferences and remembered outcomes. Thirty authored mission definitions span three chapters per resident: choose one of two jobs in each of the first two chapters, then complete a tea gathering finale. Those choices allow at most eighteen missions in one playthrough. Subsequent chapters require completing and reporting the previous job; at most three jobs may remain unfinished together. Small jobs, tea deliveries, daily activities, fishing and a twelve-stamp exploration album feed the same shop economy. The user requested this extension and Play Together as a gameplay reference on 2026-10-07.

## Capabilities and Constraints

Existing React/TypeScript/Vite application. Preserve manual dosing, pouring, shaking and sealing; inventory, economy, customer patience, progression, and version-3 saves. New graphics must work on desktop and mobile web. Primary age group and minimum target device are open decisions.

The user requested a stronger visual/UI foundation before more features, with Three.js and Babylon.js support. Renderer selection and quality are presentation preferences; both use the same authored world and gameplay, with one main renderer at a time. Babylon is loaded on demand; device-specific improvement must be measured rather than inferred from the library name.

Richer city detail uses procedural buildings, branching trees, articulated people and shared materials. Bundled CC0 photographic albedo and normal maps cover paving, asphalt, bark and roof tiles; runtime surfaces are downsampled to 512px, while the eight original 1k JPEGs total approximately 7.55 MB. This does not establish photorealistic people or architecture. Physical-phone FPS and sustained mobile performance remain unmeasured.

The character, movement and audio refinement preserves this world. Continuous torso and face geometry and GPU-skinned limb surfaces replace exposed elbow and knee joins; hands and carried props follow the elbow skeleton. The player uses a smaller stride synchronized to actual distance. Swept circle movement checks physical building and prop footprints and full oriented vehicle bounds; traffic yields and blocked destination routes can detour. Shop rear-wall and awning cutaways preserve the camera sightline during neighborhood exploration.

An original gentle, cheerful eight-bar melody at 88 BPM uses a shared Web Audio context with separate music and sound-effect gains. A pointer or keyboard gesture unlocks playback. Music has its own saved on/off preference and volume, initially 45%; dialogue lowers it, a hidden tab suspends audio, and teardown closes the context and removes scheduling and listeners. Audio settings remain separate from version-3 gameplay saves.

## Brand Commitments

Temporary product name: TIỆM TRÀ CHIBI. Vietnamese language and an original Vietnamese neighborhood setting. Pink pastel is explicitly required for both UI and the shop, reaffirmed on 2026-10-07. Replace anime/chibi characters with dimensional, varied ordinary Vietnamese people, clothing and faces. Everyday objects need distinct shapes and materials, with simple arrival/order/receipt/departure animation.

## Evidence on Hand

Original user brief in the attached Pasted text.txt; existing playable source, customer data, economy and integration tests. Fictional customers are game content, not real testimonials.

## Product Principles

- Manual craft remains the main skill.
- Walking and serving should connect the player to the shop and its customers.
- Preserve progress through visual redesigns.
- Represent ordinary neighborhood life with variety.

## Users

Inferred from the explicit brief: players who enjoy a relaxed Vietnamese shop-management and crafting game. Audience demographics remain undecided.
