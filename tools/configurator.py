# executed by build.py: configurator page, its data file, script and styles
def _num(x):
    m=re.search(r'-?\d[\d,]*\.?\d*',x); return float(m.group(0).replace(',','')) if m else None
H=DATA['hydraulics']; out={'updated':DATA['updated'],'rule':H['designRulePaPerM'],'roughness':H['roughnessMm'],'cp':H['cpKJkgK'],'series':[]}
cf=DATA['products']['casaflex']['hydraulics']; Qref=cf['reference']['massFlowKgH']/3600/cf['reference']['densityKgM3']
FCOR={}
for k,dp in cf['pointsByInnerDiameterMm'].items():
    D=float(k)/1000; v=Qref/(math.pi*D*D/4); FCOR[k]=round(dp*2*D/(cf['reference']['densityKgM3']*v*v),4)
for p,P in DATA['products'].items():
    for s in P['series']:
        if s.get('config') is False: continue
        col={c:i for i,c in enumerate(s['columns'])}; sizes=[]
        for r in s['rows']:
            if 'steelCol' in s:
                od,wall=[float(x) for x in re.findall(r'[\d.]+',r[col[s['steelCol']]][1])[:2]]; idmm=round(od-2*wall,1); idus=f'{idmm/25.4:.3f} in'
                label=f'{r[0]} ({r[1]})'
            else:
                c=r[col[s['idCol']]]; idmm=_num(c[1]); idus=c[0]; label=(r[1]+' · '+r[0]) if p=='casaflex' else r[0]
            z={'label':label.replace('*',''),'id':idmm,'idUS':idus,'jacket':r[col[s['jacketCol']]][0]}
            if s.get('bendCol'): z['bend']=r[col[s['bendCol']]][0]
            if s.get('coilCol'):
                c=r[col[s['coilCol']]]; z['coil']=c[0] if isinstance(c,list) else c; z['coilFt']=_num(c[0]) if isinstance(c,list) else None
            if s['material']=='corrugated': z['f']=FCOR[str(int(idmm))]
            lim=dict(s['limits']); lim.update(s.get('rowLimits',{}).get(r[0],{})); z['lim']=lim
            sizes.append(z)
        out['series'].append({'product':p,'productName':P['name'],'type':P['type'],'id':s['id'],'name':s['name'],'pipes':s['pipes'],'material':s['material'],
          'pByT':s.get('pressureByTempF'),'note':s.get('note',''),'source':P['source'],'page':f'../{p}/#range','sizes':sizes})
os.makedirs(SITE+'/data',exist_ok=True); os.makedirs(SITE+'/configurator',exist_ok=True)
json.dump(out,open(SITE+'/data/products.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))

_body='''<div class="wrap"><p class="crumb"><a href="../">Products</a> / <b>Configurator</b></p>
<div class="intro" style="padding-top:22px;padding-bottom:30px"><p class="eyebrow">North America</p><h1>Configurator</h1><p class="sub">Five steps from your operating data to a request for a quote. US units throughout, metric in parentheses.</p></div></div></header>
<main>
<section class="cfg" id="cfg"><div class="wrap">
<ol class="steps5" id="progress" aria-label="Progress"><li class="on"><small>Step 1</small>Use case</li><li><small>Step 2</small>Specifications</li><li><small>Step 3</small>Products</li><li><small>Step 4</small>Supplementary materials</li><li><small>Step 5</small>Contact information</li></ol>
<noscript><p class="msg err">The configurator needs JavaScript. You can also send your data to sales.bpna@brugg.com.</p></noscript>
<p class="msg err" id="err" role="alert" hidden></p>

<form id="s1" class="step" novalidate><h2>Use case</h2>
<div class="row2"><label>Country of operation<select id="country" required><option value="United States of America">United States of America</option><option value="Canada">Canada</option></select></label><span></span></div>
<h3>Medium</h3><p class="hint">Select the medium you want to transport.</p>
<div class="media" role="radiogroup" aria-label="Medium">
<label><input type="radio" name="medium" value="Heating systems" checked><b>Heating systems</b><span>Local and district heating</span></label>
<label><input type="radio" name="medium" value="Cooling"><b>Cooling</b><span>District cooling and cooling systems</span></label>
<label><input type="radio" name="medium" value="Drinking water"><b>Drinking water</b><span>Hot and cold water systems</span></label>
<label><input type="radio" name="medium" value="Heat pump"><b>Heat pump</b><span>Heat pump networks</span></label>
<label><input type="radio" name="medium" value="Other"><b>Other</b><span>Let us discuss available options</span></label></div>
<div class="nav"><span></span><button class="btn solid" type="submit">Next</button></div></form>

<form id="s2" class="step" novalidate hidden><h2>Specifications</h2><p class="hint">These values are required to select the products that fit your requirements.</p>
<h3>Temperature</h3><div class="row3">
<label>Supply temperature<span class="unit"><input id="tin" type="number" inputmode="decimal" step="any" min="-40" max="400" required><i>°F</i></span></label>
<label>Return temperature<span class="unit"><input id="tout" type="number" inputmode="decimal" step="any" min="-40" max="400" required><i>°F</i></span></label>
<label>Peak temperature <em>(optional)</em><span class="unit"><input id="tpeak" type="number" inputmode="decimal" step="any" min="-40" max="400"><i>°F</i></span></label></div>
<h3>Length and load</h3><div class="row3">
<label>Route length<span class="unit"><input id="len" type="number" inputmode="decimal" step="any" min="1" max="100000" required><i>ft</i></span></label>
<label>Heat load<span class="unit"><input id="load" type="number" inputmode="decimal" step="any" min="1" max="10000000" required><i>MBH</i></span></label>
<label>Max. operating pressure <em>(optional)</em><span class="unit"><input id="pmax" type="number" inputmode="decimal" step="any" min="0" max="1000"><i>psi</i></span></label></div>
<p class="hint">1 MBH = 1,000 BTU/h. Route length is the trench length; single pipes need supply and return, twin pipes carry both in one jacket.</p>
<p class="calcline" id="flow" aria-live="polite"></p>
<div class="nav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Next</button></div></form>

<form id="s3" class="step" novalidate hidden><h2>Suitable products</h2><p class="calcline" id="recap"></p><p class="hint" id="s3hint">Select the sizes you would like an offer for.</p>
<div id="products"></div><div id="unsuitable"></div>
<p class="note" id="method"></p>
<div class="nav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Next</button></div></form>

<form id="s4" class="step" novalidate hidden><h2>Supplementary materials</h2><p class="hint">We include suitable fittings and accessories in our offer.</p>
<div class="row2"><label>Building entrances<span class="unit"><input id="entr" type="number" inputmode="numeric" step="1" min="0" max="999" value="0"><i>pcs</i></span></label><span></span></div>
<label>Notes for BRUGG Pipes <em>(optional)</em><textarea id="notes" rows="4" maxlength="800"></textarea></label>
<div class="nav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Next</button></div></form>

<form id="s5" class="step" novalidate hidden><h2>Contact information</h2>
<div class="row2"><label>First name<input id="fn" type="text" maxlength="60" autocomplete="given-name" required></label><label>Last name<input id="ln" type="text" maxlength="60" autocomplete="family-name" required></label></div>
<div class="row2"><label>Company<input id="co" type="text" maxlength="100" autocomplete="organization" required></label><label>Project name <em>(optional)</em><input id="pr" type="text" maxlength="100"></label></div>
<div class="row3"><label>Email<input id="em" type="email" maxlength="120" autocomplete="email" required></label><label>Phone <em>(optional)</em><input id="ph" type="tel" maxlength="30" autocomplete="tel"></label><label>State or province <em>(optional)</em><input id="st" type="text" maxlength="40" autocomplete="address-level1"></label></div>
<p class="msg ok">Nothing you enter is stored or sent by this page. Your request leaves your device only when you send the email from your own mail program.</p>
<div class="nav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Review request</button></div></form>

<div id="s6" class="step" hidden><h2>Your request</h2><p class="hint">Check the summary, then send it to BRUGG Pipes. We answer with an offer.</p>
<pre id="summary" tabindex="0"></pre>
<div class="nav"><button class="btn" type="button" data-back>Previous</button><span class="right"><button class="btn" type="button" id="print">Print or save as PDF</button><button class="btn" type="button" id="copy">Copy summary</button><a class="btn solid" id="mail" href="mailto:sales.bpna@brugg.com">Email request to BRUGG Pipes</a></span></div>
<p class="hint" id="copied" aria-live="polite"></p></div>
</div></section>'''
_h=page('BRUGG Pipes Configurator: North America','../',[('All products','../'),('Configurator','./'),('Academy','../academy/'),('CAD / BIM',CAD),('Contact','https://www.bruggpipes.com/us/contact/')],_body,
 'Velocity and pressure loss are estimates for water and do not replace project engineering by BRUGG Pipes. Product values from the Technical Data Sheets. Subject to technical changes.',
 'BRUGG Pipes configurator for North America: suitable pre-insulated pipe systems with velocity and pressure loss in US units.')
_h=_h.replace('<link rel="stylesheet" href="../assets/site.css">','<link rel="stylesheet" href="../assets/site.css"><link rel="stylesheet" href="configurator.css">').replace('<script src="../assets/site.js" defer></script>','<script src="configurator.js" defer></script>')
open(SITE+'/configurator/index.html','w',encoding='utf-8').write(_h)
