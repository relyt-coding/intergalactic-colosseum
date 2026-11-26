# Changelog

## v1.0.51
- Animal crowd redesigned:
  - **Toucans**: folded wings with dark blue tips, curved orange bill with a yellow ridge and black tip, pale throat + yellow breast, blue eye rings with eyes, tail, red under-tail, blue-grey feet.
  - **Frogs**: smaller and squat (about 2/3 the others' height), folded back legs, front arms, orange feet, big red eyes with slit pupils, mouth line.
  - **Chameleons**: seated with haunches and short front legs, yellow stripe painted round the body, helmet crest, back ridge, turret eyes with pupils, curled tail.
  - **Lemurs**: dark eye patches around amber eyes, dark nose, ears, arms and hands, taller ringed tail with a black tip.
- Detail by distance: animals within 24 m of the camera (16 m on weak graphics, 12 m on phones) use the smooth full version; the rest use a light version without the tiny parts. Re-sorted 4× a second while the camera moves. Overview cost while on: ≈ +326k triangles (1.09M vs 761k), no extra draw calls.

## v1.0.50
- **Animal crowd**: swap the people in the stands for low-poly toucans, frogs, chameleons and lemurs (the four species that compete at the events). Same seats, same size, real colours with the team-colour rim, and they still cheer, do the wave and wave light sticks.
  - `/tyler`: Scene tab → **Animal crowd**. Public page: Scenes → **Animal crowd** toggle. OBS links: add `-animals`. The choice is remembered in the browser.
  - Built only the first time it's turned on. Cost while on: about +255k triangles in the overview (people ≈ 760k total, animals ≈ 1.02M), +12 draw calls.
  - Every part is a solid shape on its own depth; no shared planes.

## v1.0.49
- Fixed the flickering on the back of the VS shield hologram. Its layers (gold VS, blue fill, gold scales) sat ~2 cm apart; now every crest and Maximus emblem in the model gives each layer its own depth band (fronts and backs at least 15% of the crest depth apart), and the hologram crest is thicker (0.3 → 0.8) so the gaps are big in world units too.
- Drift guard: while the camera spins on its own (auto-rotate), it looks 4 m ahead along its path every 0.15 s; if anything solid is there it reverses direction, and if it is boxed in both ways (3 turn-backs in 4 s) it stops spinning. Skipped while you steer, during tours and photo mode. Debug: `__dg()`.
- Model re-exported: `dist/intergalactic-colosseum-v1.0.49-compressed.glb` (1.7 MB).

## v1.0.48
- Casual: the tour video (`lite-tour.mp4`, poster first) plays behind the glass panel while the live 3D loads, with a "Loading the live arena…" pill. It fades out once the 3D has drawn 45 frames (and at least 1.5 s), then the video is unloaded to free memory. Not used on `/tyler` or OBS links.
- Casual panel gets a **Lite** button (shuttle icon) that opens `lite.html`; Lite's "Live 3D" button returns.

## v1.0.47
- Lite mode: `lite.html` plays a pre-rendered Grand Arrival tour (`lite-tour.mp4`, 960×540, 24 fps, 8.5 MB) behind the same glass panel, with Replay / Schedule / Live 3D. The still `lite-poster.jpg` shows if the video can't play.
- Weak-device check at the top of the live page: no WebGL2, software-only graphics, or ≤2 GB memory + ≤2 cores → lite. Casual page also switches if it stays under 12 fps after the automatic step-down. `?live=1` skips the check for the visit; `?lite=1` forces lite. `/tyler` and OBS links are never redirected.
- Schedule moved to `src/events.js` (shared by both pages): reads `https://versusroyale.com/api/public/maximus-events`, falls back to the built-in list.
- Video recipe: `python3 tools/test/render_tour.py 0 45 24 <dir> 960 540` (virtual clock, AO off), then
  `ffmpeg -framerate 24 -i <dir>/%05d.jpg -vf "hqdn3d=6:5:10:10,fade=t=in:st=0:d=0.6,fade=t=out:st=44.2:d=0.8,format=yuv420p" -c:v libx264 -preset slow -crf 30 -movflags +faststart -an lite-tour.mp4`.
- Test scripts open `index.html?live=1` (the headless browser has no GPU).

## v1.0.46
- Replaced the emojis in the casual panel and tour list with a custom gold icon set (generated in Higgsfield, traced to vector paths in `src/icons.json`, gold gradient `#goldG`): galaxy, crossed swords, temple, laurel, shuttle, play, film camera, calendar, sound, muted.

## v1.0.45
- Phone (casual): the panel is now just a bottom bar — Tours · Scenes · Schedule · Sound. Tapping one slides the panel up with that list; tapping it again (or picking a tour/scene) tucks it back down. Desktop unchanged.

## v1.0.44
- Casual (`/`): new frosted-glass "Versus × Maximus Games" panel on the left with the season schedule and a Sign up button per event (all link to versusroyale.com for now; edit `EVENTS` in the viewer template).
- Tours, Scenes and Sound buttons live at the bottom of the panel; Tours/Scenes open their lists inside it.
- Next event is highlighted; past events dim and lose their button automatically.
- Removed the "Intergalactic Colosseum" title (all modes). Phone: panel sits at the bottom, capped at half the screen.

## v1.0.43 — 2026-11-18
- Casual always shows the satellite, spaceport, asteroids, ships and crowd: it ignores saved show/hide choices,
  and the slow-device fallback there only lowers resolution and soft shadows instead of hiding scenery.

## v1.0.42 — 2026-11-18
- Casual public mode at `/`: only Tours + Camera (menu "EXPLORE"), a mute button, no Match day / Celebrate / builder tabs.
- Full builder mode moved to `/tyler` (Netlify rewrite; `#tyler` works for local copies).
- Casual: sound + music on by default (start on first tap/click), music at 1/2 and effects at 1/3 volume.
- Casual: every tour opens with fireworks and confetti.
- Cleaner tour list: icons, short one-line descriptions, duration pills.

## v1.0.41 — 2026-11-18
- First GitHub/Netlify release: site packaged with `netlify.toml`, link-preview image and meta tags.
- Source, build scripts, logo tracing tools and test harness added to the repo.

## Earlier (v1.0.0 – v1.0.40, built in chat)
- Colosseum, floating island, satellite platform, spaceport + ship traffic, statues, booth, VIP suite, camera cranes.
- Tours, match day, royale fighters (2–8), fireworks, sky themes, photo mode, OBS link modes, synthesized sound + DnB music.
- Performance: sky cubemap, galaxy noise texture, wedge culling, statue LOD, Draco GLB, weak-GPU detection.
- Looks: art direction, soft shadows, textures, cinematic grade, moat.
