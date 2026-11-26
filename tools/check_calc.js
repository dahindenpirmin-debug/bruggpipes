// independent check of the configurator calculation: reference water properties (IAPWS-95 table values) and Colebrook-White solved by iteration
const C = require('../site/configurator/configurator-calc.js');
const ref = [[20, 998.21, 1.0016e-3], [50, 988.03, 5.468e-4], [70, 977.76, 4.035e-4], [80, 971.79, 3.545e-4], [100, 958.35, 2.818e-4], [130, 934.83, 2.128e-4], [150, 916.83, 1.826e-4]];
let w = 0, wm = 0;
ref.forEach(([t, r, m]) => { const dr = (C.rho(t) / r - 1) * 100, dm = (C.mu(t) / m - 1) * 100; w = Math.max(w, Math.abs(dr)); wm = Math.max(wm, Math.abs(dm)); console.log(`water ${t} °C: density ${C.rho(t).toFixed(2)} vs ${r} (${dr.toFixed(2)} %), viscosity ${(C.mu(t) * 1e3).toFixed(4)} vs ${(m * 1e3).toFixed(4)} mPa·s (${dm.toFixed(2)} %)`); });
function colebrook(re, rr) { let f = 0.02; for (let i = 0; i < 60; i++) f = 1 / Math.pow(-2 * Math.log10(rr / 3.7 + 2.51 / (re * Math.sqrt(f))), 2); return f; }
let wf = 0;
[[500, 20, 70], [150, 20, 70], [1500, 30, 90], [50, 10, 45]].forEach(([kW, dT, tm]) => {
  const fl = C.flow(kW, dT, tm, 4.186);
  [[20.6, 0.007], [41.98, 0.007], [73.6, 0.007], [102.2, 0.007], [82.5, 0.045], [160.3, 0.045], [309.7, 0.045]].forEach(([d, e]) => {
    const h = C.hyd(d, e, 0, fl), re = fl.rho * h.v * d / 1000 / fl.mu; if (re < 4000) return;
    const fc = colebrook(re, e / d), dev = (h.f / fc - 1) * 100; wf = Math.max(wf, Math.abs(dev));
  });
});
console.log('max deviation density %', w.toFixed(2), '| viscosity %', wm.toFixed(2), '| friction factor vs Colebrook %', wf.toFixed(2));
// unit conversions
console.log('176 °F =', C.fToC(176), '°C | 1706.07 MBH =', (1706.07 * C.K.mbh).toFixed(1), 'kW | 87 psi =', (87 * C.K.psi).toFixed(2), 'bar | 200 Pa/m =', (200 * C.K.paM_psi100ft).toFixed(3), 'psi/100 ft (exact', (200 * 30.48 / 6894.757).toFixed(3) + ')');
// reference point of the BRUGG configurator: 500 kW, 80/60 °C -> 21,500 kg/h; CASAFLEX 127 mm: 0.49 m/s, 69 Pa/m
const D = require('../site/data/products.json'); const fl = C.flow(500, 20, 70, D.cp);
console.log('mass flow kg/h', (fl.kgs * 3600).toFixed(0));
const orig = { 22: [16.16, 610794], 30: [8.69, 125805], 39: [5.14, 28439], 48: [3.40, 9740], 60: [2.17, 2391], 75: [1.39, 1003], 98: [0.81, 230], 127: [0.49, 69] };
D.series.find(s => s.product === 'casaflex' && s.id === 'uno').sizes.forEach(z => { const h = C.hyd(z.id, 0, z.f, fl), o = orig[z.id]; console.log(`CASAFLEX ${z.id} mm: v ${h.v.toFixed(2)} (orig ${o[0]}), ${h.pa.toFixed(0)} Pa/m (orig ${o[1]}, ${((h.pa / o[1] - 1) * 100).toFixed(1)} %)`); });
// network: source -> A (100) -> B (50), A -> C (30): loads carried
console.log('downstream', C.downstream([{ from: 'S', to: 'A', load: 100 }, { from: 'A', to: 'B', load: 50 }, { from: 'A', to: 'C', load: 30 }, { from: 'B', to: 'D', load: 20 }]).join(','), '(expected 200,70,30,20) | path to D', C.path([{ from: 'S', to: 'A' }, { from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }], 3).join('>'));
