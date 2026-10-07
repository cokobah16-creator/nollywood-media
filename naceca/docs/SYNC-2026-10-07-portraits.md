# NACECA v7.1 — painted portraits · 7 Oct 2026

Cumulative: carries every earlier drop not yet on main.

- 20 painted portraits embedded as `src/assets/_portraits_art.js` (512 px WebP, 647 KB total).
  Source WebPs are in `naceca/art/portraits/` for reference.
- Portrait chosen by speaker name, then the line's `mood` (neutral · angry · afraid · evasive),
  falling back to the character's neutral face, then the old portrait set.
- 11 lines tagged with moods. NACECA SYSTEM lines now show the agency badge.

Still missing (old portraits used until they arrive): Tunde, Engr. Osaro, Osas;
extra expressions for Uche, Obi, Musa, Tobi and the others.

```bash
cd /path/to/nollywood-media
unzip -o /path/to/naceca-portraits-sync.zip -d .
git add naceca
git commit -m "NACECA v7.1: painted dialogue portraits with expressions (cumulative)"
git push origin main
```
