// Builds ../index.html (live 3D) and ../lite.html (tour video for weak devices). Run: npm run build
import fs from 'fs';
const here = f => new URL(f, import.meta.url);
const read = f => fs.readFileSync(here(f), 'utf8');
const src = read('./colosseum.js').replace(/^export /gm, '');
const ver = src.match(/MODEL_VERSION = '([^']+)'/)[1];
const icons = read('./icons.json').trim(), eventsJs = read('./events.js');
const tpl = read('./viewer.template.html');
const html = tpl
  .replace('/*__COLOSSEUM__*/', 'const ICONS = ' + icons + ';\nconst LOGOS = ' + read('./logos.json') + ';\n' + src)
  .replace('/*__EVENTS_JS__*/', () => eventsJs)
  .replace('__VERSION__', ver);
fs.writeFileSync(here('../index.html'), html);
// lite page shares the glass panel styles, icons and schedule code with the live page
const a = tpl.indexOf('/* v1.0.44 casual: glass events panel'), b = tpl.indexOf('</style>', a);
if (a < 0 || b < 0) throw new Error('panel CSS markers not found');
const lite = read('./lite.template.html')
  .replace('/*__PANEL_CSS__*/', () => '  ' + tpl.slice(a, b) + '  @media (max-width:640px){#events:not(.open) .liteNote{display:none}}\n</style>\n</head>')
  .replace('/*__ICONS__*/', () => icons)
  .replace('/*__EVENTS_JS__*/', () => eventsJs)
  .replace('__VERSION__', ver);
fs.writeFileSync(here('../lite.html'), lite);
console.log('built index.html + lite.html', ver);
