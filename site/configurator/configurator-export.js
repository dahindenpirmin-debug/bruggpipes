"use strict";
/* Project summary as BRUGG CI PDF, as email draft (.eml) with the PDF attached, and as formatted HTML. Everything is built in the browser. */
var CFG_EXPORT = (function () {
  var INK = [22, 24, 29], GREY = [74, 81, 96], LINE = [201, 206, 216], BLUE = [41, 61, 145];
  var CONTACT = 'BRUGG Pipes · bruggpipes.com · sales.bpna@brugg.com · +1 815 927 7355';
  function load(src) { return new Promise(function (res, rej) { if (document.querySelector('script[data-lib="' + src + '"]')) return res(); var s = document.createElement('script'); s.src = src; s.dataset.lib = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error(src)); }; document.head.appendChild(s); }); }
  function b64(buf) { var u = new Uint8Array(buf), s = '', i; for (i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function utf8b64(str) { return b64(new TextEncoder().encode(str).buffer); }
  function bin(url) { return fetch(url, { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error(url); return r.arrayBuffer(); }); }
  function wrap76(s) { return s.replace(/(.{76})/g, '$1\r\n'); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var ready = null;
  function prep() {
    if (!ready) ready = load('vendor/jspdf.umd.min.js').then(function () { return load('vendor/jspdf.plugin.autotable.min.js'); })
      .then(function () { return Promise.all([bin('vendor/Inter-Regular.ttf'), bin('vendor/Inter-Bold.ttf'), bin('/media/logo-white.png'), bin('/media/logo.png')]); })
      .then(function (a) { return { reg: b64(a[0]), bold: b64(a[1]), logoW: b64(a[2]), logo: b64(a[3]) }; });
    ready.catch(function () { ready = null; });
    return ready;
  }
  function pdf(m) {
    return prep().then(function (A) {
      var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter', compress: true }), W = 612, H = 792, M = 43, y;
      doc.addFileToVFS('Inter-Regular.ttf', A.reg); doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
      doc.addFileToVFS('Inter-Bold.ttf', A.bold); doc.addFont('Inter-Bold.ttf', 'Inter', 'bold');
      doc.setProperties({ title: m.title, subject: 'BRUGG Pipes project summary', author: 'BRUGG Pipes configurator' });
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]); doc.rect(0, 0, W, 96, 'F');
      doc.addImage('data:image/png;base64,' + A.logoW, 'PNG', M, 26, 99, 44);
      doc.setFont('Inter', 'bold'); doc.setTextColor(255); doc.setFontSize(8); doc.text('PROJECT SUMMARY', W - M, 44, { align: 'right', charSpace: 1.2 });
      doc.setFont('Inter', 'normal'); doc.setFontSize(8.5); doc.text(m.date, W - M, 60, { align: 'right' });
      doc.setTextColor(INK[0], INK[1], INK[2]); doc.setFont('Inter', 'bold'); doc.setFontSize(20);
      var tl = doc.splitTextToSize(m.title, W - 2 * M); doc.text(tl, M, 132); y = 132 + (tl.length - 1) * 24 + 18;
      doc.setFont('Inter', 'normal'); doc.setFontSize(10.4); doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.text(doc.splitTextToSize(m.sub, W - 2 * M), M, y); y += 30;
      m.secs.forEach(function (s) {
        if (y > H - 130) { doc.addPage(); y = 60; }
        doc.setFont('Inter', 'bold'); doc.setFontSize(8); doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]); doc.text(s.title.toUpperCase(), M, y, { charSpace: 1 }); y += 8;
        var cs = {}; if (s.kv) cs = { 0: { cellWidth: 170, textColor: GREY }, 1: { fontStyle: 'bold' } }; else s.head.forEach(function (h, i) { if (h[1] === 'n') cs[i] = { halign: 'right' }; });
        window.autoTable(doc, {
          startY: y, margin: { left: M, right: M, top: 60, bottom: 60 }, theme: 'plain', head: s.head.length ? [s.head.map(function (h) { return h[0]; })] : undefined, body: s.rows,
          styles: { font: 'Inter', fontSize: 8.2, textColor: INK, cellPadding: { top: 5, bottom: 5, left: 0, right: 10 }, lineColor: LINE, lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 }, overflow: 'linebreak' },
          headStyles: { fontStyle: 'bold', textColor: GREY, fontSize: 7.2, lineColor: INK, lineWidth: { bottom: 1, top: 0, left: 0, right: 0 } }, columnStyles: cs,
          didParseCell: function (d) { if (d.section === 'head' && s.head[d.column.index] && s.head[d.column.index][1] === 'n') d.cell.styles.halign = 'right'; }
        });
        y = doc.lastAutoTable.finalY + 24;
      });
      if (y > H - 78) { doc.addPage(); y = 60; }
      doc.setFont('Inter', 'normal'); doc.setFontSize(7.5); doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.text(doc.splitTextToSize(m.note, W - 2 * M), M, y);
      var n = doc.getNumberOfPages();
      for (var i = 1; i <= n; i++) {
        doc.setPage(i); doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.5); doc.line(M, H - 44, W - M, H - 44);
        doc.setFont('Inter', 'normal'); doc.setFontSize(7); doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text('Project Summary | Page ' + i + ' of ' + n + ' | ' + CONTACT + ' | ' + m.date, M, H - 30);
        doc.addImage('data:image/png;base64,' + A.logo, 'PNG', W - M - 45, H - 39, 45, 20);
      }
      return doc.output('blob');
    });
  }
  // email body: tables and inline styles only, so that mail programs keep the layout
  function html(m, logoSrc) {
    var F = "font-family:Arial,Helvetica,sans-serif;", o = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>' + esc(m.title) + '</title></head><body style="margin:0;padding:0;background:#EEF1F8">';
    o += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F8"><tr><td align="center" style="padding:24px 12px">';
    o += '<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:680px;max-width:100%;background:#ffffff">';
    o += '<tr><td style="background:#293D91;padding:22px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td>' + (logoSrc ? '<img src="' + logoSrc + '" width="99" height="44" alt="BRUGG Pipes" style="display:block;border:0">' : '<span style="' + F + 'font-size:24px;font-weight:bold;color:#ffffff">BRUGG <span style="font-weight:normal">Pipes</span></span>') + '</td><td align="right" style="' + F + 'font-size:11px;letter-spacing:1.5px;color:#ffffff;font-weight:bold">PROJECT SUMMARY<br><span style="font-weight:normal;letter-spacing:0;font-size:12px">' + esc(m.date) + '</span></td></tr></table></td></tr>';
    o += '<tr><td style="padding:28px 28px 6px;' + F + '"><div style="font-size:22px;font-weight:bold;color:#16181D;line-height:1.25">' + esc(m.title) + '</div><div style="font-size:14px;color:#4A5160;padding-top:6px">' + esc(m.sub) + '</div></td></tr>';
    m.secs.forEach(function (s) {
      o += '<tr><td style="padding:22px 28px 0;' + F + '"><div style="font-size:11px;font-weight:bold;letter-spacing:1.2px;color:#293D91;text-transform:uppercase;padding-bottom:6px">' + esc(s.title) + '</div>';
      o += '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;' + F + 'font-size:13px;color:#16181D">';
      if (s.head.length) o += '<tr>' + s.head.map(function (h) { return '<th align="' + (h[1] === 'n' ? 'right' : 'left') + '" style="padding:7px 10px 7px 0;border-bottom:2px solid #16181D;font-size:11px;color:#4A5160;text-transform:uppercase;letter-spacing:.5px">' + esc(h[0]) + '</th>'; }).join('') + '</tr>';
      s.rows.forEach(function (r) { o += '<tr>' + r.map(function (c, i) { var k = s.kv && i === 0; return '<td align="' + (s.head[i] && s.head[i][1] === 'n' ? 'right' : 'left') + '" valign="top" style="padding:7px 10px 7px 0;border-bottom:1px solid #C9CED8;' + (k ? 'color:#4A5160;width:34%' : (s.kv ? 'font-weight:bold' : '')) + '">' + esc(c) + '</td>'; }).join('') + '</tr>'; });
      o += '</table></td></tr>';
    });
    o += '<tr><td style="padding:20px 28px 0;' + F + 'font-size:11.5px;color:#4A5160;line-height:1.5">' + esc(m.note) + '</td></tr>';
    o += '<tr><td style="padding:22px 28px 26px;' + F + 'font-size:12px;color:#4A5160"><div style="border-top:1px solid #C9CED8;padding-top:14px">' + esc(CONTACT) + '<br><span style="font-size:11px;font-weight:bold;letter-spacing:1.4px;color:#293D91">A BRUGG GROUP COMPANY</span></div></td></tr>';
    return o + '</table></td></tr></table></body></html>';
  }
  function text(m) { var L = [m.title, m.sub]; m.secs.forEach(function (s) { L.push(''); L.push(s.title.toUpperCase()); s.rows.forEach(function (r) { L.push((s.kv ? '' : '- ') + r.filter(function (x) { return x !== ''; }).join(s.kv ? ': ' : ' | ')); }); }); L.push(''); L.push(m.note); return L.join('\n'); }
  // unsent message with HTML body, inline logo and the PDF attached; mail programs open it as a draft
  function eml(m, pdfBlob) {
    return Promise.all([prep(), pdfBlob.arrayBuffer()]).then(function (a) {
      var A = a[0], B1 = 'bp_mixed_' + Date.now(), B2 = 'bp_alt_' + Date.now(), B3 = 'bp_rel_' + Date.now(), nl = '\r\n', name = m.file + '.pdf';
      var h = ['To: sales.bpna@brugg.com', 'Subject: =?UTF-8?B?' + utf8b64(m.subject) + '?=', 'X-Unsent: 1', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="' + B1 + '"', '',
        '--' + B1, 'Content-Type: multipart/alternative; boundary="' + B2 + '"', '',
        '--' + B2, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(utf8b64(text(m))), '',
        '--' + B2, 'Content-Type: multipart/related; boundary="' + B3 + '"', '',
        '--' + B3, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(utf8b64(html(m, 'cid:brugglogo'))), '',
        '--' + B3, 'Content-Type: image/png; name="logo.png"', 'Content-Transfer-Encoding: base64', 'Content-ID: <brugglogo>', 'Content-Disposition: inline; filename="logo.png"', '', wrap76(A.logoW), '',
        '--' + B3 + '--', '', '--' + B2 + '--', '',
        '--' + B1, 'Content-Type: application/pdf; name="' + name + '"', 'Content-Transfer-Encoding: base64', 'Content-Disposition: attachment; filename="' + name + '"', '', wrap76(b64(a[1])), '',
        '--' + B1 + '--', ''];
      return new Blob([h.join(nl)], { type: 'message/rfc822' });
    });
  }
  function save(blob, name) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }
  return { pdf: pdf, eml: eml, html: html, text: text, save: save };
})();
