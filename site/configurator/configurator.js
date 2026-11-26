"use strict";
(function () {
  var C = CFG_CALC, K = C.K, DATA = null, cur = 1;
  // state in SI: °C, m, kW, bar
  var st = { units: 'us', source: 'Boiler room', secs: [{ from: 'Boiler room', to: 'House 1', len: null, load: null }], series: null, pick: {} };
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function clean(s, max) { return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
  var US = function () { return st.units === 'us'; };

  // ---- units: conversion of inputs and display of results ----
  var UNIT = { T: ['°F', '°C'], L: ['ft', 'm'], P: ['MBH', 'kW'], p: ['psi', 'bar'] };
  function toSI(k, v) { if (!US()) return v; return k === 'T' ? C.fToC(v) : k === 'L' ? v * K.ft : k === 'P' ? v * K.mbh : v * K.psi; }
  function fromSI(k, v) { if (!US()) return v; return k === 'T' ? C.cToF(v) : k === 'L' ? v / K.ft : k === 'P' ? v / K.mbh : v / K.psi; }
  function both(a, b) { return US() ? a + ' (' + b + ')' : b + ' (' + a + ')'; }
  function dT(c) { return both(fmt(C.cToF(c), 0) + ' °F', fmt(c, 0) + ' °C'); }
  function dL(m) { return both(fmt(m / K.ft, 0) + ' ft', fmt(m, 0) + ' m'); }
  function dP(kw) { return both(fmt(kw / K.mbh, 0) + ' MBH', fmt(kw, 0) + ' kW'); }
  function dp(bar) { return both(fmt(bar / K.psi, 0) + ' psi', fmt(bar, 1) + ' bar'); }
  function dQ(q) { return both(fmt(q * K.gpm, 1) + ' gpm', fmt(q * 3600, 1) + ' m³/h'); }
  function dV(v) { return US() ? fmt(v / K.ft, 1) + ' ft/s' : fmt(v, 2) + ' m/s'; }
  function dG(pa) { var a = pa * K.paM_psi100ft; return US() ? fmt(a, a < 10 ? 2 : 0) + ' psi/100 ft' : fmt(pa, 0) + ' Pa/m'; }
  function dLoss(pa) { return US() ? fmt(pa / 6894.757, 1) + ' psi' : fmt(pa / 1e5, 2) + ' bar'; }
  function inRange(k, v) { var r = { T: [-40, 205], L: [0.3, 30000], P: [0.3, 3000000], p: [0, 70] }[k]; return v >= r[0] && v <= r[1]; }
  function setVal(id, k, v) { $(id).value = (v == null || isNaN(v)) ? '' : String(Math.round(fromSI(k, v) * 100) / 100); }
  function getVal(input, k) { var t = String(input.value).trim().replace(',', '.'); if (t === '') return null; var v = Number(t); return isFinite(v) ? toSI(k, v) : NaN; }

  function show(n) {
    cur = n;
    for (var i = 1; i <= 6; i++) $('s' + i).hidden = i !== n;
    var li = $('progress').children;
    for (var k = 0; k < li.length; k++) { var dn = k + 1 < Math.min(n, 5) || (n === 6 && k < 5); li[k].className = (k + 1 === Math.min(n, 5) && n < 6) ? 'on' : (dn ? 'done' : ''); if (dn) { li[k].tabIndex = 0; li[k].setAttribute('role', 'button'); } else { li[k].removeAttribute('tabindex'); li[k].removeAttribute('role'); } }
    $('err').hidden = true;
    $('cfg').scrollIntoView({ block: 'start' });
  }
  function fail(msg, input) { var e = $('err'), stp = $('s' + cur), nav = stp ? stp.querySelector('.cfgnav') : null; if (nav) stp.insertBefore(e, nav); e.textContent = msg; e.hidden = false; if (input) { input.classList.add('bad'); input.focus({ preventScroll: true }); } e.scrollIntoView({ block: 'center' }); return false; }

  // ---- step 2: route ----
  function labels() {
    document.querySelectorAll('[data-u]').forEach(function (x) { x.textContent = UNIT[x.dataset.u][US() ? 0 : 1]; });
    $('tin').placeholder = US() ? 'e.g. 180' : 'e.g. 80'; $('tout').placeholder = US() ? 'e.g. 140' : 'e.g. 60';
    $('loadhint').textContent = US() ? '1 MBH = 1,000 BTU/h = 0.293 kW.' : '1 kW = 3.412 MBH (1,000 BTU/h).';
    $('u-us').setAttribute('aria-pressed', US() ? 'true' : 'false'); $('u-si').setAttribute('aria-pressed', US() ? 'false' : 'true');
  }
  function drawRoute() {
    var tb = $('route').tBodies[0]; tb.textContent = '';
    st.secs.forEach(function (s, i) {
      var tr = el('tr'), sel = el('select'), names = [st.source].concat(st.secs.slice(0, i).map(function (o) { return o.to; }));
      names.forEach(function (nm) { var o = el('option', '', nm); o.value = nm; sel.appendChild(o); });
      sel.value = names.indexOf(s.from) >= 0 ? s.from : names[names.length - 1]; s.from = sel.value; sel.setAttribute('aria-label', 'From, section ' + (i + 1));
      sel.addEventListener('change', function () { s.from = sel.value; liveFlow(); });
      var to = el('input'); to.type = 'text'; to.maxLength = 40; to.value = s.to; to.setAttribute('aria-label', 'To, section ' + (i + 1));
      to.addEventListener('change', function () { var old = s.to; s.to = clean(to.value, 40) || old; st.secs.forEach(function (o) { if (o.from === old) o.from = s.to; }); drawRoute(); });
      var ln = el('input'); ln.type = 'number'; ln.step = 'any'; ln.inputMode = 'decimal'; ln.placeholder = US() ? 'e.g. 250' : 'e.g. 75'; ln.setAttribute('aria-label', 'Length, section ' + (i + 1));
      if (s.len != null) ln.value = Math.round(fromSI('L', s.len) * 100) / 100;
      ln.addEventListener('input', function () { s.len = getVal(ln, 'L'); liveFlow(); });
      var ld = el('input'); ld.type = 'number'; ld.step = 'any'; ld.inputMode = 'decimal'; ld.placeholder = US() ? 'e.g. 500' : 'e.g. 150'; ld.setAttribute('aria-label', 'Heat load, section ' + (i + 1));
      if (s.load != null) ld.value = Math.round(fromSI('P', s.load) * 100) / 100;
      ld.addEventListener('input', function () { s.load = getVal(ld, 'P'); liveFlow(); });
      var x = el('button', 'x', '×'); x.type = 'button'; x.title = 'Remove this section'; x.setAttribute('aria-label', 'Remove section ' + (i + 1));
      x.addEventListener('click', function () { var gone = s.to; st.secs.splice(i, 1); st.secs.forEach(function (o) { if (o.from === gone) o.from = s.from; }); drawRoute(); liveFlow(); });
      [sel, to, ln, ld].forEach(function (c) { var td = el('td'); td.appendChild(c); tr.appendChild(td); });
      var td = el('td'); if (st.secs.length > 1) td.appendChild(x); tr.appendChild(td);
      s._len = ln; s._load = ld; tb.appendChild(tr);
    });
  }
  function liveFlow() {
    var a = getVal($('tin'), 'T'), b = getVal($('tout'), 'T'), tot = 0, len = 0;
    st.secs.forEach(function (s) { tot += s.load > 0 ? s.load : 0; len += s.len > 0 ? s.len : 0; });
    if (a == null || b == null || isNaN(a) || isNaN(b) || Math.abs(a - b) < 0.5 || !(tot > 0)) { $('flow').textContent = ''; return; }
    var f = C.flow(tot, Math.abs(a - b), (a + b) / 2, DATA.cp);
    $('flow').textContent = 'Total: ' + dP(tot) + ' · ΔT ' + both(fmt(Math.abs(a - b) * 1.8, 0) + ' °F', fmt(Math.abs(a - b), 1) + ' K') + ' · flow at the source ' + dQ(f.q) + ' · trench ' + dL(len);
  }
  function readSpecs() {
    ['tin', 'tout', 'tpeak', 'pmax'].forEach(function (id) { $(id).classList.remove('bad'); });
    var s = {};
    s.tin = getVal($('tin'), 'T'); if (s.tin == null || isNaN(s.tin) || !inRange('T', s.tin)) return fail('Please enter the supply temperature.', $('tin'));
    s.tout = getVal($('tout'), 'T'); if (s.tout == null || isNaN(s.tout) || !inRange('T', s.tout)) return fail('Please enter the return temperature.', $('tout'));
    s.tpeak = getVal($('tpeak'), 'T'); if (s.tpeak != null && (isNaN(s.tpeak) || !inRange('T', s.tpeak))) return fail('Please check the peak temperature.', $('tpeak'));
    s.pmax = getVal($('pmax'), 'p'); if (s.pmax != null && (isNaN(s.pmax) || !inRange('p', s.pmax))) return fail('Please check the operating pressure.', $('pmax'));
    if (Math.abs(s.tin - s.tout) < 0.5) return fail('Supply and return temperature must differ.', $('tout'));
    s.thot = Math.max(s.tin, s.tout);
    if (s.tpeak != null && s.tpeak < s.thot) return fail('The peak temperature cannot be below the supply temperature.', $('tpeak'));
    st.source = clean($('source').value, 40) || 'Boiler room';
    var seen = {}; seen[st.source] = 1;
    for (var i = 0; i < st.secs.length; i++) {
      var q = st.secs[i]; q._len.classList.remove('bad'); q._load.classList.remove('bad');
      if (seen[q.to]) return fail('Every building needs its own name: "' + q.to + '" is used twice.');
      seen[q.to] = 1;
      if (!(q.len > 0) || !inRange('L', q.len)) return fail('Please enter the trench length of section ' + (i + 1) + '.', q._len);
      if (q.load == null || isNaN(q.load) || q.load < 0 || !inRange('P', q.load || 1)) return fail('Please enter the heat load of ' + q.to + ' (0 if the section only passes through).', q._load);
    }
    s.dT = Math.abs(s.tin - s.tout); s.tm = (s.tin + s.tout) / 2;
    s.down = C.downstream(st.secs);
    if (!(s.down[0] > 0) || s.down.some(function (d) { return !(d > 0); })) return fail('Every section must carry a heat load: enter the load of the building at its end or of a building behind it.');
    s.total = st.secs.reduce(function (a, q) { return a + q.load; }, 0);
    s.fl = s.down.map(function (kw) { return C.flow(kw, s.dT, s.tm, DATA.cp); });
    return s;
  }

  // ---- step 3: systems ----
  function pLimitPsi(ser, z, s) {
    if (ser.pByT) { var tf = C.cToF(s.thot); for (var i = 0; i < ser.pByT.length; i++) if (tf <= ser.pByT[i][0] + 0.05) return ser.pByT[i][1]; return null; }
    return z.lim.pPsi;
  }
  function why(ser, z, s) {
    var hot = C.cToF(s.thot), peak = s.tpeak == null ? hot : C.cToF(s.tpeak);
    if (hot > z.lim.tContF + 0.05) return 'supply temperature above ' + dT(C.fToC(z.lim.tContF));
    if (peak > z.lim.tPeakF + 0.05) return 'peak temperature above ' + dT(C.fToC(z.lim.tPeakF));
    var p = pLimitPsi(ser, z, s);
    if (p === null) return 'pressure rating above ' + dT(C.fToC(ser.pByT[ser.pByT.length - 1][0])) + ' on request';
    if (s.pmax != null && s.pmax / K.psi > p + 0.05) return 'operating pressure above ' + dp(p * K.psi) + ' at this temperature';
    return '';
  }
  function evalSeries(ser, s) {
    var reasons = {}, ok = ser.sizes.filter(function (z) { var w = why(ser, z, s); if (w) reasons[w] = 1; return !w; });
    if (!ok.length) return { ser: ser, bad: Object.keys(reasons).join('; ') };
    var rows = st.secs.map(function (q, i) {
      var cand = ok.map(function (z) { return { z: z, h: C.hyd(z.id, DATA.roughness[ser.material], ser.material === 'corrugated' ? z.f : 0, s.fl[i]) }; }), rec = -1;
      cand.forEach(function (c, k) { if (rec < 0 && c.h.pa <= DATA.rule) rec = k; });
      return { cand: cand, rec: rec < 0 ? cand.length - 1 : rec, inRange: rec >= 0 };
    });
    return { ser: ser, rows: rows, all: rows.every(function (r) { return r.inRange; }) };
  }
  function chosen(ev, i) { var key = ev.ser.product + '/' + ev.ser.id + '/' + i, k = st.pick[key]; return ev.rows[i].cand[k == null || !ev.rows[i].cand[k] ? ev.rows[i].rec : k]; }
  function critical(ev) {
    var worst = 0, at = 0;
    st.secs.forEach(function (q, i) { var sum = 0; C.path(st.secs, i).forEach(function (j) { sum += chosen(ev, j).h.pa * st.secs[j].len * 2; }); if (sum > worst) { worst = sum; at = i; } });
    return { pa: worst, to: st.secs[at].to };
  }
  function lines(ser) { return ser.pipes === 1 ? 2 : 1; }
  function dia(z) { return both(z.idUS, fmt(z.id, 1) + ' mm'); }
  function alt(z, a, b) { return z[a] ? (z[b] && z[b] !== z[a] ? both(z[a], z[b]) : z[a]) : ''; }

  function drawSystems() {
    var s = st.specs, box = $('systems'), un = $('unsuitable'); box.textContent = ''; un.textContent = ''; $('detail').textContent = '';
    $('recap').textContent = st.medium + ' · ' + st.country + ' · supply ' + dT(s.tin) + ' · return ' + dT(s.tout) + (s.tpeak != null ? ' · peak ' + dT(s.tpeak) : '') + (s.pmax != null ? ' · ' + dp(s.pmax) : '') + ' · ' + st.secs.length + (st.secs.length === 1 ? ' section' : ' sections') + ' · total ' + dP(s.total);
    st.evals = [];
    if (st.medium !== 'Heating systems') { $('s3hint').textContent = 'For this medium the configurator does not size products yet. Continue; we include suitable products and options in our offer.'; $('method').textContent = ''; st.series = null; return; }
    $('s3hint').textContent = 'Choose a system. The configurator proposes a size for every section; you can change it.';
    var bad = [];
    DATA.series.forEach(function (ser) { var ev = evalSeries(ser, s); if (ev.bad) bad.push(ser.name + ': ' + ev.bad); else st.evals.push(ev); });
    st.evals.sort(function (a, b) { return (b.all - a.all) || ((a.ser.type === 'rigid') - (b.ser.type === 'rigid')); });
    if (!st.evals.some(function (e2) { return e2.ser.product + '/' + e2.ser.id === st.series; })) st.series = st.evals.length ? st.evals[0].ser.product + '/' + st.evals[0].ser.id : null;
    st.evals.forEach(function (ev) {
      var key = ev.ser.product + '/' + ev.ser.id, lab = el('label'), r = el('input'); r.type = 'radio'; r.name = 'series'; r.value = key; r.checked = key === st.series;
      r.addEventListener('change', function () { st.series = key; drawDetail(); });
      lab.appendChild(r); lab.appendChild(el('b', '', ev.ser.name));
      lab.appendChild(el('span', '', (ev.ser.type === 'rigid' ? 'Rigid steel pipe, welded on site' : 'Flexible, self-compensating, in coils') + ' · ' + (ev.ser.pipes === 2 ? 'twin pipe' : 'single pipes')));
      lab.appendChild(el('span', '', ev.all ? 'All sections within the sizing range' : 'Largest size is too small for at least one section'));
      box.appendChild(lab);
    });
    if (!st.evals.length) box.appendChild(el('p', 'msg err', 'No system in the range matches these values. Continue and we will propose a solution.'));
    if (bad.length) { var d = el('div', 'unsuit'); d.appendChild(el('h3', '', 'Not suitable for these values')); var ul = el('ul'); bad.forEach(function (t) { ul.appendChild(el('li', '', t)); }); d.appendChild(ul); un.appendChild(d); }
    $('method').textContent = 'Proposed is the smallest size with a pressure loss of at most ' + (US() ? fmt(DATA.rule * K.paM_psi100ft, 2) + ' psi per 100 ft (' + DATA.rule + ' Pa/m)' : DATA.rule + ' Pa/m') + ', the upper end of the BRUGG Pipes sizing range. Velocity and pressure loss are estimates for water at the mean temperature in straight pipe, without fittings: Darcy-Weisbach with roughness ' + DATA.roughness.pex + ' mm for PEX and ' + DATA.roughness.steel + ' mm for steel; CASAFLEX with friction factors derived from the BRUGG Pipes configurator. Final sizing is done by BRUGG Pipes engineering.';
    drawDetail();
  }
  function current() { for (var i = 0; i < (st.evals || []).length; i++) if (st.evals[i].ser.product + '/' + st.evals[i].ser.id === st.series) return st.evals[i]; return null; }
  function drawDetail() {
    var ev = current(), box = $('detail'); box.textContent = ''; if (!ev) return;
    var ser = ev.ser, card = el('article', 'prod'), head = el('header'), left = el('div'), tot = 0;
    st.secs.forEach(function (q) { tot += q.len * lines(ser); });
    left.appendChild(el('h3', '', ser.name)); if (ser.note) left.appendChild(el('p', '', ser.note));
    var a = el('a', '', 'Product page'); a.href = ser.page; left.appendChild(a);
    var cr = critical(ev), nd = el('div', 'need', 'Pipe length needed'); nd.appendChild(el('b', '', dL(tot)));
    nd.appendChild(el('span', '', 'Pressure loss to ' + cr.to + ', supply + return: ' + dLoss(cr.pa)));
    head.appendChild(left); head.appendChild(nd); card.appendChild(head);
    var sc = el('div', 'scroll'), tb = el('table'), tr = el('tr');
    [['Section', ''], ['Load', 'n'], ['Flow', 'n'], ['Size', ''], ['Carrier ID', ''], ['Velocity', 'n'], ['Pressure loss', 'n'], ['Loss, supply + return', 'n']].forEach(function (h) { tr.appendChild(el('th', h[1], h[0])); });
    tb.appendChild(tr);
    st.secs.forEach(function (q, i) {
      var row = ev.rows[i], c = chosen(ev, i), r = el('tr', c.h.pa > DATA.rule ? 'over' : '');
      var n = el('td'); n.appendChild(el('b', '', q.from + ' → ' + q.to)); n.appendChild(el('br')); n.appendChild(document.createTextNode(dL(q.len))); r.appendChild(n);
      r.appendChild(el('td', 'n', dP(st.specs.down[i]))); r.appendChild(el('td', 'n', dQ(st.specs.fl[i].q)));
      var td = el('td'), sel = el('select'); sel.setAttribute('aria-label', 'Size for ' + q.from + ' to ' + q.to);
      row.cand.forEach(function (cd, k) { var o = el('option', '', cd.z.label + (k === row.rec && row.inRange ? ' (proposed)' : '')); o.value = k; sel.appendChild(o); });
      sel.value = String(row.cand.indexOf(c));
      sel.addEventListener('change', function () { st.pick[ser.product + '/' + ser.id + '/' + i] = Number(sel.value); drawDetail(); });
      td.appendChild(sel); if (!row.inRange) { td.appendChild(el('br')); td.appendChild(el('small', '', 'above the sizing range')); } r.appendChild(td);
      r.appendChild(el('td', '', dia(c.z))); r.appendChild(el('td', 'n', dV(c.h.v))); r.appendChild(el('td', 'n', dG(c.h.pa))); r.appendChild(el('td', 'n', dLoss(c.h.pa * q.len * 2)));
      tb.appendChild(r);
    });
    sc.appendChild(tb); card.appendChild(sc); box.appendChild(card);
  }

  // ---- step 4: fittings and transport ----
  function plan() {
    var ev = current(); if (!ev) return null;
    var ser = ev.ser, ln = lines(ser), secs = st.secs.map(function (q, i) {
      var c = chosen(ev, i), lenFt = q.len / K.ft, pieces = ser.type === 'rigid' ? Math.ceil(q.len / 12) : (c.z.coilFt ? Math.ceil(lenFt / c.z.coilFt) : 1);
      return { q: q, c: c, pieces: pieces, pipeFt: lenFt * ln, pipeM: q.len * ln };
    });
    var qty = { end: 0, entry: 0, joint: 0 }; secs.forEach(function (x) { qty.end += 2 * ln; qty.entry += 2 * ln; qty.joint += (x.pieces - 1) * ln; });
    var sh = DATA.shipping.products[ser.product], ship = { mode: sh.mode, origin: sh.origin, note: sh.note, coils: 0 };
    secs.forEach(function (x) { ship.coils += x.pieces * ln; });
    if (sh.mode === 'truck') {
      var t = DATA.shipping.standardTrailer, load = 0, miss = false, by = {};
      secs.forEach(function (x) {
        var j = parseFloat(x.c.z.jacket), key = null; Object.keys(DATA.shipping.byJacketIn).forEach(function (k) { if (Math.abs(parseFloat(k) - j) < 0.03) key = k; });
        if (!key) { miss = true; return; }
        load += x.pipeFt / DATA.shipping.byJacketIn[key][t][1]; by[key] = (by[key] || 0) + x.pipeFt;
      });
      ship.trucks = Math.max(1, Math.ceil(load - 1e-9)); ship.load = load; ship.miss = miss; ship.trailer = DATA.shipping.trailers[t]; ship.by = by;
    }
    return { ev: ev, ser: ser, secs: secs, qty: qty, ship: ship, acc: DATA.accessories[ser.product] || [] };
  }
  function dest() { var d = [clean($('dcity').value, 60), clean($('dstate').value, 40), clean($('dzip').value, 12)].filter(Boolean).join(', '); return d || 'your site'; }
  function drawStep4() {
    var p = plan(), f = $('fittings'), t = $('transport'); f.textContent = ''; t.textContent = '';
    if (!p) { $('s4hint').textContent = 'We include suitable fittings, building entries and the transport plan in our offer.'; return; }
    $('s4hint').textContent = DATA.accRule;
    var box = el('div', 'fit');
    p.acc.forEach(function (a) {
      var n = p.qty[a.key]; if (!n) return;
      var art = el('article'); if (a.img) { var im = el('img'); im.src = a.img; im.alt = a.name; im.loading = 'lazy'; art.appendChild(im); } else art.appendChild(el('div', 'noimg'));
      var d = el('div'); d.appendChild(el('h4', '', a.name)); d.appendChild(el('p', '', a.text)); art.appendChild(d);
      var q = el('div', 'qty', fmt(n, 0)); q.appendChild(el('small', '', 'pieces')); art.appendChild(q); box.appendChild(art);
    });
    f.appendChild(box); f.appendChild(el('p', 'note', 'Sizes follow the pipe size of each section. Quantities are a proposal; BRUGG Pipes confirms them with the offer.'));
    var s = el('div', 'ship'), sh = p.ship;
    if (sh.mode === 'truck') {
      s.appendChild(el('b', 'big', sh.trucks + (sh.trucks === 1 ? ' truck' : ' trucks')));
      s.appendChild(el('p', '', 'From ' + sh.origin + ' to ' + dest() + ' · ' + sh.trailer + ' · ' + sh.coils + (sh.coils === 1 ? ' coil' : ' coils') + ' · load ' + fmt(sh.load * 100, 0) + ' % of one truck'));
      if (sh.miss) s.appendChild(el('p', '', 'At least one size is not in the loading guide; its transport is planned by BRUGG Pipes.'));
    } else { s.appendChild(el('b', 'big', sh.mode === 'container' ? sh.coils + (sh.coils === 1 ? ' coil' : ' coils') + " in 40' High Cube containers" : 'Loading plan by BRUGG Pipes')); s.appendChild(el('p', '', 'From ' + sh.origin + ' to ' + dest())); }
    s.appendChild(el('p', '', sh.note)); if (sh.mode === 'truck') s.appendChild(el('p', 'note', DATA.shipping.source));
    t.appendChild(s);
  }

  // ---- summary ----
  function table(head, rows, cls) { var sc = el('div', 'scroll'), tb = el('table', cls || ''), tr = el('tr'); head.forEach(function (h) { tr.appendChild(el('th', h[1] || '', h[0])); }); if (head.length) tb.appendChild(tr); rows.forEach(function (r) { var x = el('tr'); r.forEach(function (c, i) { x.appendChild(el('td', head[i] && head[i][1] || '', c)); }); tb.appendChild(x); }); sc.appendChild(tb); return sc; }
  function summary() {
    var s = st.specs, c = st.contact, p = plan(), L = [], H = $('sumhtml'); H.textContent = '';
    function sec(title, head, rows, cls) { H.appendChild(el('h3', '', title)); H.appendChild(table(head, rows, cls)); L.push(''); L.push(title.toUpperCase()); rows.forEach(function (r) { L.push((head.length ? '- ' : '') + r.filter(function (x) { return x !== ''; }).join(head.length ? ' | ' : ': ')); }); }
    L.push('BRUGG Pipes configurator: project summary');
    sec('Project', [], [['Contact', c.fn + ' ' + c.ln + ', ' + c.co], ['Email', c.em + (c.ph ? ' · ' + c.ph : '')]].concat(c.pr ? [['Project', c.pr]] : []).concat([['Delivery', dest() + ', ' + st.country], ['Medium', st.medium], ['Supply / return', dT(s.tin) + ' / ' + dT(s.tout)]]).concat(s.tpeak != null ? [['Peak temperature', dT(s.tpeak)]] : []).concat(s.pmax != null ? [['Max. operating pressure', dp(s.pmax)]] : []).concat([['Total heat load', dP(s.total)], ['Flow at the source', dQ(s.fl[0].q)]]), 'kv');
    if (p) {
      sec('Route and pipe: ' + p.ser.name, [['Section'], ['Trench', 'n'], ['Load', 'n'], ['Size'], ['Pieces', 'n'], ['Velocity', 'n'], ['Pressure loss', 'n']], p.secs.map(function (x, i) { return [x.q.from + ' → ' + x.q.to, dL(x.q.len), dP(s.down[i]), x.c.z.label, String(x.pieces * lines(p.ser)), dV(x.c.h.v), dG(x.c.h.pa)]; }));
      var cr = critical(p.ev), tot = 0; p.secs.forEach(function (x) { tot += x.pipeM; });
      sec('Totals', [], [['Pipe length', dL(tot)], ['Pressure loss to ' + cr.to + ', supply + return', dLoss(cr.pa) + ' (straight pipe, without fittings)']], 'kv');
      sec('Fittings and building entries (proposal)', [['Item'], ['Pieces', 'n']], p.acc.filter(function (a) { return p.qty[a.key]; }).map(function (a) { return [a.name, String(p.qty[a.key])]; }));
      var sh = p.ship; sec('Transport', [], [['Route', 'From ' + sh.origin + ' to ' + dest()], ['Load', sh.mode === 'truck' ? sh.trucks + (sh.trucks === 1 ? ' truck' : ' trucks') + ' (' + sh.trailer + '), ' + sh.coils + ' coils' : (sh.mode === 'container' ? sh.coils + " coils in 40' High Cube containers" : 'Loading plan by BRUGG Pipes')], ['Note', sh.note]], 'kv');
    } else {
      sec('Route', [['Section'], ['Trench', 'n'], ['Load', 'n']], st.secs.map(function (q, i) { return [q.from + ' → ' + q.to, dL(q.len), dP(s.down[i])]; }));
      L.push(''); L.push('No system selected: please propose.');
    }
    if (st.notes) { sec('Notes', [], [['Notes', st.notes]], 'kv'); }
    H.appendChild(el('p', 'note', 'Sizes, quantities and transport are a proposal based on the entered values. Velocity and pressure loss are estimates for water. BRUGG Pipes engineering confirms the design with the offer.'));
    return L.join('\n');
  }

  function setUnits(u) {
    if (u === st.units) return;
    var v = { tin: getVal($('tin'), 'T'), tout: getVal($('tout'), 'T'), tpeak: getVal($('tpeak'), 'T'), pmax: getVal($('pmax'), 'p') };
    st.units = u; labels();
    setVal('tin', 'T', v.tin); setVal('tout', 'T', v.tout); setVal('tpeak', 'T', v.tpeak); setVal('pmax', 'p', v.pmax);
    drawRoute(); liveFlow();
    if (cur === 3 && st.specs) drawSystems();
    if (cur === 4) drawStep4();
    if (cur === 6) finish();
  }
  function finish() { var t = summary(), c = st.contact; $('summary').textContent = t; $('mail').href = 'mailto:sales.bpna@brugg.com?subject=' + encodeURIComponent('Request for a quote' + (c.pr ? ': ' + c.pr : '') + ' (' + c.co + ')') + '&body=' + encodeURIComponent(t.slice(0, 1700)); $('copied').textContent = ''; }

  function init() {
    labels(); drawRoute();
    $('u-us').addEventListener('click', function () { setUnits('us'); }); $('u-si').addEventListener('click', function () { setUnits('si'); });
    $('s1').addEventListener('submit', function (e) { e.preventDefault(); st.country = $('country').value === 'Canada' ? 'Canada' : 'United States of America'; var m = document.querySelector('input[name=medium]:checked'); st.medium = clean(m ? m.value : 'Heating systems', 40); show(2); });
    ['tin', 'tout'].forEach(function (id) { $(id).addEventListener('input', liveFlow); });
    $('source').addEventListener('change', function () { var old = st.source; st.source = clean($('source').value, 40) || old; st.secs.forEach(function (q) { if (q.from === old) q.from = st.source; }); drawRoute(); });
    $('addsec').addEventListener('click', function () { if (st.secs.length >= 30) return; var last = st.secs[st.secs.length - 1], n = st.secs.length + 1, name = 'House ' + n; while (st.secs.some(function (q) { return q.to === name; })) name = 'House ' + (++n); st.secs.push({ from: last.to, to: name, len: null, load: null }); drawRoute(); });
    $('s2').addEventListener('submit', function (e) { e.preventDefault(); $('err').hidden = true; var s = readSpecs(); if (!s) return; st.specs = s; drawSystems(); show(3); });
    $('s3').addEventListener('submit', function (e) { e.preventDefault(); drawStep4(); show(4); });
    ['dcity', 'dstate', 'dzip'].forEach(function (id) { $(id).addEventListener('input', drawStep4); });
    $('s4').addEventListener('submit', function (e) { e.preventDefault(); st.notes = clean($('notes').value, 800); show(5); });
    $('s5').addEventListener('submit', function (e) {
      e.preventDefault(); $('err').hidden = true;
      var c = { fn: clean($('fn').value, 60), ln: clean($('ln').value, 60), co: clean($('co').value, 100), pr: clean($('pr').value, 100), em: clean($('em').value, 120), ph: clean($('ph').value, 30) };
      ['fn', 'ln', 'co', 'em'].forEach(function (id) { $(id).classList.remove('bad'); });
      if (!c.fn) return fail('Please enter your first name.', $('fn'));
      if (!c.ln) return fail('Please enter your last name.', $('ln'));
      if (!c.co) return fail('Please enter your company.', $('co'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.em)) return fail('Please enter a valid email address.', $('em'));
      st.contact = c; finish(); show(6);
    });
    Array.prototype.forEach.call($('progress').children, function (li, k) { function go() { if (li.className === 'done') show(k + 1); } li.addEventListener('click', go); li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } }); });
    document.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });
    $('print').addEventListener('click', function () { window.print(); });
    $('copy').addEventListener('click', function () { var t = $('summary').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { $('copied').textContent = 'Summary copied.'; }).catch(function () { $('copied').textContent = 'Copying is blocked in this browser. Use "Print or save as PDF".'; }); });
  }
  fetch('../data/products.json', { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('data'); return r.json(); }).then(function (d) { DATA = d; init(); }).catch(function () { fail('The product data could not be loaded. Please reload the page or write to sales.bpna@brugg.com.'); });
})();
