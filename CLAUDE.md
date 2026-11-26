# Intergalactic Colosseum — notes for Claude

3D arena-in-space viewer (three.js 0.170, no bundler) with Maximus Law / VS branding. Used for streams (OBS),
royale-style matches and as a public site. Live via Netlify from `main` of `relyt-coding/intergalactic-colosseum`.

## Shipping ("ship it" / "export")
1. Bump `MODEL_VERSION` in `src/colosseum.js` by exactly ONE patch (e.g. v1.0.42 → v1.0.43). Never bump during normal edits.
2. `npm run build` → regenerates root `index.html` (version shows top-left as "MODEL vX").
3. `python3 tools/test/console_check.py` must show no `pageerror`.
4. If the model geometry changed: `npm run export` then `node src/compress.mjs dist/<file>.glb dist/<file>-compressed.glb`.
5. Add a CHANGELOG.md entry, commit, push to `main` (Netlify deploys automatically).
6. Send the user a zip/viewer html as backup, with the version in the file name AND the message.

## Modes
- `/` = CASUAL (public): Tours + Camera tabs only, mute button, audio on by default (after first gesture), tours start with fireworks.
- `/tyler` (Netlify rewrite in netlify.toml) or `#tyler` = FULL builder mode with every feature. Flags: `CASUAL` / `FULL`, body class `casual`/`full`.

## File map
- `index.html`, `lite.html` — GENERATED (the deployed site). Never hand-edit; edit `src/` and rebuild.
- `lite.html` (from `src/lite.template.html`) — tour video (`lite-tour.mp4`, poster `lite-poster.jpg`) behind the glass panel for weak devices.
  The check is the inline script at the top of the viewer template (no WebGL2 / software GL / ≤2 GB+≤2 cores) plus the
  casual fps check (<12 fps twice after the step-down). `?live=1` skips it for the visit, `?lite=1` forces it.
  Re-render the video after big visual changes: `python3 tools/test/render_tour.py 0 45 24 /tmp/frames 960 540` (~50 min) then ffmpeg (see CHANGELOG v1.0.47).
- Loading: casual shows `#preVid` (the tour video) until the 3D has drawn 45 frames; Lite button `#eLite` in the panel.
- Animal crowd (v1.0.50): `SPECIES` in the crowd block builds toucan / frog / chameleon / lemur from small solid parts (`ell`, `cone`, `part`), merged per species,
  instanced per seating section; `crowd.userData.setAnimals(on)`, UI `setAnimalCrowd()`, `#tAnimals` / `#eAnimals`, hash `-animals`, localStorage `colosseum-animals`.
- `src/events.js` — schedule shared by both pages: Versus feed `/api/public/maximus-events`, falls back to `FALLBACK_EVENTS`.
- `src/icons.json` — gold vector icon set (traced from a Higgsfield sheet); `icon(name)` renders it with the `#goldG` gradient.
- `src/colosseum.js` — procedural geometry (`buildColosseum(THREE, mergeGeometries, logos, opts)`); materials `M`; groups merged per material.
  `opts.slice` cuts ring meshes into 8 wedges (viewer only), `opts.lod` adds `StatuesLow`. Also used by the GLB exporter.
- `src/viewer.template.html` — viewer: renderer, sky cubemap, galaxy panels, post (AO, glow, cinematic), tours, match day,
  royale fighters, crowd, ships, sound/music (WebAudio, synthesized), menus. `/*__COLOSSEUM__*/` and `__VERSION__` are build placeholders.
- `src/logos.json` — traced vector logos (scales, maxIcon, vs, wordmark). Regenerate with `tools/trace.py` from `tools/logo-source/`.
- `src/export.mjs`, `src/compress.mjs` — GLB export + Draco compression into `dist/` (gitignored).
- `tools/test/` — Playwright harness (headless Chrome, SwiftShader). `shot.py` takes view snapshots
  (`python3 tools/test/shot.py "js=..." overview=6000 snap=name`); `drawcalls.py` reports calls/triangles per view.

## Gotchas (learned the hard way)
- iPhone: never change renderer pixel ratio mid-session (blanks screen). Resolution is fixed at load (Quality setting reloads).
- Startup order: menu tab is restored on load; anything it renders must exist (v1.0.34 crash: Fighters tab before fighter code → `fightersReady` flag).
- NEVER put two surfaces on the same (or nearly the same) plane — Tyler's rule, it always flickers. Give every layer its own depth band, big in world units
  (crests: layers ≥ 15% of the crest depth apart; floor layers ≥ 2–3 cm apart). Logarithmic depth is off on phones/weak GPUs, so this matters most there.
- Auto-rotate has a drift guard (`driftGuard`, v1.0.49): add new solid scenery to the scene graph normally and it's covered; transparent/glow groups are skipped by name.
- NaN pixels blow up the glow pass into black blocks: shaders clamp `1-dot()` before `pow`; a scrub pass runs before bloom.
- User's PC uses Intel HD 630 (weak iGPU): `weakGPU` detection lowers pixels, disables soft shadows/AO by default. Test perf impact of anything new.
- Headless test browser has no GPU, so the page would redirect to lite: every test script opens `index.html?live=1`.
- Headless test browser has no GPU — fps numbers there are meaningless; compare triangle/draw-call counts instead.
- `mm` = smoothed match-day amount (0..1); `tickers` = per-frame callbacks; `views` = camera presets; `looks` = Look toggles.

## Shared knowledge vault
Tyler's vault (on his PC, `~/knowledge-vault`, shared with OpenCode) has this project at
`knowledge/projects/intergalactic-colosseum/README.md`. Follow its CLAUDE.md: plain language, short staging notes,
never commit the vault (OpenCode backs it up), talk to OpenCode through `_bridge/`.

## User preferences
- Version name in every download file name and message. No tiny text on banners/flyers.
- Symmetry around gates (braziers, statues). Wants it to look less "AI": restrained glow, warm stone, gold accent, wear/grime, variation.
