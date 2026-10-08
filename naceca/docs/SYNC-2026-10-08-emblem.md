# NACECA emblem — new logo, badge and title-screen shield · 8 Oct 2026

The gold-and-navy NACECA shield from the brand sheet (`art/brand/naceca_brand_sheet.png`)
is now the game's emblem everywhere it was drawn.

| Where | What changed |
|---|---|
| Title screen (the floating shield behind the menu) | `src/assets/title/naceca_badge.png` replaced; 384×480, 4:5 to match the 4.4 × 5.5 plane in `systems/boot.js`. `src/assets/_inline.js` regenerated with `encode_assets.py` (only `ASSETS.title.naceca_badge` changed). |
| HUD mission badge | `index.html` no longer has the inline SVG shield; `styles.css` `.naceca-shield` draws `art/brand/hud_shield.png` as a data URI. |
| Loading splash (new) | `index.html` `#boot-splash`, first thing in `<body>`: the emblem (`art/brand/splash_shield.png`, data URI), "LOADING CASE FILES" and a gold bar, styled at the end of `styles.css`. It paints while the 15 MB single file downloads and fades out on `DOMContentLoaded`, once every game script has run. |
| Browser tab / home-screen icon | `favicon.png` (64×64) and `apple-touch-icon.png` (180×180) in `naceca/`, linked from `index.html` by URL and copied into `dist/` by `vercel.json`. Real files, not data URIs: Safari before 26 ignores `data:` icons, so older iPhones would otherwise save a screenshot as the home-screen icon. |
| HQ wall crest | `src/systems/art_pass_v8.js` `MTEX.crest()` draws the emblem image (falls back to the old painted shield until it decodes). |

## Regenerating
`python3 tools/make_brand_assets.py` cuts the shield out of the brand sheet and writes every
image above (`--print-data-uris` prints the HUD/icon data URIs). Then `python3 encode_assets.py`
and `python3 build.py`. `encode_assets.py` now finds `src/assets/` relative to itself instead of
the old `/home/claude/naceca-modular` path.

## For the next drop
These files now carry the emblem; a drop that overwrites them must keep the changes:
`index.html` (icon links, `#boot-splash` + its script, empty `.naceca-shield` div),
`styles.css` (`.naceca-shield` rule, `#boot-splash` block at the end), `vercel.json` (copies the icons),
`src/systems/art_pass_v8.js` (`crestImg` + `crest()`), `src/assets/title/naceca_badge.png`,
`src/assets/_inline.js`, `encode_assets.py`.
