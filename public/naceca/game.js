(function () {
  const statusEl = document.getElementById('runtime-status');
  if (!window.THREE) {
    statusEl.textContent = 'Three.js failed to load from CDN. Check network access and reload.';
    statusEl.classList.add('error');
    return;
  }

  const THREE = window.THREE;
  const canvas = document.getElementById('game-canvas');
  const hud = document.getElementById('hud');
  const startOverlay = document.getElementById('start-overlay');
  const missionCompleteOverlay = document.getElementById('mission-complete');
  const promptEl = document.getElementById('prompt');
  const objectivesEl = document.getElementById('objectives');
  const markersEl = document.getElementById('markers');
  const minimap = document.getElementById('minimap');
  const mctx = minimap.getContext('2d');

  statusEl.textContent = 'Three.js loaded. Initializing scene...';

  const state = {
    started: false,
    playerYaw: 0,
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
    keys: {},
    currentInteractable: null
  };

  const objectives = [
    ['Secure civilians', () => state.childSecured],
    ['Prevent evidence wipe', () => state.laptopScanned],
    ['Scan evidence laptop', () => state.laptopScanned],
    ['Collect cash evidence', () => state.cashCollected],
    ['Arrest suspect non-lethally', () => state.suspectArrested]
  ];

  function renderObjectives() {
    objectivesEl.innerHTML = '';
    objectives.forEach(([name, done]) => {
      const li = document.createElement('li');
      li.textContent = name;
      if (done()) li.classList.add('done');
      objectivesEl.appendChild(li);
    });
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.Fog(0x05070d, 20, 85);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 250);

  const hemi = new THREE.HemisphereLight(0x7aa3ff, 0x2c2a24, 0.35);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x7fa2ff, 0.5);
  moon.position.set(25, 30, -20);
  moon.castShadow = true;
  scene.add(moon);
  const lamp = new THREE.PointLight(0xffbb7d, 1.8, 26, 2);
  lamp.position.set(2, 4, 1);
  lamp.castShadow = true;
  scene.add(lamp);
  const redBlue = new THREE.PointLight(0xff2e2e, 1.2, 30);
  redBlue.position.set(12, 3, -10);
  scene.add(redBlue);

  const room = new THREE.Group();
  scene.add(room);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ color: 0x22252e, metalness: 0.5, roughness: 0.15 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  function wall(w, h, x, y, z, ry) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), new THREE.MeshStandardMaterial({ color: 0xcebfa9, roughness: 0.8 }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; m.receiveShadow = true; m.castShadow = true; room.add(m);
    return m;
  }
  wall(24, 8, 0, 4, 9);
  wall(9, 8, -7.5, 4, -9);
  wall(9, 8, 7.5, 4, -9);
  wall(18, 8, -12, 4, 0, Math.PI / 2);
  wall(18, 8, 12, 4, 0, Math.PI / 2);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(6, 6.5), new THREE.MeshPhysicalMaterial({ color: 0x99bbd9, transparent: true, opacity: 0.28, roughness: 0.1, transmission: 0.8 }));
  glass.position.set(0, 3.2, -8.87); room.add(glass);

  const yard = new THREE.Mesh(new THREE.PlaneGeometry(55, 45), new THREE.MeshStandardMaterial({ color: 0x0d1721, roughness: 1 }));
  yard.rotation.x = -Math.PI / 2; yard.position.set(0, -0.01, -24); scene.add(yard);

  function box(w,h,d,color,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;room.add(m);return m;}
  box(4,1,2,0x3c4e67,-6,0.5,2); box(2.2,0.45,1.2,0x4d382c,-6,0.25,-0.6);
  const cash = box(0.9,0.15,0.6,0x4f7f58,-6,0.52,-0.6);
  const desk = box(3.5,1.3,1.7,0x3b2f2e,6.2,0.65,2.7);
  box(0.8,0.5,0.8,0x2a2f36,5.1,0.25,2.3); // cpu
  box(1.2,0.08,0.45,0x1f1f1f,6.2,1.33,2.3); // keyboard
  const monitor1 = box(0.95,0.65,0.06,0x15273c,5.5,1.92,2.3);
  const monitor2 = box(0.95,0.65,0.06,0x15273c,6.9,1.92,2.3);
  const laptop = box(0.9,0.07,0.6,0x1d2028,-2.4,0.55,1.4);
  box(0.2,1.6,0.2,0x384d3e,-10.2,0.8,6.8); box(0.9,0.9,0.9,0x2f6b47,-10.2,1.8,6.8);
  box(2.3,1.3,0.2,0x6b4d39,11.7,3.8,4.4); // portrait

  function palm(x,z){const t=box(0.35,4.3,0.35,0x5a412b,x,2.15,z); const c=box(1.8,0.4,1.8,0x2d6940,x,4.5,z); c.rotation.y=0.4; return [t,c];}
  palm(-8,-17); palm(10,-18);
  box(3.8,1.6,1.8,0x243957,0,-0.2,-16.8); // van

  const rainGeo = new THREE.BufferGeometry();
  const rainCount = 480;
  const arr = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) { arr[i*3]=(Math.random()-0.5)*32; arr[i*3+1]=Math.random()*8+2; arr[i*3+2]=-12-Math.random()*22; }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(arr,3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x88aaff, size: 0.05 }));
  scene.add(rain);

  function createCharacter(colors) {
    const g = new THREE.Group();
    const mat = (c)=> new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35,0.7,4,8), mat(colors.body)); torso.position.y=1.4; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24,16,16), mat(colors.head)); head.position.y=2.15; g.add(head);
    const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1,0.5,4,8), mat(colors.body)); armL.position.set(-0.5,1.4,0); g.add(armL);
    const armR = armL.clone(); armR.position.x=0.5; g.add(armR);
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12,0.55,4,8), mat(colors.legs)); legL.position.set(-0.2,0.55,0); g.add(legL);
    const legR = legL.clone(); legR.position.x=0.2; g.add(legR);
    g.traverse((o)=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    return g;
  }

  const player = createCharacter({ body: 0x1a2b5b, legs: 0x111826, head: 0x6b4b33 });
  player.position.set(-8, 0, 2);
  room.add(player);
  box(0.45,0.55,0.15,0x0f1b30,-8,1.35,2.37); // vest hint

  const suspect = createCharacter({ body: 0xb86f2d, legs: 0x6e2d22, head: 0x5f3f2b });
  suspect.position.set(5.5, 0, 0.6);
  suspect.rotation.y = -2.5;
  room.add(suspect);

  const child = createCharacter({ body: 0x886e5f, legs: 0x2a4570, head: 0x5f3f2b });
  child.scale.set(0.72, 0.72, 0.72);
  child.position.set(-2.5, 0, 2.8);
  child.rotation.x = 0.2;
  room.add(child);

  const backup = createCharacter({ body: 0x324e84, legs: 0x1d2433, head: 0x5f3f2b });
  backup.position.set(2.8,0,-12);
  scene.add(backup);

  const interactables = [
    { id:'child', label:'Civilian', actionLabel:'E Secure Civilian', object: child, pos: child.position, distance: 2.3, hidden: () => state.childSecured },
    { id:'laptop', label:'Evidence Laptop', actionLabel:() => state.laptopScanned ? 'E Collect Evidence' : 'F Scan Evidence', object:laptop, pos:laptop.position, distance:2.2, hidden:()=>state.laptopCollected },
    { id:'cash', label:'Evidence Cash', actionLabel:() => state.cashScanned ? 'E Collect Evidence' : 'F Scan Evidence', object:cash, pos:cash.position, distance:2.2, hidden:()=>state.cashCollected },
    { id:'suspect', label:'Suspect', actionLabel:'E Arrest Suspect', object:suspect, pos:suspect.position, distance:2.6, hidden:()=>state.suspectArrested },
    { id:'monitors', label:'Desk Monitors', actionLabel:'F Inspect Evidence', object:desk, pos:desk.position, distance:2.8, hidden:()=>false },
    { id:'backup', label:'Backup Officer', actionLabel:'Perimeter secured', object:backup, pos:backup.position, distance:0, hidden:()=>false, passive:true }
  ];

  function handleScan(targetId) {
    if (targetId === 'laptop' && !state.laptopScanned) state.laptopScanned = true;
    if (targetId === 'cash' && !state.cashScanned) state.cashScanned = true;
    if (targetId === 'monitors' && !state.monitorsInspected) state.monitorsInspected = true;
    renderObjectives();
  }
  function handleInteract(targetId) {
    if (targetId === 'child') state.childSecured = true;
    if (targetId === 'laptop' && state.laptopScanned) state.laptopCollected = true;
    if (targetId === 'cash' && state.cashScanned) state.cashCollected = true;
    if (targetId === 'suspect' && state.childSecured) {
      state.suspectArrested = true;
      suspect.rotation.x = 0.1;
      suspect.position.y = -0.2;
    }
    renderObjectives();
  }

  function updatePrompt() {
    const nearest = findNearestInteractable();
    state.currentInteractable = nearest;
    if (!nearest || nearest.dist > nearest.item.distance) {
      promptEl.textContent = 'Move closer to objective marker.';
      return;
    }
    const label = typeof nearest.item.actionLabel === 'function' ? nearest.item.actionLabel() : nearest.item.actionLabel;
    if (nearest.item.id === 'suspect' && !state.childSecured) {
      promptEl.textContent = 'Secure civilian before arresting suspect.';
      return;
    }
    promptEl.textContent = label;
  }

  function findNearestInteractable() {
    let best = null;
    interactables.forEach((item) => {
      if (item.hidden && item.hidden()) return;
      const d = player.position.distanceTo(item.pos);
      if (!best || d < best.dist) best = { item, dist: d };
    });
    return best;
  }

  function updateMissionComplete() {
    const done = state.childSecured && state.laptopScanned && state.laptopCollected && state.cashScanned && state.cashCollected && state.suspectArrested;
    if (done && !state.missionComplete) {
      state.missionComplete = true;
      missionCompleteOverlay.classList.add('show');
    }
  }

  function updateMarkers() {
    markersEl.innerHTML = '';
    interactables.forEach((item) => {
      if (item.hidden && item.hidden()) return;
      const p = item.pos.clone().add(new THREE.Vector3(0, 1.7, 0));
      p.project(camera);
      if (p.z > 1) return;
      const x = (p.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
      const d = player.position.distanceTo(item.pos);
      const marker = document.createElement('div');
      marker.className = 'marker';
      marker.textContent = item.label;
      marker.style.left = x + 'px';
      marker.style.top = y + 'px';
      marker.style.opacity = Math.max(0.2, 1 - d / 20).toFixed(2);
      markersEl.appendChild(marker);
    });
  }

  function updateMinimap() {
    mctx.clearRect(0, 0, minimap.width, minimap.height);
    mctx.fillStyle = '#0b1627';
    mctx.beginPath(); mctx.arc(90,90,88,0,Math.PI*2); mctx.fill();
    mctx.strokeStyle = '#2d3e58'; mctx.lineWidth = 2;
    mctx.strokeRect(36, 42, 108, 82);
    function dot(x,z,color){mctx.fillStyle=color;mctx.beginPath();mctx.arc(90+x*3,90+z*3,4,0,Math.PI*2);mctx.fill();}
    dot(player.position.x, player.position.z, '#d8ab5b');
    if (!state.childSecured) dot(child.position.x, child.position.z, '#6ed9ff');
    if (!state.suspectArrested) dot(suspect.position.x, suspect.position.z, '#ff7a7a');
    if (!state.cashCollected) dot(cash.position.x, cash.position.z, '#7fff97');
    if (!state.laptopCollected) dot(laptop.position.x, laptop.position.z, '#a3fffa');
  }

  const clock = new THREE.Clock();
  const bounds = { x: 11, z: 7.6 };

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    const speed = (state.sprinting ? 7.2 : 4.3) * (state.crouching ? 0.55 : 1);
    const forward = new THREE.Vector3(Math.sin(state.playerYaw), 0, Math.cos(state.playerYaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const move = new THREE.Vector3();
    if (state.keys['KeyW']) move.add(forward);
    if (state.keys['KeyS']) move.sub(forward);
    if (state.keys['KeyA']) move.sub(right);
    if (state.keys['KeyD']) move.add(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      player.position.add(move);
      player.rotation.y = Math.atan2(move.x, move.z);
    }
    player.position.x = Math.max(-bounds.x, Math.min(bounds.x, player.position.x));
    player.position.z = Math.max(-bounds.z, Math.min(bounds.z, player.position.z));

    const camHeight = state.crouching ? 1.2 : 1.7;
    const back = 3.2;
    const camTarget = new THREE.Vector3(player.position.x, camHeight, player.position.z);
    const camPos = camTarget.clone().add(new THREE.Vector3(Math.sin(state.playerYaw + Math.PI) * back, 1.2 + state.pitch * 1.8, Math.cos(state.playerYaw + Math.PI) * back));
    camera.position.lerp(camPos, 0.18);
    camera.lookAt(camTarget.x, camTarget.y + 0.5, camTarget.z);

    redBlue.color.setHSL((Date.now() * 0.0012) % 1 > 0.5 ? 0 : 0.62, 1, 0.5);

    const pos = rain.geometry.attributes.position;
    for (let i = 0; i < rainCount; i++) {
      pos.array[i*3+1] -= dt * 6;
      if (pos.array[i*3+1] < 0) pos.array[i*3+1] = Math.random() * 10 + 4;
    }
    pos.needsUpdate = true;

    updatePrompt();
    updateMarkers();
    updateMinimap();
    updateMissionComplete();

    const nearest = findNearestInteractable();
    document.getElementById('distance').textContent = nearest ? `OBJ DIST: ${nearest.dist.toFixed(1)}m` : 'OBJ DIST: --m';

    renderer.render(scene, camera);
  }

  function onKeyDown(e) {
    state.keys[e.code] = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.sprinting = true;
    if (e.code === 'KeyC') state.crouching = !state.crouching;
    if ((e.code === 'KeyF' || e.code === 'KeyE') && state.currentInteractable && state.currentInteractable.dist <= state.currentInteractable.item.distance) {
      if (e.code === 'KeyF') handleScan(state.currentInteractable.item.id);
      if (e.code === 'KeyE') handleInteract(state.currentInteractable.item.id);
    }
  }
  function onKeyUp(e) {
    state.keys[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.sprinting = false;
  }

  let dragging = false;
  window.addEventListener('mousedown', () => { dragging = true; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', (e) => {
    if (!state.started || !(dragging || document.pointerLockElement === canvas)) return;
    state.playerYaw -= e.movementX * 0.003;
    state.pitch = Math.max(-0.25, Math.min(0.55, state.pitch - e.movementY * 0.002));
  });

  canvas.addEventListener('click', () => {
    if (state.started && document.pointerLockElement !== canvas) canvas.requestPointerLock();
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
    canvas.requestPointerLock();
  });
  document.getElementById('continue-btn').addEventListener('click', () => {
    missionCompleteOverlay.classList.remove('show');
  });

  renderObjectives();
  animate();
  statusEl.textContent = 'Runtime ready.';
  statusEl.classList.add('ok');
})();
