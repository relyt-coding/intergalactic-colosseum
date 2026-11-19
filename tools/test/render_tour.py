# Renders a tour to numbered JPEG frames with a virtual clock (smooth, independent of headless speed).
# Usage: python3 tools/test/render_tour.py <tourIndex> <seconds> <fps> <outdir> [width height] [startFrame]
import sys, os, asyncio, json
from playwright.async_api import async_playwright

TOUR, SECS, FPS, OUT = int(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
W, H = (int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (1280, 720)
START = int(sys.argv[7]) if len(sys.argv) > 7 else 0
os.makedirs(OUT, exist_ok=True)
CLOCK = """(() => { let vt = 0; const q = [];
  try { localStorage.setItem('colosseum-looks', JSON.stringify({ ao: false })); localStorage.setItem('colosseum-igpu-tip', '1'); } catch (e) {}
  performance.now = () => vt;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__step = ms => { vt += ms; const c = q.splice(0); for (const f of c) f(vt); return c.length; };
  addEventListener('DOMContentLoaded', () => { const s = document.createElement('style');
    s.textContent = '#gpuWarn,#toast,#stopTour,#events,.dock,#drawer,.hud{display:none!important}'; document.head.appendChild(s); });
})();"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        pg.on('pageerror', lambda e: print('ERR', e, flush=True))
        async def route(r):
            u = r.request.url; pre = 'https://cdn.jsdelivr.net/npm/three@0.170.0/'
            if u.startswith(pre): await r.fulfill(path=os.path.abspath('node_modules/three') + '/' + u[len(pre):], content_type='application/javascript')
            elif u.startswith('file:'): await r.continue_()
            else: await r.abort()
        await pg.route('**/*', route)
        await pg.add_init_script(CLOCK)
        await pg.goto('file://' + os.path.abspath('index.html') + '?live=1')
        await pg.wait_for_function('window.__tour && window.__step', polling=500, timeout=120000)
        for _ in range(12): await pg.evaluate('__step(33)')          # warm up sky + shaders
        dt = 1000 / FPS
        await pg.evaluate(f'__tour({TOUR}, 0)')
        await pg.wait_for_timeout(400)                                 # casual tours fire fireworks after 300 ms
        n = int(SECS * FPS)
        for i in range(n):
            await pg.evaluate(f'__step({dt})')
            if i < START: continue
            await pg.screenshot(path=f'{OUT}/{i:05d}.jpg', type='jpeg', quality=92)
            if i % 24 == 0: print('frame', i, '/', n, round(__import__('time').time()), flush=True)
        print('DONE', flush=True)
        await b.close()
asyncio.run(main())
