from playwright.sync_api import sync_playwright
B='http://127.0.0.1:8765/'; issues=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w in (1280,390):
        pg=b.new_page(viewport={'width':w,'height':900})
        pg.on('console',lambda m: issues.append(m.text[:200]) if m.type=='error' else None); pg.on('pageerror',lambda e: issues.append('PAGEERR '+str(e)[:300]))
        pg.goto(B+'configurator/'); pg.wait_for_timeout(500); pg.click('#s1 button[type=submit]')
        pg.click('#s2 button[type=submit]'); e1=pg.inner_text('#err')
        pg.fill('#tin','176'); pg.fill('#tout','140'); pg.fill('#pmax','87')
        pg.fill('#route tbody tr:nth-child(1) td:nth-child(3) input','377.3'); pg.fill('#route tbody tr:nth-child(1) td:nth-child(4) input','1706.07')
        if w==1280: print('empty ->',e1,'|',pg.inner_text('#flow'))
        pg.click('#s2 button[type=submit]'); pg.wait_for_timeout(200)
        if w==1280:
            print('systems:',[x.inner_text().split('\n')[0] for x in pg.query_selector_all('#systems label')])
            pg.click('#systems label:has-text("CASAFLEX UNO")'); print('single section CASAFLEX UNO:',' | '.join(c.inner_text().replace('\n',' ') for c in pg.query_selector_all('#detail tr:nth-child(2) td')))
        # route with three buildings in a chain
        pg.click('#s3 [data-back]'); pg.fill('#route tbody tr:nth-child(1) td:nth-child(4) input','600')
        for i,(l,ld) in enumerate([('250','500'),('300','606.07')],2):
            pg.click('#addsec'); pg.fill(f'#route tbody tr:nth-child({i}) td:nth-child(3) input',l); pg.fill(f'#route tbody tr:nth-child({i}) td:nth-child(4) input',ld)
        pg.click('#s2 button[type=submit]'); pg.wait_for_timeout(200); pg.click('#systems label:has-text("CALPEX PUR-KING UNO, SDR 11")') if pg.query_selector('#systems label:has-text("CALPEX PUR-KING UNO, SDR 11")') else None
        pg.click('#systems label:has-text("ARMOPEX UNO")')
        if w==1280:
            print(pg.inner_text('#recap')); print(pg.inner_text('#detail .need').replace('\n',' | '))
            for r in pg.query_selector_all('#detail tr')[1:]: print('  ',' | '.join(c.inner_text().replace('\n',' ') if not c.query_selector('select') else c.query_selector('select').evaluate('s=>s.options[s.selectedIndex].text') for c in r.query_selector_all('td')))
            pg.click('#u-si'); pg.wait_for_timeout(150); print('metric:',pg.inner_text('#detail tr:nth-child(2) td:nth-child(2)'),'|',pg.inner_text('#detail tr:nth-child(2) td:nth-child(6)'),'|',pg.inner_text('#detail tr:nth-child(2) td:nth-child(7)'))
            pg.click('#s3 [data-back]'); print('metric inputs:',pg.input_value('#tin'),pg.input_value('#pmax'),pg.input_value('#route tbody tr:nth-child(1) td:nth-child(3) input'),pg.input_value('#route tbody tr:nth-child(1) td:nth-child(4) input')); pg.click('#u-us'); print('back to imperial:',pg.input_value('#tin'),pg.input_value('#route tbody tr:nth-child(1) td:nth-child(3) input')); pg.click('#s2 button[type=submit]'); pg.click('#systems label:has-text("ARMOPEX UNO")')
        pg.click('#s3 button[type=submit]'); pg.fill('#dcity','Madison'); pg.fill('#dstate','WI'); pg.wait_for_timeout(150)
        if w==1280: print('fittings:',[a.inner_text().replace('\n',' / ') for a in pg.query_selector_all('.fit article')]); print('transport:',pg.inner_text('#transport .ship').replace('\n',' | ')[:330])
        pg.screenshot(path=f'/home/claude/shots/k4_{w}.png',full_page=True)
        pg.click('#s4 button[type=submit]'); pg.fill('#fn','Test'); pg.fill('#ln','User'); pg.fill('#co','ACME'); pg.fill('#em','t@example.com'); pg.click('#s5 button[type=submit]'); pg.wait_for_timeout(150)
        if w==1280:
            pg.fill('#pr','Campus North loop') if False else None
            with pg.expect_download(timeout=60000) as d: pg.click('#pdf')
            d.value.save_as('/home/claude/shots/summary.pdf'); print('pdf name:',d.value.suggested_filename,'|',pg.inner_text('#copied'))
            with pg.expect_download(timeout=60000) as d: pg.click('#eml')
            d.value.save_as('/home/claude/shots/summary.eml'); print('eml name:',d.value.suggested_filename)
            open('/home/claude/shots/mail.html','w').write(pg.evaluate("CFG_EXPORT.html(JSON.parse(JSON.stringify((function(){return window.__m})()))||{}, '')") if False else '')
        pg.screenshot(path=f'/home/claude/shots/k6_{w}.png',full_page=True)
        for step in (2,3,4,6):
            pg.evaluate(f"document.querySelectorAll('#progress li')[{min(step,5)-1}].click()") if step<6 else pg.click('#s5 button[type=submit]') if False else None
            ov=pg.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
            if ov>0: issues.append(f'overflow {ov} at width {w} step {step}')
    b.close()
print('ISSUES',len(issues)); [print('  ',i) for i in issues[:10]]
