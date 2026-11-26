import re,os,html,json,math
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=ROOT+'/src'; SITE=ROOT+'/site'; DATA=json.load(open(ROOT+'/data/products.json',encoding='utf-8'))
CAD='https://brugg.partcommunity.com/3d-cad-models/sso/?languageIso=en'
def esc(x): return html.escape(x,quote=False)
def render_table(s):
    def td(c,first):
        if isinstance(c,list): return f'<td><b>{esc(c[0])}</b> <i>({esc(c[1])})</i></td>' if first else f'<td>{esc(c[0])} <i>({esc(c[1])})</i></td>'
        return f'<td><b>{esc(c)}</b></td>' if first else f'<td>{esc(c)}</td>'
    st=' style="min-width:520px"' if len(s['columns'])<=3 else ''
    return f'<table{st}><tr>'+''.join(f'<th>{esc(c)}</th>' for c in s['columns'])+'</tr>'+''.join('<tr>'+''.join(td(c,i==0) for i,c in enumerate(r))+'</tr>' for r in s['rows'])+'</table>'
def _load(d): return {f[:-5]:json.load(open(f'{ROOT}/data/{d}/{f}',encoding='utf-8')) for f in sorted(os.listdir(f'{ROOT}/data/{d}')) if f.endswith('.json')}
GROUPS=_load('groups'); ACADEMY=_load('academy')
CSP="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'"
CSPMETA='<meta http-equiv="Content-Security-Policy" content="'+CSP+'">'
def sl(x): return re.sub(r'[^a-z0-9]+','-',str(x).lower()).strip('-')
MISSING=[]
def exists(f): return (not str(f).startswith('/')) or os.path.exists(SITE+str(f))
def items(G,key):
    out=[]
    for i,x in enumerate(G.get(key) or []):
        if not isinstance(x,dict) or not x.get('file'): continue
        if not exists(x['file']): MISSING.append(x['file']); continue
        x=dict(x); x['id']=x.get('id') or (sl(x.get('title') or os.path.basename(x['file']))+'-'+str(i)); out.append(x)
    return out
def e(x): return html.escape(str(x or ''))
class _V(dict):
    def __missing__(s,k): return ('','','','')
TABLES={p:{s['title']:render_table(s) for s in P['series']} for p,P in DATA['products'].items()}
def rd(p): return open(f'{SRC}/{p}.html',encoding='utf-8').read()
base=rd('casaflex')
css=re.search(r'<style>(.*?)</style>',base,re.S).group(1)
css=re.sub(r'@font-face\{[^}]*\}','',css).replace('url(media/hero.jpg)','none')
ff=''.join("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;src:url(../fonts/%s-latin-%d-normal.woff2) format('woff2')}\n"%(n,w,f,w)
  for n,f,ws in [('Inter','inter',(400,500,600,700)),('Inter Tight','inter-tight',(600,700,800)),('Roboto Condensed','roboto-condensed',(400,700))] for w in ws)
extra='''
/* ---- site pages: overview and sub-product pages ---- */
.crumb a{color:var(--grey)}.util a.ext:after{content:" \\2197"}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:40px}
.card{display:flex;flex-direction:column;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);text-decoration:none;position:relative;transition:border-color .15s,box-shadow .15s,transform .15s}
.card:hover{border-color:var(--blue);box-shadow:0 22px 44px -28px rgba(27,42,107,.65);transform:translateY(-2px)}
.card .pic{position:relative;display:flex;align-items:flex-end;justify-content:center;height:210px;padding:18px 18px 0;background:var(--tint);overflow:hidden}
.card .pic>img:first-child{height:100%;width:auto;max-width:100%;object-fit:contain;object-position:bottom;mix-blend-mode:multiply}
.card .usa{position:absolute;left:14px;top:14px;width:44px}
.card .txt{padding:20px 22px 0;flex:1}
.card h3{font:700 22px/1.2 var(--body);margin:10px 0 6px}.card h3 a{color:var(--blue);text-decoration:none}
.card .line{font-size:14.5px;line-height:1.45;color:var(--ink);font-weight:500;margin:0;min-height:42px}
.tag{display:inline-block;font:700 10.5px var(--body);letter-spacing:.1em;text-transform:uppercase;padding:3px 7px;color:var(--blue);background:var(--tint)}.tag.heat{color:#C8402F;background:#FBEDEA}
.card ul{list-style:none;margin:14px 0 0;padding:0;font-size:14px;color:var(--grey);font-weight:400}.card li{padding:7px 0;border-top:1px solid var(--line)}
.card .foot{padding:18px 22px 20px;margin-top:auto}
.go{display:block;font:700 14px var(--body);color:#fff;background:var(--blue);padding:12px 16px;text-align:center;text-decoration:none}.go:after{content:" \\2192"}.go:hover{background:#1B2A6B}
.card .more{display:flex;gap:18px;justify-content:center;margin:12px 0 0;font-size:13px;font-weight:600}.card .more a{color:var(--blue);text-decoration:none;border-bottom:1px solid transparent}.card .more a:hover{border-bottom-color:var(--blue)}
.card.help{background:var(--blue);border-color:var(--blue);color:#fff;padding:26px 22px 20px;justify-content:flex-start}.card.help .eyebrow{color:#fff;opacity:.8;margin:0 0 10px}.card.help h3{color:#fff;font-size:24px;margin:0 0 12px}.card.help p{font-size:15px;line-height:1.5;margin:0}.card.help .go{margin-top:auto;background:#fff;color:var(--blue)}
.card .no{min-width:24px;height:24px;padding:0 5px;background:var(--blue);color:#fff;font:700 12px/24px var(--body);text-align:center}
.card.wide{padding:22px 20px 20px;gap:14px}.card.wide .pic{height:auto;padding:0;background:none;display:block}.card.wide .pic>img:first-child{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border:1px solid var(--line);mix-blend-mode:normal}.card.wide .txt{padding:0}.card.wide .no{float:right;margin-left:10px}.card.wide h3{color:var(--blue)}.card.wide .go{margin-top:14px}
.subp{border-top:1px solid var(--line);padding:64px 0}.subp:first-of-type{border-top:0}
.subhead{display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:start}
.facts{list-style:none;margin:0;padding:0;font-size:15.5px}.facts li{display:grid;grid-template-columns:44% 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.facts li span{color:var(--grey)}.facts li b{font-weight:600}
.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}
.dl{display:inline-block;padding:11px 16px;border:1.5px solid var(--blue);color:var(--blue);font:700 14px var(--body);text-decoration:none;white-space:nowrap}.dl:hover,.dl.solid{background:var(--blue);color:#fff}.dl.solid:hover{background:var(--blue-deep)}
.vids{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:34px}.vids.one{grid-template-columns:minmax(0,760px)}.vids figure{margin:0}.vids figcaption{margin-top:10px;font-size:14.5px;color:var(--grey)}.vids figcaption b{display:block;color:var(--ink);font-weight:700;font-size:16.5px}
.figs{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:34px}.figs.three{grid-template-columns:repeat(3,1fr)}.figs figure{margin:0}.figs img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#f2f3f5}.figs.photo img{object-fit:cover}.figs figcaption{margin-top:10px;font-size:14.5px;color:var(--grey)}.figs figcaption b{display:block;color:var(--ink);font-weight:700;font-size:16px}
.acc{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:30px}.acc article{display:grid;grid-template-columns:170px 1fr;gap:16px;border:1.5px solid var(--line);padding:14px}.acc img{width:170px;aspect-ratio:16/9;object-fit:cover}.acc h4{font:700 16.5px/1.25 var(--body)}.acc p{margin:4px 0 10px;font-size:14px;color:var(--grey)}.acc .links{margin-top:0;gap:8px}.acc .dl{padding:7px 11px;font-size:13px;cursor:pointer;background:none}.acc .dl:hover{background:var(--blue)}
.player{max-width:860px;margin-top:30px}.player p{margin:10px 0 0;font-size:15px;color:var(--grey)}.player p b{color:var(--ink)}
.social a{font-weight:600;color:var(--blue) !important}
.note{font-size:13px;color:var(--grey);max-width:95ch;margin:18px 0 0}
.intro{padding-top:38px;padding-bottom:46px}.intro h1{max-width:22ch}
@media (max-width:980px){.grid{grid-template-columns:1fr 1fr}.subhead{grid-template-columns:1fr;gap:26px}.figs,.figs.three{grid-template-columns:1fr 1fr}.acc{grid-template-columns:1fr}}
@media (max-width:640px){.grid,.vids{grid-template-columns:1fr}.acc article{grid-template-columns:1fr}.acc img{width:100%}.facts li{grid-template-columns:1fr;gap:2px}}
'''
open(f'{SITE}/assets/site.css','w',encoding='utf-8').write(ff+css+extra)

CONTACT='https://www.bruggpipes.com/us/contact/'
def chrome_head(root,active):
    main=[('Products',root,'products',0),('Configurator',root+'configurator/','configurator',0),('Academy',root+'academy/','academy',0),('CAD / BIM library',CAD,None,1),('Contact',CONTACT,None,1)]
    t=''.join(f'<a href="{h}"'+(' class="ext" target="_blank" rel="noopener"' if x else (' class="on" aria-current="page"' if k==active else ''))+f'>{l}</a>' for l,h,k,x in main)
    return f'<div class="hnav"><nav class="util" aria-label="Contact"><a href="tel:+18159277355">+1 815 927 7355</a><a href="mailto:sales.bpna@brugg.com">sales.bpna@brugg.com</a><a href="https://www.bruggpipes.com/us/" target="_blank" rel="noopener">bruggpipes.com</a></nav><nav class="tabs3" aria-label="Main">{t}</nav></div></div></div>'
def subnav(tabs):
    a=[(l,h) for l,h in tabs if h.startswith('#')]
    return ('<nav class="subnav" aria-label="On this page"><div class="wrap"><span>On this page</span>'+''.join(f'<a href="{h}">{l}</a>' for l,h in a)+'</div></nav>') if a else ''
SOCIAL='<p class="links social"><a href="https://www.facebook.com/bruggpipes" target="_blank" rel="noopener">Facebook</a><a href="https://www.youtube.com/c/BRUGGPipes" target="_blank" rel="noopener">YouTube</a><a href="https://www.bruggpipes.com/linkedin" target="_blank" rel="noopener">LinkedIn</a><a href="https://www.instagram.com/bruggpipes" target="_blank" rel="noopener">Instagram</a><a href="https://twitter.com/BRUGG_Pipes" target="_blank" rel="noopener">X</a></p>'
def footer(root,note):
    return f'<footer class="site-footer"><div class="wrap"><div><p>BRUGG Pipes · <a href="https://www.bruggpipes.com/us/">bruggpipes.com</a> · <a href="mailto:sales.bpna@brugg.com">sales.bpna@brugg.com</a> · <a href="tel:+18159277355">+1 815 927 7355</a></p><p class="links"><a href="{root}">Products</a><a href="{root}configurator/">Configurator</a><a href="{root}academy/">Academy</a><a href="{CONTACT}" target="_blank" rel="noopener">Contact</a></p><p class="links"><a href="https://www.bruggpipes.com/us/legal-notice/">Legal notice</a><a href="https://www.bruggpipes.com/us/privacy-policy/">Privacy policy</a><a href="https://www.bruggpipes.com/us/compliance/">Compliance</a><a href="https://www.bruggpipes.com/us/t-c/">Terms and conditions</a></p>{SOCIAL}<p class="group">A BRUGG GROUP COMPANY</p><p>{note}</p></div><img src="/media/logo.png" alt="BRUGG Pipes"></div></footer>'
def headtags(title,desc):
    return f'<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/png" href="/favicon.png"><meta property="og:type" content="website"><meta property="og:site_name" content="BRUGG Pipes North America"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:image" content="https://bruggpipes-us.netlify.app/media/og.jpg"><link rel="stylesheet" href="/assets/chrome.css">'
def restyle(h,root,active,title,desc,extra_tabs=()):
    """give a hand-built page the common header, section navigation and footer"""
    old=re.search(r'<nav class="tabs3".*?</nav>',h,re.S).group(0)
    tabs=[(html.unescape(l),u) for u,l in re.findall(r'<a href="(#[^"]+)">(.*?)</a>',old) if u!='#contact']
    h=re.sub(r'<div class="hnav">.*?</nav></div></div></div>',lambda m:chrome_head(root,active),h,count=1,flags=re.S)
    if '</header>' not in h: h=h.replace('<main>','</header>\n<main>',1)
    h=h.replace('</header>','</header>\n'+subnav(tabs),1)
    f=re.search(r'<footer.*?</footer>',h,re.S).group(0); note=re.findall(r'<p>(.*?)</p>',f,re.S)[-1]
    h=h.replace(f,footer(root,note))
    h=re.sub(r'<link rel="icon"[^>]*>','',h)
    return h.replace('</head>',headtags(title,desc)+'</head>',1)
def page(title,root,tabs,body,footline,desc):
    active='configurator' if 'Configurator' in title else ('academy' if 'Academy' in title else 'products')
    body=body.replace('</header>','</header>\n'+subnav(tabs),1)
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">{CSPMETA}<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{html.escape(desc)}">
<link rel="stylesheet" href="{root}assets/site.css">{headtags(title,desc)}</head><body>
<header class="top" id="top"><div class="hd"><div class="wrap hrow"><a class="brand" href="{root}"><img src="/media/logo.png" alt="BRUGG Pipes"><span>A BRUGG GROUP COMPANY</span></a>
{chrome_head(root,active)}
{body}
<section id="contact" class="contact"><div class="wrap"><p class="eyebrow" style="color:#fff">Contact</p><h2>Send us your route. We size it and price it.</h2><p class="lead">BRUGG Pipes supports your project with pressure-loss and heat-loss sizing, routing and installer training.</p>
<div class="ways"><a href="mailto:sales.bpna@brugg.com"><small>Email</small><b>sales.bpna@brugg.com</b></a><a href="tel:+18159277355"><small>Phone</small><b>+1 815 927 7355</b></a><a href="{CONTACT}" target="_blank" rel="noopener"><small>Contact page</small><b>bruggpipes.com/us/contact</b></a></div></div></section>
</main>
{footer(root,footline)}
<script src="{root}assets/site.js" defer></script>
</body></html>"""

SOC=''
# ---------- root overview ----------
cards=[]
for slug,G in sorted(GROUPS.items(),key=lambda kv:(kv[1].get('order') or 99,kv[0])):
    if G.get('status')!='live': continue   # products without a page are not shown
    cat=G.get('category')=='cooling'; legacy=bool(G.get('legacy'))
    usa='<img class="usa" src="media/usa.png" alt="Made in USA">' if G.get('made_in_usa') else ''
    tag='<span class="tag">Cooling and cold water</span>' if cat else '<span class="tag heat">Heating</span>'
    line=re.sub(r'^'+re.escape(G['name'].split()[0])+r'[^\u2013-]*\s[\u2013-]\s','',G.get('tagline') or '')
    V=items(G,'videos'); D=items(G,'documents')
    more=[]
    if V: more.append(f'<a href="{slug}/#{"video" if legacy else "videos"}">Videos</a>')
    more.append(f'<a href="{slug}/#range">Sizes</a>' if legacy else '')
    if D: more.append(f'<a href="{slug}/#documents">Downloads</a>')
    if os.path.exists(f'{SRC}/{slug}-sizing.html'): more.insert(0,f'<a href="{slug}/sizing.html">Sizing tool</a>'); more=[m for m in more if '#range' not in m]
    cards.append(f'<article class="card"><a class="pic" href="{slug}/" tabindex="-1" aria-hidden="true"><img src="{e(G.get("card_image") or "/media/logo.png")}" alt="">{usa}</a>'
      f'<div class="txt">{tag}<h3><a href="{slug}/">{e(G["name"])}</a></h3><p class="line">{e(line)}</p><ul>'+''.join(f'<li>{e(b)}</li>' for b in (G.get('card_bullets') or []))+'</ul></div>'
      f'<div class="foot"><a class="go" href="{slug}/">Open product page</a><p class="more">{"".join(more)}</p></div></article>')
if len(cards)%3==2: cards.append('<a class="card help" href="configurator/"><p class="eyebrow">Configurator</p><h3>Not sure which system fits?</h3><p>Enter temperatures, heat load and route. The configurator proposes system, sizes, fittings and transport.</p><span class="go">Open the configurator</span></a>')
body=f'''<div class="wrap intro"><p class="eyebrow">North America</p><h1>District Heating and Cooling Solutions</h1>
<p class="sub">Pre-insulated pipe systems for North America. Pick a product to open its page with data, videos and documents, or let the configurator size your line.</p><div class="cta"><a class="btn solid" href="configurator/">Open the configurator</a><a class="btn" href="https://www.bruggpipes.com/us/contact/" target="_blank" rel="noopener">Talk to sales</a></div></div></header>
<main>
<section id="products" style="padding-top:20px"><div class="wrap"><p class="eyebrow">Products</p><h2>Pre-insulated pipe systems.</h2><div class="grid">{''.join(cards)}</div></div></section>
<section id="configurator-teaser" style="padding-bottom:0"><div class="wrap split" style="grid-template-columns:1.4fr 1fr"><div><p class="eyebrow">Configurator</p><h2>Size your line in five steps.</h2><p class="lead">Enter temperatures, heat load and route length in US units. The configurator shows the suitable BRUGG Pipes systems with velocity and pressure loss for every size and prepares your request for a quote.</p></div><div><a class="btn solid" href="configurator/">Open the configurator</a></div></div></section>
<section id="cad"><div class="wrap split" style="grid-template-columns:1.4fr 1fr"><div><p class="eyebrow">3D CAD and BIM</p><h2>Models for your drawings, straight from the BRUGG Pipes BIM library.</h2><p class="lead">3D CAD models and BIM objects of BRUGG Pipes products for download in your CAD format. The library opens in English in a new tab; a free account with your business email is required.</p></div><div><a class="btn solid" href="https://brugg.partcommunity.com/3d-cad-models/sso/?languageIso=en" target="_blank" rel="noopener">Open the CAD / BIM library</a></div></div></section>'''
open(f'{SITE}/index.html','w',encoding='utf-8').write(page('BRUGG Pipes North America: Product Overview','',[('Products','#products'),('Configurator','configurator/'),('Academy','academy/'),('CAD / BIM','#cad'),('Contact','https://www.bruggpipes.com/us/contact/')],body,'Values as on the BRUGG Pipes product overview. Subject to technical changes.','BRUGG Pipes North America: pre-insulated pipe systems for district heating and cooling, with data, videos and documents.'))

exec(open(ROOT+'/tools/cms.py',encoding='utf-8').read())
# ---------- helpers on product pages ----------
def info(p):
    h=rd(p); d={}
    d['band']=re.search(r'<div class="band">.*?</div></div>',h,re.S).group(0)[:-6]
    d['sub']=re.search(r'<p class="sub">(.*?)</p>',h,re.S).group(1)
    d['foot']=re.search(r'<p class="group">.*?</p><p>(.*?)</p>',h,re.S).group(1)
    rng=re.search(r'<section id="range".*?</section>',h,re.S).group(0)
    d['tables']={html.unescape(t):tb for t,tb in re.findall(r'<h3 class="sub"[^>]*>(.*?)</h3><div class="scroll">(<table[^>]*>.*?</table>)</div>',rng,re.S)}
    assert set(d['tables'])==set(TABLES[p]),p
    d['tables']=dict(TABLES[p])
    d['fine']=re.findall(r'<p class="fine">(.*?)</p>',rng,re.S)
    G=GROUPS[p]; d['G']=G; d['V']={x['id']:x for x in items(G,'videos')}; d['D']={x['id']:x for x in items(G,'documents')}
    d['vid']=_V({k:(x.get('title',''),x.get('description',''),x.get('duration',''),os.path.basename(x.get('manual') or '')[:-4]) for k,x in d['V'].items()})
    d['name']={}
    return d
def dl(d,f,label,solid=False):
    x=d['D'].get('docs/'+f)
    if not x: return ''
    return f'<a class="dl{" solid" if solid else ""}" href="{e(x["file"])}" download="{e(x.get("download_name") or os.path.basename(x["file"]))}">{label}</a>'
def vid(d,v,cap=None):
    x=d['V'].get(v)
    if not x: return ''
    dur=(' · '+e(x['duration'])) if x.get('duration') else ''
    return f'<figure><div class="videobox"><video controls preload="none" poster="{e(x.get("poster"))}" src="{e(x["file"])}"></video></div><figcaption><b>{cap or e(x.get("title"))}</b>{e(x.get("description"))}{dur}</figcaption></figure>'
def vids(d,*vs):
    f=[y for y in (vid(d,v) for v in vs) if y]
    return (f'<div class="vids{" one" if len(f)==1 else ""}">'+''.join(f)+'</div>') if f else ''
def facts(*kv): return '<ul class="facts">'+''.join(f'<li><span>{k}</span><b>{v}</b></li>' for k,v in kv)+'</ul>'
def table(tb,keep=None):
    if keep:
        rows=re.findall(r'<tr>.*?</tr>',tb,re.S); tb='<table>'+rows[0]+''.join(r for r in rows[1:] if keep(re.sub(r'<[^>]+>','',re.search(r'<td>(.*?)</td>',r,re.S).group(1))))+'</table>'
    return f'<div class="scroll">{tb}</div>'
def sec(i,eyebrow,name,lead,fx,inner,links): return f'''<section class="subp" id="{i}"><div class="wrap"><div class="subhead"><div><p class="eyebrow">{eyebrow}</p><h2>{name}</h2><p class="lead">{lead}</p><div class="links">{links}</div></div>{fx}</div>{inner}</div></section>'''
def card(n,i,img,name,tag,bullets,wide=False,usa=False):
    u='<img class="usa" src="../media/usa.png" alt="Made in USA">' if usa else ''
    return f'<a class="card{" wide" if wide else ""}" href="#{i}"><div class="pic"><img src="{img}" alt="{name}">{u}</div><div class="txt"><span class="no">{n}</span><h3>{name}</h3><span class="tag">{tag}</span><ul>'+''.join(f'<li>{b}</li>' for b in bullets)+'</ul><span class="go">View details</span></div></a>'
def subpage(p,title,h1,crumbname,intro_count,cards,sections,d,alt):
    return  # sub-product pages are switched off (decision of November 26, 2026); the landing page is the group page
    body=f'''<div class="wrap"><p class="crumb"><a href="../">Products</a> / <b>{crumbname}</b></p>
<div class="herogrid"><div><p class="eyebrow">Local and district heating</p><h1>{h1}</h1><p class="sub">{d['sub']}</p>
<div class="cta"><a class="btn solid" href="#products">Sub-products</a><a class="btn" href="product.html">Full product page</a><a class="btn" href="../configurator/">Configurator</a></div></div>
<div class="heroimg"><img src="media/hero.jpg" alt="{alt}"></div></div></div>
<div class="wrap">{d['band']}</div></div></header>
<main>
<section id="products"><div class="wrap"><p class="eyebrow">{crumbname} family</p><h2>{intro_count}</h2><div class="grid">{''.join(cards)}</div></div></section>
{''.join(sections)}'''
    tabs=[('Sub-products','#products'),('Configurator','../configurator/'),('Academy','../academy/'),('Product page','product.html'),('Installation','product.html#installation'),('Downloads','product.html#documents'),('Contact','https://www.bruggpipes.com/us/contact/')]
    open(f'{SITE}/{p}/index.html','w',encoding='utf-8').write(page(title,'../',tabs,body,d['foot'],f'{crumbname} by BRUGG Pipes: sub-products with data, videos and documents.'))
FULL='<a class="dl" href="product.html">Full product page</a>'

# ---------- CASAFLEX ----------
d=info('casaflex'); T=d['tables']; uno=T['CASAFLEX UNO, PN 16 / PN 25']; duo=T['CASAFLEX DUO, PN 16']
fine=''.join(f'<p class="note">{x}</p>' for x in d['fine'])
defs=[('uno-pn16','CASAFLEX UNO PN 16','Single pipe','¾" to 3" (DN 20 to DN 80)','232 psi (PN 16)','install-uno-pn16','manual-uno-pn16.pdf',uno,lambda s:not s.startswith('4')),
      ('uno-pn25','CASAFLEX UNO PN 25','Single pipe','¾" to 3" (DN 20 to DN 80)','362 psi (PN 25)','install-uno-pn25','manual-uno-pn25.pdf',uno,lambda s:not s.startswith('4')),
      ('uno-dn100','CASAFLEX UNO DN 100','Single pipe','4" (DN 100)','232 psi (PN 16)','install-uno-dn100','manual-uno-dn100.pdf',uno,lambda s:s.startswith('4')),
      ('duo','CASAFLEX DUO','Twin pipe','2 × ¾" to 2 × 2" (DN 20 to DN 50)','232 psi (PN 16)','install-duo','manual-duo.pdf',duo,None)]
cards=[];secs=[]
for n,(i,name,kind,size,pr,v,m,tb,keep) in enumerate(defs,1):
    cards.append(card(n,i,f'media/poster-{v}.jpg',name,kind,[size,pr,'Bolted connection fitting, no field welds'],wide=True))
    secs.append(sec(i,kind,name,f'{size}, {pr}. One narrated installation video and the original installation manual for this connection fitting.',
        facts(('Sizes',size),('Operating pressure',pr),('Installation video',d['vid'][v][2]),('Installation manual','German / English')),
        table(tb,keep)+(fine if i=='duo' else '<p class="note">Values from the CASAFLEX Technical Data Sheet, November 16, 2026.</p>')+vids(d,v),dl(d,m,'Installation manual (PDF)',True)+dl(d,'technical-data-sheet.pdf','Technical Data Sheet (PDF)')+FULL))
subpage('casaflex','CASAFLEX by BRUGG Pipes: Sub-products','CASAFLEX – Flexible Pipe for District Energy and Steam Condensate','CASAFLEX','Four sub-products. Pick yours.',cards,secs,d,'CASAFLEX laid in a curve from the trench into a building')

# ---------- PREMANT ----------
d=info('premant'); T=d['tables']; fine=''.join(f'<p class="note">{x}</p>' for x in d['fine'])
cards=[card(1,'uno','../media/premant.png','PREMANT UNO','Single pipe',['¾" to 40" (DN 20 to DN 1000)','291 °F (144 °C) continuous','22 sizes, three insulation series']),
 card(2,'duo','../media/premant.png','PREMANT DUO','Twin pipe',['2 × ¾" to 2 × 8" (DN 20 to DN 200)','266 °F (130 °C) continuous','11 sizes, two service pipes in one jacket']),
 card(3,'unlincon','media/poster-install-unlincon.jpg','UNLINCON joint casing','Field joint',['Shrink joint casing','Double sealing','Video and manual'],wide=True),
 card(4,'inducon','media/inducon-2.jpg','INDUCON welded joint','Field joint',['Joint casing welded by induction','For groundwater and difficult ground','Casing sizes 3.54 to 27.95 in (90 to 710 mm)'],wide=True),
 card(5,'joints','media/casing.jpg','Joints and sleeves','Data',['UNLINCON, LINCON, INDUCON, EWELCON','Design, sizes, technical data','Technical Data Sheet Joints'],wide=True),
 card(6,'installation','media/poster-install-pipe.jpg','Installation and training','Videos',['Pipe installation in ten steps','Online training: planning and statics','Installation Manual'],wide=True)]
secs=[sec('uno','Single pipe','PREMANT UNO','22 single-pipe sizes from ¾" to 40" (DN 20 to DN 1000). Steel service pipe, polyurethane foam and PE jacket, bonded into one unit to EN 253.',
   facts(('Sizes','¾" to 40" (DN 20 to DN 1000)'),('Continuous temperature','291 °F (144 °C)'),('Operating pressure','362 psi (25 bar)*'),('Standards','EN 253, EN 448, EN 488, EN 489, EN 13941')),
   table(T['PREMANT UNO'])+fine+'<p class="note">* Not valid for all temperature and diameter combinations. Higher temperatures on request.</p>',dl(d,'technical-data-sheet.pdf','Technical Data Sheet (PDF)',True)+dl(d,'catalog-uno.pdf','Catalog UNO (PDF)')+FULL),
 sec('duo','Twin pipe','PREMANT DUO','11 twin-pipe sizes from 2 × ¾" to 2 × 8". Two service pipes in one jacket.',
   facts(('Sizes','2 × ¾" to 2 × 8" (DN 20 to DN 200)'),('Continuous temperature','266 °F (130 °C)'),('Operating pressure','362 psi (25 bar)*'),('Standard','EN 15698')),
   table(T['PREMANT DUO, two service pipes in one jacket'])+'<p class="note">* Not valid for all temperature and diameter combinations.</p>',dl(d,'technical-data-sheet.pdf','Technical Data Sheet (PDF)',True)+dl(d,'catalog-duo.pdf','Catalog DUO (PDF)')+FULL),
 sec('unlincon','Field joint','UNLINCON joint casing','Non-crosslinked shrink joint casing. Sealing tape inside, shrink sleeves outside: every casing is sealed twice. Joint casings are installed by trained personnel; BRUGG trains your crew if needed.',
   facts(('Type','Shrink joint casing, double sealing'),('Installation video',d['vid']['install-unlincon'][2]),('Manual','Original (German / English) and English edition')),
   vids(d,'install-unlincon'),dl(d,'manual-unlincon-en.pdf','Manual, English edition (PDF)',True)+dl(d,'manual-unlincon.pdf','Manual, original (PDF)')+dl(d,'technical-data-sheet-joints.pdf','Joints data sheet (PDF)')),
 sec('inducon','Field joint','INDUCON welded joint','For groundwater, pressurized water and difficult ground. A stainless steel mesh band is heated without contact and welds the joint casing to the jacket all the way round. No wires leave the joint, so there is no path for moisture.',
   facts(('Casing pipe sizes','3.54 to 27.95 in (90 to 710 mm)'),('Welding equipment','230 V / 16 A, run from a standard generator'),('Unit weight','33 lb (15 kg)')),
   '<div class="figs three photo"><figure><img src="media/inducon-1.jpg" alt="Welding band on the jacket"><figcaption><b>1. Fit the welding band</b>Patented hooks hold the band without staples or nails. The jacket stays undamaged.</figcaption></figure><figure><img src="media/inducon-2.jpg" alt="Induction coil on the joint casing"><figcaption><b>2. Weld automatically</b>The generator detects the coil and runs the weld. One person carries the 33 lb (15 kg) unit.</figcaption></figure><figure><img src="media/inducon-3.jpg" alt="Pressure test of the joint"><figcaption><b>3. Test and record</b>Every joint is pressure tested. Welding data is read out online for the record.</figcaption></figure></div>',
   dl(d,'inducon-brochure.pdf','INDUCON brochure (PDF)',True)+'<a class="dl" href="https://youtu.be/NgTGAVtfx0I" target="_blank" rel="noopener">INDUCON video on YouTube</a>'+dl(d,'technical-data-sheet-joints.pdf','Joints data sheet (PDF)')),
 sec('joints','Data','Joints and sleeves','UNLINCON, LINCON, INDUCON and EWELCON joint casings, with reduction, fitting and end sleeves: design, sizes and technical data in one data sheet.',
   facts(('Document','Technical Data Sheet Joints, 4 pages'),('Status','Draft')),'',dl(d,'technical-data-sheet-joints.pdf','Technical Data Sheet Joints (PDF)',True)+FULL),
 sec('installation','Videos','Installation and training','Pipe installation from the truck to the backfilled trench in ten steps, and the online training on planning, statics, handling and trench.',
   facts(('Pipe installation video',d['vid']['install-pipe'][2]),('Online training',d['vid']['install-training'][2]),('Installation Manual','8 pages, draft')),
   vids(d,'install-pipe','install-training'),dl(d,'manual-installation.pdf','Installation Manual (PDF)',True)+'<a class="dl" href="product.html#installation">All installation content</a>')]
subpage('premant','PREMANT by BRUGG Pipes: Sub-products','PREMANT – Rigid District Heating Pipe from a Top Manufacturer','PREMANT','Six sub-products and services. Pick yours.',cards,secs,d,'PREMANT pipes stacked on site')

# ---------- CALPEX ----------
d=info('calpex'); T=d['tables']; fine=''.join(f'<p class="note">{x}</p>' for x in d['fine'])
P=[('uno-sdr9','CALPEX PUR-KING UNO, SDR 9','Single pipe, ASTM','CALPEX PUR-KING UNO, SDR 9 (ASTM)','¾" to 2", ASTM F876 / F877, NSF 61','160 psi at 73.4 °F, 100 psi at 180 °F, 80 psi at 200 °F'),
   ('duo-sdr9','CALPEX PUR-KING DUO, SDR 9','Twin pipe, ASTM','CALPEX PUR-KING DUO, SDR 9 (ASTM)','2 × ¾" to 2 × 2", ASTM F876 / F877, NSF 61','160 psi at 73.4 °F, 100 psi at 180 °F, 80 psi at 200 °F'),
   ('uno-sdr11','CALPEX PUR-KING UNO, SDR 11','Single pipe, metric','CALPEX PUR-KING UNO, SDR 11 (metric)','25 to 140 mm carrier pipe','125 psi at 73 °F, 80 psi at 180 °F, 65 psi at 200 °F'),
   ('duo-sdr11','CALPEX PUR-KING DUO, SDR 11','Twin pipe, metric','CALPEX PUR-KING DUO, SDR 11 (metric)','2 × 25 to 2 × 63 mm carrier pipe','125 psi at 73 °F, 80 psi at 180 °F, 65 psi at 200 °F')]
cards=[];secs=[]
for n,(i,name,kind,tt,size,pr) in enumerate(P,1):
    nt=len(re.findall('<tr>',T[tt]))-1
    cards.append(card(n,i,'../media/calpex.png',name,kind,[size,f'{nt} types','203 °F (95 °C) maximum'],usa=False))
    secs.append(sec(i,kind,name,f'{nt} types. PEX-a carrier pipe with EVOH oxygen barrier, polyurethane foam and corrugated LLD-PE jacket in one bonded piece.',
      facts(('Range',size),('Maximum operating temperature','203 °F (95 °C)'),('Pressure',pr),('Thermal expansion','Self-compensating')),
      table(T[tt])+fine,dl(d,'technical-data-sheet.pdf','Technical Data Sheet (PDF)',True)+dl(d,'manual-01.pdf','Installation Manual (PDF)')+FULL))
cards.append(card(5,'installation','media/poster-install-01.jpg','General installation','Video and manual',['Laying, pipe ends, fittings','Wall entry, pressure test',d['vid']['install-01'][2]],wide=True))
cards.append(card(6,'accessories','media/poster-install-02.jpg','Accessories and tools','10 items',['Connecting socket, shells, chamber','Laying, unwinding, press and squeeze-off tools','One video and one manual each'],wide=True))
secs.append(sec('installation','Video and manual','General installation','Laying, pipe ends, fittings, connecting socket, wall entry and pressure test. Installation is done by trained personnel; BRUGG offers training on site or online.',
   facts(('Installation video',d['vid']['install-01'][2]),('Installation Manual','11 pages')),vids(d,'install-01'),dl(d,'manual-01.pdf','Installation Manual (PDF)',True)+'<a class="dl" href="product.html#installation">All installation content</a>'))
acc=''; _acc=[x for k,x in d['V'].items() if k not in ('install-01','product')]
for x in _acc:
    m=os.path.basename(x.get('manual') or '')
    acc+=f'<article><img src="{e(x.get("poster"))}" alt="{e(x.get("title"))}" loading="lazy"><div><h4>{e(x.get("title"))}</h4><p>{e(x.get("description"))} · {e(x.get("duration"))}</p><div class="links"><button type="button" class="dl" data-play="{e(x["file"])}" data-poster="{e(x.get("poster"))}" data-target="accplayer" data-title="{e(x.get("title"))}" data-dur="{e(x.get("duration"))}">Watch video</button>{dl(d,m,"Manual (PDF)") if m else ""}</div></div></article>'
_f=_acc[0] if _acc else {'file':'','poster':'','title':'','duration':''}
secs.append(sec('accessories','Accessories and tools','Joints, shells, chamber and tools','Ten accessories and tools for CALPEX, each with a narrated step-by-step video and its own installation manual.',
   facts(('Items',str(len(_acc))),('Per item','1 video, 1 installation manual (PDF)')),
   f'<div class="player"><div class="videobox"><video id="accplayer" controls preload="none" poster="{e(_f.get("poster"))}" src="{e(_f["file"])}"></video></div><p id="accplayer-cap"><b>{e(_f.get("title"))}</b> · {e(_f.get("duration"))}</p></div><div class="acc">{acc}</div>',FULL))
subpage('calpex','CALPEX by BRUGG Pipes: Sub-products','CALPEX – Flexible Pre-Insulated PEX Pipe for District Heating and Cooling','CALPEX','Four pipe series, general installation and ten accessories.',cards,secs,d,'CALPEX PUR-KING coil on site')

# ---------- ARMOPEX ----------
d=info('armopex'); T=d['tables']; fine=''.join(f'<p class="note">{x}</p>' for x in d['fine'])
cards=[card(1,'uno','../media/armopex.jpg','ARMOPEX UNO','Single pipe',['Seven sizes, 40/91 to 125/182','174 psi (12 bar)','185 °F (85 °C) continuous']),
 card(2,'connectors','media/fit-coupling.png','Clamp connectors','Fittings',['Male thread, weld end','Coupling, T-connector','Installed without special tools'],wide=True),
 card(3,'installation','media/poster-install-en.jpg','Installation','Videos and manual',['Screw fitting, step by step','English and Ukrainian narration','Installation Manual, US edition'],wide=True)]
secs=[sec('uno','Single pipe','ARMOPEX UNO','Seven sizes in coils. Aramid-reinforced PE-Xa carrier pipe with aluminum oxygen barrier, PUR foam and LLDPE jacket.',
   facts(('Sizes','40/91 to 125/182'),('Operating pressure','174 psi (12 bar)'),('Continuous temperature','185 °F (85 °C)'),('Peak temperature','239 °F (115 °C) for 100 h')),
   table(T['ARMOPEX UNO'])+fine+'<h3 class="sub">Trench, two pipes</h3>'+table(T['Trench, two pipes']),dl(d,'technical-data-sheet.pdf','Technical Data Sheet (PDF)',True)+dl(d,'catalog.pdf','Catalog (PDF)')+FULL),
 sec('connectors','Fittings','Clamp connectors','Clamp connectors with steel insert, brass clamp and stainless steel bolts, installed without special tools. Also available: 90° house entry bends, pre-insulated T-connections, clip shells, connecting sockets, end caps and wall seals.',
   facts(('System','One screw fitting system for all seven sizes'),('Document','Fittings and Accessories Data, 3 pages')),
   '<div class="figs"><figure><img src="media/fit-thread.png" alt="Clamp connector with male thread"><figcaption><b>Male thread</b>1¼ in to 4 in</figcaption></figure><figure><img src="media/fit-weld.png" alt="Clamp connector with weld end"><figcaption><b>Weld end</b>Steel insert, weldable</figcaption></figure><figure><img src="media/fit-coupling.png" alt="Clamp coupling"><figcaption><b>Coupling</b>Straight or 90°</figcaption></figure><figure><img src="media/fit-tee.png" alt="Clamp T-connector"><figcaption><b>T-connector</b>Branch, equal</figcaption></figure></div>',
   dl(d,'fittings-and-accessories-data.pdf','Fittings and Accessories Data (PDF)',True)+FULL),
 sec('installation','Videos and manual','Installation','One screw fitting system for all seven sizes. The narrated video follows the installation manual step by step. Installation only by trained personnel; training is offered on site or online.',
   facts(('Video, English',d['vid']['install-en'][2]),('Video, Ukrainian',d['vid']['install-uk'][2]),('Manual','US edition and factory original')),
   vids(d,'install-en','install-uk'),dl(d,'installation-manual.pdf','Installation Manual, US edition (PDF)',True)+dl(d,'installation-manual-original.pdf','Factory original (PDF)')+dl(d,'unloading-and-storage.pdf','Unloading and Storage (PDF)'))]
subpage('armopex','ARMOPEX by BRUGG Pipes: Sub-products','ARMOPEX – Flexible Pipe for Medium-Pressure District Heating','ARMOPEX','Pipe, connectors and installation.',cards,secs,d,'ARMOPEX pipes in the trench')

# ---------- patch product pages ----------
TITLE={'casaflex':'CASAFLEX by BRUGG Pipes','premant':'PREMANT by BRUGG Pipes','calpex':'CALPEX by BRUGG Pipes','armopex':'ARMOPEX by BRUGG Pipes','bioflex':'BIOFLEX by BRUGG Pipes'}
for p,t in TITLE.items():
    h=rd(p); N=p.upper()
    h=h.replace('<meta charset="utf-8">','<meta charset="utf-8">'+CSPMETA,1)
    h=re.sub(r'<title>.*?</title>',f'<title>{t}</title><link rel="icon" href="../media/logo.png">',h,count=1)
    h=h.replace('<a class="brand" href="#top">','<a class="brand" href="../">')
    h=h.replace('<a href="https://www.bruggpipes.com/us/products/" target="_blank" rel="noopener">All products</a>',f'<a href="../">All products</a><a href="../configurator/">Configurator</a><a href="../academy/">Academy</a><a href="https://brugg.partcommunity.com/3d-cad-models/sso/?languageIso=en" target="_blank" rel="noopener">CAD / BIM library</a>')
    h=re.sub(r'<p class="crumb">.*?</p>',f'<p class="crumb"><a href="../" style="color:inherit">Products</a> / <b>{N}</b></p>',h,count=1,flags=re.S)
    h=re.sub(r'(<a class="dl[^"]*" href="[^"]+" target="_blank" rel="noopener")( data-file="[^"]+" data-name="([^"]+)")',lambda m:f'{m.group(1)} download="{m.group(3)}"{m.group(2)}',h)
    for t,tb in re.findall(r'<h3 class="sub"[^>]*>(.*?)</h3><div class="scroll">(<table[^>]*>.*?</table>)</div>',h,re.S):
        if html.unescape(t) in TABLES.get(p,{}): h=h.replace(tb,TABLES[p][html.unescape(t)])
    h=apply_group(h,GROUPS[p],p)
    h=h.replace(' oncontextmenu="return false"','')
    js=[]
    h=re.sub(r'<script>(.*?)</script>',lambda m:(js.append(m.group(1)),'')[1],h,flags=re.S)
    if not os.path.exists(f'{SITE}/{p}/docs/guide-specification.docx'): h=re.sub(r'<li>(?:(?!</li>).)*guide-specification\.docx(?:(?!</li>).)*</li>','',h,flags=re.S)
    js.append('''(function(){var q=new URLSearchParams(location.search).get('v');if(!q)return;var t=document.querySelector('.tab[data-v="'+q.replace(/[^a-z0-9-]/g,'')+'"]');if(t)t.click();})();''')
    open(f'{SITE}/{p}/product.js','w',encoding='utf-8').write('"use strict";\n'+'\n'.join(js))
    h=h.replace('src="media/logo.png"','src="/media/logo.png"')
    h=h.replace('</body>','<script src="product.js" defer></script>\n</body>')
    h=h.replace('<a href="#contact">Contact</a>','<a href="https://www.bruggpipes.com/us/contact/" target="_blank" rel="noopener">Contact</a>').replace('<a href="https://www.bruggpipes.com/us/" target="_blank" rel="noopener"><small>Web</small><b>bruggpipes.com</b></a>','<a href="https://www.bruggpipes.com/us/contact/" target="_blank" rel="noopener"><small>Contact page</small><b>bruggpipes.com/us/contact</b></a>')
    h=h.replace('<a href="https://www.bruggpipes.com/us/t-c/">Terms and conditions</a></p>','<a href="https://www.bruggpipes.com/us/t-c/">Terms and conditions</a></p>'+SOC)
    h=h.replace('<a class="btn" href="#documents">Downloads</a></div>','<a class="btn" href="#documents">Downloads</a><a class="btn" href="../configurator/">Configurator</a></div>',1)
    h=restyle(h,'../','products',t,f'{N} by BRUGG Pipes: data, videos and documents for North America.')
    open(f'{SITE}/{p}/index.html','w',encoding='utf-8').write(h)
# ---------- BIOFLEX sizing tool (calculates in the browser, same header and footer as all pages) ----------
if os.path.exists(SRC+'/bioflex-sizing.html'):
    h=rd('bioflex-sizing')
    h=h.replace('<meta charset="utf-8">','<meta charset="utf-8">'+CSPMETA,1)
    h=re.sub(r'<p class="crumb">.*?</p>','<p class="crumb"><a href="../" style="color:inherit">Products</a> / <a href="./" style="color:inherit">BIOFLEX</a> / <b>Sizing tool</b></p>',h,count=1,flags=re.S)
    h=h.replace('<a class="brand" href="#top">','<a class="brand" href="../">').replace('src="media/logo.png"','src="/media/logo.png"').replace('href="index.html','href="./')
    h=restyle(h,'../','products','BIOFLEX Sizing Tool by BRUGG Pipes','BIOFLEX sizing tool: heating pipe for digesters, calculated in the browser.')
    js=[]
    h=re.sub(r'<script>(.*?)</script>',lambda m:(js.append(m.group(1)),'')[1],h,flags=re.S)
    open(f'{SITE}/bioflex/sizing.js','w',encoding='utf-8').write('"use strict";\n'+'\n'.join(js))
    open(f'{SITE}/bioflex/sizing.html','w',encoding='utf-8').write(h.replace('</body>','<script src="sizing.js" defer></script>\n</body>'))
exec(open(ROOT+'/tools/configurator.py',encoding='utf-8').read())
build_extra()
print('built;',len(set(MISSING)),'files referenced in data/ are not in site/ and are hidden')
