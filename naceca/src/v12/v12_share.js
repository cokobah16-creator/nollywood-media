/* =========================================================================
   NACECA · v12 share cards — every front page is a WhatsApp post
   The end-of-mission headline renders as a 1080×1350 newspaper clipping
   with the grade stamp, ready for WhatsApp status, Instagram or X.
   Phones share the image natively; desktops download it and open a
   WhatsApp share with the text.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

// Set this to the public game address (GitHub Pages, itch.io) so shares link back to it.
V12.PUBLIC_URL = V12.PUBLIC_URL || '';
V12.shareUrl = ()=>{
  if(V12.PUBLIC_URL) return V12.PUBLIC_URL;
  try{ if(/^https?:/.test(location.href) && !/claudeusercontent|claude\.ai|localhost|127\.0\.0\.1/.test(location.host)) return location.origin + location.pathname; }catch(e){}
  return '';
};
V12.shareTextOut = async text => {
  try{ if(navigator.share){ await navigator.share({ text }); V12.log('share', { kind:'text' }); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
  try{ await navigator.clipboard.writeText(text); toast('COPIED', 'Paste it into WhatsApp', 1800); }catch(e){}
  try{ window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); }catch(e){}
  V12.log('share', { kind:'text-fallback' });
};

function wrap(x, text, maxW){
  const words = String(text).split(/\s+/), lines = []; let cur = '';
  for(const w of words){ const t = cur ? cur + ' ' + w : w; if(x.measureText(t).width > maxW && cur){ lines.push(cur); cur = w; } else cur = t; }
  if(cur) lines.push(cur); return lines;
}
async function fonts(){
  try{ if(document.fonts && document.fonts.load) await Promise.race([Promise.all([document.fonts.load('700 72px Oswald'), document.fonts.load('italic 34px Inter'), document.fonts.load('600 30px Oswald')]), new Promise(r => setTimeout(r, 900))]); }catch(e){}
}
V12.headlineCard = async function(h){
  await fonts();
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#1C1C1A'; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(233,220,192,.06)'; for(let i = 0; i < W; i += 60){ x.fillRect(i, 0, 1, H); } for(let j = 0; j < H; j += 60){ x.fillRect(0, j, W, 1); }
  x.textAlign = 'center'; x.fillStyle = '#E9DCC0'; x.font = '700 92px Oswald, "Arial Narrow", sans-serif'; x.fillText('NACECA', W/2, 140);
  x.fillStyle = '#A89F8A'; x.font = '600 30px Oswald, "Arial Narrow", sans-serif'; x.fillText('O P E R A T I O N   S E R P E N T \' S   R O U T E', W/2, 192);
  // the clipping
  const cx = 70, cy = 250, cw = W - 140, ch = 820;
  x.save(); x.translate(W/2, cy + ch/2); x.rotate(-0.012); x.translate(-W/2, -(cy + ch/2));
  x.fillStyle = '#E9DCC0'; x.fillRect(cx, cy, cw, ch);
  x.fillStyle = 'rgba(0,0,0,.025)'; for(let j = cy; j < cy + ch; j += 4) x.fillRect(cx, j, cw, 1);
  x.textAlign = 'left'; x.fillStyle = '#B3261E'; x.font = '600 28px Oswald, "Arial Narrow", sans-serif';
  const mast = (h.pub || 'THE DAILY GONG') + ' · MORNING EDITION', spaced = mast.split('').join(' ').replace(/ {3}/g, '   ');
  x.fillText(x.measureText(spaced).width <= cw - 120 ? spaced : mast, cx + 60, cy + 80);
  x.fillStyle = '#1C1C1A'; x.fillRect(cx + 60, cy + 104, cw - 120, 4); x.fillRect(cx + 60, cy + 114, cw - 120, 1.5);
  x.font = '700 70px Oswald, "Arial Narrow", sans-serif'; x.fillStyle = '#1C1C1A';
  let y = cy + 200; for(const ln of wrap(x, h.head || '', cw - 120).slice(0, 5)){ x.fillText(ln, cx + 60, y); y += 82; }
  x.font = 'italic 34px Inter, Georgia, serif'; x.fillStyle = '#4F4C44'; y += 18;
  for(const ln of wrap(x, h.ded || '', cw - 120).slice(0, 5)){ x.fillText(ln, cx + 60, y); y += 48; }
  x.restore();
  // grade stamp
  if(h.grade){
    const col = { S:'#0B6E4F', A:'#0B6E4F', B:'#1C1C1A', C:'#B3261E', D:'#B3261E' }[h.grade] || '#B3261E';
    x.save(); x.translate(W - 190, cy + ch - 120); x.rotate(-0.22);
    x.strokeStyle = col; x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 88, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 74, 0, Math.PI * 2); x.stroke();
    x.fillStyle = col; x.textAlign = 'center'; x.font = '700 92px Oswald, sans-serif'; x.fillText(h.grade, 0, 24);
    x.font = '600 15px Oswald, sans-serif'; x.fillText('G R A D E', 0, 50); x.restore();
  }
  x.textAlign = 'center'; x.fillStyle = '#A89F8A'; x.font = '600 26px Oswald, sans-serif';
  if(h.region) x.fillText(h.region.toUpperCase(), W/2, 1150);
  x.fillStyle = '#E9DCC0'; x.font = '600 34px Oswald, sans-serif'; x.fillText('A NIGERIAN DETECTIVE GAME — PLAY THE CASE', W/2, 1222);
  const url = V12.shareUrl(); if(url){ x.fillStyle = '#E9DCC0'; x.font = '500 26px Inter, sans-serif'; x.fillText(url.replace(/^https?:\/\//, ''), W/2, 1272); }
  x.fillStyle = '#8C8473'; x.font = '500 20px Inter, sans-serif'; x.fillText('Fiction. All characters, agencies and cases are fictional.', W/2, 1318);
  return c;
};
V12.shareHeadline = async function(h){
  try{
    const c = await V12.headlineCard(h);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const text = `${h.pub}: "${h.head}"\nI played NACECA — a Nigerian detective game.${V12.shareUrl() ? ' ' + V12.shareUrl() : ''}`;
    const file = blob && typeof File !== 'undefined' ? new File([blob], 'naceca-front-page.png', { type:'image/png' }) : null;
    if(file && navigator.canShare && navigator.canShare({ files:[file] })){
      try{ await navigator.share({ files:[file], text }); V12.log('share', { kind:'headline-image' }); return; }catch(e){ if(e && e.name === 'AbortError') return; }
    }
    if(blob){ const r = await V12.saveFile('naceca-front-page.png', blob); if(r === 'declined') return; if(r === 'failed'){ toast('SHARE FAILED', 'Try again in a moment', 1800); return; } }
    toast('FRONT PAGE SAVED', 'Post the image — the text opens in WhatsApp', 2400);
    try{ window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); }catch(e){}
    V12.log('share', { kind:'headline-download' });
  }catch(e){ console.warn('[v12] share', e); toast('SHARE FAILED', 'Try again in a moment', 1800); }
};
V12.shareBtn = h => { const b = V12.el('button', 'v12-share', icon('share') + 'SHARE'); b.addEventListener('click', e => { e.stopPropagation(); V12.shareHeadline(h); }); return b; };

/* aftermath: a share button on the front page */
V12.wrap('showAftermath', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const blk = document.querySelector('#aftermath-grid .headline-block'), mid = S.game.currentMission;
    const a = (S.game.archive || []).find(x => x.mid === mid), m = MISSIONS.find(x => x.id === mid) || {};
    if(blk && a && !blk.querySelector('.v12-share')) blk.appendChild(V12.shareBtn({ pub:a.pub, head:a.head, ded:a.ded, grade:a.grade, region:m.region }));
  }catch(e){}
  return r;
});
/* press archive: share any front page you earned */
V12.wrap('renderRecords', orig => function(tab){
  const r = orig.apply(this, arguments);
  try{
    if(tab !== 'awards'){
      const arc = (S.game.archive || []).slice().sort((a, b) => b.at - a.at);
      document.querySelectorAll('#records-body .headline-block.arc').forEach((el, i) => { const a = arc[i]; if(a){ const m = MISSIONS.find(x => x.id === a.mid) || {}; el.appendChild(V12.shareBtn({ pub:a.pub, head:a.head, ded:a.ded, grade:a.grade, region:m.region })); } });
    }
  }catch(e){}
  return r;
});

})();
