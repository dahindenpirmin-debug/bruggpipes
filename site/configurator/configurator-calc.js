"use strict";
/* Hydraulic calculation of the configurator. Pure functions in SI units, used by the page and by the checks. */
var CFG_CALC = (function () {
  function fToC(f) { return (f - 32) / 1.8; }
  function cToF(c) { return c * 1.8 + 32; }
  // water, t in °C: density kg/m3 (Kell-type fit), dynamic viscosity Pa·s (Vogel fit)
  function rho(t) { return 1000 * (1 - (t + 288.9414) / (508929.2 * (t + 68.12963)) * Math.pow(t - 3.9863, 2)); }
  function mu(t) { return 2.414e-5 * Math.pow(10, 247.8 / (t + 133.15)); }
  // heat load kW, temperature difference K, mean temperature °C, cp kJ/(kg·K)
  function flow(kW, dTK, tmC, cp) { var r = rho(tmC), kgs = kW / (cp * dTK); return { kgs: kgs, q: kgs / r, rho: r, mu: mu(tmC) }; }
  // inner diameter mm, roughness mm (or fixed friction factor fFix), flow m3/s -> velocity m/s, pressure loss Pa/m
  function hyd(idMm, roughMm, fFix, fl) {
    var D = idMm / 1000, v = fl.q / (Math.PI * D * D / 4), f;
    if (fFix) f = fFix;
    else { var re = fl.rho * v * D / fl.mu; f = re < 2300 ? 64 / Math.max(re, 1e-9) : 0.25 / Math.pow(Math.log10(roughMm / 1000 / (3.7 * D) + 5.74 / Math.pow(re, 0.9)), 2); }
    return { v: v, pa: f * fl.rho * v * v / (2 * D), f: f };
  }
  // sections: [{from, to, load}] in order; load of a section = its own consumer plus everything downstream
  function downstream(sections) {
    return sections.map(function (s, i) {
      var sum = 0, seen = {};
      (function add(j) { if (seen[j]) return; seen[j] = 1; sum += sections[j].load; sections.forEach(function (o, k) { if (k !== j && o.from === sections[j].to) add(k); }); })(i);
      return sum;
    });
  }
  // path of section indices from the source to section i
  function path(sections, i) { var p = [], g = 0, j = i; while (j >= 0 && g++ < 500) { p.unshift(j); var f = sections[j].from, n = -1; sections.forEach(function (o, k) { if (o.to === f) n = k; }); j = n; } return p; }
  return { fToC: fToC, cToF: cToF, rho: rho, mu: mu, flow: flow, hyd: hyd, downstream: downstream, path: path, K: { ft: 0.3048, mbh: 0.29307107, psi: 0.0689476, gpm: 15850.323, paM_psi100ft: 0.0044208 } };
})();
if (typeof module !== 'undefined') module.exports = CFG_CALC;
