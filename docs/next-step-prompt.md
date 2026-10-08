# Next step: M1.1m — investigate follow-sector culling after benchmark success

Check latest remote SHA and CI (including benchmark script syntax preflight). Inspect the new M1 benchmark run, `results.json.failures`, `M1 IMAGE` capture-source logs, and directly compare before/after overview and follow screenshots at 390×844 light/balanced; confirm 1280×800 follow image that timed out in #37807971947. If the page capture falls back, label it canvas-only (not HUD evidence). If both capture paths fail, fix without hiding the failure.

Recheck overview light >=40% draw-call reduction and P95 interval <=+10% under matched production Chromium/viewport. Report balanced overview/follow variance and increased follow triangles (+43.81% light / +50.16% balanced in #37807971947); investigate moving-camera sector culling/pop-in without sacrificing overview. Preserve NPC dialogue, wall and vehicle collision, joystick/camera, 360×800 return and 10/10 craft/delivery smoke. If a regression persists, optimize or revert with measurements. Run tests/build, commit/push and verify CI green on exact SHA.

M1.1 remains unaccepted until all roadmap gates, including 15-minute Android 3–4GB and iPhone real-device multitouch/FPS/P95/thermal/memory checks, are satisfied. No M2, merge or deploy.
