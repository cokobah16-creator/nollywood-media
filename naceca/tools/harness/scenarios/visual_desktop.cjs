// visual stream — desktop: run with  --w 1280 --h 800 [--shots <dir>]
// Same tour as visual_touch.cjs without the touch-only checks.
module.exports = async h => { await require('./_visual_lib.cjs').tour(h, { touch: false }); };
