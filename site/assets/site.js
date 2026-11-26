"use strict";
document.querySelectorAll('[data-play]').forEach(function (b) {
  b.addEventListener('click', function () {
    var v = document.getElementById(b.dataset.target);
    var cap = document.getElementById(b.dataset.target + '-cap');
    if (!v || b.dataset.play.charAt(0) !== '/' || b.dataset.play.charAt(1) === '/') return;
    v.pause(); v.poster = b.dataset.poster || ''; v.src = b.dataset.play; v.load();
    if (cap) { cap.textContent = ''; var s = document.createElement('b'); s.textContent = b.dataset.title; cap.appendChild(s); cap.appendChild(document.createTextNode(' · ' + b.dataset.dur)); }
    v.scrollIntoView({ behavior: 'smooth', block: 'center' }); v.play().catch(function () {});
  });
});
