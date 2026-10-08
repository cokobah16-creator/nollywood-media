// Shared helpers for the wayfind_* scenarios (run on its own it is a no-op that passes).
//
// The three.js stand-in keeps positions written as properties but ignores `.set(x, y, z)`,
// so scene coordinates would all be 0. boot() makes `.set` with numbers write x/y/z on the
// stand-in's objects (test-only: Function.prototype is the stand-in's prototype chain).
// The stand-in clock's getDelta() returns 0, so the game loop runs frozen; realClock() gives
// it wall-clock deltas, or tests step the systems by hand with a fixed dt (deterministic).
const lib = async h => { h.log('wayfind_lib: helper module'); };

lib.boot = async h => {
  await h.ev(() => {
    if (!Function.prototype.__wfSet) {
      Object.defineProperty(Function.prototype, 'set', { configurable: true, writable: true, value: function (x, y, z) {
        if (typeof x === 'number') { this.x = x; if (typeof y === 'number') this.y = y; if (typeof z === 'number') this.z = z; }
        return this;
      } });
      Object.defineProperty(Function.prototype, '__wfSet', { value: true });
    }
  });
};

lib.realClock = async h => {
  await h.ev(() => {
    let t = performance.now();
    ENGINE.clock = { getDelta() { const n = performance.now(), d = (n - t) / 1000; t = n; return Math.min(0.1, d); } };
  });
};
lib.frozenClock = async h => { await h.ev(() => { ENGINE.clock = { getDelta() { return 0; } }; }); };

// start a mission with real coordinates (the office hubs that come before some cases count as done)
lib.start = async (h, id, o = {}) => {
  await lib.boot(h);
  const state = o.state || (() => {});
  await h.start(id, Object.assign({}, o, { state: S => {
    if (typeof V12 !== 'undefined' && V12.mem) { const m = V12.mem(); m.hubs = m.hubs || {}; ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'].forEach(k => { m.hubs[k] = true; }); }
  } }));
  if (o.state) await h.ev(src => { (new Function('S', src))(S); }, `(${state.toString()})(S)`);
};

// the M2 chase: Tunde and the phone done, then confront KC from `from` (default: at the counter)
lib.marketChase = async (h, from) => {
  await h.ev(from => {
    S.game._marketTunde = true; S.game._marketScanned = true;
    completeObjective('o1_tunde'); completeObjective('o2_scan');
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect');
    ENGINE.player.position.x = from ? from[0] : 5.8; ENGINE.player.position.z = from ? from[1] : 4.6;
    it.onInteract();
  }, from || null);
};

// the M6 chase: briefed, then step over the breach line (updateAsabaTrigger runs every frame)
lib.asabaChase = async h => {
  await h.ev(() => { S.game._asabaBriefed = true; ENGINE.player.position.x = -7.9; ENGINE.player.position.z = 4.0; });
  await h.step(250);
};

// deterministic stepping of the chase systems inside the page (use with frozenClock):
//   __wf.run(seconds, perFrame?) → frames run; perFrame(i, t) may move the player, return true to stop
lib.stepper = async h => {
  await h.ev(() => {
    window.__wf = {
      dt: 1 / 60, t: 0,
      run(secs, fn) {
        const n = Math.round(secs / this.dt); let i = 0;
        for (; i < n; i++) {
          if (fn && fn(i, this.t) === true) break;
          updatePressure(this.dt);
          if (typeof sideTick === 'function') sideTick(this.dt);
          this.t += this.dt;
        }
        return i;
      },
    };
  });
};

// rects overlap
lib.overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

module.exports = lib;
