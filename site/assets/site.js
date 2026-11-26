"use strict";
document.querySelectorAll('[data-play]').forEach(function (b) {
  b.addEventListener('click', function () {
    var v = document.getElementById(b.dataset.target);
    var cap = document.getElementById(b.dataset.target + '-cap');
    if (!v || !/^[a-z0-9-]+$/.test(b.dataset.play)) return;
    v.pause(); v.poster = 'media/poster-' + b.dataset.play + '.jpg'; v.src = 'media/' + b.dataset.play + '.mp4'; v.load();
    if (cap) { cap.textContent = ''; var s = document.createElement('b'); s.textContent = b.dataset.title; cap.appendChild(s); cap.appendChild(document.createTextNode(' · ' + b.dataset.dur)); }
    v.scrollIntoView({ behavior: 'smooth', block: 'center' }); v.play().catch(function () {});
  });
});
