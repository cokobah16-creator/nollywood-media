/* =========================================================================
   NACECA · v13 materials (c) — Court 5, Federal High Court, Abuja
   Canvas-painted at load time: the signs atlas (the coat of arms, the
   court's name board, the judge's plate, a clock, a notice), the
   terrazzo floor, the green court carpet and the daylight windows.
   ========================================================================= */
(function(){
  const N = (x,w,h,a,al,seed,sz)=>_noise(x,w,h,a,al,seed,sz), T = (c,rep)=>_tex(c,rep);
  const font = (px, w)=>`${w||'bold'} ${px}px Oswald, Impact, 'Arial Narrow', sans-serif`;
  const serif = (px, w)=>`${w||'bold'} ${px}px Georgia, 'Times New Roman', serif`;
  const txt = (x, s, X, Y, f, col, align)=>{ x.font = f; x.fillStyle = col; x.textAlign = align || 'center'; x.textBaseline = 'middle'; x.fillText(s, X, Y); };
  function woodBoard(x, X, Y, W, H, r){
    const g = x.createLinearGradient(X, Y, X, Y + H); g.addColorStop(0, '#4a2a16'); g.addColorStop(1, '#2e180c');
    x.fillStyle = g; x.fillRect(X, Y, W, H);
    for(let i = 0; i < 40; i++){ x.strokeStyle = `rgba(${r() < 0.5 ? 20 : 110},${r() < 0.5 ? 10 : 70},${r() < 0.5 ? 4 : 40},${0.08 + r() * 0.12})`; x.lineWidth = 0.6 + r() * 1.6;
      const yy = Y + r() * H; x.beginPath(); x.moveTo(X, yy); x.bezierCurveTo(X + W * 0.3, yy + (r() - 0.5) * 6, X + W * 0.7, yy + (r() - 0.5) * 6, X + W, yy + (r() - 0.5) * 4); x.stroke(); }
    x.strokeStyle = '#c9a24a'; x.lineWidth = 3; x.strokeRect(X + 5, Y + 5, W - 10, H - 10);
  }
  function horse(x, cx, cy, s, flip){
    // a rearing horse in profile, simplified (body, neck, head, mane, legs, tail)
    x.save(); x.translate(cx, cy); x.scale(flip ? -s : s, s);
    x.fillStyle = '#f4f2ec'; x.strokeStyle = '#8a8a86'; x.lineWidth = 1.2 / s;
    x.beginPath(); x.ellipse(0, 18, 26, 13, -0.55, 0, Math.PI * 2); x.fill(); x.stroke();            // body
    x.beginPath(); x.moveTo(14, 2); x.quadraticCurveTo(22, -20, 30, -34); x.lineTo(40, -30); x.quadraticCurveTo(32, -14, 26, 10); x.closePath(); x.fill(); x.stroke();   // neck
    x.beginPath(); x.ellipse(40, -36, 12, 6.5, 0.55, 0, Math.PI * 2); x.fill(); x.stroke();          // head
    x.fillStyle = '#3a2e26'; x.beginPath(); x.moveTo(29, -36); x.quadraticCurveTo(18, -16, 13, 2); x.lineTo(17, 2); x.quadraticCurveTo(23, -16, 33, -33); x.closePath(); x.fill();   // mane
    x.beginPath(); x.arc(42, -38, 1.6, 0, 7); x.fill();                                               // eye
    x.strokeStyle = '#f4f2ec'; x.lineCap = 'round'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(20, 4); x.lineTo(34, -6); x.lineTo(42, 0); x.stroke();                    // forelegs, raised
    x.beginPath(); x.moveTo(16, 8); x.lineTo(30, 6); x.lineTo(36, 14); x.stroke();
    x.beginPath(); x.moveTo(-14, 28); x.lineTo(-10, 46); x.lineTo(-14, 58); x.stroke();               // hind legs
    x.beginPath(); x.moveTo(-22, 22); x.lineTo(-24, 42); x.lineTo(-30, 56); x.stroke();
    x.strokeStyle = '#3a2e26'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(-26, 12); x.quadraticCurveTo(-42, 18, -40, 40); x.stroke();   // tail
    x.restore();
  }
  function arms(x, X, Y, S){
    // simplified national coat of arms: the shield with the wavy Y, the eagle, the two horses, the flowered base, the motto
    const cx = X + S / 2, sc = S / 512;
    x.save(); x.translate(X, Y); x.scale(sc, sc);
    const g = x.createRadialGradient(256, 230, 30, 256, 256, 280); g.addColorStop(0, 'rgba(255,240,210,0.0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    // base mound with flowers
    x.fillStyle = '#2f6a2c'; x.beginPath(); x.ellipse(256, 420, 210, 46, 0, 0, Math.PI * 2); x.fill();
    const r = _rng(5207);
    for(let i = 0; i < 46; i++){ const a = r() * Math.PI, rr = 30 + r() * 170; const fx = 256 + Math.cos(a) * rr * (r() < 0.5 ? -1 : 1), fy = 404 + r() * 30;
      x.fillStyle = r() < 0.7 ? '#f2c22c' : '#e0502a'; x.beginPath(); x.arc(fx, fy, 3 + r() * 3, 0, 7); x.fill(); }
    // shield
    x.fillStyle = '#121212'; x.strokeStyle = '#c9a24a'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(176, 150); x.lineTo(336, 150); x.lineTo(336, 270); x.quadraticCurveTo(336, 352, 256, 386); x.quadraticCurveTo(176, 352, 176, 270); x.closePath(); x.fill(); x.stroke();
    // the wavy white Y (the Niger and the Benue meeting)
    x.strokeStyle = '#f2f2ee'; x.lineWidth = 17; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(196, 166); x.bezierCurveTo(208, 190, 226, 196, 236, 222); x.bezierCurveTo(246, 244, 252, 250, 256, 262); x.stroke();
    x.beginPath(); x.moveTo(316, 166); x.bezierCurveTo(304, 190, 286, 196, 276, 222); x.bezierCurveTo(266, 244, 260, 250, 256, 262); x.stroke();
    x.beginPath(); x.moveTo(256, 262); x.bezierCurveTo(250, 290, 262, 318, 256, 360); x.stroke();
    // the eagle on a wreath
    x.fillStyle = '#2f6a2c'; x.fillRect(206, 130, 100, 14); x.fillStyle = '#f2f2ee'; for(let i = 0; i < 5; i++) x.fillRect(206 + i * 20 + (i % 2 ? 0 : 10), 130, 10, 14);
    x.fillStyle = '#c8202a';
    x.beginPath(); x.moveTo(256, 128); x.quadraticCurveTo(212, 96, 196, 58); x.quadraticCurveTo(226, 84, 244, 92); x.quadraticCurveTo(236, 72, 240, 52);
    x.quadraticCurveTo(252, 72, 256, 70); x.quadraticCurveTo(260, 72, 272, 52); x.quadraticCurveTo(276, 72, 268, 92); x.quadraticCurveTo(286, 84, 316, 58);
    x.quadraticCurveTo(300, 96, 256, 128); x.fill();
    x.beginPath(); x.ellipse(256, 66, 9, 12, 0, 0, 7); x.fill(); x.fillStyle = '#f2c22c'; x.beginPath(); x.moveTo(262, 62); x.lineTo(272, 66); x.lineTo(262, 70); x.fill();
    // supporters
    horse(x, 150, 262, 2.0, false); horse(x, 362, 262, 2.0, true);
    // motto scroll
    x.fillStyle = '#f4ead2'; x.strokeStyle = '#8a6a2a'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(84, 452); x.lineTo(428, 452); x.lineTo(440, 470); x.lineTo(428, 488); x.lineTo(84, 488); x.lineTo(72, 470); x.closePath(); x.fill(); x.stroke();
    txt(x, 'UNITY AND FAITH, PEACE AND PROGRESS', 256, 471, serif(17, 'bold'), '#3a2a12');
    x.restore();
  }
  Object.assign(MTEX, {
    ct_signs(){ const W = 1024, H = 1024, [c, x] = _cv(W, H), r = _rng(5201);
      x.fillStyle = '#1a120c'; x.fillRect(0, 0, W, H);
      // arms on a dark plaque
      x.fillStyle = '#2a1a10'; x.fillRect(0, 0, 512, 512); arms(x, 0, 0, 512);
      // name boards
      woodBoard(x, 512, 0, 512, 96, r); txt(x, 'FEDERAL HIGH COURT OF NIGERIA', 768, 50, serif(30), '#e2c06a');
      woodBoard(x, 512, 96, 512, 64, r); txt(x, 'COURT 5  ·  ABUJA JUDICIAL DIVISION', 768, 129, serif(23), '#e2c06a');
      woodBoard(x, 512, 160, 512, 64, r); txt(x, "HON. JUSTICE T. O. BAKARE", 768, 193, serif(25), '#e8cf86');
      x.fillStyle = '#e9e4d6'; x.fillRect(512, 224, 256, 64); x.strokeStyle = '#2a2a2a'; x.lineWidth = 3; x.strokeRect(516, 228, 248, 56); txt(x, 'REGISTRAR', 640, 257, font(30), '#1a1a1a');
      x.fillStyle = '#e9e4d6'; x.fillRect(768, 224, 256, 64); x.strokeRect(772, 228, 248, 56); txt(x, 'WITNESS', 896, 257, font(30), '#1a1a1a');
      // wall clock (10:10)
      x.fillStyle = '#2a2622'; x.fillRect(512, 288, 256, 256); x.fillStyle = '#f6f4ee'; x.beginPath(); x.arc(640, 416, 110, 0, 7); x.fill();
      x.strokeStyle = '#222'; x.lineWidth = 9; x.beginPath(); x.arc(640, 416, 112, 0, 7); x.stroke();
      for(let i = 0; i < 60; i++){ const a = i / 60 * Math.PI * 2, L = i % 5 ? 6 : 16; x.lineWidth = i % 5 ? 2 : 5;
        x.beginPath(); x.moveTo(640 + Math.sin(a) * (100 - L), 416 - Math.cos(a) * (100 - L)); x.lineTo(640 + Math.sin(a) * 100, 416 - Math.cos(a) * 100); x.stroke(); }
      const hand = (a, L, w)=>{ x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(640, 416); x.lineTo(640 + Math.sin(a) * L, 416 - Math.cos(a) * L); x.stroke(); };
      hand((10 + 10 / 60) / 12 * Math.PI * 2, 56, 8); hand(10 / 60 * Math.PI * 2, 84, 5); x.strokeStyle = '#b02020'; hand(38 / 60 * Math.PI * 2, 90, 2);
      // notice
      x.fillStyle = '#efe9d8'; x.fillRect(768, 288, 256, 256); x.strokeStyle = '#7a1414'; x.lineWidth = 6; x.strokeRect(776, 296, 240, 240);
      txt(x, 'SILENCE', 896, 344, font(40), '#7a1414'); txt(x, 'NO PHONES', 896, 404, font(30), '#1a1a1a');
      txt(x, 'RISE WHEN THE', 896, 452, font(22, '600'), '#1a1a1a'); txt(x, 'COURT RISES', 896, 482, font(22, '600'), '#1a1a1a');
      // case files (for desks)
      x.fillStyle = '#c9b48a'; x.fillRect(0, 512, 512, 256);
      for(let i = 0; i < 8; i++){ const fx = 8 + (i % 4) * 126, fy = 520 + Math.floor(i / 4) * 124;
        x.fillStyle = ['#d8c27e', '#b9a06a', '#e2d2a0', '#c8a86a'][i % 4]; x.fillRect(fx, fy, 118, 116);
        x.fillStyle = '#f4eedc'; x.fillRect(fx + 10, fy + 12, 98, 30); txt(x, 'FHC/ABJ/CR/214/2026', fx + 59, fy + 27, font(10, '600'), '#2a2a2a');
        x.strokeStyle = 'rgba(60,40,10,0.35)'; for(let k = 0; k < 6; k++){ x.beginPath(); x.moveTo(fx + 10, fy + 56 + k * 9); x.lineTo(fx + 100, fy + 56 + k * 9); x.stroke(); } }
      // a framed portrait-free notice: "CAUSE LIST"
      x.fillStyle = '#f2eee2'; x.fillRect(512, 544, 512, 224); x.strokeStyle = '#3a3a3a'; x.lineWidth = 4; x.strokeRect(520, 552, 496, 208);
      txt(x, 'CAUSE LIST  ·  COURT 5', 768, 586, font(28), '#1a1a1a');
      const cases = ['FRN v. LUCKY EDAFE & 2 ORS', 'FRN v. B. ADEOLA', 'FRN v. ADEJO-IKIME HAULAGE LTD', 'FRN v. I. MOMOH & 1 OR'];
      cases.forEach((s, i)=>txt(x, `${i + 1}.  ${s}`, 540, 636 + i * 30, font(18, '500'), '#2a2a2a', 'left'));
      N(x, W, H, 16000, 0.035, 5202, 1.2);
      return T(c, false); },
    ct_floor(){ const S = 512, [c, x] = _cv(S, S), r = _rng(5211);
      x.fillStyle = '#c9c2b4'; x.fillRect(0, 0, S, S);
      for(let i = 0; i < 2600; i++){ const b = r(); x.fillStyle = b < 0.35 ? `rgba(70,60,50,${0.35 + r() * 0.4})` : b < 0.7 ? `rgba(240,236,226,${0.4 + r() * 0.4})` : `rgba(150,110,80,${0.3 + r() * 0.3})`;
        x.beginPath(); x.arc(r() * S, r() * S, 0.8 + r() * 2.6, 0, 7); x.fill(); }
      x.fillStyle = 'rgba(80,72,60,0.55)'; for(let i = 0; i <= 2; i++){ x.fillRect(i * 256 - 1.5, 0, 3, S); x.fillRect(0, i * 256 - 1.5, S, 3); }
      N(x, S, S, 9000, 0.05, 5212, 1.5); return T(c, true); },
    ct_carpet(){ const S = 512, [c, x] = _cv(S, S), r = _rng(5221);
      x.fillStyle = '#2c4a34'; x.fillRect(0, 0, S, S);
      for(let i = 0; i < 30000; i++){ x.fillStyle = `rgba(${r() < 0.5 ? 20 : 70},${r() < 0.5 ? 40 : 96},${r() < 0.5 ? 26 : 70},${0.12 + r() * 0.2})`; x.fillRect(r() * S, r() * S, 1.2, 1.2); }
      x.strokeStyle = 'rgba(200,170,90,0.10)'; x.lineWidth = 2; for(let i = 0; i < S; i += 64){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); }
      return T(c, true); },
    ct_window(){ const W = 256, H = 512, [c, x] = _cv(W, H);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6fbff'); g.addColorStop(0.55, '#e4eef6'); g.addColorStop(1, '#cfdbe4'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(120,150,110,0.35)'; x.beginPath(); x.ellipse(70, 470, 120, 50, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(210, 480, 90, 40, 0, 0, 7); x.fill();
      x.fillStyle = '#3a3a38'; x.fillRect(0, 0, W, 10); x.fillRect(0, H - 10, W, 10); x.fillRect(0, 0, 10, H); x.fillRect(W - 10, 0, 10, H); x.fillRect(W / 2 - 5, 0, 10, H); x.fillRect(0, H / 2 - 4, W, 8);
      x.strokeStyle = 'rgba(40,40,40,0.85)'; x.lineWidth = 4; for(let i = 1; i < 6; i++){ x.beginPath(); x.moveTo(i * W / 6, 0); x.lineTo(i * W / 6, H); x.stroke(); }   // burglar bars
      return T(c, false); },
  });
  Object.assign(MDEF, { ct_signs:{ t:'ct_signs' }, ct_floor:{ t:'ct_floor' }, ct_carpet:{ t:'ct_carpet' } });
  Object.assign(MGLOWTEX, { ct_window:{ t:'ct_window', k:1.05 } });
})();
