// c11toast: does the speedboat toast clear before the escort's line? (logs the toast and dialogue class changes in time order)
const L = require('./c11lib.js');
const sc = L.sc;
module.exports = async function (T) {
  await L.fast(T);
  T.log('started', await L.start(T, "S.game.moralChoices.s2_statement='car';"));
  await L.toCamp(T, 0, 'skip');
  await sc.talk(T);
  await L.waitFree(T);
  await T.ev(() => {
    const t0 = performance.now(), log = window.__tl = [];
    const watch = id => new MutationObserver(() => { const el = document.getElementById(id); log.push([Math.round(performance.now() - t0), id, el.className, getComputedStyle(el).opacity]); }).observe(document.getElementById(id), { attributes: true, attributeFilter: ['class'] });
    watch('toast'); watch('screen-dialogue');
    const ot = window.toast; window.toast = function (a, b, ms) { log.push([Math.round(performance.now() - t0), 'toast()', a]); return ot.apply(this, arguments); };
    V13._c11.bolt('felix');
  });
  await L.waitDlg(T, 90000);
  await T.wait(1200);
  T.log('timeline', await T.ev(() => JSON.stringify(window.__tl)));
  T.log('toast now', await T.ev(() => { const el = document.getElementById('toast'); return el.className + ' opacity ' + getComputedStyle(el).opacity + ' text ' + el.textContent; }));
  await L.shot(T, 'x_bolt_toast');
};
