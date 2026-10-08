// visual stream — phone portrait with touch: run with  --w 390 --h 844 --touch 1 [--shots <dir>]
// Tour of every restyled screen: flat paper-and-ink checks, no glyph icons, keyboard hints
// hidden, every tappable element >= 44x44. See _visual_lib.cjs for the checks.
module.exports = async h => { await require('./_visual_lib.cjs').tour(h, { touch: true }); };
