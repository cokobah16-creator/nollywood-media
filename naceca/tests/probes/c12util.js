// Case 12 probe helpers: screenshots with a long timeout (two builders share 2 CPUs)
const path = require('path');
module.exports = function (T, tag) {
  return async name => {
    const f = path.join((process.env.SHOTS || path.join(__dirname, '..', 'shots')), `probe_${tag}_${T.mode}_${name}.png`);
    for (let k = 0; k < 2; k++) {
      try { await T.page.screenshot({ path: f, timeout: 120000 }); console.log('  shot', name); return f; }
      catch (e) { console.log('  shot retry', name, String(e).slice(0, 80)); }
    }
  };
};
