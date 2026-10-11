/* =========================================================================
   NACECA · src/tactics/tac_lanes.js — KC's lanes and path match the baked market
   Owner: Team A (foundations). DESIGN-tactics.md §5.2, §2.1 F-M8; foundations.md §1b, §3.3.

   The frozen data lives in the kernel (TAC.lanes.DATA: 18 nodes, 23 edges, a 45.9 m path);
   this file installs it at load (MARKET_LANES is mutated in place; the kernel's startChase wrap
   then gives KC the new path) and implements TAC.lanes.check():
     { crossing, tight, nodesInside, legsCrossing, nodesInBox, pathLen }   (+ legsTight, connected, minClear, edges)
   checked against ENGINE.obstacles with no padding:
     crossing      lane edges that pass through a collider
     tight         lane edges closer than 0.35 m to one (KC's body 0.3 + 0.05); the dead end may sit 0.15 m off the okada
     nodesInside   nodes inside a collider
     legsCrossing  authored-path legs through a collider (the first leg starts beside his own stand: exempt from clearance)
     nodesInBox    every node inside x 7.6–12.6, z −20.5–17.5 (the east stall lanes)
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || !TAC.lanes || TAC.lanes._real) return;
const L = TAC.lanes;
// today's graph and path, kept for the paired balance gate (tac_lanes.cjs) and for removal
if(typeof MARKET_LANES !== 'undefined' && !L.installed) L._old = { nodes:MARKET_LANES.nodes.map(p => p.slice()), edges:MARKET_LANES.edges.map(p => p.slice()) };
L._oldPath = [[8,4],[8,7.4],[12.6,7.4],[12.6,-2.4],[12.6,-7.5],[7.6,-7.5],[7.6,-12.5],[12.6,-12.5],[12.6,-20.5]];   // market.js:157

const CLEAR = 0.35, DEAD = [12.6, -20.5], DEAD_CLEAR = 0.15;
const segBox = (a, b, o, pad) => {
  const minX = o.minX - pad, maxX = o.maxX + pad, minZ = o.minZ - pad, maxZ = o.maxZ + pad;
  let t0 = 0, t1 = 1; const dx = b[0] - a[0], dz = b[1] - a[1];
  const clip = (p, q) => { if(Math.abs(p) < 1e-12) return q >= 0; const t = q / p; if(p < 0){ if(t > t1) return false; if(t > t0) t0 = t; } else { if(t < t0) return false; if(t < t1) t1 = t; } return true; };
  return clip(-dx, a[0] - minX) && clip(dx, maxX - a[0]) && clip(-dz, a[1] - minZ) && clip(dz, maxZ - a[1]) && t0 <= t1;
};
// the smallest distance from a segment to a box (0 when they touch), by bisection on the pad
const segBoxDist = (a, b, o) => { if(segBox(a, b, o, 0)) return 0; let lo = 0, hi = 3; if(!segBox(a, b, o, hi)) return hi; for(let i = 0; i < 20; i++){ const m = (lo + hi) / 2; if(segBox(a, b, o, m)) hi = m; else lo = m; } return hi; };
const ctr = o => [+((o.minX + o.maxX) / 2).toFixed(2), +((o.minZ + o.maxZ) / 2).toFixed(2)];
const isDead = p => Math.abs(p[0] - DEAD[0]) < 0.01 && Math.abs(p[1] - DEAD[1]) < 0.01;
const isKCStand = o => Math.abs((o.minX + o.maxX) / 2 - 7.6) < 0.01 && Math.abs((o.minZ + o.maxZ) / 2 - 4) < 0.01;

L.check = function(G, path){
  G = G || (typeof MARKET_LANES !== 'undefined' ? MARKET_LANES : { nodes:[], edges:[] });
  path = path || L.KC_PATH;
  const obs = ((typeof ENGINE !== 'undefined' && ENGINE.obstacles) || []).filter(o => o && !o.crouchOnly);
  const out = { edges:G.edges.length, crossing:[], tight:[], nodesInside:[], legsCrossing:[], legsTight:[], nodesInBox:true, pathLen:0, connected:false,
    minClear:Infinity, deadClear:Infinity };
  const chk = (a, b, cross, tight, first) => {
    for(const o of obs){
      if(segBox(a, b, o, 0)){ cross.push([a, b, ctr(o)]); out.minClear = 0; continue; }
      if(first && isKCStand(o)) continue;          // he starts beside his own stand, as today
      const d = segBoxDist(a, b, o);
      if((isDead(a) || isDead(b)) && d < CLEAR){     // the dead end: the okada that blocks the exit may sit 0.15 m off
        out.deadClear = Math.min(out.deadClear, d);
        if(d < DEAD_CLEAR) tight.push([a, b, ctr(o), +d.toFixed(2)]);
        continue;
      }
      out.minClear = Math.min(out.minClear, d);
      if(d < CLEAR) tight.push([a, b, ctr(o), +d.toFixed(2)]);
    }
  };
  for(const [i, j] of G.edges) chk(G.nodes[i], G.nodes[j], out.crossing, out.tight, false);
  for(const n of G.nodes) if(obs.some(o => n[0] > o.minX && n[0] < o.maxX && n[1] > o.minZ && n[1] < o.maxZ)) out.nodesInside.push(n);
  for(let k = 1; k < path.length; k++) chk(path[k - 1], path[k], out.legsCrossing, out.legsTight, k === 1);
  out.nodesInBox = G.nodes.every(n => n[0] > 7.59 && n[0] < 12.61 && n[1] > -20.51 && n[1] < 17.51);
  let len = 0; for(let k = 1; k < path.length; k++) len += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
  out.pathLen = +len.toFixed(2);
  // connected: every node reachable from node 0
  if(G.nodes.length){
    const seen = new Set([0]), q = [0];
    while(q.length){ const i = q.shift(); for(const e of G.edges){ const j = e[0] === i ? e[1] : e[1] === i ? e[0] : -1; if(j >= 0 && !seen.has(j)){ seen.add(j); q.push(j); } } }
    out.connected = seen.size === G.nodes.length;
  }
  out.minClear = out.minClear === Infinity ? null : +out.minClear.toFixed(2);
  out.deadClear = out.deadClear === Infinity ? null : +out.deadClear.toFixed(2);
  return out;
};
L._real = true;
L.install();
})();
