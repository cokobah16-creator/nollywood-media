/* =========================================================================
   NACECA · v13_mtex_a.js — painted surfaces for the Season 2 night scenes:
   sp_ Sapele waterside night market, cr_ Ethiope creek camp, mt_ Maitama.
   Canvas-made at load (no download cost), same helpers as mtex_v9.
   ========================================================================= */
(function(){
  const N = (x,w,h,a,al,seed,sz)=>_noise(x,w,h,a,al,seed,sz), T = (c,rep)=>_tex(c,rep);
  const txt = (x, s, X, Y, font, col, align)=>{ x.font = font; x.fillStyle = col; x.textAlign = align || 'center'; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); };
  const font = (px, w)=>`${w||'bold'} ${px}px Oswald, Impact, 'Arial Narrow', sans-serif`;
  // text that shrinks to fit its board
  const fit = (x, s, X, Y, maxW, px, col, w, fam)=>{ let f=px; const mk=f=>fam==='hand' ? `bold ${f}px 'Comic Sans MS', 'Trebuchet MS', Verdana, sans-serif` : `${w||'bold'} ${f}px Oswald, Impact, 'Arial Narrow', sans-serif`;
    x.font=mk(f); while(f>8 && x.measureText(s).width>maxW){ f-=1; x.font=mk(f); } x.fillStyle=col; x.textAlign='center'; x.textBaseline='alphabetic'; x.fillText(s,X,Y); };
  const hand = px=>`bold ${px}px 'Comic Sans MS', 'Trebuchet MS', Verdana, sans-serif`;
  // draw f at every wrapped copy of (X,Y) near the tile so repeating textures stay seamless
  const W9 = (S, X, Y, m, f)=>{ for(const dx of [-S,0,S]) for(const dy of [-S,0,S]){ const x=X+dx, y=Y+dy; if(x<-m || x>S+m || y<-m || y>S+m) continue; f(x,y); } };
  const WX = (W, X, m, f)=>{ for(const dx of [-W,0,W]){ const x=X+dx; if(x<-m || x>W+m) continue; f(x); } };
  // weathered paint: vertical streaks and speckle over a rectangle
  const weather = (x, x0, y0, w, h, seed, a)=>{ const r=_rng(seed); a = a || 1;
    for(let i=0;i<Math.floor(w/10);i++){ const X=x0+r()*w; const g=x.createLinearGradient(0,y0,0,y0+h); g.addColorStop(0,'rgba(60,40,20,0)'); g.addColorStop(1,`rgba(60,40,20,${(0.1+r()*0.16)*a})`); x.fillStyle=g; x.fillRect(X,y0+r()*h*0.3,1+r()*3,h*(0.5+r()*0.5)); }
    for(let i=0;i<w*h/60;i++){ x.fillStyle=`rgba(${r()<0.5?0:255},${r()<0.5?0:255},${r()<0.5?0:255},${0.05*a*r()})`; x.fillRect(x0+r()*w, y0+r()*h, 1.5, 1.5); } };
  const board = (x, x0, y0, w, h, bg, border)=>{ x.fillStyle=bg; x.fillRect(x0,y0,w,h); if(border){ x.strokeStyle=border; x.lineWidth=Math.max(3,h*0.05); x.strokeRect(x0+h*0.06,y0+h*0.06,w-h*0.12,h-h*0.12); } };
  // night sky shared by the panoramas: gradient + stars (+ optional moon)
  const nightSky = (x, W, HZ, top, mid, low, seed, stars)=>{ const r=_rng(seed);
    const g=x.createLinearGradient(0,0,0,HZ); g.addColorStop(0,top); g.addColorStop(0.62,mid); g.addColorStop(1,low); x.fillStyle=g; x.fillRect(0,0,W,HZ+2);
    for(let i=0;i<(stars||600);i++){ const X=r()*W, Y=Math.pow(r(),1.4)*HZ*0.8, a=r(); x.fillStyle=`rgba(${225+r()*30|0},${230+r()*25|0},255,${0.2+a*0.65})`; const s=a<0.93?1.1:2; x.fillRect(X,Y,s,s); } };
  const moon = (x, W, MX, MY, R, glow)=>{ for(const ox of [-W,0,W]){ const cx=MX+ox; if(cx<-R*8||cx>W+R*8) continue;
      let rg=x.createRadialGradient(cx,MY,R*0.6,cx,MY,R*glow); rg.addColorStop(0,'rgba(200,215,255,0.42)'); rg.addColorStop(0.35,'rgba(150,170,230,0.14)'); rg.addColorStop(1,'rgba(120,140,210,0)'); x.fillStyle=rg; x.fillRect(cx-R*glow,MY-R*glow,R*glow*2,R*glow*2);
      x.fillStyle='#f2f4ff'; x.beginPath(); x.arc(cx,MY,R,0,7); x.fill();
      x.fillStyle='rgba(170,180,205,0.55)'; for(const [dx,dy,rr] of [[-0.3,-0.2,0.28],[0.25,0.25,0.2],[0.1,-0.35,0.14],[-0.15,0.35,0.12]]){ x.beginPath(); x.arc(cx+dx*R,MY+dy*R,rr*R,0,7); x.fill(); } } };
  const clouds = (x, W, n, y0, y1, col, seed)=>{ const r=_rng(seed);
    for(let i=0;i<n;i++){ const X=r()*W, Y=y0+r()*(y1-y0), w=60+r()*220, h=3+r()*8, a=0.12+r()*0.22; WX(W,X,w,px=>{ x.fillStyle=col(a); x.beginPath(); x.ellipse(px,Y,w,h,0,0,7); x.fill(); }); } };

  Object.assign(MTEX, {
    /* ============ SAPELE · waterside night market ============ */
    sp_mud(){ const S=512,[c,x]=_cv(S,S), r=_rng(3101); x.fillStyle='#4c3d2f'; x.fillRect(0,0,S,S);
      const soft=(X,Y,R,col)=>W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0,col); g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)')); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); });
      for(let i=0;i<90;i++){ const X=r()*S, Y=r()*S, R=18+r()*70, k=r();
        soft(X,Y,R, k<0.4 ? `rgba(24,19,15,${0.25+r()*0.25})` : k<0.75 ? `rgba(${118+r()*30|0},${92+r()*24|0},${64+r()*16|0},${0.18+r()*0.18})` : `rgba(${70+r()*20|0},${66+r()*16|0},${58+r()*10|0},${0.2+r()*0.2})`); }
      N(x,S,S,40000,0.10,3102,1.5); N(x,S,S,2500,0.06,3103,5);
      for(let i=0;i<26;i++){ const X=r()*S, Y=r()*S, a=r()*6.28; W9(S,X,Y,14,(px,py)=>{ x.save(); x.translate(px,py); x.rotate(a); x.fillStyle='rgba(20,15,12,0.32)'; x.beginPath(); x.ellipse(0,0,3.2,7.5,0,0,7); x.fill(); x.fillStyle='rgba(150,130,110,0.10)'; x.beginPath(); x.ellipse(-0.8,-0.8,2.2,6,0,0,7); x.fill(); x.restore(); }); }
      for(let i=0;i<320;i++){ const X=r()*S, Y=r()*S, w=1.5+r()*2.5, h=1+r()*2, col=`rgba(${150+r()*80|0},${140+r()*70|0},${120+r()*60|0},${0.25+r()*0.35})`; x.fillStyle=col; x.fillRect(X,Y,w,h); }
      for(let i=0;i<220;i++){ x.fillStyle=`rgba(200,215,235,${0.12+r()*0.25})`; x.fillRect(r()*S,r()*S,1.2,1.2); }
      return T(c,true); },
    sp_asphalt(){ const S=512,[c,x]=_cv(S,S), r=_rng(3111); x.fillStyle='#3e3d3c'; x.fillRect(0,0,S,S); N(x,S,S,60000,0.12,3112,1.2);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, R=16+r()*60, dark=r()<0.6, al=dark?0.10+r()*0.12:0.06+r()*0.08;
        W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0, dark?`rgba(16,16,18,${al})`:`rgba(150,132,104,${al})`); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); }); }
      // patched repairs: irregular, only slightly darker
      for(let i=0;i<3;i++){ const X=r()*S, Y=r()*S, pts=[]; const n=6, R0=26+r()*40; for(let k=0;k<n;k++){ const a=k/n*6.28+r()*0.5, rr=R0*(0.7+r()*0.5); pts.push([Math.cos(a)*rr, Math.sin(a)*rr*0.8]); }
        const b=44+r()*8|0; W9(S,X,Y,R0*1.3,(px,py)=>{ x.fillStyle=`rgba(${b},${b},${b+2},0.75)`; x.beginPath(); pts.forEach((p,k)=>k?x.lineTo(px+p[0],py+p[1]):x.moveTo(px+p[0],py+p[1])); x.closePath(); x.fill(); x.strokeStyle='rgba(18,18,18,0.35)'; x.lineWidth=1.2; x.stroke(); }); }
      for(let i=0;i<3;i++){ const X=r()*S, Y=r()*S, a=4+r()*7, rot=r()*3; W9(S,X,Y,a+4,(px,py)=>{ x.fillStyle='rgba(14,13,12,0.6)'; x.beginPath(); x.ellipse(px,py,a,a*0.7,rot,0,7); x.fill(); x.strokeStyle='rgba(120,110,95,0.3)'; x.lineWidth=1; x.stroke(); }); }
      x.strokeStyle='rgba(16,16,16,0.32)'; x.lineWidth=1; for(let i=0;i<8;i++){ let px=40+r()*(S-80),py=40+r()*(S-80); x.beginPath(); x.moveTo(px,py); for(let k=0;k<7;k++){ px+=(r()-0.5)*30; py+=(r()-0.5)*30; x.lineTo(px,py);} x.stroke(); }
      for(let i=0;i<400;i++){ x.fillStyle=`rgba(${r()<0.5?170:25},${r()<0.5?165:25},${r()<0.5?150:25},${0.12+r()*0.2})`; x.fillRect(r()*S,r()*S,1+r()*2,1+r()*2); }
      return T(c,true); },
    sp_river(){ const S=512,[c,x]=_cv(S,S), r=_rng(3121); x.fillStyle='#0a1419'; x.fillRect(0,0,S,S);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, a=50+r()*130, b=8+r()*18, col = r()<0.5 ? `rgba(26,44,54,${0.14+r()*0.18})` : `rgba(4,8,10,${0.18+r()*0.22})`; W9(S,X,Y,a,(px,py)=>{ x.fillStyle=col; x.beginPath(); x.ellipse(px,py,a,b,0,0,7); x.fill(); }); }
      // ripple crests: short soft horizontal strokes, moon-blue; very few warm glints
      for(let i=0;i<900;i++){ const X=r()*S, Y=r()*S, L=8+r()*30, warm=r()<0.02, a=warm?0.25+r()*0.3:0.06+r()*0.16, bend=1.5+r()*2, lw=0.8+r()*1.2;
        const col = warm ? `rgba(255,${170+r()*50|0},${90+r()*40|0},${a})` : `rgba(${110+r()*60|0},${140+r()*60|0},${170+r()*50|0},${a})`;
        W9(S,X,Y,L,(px,py)=>{ x.strokeStyle=col; x.lineWidth=lw; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+L/2,py-bend,px+L,py); x.stroke(); }); }
      N(x,S,S,8000,0.04,3122,1.5);
      return T(c,true); },
    sp_panoRiver(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(3131), HZ=440, MX=W*0.62;
      nightSky(x, W, HZ, '#060a16', '#0e1830', '#24304a', 3132, 700);
      // faint glow of the far bank town on the horizon
      for(const [cx, s] of [[W*0.28, 1.0], [W*0.78, 0.7]]) WX(W, cx, 500, px=>{ x.save(); x.translate(px,HZ); x.scale(3.0,1); const rg=x.createRadialGradient(0,0,4,0,0,170); rg.addColorStop(0,`rgba(210,130,70,${0.42*s})`); rg.addColorStop(1,'rgba(210,130,70,0)'); x.fillStyle=rg; x.fillRect(-180,-170,360,180); x.restore(); });
      clouds(x, W, 14, 120, 330, a=>`rgba(110,125,165,${a*0.8})`, 3133);
      moon(x, W, MX, 120, 17, 7);
      // far bank: low bush line, a few palms, houses with lights, a sawmill stack, masts
      const ry = X=>HZ-10+5*Math.sin(X*0.006)+3*Math.sin(X*0.021+1.3)+2*Math.sin(X*0.07);
      x.fillStyle='#070a10'; x.beginPath(); x.moveTo(0,HZ+12); for(let X=0;X<=W;X+=6) x.lineTo(X,ry(X)); x.lineTo(W,HZ+12); x.closePath(); x.fill();
      for(let i=0;i<70;i++){ const X=r()*W, R=6+r()*14; WX(W,X,R,px=>{ x.fillStyle='#06090e'; x.beginPath(); x.arc(px,ry(px)+3,R,Math.PI,0); x.fill(); }); }
      let px=40; while(px<W-40){ const w=14+r()*40, h=6+r()*14, top=ry(px)-h+4; x.fillStyle='#080b12'; x.fillRect(px,top,w,HZ+12-top); x.beginPath(); x.moveTo(px-3,top); x.lineTo(px+w/2,top-5-r()*4); x.lineTo(px+w+3,top); x.fill();
        if(r()<0.6){ const n=1+(r()*3|0); for(let k=0;k<n;k++){ const warm=r()<0.8; x.fillStyle= warm?`rgba(255,${180+r()*50|0},${100+r()*50|0},${0.7+r()*0.3})`:`rgba(190,215,255,${0.6+r()*0.3})`; x.fillRect(px+3+r()*(w-6),top+3+r()*(h-5),2.5,2.5); } }
        px += w + 10 + r()*70; }
      for(let i=0;i<12;i++){ const X=r()*W, y=ry(X); WX(W,X,40,p=>{ x.strokeStyle='#05070b'; x.lineWidth=2; x.beginPath(); x.moveTo(p,y); x.lineTo(p+(r()-0.5)*6,y-26-r()*14); x.stroke(); for(let k=0;k<7;k++){ const a=k/7*6.28; x.fillStyle='#05070b'; x.beginPath(); x.ellipse(p+Math.cos(a)*9,y-34+Math.sin(a)*3.5,10,2.6,a,0,7); x.fill(); } }); }
      // the old sawmill: a long shed, a chimney stack with a red light
      const SX=W*0.17; x.fillStyle='#080b11'; x.fillRect(SX-60,HZ-30,150,30); x.fillRect(SX+20,HZ-78,10,50); x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(SX+25,HZ-80,2.4,0,7); x.fill();
      for(let k=0;k<6;k++){ x.fillStyle='rgba(255,200,130,0.85)'; x.fillRect(SX-54+k*24,HZ-14,3,2.5); }
      for(const MXx of [W*0.44, W*0.93]){ x.strokeStyle='#06080d'; x.lineWidth=1.6; x.beginPath(); x.moveTo(MXx-5,ry(MXx)); x.lineTo(MXx,HZ-120); x.lineTo(MXx+5,ry(MXx)); x.stroke(); x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(MXx,HZ-122,2.4,0,7); x.fill(); }
      // water in front of the far bank: dark, with the lights' reflections and the moon path
      const wg=x.createLinearGradient(0,HZ+4,0,H); wg.addColorStop(0,'#0e1622'); wg.addColorStop(1,'#0a1218'); x.fillStyle=wg; x.fillRect(0,HZ+6,W,H-HZ-6);
      x.fillStyle='#070a10'; x.fillRect(0,HZ+4,W,4);
      for(let i=0;i<180;i++){ const X=MX+(r()-0.5)*(40+r()*80), Y=HZ+8+r()*(H-HZ-10), L=4+r()*18; x.fillStyle=`rgba(210,222,255,${0.15+r()*0.45})`; x.fillRect(X-L/2,Y,L,1.4); }
      for(let i=0;i<260;i++){ const X=r()*W, Y=HZ+8+r()*24, warm=r()<0.75; x.fillStyle= warm?`rgba(255,${170+r()*50|0},${90+r()*40|0},${0.12+r()*0.3})`:`rgba(170,200,255,${0.1+r()*0.25})`; x.fillRect(X,Y,1.5,2+r()*6); }
      return T(c,false); },
    sp_panoTown(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(3141), HZ=448;
      nightSky(x, W, HZ, '#060a16', '#0e1830', '#2a3048', 3142, 650);
      WX(W, W*0.5, 600, px=>{ x.save(); x.translate(px,HZ); x.scale(3.4,1); const rg=x.createRadialGradient(0,0,4,0,0,200); rg.addColorStop(0,'rgba(220,130,60,0.5)'); rg.addColorStop(1,'rgba(220,130,60,0)'); x.fillStyle=rg; x.fillRect(-200,-200,400,210); x.restore(); });
      clouds(x, W, 10, 150, 330, a=>`rgba(110,120,160,${a*0.7})`, 3143);
      for(let layer=0;layer<2;layer++){ let px=0; const col=layer?'#05070c':'#0b111e';
        while(px<W){ const w=30+r()*90, h=(layer?30:18)*(0.6+r()), top=HZ-h+(layer?6:-6);
          x.fillStyle=col; x.beginPath(); x.moveTo(px,HZ+10); x.lineTo(px,top+6); x.lineTo(px+w*0.5,top-5); x.lineTo(px+w,top+6); x.lineTo(px+w,HZ+10); x.fill();
          if(r()<0.16){ x.fillRect(px+w*0.3,top-22,3,20); x.fillRect(px+w*0.3-8,top-32,19,11); }
          if(layer && r()<0.65){ const n=1+(r()*3|0); for(let k=0;k<n;k++){ const warm=r()<0.8; x.fillStyle= warm?`rgba(255,${180+r()*60|0},${100+r()*40|0},${0.7+r()*0.3})`:`rgba(180,210,255,${0.6+r()*0.3})`; x.fillRect(px+5+r()*(w-10),top+9+r()*(h-12),3,3); } x.fillStyle=col; }
          px+=w+r()*8; } }
      for(let i=0;i<36;i++){ const X=r()*W, y=HZ-6-r()*10, R=9+r()*16; WX(W,X,R,p=>{ x.fillStyle='#04060a'; x.beginPath(); x.arc(p,y,R,0,7); x.fill(); }); }
      for(let i=0;i<10;i++){ const X=r()*W, y=HZ-4; WX(W,X,40,p=>{ x.strokeStyle='#04060a'; x.lineWidth=2.2; x.beginPath(); x.moveTo(p,y); x.lineTo(p+(r()-0.5)*8,y-40-r()*18); x.stroke(); for(let k=0;k<7;k++){ const a=k/7*6.28; x.fillStyle='#04060a'; x.beginPath(); x.ellipse(p+Math.cos(a)*11,y-50+Math.sin(a)*4,12,3,a,0,7); x.fill(); } }); }
      for(const PX of [W*0.21, W*0.66, W*0.86]){ x.strokeStyle='#04060a'; x.lineWidth=2; x.beginPath(); x.moveTo(PX-5,HZ); x.lineTo(PX,HZ-118); x.lineTo(PX+5,HZ); x.stroke(); x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(PX,HZ-120,2.6,0,7); x.fill(); }
      x.fillStyle='#04060a'; x.fillRect(0,HZ+8,W,H-HZ-8);
      return T(c,false); },
    sp_signs(){ const W=1024,H=1024,[c,x]=_cv(W,H), r=_rng(3151); x.fillStyle='#2a2a2c'; x.fillRect(0,0,W,H);
      // row 0 (y 0..128): MAMA KARO board (512x128) + jetty board (512x128)
      board(x,0,0,512,128,'#1f5a34','#e8dcb0');
      fit(x,'MAMA KARO',256,64,380,56,'#f4e6b8'); fit(x,'HERBS  &  ROOTS',256,106,360,30,'#f0c860','600');
      for(const [lx,ly,sg] of [[44,64,1],[468,64,-1]]){ x.save(); x.translate(lx,ly); x.scale(sg,1); x.strokeStyle='#9ad070'; x.fillStyle='#7ab858'; x.lineWidth=3; x.beginPath(); x.moveTo(-10,30); x.quadraticCurveTo(0,0,4,-34); x.stroke(); for(let k=0;k<4;k++){ x.beginPath(); x.ellipse(-2+k*1.5,18-k*15,10,4,-0.6,0,7); x.fill(); x.beginPath(); x.ellipse(8+k*1.5,10-k*15,10,4,0.6,0,7); x.fill(); } x.restore(); }
      weather(x,0,0,512,128,3152,0.8);
      board(x,512,0,512,128,'#e8e2d2','#1d3a6a'); fit(x,'WATERSIDE JETTY',768,68,440,52,'#1d3a6a'); fit(x,'BOATS · FISH · NO LOITERING AFTER 11PM',768,106,440,24,'#a01818','600'); weather(x,512,0,512,128,3153,0.9);
      // row 1 (y 128..256): four POS boards 256x128 each
      const pos=[['T1','#f0c020','#141414','#1a4aa0'],['T2','#1a6a3a','#ffffff','#f0c020'],['T3','#c8382a','#fff4d0','#ffffff'],['T4','#1a4aa0','#ffffff','#f0c020']];
      pos.forEach(([n,bg,fg,ac],i)=>{ const X=i*256, Y=128; board(x,X,Y,256,128,bg,fg); fit(x,'POS',X+96,Y+82,130,72,fg); fit(x,n,X+200,Y+82,70,50,ac);
        fit(x,'CASH OUT · TRANSFER · AIRTIME',X+128,Y+112,220,17,fg,'600'); weather(x,X,Y,256,128,3160+i,0.8); });
      // row 2 (y 256..384): buka board 512x128 + charging board 512x128
      board(x,0,256,512,128,'#f2ead6','#b02a20'); fit(x,'MAMA TEGA KITCHEN',256,320,440,52,'#b02a20'); fit(x,'BOLE · FISH · PEPPER SOUP · RICE',256,362,440,26,'#1d3a6a','600'); weather(x,0,256,512,128,3170,0.8);
      board(x,512,256,512,128,'#141414','#f0c020'); fit(x,'PHONE CHARGING',768,324,440,54,'#f0c020'); fit(x,'₦100 · ALL PHONES · SAFE',768,362,440,28,'#ffffff','600'); weather(x,512,256,512,128,3171,0.6);
      // row 3 (y 384..512): fuel board 256x128, esusu 256x128, banner 512x128
      board(x,0,384,256,128,'#e8d050','#1a1a1a'); fit(x,'FUEL',128,438,200,44,'#a01818',null,'hand'); fit(x,'KERO · 2T OIL',128,470,210,22,'#1a1a1a',null,'hand'); fit(x,'₦ PER LITRE',128,498,210,20,'#1a1a1a',null,'hand'); weather(x,0,384,256,128,3172,1);
      board(x,256,384,256,128,'#e6e2da','#2a5a2a'); fit(x,'DAILY ESUSU',384,436,210,30,'#2a5a2a',null,'hand'); fit(x,'SAVE SMALL SMALL',384,470,210,20,'#1a1a1a',null,'hand'); fit(x,'PAY OUT EVERY MONTH',384,496,210,20,'#1a1a1a',null,'hand'); weather(x,256,384,256,128,3173,1);
      x.fillStyle='#1d3a6a'; x.fillRect(512,384,512,128); x.fillStyle='#f0c020'; x.fillRect(512,384,512,10); x.fillRect(512,502,512,10);
      fit(x,'SAPELE WATERSIDE NIGHT MARKET',768,458,470,40,'#ffffff'); fit(x,'WELCOME · BUY · SELL · GOD DEY',768,492,440,20,'#f0c020','600'); weather(x,512,384,512,128,3174,0.5);
      // rows 4-11 (y 512..1024): sixteen shop signs 512x64
      const shops=[['OGHENE TEGA PROVISIONS','#c8382a','#fff4d0'],['IGHO & SONS ELECTRICALS','#1a4aa0','#ffffff'],['OVIE PHONE WORLD','#f0c020','#1a1a1a'],['DIVINE MERCY PATENT MEDICINE','#e8e8e0','#1a6a2a'],
                   ['JEHOVAH JIREH FABRICS','#8a2a8a','#ffffff'],['NO SHAKING BARBING SALON','#141414','#f0c040'],['ETHIOPE BOAT ENGINE SPARES','#1a6a6a','#ffffff'],['GOD’S TIME PLASTICS','#e0d0a0','#5a2a1a'],
                   ['ONOME COLD ROOM · FROZEN FISH','#2a4a8a','#ffffff'],['BLESSED HANDS TAILORING','#f2efe6','#a01818'],['UNITY PHARMACY & STORE','#1d6a3a','#ffffff'],['OKIEMUTE HOTEL · BAR','#3a1a1a','#ffd27a'],
                   ['CLEAR DROP PURE WATER','#3a8ad0','#ffffff'],['ROTIMI BOOKS & STATIONERY','#e8a830','#1a1a1a'],['BRIGHT FUTURE SCHOOL · ADMISSION','#f2f0ea','#1d3a8a'],['TOP STAR MUSIC & DVD','#141414','#40d0ff']];
      shops.forEach(([sg,bg,fg],i)=>{ const X=(i%2)*512, Y=512+(i>>1)*64; x.fillStyle=bg; x.fillRect(X,Y,512,64); x.strokeStyle='rgba(0,0,0,0.35)'; x.lineWidth=3; x.strokeRect(X+2,Y+2,508,60);
        fit(x,sg,X+256,Y+46,470,36,fg); weather(x,X,Y,512,64,3180+i,0.9); });
      return T(c,false); },
    sp_bottles(){ const W=512,H=128,[c,x]=_cv(W,H), r=_rng(3191);
      const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1e1610'); g.addColorStop(1,'#3a2a1c'); x.fillStyle=g; x.fillRect(0,0,W,H);
      const cols=['#8a4a0e','#a0580e','#6a3a0a','#1e4a24','#2a5a2a','#4a3010','#7a6a2a','#5a2a0a','#2a3a1a'];
      let px=4; while(px<W-10){ const w=14+r()*12, h=56+r()*56, col=cols[(r()*cols.length)|0], neck=r()<0.7, top=H-6-h;
        x.fillStyle=col; x.fillRect(px,top+(neck?h*0.3:0),w,h-(neck?h*0.3:0));
        if(neck){ x.beginPath(); x.moveTo(px,top+h*0.3); x.quadraticCurveTo(px+w*0.1,top+h*0.12,px+w*0.32,top+h*0.1); x.lineTo(px+w*0.68,top+h*0.1); x.quadraticCurveTo(px+w*0.9,top+h*0.12,px+w,top+h*0.3); x.fill(); x.fillRect(px+w*0.32,top,w*0.36,h*0.12); }
        x.fillStyle=r()<0.5?'#e8e0c8':'#c83a2a'; x.fillRect(px+w*0.3,top-2,w*0.4,4);
        if(r()<0.75){ x.fillStyle=r()<0.6?'rgba(236,228,200,0.85)':'rgba(240,200,80,0.85)'; x.fillRect(px+1,top+h*0.5,w-2,h*0.26); x.fillStyle='rgba(60,40,20,0.6)'; x.fillRect(px+3,top+h*0.56,w-6,2); x.fillRect(px+3,top+h*0.62,(w-6)*0.7,2); }
        x.fillStyle='rgba(255,240,210,0.28)'; x.fillRect(px+w*0.18,top+h*0.32,2.2,h*0.6);
        x.fillStyle='rgba(0,0,0,0.25)'; x.fillRect(px+w-3,top+h*0.3,3,h*0.7);
        px+=w+2+r()*5; }
      x.fillStyle='#4a3020'; x.fillRect(0,H-6,W,6); x.fillStyle='rgba(0,0,0,0.4)'; x.fillRect(0,H-7,W,1);
      return T(c,true); },
    sp_phones(){ const W=512,H=256,[c,x]=_cv(W,H), r=_rng(3201); x.fillStyle='#d8d0bc'; x.fillRect(0,0,W,H);
      x.fillStyle='rgba(60,50,40,0.35)'; for(let yy=8;yy<H;yy+=16) for(let xx=8;xx<W;xx+=16){ x.beginPath(); x.arc(xx,yy,1.6,0,7); x.fill(); }
      const cols=['#1a1a1a','#e8e8e8','#e83a3a','#3a6ae8','#f0c830','#38c070','#e070c0','#8a4ae8'];
      for(let row=0; row<4; row++){ let px=10; const y0=10+row*62;
        while(px<W-40){ const kind=r(), w=kind<0.5?30:kind<0.8?40:26, h=kind<0.5?52:kind<0.8?44:50;
          x.fillStyle='rgba(0,0,0,0.25)'; x.fillRect(px+3,y0+4,w,h);
          x.fillStyle='rgba(235,240,245,0.9)'; x.fillRect(px,y0,w,h);                       // blister pack
          const col=cols[(r()*cols.length)|0];
          if(kind<0.5){ x.fillStyle=col; x.beginPath(); x.roundRect ? x.roundRect(px+4,y0+6,w-8,h-12,5) : x.rect(px+4,y0+6,w-8,h-12); x.fill(); x.fillStyle='rgba(20,20,20,0.85)'; x.fillRect(px+7,y0+9,7,9); }
          else if(kind<0.8){ x.fillStyle='#f4f4f0'; x.fillRect(px+6,y0+8,w-12,h-20); x.fillStyle='#1a1a1a'; x.fillRect(px+w/2-2,y0+h-12,4,6); x.strokeStyle='#e8e8e8'; x.lineWidth=2; x.beginPath(); x.moveTo(px+w/2,y0+h-10); x.quadraticCurveTo(px+w+4,y0+h,px+w/2,y0+h+8); x.stroke(); }
          else { x.strokeStyle=col; x.lineWidth=2; x.beginPath(); x.arc(px+w/2,y0+h*0.45,9,0.3,2.8); x.stroke(); x.fillStyle=col; x.beginPath(); x.arc(px+w/2-8,y0+h*0.62,3,0,7); x.fill(); x.beginPath(); x.arc(px+w/2+8,y0+h*0.62,3,0,7); x.fill(); }
          x.fillStyle='#c83a2a'; x.fillRect(px,y0,w,6); x.fillStyle='#2a2a2a'; x.beginPath(); x.arc(px+w/2,y0+3,1.8,0,7); x.fill();
          px+=w+6+r()*6; } }
      N(x,W,H,4000,0.05,3202,1.5);
      return T(c,false); },
    sp_puddle(){ const W=1024,H=256,[c,x]=_cv(W,H), r=_rng(3211); x.clearRect(0,0,W,H);
      // four soft-edged puddle shapes side by side (u 0..0.25 each): dark water, sky sheen, a few glints
      for(let p=0;p<4;p++){ const X0=p*256, cx=X0+128, cy=128, f1=r()*6, f2=r()*6, f3=r()*6;
        const [m,mx]=_cv(256,256); const path=()=>{ mx.beginPath(); for(let i=0;i<=64;i++){ const a=i/64*6.283, k=0.72+0.13*Math.sin(2*a+f1)+0.09*Math.sin(3*a+f2)+0.04*Math.sin(5*a+f3); const px=128+Math.cos(a)*112*k, py=128+Math.sin(a)*92*k; i?mx.lineTo(px,py):mx.moveTo(px,py); } mx.closePath(); };
        mx.filter='blur(7px)'; path(); mx.fillStyle='#fff'; mx.fill(); mx.filter='none';
        mx.globalCompositeOperation='source-in';
        const g=mx.createRadialGradient(128,128,10,128,128,128); g.addColorStop(0,'rgba(12,18,28,0.92)'); g.addColorStop(0.7,'rgba(20,28,42,0.85)'); g.addColorStop(1,'rgba(44,56,76,0.6)'); mx.fillStyle=g; mx.fillRect(0,0,256,256);
        mx.globalCompositeOperation='source-atop';
        for(let i=0;i<5;i++){ const X=40+r()*176, Y=40+r()*176, R=20+r()*40, al=0.12+r()*0.14; const gg=mx.createRadialGradient(X,Y,0,X,Y,R); gg.addColorStop(0,`rgba(90,110,150,${al})`); gg.addColorStop(1,'rgba(90,110,150,0)'); mx.fillStyle=gg; mx.fillRect(X-R,Y-R,R*2,R*2); }
        for(let i=0;i<7;i++){ const X=60+r()*120, Y=70+r()*110, L=10+r()*26, warm=r()<0.5; mx.strokeStyle= warm?`rgba(255,${190+r()*40|0},${120+r()*40|0},${0.3+r()*0.3})`:`rgba(190,210,255,${0.22+r()*0.25})`; mx.lineWidth=1+r()*1.4; mx.beginPath(); mx.moveTo(X,Y); mx.lineTo(X+L,Y+(r()-0.5)*2); mx.stroke(); }
        x.drawImage(m, X0, 0); }
      return T(c,false); },

    /* ============ CREEK · kpo-fire camp in the Ethiope creeks ============ */
    cr_mud(){ const S=512,[c,x]=_cv(S,S), r=_rng(3301); x.fillStyle='#62564a'; x.fillRect(0,0,S,S);
      for(let i=0;i<80;i++){ const X=r()*S, Y=r()*S, R=16+r()*70, k=r(), al=0.16+r()*0.24;
        const col = k<0.4 ? `rgba(16,14,12,${al*0.8})` : k<0.75 ? `rgba(${120+r()*24|0},${106+r()*18|0},${88+r()*14|0},${al*0.8})` : `rgba(${60+r()*12|0},${54+r()*10|0},${48+r()*10|0},${al})`;
        W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0,col); g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)')); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); }); }
      N(x,S,S,42000,0.10,3302,1.5); N(x,S,S,2600,0.06,3303,5);
      for(let i=0;i<30;i++){ const X=r()*S, Y=r()*S, a=r()*6.28; W9(S,X,Y,14,(px,py)=>{ x.save(); x.translate(px,py); x.rotate(a); x.fillStyle='rgba(8,7,6,0.4)'; x.beginPath(); x.ellipse(0,0,3.4,8,0,0,7); x.fill(); x.restore(); }); }
      for(let i=0;i<7;i++){ const X=r()*S, Y=r()*S, R=26+r()*40, hue=r()*360, sx=1.6+r(), rot=r()*3; W9(S,X,Y,R*sx,(px,py)=>{ x.save(); x.translate(px,py); x.rotate(rot); x.scale(sx,1); const g=x.createRadialGradient(0,0,0,0,0,R); g.addColorStop(0,'rgba(5,5,6,0.55)'); g.addColorStop(0.75,`hsla(${hue},22%,22%,0.12)`); g.addColorStop(1,'rgba(5,5,6,0)'); x.fillStyle=g; x.fillRect(-R,-R,R*2,R*2); x.restore(); }); }
      for(let i=0;i<260;i++){ x.fillStyle=`rgba(${120+r()*60|0},${110+r()*50|0},${90+r()*40|0},${0.2+r()*0.3})`; x.fillRect(r()*S,r()*S,1+r()*2.5,1+r()*2); }
      for(let i=0;i<40;i++){ x.fillStyle=`rgba(${110+r()*40|0},${50+r()*20|0},${20+r()*10|0},${0.35+r()*0.3})`; x.fillRect(r()*S,r()*S,2+r()*5,1+r()*3); }   // rust flakes
      return T(c,true); },
    cr_water(){ const S=512,[c,x]=_cv(S,S), r=_rng(3311); x.fillStyle='#07090a'; x.fillRect(0,0,S,S);
      for(let i=0;i<34;i++){ const X=r()*S, Y=r()*S, a=50+r()*130, b=10+r()*24, col = r()<0.5 ? `rgba(22,28,30,${0.2+r()*0.2})` : `rgba(2,3,4,${0.25+r()*0.25})`; W9(S,X,Y,a,(px,py)=>{ x.fillStyle=col; x.beginPath(); x.ellipse(px,py,a,b,0,0,7); x.fill(); }); }
      // oil sheen: iridescent bands (purple / teal / amber) along slow curves
      for(let i=0;i<7;i++){ let X=r()*S, Y=r()*S; const L=10+(r()*10|0), hue0=r()*360;
        for(let k=0;k<L;k++){ const R=14+r()*22, nx=X+8+r()*14, ny=Y+(r()-0.5)*8, hue=(hue0+k*18)%360, al=0.022+r()*0.028;
          W9(S,nx,ny,R*2.2,(px,py)=>{ x.save(); x.translate(px,py); x.scale(2.2,0.7); const g=x.createRadialGradient(0,0,0,0,0,R); g.addColorStop(0,`hsla(${hue},40%,42%,${al})`); g.addColorStop(1,`hsla(${hue},40%,42%,0)`); x.fillStyle=g; x.fillRect(-R,-R,R*2,R*2); x.restore(); }); X=nx; Y=ny; } }
      for(let i=0;i<420;i++){ const X=r()*S, Y=r()*S, L=8+r()*24, a=0.03+r()*0.08, lw=0.8+r()*1.0, bend=1+r()*2, col=`rgba(${100+r()*60|0},${120+r()*60|0},${150+r()*50|0},${a})`;
        W9(S,X,Y,L,(px,py)=>{ x.strokeStyle=col; x.lineWidth=lw; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+L/2,py-bend,px+L,py); x.stroke(); }); }
      N(x,S,S,7000,0.04,3312,1.5);
      return T(c,true); },
    cr_crude(){ const S=256,[c,x]=_cv(S,S), r=_rng(3321); x.fillStyle='#050505'; x.fillRect(0,0,S,S);
      for(let i=0;i<8;i++){ const X=r()*S, Y=r()*S, R=20+r()*50, hue=200+r()*120, al=0.04+r()*0.04; W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0,`hsla(${hue},35%,40%,${al})`); g.addColorStop(1,`hsla(${hue},35%,40%,0)`); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); }); }
      for(let i=0;i<34;i++){ const X=r()*S, Y=r()*S, L=8+r()*30, warm=r()<0.6, a=0.08+r()*0.2, lw=0.8+r()*1.2, col= warm?`rgba(255,${130+r()*60|0},${50+r()*30|0},${a})`:`rgba(150,170,210,${a*0.7})`;
        W9(S,X,Y,L,(px,py)=>{ x.strokeStyle=col; x.lineWidth=lw; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+L/2,py-1.5,px+L,py); x.stroke(); }); }
      return T(c,true); },
    cr_rust(){ const S=512,[c,x]=_cv(S,S), r=_rng(3331); x.fillStyle='#4a3a32'; x.fillRect(0,0,S,S);
      for(let i=0;i<70;i++){ const X=r()*S, Y=r()*S, R=12+r()*70, k=r(), al=0.2+r()*0.3; const col = k<0.5 ? `rgba(${130+r()*50|0},${58+r()*26|0},${24+r()*12|0},${al})` : k<0.8 ? `rgba(${40+r()*20|0},${42+r()*20|0},${44+r()*20|0},${al})` : `rgba(${160+r()*40|0},${90+r()*30|0},${40+r()*20|0},${al*0.7})`;
        W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0,col); g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)')); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); }); }
      N(x,S,S,30000,0.10,3332,1.5);
      for(let i=0;i<60;i++){ const X=r()*S, Y0=r()*S*0.6, L=40+r()*200; const g=x.createLinearGradient(0,Y0,0,Y0+L); g.addColorStop(0,`rgba(${120+r()*40|0},${50+r()*20|0},20,${0.25+r()*0.25})`); g.addColorStop(1,'rgba(120,50,20,0)'); x.fillStyle=g; x.fillRect(X,Y0,1.5+r()*4,L); }
      x.fillStyle='rgba(20,16,14,0.55)'; for(let k=0;k<=4;k++){ x.fillRect(0,k*128-1.5,S,3); } for(let k=0;k<=2;k++){ x.fillRect(k*256-1.5,0,3,S); }
      x.fillStyle='rgba(30,24,20,0.7)'; for(let k=0;k<=4;k++) for(let X=8;X<S;X+=24){ x.beginPath(); x.arc(X,k*128+6,2,0,7); x.fill(); }
      return T(c,true); },
    cr_signs(){ const W=1024,H=512,[c,x]=_cv(W,H), r=_rng(3341); x.fillStyle='#3a2a22'; x.fillRect(0,0,W,H);
      // row 0 (0..256): hull name painted on rust (1024x256)
      const g=x.createLinearGradient(0,0,0,256); g.addColorStop(0,'#5a3a2a'); g.addColorStop(1,'#3a2820'); x.fillStyle=g; x.fillRect(0,0,1024,256);
      for(let i=0;i<40;i++){ const X=r()*1024, Y=r()*256, R=10+r()*50; const gg=x.createRadialGradient(X,Y,0,X,Y,R); gg.addColorStop(0,`rgba(${150+r()*40|0},${70+r()*20|0},30,${0.2+r()*0.2})`); gg.addColorStop(1,'rgba(150,70,30,0)'); x.fillStyle=gg; x.fillRect(X-R,Y-R,R*2,R*2); }
      fit(x,'TEKENA 2',512,150,900,150,'rgba(232,228,214,0.92)'); fit(x,'WARRI',512,226,500,54,'rgba(226,222,208,0.85)');
      for(let i=0;i<70;i++){ const X=60+r()*900, Y=40+r()*190; x.fillStyle=`rgba(${120+r()*40|0},${55+r()*20|0},25,${0.3+r()*0.4})`; x.fillRect(X,Y,2+r()*5,2+r()*12); }
      weather(x,0,0,1024,256,3342,1.4);
      // row 1 (256..384): faded warning board (512x128) + drum stencil (512x128)
      board(x,0,256,512,128,'#c8b040','#1a1a1a'); fit(x,'DANGER',256,322,440,52,'#a01818'); fit(x,'NO SMOKING · NO NAKED FLAME',256,362,440,24,'#1a1a1a'); weather(x,0,256,512,128,3343,1.6);
      for(let i=0;i<30;i++){ x.fillStyle=`rgba(20,16,12,${0.3+r()*0.4})`; x.beginPath(); x.arc(r()*512,256+r()*128,2+r()*9,0,7); x.fill(); }
      x.fillStyle='#1c3a6a'; x.fillRect(512,256,512,128); fit(x,'200 L',768,330,420,58,'rgba(235,235,225,0.85)'); fit(x,'KEEP AWAY FROM HEAT',768,370,420,22,'rgba(235,235,225,0.7)'); weather(x,512,256,512,128,3344,1.2);
      // row 2 (384..512): chalked tally board for the 'waybills' shelter (512x128) + a torn calendar (512x128)
      x.fillStyle='#1e2622'; x.fillRect(0,384,512,128); x.strokeStyle='rgba(230,230,220,0.7)'; x.lineWidth=2;
      x.save(); x.font=hand(22); x.fillStyle='rgba(235,235,225,0.85)'; x.textAlign='left'; ['DPK  ////  ////  //','AGO  ////  ///','BARGE  T2  —  44 DRUMS','MON  WED  FRI  01:00'].forEach((t,i)=>x.fillText(t,18,414+i*26)); x.restore();
      x.fillStyle='#e8e2d2'; x.fillRect(512,384,512,128); x.fillStyle='#a01818'; x.fillRect(512,384,512,26); fit(x,'2026',768,404,200,22,'#ffffff');
      x.strokeStyle='rgba(40,40,40,0.5)'; x.lineWidth=1; for(let i=0;i<7;i++) for(let j=0;j<3;j++){ x.strokeRect(530+i*68,418+j*30,60,26); }
      return T(c,false); },
    cr_pano(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(3351), HZ=452, MX=W*0.30, FX=W*0.80;
      nightSky(x, W, HZ, '#03050b', '#0a1120', '#1a2236', 3352, 800);
      // distant gas flare glow on the horizon (and its haze), moon behind thin cloud
      WX(W, FX, 600, px=>{ x.save(); x.translate(px,HZ); x.scale(2.6,1); const rg=x.createRadialGradient(0,0,3,0,0,150); rg.addColorStop(0,'rgba(255,150,60,0.55)'); rg.addColorStop(0.4,'rgba(220,90,40,0.22)'); rg.addColorStop(1,'rgba(200,80,40,0)'); x.fillStyle=rg; x.fillRect(-160,-160,320,170); x.restore(); });
      clouds(x, W, 16, 90, 330, a=>`rgba(90,100,130,${a*0.7})`, 3353);
      moon(x, W, MX, 96, 14, 8);
      clouds(x, W, 5, 90, 110, a=>`rgba(120,130,160,${a*0.6})`, 3354);
      // the flare itself: a tiny flame on a stack above the far trees
      x.fillStyle='#1a1410'; x.fillRect(FX-1.5,HZ-60,3,40); const fg=x.createRadialGradient(FX,HZ-66,0,FX,HZ-66,14); fg.addColorStop(0,'rgba(255,240,180,1)'); fg.addColorStop(0.35,'rgba(255,160,60,0.8)'); fg.addColorStop(1,'rgba(255,120,40,0)'); x.fillStyle=fg; x.fillRect(FX-16,HZ-84,32,34);
      // mangrove forest: two canopy layers with bumps, prop-root arches at the waterline
      const canopy=(base, amps, col, bumps, seed)=>{ const rr=_rng(seed), ys=[]; for(let X=0;X<=W;X+=4){ let y=base; for(const [a,f,p] of amps) y+=a*Math.sin(2*Math.PI*f*X/W+p); ys.push(y); }
        x.fillStyle=col; x.beginPath(); x.moveTo(0,HZ+4); ys.forEach((y,i)=>x.lineTo(i*4,y)); x.lineTo(W,HZ+4); x.closePath(); x.fill();
        for(let i=0;i<bumps;i++){ const X=rr()*W, y=ys[Math.min(ys.length-1,(X/4)|0)], R=8+rr()*20; WX(W,X,R,px=>{ x.beginPath(); x.arc(px,y+R*0.5,R,0,7); x.fill(); }); } return ys; };
      canopy(HZ-58, [[12,3,0.4],[8,7,1.2],[4,17,2.0]], '#0a0f17', 150, 3355);
      const ys=canopy(HZ-34, [[10,2,1.1],[7,5,0.3],[4,13,1.7]], '#05080c', 190, 3356);
      x.strokeStyle='#05080c'; x.lineWidth=1.6; for(let i=0;i<260;i++){ const X=r()*W, h=6+r()*10, w=4+r()*8; WX(W,X,12,px=>{ x.beginPath(); x.moveTo(px-w,HZ+3); x.quadraticCurveTo(px-w*0.6,HZ-h,px,HZ-h*0.9); x.quadraticCurveTo(px+w*0.6,HZ-h,px+w,HZ+3); x.stroke(); }); }
      for(let i=0;i<9;i++){ const X=r()*W, y=ys[Math.min(ys.length-1,(X/4)|0)]; WX(W,X,30,px=>{ x.strokeStyle='#05080c'; x.lineWidth=1.8; x.beginPath(); x.moveTo(px,y+6); x.lineTo(px+(r()-0.5)*6,y-22-r()*10); x.stroke(); for(let k=0;k<6;k++){ const a=k/6*6.28; x.fillStyle='#05080c'; x.beginPath(); x.ellipse(px+Math.cos(a)*8,y-28+Math.sin(a)*3,9,2.4,a,0,7); x.fill(); } }); }
      // water band: dark, the flare and the moon reflected
      const wg=x.createLinearGradient(0,HZ+3,0,H); wg.addColorStop(0,'#0b0f16'); wg.addColorStop(1,'#06080b'); x.fillStyle=wg; x.fillRect(0,HZ+3,W,H-HZ-3);
      for(let i=0;i<70;i++){ const X=FX+(r()-0.5)*40, Y=HZ+6+r()*(H-HZ-8), L=4+r()*14; x.fillStyle=`rgba(255,${140+r()*60|0},60,${0.12+r()*0.35})`; x.fillRect(X-L/2,Y,L,1.3); }
      for(let i=0;i<60;i++){ const X=MX+(r()-0.5)*50, Y=HZ+6+r()*(H-HZ-8), L=4+r()*14; x.fillStyle=`rgba(200,215,255,${0.1+r()*0.3})`; x.fillRect(X-L/2,Y,L,1.2); }
      return T(c,false); },
    cr_wall(){ const W=2048,H=256,[c,x]=_cv(W,H), r=_rng(3361); x.clearRect(0,0,W,H);
      // a near wall of mangroves: canopy mass on top, a tangle of prop roots down to the waterline; sky is transparent
      const top=X=>58+16*Math.sin(X*0.004+0.7)+10*Math.sin(X*0.013+2.1)+6*Math.sin(X*0.041);
      x.fillStyle='#0b120d'; x.beginPath(); x.moveTo(0,H); for(let X=0;X<=W;X+=4) x.lineTo(X,top(X)); x.lineTo(W,H); x.closePath(); x.fill();
      for(let i=0;i<260;i++){ const X=r()*W, R=10+r()*26, y=top(X)+R*0.4; WX(W,X,R,px=>{ x.fillStyle=r()<0.5?'#0d150f':'#0a110c'; x.beginPath(); x.arc(px,y,R,0,7); x.fill(); }); }
      for(let i=0;i<420;i++){ const X=r()*W, y=top(X)+4+r()*30, R=3+r()*8; x.fillStyle=`rgba(${60+r()*30|0},${80+r()*30|0},${110+r()*40|0},${0.10+r()*0.12})`; x.beginPath(); x.arc(X,y,R,Math.PI,0); x.fill(); }   // moonlit leaf edges
      // under the canopy: the root zone (lower 32%) cut into arches so the water and sky beyond show through
      const RZ=H*0.66; x.save(); x.globalCompositeOperation='destination-out';
      for(let i=0;i<150;i++){ const X=r()*W, w=10+r()*26, h=10+r()*(H-RZ-6); x.beginPath(); x.moveTo(X-w,H+2); x.quadraticCurveTo(X-w*0.8,H-h,X,H-h*1.05); x.quadraticCurveTo(X+w*0.8,H-h,X+w,H+2); x.closePath(); x.fill(); }
      x.restore();
      x.strokeStyle='#080d09'; for(let i=0;i<520;i++){ const X=r()*W, h=18+r()*(H-RZ+20), w=6+r()*18; x.lineWidth=1+r()*2.2; x.beginPath(); x.moveTo(X-w,H+2); x.quadraticCurveTo(X-w*0.7,H-h,X,H-h*0.95); x.quadraticCurveTo(X+w*0.7,H-h,X+w,H+2); x.stroke(); }
      for(let i=0;i<70;i++){ const X=r()*W; x.lineWidth=2+r()*3; x.beginPath(); x.moveTo(X,top(X)+20); x.lineTo(X+(r()-0.5)*6,H*0.8); x.stroke(); }
      return T(c,true); },

    /* ============ MAITAMA · a quiet, wealthy avenue in Abuja ============ */
    mt_asphalt(){ const S=512,[c,x]=_cv(S,S), r=_rng(3401); x.fillStyle='#38393b'; x.fillRect(0,0,S,S); N(x,S,S,70000,0.10,3402,1.2);
      for(let i=0;i<30;i++){ const X=r()*S, Y=r()*S, R=20+r()*70, dark=r()<0.6, al=dark?0.06+r()*0.08:0.04+r()*0.05; W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0, dark?`rgba(16,16,18,${al})`:`rgba(140,136,128,${al})`); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); }); }
      for(let i=0;i<500;i++){ x.fillStyle=`rgba(${r()<0.5?160:20},${r()<0.5?158:20},${r()<0.5?150:22},${0.10+r()*0.18})`; x.fillRect(r()*S,r()*S,1+r()*1.6,1+r()*1.6); }
      for(let i=0;i<2;i++){ const X=r()*S, Y=r()*S, w=60+r()*80, h=30+r()*40, b=46+r()*6|0; W9(S,X,Y,Math.max(w,h),(px,py)=>{ x.fillStyle=`rgba(${b},${b},${b+2},0.55)`; x.fillRect(px,py,w,h); }); }
      return T(c,true); },
    mt_paving(){ const S=512,[c,x]=_cv(S,S), r=_rng(3411); x.fillStyle='#4a4644'; x.fillRect(0,0,S,S);
      // interlocking 'zigzag' pavers, alternating rows, mixed red-brown and grey
      const u=32; for(let row=0; row<S/u; row++) for(let col=-1; col<S/(u*2)+1; col++){ const X=col*u*2+(row%2)*u, Y=row*u, k=r();
        const base = k<0.62 ? [122+r()*18,92+r()*12,80+r()*10] : k<0.9 ? [118+r()*14,116+r()*12,110+r()*10] : [96,92,88];
        x.fillStyle=`rgb(${base[0]|0},${base[1]|0},${base[2]|0})`;
        x.beginPath(); x.moveTo(X+2,Y+2); x.lineTo(X+u*0.6,Y+2); x.lineTo(X+u*0.75,Y+u*0.25); x.lineTo(X+u*2-2,Y+u*0.25); x.lineTo(X+u*2-2,Y+u-2); x.lineTo(X+u*1.4,Y+u-2); x.lineTo(X+u*1.25,Y+u*0.75); x.lineTo(X+2,Y+u*0.75); x.closePath(); x.fill(); }
      N(x,S,S,40000,0.08,3412,1.5);
      for(let i=0;i<20;i++){ const X=r()*S, Y=r()*S, R=20+r()*60; W9(S,X,Y,R,(px,py)=>{ const g=x.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0,'rgba(30,26,22,0.12)'); g.addColorStop(1,'rgba(30,26,22,0)'); x.fillStyle=g; x.fillRect(px-R,py-R,R*2,R*2); }); }
      return T(c,true); },
    mt_render(){ const S=512,[c,x]=_cv(S,S), r=_rng(3421); x.fillStyle='#ece4d4'; x.fillRect(0,0,S,S); N(x,S,S,26000,0.05,3422,2); N(x,S,S,700,0.035,3423,14);
      for(let i=0;i<34;i++){ const X=r()*S, Y0=r()*S, L=60+r()*220, al=0.03+r()*0.06; W9(S,X,Y0,L,(px,py)=>{ const g=x.createLinearGradient(0,py,0,py+L); g.addColorStop(0,`rgba(80,70,56,${al})`); g.addColorStop(1,'rgba(80,70,56,0)'); x.fillStyle=g; x.fillRect(px,py,2+r()*7,L); }); }
      return T(c,true); },
    mt_gate(){ const W=256,H=512,[c,x]=_cv(W,H), r=_rng(3431); const g=x.createLinearGradient(0,0,W,0); g.addColorStop(0,'#16171a'); g.addColorStop(0.5,'#22242a'); g.addColorStop(1,'#16171a'); x.fillStyle=g; x.fillRect(0,0,W,H);
      // one leaf: frame, spear bars on top, two raised panels, a brass trim band and boss studs
      x.fillStyle='#0e0f11'; x.fillRect(0,0,W,10); x.fillRect(0,H-10,W,10); x.fillRect(0,0,10,H); x.fillRect(W-10,0,10,H);
      for(let X=22;X<W-12;X+=21){ x.fillStyle='#2c2e34'; x.fillRect(X,14,7,150); x.fillStyle='#4a4c52'; x.fillRect(X+1,14,2,150); x.fillStyle='#b8933e'; x.beginPath(); x.moveTo(X-3,22); x.lineTo(X+3.5,6); x.lineTo(X+10,22); x.fill(); }
      x.fillStyle='#b8933e'; x.fillRect(10,168,W-20,12); x.fillStyle='#6a5426'; x.fillRect(10,178,W-20,2);
      for(const [Y,h] of [[196,140],[350,140]]){ x.fillStyle='#101114'; x.fillRect(22,Y,W-44,h); x.fillStyle='#26282e'; x.fillRect(30,Y+8,W-60,h-16); x.strokeStyle='rgba(184,147,62,0.8)'; x.lineWidth=3; x.strokeRect(38,Y+16,W-76,h-32);
        x.fillStyle='rgba(255,255,255,0.05)'; x.fillRect(30,Y+8,W-60,4); }
      x.fillStyle='#b8933e'; for(const Y of [190,342,496]) for(let X=20;X<W-14;X+=36){ x.beginPath(); x.arc(X,Y,3.2,0,7); x.fill(); }
      N(x,W,H,6000,0.05,3432,1.5); return T(c,false); },
    mt_kerb(){ const W=256,H=64,[c,x]=_cv(W,H); x.fillStyle='#e8e6de'; x.fillRect(0,0,W/2,H); x.fillStyle='#1c1c1e'; x.fillRect(W/2,0,W/2,H); N(x,W,H,3000,0.10,3441,1.5);
      x.fillStyle='rgba(60,50,40,0.25)'; x.fillRect(0,H-12,W,12); return T(c,true); },
    mt_roof(){ const S=512,[c,x]=_cv(S,S), r=_rng(3451); x.fillStyle='#3a2a28'; x.fillRect(0,0,S,S);
      // stone-coated metal tiles: stepped rows with a bevelled lip and a granular finish
      for(let row=0; row<8; row++){ const Y=row*64; const g=x.createLinearGradient(0,Y,0,Y+64); g.addColorStop(0,'#4a3432'); g.addColorStop(0.75,'#3a2826'); g.addColorStop(1,'#1e1414'); x.fillStyle=g; x.fillRect(0,Y,S,64);
        for(let k=0;k<8;k++){ const X=k*64+(row%2)*32; x.fillStyle='rgba(0,0,0,0.25)'; x.fillRect(X,Y,3,64); x.fillStyle='rgba(255,255,255,0.05)'; x.fillRect(X+3,Y,3,64); } }
      N(x,S,S,60000,0.10,3452,1.2); return T(c,true); },
    mt_signs(){ const W=1024,H=512,[c,x]=_cv(W,H), r=_rng(3461); x.fillStyle='#2a2a2c'; x.fillRect(0,0,W,H);
      // row 0 (0..128): street name board (512x128) + 'VISITORS REPORT HERE' (512x128)
      board(x,0,0,512,128,'#1d6a3a','#f2f2ea'); fit(x,'KAINJI CRESCENT',256,72,440,52,'#ffffff'); fit(x,'MAITAMA · A6',256,108,300,24,'#e8e8d8','600');
      board(x,512,0,512,128,'#f2f0ea','#a01818'); fit(x,'SECURITY POST',768,58,440,44,'#a01818'); fit(x,'ALL VISITORS REPORT HERE',768,100,440,28,'#1a1a1a','600');
      // row 1 (128..256): four house plates 256x128
      [['No. 17','#1d3a6a'],['No. 19','#3a2a1a'],['No. 21','#1a1a1a'],['No. 23','#5a1a1a']].forEach(([t,bg],i)=>{ const X=i*256; x.fillStyle='#d8c070'; x.fillRect(X,128,256,128); x.fillStyle=bg; x.fillRect(X+8,136,240,112); fit(x,t,X+128,214,200,62,'#d8c070'); });
      // row 2 (256..384): NO PARKING (256x128), DOGS (256x128), visitor book page (512x128)
      x.fillStyle='#f2f2ea'; x.fillRect(0,256,256,128); x.strokeStyle='#c01818'; x.lineWidth=10; x.beginPath(); x.arc(64,320,44,0,7); x.stroke(); x.beginPath(); x.moveTo(33,289); x.lineTo(95,351); x.stroke(); fit(x,'NO',178,312,140,36,'#c01818'); fit(x,'PARKING',178,350,140,28,'#1a1a1a');
      x.fillStyle='#f0c020'; x.fillRect(256,256,256,128); fit(x,'BEWARE',384,306,220,36,'#1a1a1a'); fit(x,'OF DOGS',384,350,220,32,'#1a1a1a');
      x.fillStyle='#ecebe2'; x.fillRect(512,256,512,128); x.fillStyle='#2a3a6a'; x.fillRect(512,256,512,16); x.strokeStyle='rgba(40,60,120,0.35)'; x.lineWidth=1; for(let k=0;k<7;k++){ x.beginPath(); x.moveTo(520,288+k*14); x.lineTo(1016,288+k*14); x.stroke(); }
      x.save(); x.font=hand(11); x.fillStyle='rgba(20,30,70,0.8)'; x.textAlign='left'; ['23/11  A. BELLO   ELECTRICIAN  09:10','04/12  ROSE (CLEANER)   11:00','09/12  —  DELIVERY   15:40'].forEach((t,i)=>x.fillText(t,524,298+i*14)); x.restore();
      x.fillStyle='rgba(120,20,20,0.6)'; x.fillRect(764,256,2,128);
      // row 3 (384..512): a dim lit-window texture (curtained) 512x128 + a dark window 512x128
      const gw=x.createLinearGradient(0,384,0,512); gw.addColorStop(0,'#f4d8a0'); gw.addColorStop(1,'#d8a860'); x.fillStyle=gw; x.fillRect(0,384,512,128);
      x.fillStyle='rgba(120,70,30,0.45)'; for(let k=0;k<10;k++) x.fillRect(k*52,384,26,128);
      x.fillStyle='#0c0f14'; x.fillRect(512,384,512,128); x.fillStyle='rgba(90,110,140,0.18)'; x.beginPath(); x.moveTo(512,384); x.lineTo(700,384); x.lineTo(600,512); x.lineTo(512,512); x.fill();
      return T(c,false); },
    mt_pano(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(3471), HZ=452;
      nightSky(x, W, HZ, '#05070f', '#0e1428', '#2a2a40', 3472, 420);
      // sodium city glow on the horizon, strongest to the south-east (the city centre)
      for(const [cx, s] of [[W*0.62, 1.0], [W*0.35, 0.5], [W*0.9, 0.45], [W*0.12, 0.35]]) WX(W, cx, 700, px=>{ x.save(); x.translate(px,HZ); x.scale(3.2,1); const rg=x.createRadialGradient(0,0,4,0,0,190); rg.addColorStop(0,`rgba(230,140,70,${0.5*s})`); rg.addColorStop(1,'rgba(230,140,70,0)'); x.fillStyle=rg; x.fillRect(-200,-190,400,200); x.restore(); });
      clouds(x, W, 12, 140, 360, a=>`rgba(140,110,110,${a*0.6})`, 3473);
      moon(x, W, W*0.18, 120, 10, 6);
      // hills ring: Aso Rock rises in the east (u 0.5 = +x); smaller ridges elsewhere
      const ridge=(fn, col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(0,H); for(let X=0;X<=W;X+=3) x.lineTo(X,fn(X)); x.lineTo(W,H); x.closePath(); x.fill(); };
      ridge(X=>HZ-12-10*Math.sin(X*0.003+0.4)-6*Math.sin(X*0.011+1.3)-4*Math.sin(X*0.037), '#0d0f18');
      const AX=W*0.5, aso=X=>{ const d=(X-AX)/190; if(Math.abs(d)>2.2) return 1e9; const sh=Math.exp(-Math.pow(Math.abs(d)/1.05,3.0)); const bump=0.12*Math.exp(-((d-0.55)*(d-0.55))*9)+0.10*Math.exp(-((d+0.6)*(d+0.6))*7)-0.05*Math.exp(-(d*d)*30); return HZ-14-(300*sh+60*bump)*(1-0.008*Math.sin(X*0.05)-0.006*Math.sin(X*0.17)); };
      x.fillStyle='#07080e'; x.beginPath(); x.moveTo(AX-420,HZ); for(let X=AX-420;X<=AX+420;X+=2) x.lineTo(X,Math.min(HZ,aso(X))); x.lineTo(AX+420,HZ); x.closePath(); x.fill();
      for(let i=0;i<40;i++){ const X=AX-260+r()*520, y0=aso(X)+10+r()*40, L=40+r()*140; if(y0<HZ-20){ x.strokeStyle=`rgba(${30+r()*20|0},${32+r()*20|0},${44+r()*24|0},0.55)`; x.lineWidth=1+r()*2.5; x.beginPath(); x.moveTo(X,y0); x.lineTo(X+(r()-0.5)*14,Math.min(HZ-10,y0+L)); x.stroke(); } }   // rock streaks
      x.strokeStyle='rgba(120,135,170,0.4)'; x.lineWidth=2.5; x.beginPath(); let first=true; for(let X=AX-330;X<=AX+60;X+=2){ const y=aso(X)+1; first?x.moveTo(X,y):x.lineTo(X,y); first=false; } x.stroke();   // moonlit rim
      // city: low skyline with lit windows, a few towers with red beacons, street-light dots
      for(let layer=0;layer<2;layer++){ let px=0; const col=layer?'#06070c':'#0b0d16';
        while(px<W){ const tall=r()<0.06, w=18+r()*50, h=(tall?60+r()*70:(layer?12:8)+r()*16), top=HZ-h+(layer?4:-3);
          if(Math.abs(px-AX)<380 && !tall && layer===0){ px+=w; continue; }
          x.fillStyle=col; x.fillRect(px,top,w,HZ-top+8);
          const n=tall? 30 : 3; for(let k=0;k<n;k++){ if(r()<(tall?0.5:0.45)){ const warm=r()<0.7; x.fillStyle= warm?`rgba(255,${190+r()*50|0},${110+r()*40|0},${0.6+r()*0.4})`:`rgba(190,215,255,${0.5+r()*0.4})`; x.fillRect(px+3+r()*(w-6),top+4+r()*(h-6),2.2,2.2); } }
          if(tall){ x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(px+w/2,top-3,2.2,0,7); x.fill(); }
          px+=w+r()*14; } }
      for(let i=0;i<260;i++){ const X=r()*W, Y=HZ-2+r()*10; if(Math.abs(X-AX)<150) continue; x.fillStyle=`rgba(255,${170+r()*50|0},${80+r()*40|0},${0.5+r()*0.5})`; x.fillRect(X,Y,1.6,1.6); }
      for(let i=0;i<30;i++){ const X=r()*W, y=HZ-6-r()*8, R=7+r()*12; if(Math.abs(X-AX)<200) continue; WX(W,X,R,p=>{ x.fillStyle='#05060a'; x.beginPath(); x.arc(p,y,R,0,7); x.fill(); }); }
      x.fillStyle='#05060a'; x.fillRect(0,HZ+6,W,H-HZ-6);
      return T(c,false); },
  });
  Object.assign(MDEF, {
    sp_mud:{t:'sp_mud'}, sp_asphalt:{t:'sp_asphalt'}, sp_signs:{t:'sp_signs'}, sp_bottles:{t:'sp_bottles'}, sp_phones:{t:'sp_phones'},
  });
  Object.assign(MDEF, { cr_mud:{t:'cr_mud'}, cr_rust:{t:'cr_rust'}, cr_signs:{t:'cr_signs'} });
  Object.assign(MDEF, { mt_asphalt:{t:'mt_asphalt'}, mt_paving:{t:'mt_paving'}, mt_wall:{t:'mt_render', c:'#e6dcc6'}, mt_wall_b:{t:'mt_render', c:'#d8d6d0'}, mt_wall_c:{t:'mt_render', c:'#e8d8b8'},
    mt_mansion:{t:'mt_render', c:'#f2ece0'}, mt_gate:{t:'mt_gate'}, mt_kerb:{t:'mt_kerb'}, mt_roof:{t:'mt_roof'}, mt_signs:{t:'mt_signs'} });
  Object.assign(MGLOWTEX, { sp_river:{ t:'sp_river' }, sp_puddle:{ t:'sp_puddle', alpha:true }, sp_pano_river:{ t:'sp_panoRiver', fog:false }, sp_pano_town:{ t:'sp_panoTown', fog:false },
    cr_water:{ t:'cr_water' }, cr_crude:{ t:'cr_crude' }, cr_wall:{ t:'cr_wall', test:0.5 }, mt_pano:{ t:'mt_pano', fog:false }, cr_pano:{ t:'cr_pano', fog:false } });
})();
