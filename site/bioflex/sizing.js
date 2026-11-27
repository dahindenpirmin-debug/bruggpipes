"use strict";

var CALPEX=[["0.75\"/3.07\"", "UNO", "SDR 9", 17.28, 701], ["1.00\"/3.07\"", "UNO", "SDR 9", 22.22, 701], ["1.25\"/3.07\"", "UNO", "SDR 9", 27.16, 701], ["1.50\"/3.66\"", "UNO", "SDR 9", 32.1, 427], ["2.00\"/4.45\"", "UNO", "SDR 9", 41.98, 300], ["2x0.75\"/3.66\"", "DUO", "SDR 9", 17.28, 427], ["2x1.00\"/4.45\"", "DUO", "SDR 9", 22.22, 300], ["2x1.25\"/5.03\"", "DUO", "SDR 9", 27.16, 213], ["2x1.50\"/6.42\"", "DUO", "SDR 9", 32.1, 91], ["2x2.00\"/7.20\"", "DUO", "SDR 9", 41.98, 37], ["25/76", "UNO", "SDR 11", 20.6, 701], ["32/76", "UNO", "SDR 11", 26.4, 701], ["40/91", "UNO", "SDR 11", 32.8, 427], ["50/111", "UNO", "SDR 11", 41.1, 300], ["63/126", "UNO", "SDR 11", 51.7, 213], ["75/142", "UNO", "SDR 11", 61.8, 107], ["90/162", "UNO", "SDR 11", 74.1, 91], ["110/162", "UNO", "SDR 11", 90.5, 91], ["125/182", "UNO", "SDR 11", 102.8, 37], ["140/202", "UNO", "SDR 11", 115.3, 35], ["25+25/91", "DUO", "SDR 11", 20.6, 427], ["32+32/111", "DUO", "SDR 11", 26.4, 300], ["40+40/126", "DUO", "SDR 11", 32.8, 213], ["50+50/162", "DUO", "SDR 11", 41.1, 91], ["63+63/182", "DUO", "SDR 11", 51.7, 37]];
/* BIOFLEX digester heating: sizing logic of the BRUGG design sheet "BIOFLEX Auslegung 2011" (metric inside, US units at the edges). */
var K_L=65,          // W/(m K): linear heat transfer value of BIOFLEX CNW 60/66 in the substrate (BRUGG design sheet)
    D_FLOW=0.063,    // m: flow diameter used by the design sheet
    RHO=1010,        // kg/m3 as in the design sheet
    CP={water:4184,glycol:3542},   // J/(kg K); glycol = water/glycol 65/35 (design sheet)
    WALL_GAP=0.4,    // m: loop diameter = tank diameter - 0.4 m
    END_ALLOW=2,     // m per circuit for the two ends
    COIL_MAX=150,    // m: single coil should stay below 150 m; about 100 m is ideal
    SPACING=1.0,     // m between brackets (3.3 ft; never more than 4 ft)
    ROW_PITCH=0.254, // m: 10 in between rows
    FIRST_ROW=0.914, // m: lowest row 3 ft above the floor
    RRK={meso:[0.08,0.18],thermo:[0.15,0.25]}; // m of pipe per m3 of digester volume
function up(x,step){return Math.ceil((x-1e-9)/step)*step}
function circuit(Ld,p){ // heat of one circuit of length L (m)
  var m=p.v*Math.PI*D_FLOW*D_FLOW/4*RHO, cp=CP[p.fluid];
  var tout=p.T+(p.tin-p.T)*Math.exp(-K_L*Ld/(cp*m));
  return {m:m,tout:tout,q:m*cp*(p.tin-tout)/1000};
}
function sizeBioflex(p){ // p: D,H (m), T,tin (C), q (kW), v (m/s), fluid, margin (0.1), loops (0=auto)
  var loop=Math.PI*(p.D-WALL_GAP), qd=p.q*(1+p.margin), opts=[], n;
  var rowsMax=Math.max(1,Math.floor((p.H-FIRST_ROW-0.3)/ROW_PITCH)+1);
  for(n=1;n<=4;n++){
    var L=n*loop+END_ALLOW, c=circuit(L,p), k=Math.ceil(qd/c.q-1e-9);
    var Lft=up(L*3.28084,10);
    opts.push({loops:n,L:L,Lft:Lft,circuits:k,qc:c.q,tout:c.tout,m:c.m,total:k*L,totalFt:k*Lft,rows:k*n,
      coilOk:L<=COIL_MAX||n===1,fits:k*n<=rowsMax});
  }
  var ok=opts.filter(function(o){return o.coilOk&&o.fits});
  if(!ok.length) ok=opts.filter(function(o){return o.coilOk});
  ok.sort(function(a,b){return a.circuits-b.circuits||a.total-b.total});
  var pick=p.loops?opts[p.loops-1]:ok[0];
  var vol=Math.PI*p.D*p.D/4*p.H, rrk=pick.total/vol, rng=RRK[p.T>=46?'thermo':'meso'];
  var perRow=Math.ceil(Math.PI*p.D/SPACING), bRows=Math.ceil(pick.rows/2), br=perRow*bRows, packs=Math.ceil(br/10);
  // pipe that is thermally needed for the heat required (no margin, no rounding to full loops)
  var qmax=pick.m*CP[p.fluid]*(p.tin-p.T)/1000, share=p.q/pick.circuits/qmax;
  var reqL=share<1?-CP[p.fluid]*pick.m/K_L*Math.log(1-share)*pick.circuits:null;
  return {reqL:reqL,loop:loop,qd:qd,opts:opts,pick:pick,vol:vol,rrk:rrk,rrkRange:rng,rrkOk:rrk>=rng[0]&&rrk<=rng[1],rowsMax:rowsMax,
    qInst:pick.circuits*pick.qc,flow:pick.circuits*pick.m,
    brackets:{perRow:perRow,rows:bRows,count:br,packs:packs,ordered:packs*10},
    fittings:{ends:2*pick.circuits,fix:packs*10+12*pick.circuits},
    stackTop:FIRST_ROW+(pick.rows-1)*ROW_PITCH, long:pick.L>COIL_MAX};
}
function water(t){ // density kg/m3 and dynamic viscosity Pa s of water at t (C)
  return {rho:1000.6-0.0128*Math.pow(t,1.76), mu:2.414e-5*Math.pow(10,247.8/(t+273.15-140))};
}
function dpPerM(mdot,idmm,t){ // Darcy-Weisbach, Swamee-Jain, PEX roughness 0.007 mm
  var w=water(t), d=idmm/1000, v=mdot/w.rho/(Math.PI*d*d/4), re=w.rho*v*d/w.mu;
  var f=re<2300?64/re:0.25/Math.pow(Math.log10(0.007/idmm/3.7+5.74/Math.pow(re,0.9)),2);
  return {v:v,dp:f/d*w.rho*v*v/2};
}
function sizeCalpex(mdot,tin,tout,routeM){
  if(tin>95) return {tooHot:true};
  var tm=(tin+tout)/2, res={}, kinds=['UNO','DUO'];
  kinds.forEach(function(kind){
    var c=CALPEX.filter(function(r){return r[1]===kind}).map(function(r){var h=dpPerM(mdot,r[3],tm);return {type:r[0],sdr:r[2],id:r[3],coil:r[4],v:h.v,dp:h.dp}})
      .filter(function(r){return r.dp<=200}).sort(function(a,b){return a.id-b.id||(a.sdr==='SDR 9'?-1:1)});
    if(c.length){var s=c[0]; var runs=kind==='UNO'?2:1; s.lenFt=up(routeM*runs*1.05*3.28084,10); s.coils=Math.ceil(s.lenFt/(runs*3.28084*s.coil)-1e-9)*runs; s.runs=runs; res[kind]=s;}
  });
  return res;
}
(function(){
var $=function(i){return document.getElementById(i)};
var FT=3.28084, f0=function(x){return Math.round(x).toLocaleString('en-US')}, f1=function(x){return (Math.round(x*10)/10).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})};
var toC=function(f){return (f-32)/1.8}, toF=function(c){return c*1.8+32};
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e}
function row(tb,cells,head){var tr=el('tr');cells.forEach(function(c){tr.appendChild(el(head?'th':'td',null,c))});tb.appendChild(tr);return tr}
var NS='http://www.w3.org/2000/svg';
function sv(t,a,txt){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;return e}
function draw(p,r){
  var g=$('fig'),k=r.pick;while(g.firstChild)g.removeChild(g.firstChild);
  var BL='#293D91',DK='#1B2A6B',ST='#8C93A3',LN='#C9CED8',INK='#16181D',GR='#4A5160',COL=[BL,'#6F7FC4',DK,'#9AA6DA'];
  var cx=330,rx=215,ry=40,top=78,bot=372,xl=cx-rx,xr=cx+rx;
  function add(t,a,txt){var e=sv(t,a,txt);g.appendChild(e);return e}
  function txt(x,y,s,a){a=a||{};a.x=x;a.y=y;if(!a['font-size'])a['font-size']=13;if(!a.fill)a.fill=GR;return add('text',a,s)}
  // tank
  add('path',{d:'M'+xl+' '+top+' L'+xl+' '+bot+' A'+rx+' '+ry+' 0 0 0 '+xr+' '+bot+' L'+xr+' '+top,fill:'#EEF1F8',stroke:ST,'stroke-width':2});
  add('ellipse',{cx:cx,cy:bot,rx:rx,ry:ry,fill:'none',stroke:LN,'stroke-width':1.5,'stroke-dasharray':'5 5'});
  var lvl=top+26; add('ellipse',{cx:cx,cy:lvl,rx:rx,ry:ry,fill:'#DCE2F3',stroke:LN,'stroke-width':1.5});
  add('ellipse',{cx:cx,cy:top,rx:rx,ry:ry,fill:'none',stroke:ST,'stroke-width':2});
  txt(cx,lvl+5,'liquid level',{'text-anchor':'middle','font-size':12});
  // diameter
  add('line',{x1:xl,y1:26,x2:xr,y2:26,stroke:GR,'stroke-width':1});add('line',{x1:xl,y1:20,x2:xl,y2:32,stroke:GR});add('line',{x1:xr,y1:20,x2:xr,y2:32,stroke:GR});
  txt(cx,20,'Digester Ø '+f0(p.D*FT)+' ft ('+f1(p.D)+' m)',{'text-anchor':'middle',fill:INK,'font-weight':600});
  // rows
  var rows=k.rows, y0=bot-34, avail=y0-(lvl+48), pitch=rows>1?Math.min(30,avail/(rows-1)):0, sw=rows>10?4:6;
  function ell(y,c,front){return add('path',{d:'M'+xl+' '+y+' A'+rx+' '+ry+' 0 0 '+(front?0:1)+' '+xr+' '+y,fill:'none',stroke:c,'stroke-width':front?sw:Math.max(2,sw-3),'stroke-linecap':'round',opacity:front?1:.45})}
  var i,c,n,y,yA,yB,col;
  for(c=0;c<k.circuits;c++){ col=COL[c%COL.length];
    for(n=0;n<k.loops;n++){ y=y0-(c*k.loops+n)*pitch; ell(y,col,false) } }
  for(c=0;c<k.circuits;c++){ col=COL[c%COL.length]; yA=y0-(c*k.loops)*pitch; yB=y0-(c*k.loops+k.loops-1)*pitch;
    for(n=0;n<k.loops;n++){ y=y0-(c*k.loops+n)*pitch; ell(y,col,true);
      if(n<k.loops-1) add('path',{d:'M'+xr+' '+y+' q14 '+(-pitch/2)+' 0 '+(-pitch),fill:'none',stroke:col,'stroke-width':sw,'stroke-linecap':'round'}) }
    // connections through the wall: supply at the first loop, return at the last loop of the circuit
    var one=k.loops===1, ys=yA+(one?5:0), yr=yB-(one?5:0), lab=rows<=8||c===0||c===k.circuits-1;
    add('line',{x1:xr,y1:ys,x2:xr+46,y2:ys,stroke:'#C8402F','stroke-width':3});add('path',{d:'M'+(xr+26)+' '+(ys-5)+' l-9 5 l9 5 z',fill:'#C8402F'});
    add('line',{x1:xr,y1:yr,x2:xr+46,y2:yr,stroke:BL,'stroke-width':3});add('path',{d:'M'+(xr+30)+' '+(yr-5)+' l9 5 l-9 5 z',fill:BL});
    if(lab){ txt(xr+52,(ys+yr)/2+4,'Circuit '+(c+1),{fill:INK,'font-weight':700,'font-size':13});
      if(k.circuits<=3||c===0) txt(xr+52,(ys+yr)/2+20,k.loops+(k.loops>1?' loops, ':' loop, ')+f0(k.Lft)+' ft',{'font-size':12}) }
    // brace on the left
    add('path',{d:'M'+(xl-12)+' '+(yB-6)+' h-8 v'+(yA-yB+12)+' h8',fill:'none',stroke:col,'stroke-width':2});
  }
  // callouts
  var yl=y0; add('line',{x1:cx-40,y1:yl+ry-1,x2:cx-70,y2:bot+ry+22,stroke:GR,'stroke-width':1});
  txt(cx-74,bot+ry+38,'1 loop = pipe once around the wall = '+f0(r.loop*FT)+' ft ('+f1(r.loop)+' m)',{'text-anchor':'middle',fill:INK,'font-weight':600});
  txt(xl-26,(y0+(y0-(rows-1)*pitch))/2-4,k.circuits+(k.circuits>1?' circuits':' circuit'),{'text-anchor':'end',fill:INK,'font-weight':700});
  txt(xl-26,(y0+(y0-(rows-1)*pitch))/2+12,'= '+rows+(rows>1?' rows of pipe':' row of pipe'),{'text-anchor':'end','font-size':12});
  txt(xr+52,top+6,'supply',{fill:'#C8402F','font-weight':700,'font-size':12});txt(xr+52,top+22,'return',{fill:BL,'font-weight':700,'font-size':12});
  add('line',{x1:xr+100,y1:top+2,x2:xr+124,y2:top+2,stroke:'#C8402F','stroke-width':3});add('line',{x1:xr+100,y1:top+18,x2:xr+124,y2:top+18,stroke:BL,'stroke-width':3});
  g.setAttribute('aria-label','Digester with '+k.circuits+' heating circuits of '+k.loops+' loops each');
}
function read(){
  var unit=$('qunit').value, q=parseFloat($('q').value), kw=unit==='kw'?q:unit==='mbh'?q*1000/3412.142:q/3412.142;
  var proc=$('proc').value, T=proc==='meso'?100:proc==='thermo'?125:parseFloat($('tproc').value);
  return {D:parseFloat($('dia').value)/FT,H:parseFloat($('depth').value)/FT,T:toC(T),TF:T,tin:toC(parseFloat($('tin').value)),tinF:parseFloat($('tin').value),
    q:kw,v:parseFloat($('vel').value),fluid:$('fluid').value,margin:parseFloat($('margin').value),loops:parseInt($('loops').value,10),route:parseFloat($('route').value)/FT,name:$('pname').value.trim()};
}
function check(p){
  var e=[];
  if(!(p.D>=3&&p.D<=60)) e.push('Enter the inside diameter of the digester, 10 to 195 ft.');
  if(!(p.H>=1.5&&p.H<=30)) e.push('Enter the liquid depth, 5 to 98 ft.');
  if(!(p.q>0)) e.push('Enter the heat the heating system has to deliver.');
  if(!(p.TF>=60&&p.TF<=150)) e.push('Enter a process temperature between 60 and 150 °F.');
  if(!(p.tinF>=p.TF+10&&p.tinF<=230)) e.push('The supply temperature must be at least 10 °F above the process temperature and at most 230 °F.');
  if(!(p.route>=0)) e.push('Enter the route length to the heat source in ft (0 if not needed).');
  return e;
}
var last='';
function run(){
  var p=read(), errs=check(p), out=$('out'), msg=$('msg');
  msg.textContent=errs.join(' '); out.hidden=errs.length>0; if(errs.length){return}
  var r=sizeBioflex(p), k=r.pick, gpmC=k.m/RHO*15850.3, gpm=gpmC*k.circuits;
  $('h-len').textContent=f0(k.totalFt)+' ft';
  $('h-sub').textContent=k.circuits+(k.circuits>1?' coils of ':' coil of ')+f0(k.Lft)+' ft ('+f0(k.Lft/FT)+' m)'+(k.circuits>1?' each':'')+', 2 in (DN 50) BIOFLEX';
  $('h-circ').textContent=k.circuits+' × '+k.loops;
  $('h-circ-sub').textContent=(k.circuits>1?'heating circuits':'heating circuit')+' × '+(k.loops>1?'loops':'loop')+' around the wall';
  $('h-br').textContent=f0(r.brackets.ordered);
  $('h-br-sub').textContent='pipe supports, '+r.brackets.packs+' packs of 10';
  draw(p,r);
  var pin=$('pin');pin.textContent='';
  [['Digester',f0(p.D*FT)+' ft inside diameter ('+f1(p.D)+' m), '+f0(p.H*FT)+' ft liquid depth ('+f1(p.H)+' m)'],['Process temperature',f0(p.TF)+' °F ('+f0(p.T)+' °C)'],['Heat into the digester',f0(p.q*3412.142)+' BTU/h ('+f0(p.q)+' kW), design margin '+Math.round(p.margin*100)+'%'],
   ['Heating water',f0(p.tinF)+' °F supply ('+f0(p.tin)+' °C), '+(p.fluid==='glycol'?'water with 35% glycol':'water')+', '+f1(p.v*FT)+' ft/s ('+p.v+' m/s)'],['Route to the heat source',f0(p.route*FT)+' ft ('+f0(p.route)+' m)']].forEach(function(x){row(pin,x)});
  $('pmeta').textContent=(p.name?p.name+' · ':'')+new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  var need=$('need');need.textContent='';
  var exact=k.total*FT, rows3=[['Thermally needed for your heat',r.reqL?r.reqL*FT:null,'Pipe that transfers '+f0(p.q*3412.142)+' BTU/h at your temperatures, without margin','steel'],
    ['Full loops around the wall',exact,k.circuits+' × '+k.loops+(k.loops>1?' loops of ':' loop of ')+f0(r.loop*FT)+' ft, plus 6.6 ft per circuit for the two ends','mid'],
    ['To order',k.totalFt,'Each coil rounded up to the next 10 ft: '+k.circuits+' × '+f0(k.Lft)+' ft','blue']];
  rows3.forEach(function(x){ if(x[1]==null) return;
    var d=el('div','nrow'), t=el('div','nt'); t.appendChild(el('b',null,x[0])); t.appendChild(el('span',null,x[2]));
    var bw=el('div','nb'), b=el('i',x[3]); b.style.width=Math.max(4,Math.round(x[1]/k.totalFt*100))+'%'; bw.appendChild(b);
    d.appendChild(t); d.appendChild(bw); d.appendChild(el('em',null,f0(x[1])+' ft')); need.appendChild(d)});
  $('needt').textContent=r.reqL?'Why more than the thermal length? A loop always runs once around the whole wall, so the pipe comes in full loops. The extra surface is your reserve: this layout delivers '+f0(r.qInst*3412.142)+' BTU/h, '+Math.round((r.qInst/p.q-1)*100)+'% above the heat required.':'';
  var kv=$('kv');kv.textContent='';
  [['Heat required',f0(p.q*3412.142)+' BTU/h ('+f0(p.q)+' kW)'],
   ['Design heat incl. '+Math.round(p.margin*100)+'% margin',f0(r.qd*3412.142)+' BTU/h ('+f0(r.qd)+' kW)'],
   ['Heat delivered by this layout',f0(r.qInst*3412.142)+' BTU/h ('+f0(r.qInst)+' kW)'],
   ['Supply / return temperature',f0(p.tinF)+' / '+f0(toF(k.tout))+' °F ('+f0(p.tin)+' / '+f0(k.tout)+' °C)'],
   ['Flow per circuit / total',f0(gpmC)+' / '+f0(gpm)+' gpm ('+f1(k.m/RHO*3600)+' / '+f1(r.flow/RHO*3600)+' m³/h)'],
   ['Length of one loop',f0(r.loop*FT)+' ft ('+f1(r.loop)+' m)'],
   ['Rows on the wall',k.rows+' rows, 10 in apart; top row '+f1(r.stackTop*FT)+' ft above the floor'],
   ['Pipe per digester volume',(Math.round(r.rrk*1000)/10)+' cm per m³ (usual range '+r.rrkRange[0]*100+' to '+r.rrkRange[1]*100+')']
  ].forEach(function(x){row(kv,x)});
  var notes=$('notes');notes.textContent='';
  function note(t){notes.appendChild(el('li',null,t))}
  if(r.long) note(k.loops>1?'A coil of '+f0(k.Lft)+' ft is above the usual limit of 492 ft (150 m) for a single coil. Choose fewer loops per circuit, or ask BRUGG to check the coil size.':'One loop of this digester is longer than 492 ft (150 m), the usual limit for a single coil. BRUGG will check the coil size for shipping.');
  if(!k.fits) note('This layout needs '+k.rows+' rows; with 10 in spacing only '+r.rowsMax+' rows fit below the liquid level. Raise the supply temperature or ask BRUGG for the six-loop bracket.');
  if(!r.rrkOk) note(r.rrk<r.rrkRange[0]?'The pipe length per digester volume is below the usual range. This is common for large, well insulated tanks; BRUGG will confirm the heat demand.':'The pipe length per digester volume is above the usual range. Check the heat demand, or raise the supply temperature.');
  if(p.fluid==='glycol') note('Calculated with a 35% glycol mix (specific heat 3,542 J/kg·K).');
  note('Coil lengths are rounded up to the next 10 ft and include 6.6 ft (2 m) per circuit for the two pipe ends.');
  var pk=$('pkg');pk.textContent='';row(pk,['Qty','Item','Article no.','Note'],true);
  [[f0(k.totalFt)+' ft','BIOFLEX pipe CNW 60/66, 2 in (DN 50), AISI 316L','1014439',k.circuits+(k.circuits>1?' coils of ':' coil of ')+f0(k.Lft)+' ft'],
   [r.fittings.ends,'2" BIOFLEX NPT end fitting (GRAPA-S, 2 in NPT)','1014614','2 per circuit'],
   [r.brackets.packs+' packs','Pipe support RBF 60 type F incl. bend support, pack of 10 ('+r.brackets.ordered+' supports)','1014631',r.brackets.rows+(r.brackets.rows>1?' rows × ':' row × ')+r.brackets.perRow+' supports, one every 3.3 ft (1.0 m)'],
   [k.circuits+(k.circuits>1?' sets':' set'),'Wall seal / ring gasket type WD 85-94 (set of 2)','1014623','1 set per circuit, for supply and return'],
   [1,'DN 50 assembly tool B-NPT','1014283','One per site'],
   ['By client','2 in NPT hard pipe through the wall and 90° union','','2 of each per circuit']
  ].forEach(function(x){row(pk,x)});
  var cx=$('cpx'),ct=$('cpxt');cx.textContent='';ct.textContent='';
  if(!(p.route>0)){ct.textContent='Enter the route length between heat source and digester to get the pre-insulated pipe for the connection.'}
  else{
    var c=sizeCalpex(r.flow,p.tin,k.tout,p.route);
    if(c.tooHot){ct.textContent='Your supply temperature is above 203 °F (95 °C), the limit of CALPEX. Use CASAFLEX, the flexible stainless steel pre-insulated pipe rated for 302 °F (150 °C). BRUGG sizes it for you: '+f0(gpm)+' gpm over a route of '+f0(p.route*FT)+' ft.'}
    else if(!c.UNO&&!c.DUO){ct.textContent='The total flow of '+f0(gpm)+' gpm is above the CALPEX range at 200 Pa/m. BRUGG will propose PREMANT or parallel lines.'}
    else{
      ct.textContent='Sized for the total flow of '+f0(gpm)+' gpm at no more than 200 Pa/m (0.9 ft of head per 100 ft). Length is the route plus 5%, rounded up to the next 10 ft.';
      row(cx,['Option','CALPEX type','Order length','Velocity','Pressure loss'],true);
      ['UNO','DUO'].forEach(function(kind){var s=c[kind]; if(!s) return;
        row(cx,[kind==='UNO'?'Two single pipes (supply and return)':'One twin pipe (supply and return in one jacket)','CALPEX PUR-KING '+kind+' '+s.type+' ('+s.sdr+')',f0(s.lenFt)+' ft'+(kind==='UNO'?' in total':''),f1(s.v*FT)+' ft/s',f0(s.dp)+' Pa/m'])});
    }
  }
  var al=$('alt');al.textContent='';row(al,['Loops per circuit','Circuits','Coil length','Total pipe','Heat delivered','Return','Remark'],true);
  r.opts.forEach(function(o){var tr=row(al,[o.loops,o.circuits,f0(o.Lft)+' ft',f0(o.totalFt)+' ft',f0(o.circuits*o.qc*3412.142)+' BTU/h',f0(toF(o.tout))+' °F',(o===k?'Selected':'')+(!o.coilOk?' Coil over 492 ft':'')+(!o.fits?' Too many rows':'')]); if(o===k) tr.className='sel'});
  last='BIOFLEX sizing request'+(p.name?' - '+p.name:'')+'\n\nDigester: '+f0(p.D*FT)+' ft diameter, '+f0(p.H*FT)+' ft liquid depth, process '+f0(p.TF)+' F\nHeat required: '+f0(p.q*3412.142)+' BTU/h ('+f0(p.q)+' kW), margin '+Math.round(p.margin*100)+'%\nSupply temperature: '+f0(p.tinF)+' F, '+(p.fluid==='glycol'?'35% glycol':'water')+', velocity '+f1(p.v*FT)+' ft/s\n\nResult: '+f0(k.totalFt)+' ft BIOFLEX, '+k.circuits+' circuit(s) x '+k.loops+' loop(s), coil length '+f0(k.Lft)+' ft\nBrackets: '+r.brackets.ordered+' ('+r.brackets.packs+' packs of 10), end connectors: '+r.fittings.ends+'\nFlow: '+f0(gpm)+' gpm total, return '+f0(toF(k.tout))+' F\nRoute to heat source: '+f0(p.route*FT)+' ft\n\nPlease check the sizing and send a quote.\n';
  $('mail').href='mailto:sales.bpna@brugg.com?subject='+encodeURIComponent('BIOFLEX sizing request'+(p.name?' - '+p.name:''))+'&body='+encodeURIComponent(last);
}
$('proc').addEventListener('change',function(){$('tprocw').hidden=$('proc').value!=='custom'});
$('form').addEventListener('submit',function(e){e.preventDefault();run();$('out').scrollIntoView({behavior:'smooth',block:'start'})});
Array.prototype.forEach.call(document.querySelectorAll('#form input,#form select'),function(i){i.addEventListener('change',function(){if(!$('out').hidden) run()})});
$('print').addEventListener('click',function(){window.print()});
run();
})();

