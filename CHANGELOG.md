# Changelog

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
