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
            z={'label':label.replace('*',''),'id':idmm,'idUS':idus,'jacket':r[col[s['jacketCol']]][0],'jacketSI':r[col[s['jacketCol']]][1]}
            if s.get('bendCol'): z['bend']=r[col[s['bendCol']]][0]; z['bendSI']=r[col[s['bendCol']]][1]
            if s.get('coilCol'):
                c=r[col[s['coilCol']]]; z['coil']=c[0] if isinstance(c,list) else c; z['coilSI']=c[1] if isinstance(c,list) else c; z['coilFt']=_num(c[0]) if isinstance(c,list) else None
            if s['material']=='corrugated': z['f']=FCOR[str(int(idmm))]
            lim=dict(s['limits']); lim.update(s.get('rowLimits',{}).get(r[0],{})); z['lim']=lim
            sizes.append(z)
        out['series'].append({'product':p,'productName':P['name'],'code':P['code'],'type':P['type'],'id':s['id'],'name':s['name'],'pipes':s['pipes'],'material':s['material'],
          'pByT':s.get('pressureByTempF'),'note':s.get('note',''),'source':P['source'],'page':f'../{p}/#range','sizes':sizes})
out['shipping']=DATA['shipping']; out['accessories']={k:[x for x in v if not x.get('img') or exists(x['img']) or x.update(img='') is None] for k,v in DATA['accessories'].items() if k!='_rule'}; out['accRule']=DATA['accessories']['_rule']
os.makedirs(SITE+'/data',exist_ok=True); os.makedirs(SITE+'/configurator',exist_ok=True)
json.dump(out,open(SITE+'/data/products.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))

_body='''<div class="wrap"><p class="crumb"><a href="../">Products</a> / <b>Configurator</b></p>
<div class="intro" style="padding-top:22px;padding-bottom:30px"><p class="eyebrow">North America</p><h1>Configurator</h1><p class="sub">From your route and operating data to pipe sizes, fittings, truck loads and a project summary.</p><p class="sub" style="margin-top:10px;font-size:15px">Heating a biogas digester? Use the <a href="../bioflex/sizing.html" style="color:inherit;font-weight:700">BIOFLEX digester sizing tool</a>.</p></div></div></header>
<main>
<section class="cfg" id="cfg"><div class="wrap">
<div class="unitbar"><span id="unitlabel">Units</span><div class="seg" role="group" aria-labelledby="unitlabel"><button type="button" id="u-us" aria-pressed="true">Imperial (°F, ft, MBH, psi)</button><button type="button" id="u-si" aria-pressed="false">Metric (°C, m, kW, bar)</button></div></div>
<ol class="steps5" id="progress" aria-label="Progress"><li class="on"><small>Step 1</small>Use case</li><li><small>Step 2</small>Route and data</li><li><small>Step 3</small>Pipe system</li><li><small>Step 4</small>Fittings and transport</li><li><small>Step 5</small>Contact</li></ol>
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
<div class="cfgnav"><span></span><button class="btn solid" type="submit">Next</button></div></form>

<form id="s2" class="step" novalidate hidden><h2>Route and operating data</h2><p class="hint">These values select the systems and sizes that fit your project.</p>
<h3>Temperature and pressure</h3><div class="row4">
<label>Supply temperature<span class="unit"><input id="tin" type="number" inputmode="decimal" step="any" required><i data-u="T"></i></span></label>
<label>Return temperature<span class="unit"><input id="tout" type="number" inputmode="decimal" step="any" required><i data-u="T"></i></span></label>
<label>Peak temperature <em>(optional)</em><span class="unit"><input id="tpeak" type="number" inputmode="decimal" step="any"><i data-u="T"></i></span></label>
<label>Max. operating pressure <em>(optional)</em><span class="unit"><input id="pmax" type="number" inputmode="decimal" step="any"><i data-u="p"></i></span></label></div>
<h3>Route</h3><p class="hint">Enter the route section by section, from the heat source to each building. Every section is a supply and a return line. A section carries the load of its own building and of every building behind it.</p>
<div class="row2"><label>Name of the heat source<input id="source" type="text" maxlength="40" value="Boiler room"></label><span></span></div>
<div class="scroll"><table class="route" id="route"><thead><tr><th>From</th><th>To (building)</th><th>Trench length, <span data-u="L"></span></th><th>Heat load of this building, <span data-u="P"></span></th><th></th></tr></thead><tbody></tbody></table></div>
<p><button class="dl" type="button" id="addsec">Add a section</button></p>
<p class="hint" id="loadhint"></p>
<p class="calcline" id="flow" aria-live="polite"></p>
<div class="cfgnav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Next</button></div></form>

<form id="s3" class="step" novalidate hidden><h2>Pipe system</h2><p class="calcline" id="recap"></p><p class="hint" id="s3hint">Choose a system. The configurator proposes a size for every section; you can change it.</p>
<div id="systems" class="systems" role="radiogroup" aria-label="Pipe system"></div>
<div id="detail"></div><div id="unsuitable"></div>
<p class="note" id="method"></p>
<div class="cfgnav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Next</button></div></form>

<form id="s4" class="step" novalidate hidden><h2>Fittings and transport</h2><p class="hint" id="s4hint"></p>
<h3>Fittings and building entries</h3><div id="fittings"></div>
<h3>Transport</h3><div class="row3"><label>Delivery city<input id="dcity" type="text" maxlength="60" autocomplete="address-level2"></label><label>State or province<input id="dstate" type="text" maxlength="40" autocomplete="address-level1"></label><label>ZIP or postal code <em>(optional)</em><input id="dzip" type="text" maxlength="12" autocomplete="postal-code"></label></div>
<div id="transport"></div>
<label style="margin-top:22px">Notes for BRUGG Pipes <em>(optional)</em><textarea id="notes" rows="3" maxlength="800"></textarea></label>
<div class="cfgnav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Next</button></div></form>

<form id="s5" class="step" novalidate hidden><h2>Contact information</h2>
<div class="row2"><label>First name<input id="fn" type="text" maxlength="60" autocomplete="given-name" required></label><label>Last name<input id="ln" type="text" maxlength="60" autocomplete="family-name" required></label></div>
<div class="row2"><label>Company<input id="co" type="text" maxlength="100" autocomplete="organization" required></label><label>Project name <em>(optional)</em><input id="pr" type="text" maxlength="100"></label></div>
<div class="row2"><label>Email<input id="em" type="email" maxlength="120" autocomplete="email" required></label><label>Phone <em>(optional)</em><input id="ph" type="tel" maxlength="30" autocomplete="tel"></label></div>
<p class="msg ok">Nothing you enter is stored or sent by this page. Your request leaves your device only when you send the email from your own mail program.</p>
<div class="cfgnav"><button class="btn" type="button" data-back>Previous</button><button class="btn solid" type="submit">Project summary</button></div></form>

<div id="s6" class="step" hidden><h2>Project summary</h2><p class="hint">Check the summary, then send it to BRUGG Pipes. We answer with an offer.</p>
<div id="sumhtml" class="sum"></div>
<div class="cfgnav"><button class="btn" type="button" data-back>Previous</button><span class="right"><a class="btn" href="./">Start over</a><a class="btn" id="mail" href="mailto:sales.bpna@brugg.com">Plain-text email</a><button class="btn" type="button" id="copyhtml">Copy formatted email</button><button class="btn solid" type="button" id="pdf">Download PDF</button><button class="btn solid" type="button" id="eml">Email draft with PDF</button></span></div>
<p class="hint" id="copied" aria-live="polite"></p><pre id="summary" hidden></pre></div>
</div></section>'''
_h=page('BRUGG Pipes Configurator: North America','../',[('All products','../'),('Configurator','./'),('Academy','../academy/'),('CAD / BIM',CAD),('Contact','https://www.bruggpipes.com/us/contact/')],_body,
 'Velocity and pressure loss are estimates for water and do not replace project engineering by BRUGG Pipes. Product values from the Technical Data Sheets. Subject to technical changes.',
 'BRUGG Pipes configurator for North America: suitable pre-insulated pipe systems with velocity and pressure loss in US units.')
_h=_h.replace('<link rel="stylesheet" href="../assets/site.css">','<link rel="stylesheet" href="../assets/site.css"><link rel="stylesheet" href="configurator.css">').replace('<script src="../assets/site.js" defer></script>','<script src="configurator-calc.js" defer></script><script src="configurator-export.js" defer></script><script src="configurator.js" defer></script>')
open(SITE+'/configurator/index.html','w',encoding='utf-8').write(_h)
