# NACECA brand lockup on the title screen · 8 Oct 2026

The title screen now opens on the brand sheet's full lockup, then the game title:

    NACECA                                   (gold, Cinzel 900, gradient fill)
    ─────────────────                        (gold rule)
    NATIONAL ANTI-CORRUPTION &               (ivory, Marcellus, tracked)
    ECONOMIC CRIMES AGENCY
    ─────────────────                        (thin rule)
    EVIDENCE • INTEGRITY • JUSTICE           (gold, Marcellus, tracked)
    Operation Serpent's Route                (game title, gold italic Oswald, as before)

## Files
- `index.html`: the old `<h1>NACECA<span class="accent">…</span></h1>` is now `.brand-lockup`
  (`h1.wordmark`, `.bl-rule`, `.bl-agency`, `.bl-rule.thin`, `.bl-motto`) plus `.game-title`.
  Fonts load through a second Google Fonts `<link>` (Cinzel 700/900 + Marcellus), separate from the
  Oswald/Inter/JetBrains link so a problem with it can't take the game fonts down. Offline they fall
  back to Georgia/serif. The FICTION line has a `title-fiction` class.
- `styles.css`: lockup styles; the title screen now flows top to bottom with auto margins (centred
  when there's room, scrolls if not), and the FICTION line and v12 build tag follow the buttons
  instead of sitting on top of them. Compact sizes for narrow short phones (≤699 px wide, 521–780 px
  tall) and landscape (≤520 px tall, alongside v12's rules); two button columns on wide short windows
  (≥700 px wide, 521–860 px tall, e.g. laptops).

Checked at 1280×800, 1440×960, 1366×657, 768×1024, 390×844, 375×667, 844×390 and 667×375:
every button visible, nothing overlaps, no sideways scroll.

## For the next drop
Keep the lockup markup and the second font `<link>` in `index.html`, and the lockup/title-layout
block in `styles.css` (it sits just above `#screen-title .sub`).
