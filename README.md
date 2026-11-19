# Intergalactic Colosseum — v1.0.41

A 3D arena in space, presented by Maximus Law. Single-file three.js site.

- `index.html` — the whole site (3D scene, tours, match day, royale fighters)
- `preview.jpg` — link-preview image for social shares
- `netlify.toml` — Netlify settings (no build step)

## Stream / OBS links
Add to the end of the site URL: `#obs`, `#obs-calm`, `#obs-intro`, `#obs-tour` (`-tour-2` loops one),
plus extras `-blue` `-red` `-aurora` `-nocrowd` `-lite` `-music`.

## Updating
Replace `index.html` with a newer version and commit — Netlify redeploys automatically.

## Development
```
npm install
npm run build      # regenerates index.html from src/
npm run export     # optional: GLB model into dist/
```
