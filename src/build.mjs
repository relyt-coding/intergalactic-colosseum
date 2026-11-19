// Builds ../index.html from viewer.template.html + colosseum.js + logos.json. Run: npm run build
import fs from 'fs';
const here = f => new URL(f, import.meta.url);
const src = fs.readFileSync(here('./colosseum.js'), 'utf8').replace(/^export /gm, '');
const ver = src.match(/MODEL_VERSION = '([^']+)'/)[1];
const html = fs.readFileSync(here('./viewer.template.html'), 'utf8')
  .replace('/*__COLOSSEUM__*/', 'const LOGOS = ' + fs.readFileSync(here('./logos.json'), 'utf8') + ';\n' + src)
  .replace('__VERSION__', ver);
fs.writeFileSync(here('../index.html'), html);
console.log('built index.html', ver);
