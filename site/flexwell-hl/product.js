"use strict";

(function(){
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

(function(){var q=new URLSearchParams(location.search).get('v');if(!q)return;var t=document.querySelector('.tab[data-v="'+q.replace(/[^a-z0-9-]/g,'')+'"]');if(t)t.click();})();