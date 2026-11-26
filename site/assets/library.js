"use strict";
/* Academy installation library: filter by product group. Works without it: all entries stay visible. */
(function () {
  var bar = document.getElementById('libfilter'); if (!bar) return;
  var btns = bar.querySelectorAll('button'), rows = document.querySelectorAll('.lib li'), count = document.getElementById('libcount');
  function apply(g, push) {
    var known = false, n = 0;
    btns.forEach(function (b) { if (b.dataset.g === g) known = true; });
    if (!known) g = '';
    btns.forEach(function (b) { var on = b.dataset.g === g; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    rows.forEach(function (r) { var show = !g || r.dataset.g === g; r.hidden = !show; if (show) n++; });
    document.querySelectorAll('.libcat').forEach(function (c) {
      var k = c.querySelectorAll('li:not([hidden])').length, chip = document.querySelector('.chips a[data-cat="' + c.id.replace('lib-', '') + '"]');
      c.hidden = !k; if (chip) { chip.hidden = !k; chip.querySelector('i').textContent = String(k); }
    });
    var name = ''; btns.forEach(function (b) { if (b.dataset.g === g) name = b.textContent; });
    count.textContent = g ? n + (n === 1 ? ' entry' : ' entries') + ' for ' + name : '';
    if (push) { var u = new URL(location.href); if (g) u.searchParams.set('product', g); else u.searchParams.delete('product'); history.replaceState(null, '', u); }
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.dataset.g, true); }); });
  apply((new URLSearchParams(location.search).get('product') || '').replace(/[^a-z0-9-]/g, ''), false);
})();
