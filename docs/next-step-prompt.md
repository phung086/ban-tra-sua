# Next step: M1.1k — verify production vehicle collision smoke

Check latest remote SHA and CI. Inspect the new benchmark logs, results.json, images and `M1 VEHICLE COLLISION OK` for both sector16/32 at 390×844/light. Keep NPC dialogue, wall collision, joystick/camera, city return and 10/10 craft/delivery asserts. If vehicle smoke fails, diagnose and fix or revert without bypassing runtime collision, rerun on the corrected SHA. Record actual before/after draw calls, light/balanced P95 and screenshot evidence.

After verifying, continue moving-camera culling and follow triangles (+39.81% light / +52.77% balanced in #37799114768), repeat balanced/follow P95, and prepare real Android RAM 3–4GB plus iPhone 15-minute multitouch/FPS/thermal testing. M1.1 is not accepted until every roadmap gate is evidenced. No M2, merge or deploy.
