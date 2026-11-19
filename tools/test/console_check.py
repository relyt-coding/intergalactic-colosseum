import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':320,'height':180})
        msgs=[]
        pg.on('console', lambda m: msgs.append((m.type, m.text[:120])))
        pg.on('pageerror', lambda e: msgs.append(('pageerror', str(e)[:200])))
        async def route(r):
            u=r.request.url; pre='https://cdn.jsdelivr.net/npm/three@0.170.0/'
            if u.startswith(pre): await r.fulfill(path='' + __import__('os').path.abspath('node_modules/three') + '/'+u[len(pre):], content_type='application/javascript')
            elif u.startswith('file:'): await r.continue_()
            else: await r.abort()
        await pg.route('**/*', route)
        await pg.goto('file://' + __import__('os').path.abspath('index.html') + ''); await pg.wait_for_timeout(15000)
        from collections import Counter
        print(Counter(m for m in msgs if 'Failed to load' not in m[1]).most_common(10))
        await b.close()
asyncio.run(main())
