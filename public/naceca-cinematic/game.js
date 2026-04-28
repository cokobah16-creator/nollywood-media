(function () {
  'use strict';

  const THREE = window.THREE;
  const canvas = document.getElementById('game-canvas');
  const statusEl = document.getElementById('runtime-status');
  const startOverlay = document.getElementById('start-overlay');
  const completeOverlay = document.getElementById('mission-complete');
  const completeSummary = document.getElementById('complete-summary');
  const hud = document.getElementById('hud');
  const promptEl = document.getElementById('prompt');
  const objectivesEl = document.getElementById('objectives');
  const markersEl = document.getElementById('markers');
  const distanceEl = document.getElementById('distance');
  const feedEl = document.getElementById('feed');
  const minimap = document.getElementById('minimap');
  const mctx = minimap.getContext('2d');
  const restartBtn = document.getElementById('restart-btn');
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  function setStatus(message, type = 'ok') {
    statusEl.textContent = message;
    statusEl.classList.toggle('ok', type === 'ok');
    statusEl.classList.toggle('error', type === 'error');
  }

  window.addEventListener('error', (event) => setStatus(`Runtime error: ${event.message}`, 'error'));

  if (!THREE) {
    setStatus('Three.js failed to load. Check your connection and reload.', 'error');
    return;
  }

  const initialState = () => ({
    started: false,
    childSecured: false,
    laptopScanned: false,
    laptopCollected: false,
    cashScanned: false,
    cashCollected: false,
    suspectArrested: false,
    monitorsInspected: false,
    crouching: false,
    sprinting: false,
    missionComplete: false,
    xp: 0,
    integrity: 68,
    trust: 64,
    favour: 60,
    keys: {},
    current: null,
    feed: [],
    startTime: 0,
    elapsedSeconds: 0
  });
  const state = initialState();

  const audio = (function () {
    let ctx = null;
    let masterGain = null;
    let rainGain = null;
    let sirenGain = null;
    let started = false;

    function ensure() {
      if (ctx) return ctx;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(ctx.destination);
      return ctx;
    }

    function startAmbient() {
      if (!ensure() || started) return;
      started = true;

      // Rain bed: filtered white noise loop
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.6;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.6;
      rainGain = ctx.createGain();
      rainGain.gain.value = 0.0;
      noise.connect(filter).connect(rainGain).connect(masterGain);
      noise.start(0);
      rainGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.6);

      // Distant siren: two oscillators alternating slowly
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'sine';
      oscB.type = 'sine';
      oscA.frequency.value = 720;
      oscB.frequency.value = 540;
      const sirenLfo = ctx.createOscillator();
      const sirenLfoGain = ctx.createGain();
      sirenLfo.frequency.value = 0.35;
      sirenLfoGain.gain.value = 80;
      sirenLfo.connect(sirenLfoGain);
      sirenLfoGain.connect(oscA.frequency);
      sirenLfoGain.connect(oscB.frequency);
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0.0;
      const sirenFilter = ctx.createBiquadFilter();
      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.value = 900;
      oscA.connect(sirenFilter);
      oscB.connect(sirenFilter);
      sirenFilter.connect(sirenGain).connect(masterGain);
      oscA.start(0);
      oscB.start(0);
      sirenLfo.start(0);
      sirenGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5);
    }

    function tone(freq, duration, type = 'sine', gain = 0.18) {
      if (!ensure()) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(g).connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    }

    function sweep(fromFreq, toFreq, duration, gain = 0.16) {
      if (!ensure()) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + duration);
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(g).connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    }

    return {
      startAmbient,
      scan: () => sweep(880, 1480, 0.16, 0.12),
      collect: () => tone(660, 0.18, 'triangle', 0.18),
      arrest: () => {
        tone(220, 0.45, 'sawtooth', 0.18);
        setTimeout(() => tone(165, 0.45, 'sawtooth', 0.16), 120);
        setTimeout(() => tone(110, 0.6, 'sawtooth', 0.14), 240);
      },
      complete: () => {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => tone(f, 0.45, 'triangle', 0.16), i * 130));
      },
      secure: () => sweep(420, 740, 0.22, 0.13)
    };
  })();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 4.1, 12.2);
  camera.lookAt(0, 1.7, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  const root = new THREE.Group();
  scene.add(root);

  const clock = new THREE.Clock();
  const playableBounds = { minX: -3.7, maxX: 2.9, minY: -1.65, maxY: 1.55 };

  function mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.68,
      metalness: opts.metalness ?? 0.04,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      map: opts.map || null,
      side: opts.side || THREE.FrontSide
    });
  }

  function tex(draw, w = 1024, h = 1024) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, c);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }

  function backgroundTexture() {
    return tex((ctx, c) => {
      const w = c.width;
      const h = c.height;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#1a120d');
      g.addColorStop(0.34, '#5b3f29');
      g.addColorStop(0.62, '#1f3048');
      g.addColorStop(1, '#070b13');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // ceiling dark band
      ctx.fillStyle = '#08080a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h * 0.16);
      ctx.lineTo(w * 0.18, h * 0.21);
      ctx.lineTo(0, h * 0.12);
      ctx.closePath();
      ctx.fill();

      // back wall and floor perspective
      ctx.fillStyle = '#87644b';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.14);
      ctx.lineTo(w * 0.2, h * 0.23);
      ctx.lineTo(w * 0.8, h * 0.23);
      ctx.lineTo(w, h * 0.14);
      ctx.lineTo(w, h * 0.68);
      ctx.lineTo(w * 0.82, h * 0.55);
      ctx.lineTo(w * 0.2, h * 0.55);
      ctx.lineTo(0, h * 0.68);
      ctx.closePath();
      ctx.fill();

      const fg = ctx.createLinearGradient(0, h * 0.52, 0, h);
      fg.addColorStop(0, '#3a3029');
      fg.addColorStop(0.45, '#7a675a');
      fg.addColorStop(1, '#221f21');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.68);
      ctx.lineTo(w * 0.2, h * 0.55);
      ctx.lineTo(w * 0.82, h * 0.55);
      ctx.lineTo(w, h * 0.68);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // marble veins
      for (let i = 0; i < 120; i += 1) {
        ctx.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.08})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        let x = Math.random() * w;
        let y = h * (0.55 + Math.random() * 0.43);
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j += 1) {
          x += (Math.random() - 0.5) * 220;
          y += (Math.random() - 0.5) * 120;
          ctx.quadraticCurveTo(x, y, x + 20, y + 8);
        }
        ctx.stroke();
      }

      // sliding glass doors and night exterior
      ctx.fillStyle = '#101d31';
      ctx.fillRect(w * 0.42, h * 0.19, w * 0.25, h * 0.38);
      const night = ctx.createLinearGradient(0, h * 0.18, 0, h * 0.57);
      night.addColorStop(0, '#07111f');
      night.addColorStop(1, '#0f2a42');
      ctx.fillStyle = night;
      ctx.fillRect(w * 0.43, h * 0.2, w * 0.23, h * 0.35);
      ctx.strokeStyle = '#35281e';
      ctx.lineWidth = 12;
      ctx.strokeRect(w * 0.42, h * 0.19, w * 0.25, h * 0.38);
      ctx.beginPath();
      ctx.moveTo(w * 0.545, h * 0.19);
      ctx.lineTo(w * 0.545, h * 0.57);
      ctx.stroke();

      // palm silhouettes and van light
      ctx.strokeStyle = '#06111c';
      ctx.lineWidth = 8;
      [0.47, 0.62].forEach((px) => {
        ctx.beginPath();
        ctx.moveTo(w * px, h * 0.54);
        ctx.lineTo(w * px, h * 0.31);
        ctx.stroke();
        for (let i = 0; i < 6; i += 1) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(w * px, h * 0.31);
          ctx.lineTo(w * px + Math.cos(a) * 60, h * 0.31 + Math.sin(a) * 24);
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#133358';
      ctx.fillRect(w * 0.58, h * 0.47, w * 0.09, h * 0.045);
      ctx.fillStyle = '#3a78ff';
      ctx.shadowColor = '#3a78ff';
      ctx.shadowBlur = 22;
      ctx.fillRect(w * 0.59, h * 0.46, w * 0.03, h * 0.01);
      ctx.shadowBlur = 0;

      // sofa left
      ctx.fillStyle = '#d3c2ad';
      roundRect(ctx, w * 0.04, h * 0.48, w * 0.24, h * 0.12, 18, true);
      ctx.fillStyle = '#bca790';
      roundRect(ctx, w * 0.05, h * 0.43, w * 0.21, h * 0.09, 14, true);
      ctx.fillStyle = '#806449';
      ctx.fillRect(w * 0.10, h * 0.37, w * 0.12, h * 0.045);

      // lamp and plant
      ctx.fillStyle = '#5e4635';
      ctx.fillRect(w * 0.33, h * 0.42, 8, h * 0.12);
      ctx.fillStyle = '#ffd59b';
      ctx.shadowColor = '#ffbb72';
      ctx.shadowBlur = 32;
      roundRect(ctx, w * 0.30, h * 0.37, w * 0.065, h * 0.05, 16, true);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#194d33';
      for (let i = 0; i < 9; i += 1) {
        ctx.beginPath();
        ctx.ellipse(w * 0.36 + Math.cos(i) * 28, h * 0.42 + Math.sin(i * 1.7) * 18, 14, 40, i, 0, Math.PI * 2);
        ctx.fill();
      }

      // desk and monitors right
      ctx.fillStyle = '#3b2f2a';
      roundRect(ctx, w * 0.72, h * 0.55, w * 0.23, h * 0.085, 4, true);
      ctx.fillStyle = '#111827';
      ctx.fillRect(w * 0.76, h * 0.39, w * 0.08, h * 0.07);
      ctx.fillRect(w * 0.86, h * 0.39, w * 0.08, h * 0.07);
      drawChart(ctx, w * 0.762, h * 0.394, w * 0.074, h * 0.064);
      drawChart(ctx, w * 0.862, h * 0.394, w * 0.074, h * 0.064);

      // wall art
      ctx.strokeStyle = '#3a2b1f';
      ctx.lineWidth = 8;
      ctx.strokeRect(w * 0.09, h * 0.25, w * 0.09, h * 0.14);
      ctx.fillStyle = '#ecd2a2';
      ctx.fillText('NACECA', w * 0.095, h * 0.33);
    }, 1600, 900);
  }

  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    if (fill) ctx.fill();
  }

  function drawChart(ctx, x, y, w, h) {
    ctx.strokeStyle = '#57d38c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.62);
    for (let i = 0; i < 9; i += 1) {
      ctx.lineTo(x + 4 + i * (w - 8) / 8, y + h * (0.3 + Math.random() * 0.5));
    }
    ctx.stroke();
    ctx.strokeStyle = '#ef5f67';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.25);
    for (let i = 0; i < 9; i += 1) {
      ctx.lineTo(x + 4 + i * (w - 8) / 8, y + h * (0.35 + Math.random() * 0.45));
    }
    ctx.stroke();
  }

  const bgPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 9),
    new THREE.MeshBasicMaterial({ map: backgroundTexture() })
  );
  bgPlane.position.set(0, 2.25, -3.1);
  root.add(bgPlane);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x473d36, roughness: 0.32, metalness: 0.25, transparent: true, opacity: 0.62 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-0.1, -0.02, 2.0);
  floor.receiveShadow = true;
  root.add(floor);

  const warm = new THREE.PointLight(0xffb56d, 3.2, 14, 2);
  warm.position.set(-3.0, 3.1, 1.3);
  scene.add(warm);
  const cool = new THREE.PointLight(0x4f8cff, 2.2, 18, 2);
  cool.position.set(2.2, 2.2, -1.2);
  scene.add(cool);
  const police = new THREE.PointLight(0xff3048, 3.1, 20, 2);
  police.position.set(2.4, 2.6, -1.2);
  scene.add(police);
  scene.add(new THREE.AmbientLight(0xb0c7ff, 0.45));

  function makeCharacter(kind) {
    const g = new THREE.Group();
    const skin = kind === 'agent' ? 0x6f432f : kind === 'child' ? 0x5f3f2b : 0x6a3c28;
    const bodyColor = kind === 'suspect' ? 0xd6722f : kind === 'child' ? 0xe7decf : 0x1b2a55;
    const legColor = kind === 'suspect' ? 0x6e2d22 : kind === 'child' ? 0x2b6342 : 0x111827;
    const scale = kind === 'suspect' ? 1.35 : kind === 'child' ? 0.78 : 1.08;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.34 * scale, 0.92 * scale, 14), mat(bodyColor));
    body.position.y = 0.94 * scale;
    if (kind === 'suspect') body.material.map = shirtPattern();
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21 * scale, 16, 16), mat(skin));
    head.position.y = 1.52 * scale;
    g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.215 * scale, 12, 8), mat(0x0c0d10));
    hair.scale.set(1, 0.35, 1);
    hair.position.y = head.position.y + 0.14 * scale;
    g.add(hair);
    [-0.06, 0.06].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016 * scale, 8, 8), new THREE.MeshBasicMaterial({ color: 0x101010 }));
      eye.position.set(x * scale, head.position.y + 0.02 * scale, 0.19 * scale);
      g.add(eye);
    });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, 0.68 * scale, 10), mat(legColor));
    legL.position.set(-0.13 * scale, 0.34 * scale, 0);
    const legR = legL.clone();
    legR.position.x = 0.13 * scale;
    g.add(legL, legR);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.07 * scale, 0.68 * scale, 10), mat(bodyColor));
    const armR = armL.clone();
    if (kind === 'suspect') {
      armL.position.set(-0.45 * scale, 1.14 * scale, 0.04);
      armR.position.set(0.45 * scale, 1.14 * scale, 0.04);
      armL.rotation.z = -0.9;
      armR.rotation.z = 0.9;
    } else if (kind === 'child') {
      armL.position.set(-0.29 * scale, 0.7 * scale, 0.12);
      armR.position.set(0.29 * scale, 0.7 * scale, 0.12);
      armL.rotation.x = 1.1;
      armR.rotation.x = 1.1;
    } else {
      armL.position.set(-0.35 * scale, 0.95 * scale, 0.06);
      armR.position.set(0.35 * scale, 0.95 * scale, 0.06);
      armL.rotation.z = 0.2;
      armR.rotation.z = -0.2;
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58 * scale, 0.5 * scale, 0.14 * scale), mat(0x0e1628));
      vest.position.set(0, 0.93 * scale, 0.11 * scale);
      g.add(vest);
      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.62 * scale), mat(0x111111, { metalness: 0.2 }));
      gun.position.set(0.12 * scale, 0.7 * scale, 0.42 * scale);
      gun.rotation.x = 0.28;
      g.add(gun);
    }
    g.add(armL, armR);
    g.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return g;
  }

  function shirtPattern() {
    const t = tex((ctx) => {
      ctx.fillStyle = '#d6722f';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#f3c66b';
      for (let i = 0; i < 50; i += 1) {
        ctx.beginPath();
        ctx.ellipse((i * 79) % 512, (i * 149) % 512, 18, 8, i, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(91,39,18,.32)';
      ctx.lineWidth = 8;
      for (let x = -40; x < 560; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 90, 90, x - 40, 220, x + 70, 512);
        ctx.stroke();
      }
    });
    t.repeat.set(1.4, 1.4);
    return t;
  }

  const player = makeCharacter('agent');
  player.position.set(-3.6, 0.02, 2.0);
  player.rotation.y = 0.16;
  root.add(player);

  const suspect = makeCharacter('suspect');
  suspect.position.set(3.45, 0.02, 0.7);
  suspect.rotation.y = -0.75;
  root.add(suspect);

  const child = makeCharacter('child');
  child.position.set(0.55, 0.02, 1.18);
  child.rotation.y = 0.4;
  root.add(child);

  const backup = makeCharacter('agent');
  backup.position.set(1.9, 0.02, -1.1);
  backup.rotation.y = Math.PI;
  backup.scale.setScalar(0.72);
  root.add(backup);

  const cash = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const stack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.22), mat(0x66a266, { roughness: 0.55 }));
    stack.position.set((i % 3) * 0.24, Math.floor(i / 3) * 0.09, (i % 2) * 0.16);
    cash.add(stack);
  }
  cash.position.set(-0.82, 0.34, 1.02);
  root.add(cash);

  const laptop = new THREE.Group();
  const lbase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.34), mat(0x151922, { metalness: 0.2 }));
  const lscreen = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.32, 0.03), mat(0xffffff, { map: chartSmall('SCAM LOG'), emissive: 0x22d3ee, emissiveIntensity: 0.45 }));
  lscreen.position.set(0, 0.17, -0.17);
  lscreen.rotation.x = -0.95;
  laptop.add(lbase, lscreen);
  laptop.position.set(0.55, 0.25, 1.0);
  root.add(laptop);

  const monitors = new THREE.Group();
  const mon1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.035), mat(0xffffff, { map: chartSmall('LEDGER'), emissive: 0x1d4ed8, emissiveIntensity: 0.3 }));
  const mon2 = mon1.clone();
  mon1.position.set(0, 0.25, 0);
  mon2.position.set(0.72, 0.25, 0.02);
  monitors.add(mon1, mon2);
  monitors.position.set(3.55, 0.94, 0.65);
  root.add(monitors);

  function chartSmall(label) {
    return tex((ctx) => {
      ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#dbeafe'; ctx.font = 'bold 42px Arial'; ctx.fillText(label, 28, 70);
      ['#67e8f9', '#facc15', '#fb7185'].forEach((color, row) => {
        ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.beginPath();
        let y = 170 + row * 60; ctx.moveTo(36, y);
        for (let x = 70; x < 480; x += 42) { y += (Math.random() - 0.5) * 46; ctx.lineTo(x, y); }
        ctx.stroke();
      });
    });
  }

  const rainGeo = new THREE.BufferGeometry();
  const rainCount = 420;
  const rainArr = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i += 1) {
    rainArr[i * 3] = (Math.random() - 0.5) * 11;
    rainArr[i * 3 + 1] = Math.random() * 7;
    rainArr[i * 3 + 2] = -2.5 - Math.random() * 2.2;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArr, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x9fc4ff, size: 0.035, transparent: true, opacity: 0.58 }));
  root.add(rain);

  const interactables = [
    { id: 'child', label: 'Civilian', object: child, radius: 1.15, hidden: () => state.childSecured },
    { id: 'laptop', label: 'Evidence Laptop', object: laptop, radius: 1.1, hidden: () => state.laptopCollected },
    { id: 'cash', label: 'Evidence Cash', object: cash, radius: 1.05, hidden: () => state.cashCollected },
    { id: 'suspect', label: 'Suspect', object: suspect, radius: 1.25, hidden: () => state.suspectArrested },
    { id: 'monitors', label: 'Desk Monitors', object: monitors, radius: 1.2, hidden: () => false },
    { id: 'backup', label: 'Backup Officer', object: backup, radius: 0, hidden: () => false }
  ];

  const objectives = [
    ['Secure civilians', () => state.childSecured],
    ['Prevent evidence wipe', () => state.laptopScanned],
    ['Scan evidence laptop', () => state.laptopScanned],
    ['Collect cash evidence', () => state.cashCollected],
    ['Arrest suspect non-lethally', () => state.suspectArrested]
  ];

  function worldPos(object) {
    const p = new THREE.Vector3();
    object.getWorldPosition(p);
    return p;
  }

  function addFeed(message) {
    state.feed.unshift(message);
    state.feed = state.feed.slice(0, 4);
    feedEl.innerHTML = state.feed.map((m) => `<div>${m}</div>`).join('');
    setStatus(message, 'ok');
  }

  function renderObjectives() {
    objectivesEl.innerHTML = objectives.map(([name, done]) => `<li class="${done() ? 'done' : ''}">${name}</li>`).join('');
    document.getElementById('integrity').textContent = state.integrity;
    document.getElementById('trust').textContent = state.trust;
    document.getElementById('favour').textContent = state.favour;
    document.getElementById('bar-integrity').style.width = `${state.integrity}%`;
    document.getElementById('bar-trust').style.width = `${state.trust}%`;
    document.getElementById('bar-favour').style.width = `${state.favour}%`;
  }

  function nearest() {
    let best = null;
    const p = worldPos(player);
    interactables.forEach((item) => {
      if (item.hidden()) return;
      const d = p.distanceTo(worldPos(item.object));
      if (!best || d < best.dist) best = { item, dist: d };
    });
    return best;
  }

  function promptText(item) {
    if (!item) return 'Move closer to objective marker.';
    if (item.id === 'child') return 'E Secure Civilian';
    if (item.id === 'laptop') return state.laptopScanned ? 'E Collect Evidence Laptop' : 'F Scan Evidence Laptop';
    if (item.id === 'cash') return state.cashScanned ? 'E Collect Cash Evidence' : 'F Scan Cash Evidence';
    if (item.id === 'suspect') return state.childSecured ? 'E Arrest Suspect' : 'Secure civilian before arresting suspect';
    if (item.id === 'monitors') return 'F Inspect Desk Monitors';
    return 'Perimeter secure';
  }

  function createScanRing(object) {
    const p = worldPos(object).project(camera);
    const x = (p.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
    const ring = document.createElement('div');
    ring.className = 'scan-ring';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    document.body.appendChild(ring);
    setTimeout(() => ring.remove(), 700);
  }

  function scan(id) {
    if (id === 'laptop' && !state.laptopScanned) {
      state.laptopScanned = true;
      state.xp += 40;
      state.integrity = Math.min(100, state.integrity + 3);
      createScanRing(laptop);
      audio.scan();
      addFeed('Laptop scanned. Evidence wipe prevented. +40 XP');
    } else if (id === 'cash' && !state.cashScanned) {
      state.cashScanned = true;
      state.xp += 20;
      createScanRing(cash);
      audio.scan();
      addFeed('Cash scanned. Press E to collect. +20 XP');
    } else if (id === 'monitors' && !state.monitorsInspected) {
      state.monitorsInspected = true;
      state.xp += 15;
      createScanRing(monitors);
      audio.scan();
      addFeed('Desk monitors inspected. Supporting evidence logged. +15 XP');
    } else {
      addFeed('No new scan available.');
    }
    renderObjectives();
  }

  function interact(id) {
    if (id === 'child' && !state.childSecured) {
      state.childSecured = true;
      state.xp += 35;
      state.trust = Math.min(100, state.trust + 8);
      child.visible = false;
      audio.secure();
      addFeed('Civilian secured. +35 XP');
    } else if (id === 'laptop') {
      if (!state.laptopScanned) return addFeed('Scan laptop first with F.');
      if (!state.laptopCollected) {
        state.laptopCollected = true;
        state.xp += 50;
        laptop.visible = false;
        audio.collect();
        addFeed('Evidence laptop collected. +50 XP');
      }
    } else if (id === 'cash') {
      if (!state.cashScanned) return addFeed('Scan cash first with F.');
      if (!state.cashCollected) {
        state.cashCollected = true;
        state.xp += 30;
        cash.visible = false;
        audio.collect();
        addFeed('Cash evidence collected. +30 XP');
      }
    } else if (id === 'suspect') {
      if (!state.childSecured) return addFeed('Secure the civilian before arresting the suspect.');
      if (!state.suspectArrested) {
        state.suspectArrested = true;
        state.xp += 75;
        state.integrity = Math.min(100, state.integrity + 5);
        state.favour = Math.min(100, state.favour + 6);
        suspect.rotation.z = -0.38;
        suspect.position.y = -0.18;
        audio.arrest();
        addFeed('Suspect arrested non-lethally. +75 XP');
      }
    }
    renderObjectives();
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function completeCheck() {
    const done = state.childSecured && state.laptopScanned && state.laptopCollected && state.cashScanned && state.cashCollected && state.suspectArrested;
    if (!done || state.missionComplete) return;
    state.missionComplete = true;
    completeSummary.innerHTML = `
      <p>Mission Time: ${formatTime(state.elapsedSeconds)}</p>
      <p>Evidence Collected: Laptop / Cash</p>
      <p>Civilians Secured: 1</p>
      <p>Force Used: 0</p>
      <p>Integrity Change: +8</p>
      <p>Public Trust Change: +8</p>
      <p>Agency Favour Change: +6</p>
      <p>XP Earned: +${state.xp}</p>
    `;
    completeOverlay.classList.add('show');
    audio.complete();
    addFeed('Mission complete. Operation Night Raid successful.');
  }

  function updateMarkers() {
    markersEl.innerHTML = '';
    const current = nearest();
    state.current = current;
    interactables.forEach((item) => {
      if (item.hidden()) return;
      const p = worldPos(item.object).clone();
      p.y += item.id === 'cash' || item.id === 'laptop' ? 0.5 : 1.45;
      p.project(camera);
      if (p.z > 1 || p.z < -1) return;
      const x = (p.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
      if (x < -90 || x > window.innerWidth + 90 || y < -90 || y > window.innerHeight + 90) return;
      const d = worldPos(player).distanceTo(worldPos(item.object));
      const marker = document.createElement('div');
      marker.className = `marker ${current && current.item === item && d <= item.radius ? 'near' : ''}`;
      marker.textContent = item.label;
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.style.opacity = Math.max(0.25, 1 - d / 7).toFixed(2);
      markersEl.appendChild(marker);
    });
  }

  function updateMinimap() {
    mctx.clearRect(0, 0, minimap.width, minimap.height);
    mctx.fillStyle = '#0b1627';
    mctx.beginPath();
    mctx.arc(90, 90, 86, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#2d3e58';
    mctx.lineWidth = 2;
    mctx.strokeRect(34, 46, 112, 78);
    function dot(p, color) {
      mctx.fillStyle = color;
      mctx.beginPath();
      mctx.arc(90 + p.x * 16, 90 + p.z * 18, 4, 0, Math.PI * 2);
      mctx.fill();
    }
    dot(player.position, '#d8ab5b');
    if (!state.childSecured) dot(child.position, '#6ed9ff');
    if (!state.suspectArrested) dot(suspect.position, '#ff7a7a');
    if (!state.cashCollected) dot(cash.position, '#8cff9b');
    if (!state.laptopCollected) dot(laptop.position, '#a3fffa');
  }

  function updateRain(dt) {
    const p = rain.geometry.attributes.position;
    for (let i = 0; i < rainCount; i += 1) {
      p.array[i * 3 + 1] -= dt * 2.4;
      if (p.array[i * 3 + 1] < 0) p.array[i * 3 + 1] = Math.random() * 6 + 1;
    }
    p.needsUpdate = true;
  }

  function move(dt) {
    if (!state.started || state.missionComplete) return;
    const speed = (state.sprinting ? 1.95 : 1.15) * (state.crouching ? 0.55 : 1);
    const delta = new THREE.Vector3(0, 0, 0);
    if (state.keys.KeyW) delta.z -= 1;
    if (state.keys.KeyS) delta.z += 1;
    if (state.keys.KeyA) delta.x -= 1;
    if (state.keys.KeyD) delta.x += 1;
    if (delta.lengthSq() > 0) {
      delta.normalize().multiplyScalar(speed * dt);
      player.position.add(delta);
      player.rotation.y = Math.atan2(delta.x, delta.z);
    }
    player.position.x = Math.max(playableBounds.minX, Math.min(playableBounds.maxX, player.position.x));
    player.position.z = Math.max(playableBounds.minY, Math.min(playableBounds.maxY, player.position.z));
  }

  const timerEl = document.createElement('div');
  timerEl.id = 'timer';
  timerEl.textContent = '00:00';
  const hudTc = document.querySelector('.hud-tc');
  if (hudTc) hudTc.appendChild(timerEl);

  function updateIdleAnim() {
    const t = Date.now() * 0.002;
    if (!state.suspectArrested) {
      suspect.rotation.y = -0.75 + Math.sin(t) * 0.05;
      suspect.position.y = 0.02 + Math.abs(Math.sin(t * 0.9)) * 0.012;
    }
    if (!state.childSecured) {
      child.rotation.y = 0.4 + Math.sin(t * 1.3 + 1) * 0.04;
      child.position.y = 0.02 + Math.abs(Math.sin(t * 1.6)) * 0.008;
    }
    backup.rotation.y = Math.PI + Math.sin(t * 0.7) * 0.03;
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    move(dt);
    updateRain(dt);
    updateIdleAnim();
    if (state.started && !state.missionComplete) {
      state.elapsedSeconds = (Date.now() - state.startTime) / 1000;
      timerEl.textContent = formatTime(state.elapsedSeconds);
    }
    const phase = Math.sin(Date.now() * 0.008);
    police.color.set(phase > 0 ? 0xff3048 : 0x3a78ff);
    police.intensity = 2.2 + Math.abs(phase) * 2.3;
    player.scale.setScalar(state.crouching ? 0.86 : 1);
    const current = nearest();
    if (current && current.dist <= current.item.radius) {
      promptEl.textContent = promptText(current.item);
    } else {
      promptEl.textContent = state.started ? 'Move closer to objective marker.' : 'Press Start Mission to begin.';
    }
    distanceEl.textContent = current ? `OBJ DIST: ${current.dist.toFixed(1)}m` : 'OBJ DIST: --m';
    updateMarkers();
    updateMinimap();
    completeCheck();
    renderer.render(scene, camera);
  }

  window.addEventListener('keydown', (event) => {
    state.keys[event.code] = true;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') state.sprinting = true;
    if (event.code === 'KeyC' && !event.repeat) state.crouching = !state.crouching;
    if (!state.started || event.repeat) return;
    const current = nearest();
    if (!current || current.dist > current.item.radius) return;
    if (event.code === 'KeyF') scan(current.item.id);
    if (event.code === 'KeyE') interact(current.item.id);
  });

  window.addEventListener('keyup', (event) => {
    state.keys[event.code] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') state.sprinting = false;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function resetMission() {
    Object.assign(state, initialState());
    child.visible = true;
    laptop.visible = true;
    cash.visible = true;
    suspect.visible = true;
    suspect.rotation.set(0, -0.75, 0);
    suspect.position.set(3.45, 0.02, 0.7);
    child.position.set(0.55, 0.02, 1.18);
    child.rotation.y = 0.4;
    feedEl.innerHTML = '';
    timerEl.textContent = '00:00';
    completeOverlay.classList.remove('show');
    hud.classList.add('hidden');
    startOverlay.classList.add('show');
    renderObjectives();
    setStatus('Mission reset. Press Start to begin.', 'ok');
  }

  function startMission() {
    state.started = true;
    state.startTime = Date.now();
    startOverlay.classList.remove('show');
    hud.classList.remove('hidden');
    audio.startAmbient();
    setStatus('Cinematic raid running. WASD move, F scan, E interact.', 'ok');
  }

  document.getElementById('start-btn').addEventListener('click', startMission);

  document.getElementById('continue-btn').addEventListener('click', () => {
    completeOverlay.classList.remove('show');
  });

  if (restartBtn) {
    restartBtn.addEventListener('click', resetMission);
  }

  if (isCoarsePointer) {
    const touchUI = document.createElement('div');
    touchUI.className = 'touch-controls';
    touchUI.innerHTML = `
      <div class="dpad">
        <button class="dpad-btn up" data-key="KeyW" aria-label="Move forward">▲</button>
        <button class="dpad-btn left" data-key="KeyA" aria-label="Move left">◀</button>
        <button class="dpad-btn down" data-key="KeyS" aria-label="Move back">▼</button>
        <button class="dpad-btn right" data-key="KeyD" aria-label="Move right">▶</button>
      </div>
      <div class="touch-actions">
        <button class="touch-btn touch-sprint" data-key="ShiftLeft" aria-label="Sprint">⚡</button>
        <button class="touch-btn touch-crouch" data-action="crouch" aria-label="Crouch">⤓</button>
        <button class="touch-btn touch-scan" data-action="scan" aria-label="Scan">F</button>
        <button class="touch-btn touch-interact" data-action="interact" aria-label="Interact">E</button>
      </div>
    `;
    document.body.appendChild(touchUI);

    function pressKey(key, down) {
      state.keys[key] = down;
      if (key === 'ShiftLeft') state.sprinting = down;
    }

    touchUI.querySelectorAll('[data-key]').forEach((btn) => {
      const key = btn.dataset.key;
      const start = (e) => { e.preventDefault(); pressKey(key, true); btn.classList.add('active'); };
      const end = (e) => { e.preventDefault(); pressKey(key, false); btn.classList.remove('active'); };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end);
      btn.addEventListener('touchcancel', end);
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    });

    touchUI.querySelector('.touch-crouch').addEventListener('touchstart', (e) => {
      e.preventDefault();
      state.crouching = !state.crouching;
    }, { passive: false });

    function triggerAction(fn) {
      if (!state.started) return;
      const c = nearest();
      if (!c || c.dist > c.item.radius) return;
      fn(c.item.id);
    }

    const scanBtn = touchUI.querySelector('.touch-scan');
    const interactBtn = touchUI.querySelector('.touch-interact');
    const fire = (fn) => (e) => { e.preventDefault(); triggerAction(fn); };
    scanBtn.addEventListener('touchstart', fire(scan), { passive: false });
    scanBtn.addEventListener('mousedown', fire(scan));
    interactBtn.addEventListener('touchstart', fire(interact), { passive: false });
    interactBtn.addEventListener('mousedown', fire(interact));
  }

  renderObjectives();
  animate();
  setStatus('Runtime ready. Cinematic 2.5D scene is rendering.', 'ok');
})();