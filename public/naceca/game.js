(function () {
  'use strict';

  const statusEl = document.getElementById('runtime-status');
  const canvas = document.getElementById('game-canvas');
  const hud = document.getElementById('hud');
  const startOverlay = document.getElementById('start-overlay');
  const missionCompleteOverlay = document.getElementById('mission-complete');
  const promptEl = document.getElementById('prompt');
  const objectivesEl = document.getElementById('objectives');
  const markersEl = document.getElementById('markers');
  const minimap = document.getElementById('minimap');
  const distanceEl = document.getElementById('distance');
  const mctx = minimap.getContext('2d');

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.toggle('ok', type === 'ok');
    statusEl.classList.toggle('error', type === 'error');
  }

  window.addEventListener('error', (event) => {
    setStatus(`Runtime error: ${event.message}`, 'error');
  });

  if (!window.THREE) {
    setStatus('Three.js failed to load from CDN. Check network access and reload.', 'error');
    return;
  }

  const THREE = window.THREE;
  setStatus('Three.js loaded. Initializing playable raid level...', 'ok');

  const state = {
    started: false,
    playerYaw: Math.PI * 0.62,
    pitch: 0.22,
    crouching: false,
    sprinting: false,
    childSecured: false,
    laptopScanned: false,
    laptopCollected: false,
    cashScanned: false,
    cashCollected: false,
    suspectArrested: false,
    monitorsInspected: false,
    missionComplete: false,
    xp: 0,
    integrity: 65,
    trust: 62,
    favour: 58,
    keys: {},
    currentInteractable: null,
    feed: []
  };

  const objectives = [
    ['Secure civilians', () => state.childSecured],
    ['Prevent evidence wipe', () => state.laptopScanned],
    ['Scan evidence laptop', () => state.laptopScanned],
    ['Collect cash evidence', () => state.cashCollected],
    ['Arrest suspect non-lethally', () => state.suspectArrested]
  ];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.Fog(0x05070d, 24, 92);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 250);
  const room = new THREE.Group();
  scene.add(room);

  const clock = new THREE.Clock();
  const bounds = { x: 10.8, z: 7.3 };

  function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.65,
      metalness: options.metalness ?? 0.05,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1,
      map: options.map || null,
      side: options.side || THREE.FrontSide
    });
  }

  function makeTexture(draw) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    draw(ctx, c);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function marbleTexture() {
    const tex = makeTexture((ctx) => {
      const g = ctx.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, '#2e3036');
      g.addColorStop(0.45, '#60544c');
      g.addColorStop(1, '#24272e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 120; i += 1) {
        ctx.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.08})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = Math.random() * 512;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j += 1) {
          x += (Math.random() - 0.5) * 140;
          y += (Math.random() - 0.5) * 120;
          ctx.quadraticCurveTo(x, y, x + 20, y + 12);
        }
        ctx.stroke();
      }
    });
    tex.repeat.set(3, 2.2);
    return tex;
  }

  function patternTexture() {
    const tex = makeTexture((ctx) => {
      ctx.fillStyle = '#bf6b2b';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(80,35,16,.35)';
      ctx.lineWidth = 8;
      for (let x = -60; x < 580; x += 70) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 90, 110, x - 60, 220, x + 25, 340);
        ctx.bezierCurveTo(x + 100, 430, x - 10, 500, x + 80, 560);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffe3a2';
      for (let i = 0; i < 34; i += 1) {
        const x = (i * 83) % 512;
        const y = (i * 137) % 512;
        ctx.beginPath();
        ctx.ellipse(x, y, 16, 8, (i % 6) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    tex.repeat.set(1.35, 1.35);
    return tex;
  }

  function chartTexture(title) {
    return makeTexture((ctx) => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(255,255,255,.08)';
      for (let i = 24; i < 512; i += 44) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      ctx.fillStyle = '#dbeafe';
      ctx.font = 'bold 30px Arial';
      ctx.fillText(title, 24, 48);
      ['#67e8f9', '#facc15', '#fb7185'].forEach((color, row) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        let y = 150 + row * 54;
        ctx.moveTo(24, y);
        for (let x = 64; x < 492; x += 42) {
          y += (Math.random() - 0.43) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    });
  }

  function labelTexture(text) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function box(w, h, d, color, x, y, z, parent = room, options = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, options));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(r1, r2, h, color, x, y, z, parent = room, segments = 14, options = {}) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments), material(color, options));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function sphere(r, color, x, y, z, parent = room, segments = 16, options = {}) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), material(color, options));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const hemi = new THREE.HemisphereLight(0x7aa3ff, 0x2c2a24, 0.55);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x7fa2ff, 0.75);
  moon.position.set(25, 30, -20);
  moon.castShadow = true;
  scene.add(moon);
  const lamp = new THREE.PointLight(0xffbb7d, 2.8, 28, 2);
  lamp.position.set(-4.6, 4, 1.4);
  lamp.castShadow = true;
  scene.add(lamp);
  const deskLamp = new THREE.PointLight(0xffa664, 1.7, 18, 2);
  deskLamp.position.set(6.3, 3.4, 2.1);
  scene.add(deskLamp);
  const redBlue = new THREE.PointLight(0xff2e2e, 1.6, 34);
  redBlue.position.set(8, 3.5, -12);
  scene.add(redBlue);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 18),
    material(0xffffff, { map: marbleTexture(), metalness: 0.48, roughness: 0.18 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  function wall(w, h, x, y, z, ry = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), material(0xcebfa9, { roughness: 0.82 }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    room.add(mesh);
    return mesh;
  }

  wall(24, 8, 0, 4, 9);
  wall(9, 8, -7.5, 4, -9);
  wall(9, 8, 7.5, 4, -9);
  wall(18, 8, -12, 4, 0, Math.PI / 2);
  wall(18, 8, 12, 4, 0, Math.PI / 2);

  const wood = 0x4d382c;
  [-6, -3, 0, 3, 6].forEach((x) => box(0.08, 2.7, 0.1, wood, x, 2.05, 8.78));
  [0.62, 2.05, 3.45].forEach((y) => box(23, 0.08, 0.1, wood, 0, y, 8.78));
  [-3.8, 3.8].forEach((x) => box(0.65, 4.9, 0.08, 0xb28b6c, x, 2.8, -8.76));

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(7.3, 6.4),
    new THREE.MeshPhysicalMaterial({ color: 0x99bbd9, transparent: true, opacity: 0.25, roughness: 0.05, transmission: 0.65 })
  );
  glass.position.set(0, 3.2, -8.87);
  room.add(glass);

  const yard = new THREE.Mesh(new THREE.PlaneGeometry(55, 45), material(0x0d1721, { roughness: 1 }));
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0, -0.01, -24);
  scene.add(yard);

  function addReflection(color, x, z, scaleX, scaleZ) {
    const tex = makeTexture((ctx) => {
      const gradient = ctx.createRadialGradient(256, 256, 6, 256, 256, 280);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.35, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(scaleX, scaleZ), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.025, z);
    room.add(mesh);
    return mesh;
  }
  addReflection('#306cff', -1.6, -5.4, 5.5, 2.3);
  addReflection('#ff3048', 2.6, -5.1, 4.4, 2.0);

  // Furniture and props
  box(4.2, 0.8, 1.7, 0x3c4e67, -6.2, 0.4, 2.0);
  box(4.2, 1.2, 0.35, 0x34455c, -6.2, 1.0, 1.22);
  box(0.75, 0.35, 0.18, 0xd8c5b2, -7.1, 1.12, 2.35);
  box(0.75, 0.35, 0.18, 0x2b4570, -5.9, 1.12, 2.35);
  box(0.75, 0.35, 0.18, 0xd8c5b2, -4.8, 1.12, 2.35);
  box(2.2, 0.45, 1.2, 0x4d382c, -6, 0.25, -0.6);

  const cash = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const stack = box(0.62, 0.13, 0.38, 0x5d9b66, -0.62 + (i % 3) * 0.45, 0.07 + Math.floor(i / 3) * 0.16, 0.02 + (i % 2) * 0.28, cash, { roughness: 0.5 });
    box(0.64, 0.02, 0.04, 0xf2e7c9, stack.position.x, stack.position.y + 0.08, stack.position.z, cash);
  }
  cash.position.set(-6.25, 0.52, -0.77);
  room.add(cash);

  const desk = box(3.5, 1.3, 1.7, 0x3b2f2e, 6.2, 0.65, 2.7);
  const cpu = box(0.8, 0.5, 0.8, 0x2a2f36, 5.1, 0.25, 2.3);
  box(1.2, 0.08, 0.45, 0x1f1f1f, 6.2, 1.33, 2.3);
  const monitorMat1 = material(0xffffff, { map: chartTexture('Fraud Ledger'), emissive: 0x1d4ed8, emissiveIntensity: 0.25 });
  const monitorMat2 = material(0xffffff, { map: chartTexture('Wallet Flow'), emissive: 0x1d4ed8, emissiveIntensity: 0.25 });
  const monitor1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.06), monitorMat1);
  monitor1.position.set(5.5, 1.92, 2.3);
  monitor1.castShadow = true;
  room.add(monitor1);
  const monitor2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.06), monitorMat2);
  monitor2.position.set(6.9, 1.92, 2.3);
  monitor2.castShadow = true;
  room.add(monitor2);

  const laptop = new THREE.Group();
  const base = box(0.9, 0.07, 0.6, 0x1d2028, 0, 0, 0, laptop, { metalness: 0.25, roughness: 0.3 });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.05), material(0xffffff, { map: chartTexture('Evidence Laptop'), emissive: 0x22d3ee, emissiveIntensity: 0.45 }));
  screen.position.set(0, 0.3, -0.3);
  screen.rotation.x = -0.95;
  laptop.add(screen);
  laptop.position.set(-2.4, 0.55, 1.4);
  room.add(laptop);

  box(0.2, 1.6, 0.2, 0x384d3e, -10.2, 0.8, 6.8);
  sphere(0.62, 0x2f6b47, -10.2, 1.8, 6.8);
  box(2.3, 1.3, 0.2, 0x6b4d39, 11.7, 3.8, 4.4);
  box(0.32, 0.05, 0.55, 0x101010, -5.35, 0.55, -0.2);

  function palm(x, z) {
    const trunk = cylinder(0.18, 0.26, 4.3, 0x5a412b, x, 2.15, z, scene, 8);
    for (let i = 0; i < 6; i += 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.2, 5), material(0x2d6940));
      const angle = (i / 6) * Math.PI * 2;
      leaf.position.set(x + Math.cos(angle) * 0.35, 4.6, z + Math.sin(angle) * 0.35);
      leaf.rotation.z = Math.PI / 2.2;
      leaf.rotation.y = angle;
      leaf.castShadow = true;
      scene.add(leaf);
    }
    return trunk;
  }
  palm(-8, -17);
  palm(10, -18);
  const van = new THREE.Group();
  box(3.8, 1.35, 1.8, 0x243957, 0, 0.7, 0, van);
  box(1.6, 0.7, 1.55, 0x314a6c, -0.65, 1.45, 0, van);
  van.position.set(0, 0, -16.8);
  scene.add(van);

  const rainGeo = new THREE.BufferGeometry();
  const rainCount = 520;
  const arr = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i += 1) {
    arr[i * 3] = (Math.random() - 0.5) * 34;
    arr[i * 3 + 1] = Math.random() * 9 + 2;
    arr[i * 3 + 2] = -12 - Math.random() * 24;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x88aaff, size: 0.05, transparent: true, opacity: 0.7 }));
  scene.add(rain);

  function createCharacter(colors, options = {}) {
    const g = new THREE.Group();
    const mat = (c, opts = {}) => material(c, { roughness: 0.62, ...opts });
    const scale = options.scale || 1;
    const seated = Boolean(options.seated);
    const crouched = Boolean(options.crouched);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * scale, 0.42 * scale, 1.0 * scale, 14), mat(colors.body, colors.bodyOptions));
    torso.position.y = (seated ? 1.18 : crouched ? 0.92 : 1.35) * scale;
    g.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 16, 16), mat(colors.head));
    head.position.y = (seated ? 1.93 : crouched ? 1.46 : 2.05) * scale;
    g.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255 * scale, 12, 8), mat(0x111111));
    hair.scale.set(1, 0.35, 1);
    hair.position.y = head.position.y + 0.17 * scale;
    g.add(hair);

    const eyes = [-0.075, 0.075].map((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022 * scale, 8, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      eye.position.set(x * scale, head.position.y + 0.035 * scale, 0.235 * scale);
      g.add(eye);
      return eye;
    });

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.09 * scale, 0.75 * scale, 10), mat(colors.body, colors.bodyOptions));
    const armR = armL.clone();
    if (options.handsUp) {
      armL.position.set(-0.52 * scale, 1.55 * scale, 0.05);
      armR.position.set(0.52 * scale, 1.55 * scale, 0.05);
      armL.rotation.z = -0.72;
      armR.rotation.z = 0.72;
    } else if (crouched) {
      armL.position.set(-0.38 * scale, 0.85 * scale, 0.22 * scale);
      armR.position.set(0.38 * scale, 0.85 * scale, 0.22 * scale);
      armL.rotation.x = 1.15;
      armR.rotation.x = 1.15;
    } else {
      armL.position.set(-0.48 * scale, 1.28 * scale, 0);
      armR.position.set(0.48 * scale, 1.28 * scale, 0);
      armL.rotation.z = 0.22;
      armR.rotation.z = -0.22;
    }
    g.add(armL, armR);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.75 * scale, 10), mat(colors.legs));
    const legR = legL.clone();
    if (seated) {
      legL.position.set(-0.2 * scale, 0.52 * scale, 0.32 * scale);
      legR.position.set(0.2 * scale, 0.52 * scale, 0.32 * scale);
      legL.rotation.x = Math.PI / 2.6;
      legR.rotation.x = Math.PI / 2.6;
    } else if (crouched) {
      legL.position.set(-0.18 * scale, 0.36 * scale, 0.18 * scale);
      legR.position.set(0.18 * scale, 0.36 * scale, 0.18 * scale);
      legL.rotation.x = Math.PI / 3.2;
      legR.rotation.x = Math.PI / 3.2;
    } else {
      legL.position.set(-0.18 * scale, 0.48 * scale, 0);
      legR.position.set(0.18 * scale, 0.48 * scale, 0);
    }
    g.add(legL, legR);

    if (colors.gear) {
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.72 * scale, 0.62 * scale, 0.18 * scale), mat(0x0f1b30));
      vest.position.set(0, 1.35 * scale, 0.12 * scale);
      g.add(vest);
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.48 * scale, 0.14 * scale), new THREE.MeshBasicMaterial({ map: labelTexture('NACECA'), transparent: true }));
      patch.position.set(0, 1.38 * scale, 0.215 * scale);
      g.add(patch);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.09 * scale, 0.3 * scale), mat(0x090d14));
      belt.position.set(0, 0.86 * scale, 0.05 * scale);
      g.add(belt);
      const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.10 * scale, 0.78 * scale), mat(0x111111, { metalness: 0.25 }));
      weapon.position.set(0.16 * scale, 1.02 * scale, 0.48 * scale);
      weapon.rotation.x = 0.25;
      g.add(weapon);
    }

    g.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return g;
  }

  const player = createCharacter({ body: 0x1a2b5b, legs: 0x111826, head: 0x6b4b33, gear: true });
  player.position.set(-8, 0, 2);
  room.add(player);

  const suspect = createCharacter({ body: 0xffffff, bodyOptions: { map: patternTexture() }, legs: 0x6e2d22, head: 0x5f3f2b }, { seated: true, handsUp: true, scale: 1.14 });
  suspect.position.set(5.5, 0, 0.6);
  suspect.rotation.y = -2.5;
  room.add(suspect);
  const chair = box(0.95, 0.12, 0.95, 0x151821, 5.5, 0.56, 0.75);
  cylinder(0.06, 0.06, 0.85, 0x151821, 5.5, 0.35, 0.75);

  const child = createCharacter({ body: 0x886e5f, legs: 0x2a4570, head: 0x5f3f2b }, { crouched: true, scale: 0.72 });
  child.position.set(-2.5, 0, 2.8);
  child.rotation.y = 0.5;
  room.add(child);

  const backup = createCharacter({ body: 0x324e84, legs: 0x1d2433, head: 0x5f3f2b, gear: true }, { scale: 0.96 });
  backup.position.set(2.8, 0, -12);
  backup.rotation.y = Math.PI;
  scene.add(backup);

  const interactables = [
    { id: 'child', label: 'Civilian', actionLabel: 'E Secure Civilian', object: child, distance: 2.3, hidden: () => state.childSecured },
    { id: 'laptop', label: 'Evidence Laptop', actionLabel: () => state.laptopScanned ? 'E Collect Evidence' : 'F Scan Evidence', object: laptop, distance: 2.2, hidden: () => state.laptopCollected },
    { id: 'cash', label: 'Evidence Cash', actionLabel: () => state.cashScanned ? 'E Collect Evidence' : 'F Scan Evidence', object: cash, distance: 2.2, hidden: () => state.cashCollected },
    { id: 'suspect', label: 'Suspect', actionLabel: 'E Arrest Suspect', object: suspect, distance: 2.6, hidden: () => state.suspectArrested },
    { id: 'monitors', label: 'Desk Monitors', actionLabel: 'F Inspect Evidence', object: desk, distance: 2.8, hidden: () => false },
    { id: 'backup', label: 'Backup Officer', actionLabel: 'Perimeter secured', object: backup, distance: 0, hidden: () => false, passive: true }
  ];

  function worldPosition(object) {
    const position = new THREE.Vector3();
    object.getWorldPosition(position);
    return position;
  }

  function addMessage(text) {
    state.feed.unshift(text);
    state.feed = state.feed.slice(0, 4);
    setStatus(text, 'ok');
  }

  function renderObjectives() {
    objectivesEl.innerHTML = '';
    objectives.forEach(([name, done]) => {
      const li = document.createElement('li');
      li.textContent = name;
      if (done()) li.classList.add('done');
      objectivesEl.appendChild(li);
    });
    document.getElementById('integrity').textContent = state.integrity;
    document.getElementById('trust').textContent = state.trust;
    document.getElementById('favour').textContent = state.favour;
    document.getElementById('bar-integrity').style.width = `${state.integrity}%`;
    document.getElementById('bar-trust').style.width = `${state.trust}%`;
    document.getElementById('bar-favour').style.width = `${state.favour}%`;
  }

  function findNearestInteractable() {
    let best = null;
    const playerPos = worldPosition(player);
    interactables.forEach((item) => {
      if (item.hidden && item.hidden()) return;
      const d = playerPos.distanceTo(worldPosition(item.object));
      if (!best || d < best.dist) best = { item, dist: d };
    });
    return best;
  }

  function handleScan(targetId) {
    if (targetId === 'laptop' && !state.laptopScanned) {
      state.laptopScanned = true;
      state.xp += 40;
      state.integrity = Math.min(100, state.integrity + 3);
      addMessage('Laptop scanned. Evidence wipe prevented. +40 XP');
    } else if (targetId === 'cash' && !state.cashScanned) {
      state.cashScanned = true;
      state.xp += 20;
      addMessage('Cash scanned. Press E to collect. +20 XP');
    } else if (targetId === 'monitors' && !state.monitorsInspected) {
      state.monitorsInspected = true;
      state.xp += 15;
      addMessage('Desk monitors inspected. Supporting evidence logged. +15 XP');
    } else {
      addMessage('Already scanned or no evidence scan available.');
    }
    renderObjectives();
  }

  function handleInteract(targetId) {
    if (targetId === 'child' && !state.childSecured) {
      state.childSecured = true;
      state.xp += 35;
      state.trust = Math.min(100, state.trust + 8);
      child.visible = false;
      addMessage('Civilian secured. +35 XP');
    } else if (targetId === 'laptop') {
      if (!state.laptopScanned) {
        addMessage('Scan laptop first with F.');
        return;
      }
      if (!state.laptopCollected) {
        state.laptopCollected = true;
        state.xp += 50;
        laptop.visible = false;
        addMessage('Laptop evidence collected. +50 XP');
      }
    } else if (targetId === 'cash') {
      if (!state.cashScanned) {
        addMessage('Scan cash first with F.');
        return;
      }
      if (!state.cashCollected) {
        state.cashCollected = true;
        state.xp += 30;
        cash.visible = false;
        addMessage('Cash evidence collected. +30 XP');
      }
    } else if (targetId === 'suspect') {
      if (!state.childSecured) {
        addMessage('Secure civilian before arresting suspect.');
        return;
      }
      if (!state.suspectArrested) {
        state.suspectArrested = true;
        state.xp += 75;
        state.integrity = Math.min(100, state.integrity + 5);
        state.favour = Math.min(100, state.favour + 6);
        suspect.rotation.x = 0.22;
        suspect.position.y = -0.35;
        addMessage('Suspect arrested non-lethally. +75 XP');
      }
    }
    renderObjectives();
  }

  function updatePrompt() {
    const nearest = findNearestInteractable();
    state.currentInteractable = nearest;
    if (!nearest || nearest.dist > nearest.item.distance) {
      promptEl.textContent = state.started ? 'Move closer to objective marker.' : 'Press Start Mission to begin.';
      return;
    }
    const label = typeof nearest.item.actionLabel === 'function' ? nearest.item.actionLabel() : nearest.item.actionLabel;
    if (nearest.item.id === 'suspect' && !state.childSecured) {
      promptEl.textContent = 'Secure civilian before arresting suspect.';
      return;
    }
    promptEl.textContent = label;
  }

  function updateMissionComplete() {
    const done = state.childSecured && state.laptopScanned && state.laptopCollected && state.cashScanned && state.cashCollected && state.suspectArrested;
    if (done && !state.missionComplete) {
      state.missionComplete = true;
      const completePanel = missionCompleteOverlay.querySelector('.complete-panel');
      completePanel.innerHTML = `
        <h2>Mission Complete</h2>
        <p>Evidence Collected: Laptop / Cash</p>
        <p>Civilians Secured: 1</p>
        <p>Force Used: 0</p>
        <p>Integrity Change: +8</p>
        <p>Public Trust Change: +12</p>
        <p>Agency Favour Change: +6</p>
        <p>XP Earned: +${state.xp}</p>
        <button id="continue-btn-finished">Continue</button>
      `;
      completePanel.querySelector('#continue-btn-finished').addEventListener('click', () => {
        missionCompleteOverlay.classList.remove('show');
      });
      missionCompleteOverlay.classList.add('show');
      addMessage('Mission complete. Operation Night Raid successful.');
    }
  }

  function updateMarkers() {
    markersEl.innerHTML = '';
    interactables.forEach((item) => {
      if (item.hidden && item.hidden()) return;
      const p = worldPosition(item.object).add(new THREE.Vector3(0, 1.7, 0));
      p.project(camera);
      if (p.z > 1 || p.z < -1) return;
      const x = (p.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
      if (x < -80 || x > window.innerWidth + 80 || y < -80 || y > window.innerHeight + 80) return;
      const d = worldPosition(player).distanceTo(worldPosition(item.object));
      const marker = document.createElement('div');
      marker.className = 'marker';
      marker.textContent = item.label;
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.style.opacity = Math.max(0.2, 1 - d / 20).toFixed(2);
      markersEl.appendChild(marker);
    });
  }

  function updateMinimap() {
    mctx.clearRect(0, 0, minimap.width, minimap.height);
    mctx.fillStyle = '#0b1627';
    mctx.beginPath();
    mctx.arc(90, 90, 88, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#2d3e58';
    mctx.lineWidth = 2;
    mctx.strokeRect(36, 42, 108, 82);
    function dot(x, z, color) {
      mctx.fillStyle = color;
      mctx.beginPath();
      mctx.arc(90 + x * 3, 90 + z * 3, 4, 0, Math.PI * 2);
      mctx.fill();
    }
    dot(player.position.x, player.position.z, '#d8ab5b');
    if (!state.childSecured) dot(child.position.x, child.position.z, '#6ed9ff');
    if (!state.suspectArrested) dot(suspect.position.x, suspect.position.z, '#ff7a7a');
    if (!state.cashCollected) dot(cash.position.x, cash.position.z, '#7fff97');
    if (!state.laptopCollected) dot(laptop.position.x, laptop.position.z, '#a3fffa');
    dot(backup.position.x, backup.position.z, '#8aa4ff');
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (state.started && !state.missionComplete) {
      const speed = (state.sprinting ? 7.2 : 4.3) * (state.crouching ? 0.55 : 1);
      const forward = new THREE.Vector3(Math.sin(state.playerYaw), 0, Math.cos(state.playerYaw));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      const move = new THREE.Vector3();
      if (state.keys.KeyW) move.add(forward);
      if (state.keys.KeyS) move.sub(forward);
      if (state.keys.KeyA) move.sub(right);
      if (state.keys.KeyD) move.add(right);
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * dt);
        player.position.add(move);
        player.rotation.y = Math.atan2(move.x, move.z);
      }
      player.position.x = Math.max(-bounds.x, Math.min(bounds.x, player.position.x));
      player.position.z = Math.max(-bounds.z, Math.min(bounds.z, player.position.z));
    }

    const camHeight = state.crouching ? 1.2 : 1.75;
    const back = 3.35;
    const camTarget = new THREE.Vector3(player.position.x, camHeight, player.position.z);
    const camPos = camTarget.clone().add(new THREE.Vector3(
      Math.sin(state.playerYaw + Math.PI) * back,
      1.2 + state.pitch * 1.8,
      Math.cos(state.playerYaw + Math.PI) * back
    ));
    camera.position.lerp(camPos, 0.18);
    camera.lookAt(camTarget.x, camTarget.y + 0.5, camTarget.z);

    const policePhase = Math.sin(Date.now() * 0.009);
    redBlue.color.set(policePhase > 0 ? 0xff2e2e : 0x3a78ff);
    redBlue.intensity = 1.4 + Math.abs(policePhase) * 1.4;

    const pos = rain.geometry.attributes.position;
    for (let i = 0; i < rainCount; i += 1) {
      pos.array[i * 3 + 1] -= dt * 6;
      if (pos.array[i * 3 + 1] < 0) pos.array[i * 3 + 1] = Math.random() * 10 + 4;
    }
    pos.needsUpdate = true;

    updatePrompt();
    updateMarkers();
    updateMinimap();
    updateMissionComplete();

    const nearest = findNearestInteractable();
    distanceEl.textContent = nearest ? `OBJ DIST: ${nearest.dist.toFixed(1)}m` : 'OBJ DIST: --m';

    renderer.render(scene, camera);
  }

  function onKeyDown(event) {
    state.keys[event.code] = true;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') state.sprinting = true;
    if (event.code === 'KeyC' && !event.repeat) state.crouching = !state.crouching;
    if (!state.started || state.missionComplete || event.repeat) return;
    if ((event.code === 'KeyF' || event.code === 'KeyE') && state.currentInteractable && state.currentInteractable.dist <= state.currentInteractable.item.distance) {
      if (event.code === 'KeyF') handleScan(state.currentInteractable.item.id);
      if (event.code === 'KeyE') handleInteract(state.currentInteractable.item.id);
    }
  }

  function onKeyUp(event) {
    state.keys[event.code] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') state.sprinting = false;
  }

  let dragging = false;
  window.addEventListener('mousedown', () => { dragging = true; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (event) => {
    if (!state.started || !(dragging || document.pointerLockElement === canvas)) return;
    state.playerYaw -= event.movementX * 0.003;
    state.pitch = Math.max(-0.25, Math.min(0.55, state.pitch - event.movementY * 0.002));
  });

  canvas.addEventListener('click', () => {
    if (state.started && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.getElementById('start-btn').addEventListener('click', () => {
    state.started = true;
    startOverlay.classList.remove('show');
    hud.classList.remove('hidden');
    setStatus('Mission running. WASD move, mouse look, F scan, E interact.', 'ok');
    try {
      canvas.requestPointerLock?.();
    } catch (error) {
      setStatus('Mission running. Click the 3D scene to lock mouse.', 'ok');
    }
  });

  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      missionCompleteOverlay.classList.remove('show');
    });
  }

  renderObjectives();
  animate();
  setStatus('Runtime ready. 3D scene is rendering behind the start screen.', 'ok');
})();