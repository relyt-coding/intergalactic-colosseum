# Intergalactic Colosseum — notes for Claude

3D arena-in-space viewer (three.js 0.170, no bundler) with Maximus Law / VS branding. Used for streams (OBS),
royale-style matches and as a public site. Live via Netlify from `main` of `relyt-coding/intergalactic-colosseum`.

## Shipping ("ship it" / "export")
1. Bump `MODEL_VERSION` in `src/colosseum.js` by exactly ONE patch (v1.0.41 → v1.0.42). Never bump during normal edits.
2. `npm run build` → regenerates root `index.html` (version shows top-left as "MODEL vX").
3. `python3 tools/test/console_check.py` must show no `pageerror`.
4. If the model geometry changed: `npm run export` then `node src/compress.mjs dist/<file>.glb dist/<file>-compressed.glb`.
5. Add a CHANGELOG.md entry, commit, push to `main` (Netlify deploys automatically).
6. Send the user a zip/viewer html as backup, with the version in the file name AND the message.

## File map
- `index.html` — GENERATED, the deployed site. Never hand-edit; edit `src/` and rebuild.
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
- Coplanar/near-coplanar surfaces flicker on phones: keep floor layers ≥ 2–3 cm apart; logarithmic depth is off on phones/weak GPUs.
- NaN pixels blow up the glow pass into black blocks: shaders clamp `1-dot()` before `pow`; a scrub pass runs before bloom.
- User's PC uses Intel HD 630 (weak iGPU): `weakGPU` detection lowers pixels, disables soft shadows/AO by default. Test perf impact of anything new.
- Headless test browser has no GPU — fps numbers there are meaningless; compare triangle/draw-call counts instead.
- `mm` = smoothed match-day amount (0..1); `tickers` = per-frame callbacks; `views` = camera presets; `looks` = Look toggles.

## User preferences
- Version name in every download file name and message. No tiny text on banners/flyers.
- Symmetry around gates (braziers, statues). Wants it to look less "AI": restrained glow, warm stone, gold accent, wear/grime, variation.
