/* =========================================================================
   NACECA · v13_mtex_b.js — painted surfaces for the Season 2 scenes
   tf_ Riverstone tank farm (Port Harcourt, dusk + night), ab_ the DG's suite
   (NACECA HQ, Abuja), ct_ Court 5 of the Federal High Court, Abuja.
   Canvas-made at load (no download cost), same helpers as mtex_v9.
   ========================================================================= */
(function(){
  const N = (x,w,h,a,al,seed,sz)=>_noise(x,w,h,a,al,seed,sz), T = (c,rep)=>_tex(c,rep);
  const FONT = `Oswald, Impact, 'Arial Narrow', sans-serif`, SANS = `'Helvetica Neue', Arial, sans-serif`, SERIF = `Georgia, 'Times New Roman', serif`, HAND = `'Comic Sans MS', 'Trebuchet MS', Verdana, sans-serif`;
  // text that shrinks to fit maxW; fam: FONT/SANS/SERIF/HAND
  const fit = (x, s, X, Y, maxW, px, col, w, fam, align)=>{ let f=px; const mk=f=>`${w||'bold'} ${f}px ${fam||FONT}`; x.font=mk(f);
    while(f>6 && x.measureText(s).width>maxW){ f-=1; x.font=mk(f); } x.fillStyle=col; x.textAlign=align||'center'; x.textBaseline='alphabetic'; x.fillText(s,X,Y); return f; };
  // draw at every wrapped copy of (X,Y) near the tile so repeating textures stay seamless
  const W9 = (S, X, Y, m, f)=>{ for(const dx of [-S,0,S]) for(const dy of [-S,0,S]){ const px=X+dx, py=Y+dy; if(px<-m || px>S+m || py<-m || py>S+m) continue; f(px,py); } };
  const WX = (W, X, m, f)=>{ for(const dx of [-W,0,W]){ const px=X+dx; if(px<-m || px>W+m) continue; f(px); } };
  const blob = (x, X, Y, R, col)=>{ const g=x.createRadialGradient(X,Y,0,X,Y,R); g.addColorStop(0,col); g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)')); x.fillStyle=g; x.fillRect(X-R,Y-R,R*2,R*2); };
  const sblob = (x, S, X, Y, R, col)=>W9(S, X, Y, R, (px,py)=>blob(x, px, py, R, col));
  const rr = (x, X, Y, w, h, r)=>{ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+w,Y,X+w,Y+h,r); x.arcTo(X+w,Y+h,X,Y+h,r); x.arcTo(X,Y+h,X,Y,r); x.arcTo(X,Y,X+w,Y,r); x.closePath(); };
  // vertical grime streaks hanging from y0 (or rising from the bottom when up=true)
  const streaks = (x, X0, X1, Y0, n, Lmin, Lmax, col, seed, wmax)=>{ const r=_rng(seed);
    for(let i=0;i<n;i++){ const X=X0+r()*(X1-X0), L=Lmin+r()*(Lmax-Lmin), a=0.05+r()*0.18, w=1+r()*(wmax||4);
      const g=x.createLinearGradient(0,Y0,0,Y0+L); g.addColorStop(0,col(a)); g.addColorStop(1,col(0)); x.fillStyle=g; x.fillRect(X,Y0,w,L); } };
  const speck = (x, X, Y, w, h, n, seed, cols)=>{ const r=_rng(seed); for(let i=0;i<n;i++){ x.fillStyle=cols[(r()*cols.length)|0]; x.fillRect(X+r()*w, Y+r()*h, 1+r()*2, 1+r()*2); } };
  const board = (x, X, Y, w, h, bg, border, bw)=>{ x.fillStyle=bg; x.fillRect(X,Y,w,h); if(border){ x.strokeStyle=border; x.lineWidth=bw||Math.max(3,h*0.05); x.strokeRect(X+x.lineWidth/2+2,Y+x.lineWidth/2+2,w-x.lineWidth-4,h-x.lineWidth-4); } };
  const wear = (x, X, Y, w, h, seed, a)=>{ const r=_rng(seed); a=a||1;
    for(let i=0;i<w*h/90;i++){ x.fillStyle=`rgba(${r()<0.5?30:255},${r()<0.5?25:250},${r()<0.5?20:240},${0.06*a*r()})`; x.fillRect(X+r()*w, Y+r()*h, 1.5, 1.5); }
    for(let i=0;i<Math.floor(w/14);i++){ const sx=X+r()*w, g=x.createLinearGradient(0,Y,0,Y+h); g.addColorStop(0,`rgba(70,50,30,${0.12*a*r()})`); g.addColorStop(1,'rgba(70,50,30,0)'); x.fillStyle=g; x.fillRect(sx,Y,1+r()*2,h*(0.3+r()*0.7)); } };
  // pictogram helpers for safety signs (cell of size s at X,Y)
  const prohib = (x, X, Y, s, draw)=>{ x.fillStyle='#f4f2ec'; x.fillRect(X,Y,s,s); const c=s/2, R=s*0.4; x.save(); x.translate(X+c,Y+c); draw(x, R); x.strokeStyle='#c8201a'; x.lineWidth=s*0.09; x.beginPath(); x.arc(0,0,R,0,7); x.stroke(); x.beginPath(); x.moveTo(-R*0.7,-R*0.7); x.lineTo(R*0.7,R*0.7); x.stroke(); x.restore(); };
  const warnTri = (x, X, Y, s, draw)=>{ x.fillStyle='#f4f2ec'; x.fillRect(X,Y,s,s); x.save(); x.translate(X+s/2,Y+s*0.56); const R=s*0.46; x.fillStyle='#f0c020'; x.strokeStyle='#141414'; x.lineWidth=s*0.05; x.beginPath(); x.moveTo(0,-R); x.lineTo(R*0.92,R*0.62); x.lineTo(-R*0.92,R*0.62); x.closePath(); x.fill(); x.stroke(); draw(x, R); x.restore(); };
  const mandatory = (x, X, Y, s, draw)=>{ x.fillStyle='#f4f2ec'; x.fillRect(X,Y,s,s); x.save(); x.translate(X+s/2,Y+s/2); x.fillStyle='#1d5aa8'; x.beginPath(); x.arc(0,0,s*0.42,0,7); x.fill(); draw(x, s*0.42); x.restore(); };
  // a concrete slab texture (S px over `m` metres): slabs of `slab` m, joints, stains
  const concreteSlabs = (x, S, m, slab, seed, base, opt)=>{ const r=_rng(seed), ppm=S/m; opt=opt||{};
    x.fillStyle=base; x.fillRect(0,0,S,S); const n=Math.round(m/slab), sp=S/n;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const v=(r()-0.5)*16|0; x.fillStyle=`rgba(${v>0?255:0},${v>0?250:0},${v>0?240:0},${Math.abs(v)/160})`; x.fillRect(i*sp,j*sp,sp,sp); }
    N(x,S,S,S*S/10,0.07,seed+1,1.5); N(x,S,S,S*S/160,0.05,seed+2,4);
    for(let i=0;i<60;i++) sblob(x,S,r()*S,r()*S,10+r()*60,r()<0.6?`rgba(40,36,30,${0.05+r()*0.08})`:`rgba(200,195,180,${0.05+r()*0.07})`);
    if(opt.oil) for(let i=0;i<opt.oil;i++){ const X=r()*S, Y=r()*S, R0=6+r()*30; for(let k=0;k<4;k++) sblob(x,S,X+(r()-0.5)*R0*1.6,Y+(r()-0.5)*R0*0.9,R0*(0.4+r()*0.7),`rgba(16,14,12,${0.12+r()*0.2})`); }
    if(opt.tyres) for(let i=0;i<opt.tyres;i++){ const X=r()*S, Y=r()*S, a=r()*6.28, len=S*(0.25+r()*0.4), k=(r()-0.5)*0.0012;
      for(const off of [0, ppm*1.9]) for(let q=0;q<3;q++){ x.strokeStyle=`rgba(24,22,20,${0.03+r()*0.04})`; x.lineWidth=ppm*(0.06+r()*0.12); x.beginPath();
        for(let t=0;t<=1.001;t+=0.05){ const ang=a+k*t*len; const px=X+Math.cos(ang)*t*len - Math.sin(a)*(off+(q-1)*ppm*0.05), py=Y+Math.sin(ang)*t*len + Math.cos(a)*(off+(q-1)*ppm*0.05); t?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); } }
    x.strokeStyle='rgba(30,28,24,0.55)'; x.lineWidth=Math.max(1.5,ppm*0.015); for(let i=0;i<=n;i++){ x.beginPath(); x.moveTo(i*sp,0); x.lineTo(i*sp,S); x.stroke(); x.beginPath(); x.moveTo(0,i*sp); x.lineTo(S,i*sp); x.stroke(); }
    x.strokeStyle='rgba(230,225,215,0.18)'; x.lineWidth=1; for(let i=0;i<=n;i++){ x.beginPath(); x.moveTo(i*sp+2,0); x.lineTo(i*sp+2,S); x.stroke(); x.beginPath(); x.moveTo(0,i*sp+2); x.lineTo(S,i*sp+2); x.stroke(); }
    x.strokeStyle='rgba(25,22,18,0.4)'; x.lineWidth=1; for(let i=0;i<(opt.cracks||10);i++){ let px=r()*S, py=r()*S; x.beginPath(); x.moveTo(px,py); for(let k=0;k<6;k++){ px+=(r()-0.5)*40; py+=(r()-0.5)*40; x.lineTo(px,py); } x.stroke(); }
    for(let i=0;i<S;i++){ x.fillStyle=`rgba(${r()<0.5?60:200},${r()<0.5?55:195},${r()<0.5?45:185},${0.15+r()*0.2})`; x.fillRect(r()*S,r()*S,1+r()*2.5,1+r()*2.5); } };

  Object.assign(MTEX, {
    /* ================== TANK FARM · Riverstone depot, Port Harcourt ================== */
    tf_yard(){ const S=1024,[c,x]=_cv(S,S); concreteSlabs(x,S,4,2,7101,'#98938a',{oil:16,tyres:4,cracks:14}); return T(c,true); },
    tf_quay(){ const S=1024,[c,x]=_cv(S,S), r=_rng(7111); concreteSlabs(x,S,4,4,7112,'#8e8b84',{oil:10,cracks:18});
      for(let i=0;i<14;i++){ const X=r()*S, Y=r()*S; sblob(x,S,X,Y,14+r()*30,`rgba(120,60,24,${0.12+r()*0.12})`); }      // rust stains
      for(let i=0;i<30;i++) sblob(x,S,r()*S,r()*S,20+r()*50,`rgba(70,80,60,${0.04+r()*0.05})`);
      return T(c,true); },
    tf_ground(){ const S=512,[c,x]=_cv(S,S), r=_rng(7121); x.fillStyle='#6e6355'; x.fillRect(0,0,S,S);
      for(let i=0;i<120;i++) sblob(x,S,r()*S,r()*S,10+r()*55, r()<0.45?`rgba(30,26,22,${0.12+r()*0.18})`:r()<0.7?`rgba(150,135,110,${0.1+r()*0.12})`:`rgba(90,96,80,${0.08+r()*0.1})`);
      N(x,S,S,40000,0.1,7122,1.5); N(x,S,S,3000,0.06,7123,4);
      for(let i=0;i<14;i++) sblob(x,S,r()*S,r()*S,8+r()*26,`rgba(14,12,10,${0.3+r()*0.3})`);                                // oil
      speck(x,0,0,S,S,700,7124,['rgba(170,160,140,0.6)','rgba(60,56,50,0.6)','rgba(200,190,170,0.5)','rgba(120,110,90,0.5)']);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S; x.fillStyle=`rgba(${80+r()*40|0},${100+r()*40|0},${50+r()*30|0},0.5)`; for(let k=0;k<6;k++) x.fillRect(X+(r()-0.5)*8,Y+(r()-0.5)*4,1.2,3+r()*4); }   // grass tufts
      return T(c,true); },
    tf_bund(){ const S=512,[c,x]=_cv(S,S), r=_rng(7131); x.fillStyle='#7c776d'; x.fillRect(0,0,S,S); N(x,S,S,60000,0.16,7132,2); N(x,S,S,8000,0.1,7133,3.5);
      speck(x,0,0,S,S,4000,7134,['rgba(150,145,135,0.7)','rgba(70,66,60,0.7)','rgba(180,172,160,0.6)','rgba(110,100,85,0.6)']);
      for(let i=0;i<10;i++) sblob(x,S,r()*S,r()*S,20+r()*60,`rgba(20,18,15,${0.15+r()*0.2})`);
      for(let i=0;i<30;i++) sblob(x,S,r()*S,r()*S,10+r()*40,`rgba(90,100,70,${0.06+r()*0.08})`);
      return T(c,true); },
    tf_road(){ const S=1024,[c,x]=_cv(S,S), r=_rng(7141); x.fillStyle='#3e3d3b'; x.fillRect(0,0,S,S); N(x,S,S,120000,0.12,7142,1.3); N(x,S,S,6000,0.06,7143,5);
      for(let i=0;i<50;i++) sblob(x,S,r()*S,r()*S,20+r()*80, r()<0.6?`rgba(18,18,18,${0.08+r()*0.1})`:`rgba(150,130,100,${0.05+r()*0.07})`);
      for(let i=0;i<6;i++){ const X=r()*S, Y=r()*S, R0=30+r()*50; W9(S,X,Y,R0*1.4,(px,py)=>{ x.fillStyle='rgba(50,49,47,0.85)'; x.beginPath(); for(let k=0;k<9;k++){ const a=k/9*6.28, d=R0*(0.7+r()*0.5); k?x.lineTo(px+Math.cos(a)*d,py+Math.sin(a)*d*0.7):x.moveTo(px+d,py); } x.closePath(); x.fill(); x.strokeStyle='rgba(15,15,15,0.4)'; x.lineWidth=1.5; x.stroke(); }); }
      for(let i=0;i<7;i++){ const X=r()*S, Y=r()*S, a=8+r()*22; W9(S,X,Y,a*2,(px,py)=>{ x.fillStyle='rgba(28,26,24,0.75)'; x.beginPath(); for(let k=0;k<8;k++){ const an=k/8*6.28, d=a*(0.6+r()*0.5); k?x.lineTo(px+Math.cos(an)*d,py+Math.sin(an)*d*0.7):x.moveTo(px+d,py); } x.closePath(); x.fill(); blob(x,px,py+a*0.15,a*0.6,'rgba(110,96,78,0.45)'); }); }   // potholes with sand
      x.strokeStyle='rgba(14,14,14,0.35)'; x.lineWidth=1; for(let i=0;i<16;i++){ let px=r()*S, py=r()*S; x.beginPath(); x.moveTo(px,py); for(let k=0;k<8;k++){ px+=(r()-0.5)*40; py+=(r()-0.5)*40; x.lineTo(px,py); } x.stroke(); }
      speck(x,0,0,S,S,1800,7144,['rgba(170,165,150,0.35)','rgba(20,20,20,0.5)']); return T(c,true); },
    tf_mud(){ const S=512,[c,x]=_cv(S,S), r=_rng(7151); x.fillStyle='#463b2f'; x.fillRect(0,0,S,S);
      for(let i=0;i<90;i++) sblob(x,S,r()*S,r()*S,14+r()*60, r()<0.5?`rgba(22,18,14,${0.2+r()*0.25})`:`rgba(110,96,76,${0.12+r()*0.15})`);
      for(let i=0;i<16;i++){ const X=r()*S, Y=r()*S, a=12+r()*30; W9(S,X,Y,a,(px,py)=>{ x.save(); x.translate(px,py); x.scale(1,0.35); blob(x,0,0,a,`rgba(150,150,160,${0.1+r()*0.12})`); x.restore(); }); }   // wet sheen
      N(x,S,S,40000,0.1,7152,1.5);
      for(let i=0;i<30;i++){ x.fillStyle=['#d8d8d0','#3a6ab8','#c83a2a','#e0c020','#2a2a2a'][(r()*5)|0]; x.globalAlpha=0.6; x.fillRect(r()*S,r()*S,2+r()*6,1+r()*3); } x.globalAlpha=1;   // litter
      return T(c,true); },
    tf_wall(){ const S=1024,[c,x]=_cv(S,S), r=_rng(7161), ppm=S/3; x.fillStyle='#d6cdb6'; x.fillRect(0,0,S,S);
      x.strokeStyle='rgba(120,110,90,0.08)'; x.lineWidth=2;                                                   // block joints under the render
      for(let row=0;row*0.225*ppm<S;row++){ const Y=S-row*0.225*ppm; x.beginPath(); x.moveTo(0,Y); x.lineTo(S,Y); x.stroke(); for(let k=0;k<8;k++){ const X=((k+(row%2)*0.5)*0.45*ppm)%S; x.beginPath(); x.moveTo(X,Y); x.lineTo(X,Y-0.225*ppm); x.stroke(); } }
      N(x,S,S,90000,0.06,7162,2); N(x,S,S,3000,0.05,7163,10);
      for(let i=0;i<30;i++) sblob(x,S,r()*S,r()*S*0.8,20+r()*90,`rgba(${r()<0.5?120:240},${r()<0.5?110:235},${r()<0.5?90:220},${0.04+r()*0.05})`);
      const gB=x.createLinearGradient(0,S-0.7*ppm,0,S); gB.addColorStop(0,'rgba(110,90,66,0)'); gB.addColorStop(0.55,'rgba(110,90,66,0.35)'); gB.addColorStop(1,'rgba(80,64,46,0.7)'); x.fillStyle=gB; x.fillRect(0,S-0.7*ppm,S,0.7*ppm);   // splash-back dirt
      streaks(x,0,S,S-2.8*ppm,140,40,0.9*ppm,a=>`rgba(60,66,52,${a})`,7164,5);                                  // algae from the coping
      streaks(x,0,S,S-0.5*ppm,60,10,0.45*ppm,a=>`rgba(90,74,54,${a*0.6})`,7165,3);
      for(let i=0;i<10;i++){ const X=r()*S, Y=S-(0.3+r()*2.2)*ppm; for(let k=0;k<5;k++) sblob(x,S,X+(r()-0.5)*80,Y+(r()-0.5)*30,10+r()*30,`rgba(150,140,120,${0.08+r()*0.1})`); }   // patched / repainted spots
      return T(c,true); },
    tf_render(){ const S=512,[c,x]=_cv(S,S), r=_rng(7171); x.fillStyle='#ece8dc'; x.fillRect(0,0,S,S); N(x,S,S,30000,0.045,7172,2); N(x,S,S,900,0.03,7173,12);
      for(let i=0;i<26;i++) sblob(x,S,r()*S,r()*S,20+r()*70,`rgba(${r()<0.5?110:255},${r()<0.5?100:250},${r()<0.5?80:240},${0.03+r()*0.04})`);
      streaks(x,0,S,0,40,40,S*0.6,a=>`rgba(90,82,66,${a*0.45})`,7174,4);
      x.strokeStyle='rgba(90,80,60,0.18)'; x.lineWidth=1; for(let i=0;i<5;i++){ let px=r()*S, py=r()*S; x.beginPath(); x.moveTo(px,py); for(let k=0;k<5;k++){ px+=(r()-0.5)*30; py+=r()*25; x.lineTo(px,py); } x.stroke(); }
      return T(c,true); },
    tf_paint(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#f2eee4'; x.fillRect(0,0,S,S); N(x,S,S,9000,0.035,7181,2); N(x,S,S,200,0.02,7182,16); return T(c,true); },
    tf_tiles(){ const S=512,[c,x]=_cv(S,S), r=_rng(7191), t=S/2; x.fillStyle='#8a8478'; x.fillRect(0,0,S,S);
      for(let i=0;i<2;i++) for(let j=0;j<2;j++){ const b=196+r()*12|0; x.fillStyle=`rgb(${b},${b-8},${b-20})`; x.fillRect(i*t+3,j*t+3,t-6,t-6);
        for(let k=0;k<14;k++) blob(x,i*t+8+r()*(t-16),j*t+8+r()*(t-16),8+r()*30,`rgba(${r()<0.5?150:230},${r()<0.5?140:224},${r()<0.5?120:210},${0.08+r()*0.1})`); }
      N(x,S,S,20000,0.05,7192,1.5); for(let i=0;i<20;i++) sblob(x,S,r()*S,r()*S,10+r()*40,`rgba(80,70,55,${0.04+r()*0.05})`);
      for(let i=0;i<30;i++){ x.strokeStyle=`rgba(40,36,30,${0.1+r()*0.15})`; x.lineWidth=1; const X=r()*S, Y=r()*S; x.beginPath(); x.moveTo(X,Y); x.lineTo(X+(r()-0.5)*30,Y+(r()-0.5)*8); x.stroke(); }   // scuffs
      return T(c,true); },
    tf_roof(){ const S=512,[c,x]=_cv(S,S), r=_rng(7201); x.fillStyle='#cfccc4'; x.fillRect(0,0,S,S); N(x,S,S,30000,0.07,7202,2);
      for(let i=0;i<60;i++) sblob(x,S,r()*S,r()*S,8+r()*50, r()<0.5?`rgba(130,70,30,${0.08+r()*0.15})`:`rgba(90,90,85,${0.06+r()*0.08})`);
      x.strokeStyle='rgba(110,106,98,0.4)'; x.lineWidth=2; for(let k=0;k<=4;k++){ x.beginPath(); x.moveTo(k*S/4,0); x.lineTo(k*S/4,S); x.stroke(); x.beginPath(); x.moveTo(0,k*S/4+S/8); x.lineTo(S,k*S/4+S/8); x.stroke(); }
      streaks(x,0,S,0,60,30,S*0.5,a=>`rgba(120,62,28,${a*0.8})`,7203,3); return T(c,true); },
    tf_rust(){ const S=512,[c,x]=_cv(S,S), r=_rng(7211); x.fillStyle='#6e3e26'; x.fillRect(0,0,S,S);
      for(let i=0;i<140;i++) sblob(x,S,r()*S,r()*S,8+r()*60, r()<0.35?`rgba(150,80,36,${0.2+r()*0.25})`:r()<0.65?`rgba(40,22,14,${0.2+r()*0.25})`:`rgba(90,40,30,${0.2+r()*0.2})`);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, col=r()<0.5?'rgba(60,30,28,':'rgba(34,32,36,'; for(let k=0;k<4;k++) sblob(x,S,X+(r()-0.5)*40,Y+(r()-0.5)*24,8+r()*20,col+(0.15+r()*0.2)+')'); }   // old paint
      N(x,S,S,50000,0.12,7212,1.5); N(x,S,S,4000,0.08,7213,4);
      x.strokeStyle='rgba(30,16,10,0.6)'; x.lineWidth=3; for(let k=0;k<=2;k++){ x.beginPath(); x.moveTo(0,k*S/2); x.lineTo(S,k*S/2); x.stroke(); x.beginPath(); x.moveTo(k*S/2+(k%2)*40,0); x.lineTo(k*S/2+(k%2)*40,S); x.stroke(); }   // weld seams
      x.strokeStyle='rgba(190,120,70,0.25)'; x.lineWidth=1; for(let k=0;k<=2;k++){ x.beginPath(); x.moveTo(0,k*S/2+3); x.lineTo(S,k*S/2+3); x.stroke(); }
      streaks(x,0,S,0,70,20,S*0.6,a=>`rgba(170,90,40,${a})`,7214,4); streaks(x,0,S,S*0.5,50,20,S*0.4,a=>`rgba(30,16,10,${a})`,7215,3);
      return T(c,true); },
    tf_deck(){ const S=512,[c,x]=_cv(S,S), r=_rng(7221); x.fillStyle='#4a3a30'; x.fillRect(0,0,S,S);
      for(let i=0;i<100;i++) sblob(x,S,r()*S,r()*S,10+r()*60, r()<0.5?`rgba(120,64,30,${0.15+r()*0.2})`:`rgba(18,14,12,${0.2+r()*0.25})`);
      x.fillStyle='rgba(20,16,12,0.35)'; for(let j=0;j<S;j+=16) for(let i=0;i<S;i+=16){ const o=(j/16)%2?8:0; x.save(); x.translate(i+o+4,j+8); x.rotate(((i+j)/16)%2?0.6:-0.6); x.fillRect(-4,-1,8,2.2); x.restore(); }   // tread pattern
      N(x,S,S,40000,0.1,7222,1.5); for(let i=0;i<12;i++) sblob(x,S,r()*S,r()*S,20+r()*40,`rgba(8,8,8,${0.3+r()*0.3})`);
      x.strokeStyle='rgba(20,12,8,0.6)'; x.lineWidth=3; x.beginPath(); x.moveTo(0,S/2); x.lineTo(S,S/2); x.stroke(); x.beginPath(); x.moveTo(S/2,0); x.lineTo(S/2,S); x.stroke();
      return T(c,true); },
    tf_shack(){ const S=512,[c,x]=_cv(S,S), r=_rng(7231), pw=S/6; x.fillStyle='#1e1812'; x.fillRect(0,0,S,S);
      for(let i=0;i<6;i++){ const b=88+r()*40|0; x.fillStyle=`rgb(${b},${b*0.8|0},${b*0.62|0})`; x.fillRect(i*pw+2,0,pw-4,S);
        for(let k=0;k<14;k++){ x.strokeStyle=`rgba(40,30,20,${0.2+r()*0.25})`; x.lineWidth=1+r()*2; const X=i*pw+6+r()*(pw-12); x.beginPath(); x.moveTo(X,0); x.bezierCurveTo(X+(r()-0.5)*8,S*0.3,X+(r()-0.5)*8,S*0.7,X+(r()-0.5)*6,S); x.stroke(); }
        if(r()<0.45){ x.fillStyle=['rgba(40,90,140,0.45)','rgba(40,120,70,0.4)','rgba(170,60,40,0.35)'][(r()*3)|0]; x.fillRect(i*pw+2,r()*S*0.6,pw-4,S*(0.2+r()*0.4)); } }
      N(x,S,S,30000,0.1,7232,1.5); x.fillStyle='rgba(130,70,40,0.85)'; x.fillRect(S*0.55,S*0.25,S*0.3,S*0.25); for(let k=0;k<12;k++){ x.fillStyle=k%2?'rgba(60,30,18,0.45)':'rgba(190,120,70,0.35)'; x.fillRect(S*0.55+k*S*0.025,S*0.25,S*0.0125,S*0.25); }   // tin patch
      streaks(x,0,S,0,40,20,S*0.5,a=>`rgba(20,14,10,${a})`,7233,3); return T(c,true); },
    tf_grating(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#141414'; x.fillRect(0,0,S,S); const n=16, sp=S/n;
      for(let i=0;i<n;i++){ x.fillStyle='#7a7c78'; x.fillRect(i*sp,0,sp*0.32,S); x.fillStyle='#9a9c98'; x.fillRect(i*sp,0,sp*0.1,S); }
      for(let j=0;j<4;j++){ x.fillStyle='#6a6c68'; x.fillRect(0,j*S/4,S,sp*0.2); }
      N(x,S,S,8000,0.12,7241,1.5); return T(c,true); },
    tf_hazard(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#e0b020'; x.fillRect(0,0,S,S); x.fillStyle='#161616';
      for(let k=-2;k<4;k++){ x.beginPath(); x.moveTo(k*S/2,0); x.lineTo(k*S/2+S/4,0); x.lineTo(k*S/2+S/4+S,S); x.lineTo(k*S/2+S,S); x.closePath(); x.fill(); }
      wear(x,0,0,S,S,7251,2.5); N(x,S,S,6000,0.12,7252,2); return T(c,true); },
    // ---- the four tank shells: one band of 256 rows per tank (u wraps the circumference, v the 8.7 m height)
    tf_tank(){ const W=2048,H=1024,[c,x]=_cv(W,H), r=_rng(7301);
      const TK=[ {n:'T1', p:'AGO', at:[140,230], name:140, circ:37.7}, {n:'T2', p:'PMS', at:[150,215], name:150, circ:34.6},
                 {n:'T3', p:'AGO', at:[150,320], circ:37.7, old:1}, {n:'T4', p:'DPK', at:[230,290], circ:34.6, old:1.4} ];
      TK.forEach((tk, b)=>{ const top=b*256, Y=m=>top+2+(9-m)/8.7*252, ppmX=W/tk.circ, ppmY=252/8.7, sx=ppmX/ppmY;
        const g=x.createLinearGradient(0,top,0,top+256); g.addColorStop(0,'#ecece6'); g.addColorStop(1,'#dcdcd4'); x.fillStyle=g; x.fillRect(0,top,W,256);
        const rr_=_rng(7310+b);
        for(let i=0;i<W*256/30;i++){ x.fillStyle=`rgba(${rr_()<0.5?80:255},${rr_()<0.5?80:255},${rr_()<0.5?75:250},${0.05*rr_()})`; x.fillRect(rr_()*W, top+rr_()*256, 2, 2); }
        for(let i=0;i<40;i++){ const X=rr_()*W, Yb=top+rr_()*256, R0=20+rr_()*120; WX(W,X,R0,px=>{ const gg=x.createRadialGradient(px,Yb,0,px,Yb,R0); gg.addColorStop(0,`rgba(150,145,130,${0.05+rr_()*0.06})`); gg.addColorStop(1,'rgba(150,145,130,0)'); x.fillStyle=gg; x.fillRect(px-R0,Yb-R0,R0*2,R0*2); }); }
        // plate courses (horizontal seams) and staggered vertical seams
        for(let k=1;k<5;k++){ const y=Y(0.3+1.74*k); x.fillStyle='rgba(120,118,110,0.3)'; x.fillRect(0,y,W,1.5); x.fillStyle='rgba(255,255,255,0.35)'; x.fillRect(0,y+1.5,W,1); }
        for(let k=0;k<5;k++){ const y0=Y(0.3+1.74*(k+1)), y1=Y(0.3+1.74*k); for(let j=0;j<12;j++){ const X=((j+(k%2)*0.5)/12)*W; x.fillStyle='rgba(120,118,110,0.12)'; x.fillRect(X,y0,1.2,y1-y0); } }
        // rust: streaks from the top rim, from the wind girder, from seams; grime at the foot
        const old=tk.old||1;
        streaks(x,0,W,Y(9),Math.round(170*old),8,ppmY*(1.5+old*1.5),a=>`rgba(140,72,30,${a*0.9})`,7320+b,3);
        streaks(x,0,W,Y(8.0),Math.round(70*old),6,ppmY*2.5,a=>`rgba(150,80,36,${a*0.8})`,7330+b,2.5);
        streaks(x,0,W,Y(5.5),Math.round(40*old),5,ppmY*2,a=>`rgba(120,90,60,${a*0.5})`,7340+b,2);
        for(let i=0;i<Math.round(25*old);i++){ const X=rr_()*W, yy=Y(0.6+rr_()*8); WX(W,X,30,px=>blob(x,px,yy,4+rr_()*10,`rgba(130,64,26,${0.25+rr_()*0.3})`)); }
        const gF=x.createLinearGradient(0,Y(1.2),0,Y(0.3)); gF.addColorStop(0,'rgba(90,80,62,0)'); gF.addColorStop(0.6,'rgba(90,80,62,0.35)'); gF.addColorStop(1,'rgba(50,44,36,0.65)'); x.fillStyle=gF; x.fillRect(0,Y(1.2),W,Y(0.3)-Y(1.2)+2);
        streaks(x,0,W,Y(1.0),60,4,ppmY*0.8,a=>`rgba(40,34,28,${a})`,7350+b,4);
        // painted markings (text drawn with real proportions: the band is squeezed vertically)
        const paint = (txt, deg, m, hM, col, w)=>{ const X=(1-deg/360)*W; WX(W,X,400,px=>{ x.save(); x.translate(px,Y(m)); x.scale(sx,1); fit(x,txt,0,0,hM*ppmY*4,hM*ppmY*1.25,col,w||'bold',FONT); x.restore(); }); };
        tk.at.forEach(d=>{ paint(tk.n, d, 4.1, 1.7, '#16161a'); paint(tk.p, d, 3.1, 0.7, '#a82418'); paint('SWL '+(b%2?'850':'1,000')+' m³', d, 2.45, 0.32, '#3a3a3a', 'normal'); });
        if(tk.name){ const X=(1-tk.name/360)*W; x.fillStyle='#1d3f7a'; WX(W,X,600,px=>{ x.fillRect(px-ppmX*4.2,Y(6.25),ppmX*8.4,ppmY*0.18); }); paint('RIVERSTONE', tk.name, 6.6, 0.85, '#1d3f7a'); }
        wear(x,0,top,W,256,7360+b,0.6);
      });
      return T(c,true); },
    // ---- signs atlas (1024 x 1024)
    tf_signs(){ const W=1024,H=1024,[c,x]=_cv(W,H), r=_rng(7401); x.fillStyle='#2a2a2a'; x.fillRect(0,0,W,H);
      const logo = (X,Y,s)=>{ x.save(); x.translate(X,Y); x.fillStyle='#6a6e74'; x.beginPath(); x.ellipse(0,s*0.15,s*0.42,s*0.3,0,0,7); x.fill(); x.fillStyle='#8a8e94'; x.beginPath(); x.ellipse(-s*0.08,s*0.05,s*0.25,s*0.16,0,0,7); x.fill();
        x.strokeStyle='#1d5aa8'; x.lineWidth=s*0.1; for(let k=0;k<2;k++){ x.beginPath(); for(let t=-1;t<=1.001;t+=0.1){ const px=t*s*0.5, py=-s*0.18+k*s*0.16+Math.sin(t*4)*s*0.06; t>-1?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); } x.restore(); };
      // R0: company sign
      board(x,0,0,1024,128,'#f2f0ea','#1d3f7a',6); logo(70,64,96);
      fit(x,'RIVERSTONE MARINE SERVICES LTD',560,70,860,62,'#1d3f7a','bold',FONT); fit(x,'PETROLEUM PRODUCTS STORAGE DEPOT  ·  PORT HARCOURT',560,108,820,26,'#a82418','bold',SANS); wear(x,0,0,1024,128,7402,0.8);
      // R1: gantry fascia + the barge name board
      x.fillStyle='#1d3f7a'; x.fillRect(0,128,512,128); x.fillStyle='#e8c020'; x.fillRect(0,236,512,8); logo(46,190,64);
      fit(x,'RIVERSTONE',290,186,400,46,'#f2f0ea','bold',FONT); fit(x,'TRUCK LOADING GANTRY  ·  BAYS 1 – 2',290,222,420,22,'#f2f0ea','bold',SANS);
      { const g=x.createLinearGradient(0,128,0,256); g.addColorStop(0,'#5a3220'); g.addColorStop(1,'#3a2014'); x.fillStyle=g; x.fillRect(512,128,512,128); const rr_=_rng(7403);
        for(let i=0;i<60;i++) blob(x,512+rr_()*512,128+rr_()*128,6+rr_()*30,`rgba(${rr_()<0.5?150:30},${rr_()<0.5?80:18},${rr_()<0.5?36:12},${0.2+rr_()*0.25})`);
        fit(x,'TEKENA 2',768,215,470,64,'rgba(236,232,220,0.92)','bold',FONT); fit(x,'PORT HARCOURT',768,154,300,18,'rgba(236,232,220,0.75)','bold',SANS); fit(x,'RIVERSTONE MARINE',768,246,300,14,'rgba(236,232,220,0.6)','bold',SANS);
        streaks(x,512,1024,128,50,10,90,a=>`rgba(140,70,30,${a})`,7404,3); }
      // R2: pictograms
      const P=(i,fn)=>fn(x,i*128,256,128);
      P(0,(x,X,Y,s)=>prohib(x,X,Y,s,(x,R)=>{ x.fillStyle='#1a1a1a'; x.fillRect(-R*0.6,-R*0.08,R*1.0,R*0.18); x.fillStyle='#d86a2a'; x.fillRect(R*0.42,-R*0.08,R*0.16,R*0.18); x.strokeStyle='#6a6a6a'; x.lineWidth=3; x.beginPath(); x.moveTo(R*0.5,-R*0.15); x.quadraticCurveTo(R*0.6,-R*0.45,R*0.4,-R*0.6); x.stroke(); }));
      P(1,(x,X,Y,s)=>prohib(x,X,Y,s,(x,R)=>{ x.fillStyle='#1a1a1a'; x.fillRect(-R*0.05,-R*0.1,R*0.1,R*0.7); x.fillStyle='#e8601a'; x.beginPath(); x.moveTo(0,-R*0.7); x.quadraticCurveTo(R*0.3,-R*0.35,0,-R*0.1); x.quadraticCurveTo(-R*0.3,-R*0.35,0,-R*0.7); x.fill(); }));
      P(2,(x,X,Y,s)=>prohib(x,X,Y,s,(x,R)=>{ x.fillStyle='#1a1a1a'; rr(x,-R*0.28,-R*0.55,R*0.56,R*1.1,R*0.1); x.fill(); x.fillStyle='#8ab0d0'; x.fillRect(-R*0.2,-R*0.42,R*0.4,R*0.62); }));
      P(3,(x,X,Y,s)=>mandatory(x,X,Y,s,(x,R)=>{ x.fillStyle='#f4f2ec'; x.beginPath(); x.arc(0,R*0.12,R*0.5,Math.PI,0); x.fill(); x.fillRect(-R*0.62,R*0.1,R*1.24,R*0.14); x.fillRect(-R*0.06,-R*0.38,R*0.12,R*0.5); }));
      P(4,(x,X,Y,s)=>warnTri(x,X,Y,s,(x,R)=>{ x.strokeStyle='#141414'; x.lineWidth=4; x.beginPath(); x.moveTo(0,-R*0.45); x.lineTo(0,R*0.05); x.stroke(); for(let k=0;k<3;k++){ x.beginPath(); x.moveTo(-R*(0.32-k*0.1),R*(0.08+k*0.12)); x.lineTo(R*(0.32-k*0.1),R*(0.08+k*0.12)); x.stroke(); } }));
      P(5,(x,X,Y,s)=>{ x.fillStyle='#f4f2ec'; x.fillRect(X,Y,s,s); x.save(); x.translate(X+s/2,Y+s/2); x.rotate(Math.PI/4); x.fillStyle='#c8201a'; x.fillRect(-s*0.3,-s*0.3,s*0.6,s*0.6); x.strokeStyle='#f4f2ec'; x.lineWidth=3; x.strokeRect(-s*0.26,-s*0.26,s*0.52,s*0.52); x.restore();
        x.fillStyle='#f4f2ec'; x.beginPath(); x.moveTo(X+s/2,Y+s*0.22); x.quadraticCurveTo(X+s*0.66,Y+s*0.42,X+s/2,Y+s*0.6); x.quadraticCurveTo(X+s*0.34,Y+s*0.42,X+s/2,Y+s*0.22); x.fill(); fit(x,'3',X+s/2,Y+s*0.8,20,18,'#f4f2ec','bold',SANS); });
      P(6,(x,X,Y,s)=>{ x.fillStyle='#f4f2ec'; x.fillRect(X,Y,s,s); x.strokeStyle='#c8201a'; x.lineWidth=s*0.1; x.beginPath(); x.arc(X+s/2,Y+s/2,s*0.38,0,7); x.stroke(); fit(x,'10',X+s/2,Y+s*0.64,s*0.5,s*0.42,'#141414','bold',SANS); fit(x,'km/h',X+s/2,Y+s*0.8,s*0.4,s*0.1,'#141414','bold',SANS); });
      P(7,(x,X,Y,s)=>{ x.fillStyle='#1f8a3e'; x.fillRect(X,Y,s,s); x.fillStyle='#f4f2ec'; for(let k=0;k<4;k++){ x.save(); x.translate(X+s/2,Y+s*0.45); x.rotate(k*Math.PI/2); x.beginPath(); x.moveTo(-s*0.06,-s*0.36); x.lineTo(s*0.06,-s*0.36); x.lineTo(0,-s*0.2); x.fill(); x.restore(); }
        for(const dx of [-0.12,0,0.12]){ x.beginPath(); x.arc(X+s*(0.5+dx),Y+s*0.38,s*0.04,0,7); x.fill(); x.fillRect(X+s*(0.47+dx),Y+s*0.43,s*0.06,s*0.12); } fit(x,'ASSEMBLY POINT',X+s/2,Y+s*0.9,s*0.9,s*0.11,'#f4f2ec','bold',SANS); });
      // R3: text signs
      board(x,0,384,256,128,'#1d5aa8','#f4f2ec',4); fit(x,'ALL VISITORS',128,428,220,30,'#f4f2ec','bold',SANS); fit(x,'MUST REPORT',128,462,220,30,'#f4f2ec','bold',SANS); fit(x,'TO SECURITY',128,496,220,30,'#f0c020','bold',SANS);
      board(x,256,384,256,128,'#c8201a','#f4f2ec',4); fit(x,'SWITCH OFF',384,428,220,30,'#f4f2ec','bold',SANS); fit(x,'YOUR ENGINE',384,462,220,30,'#f4f2ec','bold',SANS); fit(x,'NO PHONES · NO SMOKING',384,494,220,18,'#f4f2ec','bold',SANS);
      board(x,512,384,512,64,'#1d3f7a'); fit(x,'ADMINISTRATION',768,430,480,40,'#f2f0ea','bold',FONT);
      board(x,512,448,512,64,'#1d3f7a'); fit(x,'LABORATORY  ·  QUALITY CONTROL',768,494,480,36,'#f2f0ea','bold',FONT);
      // R4
      board(x,0,512,256,128,'#1d3f7a','#e8c020',5); fit(x,'SECURITY',128,594,220,56,'#f2f0ea','bold',FONT);
      for(const [X,t,p] of [[256,'BAY 1','AGO · DIESEL'],[512,'BAY 2','PMS · PETROL']]){ board(x,X,512,256,128,'#e8c020','#141414',5); fit(x,t,X+128,590,220,58,'#141414','bold',FONT); fit(x,p,X+128,624,200,22,'#141414','bold',SANS); }
      board(x,768,512,256,128,'#c8201a','#f4f2ec',4); fit(x,'JETTY',896,566,220,40,'#f4f2ec','bold',FONT); fit(x,'AUTHORISED',896,598,220,24,'#f4f2ec','bold',SANS); fit(x,'PERSONNEL ONLY',896,626,220,24,'#f4f2ec','bold',SANS);
      // R5: tank boards
      [['T1','AGO  ·  DIESEL','SWL 1,000 m³'],['T2','PMS  ·  PETROL','SWL 850 m³'],['T3','AGO  ·  DIESEL','SWL 1,000 m³'],['T4','DPK  ·  KEROSENE','SWL 850 m³']].forEach(([t,p,s],k)=>{ const X=k*256;
        board(x,X,640,256,128,'#e8c020','#141414',5); fit(x,'TANK',X+60,712,90,30,'#141414','bold',FONT); fit(x,t,X+170,722,130,74,'#141414','bold',FONT); fit(x,p,X+128,748,220,20,'#141414','bold',SANS); fit(x,s,X+60,688,100,14,'#3a3a3a','bold',SANS); wear(x,X,640,256,128,7410+k,1); });
      // R6
      board(x,0,768,256,128,'#c8201a','#f4f2ec',4); fit(x,'FIRE PUMP',128,822,220,40,'#f4f2ec','bold',FONT); fit(x,'HOUSE',128,862,220,34,'#f4f2ec','bold',FONT);
      board(x,256,768,256,128,'#1d3f7a','#f4f2ec',4); fit(x,'JETTY',384,822,220,40,'#f4f2ec','bold',FONT); fit(x,'CONTROL',384,862,220,34,'#f4f2ec','bold',FONT);
      { const g=x.createLinearGradient(512,768,512,896); g.addColorStop(0,'#5a3a24'); g.addColorStop(1,'#3a2414'); x.fillStyle=g; x.fillRect(512,768,256,128); x.strokeStyle='#c8a050'; x.lineWidth=4; x.strokeRect(518,774,244,116); fit(x,'RECEPTION',640,846,220,40,'#e0c070','bold',SERIF); }
      board(x,768,768,256,128,'#d8d4c8','#8a7a50',3); fit(x,'DEPOT MANAGER',896,840,220,30,'#2a2a2a','bold',SANS);
      // R7: tanker side text, haulage name, calendar, certificate, clock, UN placard
      board(x,0,896,512,64,'#f2f0ea','#c8201a',4); fit(x,'HIGHLY INFLAMMABLE',256,942,470,40,'#c8201a','bold',FONT);
      board(x,0,960,512,64,'#f2f0ea'); fit(x,'RIVERSTONE HAULAGE',256,1004,470,38,'#1d3f7a','bold',FONT);
      { const X=512, Y=896; x.fillStyle='#f4f2ec'; x.fillRect(X+8,Y+4,112,120); const g=x.createLinearGradient(0,Y+8,0,Y+56); g.addColorStop(0,'#6aa0d0'); g.addColorStop(1,'#d8b070'); x.fillStyle=g; x.fillRect(X+12,Y+8,104,48); x.fillStyle='#2a5a2a'; x.beginPath(); x.moveTo(X+12,Y+56); x.lineTo(X+40,Y+36); x.lineTo(X+70,Y+50); x.lineTo(X+116,Y+30); x.lineTo(X+116,Y+56); x.fill();
        fit(x,'DECEMBER 2026',X+64,Y+70,100,11,'#c8201a','bold',SANS); x.fillStyle='#3a3a3a'; for(let k=0;k<35;k++){ x.fillRect(X+16+(k%7)*14,Y+76+((k/7)|0)*9,8,5); } x.strokeStyle='#c8201a'; x.lineWidth=1.5; x.strokeRect(X+16+3*14-2,Y+76+9-2,12,9); }
      { const X=640, Y=896; x.fillStyle='#5a3a24'; x.fillRect(X+4,Y+8,120,112); x.fillStyle='#f4ecd8'; x.fillRect(X+12,Y+16,104,96); fit(x,'CERTIFICATE',X+64,Y+40,90,13,'#2a3a5a','bold',SERIF); fit(x,'OF OPERATION',X+64,Y+54,90,9,'#2a3a5a','bold',SERIF);
        x.fillStyle='#8a8a8a'; for(let k=0;k<4;k++) x.fillRect(X+26,Y+64+k*8,76,2); x.fillStyle='#c8a030'; x.beginPath(); x.arc(X+96,Y+98,9,0,7); x.fill(); x.fillStyle='#c8201a'; x.fillRect(X+92,Y+104,3,10); x.fillRect(X+98,Y+104,3,10); }
      { const X=768+64, Y=896+64; x.fillStyle='#1a1a1a'; x.beginPath(); x.arc(X,Y,60,0,7); x.fill(); x.fillStyle='#f4f2ec'; x.beginPath(); x.arc(X,Y,54,0,7); x.fill(); x.fillStyle='#1a1a1a';
        for(let k=0;k<12;k++){ const a=k/12*6.283; x.fillRect(X+Math.sin(a)*46-2,Y-Math.cos(a)*46-2,4,4); } fit(x,'12',X,Y-30,30,12,'#1a1a1a','bold',SANS);
        const hand=(a,L,w)=>{ x.strokeStyle='#1a1a1a'; x.lineWidth=w; x.beginPath(); x.moveTo(X,Y); x.lineTo(X+Math.sin(a)*L,Y-Math.cos(a)*L); x.stroke(); }; hand((5+40/60)/12*6.283,28,5); hand(40/60*6.283,42,3); x.strokeStyle='#c8201a'; x.lineWidth=1.5; x.beginPath(); x.moveTo(X,Y); x.lineTo(X+Math.sin(2.2)*44,Y-Math.cos(2.2)*44); x.stroke(); }
      { const X=896, Y=896; x.fillStyle='#e8701a'; x.fillRect(X+6,Y+14,116,100); x.strokeStyle='#141414'; x.lineWidth=5; x.strokeRect(X+10,Y+18,108,92); x.beginPath(); x.moveTo(X+10,Y+64); x.lineTo(X+118,Y+64); x.stroke(); fit(x,'30',X+64,Y+56,90,34,'#141414','bold',SANS); fit(x,'1202',X+64,Y+102,90,34,'#141414','bold',SANS); }
      return T(c,false); },
    // ---- boards atlas (1024 x 512): union notices, fares, the manager's whiteboard, HSE poster, QC log, waterways map
    tf_boards(){ const W=1024,H=512,[c,x]=_cv(W,H), r=_rng(7501); x.fillStyle='#2a2a2a'; x.fillRect(0,0,W,H);
      const paper=(X,Y,w,h,col,rot,lines)=>{ x.save(); x.translate(X,Y); x.rotate(rot); x.fillStyle='rgba(0,0,0,0.25)'; x.fillRect(-w/2+2,-h/2+3,w,h); x.fillStyle=col; x.fillRect(-w/2,-h/2,w,h); x.fillStyle='rgba(40,40,60,0.55)'; for(let k=0;k<lines;k++) x.fillRect(-w/2+5,-h/2+12+k*7,w*(0.5+r()*0.4),2); x.fillStyle='#c8201a'; x.beginPath(); x.arc(0,-h/2+4,2.5,0,7); x.fill(); x.restore(); };
      // union notice board
      x.fillStyle='#8a6038'; x.fillRect(0,0,256,256); N(x,256,256,6000,0.18,7502,2); x.fillStyle='#4a3020'; x.fillRect(0,0,256,8); x.fillRect(0,248,256,8); x.fillRect(0,0,8,256); x.fillRect(248,0,8,256);
      x.fillStyle='#f2f0ea'; x.fillRect(16,14,224,38); fit(x,'BOAT DRIVERS UNION',128,32,210,16,'#1d5aa8','bold',SANS); fit(x,'JETTY UNIT · RIVERSTONE WATERFRONT',128,46,210,10,'#c8201a','bold',SANS);
      paper(60,96,72,58,'#f4f2ec',-0.05,6); paper(150,92,68,64,'#f0e070',0.06,7); paper(212,110,48,70,'#f4f2ec',-0.08,8); paper(70,180,86,60,'#f4c0c8',0.04,6); paper(170,186,80,64,'#f4f2ec',-0.03,7);
      x.save(); x.translate(170,186); x.rotate(-0.03); fit(x,'NO LIFE JACKET',0,-16,74,11,'#c8201a','bold',SANS); fit(x,'NO BOARDING',0,-3,74,11,'#c8201a','bold',SANS); x.restore();
      x.save(); x.translate(212,108); x.rotate(-0.08); x.fillStyle='#8aa0b8'; x.fillRect(-18,-24,36,26); x.fillStyle='#6a4a3a'; x.beginPath(); x.arc(0,-14,6,0,7); x.fill(); x.fillRect(-9,-8,18,10); x.restore();
      // fares board (painted, green)
      x.fillStyle='#1f5a34'; x.fillRect(256,0,256,256); x.strokeStyle='#e8c020'; x.lineWidth=5; x.strokeRect(262,6,244,244); N(x,256,256,0,0,0,1);
      fit(x,'BOAT FARES',384,40,220,28,'#e8c020','bold',HAND);
      [['BONNY','N6,000'],['OKRIKA','N2,500'],['ABONNEMA','N4,000'],['DEGEMA','N4,500'],['BILLE','N3,500'],['KALABARI','N5,000']].forEach(([p,f],k)=>{ fit(x,p,276,76+k*28,120,19,'#f4f2ec','bold',HAND,'left'); fit(x,f,492,76+k*28,100,19,'#f4f2ec','bold',HAND,'right'); });
      fit(x,'LIFE JACKET A MUST!',384,244,220,15,'#f08060','bold',HAND); wear(x,256,0,256,256,7503,1.5);
      // the manager's whiteboard: tank stock (a little story in marker)
      x.fillStyle='#f6f6f2'; x.fillRect(512,0,256,256); x.fillStyle='#b8b8b8'; x.fillRect(512,0,256,5); x.fillRect(512,251,256,5);
      fit(x,'TANK STOCK  10/12',640,30,220,20,'#1a3a8a','bold',HAND);
      [['T1','AGO','612'],['T2','PMS','498'],['T3','AGO','941'],['T4','DPK','210']].forEach(([t,p,v],k)=>{ const Y=64+k*30; fit(x,t,540,Y,40,18,'#1a1a1a','bold',HAND,'left'); fit(x,p,592,Y,50,18,'#1a1a1a','bold',HAND,'left'); fit(x,v+' m3',740,Y,90,18,'#1a1a1a','bold',HAND,'right'); });
      x.strokeStyle='#c8201a'; x.lineWidth=2; x.beginPath(); x.ellipse(716,118,34,13,0,0,7); x.stroke();
      fit(x,'Gate register -> me only',640,196,220,14,'#1a3a8a','bold',HAND); fit(x,'TEKENA 2 - THURS',640,226,220,17,'#c8201a','bold',HAND);
      // HSE poster
      x.fillStyle='#f0f0ea'; x.fillRect(768,0,256,256); x.fillStyle='#1f8a3e'; x.fillRect(768,0,256,46); fit(x,'SAFETY IS',896,22,230,20,'#f4f2ec','bold',FONT); fit(x,"EVERYBODY'S BUSINESS",896,41,230,18,'#f4f2ec','bold',FONT);
      x.fillStyle='#e8c020'; x.beginPath(); x.arc(896,104,34,Math.PI,0); x.fill(); x.fillRect(856,102,80,8); x.fillStyle='#c8a010'; x.fillRect(892,72,8,30);
      ['Wear your PPE at all times','No phones near the gantry','Earth every truck','Report every spill'].forEach((t,k)=>{ x.fillStyle='#1f8a3e'; x.fillRect(782,138+k*26,8,8); fit(x,t,798,146+k*26,215,13,'#2a2a2a','bold',SANS,'left'); });
      x.fillStyle='#c8201a'; x.fillRect(768,240,256,16); fit(x,'ZERO HARM',896,253,200,12,'#f4f2ec','bold',SANS);
      // QC log (lab)
      x.fillStyle='#f6f6f2'; x.fillRect(0,256,256,256); x.fillStyle='#b8b8b8'; x.fillRect(0,256,256,5); fit(x,'QC LOG  ·  DENSITY @ 15°C',128,286,230,16,'#1a3a8a','bold',HAND);
      [['T1','0.846','OK'],['T2','0.741','OK'],['T3','0.881','??'],['T4','0.795','OK'],['TRK','0.844','OK']].forEach(([t,v,s],k)=>{ const Y=320+k*30, bad=s==='??'; fit(x,t,20,Y,50,17,'#1a1a1a','bold',HAND,'left'); fit(x,v,150,Y,80,17,bad?'#c8201a':'#1a1a1a','bold',HAND,'right'); fit(x,s,232,Y,40,17,bad?'#c8201a':'#1f8a3e','bold',HAND,'right'); });
      x.strokeStyle='#c8201a'; x.lineWidth=2; x.beginPath(); x.moveTo(12,384); x.lineTo(244,384); x.stroke();
      // waterways map
      x.save(); x.beginPath(); x.rect(256,256,256,256); x.clip();
      x.fillStyle='#e8dcc0'; x.fillRect(256,256,256,256); const rr_=_rng(7504); x.strokeStyle='#5a8ab8'; x.lineCap='round';
      for(let k=0;k<9;k++){ x.lineWidth=k<2?14:3+rr_()*5; x.beginPath(); let px=256+rr_()*256, py=256+(k<2?0:rr_()*256); x.moveTo(px,py); for(let q=0;q<6;q++){ px+=(rr_()-0.5)*90; py+=30+rr_()*30; x.lineTo(px,py); } x.stroke(); }
      x.fillStyle='rgba(90,130,70,0.35)'; for(let k=0;k<30;k++){ x.beginPath(); x.arc(256+rr_()*256,256+rr_()*256,6+rr_()*14,0,7); x.fill(); }
      [['BONNY',440,470],['OKRIKA',360,380],['PH',300,300]].forEach(([t,X,Y])=>fit(x,t,X,Y,80,14,'#3a2a1a','bold',SANS)); x.fillStyle='#c8201a'; x.beginPath(); x.arc(318,318,6,0,7); x.fill();
      x.strokeStyle='#5a3a24'; x.lineWidth=8; x.strokeRect(260,260,248,248); x.restore();
      return T(c,false); },
    // ---- dynamic: water, razor wire, bars, the flame, panoramas
    tf_water(){ const S=512,[c,x]=_cv(S,S), r=_rng(7601); x.fillStyle='#5a5e62'; x.fillRect(0,0,S,S);
      for(let i=0;i<50;i++){ const X=r()*S, Y=r()*S, a=50+r()*140, b=8+r()*20, col=r()<0.5?`rgba(120,110,120,${0.12+r()*0.15})`:`rgba(40,46,50,${0.15+r()*0.2})`; W9(S,X,Y,a,(px,py)=>{ x.fillStyle=col; x.beginPath(); x.ellipse(px,py,a,b,0,0,7); x.fill(); }); }
      for(let i=0;i<1000;i++){ const X=r()*S, Y=r()*S, L=8+r()*32, k=r(), a=k<0.08?0.35+r()*0.4:0.08+r()*0.18, bend=1.5+r()*2, lw=0.8+r()*1.4;
        const col = k<0.08 ? `rgba(255,${190+r()*40|0},${130+r()*40|0},${a})` : k<0.5 ? `rgba(${170+r()*40|0},${160+r()*40|0},${175+r()*40|0},${a})` : `rgba(30,34,38,${a})`;
        W9(S,X,Y,L,(px,py)=>{ x.strokeStyle=col; x.lineWidth=lw; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+L/2,py-bend,px+L,py); x.stroke(); }); }
      N(x,S,S,8000,0.04,7602,1.5); return T(c,true); },
    tf_waterN(){ const S=512,[c,x]=_cv(S,S), r=_rng(7611); x.fillStyle='#0b1218'; x.fillRect(0,0,S,S);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, a=50+r()*130, b=8+r()*18, col=r()<0.5?`rgba(26,40,52,${0.14+r()*0.18})`:`rgba(4,6,8,${0.18+r()*0.22})`; W9(S,X,Y,a,(px,py)=>{ x.fillStyle=col; x.beginPath(); x.ellipse(px,py,a,b,0,0,7); x.fill(); }); }
      for(let i=0;i<900;i++){ const X=r()*S, Y=r()*S, L=8+r()*30, warm=r()<0.06, a=warm?0.3+r()*0.35:0.05+r()*0.14, bend=1.5+r()*2, lw=0.8+r()*1.2;
        const col = warm ? `rgba(255,${160+r()*60|0},${80+r()*40|0},${a})` : `rgba(${100+r()*50|0},${120+r()*60|0},${150+r()*50|0},${a})`;
        W9(S,X,Y,L,(px,py)=>{ x.strokeStyle=col; x.lineWidth=lw; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+L/2,py-bend,px+L,py); x.stroke(); }); }
      N(x,S,S,8000,0.04,7612,1.5); return T(c,true); },
    tf_razor(){ const W=256,H=128,[c,x]=_cv(W,H); x.clearRect(0,0,W,H); x.strokeStyle='#e4e8ec'; x.lineWidth=2.2;
      for(let k=-1;k<3;k++){ x.beginPath(); x.ellipse(k*W/2+W/4,H/2,W*0.26,H*0.47,0.35,0,7); x.stroke(); }
      x.fillStyle='#e4e8ec'; for(let k=0;k<40;k++){ const a=k/40*6.283, X=(W/4+Math.cos(a)*W*0.26), Y=H/2+Math.sin(a)*H*0.47; x.fillRect(X-3,Y-1,6,2); x.fillRect((X+W/2)%W-3,Y-1,6,2); }
      return T(c,true); },
    tf_bars(){ const S=64,[c,x]=_cv(S,S); x.clearRect(0,0,S,S); x.fillStyle='#3a3a3a'; x.fillRect(S/2-4,0,8,S); x.fillRect(0,0,S,6); x.fillRect(0,S-6,S,6); x.fillStyle='#5a5a5a'; x.fillRect(S/2-4,0,2,S); return T(c,true); },
    tf_flame(){ const W=128,H=256,[c,x]=_cv(W,H); x.clearRect(0,0,W,H);
      let g=x.createRadialGradient(W/2,H*0.62,4,W/2,H*0.55,W*0.62); g.addColorStop(0,'rgba(255,190,90,0.55)'); g.addColorStop(1,'rgba(255,120,40,0)'); x.fillStyle=g; x.fillRect(0,0,W,H);
      const flame=(sc,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(W/2,H*(0.92)); x.bezierCurveTo(W/2-W*0.28*sc,H*0.8,W/2-W*0.2*sc,H*(0.9-0.55*sc),W/2+W*0.04,H*(0.92-0.78*sc)); x.bezierCurveTo(W/2+W*0.06*sc,H*(0.9-0.5*sc),W/2+W*0.3*sc,H*0.8,W/2,H*0.92); x.fill(); };
      flame(1.0,'rgba(255,110,30,0.85)'); flame(0.75,'rgba(255,170,60,0.95)'); flame(0.45,'rgba(255,236,170,1)');
      return T(c,false); },
    tf_pano(){ return tfPano(false); },
    tf_panoN(){ return tfPano(true); },
  });

  /* the river-mouth panorama: u 0 = west, 0.25 = north (river), 0.5 = east, 0.75 = south (city), v spans y -6..94 at r 96.
     Sun (dusk) at u 0.05, 15 deg; the gas flare across the river at u 0.328. */
  function tfPano(night){
    const W=4096, H=1024, [c,x]=_cv(W,H), r=_rng(night?7711:7701);
    const Yv = y=>H*(1-(y+6)/100);                 // world height on the band -> canvas row
    const HZ = Yv(2.5), WL = Yv(-0.6);              // horizon (eye ~2.5 m), the waterline of the 3D river
    const U = deg=>((deg+180)/360)*W;               // azimuth a (atan2(z,x), degrees) -> canvas x
    // sky
    const g=x.createLinearGradient(0,0,0,HZ);
    if(night){ g.addColorStop(0,'#05070e'); g.addColorStop(0.55,'#0c1220'); g.addColorStop(0.85,'#1e1c2a'); g.addColorStop(1,'#3a2a2a'); }
    else { g.addColorStop(0,'#7f90b4'); g.addColorStop(0.45,'#a8aec2'); g.addColorStop(0.75,'#d8b8a8'); g.addColorStop(0.93,'#eab890'); g.addColorStop(1,'#f0c8a0'); }
    x.fillStyle=g; x.fillRect(0,0,W,HZ+2);
    if(!night){
      const SX=U(-161.9), SY=Yv(2.5+96*Math.tan(15*Math.PI/180));       // the sun, west-north-west
      WX(W,SX,1600,px=>{ let rg=x.createRadialGradient(px,SY,10,px,SY,1500); rg.addColorStop(0,'rgba(255,214,150,0.65)'); rg.addColorStop(0.25,'rgba(255,170,100,0.3)'); rg.addColorStop(1,'rgba(255,150,90,0)'); x.fillStyle=rg; x.fillRect(px-1600,0,3200,HZ);
        rg=x.createRadialGradient(px,SY,4,px,SY,120); rg.addColorStop(0,'rgba(255,250,230,1)'); rg.addColorStop(0.2,'rgba(255,236,190,0.9)'); rg.addColorStop(1,'rgba(255,200,140,0)'); x.fillStyle=rg; x.fillRect(px-120,SY-120,240,240);
        x.fillStyle='#fff8ea'; x.beginPath(); x.arc(px,SY,15,0,7); x.fill(); });
      const pr=x.createLinearGradient(0,HZ-180,0,HZ); pr.addColorStop(0,'rgba(220,170,180,0)'); pr.addColorStop(1,'rgba(220,170,180,0.35)');   // pink anti-twilight haze
      x.fillStyle=pr; x.fillRect(U(-60),HZ-180,U(80)-U(-60),180);
      for(let i=0;i<46;i++){ const X=r()*W, Y=HZ*(0.25+r()*0.6), w=80+r()*340, h=4+r()*12, d=Math.min(Math.abs(X-SX),W-Math.abs(X-SX))/W;     // clouds lit from the west
        const col = d<0.15 ? `rgba(255,${170+r()*40|0},${120+r()*30|0},${0.25+r()*0.3})` : `rgba(${190+r()*30|0},${160+r()*30|0},${170+r()*30|0},${0.18+r()*0.22})`;
        WX(W,X,w,px=>{ x.fillStyle=col; x.beginPath(); x.ellipse(px,Y,w,h,0,0,7); x.fill(); x.fillStyle='rgba(120,110,140,0.12)'; x.beginPath(); x.ellipse(px,Y+h*0.6,w*0.9,h*0.5,0,0,7); x.fill(); }); }
    } else {
      for(let i=0;i<500;i++){ const X=r()*W, Y=Math.pow(r(),1.6)*HZ*0.7, a=r(); x.fillStyle=`rgba(230,235,255,${0.15+a*0.5})`; x.fillRect(X,Y,a<0.93?1.2:2,a<0.93?1.2:2); }
      for(const [cx,s] of [[U(90),1.0],[U(30),0.5],[U(150),0.6],[U(-62),0.9]]) WX(W,cx,900,px=>{ x.save(); x.translate(px,HZ); x.scale(4,1); const rg=x.createRadialGradient(0,0,4,0,0,220); rg.addColorStop(0,`rgba(220,120,60,${0.45*s})`); rg.addColorStop(1,'rgba(220,120,60,0)'); x.fillStyle=rg; x.fillRect(-230,-220,460,230); x.restore(); });
      for(let i=0;i<24;i++){ const X=r()*W, Y=HZ*(0.3+r()*0.6), w=100+r()*300, h=5+r()*12; WX(W,X,w,px=>{ x.fillStyle=`rgba(70,50,60,${0.2+r()*0.2})`; x.beginPath(); x.ellipse(px,Y,w,h,0,0,7); x.fill(); }); }
    }
    // the gas flare across the river (NNE): a glow over the far bank, a lattice stack
    { const FX=U(-62), top=Yv(4.0);
      WX(W,FX,900,px=>{ const rg=x.createRadialGradient(px,top,4,px,top,night?620:380); rg.addColorStop(0,night?'rgba(255,150,60,0.55)':'rgba(255,170,90,0.35)'); rg.addColorStop(0.3,night?'rgba(255,110,40,0.22)':'rgba(255,150,80,0.12)'); rg.addColorStop(1,'rgba(255,100,40,0)'); x.fillStyle=rg; x.fillRect(px-640,top-640,1280,1280);
        x.strokeStyle=night?'#0a0806':'#5a5048'; x.lineWidth=2; x.beginPath(); x.moveTo(px-5,Yv(-0.2)); x.lineTo(px,top); x.lineTo(px+5,Yv(-0.2)); x.stroke(); for(let k=0;k<6;k++){ const y=Yv(-0.2)-(Yv(-0.2)-top)*k/6; x.beginPath(); x.moveTo(px-4,y); x.lineTo(px+4,y-4); x.stroke(); }
        x.fillStyle=night?'rgba(255,200,120,0.9)':'rgba(255,190,110,0.8)'; x.beginPath(); x.ellipse(px,top-4,3,6,0,0,7); x.fill(); }); }
    // far bank: mangrove line north (u 0.08..0.42), with jetties and a few tanks; the city south (u 0.55..0.95)
    const bankY = X=>HZ-6+3*Math.sin(X*0.004)+2*Math.sin(X*0.017+1.1)+1.5*Math.sin(X*0.05);
    x.fillStyle=night?'#06080a':'#4a5250'; x.beginPath(); x.moveTo(0,HZ+4); for(let X=0;X<=W;X+=6) x.lineTo(X,bankY(X)); x.lineTo(W,HZ+4); x.closePath(); x.fill();
    for(let i=0;i<260;i++){ const X=r()*W, R0=4+r()*10; WX(W,X,R0,px=>{ x.fillStyle=night?'#05070a':`rgb(${66+r()*14|0},${76+r()*12|0},${70+r()*10|0})`; x.beginPath(); x.arc(px,bankY(px)+2,R0,Math.PI,0); x.fill(); }); }
    const bigTanks=[[U(-20),26],[U(-12),20],[U(-4),30],[U(28),22],[U(36),18]];                                  // depots east along the river
    for(const [X,w] of bigTanks){ const yb=bankY(X)+2, h=w*0.5; x.fillStyle=night?'#0c0e12':'#b8b8b2'; x.fillRect(X-w/2,yb-h,w,h); x.fillStyle=night?'#101318':'#9a9a94'; x.beginPath(); x.moveTo(X-w/2-1,yb-h); x.lineTo(X,yb-h-4); x.lineTo(X+w/2+1,yb-h); x.fill();
      if(night){ x.fillStyle='rgba(255,60,40,0.9)'; x.fillRect(X-1,yb-h-6,2.5,2.5); } }
    for(const [X,h] of [[U(10),70],[U(16),78]]){ x.strokeStyle=night?'#0a0c10':'#5a6066'; x.lineWidth=2.5; const yb=bankY(X); x.beginPath(); x.moveTo(X,yb); x.lineTo(X,yb-h); x.lineTo(X+50,yb-h+8); x.moveTo(X,yb-h); x.lineTo(X-14,yb-h+12); x.stroke(); if(night){ x.fillStyle='#ff3a2a'; x.fillRect(X-1,yb-h-3,3,3); } }   // port cranes
    for(const [X,w] of [[U(-100),60],[U(-80),44],[U(-46),70]]){ const yb=HZ+1; x.fillStyle=night?'#0a0c10':'#3a4048'; x.fillRect(X-w/2,yb-8,w,8); x.fillRect(X-w*0.2,yb-15,w*0.25,7); if(night){ x.fillStyle='rgba(255,230,180,0.9)'; x.fillRect(X-w*0.1,yb-13,2,2); x.fillRect(X+w*0.3,yb-6,2,2); } }   // ships / barges at anchor
    // west: the stilt settlement continues along the creek, mangroves behind
    const shacks=(u0,u1,n,base,scale)=>{ for(let i=0;i<n;i++){ const X=u0+r()*(u1-u0), w=(14+r()*22)*scale, h=(12+r()*10)*scale, yb=base-r()*4*scale, fy=yb-(6+r()*4)*scale;
        x.strokeStyle=night?'#050608':'#2a2420'; x.lineWidth=1.2; for(let k=0;k<4;k++){ x.beginPath(); x.moveTo(X+k*w/3,yb); x.lineTo(X+k*w/3,fy); x.stroke(); }
        x.fillStyle=night?'#08090c':`rgb(${70+r()*30|0},${58+r()*20|0},${46+r()*16|0})`; x.fillRect(X,fy-h,w,h); x.fillStyle=night?'#0c0b0c':`rgb(${110+r()*40|0},${60+r()*20|0},${36+r()*14|0})`; x.beginPath(); x.moveTo(X-3,fy-h); x.lineTo(X+w/2,fy-h-h*0.45); x.lineTo(X+w+3,fy-h); x.fill();
        if(night && r()<0.4){ x.fillStyle=`rgba(255,${180+r()*40|0},${100+r()*40|0},0.9)`; x.fillRect(X+w*0.3,fy-h*0.6,3,3); } } };
    WX(W,U(165),800,px=>{ x.fillStyle=night?'#05070a':'#3e4a40'; for(let i=0;i<40;i++){ x.beginPath(); x.arc(px-520+r()*1040,HZ-2,10+r()*26,Math.PI,0); x.fill(); } });
    { const base=HZ+3; shacks(U(-180),U(-140),46,base,1.0); shacks(U(150),U(180),34,base,1.0); shacks(U(-170),U(-150),18,base+10,1.6); }
    // south: Port Harcourt behind the road — low roofs, trees, a church spire, a mosque, water towers, power lines
    const cityBase=HZ+2;
    for(let layer=0;layer<2;layer++){ let px=U(20); while(px<U(160)){ const w=30+r()*90, h=(layer?10:16)+r()*(layer?14:26), top=cityBase-h+(layer?3:-1);
        x.fillStyle=night?(layer?'#07080c':'#0c0e14'):(layer?`rgb(${150+r()*30|0},${130+r()*30|0},${110+r()*20|0})`:`rgb(${120+r()*30|0},${112+r()*20|0},${104+r()*20|0})`); x.fillRect(px,top,w,cityBase-top+8);
        x.fillStyle=night?'#0a0b10':`rgb(${130+r()*50|0},${60+r()*30|0},${40+r()*20|0})`; x.fillRect(px-2,top-3,w+4,4);
        if(night){ for(let k=0;k<3;k++) if(r()<0.5){ x.fillStyle=r()<0.75?`rgba(255,${190+r()*50|0},${110+r()*40|0},0.9)`:'rgba(190,215,255,0.8)'; x.fillRect(px+4+r()*(w-8),top+4+r()*(h-8),2.5,2.5); } }
        else if(r()<0.35){ x.fillStyle='rgba(40,40,46,0.6)'; for(let k=0;k<3;k++) x.fillRect(px+6+k*(w/3),top+5,w/6,h*0.3); }
        px+=w+r()*20; } }
    for(let i=0;i<70;i++){ const X=U(20)+r()*(U(160)-U(20)), R0=8+r()*22; x.fillStyle=night?'#05060a':`rgb(${50+r()*20|0},${70+r()*20|0},${44+r()*14|0})`; x.beginPath(); x.arc(X,cityBase-R0*0.4,R0,Math.PI,0); x.fill(); }
    { const X=U(118); x.fillStyle=night?'#0c0e14':'#d8d4cc'; x.fillRect(X-10,cityBase-60,20,60); x.beginPath(); x.moveTo(X-12,cityBase-60); x.lineTo(X,cityBase-110); x.lineTo(X+12,cityBase-60); x.fill(); x.fillStyle=night?'#14161c':'#b8b4ac'; x.fillRect(X-1,cityBase-126,2,18); x.fillRect(X-6,cityBase-120,12,2); }   // church
    { const X=U(64); x.fillStyle=night?'#0c0e14':'#e0dcd2'; x.fillRect(X-30,cityBase-30,60,30); x.beginPath(); x.arc(X,cityBase-30,18,Math.PI,0); x.fill(); x.fillRect(X+34,cityBase-80,7,80); x.beginPath(); x.moveTo(X+33,cityBase-80); x.lineTo(X+37.5,cityBase-96); x.lineTo(X+42,cityBase-80); x.fill(); x.fillStyle=night?'#1a8a4a':'#2a8a5a'; x.beginPath(); x.arc(X,cityBase-31,17,Math.PI,0); x.fill(); }   // mosque
    for(const X of [U(42),U(140)]){ x.fillStyle=night?'#0a0b10':'#7a7a7a'; x.fillRect(X-1,cityBase-50,2,50); x.fillRect(X+8,cityBase-50,2,50); x.fillStyle=night?'#0e1016':'#5a6a8a'; x.fillRect(X-6,cityBase-66,22,18); }   // water tanks
    x.strokeStyle=night?'rgba(20,20,26,0.8)':'rgba(40,40,40,0.5)'; x.lineWidth=1; for(let k=0;k<3;k++){ x.beginPath(); for(let X=U(22);X<U(158);X+=8) x.lineTo(X,cityBase-38-k*5+Math.sin(X*0.02)*4); x.stroke(); }
    // east: the neighbour depots' tanks and a pipe rack (behind the 3D neighbour tanks)
    for(let i=0;i<9;i++){ const X=U(-28)+r()*(U(18)-U(-28)), w=30+r()*40, h=18+r()*16, yb=HZ+2; x.fillStyle=night?'#0b0d10':'#c2c2bc'; x.fillRect(X-w/2,yb-h,w,h); x.fillStyle=night?'#0e1014':'#a8a8a2'; x.beginPath(); x.moveTo(X-w/2-1,yb-h); x.lineTo(X,yb-h-5); x.lineTo(X+w/2+1,yb-h); x.fill(); if(night){ x.fillStyle='rgba(255,236,200,0.9)'; x.fillRect(X-w/2+3,yb-4,2,2); } }
    // haze over the horizon
    const hz=x.createLinearGradient(0,HZ-120,0,HZ+4); hz.addColorStop(0,night?'rgba(40,30,34,0)':'rgba(230,200,180,0)'); hz.addColorStop(1,night?'rgba(40,30,34,0.5)':'rgba(230,200,180,0.55)'); x.fillStyle=hz; x.fillRect(0,HZ-120,W,124);
    // below the horizon: river (north/west), land (south/east)
    const wg=x.createLinearGradient(0,HZ,0,H); wg.addColorStop(0,night?'#0c1218':'#8a8c90'); wg.addColorStop(1,night?'#0a0e14':'#6a6e72'); x.fillStyle=wg; x.fillRect(0,HZ+2,W,H-HZ);
    if(!night){ const SX=U(-161.9); WX(W,SX,500,px=>{ for(let i=0;i<260;i++){ const Y=HZ+3+r()*(H-HZ), L=6+r()*40; x.fillStyle=`rgba(255,${200+r()*40|0},${140+r()*40|0},${0.25+r()*0.5})`; x.fillRect(px+(r()-0.5)*(40+(Y-HZ)*3),Y,L,1.5); } }); }
    else { for(let i=0;i<500;i++){ const X=r()*W, Y=HZ+3+r()*24, warm=r()<0.8; x.fillStyle=warm?`rgba(255,${160+r()*60|0},${80+r()*40|0},${0.15+r()*0.35})`:`rgba(170,200,255,${0.1+r()*0.25})`; x.fillRect(X,Y,1.5,2+r()*7); }
      WX(W,U(-62),300,px=>{ for(let i=0;i<120;i++){ const Y=HZ+3+r()*(H-HZ); x.fillStyle=`rgba(255,${150+r()*60|0},${70+r()*40|0},${0.3+r()*0.5})`; x.fillRect(px+(r()-0.5)*(30+(Y-HZ)*2),Y,4+r()*14,1.5); } }); }
    x.fillStyle=night?'#06080c':'#4a4842'; x.fillRect(U(20),HZ+2,U(160)-U(20),H-HZ); x.fillRect(U(-30),HZ+2,U(18)-U(-30),H-HZ);
    return T(c,false); }

  /* ================== THE DG'S SUITE · NACECA HQ, Abuja (ab_) ================== */
  // straight-grained wood into a rect (vertical or horizontal grain)
  const woodGrain = (x, X0, Y0, w, h, vert, seed, base, a)=>{ const rg=_rng(seed); a=a||1; x.save(); x.beginPath(); x.rect(X0,Y0,w,h); x.clip(); x.fillStyle=base; x.fillRect(X0,Y0,w,h);
    const n=Math.max(8,(vert?w:h)*0.5);
    for(let i=0;i<n;i++){ const p=(vert?X0:Y0)+rg()*(vert?w:h), al=(0.04+rg()*0.1)*a, dark=rg()<0.62; x.strokeStyle=dark?`rgba(28,10,3,${al})`:`rgba(160,90,48,${al*0.8})`; x.lineWidth=0.6+rg()*2.2; x.beginPath();
      if(vert){ let q=p; x.moveTo(q,Y0); for(let t=Y0;t<=Y0+h+40;t+=40){ q+=(rg()-0.5)*2.2; x.lineTo(q,t); } } else { let q=p; x.moveTo(X0,q); for(let t=X0;t<=X0+w+40;t+=40){ q+=(rg()-0.5)*2.2; x.lineTo(t,q); } }
      x.stroke(); }
    if(vert) for(let k=0;k<2;k++){ const cx=X0+w*(0.3+rg()*0.4), cy=Y0+h*(0.25+rg()*0.5); for(let q=1;q<7;q++){ x.strokeStyle=`rgba(32,12,4,${(0.05+rg()*0.05)*a})`; x.lineWidth=1.3; x.beginPath(); x.ellipse(cx,cy,w*0.035*q,h*0.03*q,0,0,7); x.stroke(); } }
    x.restore(); };
  const bevel = (x, X0, Y0, w, h, b)=>{ x.fillStyle='rgba(255,214,176,0.11)'; x.beginPath(); x.moveTo(X0,Y0); x.lineTo(X0+w,Y0); x.lineTo(X0+w-b,Y0+b); x.lineTo(X0+b,Y0+b); x.lineTo(X0+b,Y0+h-b); x.lineTo(X0,Y0+h); x.closePath(); x.fill();
    x.fillStyle='rgba(18,6,0,0.3)'; x.beginPath(); x.moveTo(X0+w,Y0); x.lineTo(X0+w,Y0+h); x.lineTo(X0,Y0+h); x.lineTo(X0+b,Y0+h-b); x.lineTo(X0+w-b,Y0+h-b); x.lineTo(X0+w-b,Y0+b); x.closePath(); x.fill(); };
  // the agency shield (gold on navy), centred at X,Y, height s
  const shield = (x, X, Y, s, gold, ink)=>{ x.save(); x.translate(X,Y); x.strokeStyle=gold; x.lineWidth=s*0.07; x.beginPath(); x.moveTo(-s*0.36,-s*0.42); x.lineTo(0,-s*0.5); x.lineTo(s*0.36,-s*0.42); x.lineTo(s*0.36,s*0.02); x.quadraticCurveTo(s*0.34,s*0.32,0,s*0.5); x.quadraticCurveTo(-s*0.34,s*0.32,-s*0.36,s*0.02); x.closePath(); x.stroke();
    x.fillStyle=gold; x.beginPath(); x.arc(0,-s*0.24,s*0.05,0,7); x.fill(); fit(x,'NACECA',0,s*0.06,s*0.66,s*0.2,gold,'bold',SANS); x.strokeStyle=gold; x.lineWidth=s*0.035; x.beginPath(); x.moveTo(-s*0.14,s*0.17); x.lineTo(0,s*0.25); x.lineTo(s*0.14,s*0.17); x.stroke(); x.restore(); };
  // tiny people for photographs: a figure seen at a distance (no faces at this scale)
  const figure = (x, X, Yb, h, body, head)=>{ x.fillStyle=body; rr(x,X-h*0.13,Yb-h*0.78,h*0.26,h*0.5,h*0.05); x.fill(); x.fillRect(X-h*0.11,Yb-h*0.32,h*0.09,h*0.32); x.fillRect(X+h*0.02,Yb-h*0.32,h*0.09,h*0.32); x.fillStyle=head||'#4a2c1c'; x.beginPath(); x.arc(X,Yb-h*0.88,h*0.1,0,7); x.fill(); };

  // A painted photograph / picture in a cell
  function abPhoto(x, X, Y, w, h, kind, seed){ const r=_rng(seed); x.save(); x.beginPath(); x.rect(X,Y,w,h); x.clip();
    const sky=(c0,c1,hz)=>{ const g=x.createLinearGradient(0,Y,0,Y+h*hz); g.addColorStop(0,c0); g.addColorStop(1,c1); x.fillStyle=g; x.fillRect(X,Y,w,h*hz+1); };
    if(kind==='building'){ sky('#4a88c8','#c0d8ea',0.7); x.fillStyle='#5a8a3a'; x.fillRect(X,Y+h*0.7,w,h*0.3); x.fillStyle='#b8b4ac'; x.fillRect(X+w*0.3,Y+h*0.78,w*0.4,h*0.22);
      x.fillStyle='#d8d4cc'; x.fillRect(X+w*0.22,Y+h*0.18,w*0.56,h*0.56); for(let k=0;k<8;k++){ x.fillStyle=k%2?'#2a4a7a':'#3a5a8a'; x.fillRect(X+w*0.24,Y+h*(0.21+k*0.065),w*0.52,h*0.04); }
      x.fillStyle='#1d3f7a'; x.fillRect(X+w*0.22,Y+h*0.16,w*0.56,h*0.03); for(const [fx,cols] of [[0.12,['#008751','#f4f4f0','#008751']],[0.86,['#16224a','#16224a','#c8a040']]]){ x.fillStyle='#e0e0e0'; x.fillRect(X+w*fx,Y+h*0.3,2,h*0.45); cols.forEach((cc,k)=>{ x.fillStyle=cc; x.fillRect(X+w*fx+2+k*w*0.025,Y+h*0.3,w*0.025,h*0.09); }); } }
    else if(kind==='group'){ x.fillStyle='#16224a'; x.fillRect(X,Y,w,h); fit(x,'NACECA PASSING-OUT PARADE 2024',X+w/2,Y+h*0.16,w*0.9,h*0.09,'#e8c050','bold',SANS); shield(x,X+w*0.5,Y+h*0.34,h*0.2,'#e8c050');
      x.fillStyle='#c8c4bc'; x.fillRect(X,Y+h*0.62,w,h*0.38); for(let row=0;row<3;row++){ const n=11-row, hh=h*(0.3+row*0.04); for(let k=0;k<n;k++) figure(x,X+w*(0.07+k*(0.86/(n-1))),Y+h*(0.78+row*0.09),hh,row===2?'#2a2a30':'#1d2e5a',r()<0.5?'#3a2214':'#5a3424'); } }
    else if(kind==='handshake'){ x.fillStyle='#1e2a4a'; x.fillRect(X,Y,w,h); shield(x,X+w*0.5,Y+h*0.3,h*0.36,'#c8a040'); x.fillStyle='#6a4a2a'; x.fillRect(X,Y+h*0.82,w,h*0.18);
      figure(x,X+w*0.38,Y+h*0.98,h*0.62,'#2a2a30','#3a2214'); figure(x,X+w*0.62,Y+h*0.98,h*0.62,'#1a3a6a','#4a2c1c'); x.fillStyle='#3a2214'; x.fillRect(X+w*0.42,Y+h*0.56,w*0.16,h*0.04); x.fillStyle='#f0ece0'; x.fillRect(X+w*0.47,Y+h*0.68,w*0.06,h*0.08); }
    else if(kind==='aerial'){ x.fillStyle='#5a7a3a'; x.fillRect(X,Y,w,h); for(let i=0;i<70;i++){ x.fillStyle=r()<0.5?'#d8d0c0':'#b8b0a4'; x.fillRect(X+r()*w,Y+h*0.25+r()*h*0.75,4+r()*14,3+r()*8); }
      x.strokeStyle='#9a968e'; x.lineWidth=3; for(let k=0;k<4;k++){ x.beginPath(); x.moveTo(X,Y+h*(0.35+k*0.18)); x.lineTo(X+w,Y+h*(0.3+k*0.2)); x.stroke(); } sky('#8ab0d0','#c8d0c8',0.25);
      x.fillStyle='#6a6660'; x.beginPath(); x.moveTo(X+w*0.55,Y+h*0.3); x.quadraticCurveTo(X+w*0.62,Y+h*0.08,X+w*0.75,Y+h*0.1); x.quadraticCurveTo(X+w*0.86,Y+h*0.12,X+w*0.92,Y+h*0.3); x.fill(); }
    else if(kind==='trophy'){ x.fillStyle='#3a1e14'; x.fillRect(X,Y,w,h); x.fillStyle='#1d3f7a'; x.fillRect(X,Y+h*0.7,w,h*0.3); const g=x.createLinearGradient(X+w*0.4,0,X+w*0.6,0); g.addColorStop(0,'#8a6a20'); g.addColorStop(0.5,'#f0d070'); g.addColorStop(1,'#8a6a20'); x.fillStyle=g;
      x.beginPath(); x.moveTo(X+w*0.36,Y+h*0.18); x.lineTo(X+w*0.64,Y+h*0.18); x.quadraticCurveTo(X+w*0.62,Y+h*0.45,X+w*0.52,Y+h*0.5); x.lineTo(X+w*0.52,Y+h*0.6); x.lineTo(X+w*0.58,Y+h*0.66); x.lineTo(X+w*0.42,Y+h*0.66); x.lineTo(X+w*0.48,Y+h*0.6); x.lineTo(X+w*0.48,Y+h*0.5); x.quadraticCurveTo(X+w*0.38,Y+h*0.45,X+w*0.36,Y+h*0.18); x.fill();
      x.fillStyle='#2a1a10'; x.fillRect(X+w*0.38,Y+h*0.66,w*0.24,h*0.06); fit(x,'ANTI-CORRUPTION AWARD',X+w/2,Y+h*0.86,w*0.8,h*0.08,'#e8c050','bold',SANS); }
    else if(kind==='hall'){ x.fillStyle='#2a2420'; x.fillRect(X,Y,w,h); x.fillStyle='#16224a'; x.fillRect(X+w*0.25,Y+h*0.08,w*0.5,h*0.3); shield(x,X+w*0.5,Y+h*0.23,h*0.22,'#c8a040'); x.fillStyle='#5a3a24'; x.fillRect(X+w*0.1,Y+h*0.42,w*0.8,h*0.06);
      for(let row=0;row<5;row++) for(let k=0;k<14;k++){ x.fillStyle=r()<0.7?'#1a1210':'#2a1e18'; x.beginPath(); x.arc(X+w*(0.04+k*0.07)+row*3,Y+h*(0.58+row*0.09),h*(0.03+row*0.006),0,7); x.fill(); x.fillStyle=['#1d3f7a','#e8e4d8','#2a6a3a','#8a1e1e'][(r()*4)|0]; x.fillRect(X+w*(0.04+k*0.07)+row*3-h*0.04,Y+h*(0.6+row*0.09),h*0.08,h*0.06); } }
    else if(kind==='seized'){ x.fillStyle='#16224a'; x.fillRect(X,Y,w,h*0.5); fit(x,'NACECA · EXHIBITS',X+w/2,Y+h*0.2,w*0.8,h*0.1,'#e8c050','bold',SANS); x.fillStyle='#e8e4dc'; x.fillRect(X,Y+h*0.5,w,h*0.5);
      for(let k=0;k<18;k++){ x.fillStyle=r()<0.6?'#5a7a4a':'#8a5a3a'; x.fillRect(X+w*(0.05+(k%9)*0.1),Y+h*(0.56+((k/9)|0)*0.1),w*0.08,h*0.08); x.fillStyle='rgba(255,255,255,0.4)'; x.fillRect(X+w*(0.05+(k%9)*0.1)+w*0.035,Y+h*(0.56+((k/9)|0)*0.1),w*0.01,h*0.08); }
      for(let k=0;k<7;k++){ x.fillStyle='#1a1a1a'; rr(x,X+w*(0.08+k*0.12),Y+h*0.8,w*0.06,h*0.12,2); x.fill(); x.fillStyle='#3a5a8a'; x.fillRect(X+w*(0.085+k*0.12),Y+h*0.81,w*0.05,h*0.08); } }
    else if(kind==='landscape'){ sky('#e8b070','#f0d8a8',0.55); x.fillStyle='#f8e8b8'; x.beginPath(); x.arc(X+w*0.7,Y+h*0.35,h*0.08,0,7); x.fill();
      for(let k=0;k<3;k++){ x.fillStyle=['#8a7a8a','#6a6a5a','#4a5a34'][k]; x.beginPath(); x.moveTo(X,Y+h*(0.5+k*0.08)); for(let t=0;t<=1.001;t+=0.05) x.lineTo(X+w*t,Y+h*(0.5+k*0.08)-h*(0.1+0.08*Math.sin(t*(4+k)+k*2))*(1-k*0.2)); x.lineTo(X+w,Y+h); x.lineTo(X,Y+h); x.fill(); }
      x.fillStyle='#c89a50'; x.fillRect(X,Y+h*0.78,w,h*0.22); for(let i=0;i<220;i++){ x.fillStyle=`rgba(${120+r()*80|0},${80+r()*60|0},${30+r()*30|0},0.5)`; x.fillRect(X+r()*w,Y+h*(0.74+r()*0.26),1+r()*3,3+r()*6); }
      for(let k=0;k<4;k++){ const tx=X+w*(0.1+r()*0.8), ty=Y+h*(0.72+r()*0.1); x.fillStyle='#2a3a1a'; x.fillRect(tx-1,ty,2,h*0.08); x.beginPath(); x.ellipse(tx,ty,h*0.08,h*0.035,0,0,7); x.fill(); }
      for(let i=0;i<500;i++){ x.fillStyle=`rgba(${r()*255|0},${r()*200|0},${r()*120|0},0.05)`; x.fillRect(X+r()*w,Y+r()*h,3+r()*6,2); } }
    else if(kind==='rock'){ sky('#7aa8d8','#d8e4ea',0.6); x.fillStyle='#7a7466'; x.beginPath(); x.moveTo(X+w*0.15,Y+h*0.68); x.quadraticCurveTo(X+w*0.2,Y+h*0.18,X+w*0.5,Y+h*0.16); x.quadraticCurveTo(X+w*0.8,Y+h*0.16,X+w*0.86,Y+h*0.68); x.fill();
      for(let k=0;k<20;k++){ x.fillStyle=`rgba(40,36,30,${0.15+r()*0.2})`; x.fillRect(X+w*(0.22+r()*0.6),Y+h*(0.2+r()*0.2),2,h*(0.2+r()*0.25)); }
      x.fillStyle='#4a6a2a'; x.fillRect(X,Y+h*0.66,w,h*0.34); for(let i=0;i<40;i++){ x.fillStyle=r()<0.5?'#3a5a22':'#5a7a32'; x.beginPath(); x.arc(X+r()*w,Y+h*(0.66+r()*0.2),3+r()*8,0,7); x.fill(); }
      x.fillStyle='#b8a888'; x.fillRect(X,Y+h*0.86,w,h*0.14); }
    else if(kind==='adire'){ x.fillStyle='#1a2e5a'; x.fillRect(X,Y,w,h); const cs=w/4; for(let i=0;i<4;i++) for(let j=0;j<Math.ceil(h/cs);j++){ const cx=X+i*cs+cs/2, cy=Y+j*cs+cs/2; x.strokeStyle='rgba(200,214,236,0.75)'; x.lineWidth=2;
        if((i+j)%2){ x.beginPath(); x.arc(cx,cy,cs*0.32,0,7); x.stroke(); x.beginPath(); x.arc(cx,cy,cs*0.15,0,7); x.stroke(); } else { for(let k=-2;k<=2;k++){ x.beginPath(); x.moveTo(cx-cs*0.4,cy+k*cs*0.12); x.lineTo(cx+cs*0.4,cy+k*cs*0.12); x.stroke(); } } }
      N(x,w,h,0,0,0,1); for(let i=0;i<300;i++){ x.fillStyle=`rgba(10,20,50,${0.1+r()*0.2})`; x.fillRect(X+r()*w,Y+r()*h,2+r()*4,2+r()*4); } }
    else if(kind==='beach'){ sky('#6aa8e0','#d8ecf4',0.5); x.fillStyle='#2a7aa8'; x.fillRect(X,Y+h*0.5,w,h*0.2); x.fillStyle='#e8d8a8'; x.fillRect(X,Y+h*0.7,w,h*0.3);
      x.strokeStyle='#5a4a2a'; x.lineWidth=3; x.beginPath(); x.moveTo(X+w*0.2,Y+h); x.quadraticCurveTo(X+w*0.24,Y+h*0.5,X+w*0.3,Y+h*0.25); x.stroke(); x.fillStyle='#2a6a2a'; for(let k=0;k<6;k++){ x.save(); x.translate(X+w*0.3,Y+h*0.25); x.rotate(k*1.05); x.beginPath(); x.ellipse(w*0.1,0,w*0.11,h*0.025,0,0,7); x.fill(); x.restore(); } }
    else if(kind==='flowers'){ x.fillStyle='#e8e0d0'; x.fillRect(X,Y,w,h); x.fillStyle='#3a5a8a'; rr(x,X+w*0.38,Y+h*0.6,w*0.24,h*0.32,6); x.fill(); for(let i=0;i<60;i++){ x.fillStyle=r()<0.7?'#d0306a':'#e86a9a'; x.beginPath(); x.arc(X+w*(0.25+r()*0.5),Y+h*(0.15+r()*0.45),3+r()*5,0,7); x.fill(); }
      for(let i=0;i<20;i++){ x.fillStyle='#3a6a2a'; x.beginPath(); x.ellipse(X+w*(0.3+r()*0.4),Y+h*(0.3+r()*0.3),5,2.5,r()*3,0,7); x.fill(); } }
    else if(kind==='event'){ x.fillStyle='#e8e4dc'; x.fillRect(X,Y,w,h); x.fillStyle='#16224a'; x.fillRect(X,Y,w,h*0.42); shield(x,X+w*0.22,Y+h*0.21,h*0.3,'#e8c050'); fit(x,'CYBERCRIME SUMMIT · ABUJA',X+w*0.62,Y+h*0.24,w*0.6,h*0.1,'#f0ece0','bold',SANS);
      x.fillStyle='#5a3a24'; x.fillRect(X+w*0.44,Y+h*0.5,w*0.12,h*0.3); figure(x,X+w*0.5,Y+h*0.62,h*0.3,'#1a1a1a','#3a2214'); for(let k=0;k<12;k++){ x.fillStyle='#1a1210'; x.beginPath(); x.arc(X+w*(0.05+k*0.08),Y+h*0.92,h*0.05,0,7); x.fill(); } }
    else if(kind==='hqdusk'){ sky('#2a3a6a','#e8a070',0.75); x.fillStyle='#2a2a30'; x.fillRect(X+w*0.25,Y+h*0.2,w*0.5,h*0.62); for(let k=0;k<9;k++) for(let j=0;j<8;j++){ x.fillStyle=r()<0.6?'#ffd890':'#3a3a48'; x.fillRect(X+w*(0.28+j*0.058),Y+h*(0.24+k*0.064),w*0.04,h*0.04); }
      x.fillStyle='#1a1a1a'; x.fillRect(X,Y+h*0.82,w,h*0.18); fit(x,'NACECA HQ',X+w/2,Y+h*0.95,w*0.5,h*0.09,'#e8c050','bold',SANS); }
    // print sheen + vignette
    const vg=x.createRadialGradient(X+w/2,Y+h/2,Math.min(w,h)*0.3,X+w/2,Y+h/2,Math.max(w,h)*0.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.25)'); x.fillStyle=vg; x.fillRect(X,Y,w,h);
    x.restore(); }

  function abCert(x, X, Y, w, h, title, sub, seed){ const r=_rng(seed); x.fillStyle='#f4ecd8'; x.fillRect(X,Y,w,h); x.strokeStyle='#b8902a'; x.lineWidth=4; x.strokeRect(X+6,Y+6,w-12,h-12); x.strokeStyle='#1d3f7a'; x.lineWidth=1.5; x.strokeRect(X+12,Y+12,w-24,h-24);
    shield(x,X+w/2,Y+h*0.2,h*0.16,'#b8902a'); fit(x,title,X+w/2,Y+h*0.42,w*0.8,h*0.1,'#1d3f7a','bold',SERIF); fit(x,sub,X+w/2,Y+h*0.52,w*0.75,h*0.055,'#5a4a3a','italic',SERIF);
    x.fillStyle='rgba(60,50,40,0.5)'; for(let k=0;k<4;k++) x.fillRect(X+w*0.18,Y+h*(0.6+k*0.05),w*(0.5+r()*0.14),1.5);
    x.fillStyle='#c8202a'; x.beginPath(); x.arc(X+w*0.78,Y+h*0.8,h*0.07,0,7); x.fill(); x.fillStyle='#b8902a'; x.beginPath(); x.arc(X+w*0.78,Y+h*0.8,h*0.045,0,7); x.fill();
    x.strokeStyle='#2a2a5a'; x.lineWidth=1.2; x.beginPath(); x.moveTo(X+w*0.2,Y+h*0.84); x.bezierCurveTo(X+w*0.26,Y+h*0.78,X+w*0.3,Y+h*0.9,X+w*0.4,Y+h*0.82); x.stroke(); }

  Object.assign(MTEX, {
    // ---- mahogany full-height panelling: tile = 3.4 m (floor at the canvas bottom), three panels per tile
    ab_panel(){ const S=1024,[c,x]=_cv(S,S), ppm=S/3.4, Y=m=>S-m*ppm, n=3, pw=S/n, st=0.08*ppm;
      woodGrain(x,0,0,S,S,true,8102,'#5a2c18');
      for(let i=0;i<n;i++){ const X0=i*pw+st/2, w=pw-st;
        for(const [y0,y1,sd] of [[1.14,2.86,1],[0.24,0.87,2]]){ const top=Y(y1), h=Y(y0)-Y(y1);
          woodGrain(x,X0,top,w,h,true,8110+i*7+sd,'#62331d'); bevel(x,X0,top,w,h,0.05*ppm);
          x.strokeStyle='rgba(14,4,0,0.6)'; x.lineWidth=2; x.strokeRect(X0+1,top+1,w-2,h-2); x.strokeStyle='rgba(210,150,100,0.2)'; x.lineWidth=1.5; x.strokeRect(X0+0.05*ppm,top+0.05*ppm,w-0.1*ppm,h-0.1*ppm); } }
      woodGrain(x,0,Y(3.24),S,Y(2.95)-Y(3.24),false,8120,'#5c2e1a'); x.fillStyle='rgba(0,0,0,0.28)'; x.fillRect(0,Y(2.95)-4,S,4);
      woodGrain(x,0,0,S,Y(3.24),false,8124,'#46200f'); x.fillStyle='rgba(255,206,160,0.14)'; x.fillRect(0,Y(3.31),S,5); x.fillStyle='rgba(0,0,0,0.32)'; x.fillRect(0,Y(3.24)-3,S,3);
      woodGrain(x,0,Y(1.07),S,Y(0.95)-Y(1.07),false,8121,'#4c2514'); x.fillStyle='rgba(255,214,176,0.18)'; x.fillRect(0,Y(1.07),S,5); x.fillStyle='rgba(0,0,0,0.38)'; x.fillRect(0,Y(0.95)-5,S,5);
      woodGrain(x,0,Y(0.16),S,Y(0)-Y(0.16),false,8122,'#3c1c0e'); x.fillStyle='rgba(255,206,160,0.16)'; x.fillRect(0,Y(0.16),S,4); x.fillStyle='rgba(0,0,0,0.35)'; x.fillRect(0,Y(0.02),S,Y(0)-Y(0.02));
      x.fillStyle='rgba(0,0,0,0.4)'; for(let i=0;i<=n;i++){ x.fillRect(i*pw-1,Y(2.95),2,Y(1.07)-Y(2.95)); x.fillRect(i*pw-1,Y(0.95),2,Y(0.16)-Y(0.95)); }
      N(x,S,S,40000,0.035,8123,1.5); return T(c,true); },
    // ---- reception walls: cream paint over a wood dado rail and skirting, moulded panels below the rail
    ab_recep(){ const S=1024,[c,x]=_cv(S,S), r=_rng(8131), ppm=S/3.4, Y=m=>S-m*ppm;
      x.fillStyle='#ebe1cc'; x.fillRect(0,0,S,S); N(x,S,S,60000,0.03,8132,2); N(x,S,S,2000,0.025,8133,10);
      let g=x.createLinearGradient(0,0,0,Y(3.0)); g.addColorStop(0,'rgba(120,96,64,0.22)'); g.addColorStop(1,'rgba(120,96,64,0)'); x.fillStyle=g; x.fillRect(0,0,S,Y(3.0));
      x.fillStyle='#f5efe0'; x.fillRect(0,0,S,Y(3.32)); x.fillStyle='rgba(0,0,0,0.14)'; x.fillRect(0,Y(3.32),S,3);
      const n=4, pw=S/n; for(let i=0;i<n;i++){ const X0=i*pw+0.09*ppm, w=pw-0.18*ppm, top=Y(0.84), h=Y(0.22)-Y(0.84);
        x.strokeStyle='rgba(255,255,248,0.75)'; x.lineWidth=3; x.strokeRect(X0+2,top+2,w,h); x.strokeStyle='rgba(96,74,44,0.38)'; x.lineWidth=2; x.strokeRect(X0,top,w,h); }
      woodGrain(x,0,Y(1.0),S,Y(0.93)-Y(1.0),false,8134,'#5a2f19'); x.fillStyle='rgba(255,220,180,0.25)'; x.fillRect(0,Y(1.0),S,3); x.fillStyle='rgba(0,0,0,0.35)'; x.fillRect(0,Y(0.93)-3,S,3);
      woodGrain(x,0,Y(0.14),S,Y(0)-Y(0.14),false,8135,'#4a2414'); x.fillStyle='rgba(255,220,180,0.2)'; x.fillRect(0,Y(0.14),S,3);
      for(let i=0;i<26;i++) sblob(x,S,r()*S,Y(0.3+r()*1.1),20+r()*60,`rgba(120,100,70,${0.02+r()*0.03})`);
      return T(c,true); },
    // ---- executive carpet: deep navy, a faint gold lattice (tile = 2 m)
    ab_carpet(){ const S=512,[c,x]=_cv(S,S), r=_rng(8141), n=8, sp=S/n;
      x.fillStyle='#252e4a'; x.fillRect(0,0,S,S); N(x,S,S,70000,0.09,8142,1.2); N(x,S,S,3000,0.05,8143,4);
      x.strokeStyle='rgba(196,164,96,0.2)'; x.lineWidth=2; for(let i=-n;i<=2*n;i++){ x.beginPath(); x.moveTo(i*sp,0); x.lineTo(i*sp+S,S); x.stroke(); x.beginPath(); x.moveTo(i*sp,0); x.lineTo(i*sp-S,S); x.stroke(); }
      x.fillStyle='rgba(214,182,112,0.38)'; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const X=i*sp, Y=j*sp; x.beginPath(); x.moveTo(X,Y-5); x.lineTo(X+5,Y); x.lineTo(X,Y+5); x.lineTo(X-5,Y); x.closePath(); x.fill(); if(i===0) { x.beginPath(); x.moveTo(S,Y-5); x.lineTo(S+5,Y); x.lineTo(S,Y+5); x.lineTo(S-5,Y); x.fill(); } }
      for(let i=0;i<40;i++) sblob(x,S,r()*S,r()*S,20+r()*60,r()<0.5?`rgba(10,14,30,${0.06+r()*0.06})`:`rgba(96,106,146,${0.04+r()*0.04})`);
      return T(c,true); },
    // ---- the rug under the sofa set (one piece; u along x, fringes at the short ends)
    ab_rug(){ const W=1024,H=768,[c,x]=_cv(W,H), r=_rng(8151), F=20;
      for(let y=0;y<H;y+=3){ x.fillStyle=`rgb(${222+r()*26|0},${206+r()*26|0},${172+r()*26|0})`; x.fillRect(0,y,F,2); x.fillRect(W-F,y,F,2); }
      const band=(m,col)=>{ x.fillStyle=col; x.fillRect(F+m,m,W-2*F-2*m,H-2*m); };
      band(0,'#1e2846'); band(12,'#c49a4c'); band(24,'#7e1f1f');
      for(let k=0;k<26;k++){ const t=k/26; for(const [X,Y] of [[F+24+t*(W-2*F-48),54],[F+24+t*(W-2*F-48),H-54]]){ x.fillStyle='#d8b060'; x.beginPath(); x.moveTo(X,Y-16); x.lineTo(X+16,Y); x.lineTo(X,Y+16); x.lineTo(X-16,Y); x.fill(); x.fillStyle='#1e2846'; x.beginPath(); x.arc(X,Y,6,0,7); x.fill(); } }
      for(let k=0;k<18;k++){ const t=k/18; for(const [X,Y] of [[F+54,24+t*(H-48)],[W-F-54,24+t*(H-48)]]){ x.fillStyle='#d8b060'; x.beginPath(); x.moveTo(X,Y-16); x.lineTo(X+16,Y); x.lineTo(X,Y+16); x.lineTo(X-16,Y); x.fill(); x.fillStyle='#1e2846'; x.beginPath(); x.arc(X,Y,6,0,7); x.fill(); } }
      band(84,'#c49a4c'); band(92,'#6a1519');
      x.fillStyle='rgba(200,150,90,0.25)'; for(let i=0;i<16;i++) for(let j=0;j<11;j++){ const X=F+130+i*(W-2*F-260)/15, Y=130+j*(H-260)/10; x.beginPath(); x.moveTo(X,Y-7); x.lineTo(X+7,Y); x.lineTo(X,Y+7); x.lineTo(X-7,Y); x.fill(); }
      const lz=(s,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(W/2,H/2-s*0.62); x.lineTo(W/2+s,H/2); x.lineTo(W/2,H/2+s*0.62); x.lineTo(W/2-s,H/2); x.closePath(); x.fill(); };
      lz(250,'#1e2846'); lz(232,'#c49a4c'); lz(214,'#8a2424'); lz(150,'#c49a4c'); lz(136,'#1e2846'); lz(70,'#d8b060'); lz(40,'#7e1f1f');
      for(const [X,Y,sx,sy] of [[F+92,92,1,1],[W-F-92,92,-1,1],[F+92,H-92,1,-1],[W-F-92,H-92,-1,-1]]){ x.fillStyle='#1e2846'; x.beginPath(); x.moveTo(X,Y); x.lineTo(X+sx*170,Y); x.quadraticCurveTo(X+sx*60,Y+sy*40,X,Y+sy*110); x.closePath(); x.fill(); x.strokeStyle='#c49a4c'; x.lineWidth=3; x.stroke(); }
      N(x,W,H,80000,0.08,8152,1.2); for(let i=0;i<30;i++) blob(x,F+r()*(W-2*F),r()*H,30+r()*90,r()<0.5?`rgba(20,10,5,${0.04+r()*0.05})`:`rgba(255,230,200,${0.03+r()*0.04})`);
      return T(c,false); },
    // ---- signs, plaques, photographs, certificates, the docket (1024 x 1024 atlas)
    ab_signs(){ const W=1024,H=1024,[c,x]=_cv(W,H), r=_rng(8161); x.fillStyle='#3a2a20'; x.fillRect(0,0,W,H);
      // R0..R1: the photo wall (seven photos + a landscape painting)
      [['building',0,0],['group',256,0],['handshake',512,0],['aerial',768,0],['trophy',0,180],['hall',256,180],['seized',512,180],['landscape',768,180]].forEach(([k,X,Y],i)=>abPhoto(x,X,Y,256,180,k,8200+i));
      // R2: certificates + the values frame
      abCert(x,0,360,200,152,'CERTIFICATE OF HONOUR','presented to the Director-General',8211); abCert(x,200,360,200,152,'ISO 37001','anti-bribery management system',8212); abCert(x,400,360,200,152,'AWARD OF MERIT','for distinguished service',8213);
      x.fillStyle='#16224a'; x.fillRect(600,360,144,200); shield(x,672,410,62,'#d8b050'); ['INTEGRITY','DILIGENCE','SERVICE'].forEach((t,k)=>fit(x,t,672,470+k*26,124,20,'#f0e6c8','bold',SERIF)); x.strokeStyle='#d8b050'; x.lineWidth=3; x.strokeRect(606,366,132,188);
      // R3: brass door plaque, the desk nameplate
      { const g=x.createLinearGradient(0,576,0,640); g.addColorStop(0,'#e8c870'); g.addColorStop(0.5,'#b8902a'); g.addColorStop(1,'#d8b450'); x.fillStyle=g; x.fillRect(0,576,512,64); x.strokeStyle='#7a5a14'; x.lineWidth=3; x.strokeRect(4,580,504,56);
        fit(x,'DIRECTOR-GENERAL',256,620,470,36,'#2a1c08','bold',SERIF); }
      x.fillStyle='#141414'; x.fillRect(512,576,512,64); x.strokeStyle='#c8a040'; x.lineWidth=2; x.strokeRect(516,580,504,56); fit(x,'DIRECTOR-GENERAL',768,619,470,36,'#e0c060','bold',SERIF);
      // R4: the docket cover, Kuti's nameplate, PROTOCOL and RECORDS plaques
      { const X=0, Y=640; x.fillStyle='#d2b47a'; x.fillRect(X,Y,128,96); N(x,128,96,0,0,0,1); x.fillStyle='#1d3f7a'; fit(x,'NACECA',X+64,Y+20,110,14,'#1d3f7a','bold',SANS); fit(x,'OFFICE OF THE DG',X+64,Y+32,110,8,'#1d3f7a','bold',SANS);
        x.fillStyle='rgba(30,30,30,0.6)'; x.fillRect(X+14,Y+44,100,1.5); fit(x,'FILE: NC/DG/26/0417',X+64,Y+56,110,9,'#2a2a2a','bold',SANS); fit(x,'FOR THE DG — BY HAND',X+64,Y+68,110,8,'#2a2a2a','bold',HAND);
        x.save(); x.translate(X+70,Y+82); x.rotate(-0.12); x.strokeStyle='#c0201a'; x.lineWidth=2; x.strokeRect(-46,-10,92,18); fit(x,'CONFIDENTIAL',0,4,86,12,'#c0201a','bold',SANS); x.restore(); }
      x.fillStyle='#e8e2d2'; x.fillRect(256,640,256,48); x.strokeStyle='#8a7a5a'; x.lineWidth=2; x.strokeRect(258,642,252,44); fit(x,'A. KUTI',384,664,230,20,'#1a1a1a','bold',SERIF); fit(x,'PERSONAL ASSISTANT TO THE DG',384,680,230,10,'#5a4a3a','bold',SANS);
      for(const [Y,t] of [[640,'PROTOCOL'],[704,'RECORDS']]){ const g=x.createLinearGradient(0,Y,0,Y+64); g.addColorStop(0,'#e8c870'); g.addColorStop(0.5,'#b8902a'); g.addColorStop(1,'#d8b450'); x.fillStyle=g; x.fillRect(512,Y,256,64); x.strokeStyle='#7a5a14'; x.lineWidth=2; x.strokeRect(515,Y+3,250,58); fit(x,t,640,Y+44,220,32,'#2a1c08','bold',SERIF); }
      // R5..R7: paintings, photos, the small crest plaque, standing photo frames, the clock
      abPhoto(x,0,768,256,172,'rock',8221); abPhoto(x,256,768,144,192,'adire',8222); abPhoto(x,400,768,200,132,'hqdusk',8223); abPhoto(x,600,768,200,132,'event',8224);
      x.fillStyle='#16224a'; x.fillRect(800,768,224,124); shield(x,912,826,96,'#d8b050');
      abPhoto(x,400,900,128,100,'beach',8225); abPhoto(x,528,900,96,124,'flowers',8226); abPhoto(x,624,900,144,110,'building',8227);
      { const X=768+64, Y=896+64; x.fillStyle='#b8902a'; x.beginPath(); x.arc(X,Y,62,0,7); x.fill(); x.fillStyle='#f6f2e8'; x.beginPath(); x.arc(X,Y,55,0,7); x.fill(); x.fillStyle='#1a1a1a';
        for(let k=0;k<12;k++){ const a=k/12*6.283; x.fillRect(X+Math.sin(a)*46-2,Y-Math.cos(a)*46-2,4,4); } fit(x,'XII',X,Y-30,30,11,'#1a1a1a','bold',SERIF);
        const hand=(a,L,w)=>{ x.strokeStyle='#1a1a1a'; x.lineWidth=w; x.beginPath(); x.moveTo(X,Y); x.lineTo(X+Math.sin(a)*L,Y-Math.cos(a)*L); x.stroke(); }; hand((10+40/60)/12*6.283,28,5); hand(40/60*6.283,42,3); }
      return T(c,false); },
    // ---- box files and lever-arch files on the records shelves (tile = 3 m of shelf)
    ab_files(){ const W=1024,H=256,[c,x]=_cv(W,H), r=_rng(8171); x.fillStyle='#17140f'; x.fillRect(0,0,W,H);
      let X=0; while(X<W){ const lever=r()<0.6, w=lever?26+r()*16:42+r()*28, h=H*(0.74+r()*0.2), top=H-h;
        const col = lever ? ['#2a4a8a','#1a1a1a','#8a1e1e','#2a6a3a','#5a5a5a','#2a4a8a'][(r()*6)|0] : ['#d4bc86','#c8a868','#b89870'][(r()*3)|0];
        x.fillStyle=col; x.fillRect(X,top,w-1.5,h); x.fillStyle='rgba(242,238,226,0.92)'; x.fillRect(X+w*0.18,top+h*0.1,w*0.62,h*0.3);
        x.fillStyle='rgba(30,30,30,0.7)'; for(let k=0;k<3;k++) x.fillRect(X+w*0.24,top+h*0.14+k*h*0.07,w*0.5*(0.5+r()*0.5),2);
        if(lever){ x.fillStyle='rgba(0,0,0,0.5)'; x.beginPath(); x.arc(X+w/2,top+h*0.7,w*0.16,0,7); x.fill(); }
        x.fillStyle='rgba(255,255,255,0.09)'; x.fillRect(X,top,2,h); x.fillStyle='rgba(0,0,0,0.32)'; x.fillRect(X+w-4,top,2.5,h);
        X+=w; if(r()<0.07){ const lw=14+r()*30; x.save(); x.translate(X+lw/2,H); x.rotate(-0.25); x.fillStyle=['#c8a868','#2a4a8a'][(r()*2)|0]; x.fillRect(-lw/2,-H*0.8,lw*0.8,H*0.8); x.restore(); X+=lw; } }
      return T(c,true); },
    // ---- flags: Nigeria (hoist at the left) and the agency's flag
    ab_flags(){ const W=1024,H=512,[c,x]=_cv(W,H), r=_rng(8181), w=512, h=341; x.fillStyle='#202020'; x.fillRect(0,0,W,H);
      x.fillStyle='#008751'; x.fillRect(0,0,w/3,h); x.fillStyle='#f6f6f2'; x.fillRect(w/3,0,w/3,h); x.fillStyle='#008751'; x.fillRect(2*w/3,0,w/3,h);
      x.fillStyle='#16224a'; x.fillRect(512,0,512,h); shield(x,768,150,190,'#d8b050'); fit(x,'NATIONAL ANTI-CORRUPTION & ECONOMIC CRIMES AGENCY',768,300,470,18,'#d8b050','bold',SANS);
      x.fillStyle='#d8b050'; x.fillRect(512,h-10,512,10); x.fillRect(0,h-10,512,10);
      for(let k=0;k<1024;k+=1){ const s=Math.sin(k/1024*Math.PI*14)*0.5+0.5; x.fillStyle=`rgba(${s>0.5?255:0},${s>0.5?255:0},${s>0.5?255:0},${Math.abs(s-0.5)*0.12})`; x.fillRect(k,0,1,h); }
      N(x,W,h,20000,0.05,8182,1.5); return T(c,false); },
  });

  /* screens (unlit, MGLOWTEX ab_screen): the reception TV, the PA's and the DG's monitors, the DG's TV */
  function abScreens(){ const W=1024,H=512,[c,x]=_cv(W,H), r=_rng(8191); x.fillStyle='#06080c'; x.fillRect(0,0,W,H);
    // reception TV (0,0,512,288): the city at noon + lower third + ticker
    { const X=0,Y=0,w=512,h=288; const g=x.createLinearGradient(0,Y,0,Y+h*0.6); g.addColorStop(0,'#5a90d0'); g.addColorStop(1,'#c8dcec'); x.fillStyle=g; x.fillRect(X,Y,w,h);
      for(let i=0;i<14;i++){ const bx_=X+r()*w, bw=20+r()*40, bh=40+r()*110; x.fillStyle=`rgb(${60+r()*40|0},${90+r()*40|0},${120+r()*40|0})`; x.fillRect(bx_,Y+h*0.62-bh,bw,bh); x.fillStyle='rgba(255,255,255,0.25)'; for(let k=0;k<bh/8;k++) x.fillRect(bx_+2,Y+h*0.62-bh+k*8+2,bw-4,1.5); }
      x.fillStyle='#4a6a3a'; x.fillRect(X,Y+h*0.62,w,h*0.38);
      x.fillStyle='#b8141a'; x.fillRect(X,Y+h*0.66,w*0.3,h*0.09); fit(x,'BREAKING',X+w*0.15,Y+h*0.73,w*0.26,h*0.06,'#ffffff','bold',SANS);
      x.fillStyle='rgba(10,20,50,0.92)'; x.fillRect(X,Y+h*0.75,w,h*0.14); fit(x,"NACECA DG: 'NO HIDING PLACE FOR ECONOMIC SABOTEURS'",X+w*0.5,Y+h*0.84,w*0.94,h*0.06,'#ffffff','bold',SANS);
      x.fillStyle='#e8c020'; x.fillRect(X,Y+h*0.89,w,h*0.11); x.save(); x.beginPath(); x.rect(X,Y+h*0.89,w,h*0.11); x.clip(); fit(x,'ABUJA 31°C SUNNY  ·  NAIRA STEADY  ·  FEC MEETS TODAY  ·  LAGOS–IBADAN: HEAVY TRAFFIC',X+6,Y+h*0.97,w*1.5,h*0.055,'#141414','bold',SANS,'left'); x.restore();
      x.fillStyle='#ffffff'; fit(x,'NEWS 247',X+w*0.88,Y+h*0.1,w*0.2,h*0.06,'#ffffff','bold',FONT); x.fillStyle='#c8141a'; x.fillRect(X+w*0.8,Y+h*0.12,w*0.05,h*0.04); fit(x,'LIVE',X+w*0.825,Y+h*0.155,w*0.05,h*0.035,'#ffffff','bold',SANS); }
    // the PA's monitor (512,0,768,144): mail + calendar
    { const X=512,Y=0,w=256,h=144; x.fillStyle='#f2f4f8'; x.fillRect(X,Y,w,h); x.fillStyle='#1d4f9a'; x.fillRect(X,Y,w,14); fit(x,'Mail — Office of the DG',X+6,Y+10,140,8,'#ffffff','bold',SANS,'left');
      x.fillStyle='#e2e6ee'; x.fillRect(X,Y+14,46,h-14); for(let k=0;k<6;k++){ x.fillStyle=k===0?'#c8d8f0':'transparent'; x.fillRect(X,Y+18+k*12,46,11); x.fillStyle='#3a4a6a'; x.fillRect(X+5,Y+22+k*12,24+r()*12,3); }
      for(let k=0;k<9;k++){ const yy=Y+18+k*13; x.fillStyle=k<3?'#1a1a2a':'#5a5a6a'; x.fillRect(X+52,yy,50+r()*30,k<3?3.5:2.5); x.fillRect(X+52,yy+5,80+r()*20,2); x.fillStyle='#c8ccd6'; x.fillRect(X+50,yy+10,90,0.8); }
      x.fillStyle='#ffffff'; x.fillRect(X+146,Y+16,106,h-20); fit(x,'RE: Monday briefing',X+150,Y+27,100,8,'#1a1a2a','bold',SANS,'left'); for(let k=0;k<8;k++){ x.fillStyle='#6a6a7a'; x.fillRect(X+150,Y+36+k*9,70+r()*28,2); } }
    // the DG's monitor (768,0,1024,144): a memo with the shield
    { const X=768,Y=0,w=256,h=144; x.fillStyle='#3a3e48'; x.fillRect(X,Y,w,h); x.fillStyle='#ffffff'; x.fillRect(X+40,Y+6,176,h-6); shield(x,X+128,Y+22,24,'#1d3f7a');
      fit(x,'MEMORANDUM',X+128,Y+46,120,9,'#1a1a2a','bold',SERIF); fit(x,'CONFIDENTIAL',X+128,Y+56,100,7,'#c0201a','bold',SANS); for(let k=0;k<9;k++){ x.fillStyle='#7a7a86'; x.fillRect(X+52,Y+66+k*8,120+r()*30,2); } }
    // the DG's TV (0,288,400,512): business news chart
    { const X=0,Y=288,w=400,h=224; x.fillStyle='#0e1a36'; x.fillRect(X,Y,w,h); x.strokeStyle='rgba(120,150,200,0.25)'; x.lineWidth=1; for(let k=0;k<6;k++){ x.beginPath(); x.moveTo(X+20,Y+30+k*28); x.lineTo(X+w-20,Y+30+k*28); x.stroke(); }
      x.strokeStyle='#40d080'; x.lineWidth=3; x.beginPath(); let v=0.5; for(let t=0;t<=1.001;t+=0.02){ v+= (r()-0.45)*0.08; v=Math.max(0.1,Math.min(0.9,v)); const px=X+20+t*(w-40), py=Y+30+(1-v)*140; t?x.lineTo(px,py):x.moveTo(px,py); } x.stroke();
      fit(x,'ALL-SHARE INDEX  +0.84%',X+20,Y+22,240,14,'#ffffff','bold',SANS,'left'); x.fillStyle='rgba(10,20,50,0.95)'; x.fillRect(X,Y+h-42,w,42); fit(x,'MARKETS AT MIDDAY',X+w/2,Y+h-16,w*0.9,18,'#ffffff','bold',SANS);
      fit(x,'NEWS 247',X+w-40,Y+h-48,70,10,'#e8c020','bold',FONT); }
    return T(c,false); }

  /* the view north from the 9th floor (MGLOWTEX ab_pano): strip about (0,-6), radius 36, y -38..42, arc a -200.05..20.05 deg
     (a = atan2(z,x): -90 = north at u 0.5, -180 = west, 0 = east). Late morning, sun high in the east-south-east.
     A small 3D projector draws the city: ground 31.6 m below the eye, towers, trees, roads, Aso Rock to the north-east. */
  function abPano(){
    const W=4096, H=1024, [c,x]=_cv(W,H), r=_rng(8801), A0=-200.05, A1=20.05, EYE=31.6, D2R=Math.PI/180, RAD=36;
    const U = deg=>(deg-A0)/(A1-A0)*W;
    // the band is built in three tiers (y 42..14 -> rows 0..200, 14..-8 -> 200..700, -8..-38 -> 700..1024): most texels near the horizon
    const Yv = y=> y>=14 ? 200*(42-y)/28 : (y>=-8 ? 200+500*(14-y)/22 : 700+324*(-8-y)/30);
    const E = el=>Yv(1.6+RAD*Math.tan(Math.max(-88,Math.min(88,el))*D2R)), HZ=E(0);
    const azOf = (X,Z)=>{ let a=Math.atan2(Z+6,X)/D2R; if(a>90) a-=360; return a; };
    const PJ = (X,Yh,Z)=>{ const d=Math.max(1,Math.hypot(X,Z+6)); return [U(azOf(X,Z)), E(Math.atan2(Yh-EYE,d)/D2R), d]; };
    const HAZE=[206,218,228], mix=(rgb,d,k)=>{ const f=Math.min(0.9,1-Math.exp(-d/(k||3600))); return `rgb(${rgb[0]*(1-f)+HAZE[0]*f|0},${rgb[1]*(1-f)+HAZE[1]*f|0},${rgb[2]*(1-f)+HAZE[2]*f|0})`; };
    const hex = s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)], mul=(c,k)=>c.map(v=>Math.max(0,Math.min(255,v*k)));
    const fillP = (pts,fill)=>{ x.fillStyle=fill; x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.fill(); };
    // ---------------- sky
    let g=x.createLinearGradient(0,0,0,HZ); g.addColorStop(0,'#3c77c2'); g.addColorStop(0.42,'#699dd7'); g.addColorStop(0.8,'#a5c3e1'); g.addColorStop(1,'#cddae6'); x.fillStyle=g; x.fillRect(0,0,W,HZ+2);
    for(let i=0;i<16;i++){ const X0=r()*W, Y0=E(16+r()*26), L=260+r()*600; x.strokeStyle=`rgba(255,255,255,${0.05+r()*0.07})`; x.lineWidth=2+r()*5; x.beginPath(); x.moveTo(X0,Y0); x.bezierCurveTo(X0+L*0.3,Y0-10,X0+L*0.6,Y0+8,X0+L,Y0-5); x.stroke(); }
    for(let i=0;i<30;i++){ const el=2.5+Math.pow(r(),1.5)*28, X0=r()*W, s=(4+r()*7)*(0.5+el/14), Y0=E(el), n=8+((r()*9)|0);
      for(let k=0;k<n;k++){ const ox=(r()-0.5)*s*5.5, oy=-Math.pow(r(),1.5)*s*1.2, R=s*(0.6+r()*0.9);
        const gg=x.createRadialGradient(X0+ox,Y0+oy-R*0.25,0,X0+ox,Y0+oy,R*1.3); gg.addColorStop(0,'rgba(255,255,255,0.78)'); gg.addColorStop(0.55,'rgba(247,249,253,0.42)'); gg.addColorStop(1,'rgba(240,244,250,0)');
        x.fillStyle=gg; x.fillRect(X0+ox-R*1.3,Y0+oy-R*1.3,R*2.6,R*2.6); }
      x.save(); x.translate(X0,Y0+s*0.2); x.scale(1,0.22); const gb=x.createRadialGradient(0,0,0,0,0,s*3); gb.addColorStop(0,'rgba(146,162,188,0.3)'); gb.addColorStop(1,'rgba(146,162,188,0)'); x.fillStyle=gb; x.fillRect(-s*3,-s*3,s*6,s*6); x.restore(); }
    // ---------------- hills: far ridges round the city, Aso Rock to the north-east
    const ridge=(az0,az1,elmax,col,seed)=>{ const rg=_rng(seed), ph=[rg()*6,rg()*6,rg()*6]; x.fillStyle=col; x.beginPath(); x.moveTo(U(az0),HZ+4);
      for(let a=az0;a<=az1;a+=0.3){ const t=(a-az0)/(az1-az0), env=Math.pow(Math.sin(Math.PI*t),0.6), el=elmax*env*(0.55+0.25*Math.sin(a*0.13+ph[0])+0.15*Math.sin(a*0.41+ph[1])+0.06*Math.sin(a*1.7+ph[2]));
        x.lineTo(U(a),E(Math.max(0,el))); } x.lineTo(U(az1),HZ+4); x.closePath(); x.fill(); };
    ridge(-206,-126,2.4,'#9eacb4',11); ridge(-164,-76,3.1,'#90a1aa',12); ridge(-114,-60,2.1,'#99a9b1',15); ridge(-34,26,2.1,'#a0aeb6',14);
    ridge(-204,-150,1.3,'#82968e',16); ridge(-132,-92,1.5,'#7f938b',17); ridge(-20,24,1.1,'#86988f',18);
    { const a0=-66, a1=-30, prof=a=>{ const t=Math.min(1,Math.max(0,(a-a0)/(a1-a0))), dome=Math.pow(Math.sin(Math.PI*t),0.5); return 6.6*dome*(0.86+0.08*Math.sin(t*13+1)+0.06*Math.sin(t*29))*(t<0.5?1:1-0.25*(t-0.5)); };
      const pts=[[U(a0-3),E(0.1)]]; for(let a=a0;a<=a1;a+=0.2) pts.push([U(a),E(prof(a))]); pts.push([U(a1+3),E(0.1)]);
      const gr=x.createLinearGradient(U(a0),0,U(a1),0); gr.addColorStop(0,'#6e6c66'); gr.addColorStop(0.45,'#83817a'); gr.addColorStop(0.75,'#99968c'); gr.addColorStop(1,'#88857c'); fillP(pts,gr);
      x.save(); x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.clip();
      for(let i=0;i<460;i++){ const a=a0+r()*(a1-a0), top=E(prof(a))+r()*6, len=(HZ-top)*(0.15+r()*0.8); x.fillStyle=r()<0.75?`rgba(36,34,30,${0.06+r()*0.14})`:`rgba(222,216,202,${0.05+r()*0.1})`; x.fillRect(U(a),top,1+r()*3.5,len); }
      for(let i=0;i<26;i++){ const a=a0+(a1-a0)*(0.1+r()*0.8), el=prof(a)*(0.35+r()*0.5); x.strokeStyle=`rgba(40,38,34,${0.12+r()*0.12})`; x.lineWidth=1.5; x.beginPath(); x.ellipse(U(a),E(el),40+r()*120,8+r()*16,(r()-0.5)*0.4,Math.PI*1.1,Math.PI*1.9); x.stroke(); }
      const sh=x.createLinearGradient(U(a0),0,U(a1),0); sh.addColorStop(0,'rgba(30,32,40,0.26)'); sh.addColorStop(0.5,'rgba(30,32,40,0)'); sh.addColorStop(0.8,'rgba(255,240,210,0.12)'); sh.addColorStop(1,'rgba(255,240,210,0.04)'); x.fillStyle=sh; x.fillRect(U(a0-3),0,U(a1+3)-U(a0-3),HZ+4);
      for(let i=0;i<380;i++){ const a=a0-2+r()*(a1-a0+4), el=Math.pow(r(),1.8)*prof(a)*0.45; x.fillStyle=`rgba(${46+r()*24|0},${66+r()*22|0},${38+r()*14|0},${0.7+r()*0.3})`; x.beginPath(); x.ellipse(U(a),E(el),3+r()*7,2+r()*4,0,0,7); x.fill(); }
      x.restore(); fillP(pts,'rgba(206,218,228,0.2)'); }
    // ---------------- the ground: base, far city carpet, roads, the park
    g=x.createLinearGradient(0,HZ,0,H); g.addColorStop(0,'#b0b8b0'); g.addColorStop(0.035,'#8c9878'); g.addColorStop(0.3,'#6e8850'); g.addColorStop(1,'#5c7a42'); x.fillStyle=g; x.fillRect(0,HZ,W,H-HZ);
    for(let i=0;i<11000;i++){ const az=A0+r()*(A1-A0), dep=0.04+Math.pow(r(),1.7)*2.2, X0=U(az), Y0=E(-dep), d=EYE/Math.tan(dep*D2R), k=Math.min(1.8,1/dep);
      if(r()<0.56){ x.fillStyle=mix(hex(['#d8d0c0','#e2dccc','#c8bca8','#b8b0a4','#d0c4b0','#a8a49c','#c09a80','#e8e4dc'][(r()*8)|0]),d,2600); const w=(2+r()*7)/k, h=(1+r()*3)/k; x.fillRect(X0,Y0-h,w,h); }
      else { x.fillStyle=mix([48+r()*30,74+r()*30,40+r()*16],d,2600); x.beginPath(); x.ellipse(X0,Y0,(2+r()*4)/k,(1+r()*2)/k,0,0,7); x.fill(); } }
    const quadG=(x0,z0,x1,z1,col,step)=>{ step=step||20; const pts=[]; const edge=(ax,az,bx,bz)=>{ const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/step)); for(let k=0;k<n;k++){ const t=k/n, X=ax+(bx-ax)*t, Z=az+(bz-az)*t; if(Math.hypot(X,Z+6)<26) continue; pts.push(PJ(X,0,Z)); } };
      edge(x0,z0,x1,z0); edge(x1,z0,x1,z1); edge(x1,z1,x0,z1); edge(x0,z1,x0,z0); if(pts.length>2) fillP(pts,col); };
    const roadsEW=[[-62,14],[-190,38],[-470,22],[-800,26],[-1200,22]], roadsNS=[[-520,22],[-190,18],[210,18],[560,24],[960,20],[-960,20],[1500,22],[-1500,22]];
    quadG(-2400,-170,2400,-76,'#628c40',40);                                                         // the green belt between our road and the boulevard
    for(let i=0;i<120;i++){ const X=-2600+r()*5200, Z=-2400+r()*2600; if(Math.hypot(X,Z+6)<160) continue; quadG(X,Z,X+50+r()*140,Z+40+r()*120,`rgba(${150+r()*40|0},${146+r()*30|0},${122+r()*30|0},0.4)`,40); }
    for(const [z,w] of roadsEW){ quadG(-2600,z-w/2-3,2600,z+w/2+3,'#b6b2a6',25); quadG(-2600,z-w/2,2600,z+w/2,'#58585a',25); if(w>30) quadG(-2600,z-4,2600,z+4,'#5e8a3e',25); }
    for(const [X,w] of roadsNS){ quadG(X-w/2-3,-2600,X+w/2+3,260,'#b6b2a6',25); quadG(X-w/2,-2600,X+w/2,260,'#58585a',25); }
    for(let X=-700;X<700;X+=12){ for(const z of [-190-11,-190+11,-62]) quadG(X,z-0.25,X+5,z+0.25,'#ece8dc',6); }
    for(let i=0;i<9000;i++){ const el=-4-Math.pow(r(),0.8)*60, X0=r()*W, Y0=E(el); if(Y0>H+4) continue; const lc=r(); x.fillStyle=lc<0.5?`rgba(40,66,30,${0.12+r()*0.18})`:`rgba(150,176,96,${0.08+r()*0.14})`; x.fillRect(X0,Y0,2+r()*7,1+r()*3); }   // lawn
    quadG(-80,-48,80,-36,'#a8a6a0',6); for(let X=-80;X<=80;X+=2.5) quadG(X,-48,X+0.15,-36,'#8e8c86',3);                                                                   // our forecourt paving
    for(let i=0;i<70;i++){ const X=-70+r()*140, Z=-34+r()*10; if(Math.hypot(X,Z+6)<27) continue; const p=PJ(X,0.4,Z); x.fillStyle=r()<0.5?'#c8302a':'#e8c030'; x.beginPath(); x.ellipse(p[0],p[1],2+r()*3,1.5+r()*2,0,0,7); x.fill(); }   // flower beds
    // ---------------- things that stand up (sorted far to near)
    const items=[], SUN=[0.8,0.6];
    const block=(cx,cz,w,dp,h,base,style,rot)=>items.push({d:Math.hypot(cx,cz+6), f:()=>{ const c0=hex(base), cr=Math.cos(rot), sr=Math.sin(rot), dd=Math.hypot(cx,cz+6), fade=Math.exp(-dd/2200);
        const P=[[-w/2,-dp/2],[w/2,-dp/2],[w/2,dp/2],[-w/2,dp/2]].map(([a,b])=>[cx+a*cr-b*sr, cz+a*sr+b*cr]);
        for(let k=0;k<4;k++){ const p0=P[k], p1=P[(k+1)%4], mx=(p0[0]+p1[0])/2, mz=(p0[1]+p1[1])/2, nx=p1[1]-p0[1], nz=-(p1[0]-p0[0]), nl=Math.hypot(nx,nz);
          if(nx*(0-mx)+nz*(-6-mz)<=0) continue;
          const lit=0.6+0.4*Math.max(0,(nx*SUN[0]+nz*SUN[1])/nl), d=Math.hypot(mx,mz+6), L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);
          const at=(t,yy)=>PJ(p0[0]+(p1[0]-p0[0])*t,yy,p0[1]+(p1[1]-p0[1])*t), q=[at(0,0),at(1,0),at(1,h),at(0,h)];
          fillP(q, mix(mul(c0,lit),d));
          const ph=Math.abs(q[0][1]-q[3][1]), pw=Math.abs(q[0][0]-q[1][0]); if(ph<6||pw<3) continue;
          const fl=style==='glass'?3.8:3.4, n=Math.max(1,Math.floor(h/fl));
          if(style==='glass'){ const gg=x.createLinearGradient(0,q[3][1],0,q[0][1]); gg.addColorStop(0,`rgba(225,236,250,${0.3*lit*fade})`); gg.addColorStop(0.6,'rgba(160,190,220,0.06)'); gg.addColorStop(1,`rgba(20,30,40,${0.15*fade})`); fillP(q,gg);
            x.strokeStyle=`rgba(18,28,40,${0.32*fade})`; x.lineWidth=ph/n>5?1.1:0.6; for(let j=1;j<n;j++){ const a=at(0,j*fl), b=at(1,j*fl); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); }
            if(pw>10){ const m=Math.floor(L/3); x.strokeStyle=`rgba(230,236,244,${0.22*fade})`; for(let j=1;j<m;j++){ const a=at(j/m,0), b=at(j/m,h); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); } } }
          else if(style==='band'){ for(let j=0;j<n;j++){ fillP([at(0.02,j*fl+1.0),at(0.98,j*fl+1.0),at(0.98,j*fl+2.4),at(0.02,j*fl+2.4)], `rgba(${44+lit*20|0},${60+lit*20|0},${78+lit*20|0},${0.62*fade+0.1})`); } }
          else { const m=Math.max(1,Math.floor(L/3.2)); x.fillStyle=`rgba(46,58,72,${0.55*fade+0.1})`; if(pw/m>1.5) for(let j=0;j<n;j++) for(let i=0;i<m;i++){ const a=at((i+0.28)/m,j*fl+1.0), b=at((i+0.72)/m,j*fl+2.3); x.fillRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(1,Math.abs(b[0]-a[0])),Math.max(1,Math.abs(b[1]-a[1]))); } }
          const pa=at(0,h), pb=at(1,h); x.strokeStyle=`rgba(255,255,255,${0.25*fade})`; x.lineWidth=1; x.beginPath(); x.moveTo(pa[0],pa[1]); x.lineTo(pb[0],pb[1]); x.stroke(); }
        if(h<EYE){ const R=P.map(([a,b])=>PJ(a,h,b)); fillP(R, mix(hex(style==='glass'?'#8a9298':'#b4aea4'),dd));
          const tk=PJ(cx+w*0.2,h+2.2,cz), tb=PJ(cx+w*0.2,h,cz); if(Math.abs(tk[1]-tb[1])>2){ x.fillStyle=mix([40,44,48],dd); x.fillRect(tk[0]-Math.abs(tk[1]-tb[1])*0.6,tk[1],Math.abs(tk[1]-tb[1])*1.2,Math.abs(tk[1]-tb[1])); } } } });
    const tree=(X,Z,R,col)=>items.push({d:Math.hypot(X,Z+6), f:()=>{ const p=PJ(X,R*1.7,Z), b=PJ(X,0,Z), d=p[2], ang=R/d/D2R, el=Math.atan2(R*1.7-EYE,d)/D2R;
        const rx=ang*W/(A1-A0), ry=Math.max(0.8,Math.abs(E(el)-E(el+ang)));
        if(Math.abs(p[1]-b[1])>3){ x.strokeStyle=mix([74,60,44],d); x.lineWidth=Math.max(1,rx*0.14); x.beginPath(); x.moveTo(b[0],b[1]); x.lineTo(p[0],p[1]+ry*0.5); x.stroke(); }
        x.fillStyle=mix(mul(col,0.7),d,2400); x.beginPath(); x.ellipse(p[0]+rx*0.12,p[1]+ry*0.1,rx,ry,0,0,7); x.fill();
        x.fillStyle=mix(col,d,2400); x.beginPath(); x.ellipse(p[0]-rx*0.08,p[1]-ry*0.12,rx*0.8,ry*0.78,0,0,7); x.fill();
        if(rx>7){ const rg=_rng((X*7+Z*13)|0); for(let k=0;k<Math.min(26,rx*0.9);k++){ const a=rg()*6.283, q=Math.sqrt(rg())*0.8, lc=rg(); x.fillStyle=mix(mul(col,lc<0.4?0.62:(lc<0.8?1.08:1.32)),d,2400);
            x.beginPath(); x.ellipse(p[0]+Math.cos(a)*rx*q,p[1]+Math.sin(a)*ry*q,rx*(0.16+rg()*0.14),ry*(0.14+rg()*0.12),0,0,7); x.fill(); } } } });
    const car=(X,Z,rot,col)=>items.push({d:Math.hypot(X,Z+6), f:()=>{ const cr=Math.cos(rot), sr=Math.sin(rot), d=Math.hypot(X,Z+6);
        fillP([[-2.2,-0.9],[2.2,-0.9],[2.2,0.9],[-2.2,0.9]].map(([a,b])=>PJ(X+a*cr-b*sr,1.4,Z+a*sr+b*cr)), mix(hex(col),d));
        fillP([[-1.1,-0.75],[1.0,-0.75],[1.0,0.75],[-1.1,0.75]].map(([a,b])=>PJ(X+a*cr-b*sr,1.45,Z+a*sr+b*cr)), mix([30,36,44],d)); } });
    const roadEW=(z,m)=>roadsEW.some(([zz,w])=>Math.abs(z-zz)<w/2+m), roadNS=(X,m)=>roadsNS.some(([xx,w])=>Math.abs(X-xx)<w/2+m);
    const PAL=['#dcd4c4','#e6e0d2','#cfc2aa','#d6c8b0','#bdb4a6','#ece6da','#c49c80','#d8d2c8'], GLS=['#5e7c96','#6a8aa6','#58788a','#7896ac','#4e6e84','#6e8c8e'];
    // the central business district: towers north-west to north, some taller than our floor
    const TOW=[[-330,-430,40,30,138],[-420,-560,32,32,112],[-560,-380,36,28,96],[-240,-660,44,30,124],[-120,-520,30,30,78],[-640,-640,40,40,88],[-760,-300,30,26,64],
               [40,-760,38,30,102],[-360,-860,34,34,118],[-880,-560,44,30,72],[-170,-980,40,32,96],[180,-560,30,26,58],[-980,-860,34,30,84],[300,-1000,40,28,76]];
    for(const [X,Z,w,dp,h] of TOW){ const s=r()<0.62?'glass':'band'; block(X,Z,w,dp,h, s==='glass'?GLS[(r()*GLS.length)|0]:PAL[(r()*PAL.length)|0], s, (r()-0.5)*0.25);
      if(r()<0.4) block(X+(r()-0.5)*20,Z+dp*0.5+8,w+20,dp*0.6,10+r()*6,PAL[(r()*PAL.length)|0],'band',0); }
    for(let i=0;i<950;i++){ const d=100+Math.pow(r(),1.25)*1500, az=A0-3+r()*(A1-A0+6), X=Math.cos(az*D2R)*d, Z=Math.sin(az*D2R)*d-6;
      if(roadEW(Z,14)||roadNS(X,14)) continue; if(Z<-70&&Z>-176) continue;
      const gov=az>-76&&az<-18, cbd=az>-175&&az<-88&&d<1000;
      let h = gov ? 5+r()*9 : (cbd&&r()<0.25 ? 32+r()*50 : 8+r()*(d<700?26:18));
      const st = h>36 ? (r()<0.55?'glass':'band') : (r()<0.5?'band':(r()<0.85?'punch':'glass'));
      block(X,Z,14+r()*30,12+r()*24,h, st==='glass'?GLS[(r()*GLS.length)|0]:PAL[(r()*PAL.length)|0], st, (r()-0.5)*0.24); }
    for(let i=0;i<2600;i++){ const d=60+Math.pow(r(),1.15)*1600, az=A0-2+r()*(A1-A0+4), X=Math.cos(az*D2R)*d, Z=Math.sin(az*D2R)*d-6; if(roadEW(Z,-2)||roadNS(X,-2)) continue;
      tree(X,Z,2.4+r()*3.6,[40+r()*26|0,70+r()*30|0,34+r()*18|0]); }
    for(const [z,w] of roadsEW.slice(0,3)) for(let X=-1400;X<1400;X+=11+r()*8){ tree(X,z-w/2-5,3+r()*1.8,[44,80,38]); tree(X+5,z+w/2+5,3+r()*1.8,[48,84,40]); }
    for(const [X,w] of roadsNS) for(let Z=-1400;Z<200;Z+=12+r()*8){ tree(X-w/2-5,Z,3+r()*1.5,[46,82,40]); }
    const CARS=['#e8e8e4','#1c1c1e','#8a8e94','#c8c8c4','#2a4a8a','#8a1e1e','#e8e8e4','#d8d4c8','#c8c8c4'];
    for(const [z,w] of roadsEW.slice(0,4)) for(let i=0;i<(w>30?110:50);i++) car(-1200+r()*2400,z+(r()<0.5?-1:1)*(2+r()*(w/2-4)),0,CARS[(r()*CARS.length)|0]);
    for(const [X,w] of roadsNS.slice(0,5)) for(let i=0;i<40;i++) car(X+(r()<0.5?-1:1)*(2+r()*(w/2-4)),-1200+r()*1400,Math.PI/2,CARS[(r()*CARS.length)|0]);
    for(let X=-70;X<70;X+=2.8){ if(r()<0.7) car(X+1.4,-42,Math.PI/2,CARS[(r()*CARS.length)|0]); }
    for(const [X,Z,h] of [[-300,-760,112],[60,-900,96],[-700,-470,84]]) items.push({d:Math.hypot(X,Z+6), f:()=>{ const b=PJ(X,0,Z), t=PJ(X,h,Z), j=PJ(X+60,h-4,Z), k=PJ(X-16,h-4,Z), dd=Math.hypot(X,Z+6);
        x.strokeStyle=mix([210,160,40],dd); x.lineWidth=2; x.beginPath(); x.moveTo(b[0],b[1]); x.lineTo(t[0],t[1]); x.moveTo(k[0],k[1]); x.lineTo(j[0],j[1]); x.stroke(); } });
    items.sort((a,b)=>b.d-a.d); for(const it of items) it.f();
    // ---------------- the haze line along the horizon
    g=x.createLinearGradient(0,HZ-70,0,HZ+24); g.addColorStop(0,'rgba(206,218,228,0)'); g.addColorStop(0.7,'rgba(206,218,228,0.5)'); g.addColorStop(1,'rgba(206,218,228,0)'); x.fillStyle=g; x.fillRect(0,HZ-70,W,94);
    return T(c,false); }
  Object.assign(MTEX, { ab_screens(){ return abScreens(); }, ab_pano(){ return abPano(); } });

  Object.assign(MDEF, {
    tf_yard:{t:'tf_yard'}, tf_quay:{t:'tf_quay'}, tf_ground:{t:'tf_ground'}, tf_bund:{t:'tf_bund'}, tf_road:{t:'tf_road'}, tf_mud:{t:'tf_mud'},
    tf_wall:{t:'tf_wall'}, tf_office:{t:'tf_render', c:'#f4f0e6'}, tf_office_in:{t:'tf_paint', c:'#f0eadc'}, tf_lab:{t:'tf_render', c:'#eef0ea'}, tf_gatehse:{t:'tf_render', c:'#e8ece4'},
    tf_tiles:{t:'tf_tiles'}, tf_roof:{t:'tf_roof'}, tf_firetank:{t:'tf_roof', c:'#c44a3c'}, tf_rust:{t:'tf_rust'}, tf_deck:{t:'tf_deck'}, tf_shack:{t:'tf_shack'},
    tf_grating:{t:'tf_grating'}, tf_hazard:{t:'tf_hazard'}, tf_tank:{t:'tf_tank'}, tf_nbtank:{t:'tf_roof', c:'#b4c0b0'}, tf_signs:{t:'tf_signs'}, tf_boards:{t:'tf_boards'}, tf_cabinet:{c:'#7c8086', metal:0.2},
    ab_carpet:{t:'ab_carpet'}, ab_rug:{t:'ab_rug'}, ab_panel:{t:'ab_panel'}, ab_recep:{t:'ab_recep'}, ab_signs:{t:'ab_signs'}, ab_files:{t:'ab_files'}, ab_flags:{t:'ab_flags'},
  });
  Object.assign(MGLOWTEX, { tf_water:{ t:'tf_water' }, tf_water_n:{ t:'tf_waterN' }, tf_pano:{ t:'tf_pano', fog:false }, tf_pano_n:{ t:'tf_panoN', fog:false },
    tf_razor:{ t:'tf_razor', test:0.4 }, tf_bars:{ t:'tf_bars', test:0.5 }, tf_flame:{ t:'tf_flame', alpha:true },
    ab_screen:{ t:'ab_screens' }, ab_pano:{ t:'ab_pano', fog:false } });
})();
