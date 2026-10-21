// The judgment's witness numbers follow the witnesses actually called.
const sc = require('../scen13.js');
const C14 = require('./court14.js');
module.exports = async function (T) {
  await sc.s2start(T, 'm14', C14.RUNS.plea.prep);
  const r = await T.ev(() => {
    const K = V13.court, J = V13.COURT_DATA.judgment.element, out = {};
    const ev = { admitted:['pos_t4_log'], weight:{}, witnesses:['kelechi', 'tobi', 'ikpe', 'sotonye', 'felix'], cred:70 };
    K.reset(); K.state.pwNum = { tobi:2, ikpe:3, sotonye:4, felix:5 };
    out.noEjiro = K.renum(J.e1b_yes(ev));
    K.state.pwNum = { tobi:2, ikpe:3, ejiro:4, sotonye:5, felix:6 };
    out.all = K.renum(J.e1b_yes(ev));
    K.state.pwNum = { igbinosa:2, ikpe:3, felix:4 };
    out.felixOnly = K.renum(J.e1b_yes(Object.assign({}, ev, { witnesses:['kelechi', 'igbinosa', 'ikpe', 'felix'] })));
    return out;
  });
  T.log(JSON.stringify(r, null, 1));
};
