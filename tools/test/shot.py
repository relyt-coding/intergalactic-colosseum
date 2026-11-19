import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':960,'height':540})
        pg.on('pageerror', lambda e: print('ERR', e))
        pg.on('console', lambda m: m.type in ('error','warning') and 'Failed to load' not in m.text and print('CONSOLE', m.text[:300]))
        async def route(r):
            u=r.request.url; pre='https://cdn.jsdelivr.net/npm/three@0.170.0/'
            if u.startswith(pre): await r.fulfill(path='' + __import__('os').path.abspath('node_modules/three') + '/'+u[len(pre):], content_type='application/javascript')
            elif u.startswith('file:'): await r.continue_()
            else: await r.abort()
        await pg.route('**/*', route)
        await pg.goto('file://' + __import__('os').path.abspath('index.html') + '')
        await pg.wait_for_timeout(15000)
        await pg.evaluate("document.getElementById('tRotate').click()")
        for cmd in sys.argv[1:]:
            name, _, arg = cmd.partition('=')
            if name == 'js': await pg.evaluate(arg); continue
            if name == 'simwait':
                import json
                t0 = json.loads(await pg.evaluate('__dbg()'))['simT']
                for _ in range(600):
                    if json.loads(await pg.evaluate('__dbg()'))['simT'] >= t0 + float(arg): break
                    await pg.wait_for_timeout(400)
                continue
            if name == 'until':
                for _ in range(400):
                    if await pg.evaluate('__seq()') >= float(arg): break
                    await pg.wait_for_timeout(500)
                continue
            if name == 'snap': await pg.screenshot(path=f'shot_{arg}.png', timeout=120000); continue
            if name == 'print': print('EVAL', await pg.evaluate(arg)); continue
            if name == 'wait': await pg.wait_for_timeout(int(arg)); continue
            if name == 'tour': await pg.evaluate(f"__tour({arg})"); await pg.wait_for_timeout(3000); await pg.screenshot(path=f"shot_tour_{arg.replace(',','_')}.png", timeout=120000); continue
            if name == 'dlg': await pg.evaluate("document.getElementById('aTour').click()"); await pg.wait_for_timeout(1500); await pg.screenshot(path='shot_dlg.png'); await pg.evaluate("document.getElementById('tourCancel').click()"); continue
            await pg.evaluate(f"__view('{name}')"); await pg.wait_for_timeout(int(arg or 7000))
            await pg.screenshot(path=f'shot_{name}.png', timeout=120000)
        await b.close()
asyncio.run(main())
