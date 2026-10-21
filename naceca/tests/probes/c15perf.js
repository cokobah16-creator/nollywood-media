// Case 15: frame cost at the jetty (software rendering), with and without the case's extras
const L = require('./c15lib.js'), sc = L.sc;
module.exports = async function (T) {
  await sc.s2start(T, 'm15', L.STRONG);
  await T.ev(() => { DLG.onComplete = null; if (typeof endDialogue === 'function') endDialogue(); });
  await T.wait(1500);
  const fps = async label => {
    const r = await T.ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res({ n, ms:Math.round((performance.now() - t0) / n) }); }; requestAnimationFrame(f); }));
    const info = await T.ev(() => { const r = ENGINE.renderer.info; let lights = 0, skinned = 0; ENGINE.scene.traverse(o => { if (o.isLight && o.visible) lights++; if (o.isSkinnedMesh) skinned++; }); return { calls:r.render.calls, tris:r.render.triangles, lights, skinned, px:ENGINE.renderer.getPixelRatio() }; });
    T.log(label, JSON.stringify(r), JSON.stringify(info));
  };
  await T.ev(() => { ENGINE.movementEnabled = true; showHUD(true); TPCAM.override = null; const P = ENGINE.player; P.position.set(-6.4, 0, -16.4); P.rotation.y = 2.3; ENGINE.playerYaw = ENGINE.cameraYaw = 2.3; });
  await T.wait(1500);
  await fps('jetty view');
  await T.ev(() => { V13._c15.R.rain.m.visible = false; });
  await fps('no rain');
  await T.ev(() => { ENGINE.scene.traverse(o => { if (o.isPointLight && !o.name) o.userData._v = o.visible; }); });
  await T.ev(() => { const keep = new Set(); ENGINE.scene.children.forEach(o => { if (o.isPointLight) o.visible = false; }); });
  await fps('no extra point lights');
  await T.ev(() => { V13._c15.R.guards.forEach(g => { g.torch.off(); }); });
  await fps('no torches');
  await T.ev(() => { ENGINE.extraSkinned.forEach(c => { c.visible = false; }); });
  await fps('no people');
  await T.shot('perf');
};
