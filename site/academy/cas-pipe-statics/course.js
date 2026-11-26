"use strict";

(function(){
document.querySelectorAll('.quiz').forEach(function(z){
 var qs=z.querySelectorAll('.q'),sc=z.querySelector('.score');
 qs.forEach(function(q){q.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){
  if(q.classList.contains('done')) return; q.classList.add('done');
  var c=q.dataset.c; q.dataset.r=(b.dataset.i===c)?'1':'0';
  q.querySelectorAll('button').forEach(function(o){ if(o.dataset.i===c) o.classList.add('ok'); else if(o===b) o.classList.add('no'); o.setAttribute('aria-disabled','true'); });
  var done=z.querySelectorAll('.q.done').length, right=z.querySelectorAll('.q[data-r="1"]').length;
  sc.textContent=right+' of '+qs.length+' correct'+(done<qs.length?' so far':'');
 })})});
});
var msg=document.getElementById('dlmsg');
var dlp=(window.claude&&window.claude.use)?window.claude.use('downloads').catch(function(){return null}):Promise.resolve(null);
dlp.then(function(d){ if(!d) return;
 document.querySelectorAll('a[data-file]').forEach(function(a){a.addEventListener('click',function(e){
  e.preventDefault(); if(a.getAttribute('aria-busy')==='true') return; a.setAttribute('aria-busy','true'); msg.textContent='Preparing '+a.dataset.name+' ...';
  fetch(a.dataset.file).then(function(r){if(!r.ok) throw new Error('fetch');return r.blob()}).then(function(b){return d.save({filename:a.dataset.name,data:b})})
  .then(function(){msg.textContent='Saved '+a.dataset.name+'.'})
  .catch(function(err){msg.textContent=(err&&err.code==='declined')?'Download cancelled.':'This view could not save the file. Ask us for it at sales.bpna@brugg.com.'})
  .then(function(){a.removeAttribute('aria-busy')});
 })});
});
})();
