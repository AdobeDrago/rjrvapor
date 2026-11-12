# Parity rebuild ledger: rjrvapor.com (home)

Baseline at start: no `get_usage` reading was taken at session start. At the end of the local build
this session's context was 202k tokens. The extra-usage meter ($320.64 of $600 at that point) is
account-wide and shared with parallel sessions, so this session's spend can't be separated out.
Gate: ≥99% pixel and 0 computed-style mismatches per section at 1440 + 1280 (default bar, not lowered).

**Font residual (accepted by the user before building):** the source sets type in
`franklin-gothic-urw` / `franklin-gothic-urw-comp` from Adobe Fonts (Typekit), and the EDS site has
no licensed kit. The rebuild keeps the exact computed `font-family` strings and aliases those family
names to local Arial / Arial Narrow faces (`styles/styles.css`). Their `size-adjust` comes from glyph
widths measured on the source crops, and the ascent/descent overrides from measured baselines. The
text still renders as Arial, so every section with text stays below 99% pixel, and the remaining
style mismatches are glyph widths (x/width of inline text). Remove the alias faces when a kit is added.

| Phase / iteration | Block / variant | Change | Mismatches before→after | Pixel before→after (1440 / 1280) | Context Δ | Spend Δ |
|---|---|---|---|---|---|---|
| Intake | — | preflight ok (by the parent session); live capture challenged by Imperva → `headed` (user passed the check; the first headed window timed out) | n/a | n/a | — | n/a |
| Capture | — | 1 page × 1440, 1280; header re-captured with `header.banner` (outer `<header>` is 0px) | n/a | n/a | — | n/a |
| Map | — | 5 sections + header + footer; reuse: hero (existing), columns `image-with-content` (left/right/2-col), disclaimer = section style; plan approved | n/a | n/a | — | n/a |
| T1 | header, footer, hero, columns variant, section styles | first build from measured values | 152 (sum over 14 checks, first valid run; an earlier run hit the wrong local server) | hero 93.73/95.55, footer 98.21/98.0, products 68.23/77.75 | ≈150k (capture → first gate) | n/a |
| T2 | global | source border reset (`* { border: 0 solid }`), comp face size-adjust 73%, body 94.5%, header inherits comp 600 | 152 → 99 | hero 96.43/95.05, footer 98.86/98.72 | ≈10k | n/a |
| T3 | columns / products | stale build fixed (image renamed to pair with source); ascent/descent overrides | 99 → 91 | products 97.83/98.61 | ≈8k | n/a |
| T4 | global | overrides divided by size-adjust (they scale with it); body weight 600 with copy 400 (measured on img/text records) | 91 → 41 | principles 98.11/97.75 | ≈8k | n/a |
| T5 | global | separate alias face for weight 500 (95.7%, fixes 1280 H1 wrap 2→3 lines), 600 92%, comp 73.9/73.5% | 41 → 36 | hero 96.93/97.07 | ≈6k | n/a |
| T6 | lint | stylelint precision/order fixes; full re-gate unchanged | 36 → 36 | unchanged | ≈4k | n/a |
| Stop | — | remaining mismatches are all glyph x/width; no further gain without the licensed font (stop rule) | — | — | — | n/a |

## Final local gate (localhost:3010, bundle captured 2026-11-12, headed)

| Section | 1440 px / mism | 1280 px / mism |
|---|---|---|
| header | 98.50% / 4 | 98.90% / 4 |
| hero | 96.93% / 0 | 97.07% / 0 |
| disclaimer | 97.68% / 0 | 97.14% / 0 |
| who | 98.55% / 0 | 98.56% / 0 |
| principles | 98.13% / 1 | 97.79% / 3 |
| products | 97.64% / 1 | 98.51% / 3 |
| footer | 98.94% / 10 | 98.81% / 10 |

0/14 at the bar (font residual). Style mismatches are 0 on hero, disclaimer and who at both widths;
everything left is inline text width/x from glyph metrics. `offsets.js`: 14/14 at the source's page
position. `npm run lint`: clean. Nav dropdowns (About, Products) open on hover/click and close on
leave/Escape: built, checked headless, not gated.
