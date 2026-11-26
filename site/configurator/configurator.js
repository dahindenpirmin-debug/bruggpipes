"use strict";
(function () {
  var DATA = null, st = { sel: {} }, cur = 1;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function clean(s, max) { return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
  function fToC(f) { return (f - 32) / 1.8; }
  // water properties, t in °C
  function rho(t) { return 1000 * (1 - (t + 288.9414) / (508929.2 * (t + 68.12963)) * Math.pow(t - 3.9863, 2)); }
  function mu(t) { return 2.414e-5 * Math.pow(10, 247.8 / (t + 133.15)); }

  function show(n) {
    cur = n;
    for (var i = 1; i <= 6; i++) $('s' + i).hidden = i !== n;
    var li = $('progress').children;
    for (var k = 0; k < li.length; k++) { var dn = k + 1 < Math.min(n, 5) || (n === 6 && k < 5); li[k].className = (k + 1 === Math.min(n, 5) && n < 6) ? 'on' : (dn ? 'done' : ''); if (dn) { li[k].tabIndex = 0; li[k].setAttribute('role', 'button'); } else { li[k].removeAttribute('tabindex'); li[k].removeAttribute('role'); } }
    $('err').hidden = true;
    $('cfg').scrollIntoView({ block: 'start' });
  }
  function fail(msg, input) { var e = $('err'), stp = $('s' + cur), nav = stp ? stp.querySelector('.cfgnav') : null; if (nav) stp.insertBefore(e, nav); e.textContent = msg; e.hidden = false; if (input) { input.classList.add('bad'); input.focus({ preventScroll: true }); } e.scrollIntoView({ block: 'center' }); return false; }
  function num(id, label, req) {
    var i = $(id); i.classList.remove('bad');
    if (i.value.trim() === '') { if (req) { fail('Please enter ' + label + '.', i); return NaN; } return null; }
    var v = Number(i.value);
    if (!isFinite(v) || v < Number(i.min) || v > Number(i.max)) { fail(label.charAt(0).toUpperCase() + label.slice(1) + ' must be between ' + i.min + ' and ' + i.max + '.', i); return NaN; }
    return v;
  }

  function readSpecs() {
    var s = {};
    s.tin = num('tin', 'the supply temperature', true); if (isNaN(s.tin)) return null;
    s.tout = num('tout', 'the return temperature', true); if (isNaN(s.tout)) return null;
    s.tpeak = num('tpeak', 'the peak temperature', false); if (s.tpeak !== null && isNaN(s.tpeak)) return null;
    s.len = num('len', 'the route length', true); if (isNaN(s.len)) return null;
    s.load = num('load', 'the heat load', true); if (isNaN(s.load)) return null;
    s.pmax = num('pmax', 'the operating pressure', false); if (s.pmax !== null && isNaN(s.pmax)) return null;
    if (Math.abs(s.tin - s.tout) < 1) { fail('Supply and return temperature must differ by at least 1 °F.', $('tout')); return null; }
    if (s.tpeak !== null && s.tpeak < Math.max(s.tin, s.tout)) { fail('The peak temperature cannot be below the supply temperature.', $('tpeak')); return null; }
    s.thot = Math.max(s.tin, s.tout);
    s.dT = Math.abs(s.tin - s.tout);
    s.kW = s.load * 0.29307107;
    s.kgs = s.kW / (DATA.cp * (s.dT / 1.8));
    s.tm = fToC((s.tin + s.tout) / 2);
    s.rho = rho(s.tm); s.mu = mu(s.tm);
    s.q = s.kgs / s.rho;
    s.gpm = s.q * 15850.323;
    return s;
  }
  function flowText(s) { return 'ΔT ' + fmt(s.dT, 0) + ' °F (' + fmt(s.dT / 1.8, 1) + ' K) · flow ' + fmt(s.gpm, 1) + ' gpm (' + fmt(s.kgs * 3600, 0) + ' kg/h) · ' + fmt(s.load, 0) + ' MBH (' + fmt(s.kW, 0) + ' kW)'; }

  function hyd(z, mat, s) {
    var D = z.id / 1000, v = s.q / (Math.PI * D * D / 4), f;
    if (mat === 'corrugated') f = z.f;
    else { var re = s.rho * v * D / s.mu, e = DATA.roughness[mat] / 1000; f = re < 2300 ? 64 / re : 0.25 / Math.pow(Math.log10(e / (3.7 * D) + 5.74 / Math.pow(re, 0.9)), 2); }
    var pa = f * s.rho * v * v / (2 * D);
    return { v: v * 3.28084, pa: pa, psi100: pa * 0.0044208 };
  }
  function pLimit(ser, z, s) {
    if (ser.pByT) { for (var i = 0; i < ser.pByT.length; i++) if (s.thot <= ser.pByT[i][0]) return ser.pByT[i][1]; return null; }
    return z.lim.pPsi;
  }
  function why(ser, z, s) {
    var peak = s.tpeak === null ? s.thot : s.tpeak;
    if (s.thot > z.lim.tContF) return 'supply temperature above ' + z.lim.tContF + ' °F';
    if (peak > z.lim.tPeakF) return 'peak temperature above ' + z.lim.tPeakF + ' °F';
    var p = pLimit(ser, z, s);
    if (p === null) return 'pressure rating above ' + ser.pByT[ser.pByT.length - 1][0] + ' °F on request';
    if (s.pmax !== null && s.pmax > p) return 'operating pressure above ' + p + ' psi at this temperature';
    return '';
  }

  function renderProducts() {
    var s = st.specs, box = $('products'), un = $('unsuitable');
    box.textContent = ''; un.textContent = ''; st.rows = {};
    $('recap').textContent = st.medium + ' · ' + st.country + ' · supply ' + fmt(s.tin, 0) + ' °F · return ' + fmt(s.tout, 0) + ' °F' + (s.tpeak !== null ? ' · peak ' + fmt(s.tpeak, 0) + ' °F' : '') + ' · route ' + fmt(s.len, 0) + ' ft' + (s.pmax !== null ? ' · ' + fmt(s.pmax, 0) + ' psi' : '') + ' · ' + flowText(s);
    if (st.medium !== 'Heating systems') {
      $('s3hint').textContent = 'For this medium the configurator does not size products yet. Continue with the next step; we include suitable products and options in our offer.';
      $('method').textContent = ''; return;
    }
    $('s3hint').textContent = 'Select the sizes you would like an offer for.';
    var out = [];
    DATA.series.forEach(function (ser) {
      var ok = [], reasons = {};
      ser.sizes.forEach(function (z) { var w = why(ser, z, s); if (w) reasons[w] = 1; else ok.push(z); });
      if (!ok.length) { out.push(ser.name + ': ' + Object.keys(reasons).join('; ')); return; }
      var need = s.len * (ser.pipes === 1 ? 2 : 1);
      var card = el('article', 'prod'), head = el('header'), left = el('div');
      left.appendChild(el('h3', '', ser.name));
      left.appendChild(el('p', '', (ser.type === 'rigid' ? 'Rigid steel pipe, welded on site. ' : 'Flexible, self-compensating, delivered in coils. ') + (ser.pipes === 2 ? 'Twin pipe: supply and return in one jacket. ' : 'Single pipe: one line each for supply and return. ') + ser.note));
      var a = el('a', '', 'Product details'); a.href = ser.page; left.appendChild(a);
      var nd = el('div', 'need', 'Pipe length needed'); nd.appendChild(el('b', '', fmt(need, 0) + ' ft (' + fmt(need * 0.3048, 0) + ' m)'));
      head.appendChild(left); head.appendChild(nd); card.appendChild(head);
      var sc = el('div', 'scroll'), tb = el('table'), tr = el('tr');
      [['', ''], ['Size', ''], ['Carrier ID', ''], ['Jacket', ''], ['Min. bending radius', ''], ['Max. coil', ''], ['Pieces', 'n'], ['Velocity', 'n'], ['Pressure loss', 'n'], ['Loss, supply + return', 'n']].forEach(function (h) { tr.appendChild(el('th', h[1], h[0])); });
      tb.appendChild(tr);
      var rec = null, ri = -1, rows = ok.map(function (z, i) { var h = hyd(z, ser.material, s); if (rec === null && h.pa <= DATA.rule) { rec = z; ri = i; } return [z, h]; });
      // show the sizes around the sizing range, not the whole catalogue
      if (rec) rows = rows.filter(function (zh, i) { return zh[1].pa <= 5 * DATA.rule && i <= ri + 2; });
      else { rows = rows.slice(-1); left.appendChild(el('p', '', 'No size reaches the sizing range at this flow. The largest size is shown; ask us about parallel lines or another system.')); }
      rows.forEach(function (zh) {
        var z = zh[0], h = zh[1], key = ser.product + '/' + ser.id + '/' + z.label, r = el('tr', z === rec ? 'rec' : (h.pa > DATA.rule ? 'over' : ''));
        var c = el('td'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!st.sel[key]; cb.setAttribute('aria-label', 'Select ' + ser.name + ' ' + z.label);
        cb.addEventListener('change', function () { if (cb.checked) st.sel[key] = 1; else delete st.sel[key]; });
        c.appendChild(cb); r.appendChild(c);
        var n = el('td'); n.appendChild(el('b', '', z.label)); if (z === rec) n.appendChild(el('span', 'badge', 'Recommended')); r.appendChild(n);
        r.appendChild(el('td', '', z.idUS + ' (' + fmt(z.id, 1) + ' mm)'));
        r.appendChild(el('td', '', z.jacket));
        r.appendChild(el('td', '', z.bend || 'rigid'));
        r.appendChild(el('td', '', z.coil || 'pipe lengths'));
        var pcs = z.coilFt ? Math.ceil(need / z.coilFt) : null;
        r.appendChild(el('td', 'n', pcs ? fmt(pcs, 0) + (pcs === 1 ? ' coil' : ' coils') : '–'));
        r.appendChild(el('td', 'n', fmt(h.v, 1) + ' ft/s'));
        r.appendChild(el('td', 'n', fmt(h.psi100, h.psi100 < 10 ? 2 : 0) + ' psi/100 ft (' + fmt(h.pa, 0) + ' Pa/m)'));
        r.appendChild(el('td', 'n', fmt(h.psi100 * s.len * 2 / 100, 1) + ' psi'));
        tb.appendChild(r);
        st.rows[key] = { ser: ser, z: z, h: h, need: need, pcs: pcs, rec: z === rec };
      });
      sc.appendChild(tb); card.appendChild(sc); box.appendChild(card);
    });
    Object.keys(st.sel).forEach(function (k) { if (!st.rows[k]) delete st.sel[k]; });
    if (!box.children.length) box.appendChild(el('p', 'msg err', 'No product in the range matches these values. Continue with the next step and we will propose a solution.'));
    if (out.length) { var d = el('div', 'unsuit'); d.appendChild(el('h3', '', 'Not suitable for these values')); var ul = el('ul'); out.forEach(function (t) { ul.appendChild(el('li', '', t)); }); d.appendChild(ul); un.appendChild(d); }
    $('method').textContent = 'Recommended is the smallest size with a pressure loss of at most ' + DATA.rule + ' Pa/m (' + fmt(DATA.rule * 0.0044208, 2) + ' psi per 100 ft), the upper end of the BRUGG Pipes sizing range. Velocity and pressure loss are estimates for water at the mean temperature in straight pipe, without fittings: Darcy-Weisbach with roughness ' + DATA.roughness.pex + ' mm for PEX and ' + DATA.roughness.steel + ' mm for steel; CASAFLEX with friction factors derived from the BRUGG Pipes configurator. Final sizing is done by BRUGG Pipes engineering.';
  }

  function summary() {
    var s = st.specs, c = st.contact, L = [];
    L.push('BRUGG Pipes configurator: request for a quote');
    L.push('');
    L.push('Contact: ' + c.fn + ' ' + c.ln + ', ' + c.co);
    L.push('Email: ' + c.em + (c.ph ? ' · Phone: ' + c.ph : ''));
    if (c.pr) L.push('Project: ' + c.pr);
    L.push('Location: ' + (c.st ? c.st + ', ' : '') + st.country);
    L.push('');
    L.push('Medium: ' + st.medium);
    L.push('Supply / return: ' + fmt(s.tin, 0) + ' / ' + fmt(s.tout, 0) + ' °F (' + fmt(fToC(s.tin), 0) + ' / ' + fmt(fToC(s.tout), 0) + ' °C)');
    if (s.tpeak !== null) L.push('Peak temperature: ' + fmt(s.tpeak, 0) + ' °F (' + fmt(fToC(s.tpeak), 0) + ' °C)');
    L.push('Route length: ' + fmt(s.len, 0) + ' ft (' + fmt(s.len * 0.3048, 0) + ' m)');
    L.push('Heat load: ' + fmt(s.load, 0) + ' MBH (' + fmt(s.kW, 0) + ' kW)');
    if (s.pmax !== null) L.push('Max. operating pressure: ' + fmt(s.pmax, 0) + ' psi (' + fmt(s.pmax / 14.5038, 1) + ' bar)');
    L.push('Flow: ' + fmt(s.gpm, 1) + ' gpm (' + fmt(s.kgs * 3600, 0) + ' kg/h)');
    L.push('');
    var keys = Object.keys(st.sel);
    L.push('Selected products:' + (keys.length ? '' : ' none selected, please propose'));
    keys.forEach(function (k) { var r = st.rows[k]; L.push('- ' + r.ser.name + ' ' + r.z.label + ': ' + fmt(r.need, 0) + ' ft' + (r.pcs ? ', ' + r.pcs + (r.pcs === 1 ? ' coil' : ' coils') : '') + ', ' + fmt(r.h.v, 1) + ' ft/s, ' + fmt(r.h.psi100, 2) + ' psi/100 ft' + (r.rec ? ' (recommended)' : '')); });
    L.push('');
    L.push('Building entrances: ' + st.entr);
    if (st.notes) L.push('Notes: ' + st.notes);
    return L.join('\n');
  }

  function init() {
    $('s1').addEventListener('submit', function (e) { e.preventDefault(); st.country = $('country').value === 'Canada' ? 'Canada' : 'United States of America'; var m = document.querySelector('input[name=medium]:checked'); st.medium = clean(m ? m.value : 'Heating systems', 40); show(2); });
    ['tin', 'tout', 'load'].forEach(function (id) { $(id).addEventListener('input', function () { var a = Number($('tin').value), b = Number($('tout').value), l = Number($('load').value); if ($('tin').value && $('tout').value && $('load').value && Math.abs(a - b) >= 1 && l > 0) { var kW = l * 0.29307107, kgs = kW / (DATA.cp * Math.abs(a - b) / 1.8), t = fToC((a + b) / 2); $('flow').textContent = flowText({ dT: Math.abs(a - b), gpm: kgs / rho(t) * 15850.323, kgs: kgs, load: l, kW: kW }); } else $('flow').textContent = ''; }); });
    $('s2').addEventListener('submit', function (e) { e.preventDefault(); $('err').hidden = true; var s = readSpecs(); if (!s) return; st.specs = s; renderProducts(); show(3); });
    $('s3').addEventListener('submit', function (e) { e.preventDefault(); show(4); });
    $('s4').addEventListener('submit', function (e) { e.preventDefault(); var n = num('entr', 'the number of building entrances', true); if (isNaN(n)) return; st.entr = Math.round(n); st.notes = clean($('notes').value, 800); show(5); });
    $('s5').addEventListener('submit', function (e) {
      e.preventDefault(); $('err').hidden = true;
      var c = { fn: clean($('fn').value, 60), ln: clean($('ln').value, 60), co: clean($('co').value, 100), pr: clean($('pr').value, 100), em: clean($('em').value, 120), ph: clean($('ph').value, 30), st: clean($('st').value, 40) };
      ['fn', 'ln', 'co', 'em'].forEach(function (id) { $(id).classList.remove('bad'); });
      if (!c.fn) return fail('Please enter your first name.', $('fn'));
      if (!c.ln) return fail('Please enter your last name.', $('ln'));
      if (!c.co) return fail('Please enter your company.', $('co'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.em)) return fail('Please enter a valid email address.', $('em'));
      st.contact = c; var t = summary(); $('summary').textContent = t;
      $('mail').href = 'mailto:sales.bpna@brugg.com?subject=' + encodeURIComponent('Request for a quote' + (c.pr ? ': ' + c.pr : '') + ' (' + c.co + ')') + '&body=' + encodeURIComponent(t);
      $('copied').textContent = ''; show(6);
    });
    Array.prototype.forEach.call($('progress').children, function (li, k) { function go() { if (li.className === 'done') show(k + 1); } li.addEventListener('click', go); li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } }); });
    document.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { show(cur - 1); }); });
    $('print').addEventListener('click', function () { window.print(); });
    $('copy').addEventListener('click', function () { var t = $('summary').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { $('copied').textContent = 'Summary copied.'; }).catch(function () { var r = document.createRange(); r.selectNodeContents($('summary')); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); $('copied').textContent = 'Summary selected. Press Ctrl+C to copy.'; }); });
  }
  fetch('../data/products.json', { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('data'); return r.json(); }).then(function (d) { DATA = d; init(); }).catch(function () { fail('The product data could not be loaded. Please reload the page or write to sales.bpna@brugg.com.'); });
})();
