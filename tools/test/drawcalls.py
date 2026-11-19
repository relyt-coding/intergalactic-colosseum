import asyncio, sys
from playwright.async_api import async_playwright
async def run(path):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':480,'height':270})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:150]))
        await pg.add_init_script("try{sessionStorage.setItem('colosseum-autoperf','1');localStorage.removeItem('colosseum-show')}catch(e){}")
        async def route(r):
            u=r.request.url; pre='https://cdn.jsdelivr.net/npm/three@0.170.0/'
            if u.startswith(pre): await r.fulfill(path='/home/claude/colo/node_modules/three/'+u[len(pre):], content_type='application/javascript')
            elif u.startswith('file:'): await r.continue_()
            else: await r.abort()
        await pg.route('**/*', route)
        await pg.goto('file://'+path+'?live=1'); await pg.wait_for_timeout(12000)
        out={}
        for v in ['overview','arena','gate','doorway','statues']:
            await pg.evaluate(f"(()=>{{const [p,q]=window.__vw('{v}');}})()") if False else None
            await pg.evaluate(f"__view('{v}')"); await pg.wait_for_timeout(1500)
            out[v]=await pg.evaluate("__drawn()")
        await b.close(); return out, errs
async def main():
    for path in sys.argv[1:]: print(path.split('/')[-1], await run(path))
asyncio.run(main())
