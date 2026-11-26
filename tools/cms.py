# executed by build.py: everything that comes from data/groups and data/academy (edited in the admin area)
JS_OLD="v.poster='media/poster-'+t.dataset.v+'.jpg';v.src='media/'+t.dataset.v+'.mp4';"
JS_NEW="v.poster=t.dataset.poster;v.src=t.dataset.src;"
def _label(f):
    x=os.path.splitext(f)[1].lower()
    return {'.pdf':'Download PDF','.docx':'Download Word','.doc':'Download Word','.xlsx':'Download Excel','.pptx':'Download PowerPoint','.zip':'Download ZIP','.dwg':'Download DWG'}.get(x,'Download')
def doc_lists(D,h3style=' style="margin-top:30px"'):
    secs=[]
    for x in D:
        s=x.get('section') or ''
        if not secs or secs[-1][0]!=s: secs.append((s,[]))
        secs[-1][1].append(x)
    out=''
    for s,xs in secs:
        if s: out+=f'<h3 class="sub"{h3style}>{e(s)}</h3>'
        out+='<ul class="docs"'+(' style="margin-top:14px"' if s else '')+'>'
        for x in xs:
            n=e(x.get('download_name') or os.path.basename(x['file']))
            out+=f'<li><div><b>{e(x.get("title") or n)}</b><span>{e(x.get("description"))}</span></div><em>{e(x.get("note"))}</em><a class="dl" href="{e(x["file"])}" target="_blank" rel="noopener" download="{n}" data-file="{e(x["file"])}" data-name="{n}">{_label(x["file"])}</a></li>'
        out+='</ul>'
    return out
def apply_group(h,G,p):
    V=items(G,'videos'); D=items(G,'documents'); inst=[x for x in V if x['id']!='product']
    have={x['id'] for x in D}
    for x in (G.get('documents') or []):   # links to documents that are not available yet
        if x.get('id') and x['id'] not in have: h=re.sub(r'<a class="dl sm" href="'+re.escape(x['id'])+r'"[^>]*>.*?</a>','',h,flags=re.S)
    if not any(x['id']=='product' for x in V):
        h=re.sub(r'<section id="video">.*?</section>\s*','',h,count=1,flags=re.S).replace('<a class="btn solid" href="#video">Watch the video</a>','<a class="btn solid" href="#why">Advantages</a>').replace('<section id="why" style="padding-top:0">','<section id="why">')
    if not inst:
        h=re.sub(r'<div class="inst"><div class="videobox">.*?</div>\s*<div><div class="tabs"[^>]*>.*?</div>(?=<div class="mlinks">)','<div><div>',h,count=1,flags=re.S)
        h=re.sub(r'(<section id="installation".*?<p class="lead">)(.*?)(</p>)',lambda m:m.group(1)+' '.join(x for x in re.split(r'(?<=[.!?])\s+',m.group(2)) if 'video' not in x.lower() and x.strip()!='Pick yours.')+m.group(3),h,count=1,flags=re.S)
    if D: h=re.sub(r'(<h2>Everything you need, one file each\.</h2>).*?(<p id="dlmsg")',lambda m:m.group(1)+doc_lists(D)+m.group(2),h,count=1,flags=re.S)
    if inst:
        tabs=''.join(f'<button type="button" class="tab{" on" if i==0 else ""}" id="tab-{e(x["id"])}" data-v="{e(x["id"])}" data-src="{e(x["file"])}" data-poster="{e(x.get("poster"))}" aria-pressed="{"true" if i==0 else "false"}"><b>{e(x.get("title"))}</b><span>{e(x.get("description"))}</span><em>{e(x.get("duration"))}</em></button>' for i,x in enumerate(inst))
        h=re.sub(r'(<div class="tabs" role="group" aria-label="[^"]*">).*?(</div>\s*<div class="mlinks">)',lambda m:m.group(1)+tabs+m.group(2),h,count=1,flags=re.S)
        h=re.sub(r'(<video id="instvideo"[^>]*?) poster="[^"]*" src="[^"]*"',lambda m:f'{m.group(1)} poster="{e(inst[0].get("poster"))}" src="{e(inst[0]["file"])}"',h,count=1)
    for x in V:
        h=h.replace(f'"media/{x["id"]}.mp4"','"'+e(x['file'])+'"').replace(f'"media/poster-{x["id"]}.jpg"','"'+e(x.get('poster'))+'"')
    for x in D:
        if x['id'].startswith('docs/'): h=h.replace('"'+x['id']+'"','"'+e(x['file'])+'"')
    assert JS_OLD in h,p
    return h.replace(JS_OLD,JS_NEW)
def hide_missing_videos(h):
    def f(m):
        if exists(m.group(2)): return m.group(0)
        return (f'<img src="{m.group(1)}" alt="">' if m.group(1) and exists(m.group(1)) else '')+'<p class="soon">This video follows shortly.</p>'
    return re.sub(r'<video[^>]*? poster="([^"]*)" src="([^"]*)"[^>]*></video>',f,h)
def _figs(V):
    return ('<div class="vids'+(' one' if len(V)==1 else '')+'">'+''.join(f'<figure><div class="videobox"><video controls preload="none" poster="{e(x.get("poster"))}" src="{e(x["file"])}"></video></div><figcaption><b>{e(x.get("title"))}</b>'+' · '.join(y for y in (e(x.get('description')),e(x.get('duration'))) if y)+'</figcaption></figure>' for x in V)+'</div>') if V else ''
def _band(G):
    k=[x for x in (G.get('key_figures') or []) if isinstance(x,dict) and x.get('value')][:4]
    return ('<div class="wrap"><div class="band">'+''.join(f'<div><b>{e(x["value"])}</b><span>{e(x.get("label"))}</span></div>' for x in k)+'</div></div>') if k else ''
def _hero(crumb,eyebrow,h1,sub,img,alt,cta):
    pic=f'<div class="heroimg"><img src="{e(img)}" alt="{e(alt)}"></div>' if img else '<div></div>'
    return f'<div class="wrap"><p class="crumb">{crumb}</p><div class="herogrid"><div><p class="eyebrow">{eyebrow}</p><h1>{e(h1)}</h1><p class="sub">{e(sub)}</p><div class="cta">{cta}</div></div>{pic}</div></div>'
STD_FOOT='Values from the BRUGG Pipes Technical Data Sheets. Subject to technical changes.'
def build_extra():
    # product groups created in the admin area (no hand-built page)
    for slug,G in GROUPS.items():
        if G.get('legacy') or G.get('status')!='live': continue
        if slug in ('assets','admin','academy','configurator','data','fonts','media','uploads'): print('skipped reserved name:',slug); continue
        V=items(G,'videos'); D=items(G,'documents')
        body=_hero(f'<a href="../">Products</a> / <b>{e(G["name"])}</b>','Cooling and cold water' if G.get('category')=='cooling' else 'Local and district heating',G.get('tagline') or G['name'],G.get('description'),G.get('hero_image'),G['name'],
            ('<a class="btn solid" href="#videos">Videos</a>' if V else '')+('<a class="btn" href="#documents">Downloads</a>' if D else ''))+_band(G)+'</header>\n<main>'
        if V: body+=f'<section id="videos"><div class="wrap"><p class="eyebrow">Videos</p><h2>Product and installation videos.</h2>{_figs(V)}</div></section>'
        if D: body+=f'<section id="documents"><div class="wrap"><p class="eyebrow">Documents</p><h2>Everything you need, one file each.</h2>{doc_lists(D)}</div></section>'
        os.makedirs(f'{SITE}/{slug}',exist_ok=True)
        open(f'{SITE}/{slug}/index.html','w',encoding='utf-8').write(page(f'{G["name"]} by BRUGG Pipes','../',[('All products','../'),('Videos','#videos'),('Downloads','#documents'),('Configurator','../configurator/'),('Academy','../academy/'),('Contact','https://www.bruggpipes.com/us/contact/')],body,STD_FOOT,f'{G["name"]} by BRUGG Pipes: videos and documents.'))
    # academy overview
    os.makedirs(SITE+'/academy',exist_ok=True); cards=''
    for n,(slug,A) in enumerate(sorted(ACADEMY.items(),key=lambda kv:(kv[1].get('order') or 99,kv[0])),1):
        M=items(A,'modules'); D=items(A,'documents')
        cards+=f'<a class="card wide" href="{slug}/"><div class="pic"><img src="{e(A.get("cover") or "/media/logo.png")}" alt="{e(A["title"])}"></div><div class="txt"><span class="no">{n}</span><h3>{e(A["title"])}</h3><span class="tag">{e(A.get("audience") or "Course")}</span><ul><li>{e(A.get("description"))}</li><li>{len(M)} video modules'+(f' · {len(D)} documents' if D else '')+'</li></ul><span class="go">Open course</span></div></a>'
    body='''<div class="wrap intro"><p class="eyebrow">BRUGG Pipes Academy</p><h1>Training for planners, engineers and installers</h1><p class="sub">Online courses on pre-insulated pipe systems. Free to use, at your own pace.</p></div></header>
<main>
<section id="courses" style="padding-top:20px"><div class="wrap"><p class="eyebrow">Courses</p><h2>Pick a course.</h2><div class="grid">'''+cards+'''</div><p class="note">On-site and live online training for your crew: ask us at sales.bpna@brugg.com.</p></div></section>'''
    open(SITE+'/academy/index.html','w',encoding='utf-8').write(page('BRUGG Pipes Academy','../',[('All products','../'),('Courses','#courses'),('Configurator','../configurator/'),('Contact','https://www.bruggpipes.com/us/contact/')],body,'Course content is general training material and does not replace project engineering or local codes.','BRUGG Pipes Academy: online courses on pre-insulated pipe systems.'))
    for slug,A in ACADEMY.items():
        M=items(A,'modules'); D=items(A,'documents'); os.makedirs(f'{SITE}/academy/{slug}',exist_ok=True)
        if A.get('legacy') and os.path.exists(f'{SRC}/{slug.split("-")[0]}.html'):
            h=open(f'{SRC}/{slug.split("-")[0]}.html',encoding='utf-8').read()
            h=re.sub(r'<section id="exercises".*?</section>\s*','',h,count=1,flags=re.S)
            h=h.replace('<a href="#exercises">Exercises</a>','').replace('<a class="btn" href="#exercises">Go to the exercises</a>','<a class="btn" href="#documents">Downloads</a>')
            h=h.replace(', a knowledge check after each module, and three route-planning exercises with solutions.',' and a knowledge check after each module.')
            h=re.sub(r'<div><b>3</b><span>exercises with plan and solution</span></div>','',h)
            h=re.sub(r'(<section id="documents".*?<h2>).*?(</h2>).*?(<p id="dlmsg")',lambda m:m.group(1)+'Read more.'+m.group(2)+doc_lists(D)+m.group(3),h,count=1,flags=re.S)
            for x in M: h=h.replace(f'"media/{x["id"]}.mp4"','"'+e(x['file'])+'"').replace(f'"media/poster-{x["id"]}.jpg"','"'+e(x.get('poster'))+'"')
            for a,b in [('"media/intro-product.mp4"','"/premant/media/product.mp4"'),('"media/poster-intro.jpg"','"/premant/media/poster-product.jpg"'),('"media/install.mp4"','"/premant/media/install-pipe.mp4"'),('"media/poster-install.jpg"','"/premant/media/poster-install-pipe.jpg"'),('"media/logo.png"','"/media/logo.png"'),('"media/hero.jpg"','"/premant/media/hero.jpg"'),('url(fonts/','url(/premant/fonts/'),('url(media/hero.jpg)','url(/premant/media/hero.jpg)')]: h=h.replace(a,b)
            h=h.replace('<a class="brand" href="#top">','<a class="brand" href="../../">')
            h=h.replace('<a href="https://www.bruggpipes.com/us/products/" target="_blank" rel="noopener">All products</a>','<a href="../../">All products</a><a href="../">Academy</a>')
            h=re.sub(r'<p class="crumb">.*?</p>',f'<p class="crumb"><a href="../../" style="color:inherit">Products</a> / <a href="../" style="color:inherit">Academy</a> / <b>{e(A["title"])}</b></p>',h,count=1,flags=re.S)
            h=h.replace('<a href="#contact">Contact</a>','<a href="https://www.bruggpipes.com/us/contact/" target="_blank" rel="noopener">Contact</a>')
            h=h.replace('<a href="https://www.bruggpipes.com/us/t-c/">Terms and conditions</a></p>','<a href="https://www.bruggpipes.com/us/t-c/">Terms and conditions</a></p>'+SOC)
            h=re.sub(r'<title>.*?</title>',f'<title>{e(A["title"])}: BRUGG Pipes Academy</title><link rel="icon" href="/media/logo.png">',h,count=1)
            h=h.replace('<meta charset="utf-8">','<meta charset="utf-8">'+CSPMETA,1)
            for x in (A.get('modules') or []): h=h.replace(f'"media/{x.get("id")}.mp4"','"'+e(x.get('file'))+'"').replace(f'"media/poster-{x.get("id")}.jpg"','"'+e(x.get('poster'))+'"')
            h=hide_missing_videos(h)
            h=restyle(h,'../../','academy',A['title']+': BRUGG Pipes Academy',A.get('description') or A['title'])
            js=[]; h=re.sub(r'<script>(.*?)</script>',lambda m:(js.append(m.group(1)),'')[1],h,flags=re.S)
            open(f'{SITE}/academy/{slug}/course.js','w',encoding='utf-8').write('"use strict";\n'+'\n'.join(js))
            h=h.replace('</body>','<script src="course.js" defer></script>\n</body>')
        else:
            body=_hero(f'<a href="../../">Products</a> / <a href="../">Academy</a> / <b>{e(A["title"])}</b>','BRUGG Pipes Academy',A['title'],A.get('description'),A.get('cover'),A['title'],'<a class="btn solid" href="#modules">Start</a>')+'</header>\n<main>'
            body+=f'<section id="modules"><div class="wrap"><p class="eyebrow">Modules</p><h2>{len(M)} video modules.</h2>{_figs(M)}</div></section>'
            if D: body+=f'<section id="documents"><div class="wrap"><p class="eyebrow">Documents</p><h2>Read more.</h2>{doc_lists(D)}</div></section>'
            h=page(f'{A["title"]}: BRUGG Pipes Academy','../../',[('Academy','../'),('Modules','#modules'),('Downloads','#documents'),('Contact','https://www.bruggpipes.com/us/contact/')],body,'Course content is general training material and does not replace project engineering or local codes.',A.get('description') or A['title'])
        open(f'{SITE}/academy/{slug}/index.html','w',encoding='utf-8').write(h)
    open(SITE+'/robots.txt','w').write('User-agent: *\nDisallow: /admin/\n')
    body='<div class="wrap intro"><p class="eyebrow">Page not found</p><h1>This page does not exist.</h1><p class="sub">The address may have changed. Start again from the product overview.</p><div class="cta"><a class="btn solid" href="/">All products</a><a class="btn" href="/configurator/">Configurator</a></div></div></header>\n<main>'
    open(SITE+'/404.html','w',encoding='utf-8').write(page('Page not found: BRUGG Pipes','/',[],body,STD_FOOT,'Page not found.'))
