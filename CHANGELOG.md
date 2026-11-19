# Changelog

## 1.3.0 (2026-11-19)

- Changed: the new-thread screen has no artwork any more. The scope added in 1.2.0, and the dial
  before it, are replaced by one even field of 1px dots every 20px across the whole screen,
  fading out at the window edges, with clear bands behind the two lines of small type. In
  Daylight the dots are ink on paper. The spacing lands on whole device pixels at 100%, 125%,
  130%, 150% and 200%, so every dot is one solid pixel.
- Removed: `tools/gen-scope.mjs`.
- The gallery edition gets the same dot field in place of its dial (18,985 characters).
- Every other screen is unchanged.

## 1.2.0 (2026-11-19)

- Changed: the new-thread screen. The faint calibration dial is replaced by a plan-position scope
  with the composer as its hub: a quiet bearing ring with ticks every 10 and 30 degrees, range
  rings, a lime index at 000 above the question, and one thin lime sweep with a short afterglow
  and a single return. In Daylight it is a printed plotting sheet with a highlighter wedge.
  Shorter windows get a compact scope; below 1024px wide or 640px tall there is none.
- Added: `tools/gen-scope.mjs`, which draws the scope at four levels from `loud` to `c`. The
  theme ships level `b`.
- Every other screen is unchanged. The gallery edition keeps the earlier dial.

## 1.1.0 (2026-11-19)

- Added: a light appearance, Daylight. A bone-putty faceplate around a paper screen, black
  silkscreen legends, lime as a lit fill, and a deep acid green for thin signal marks.
  `acid-01.json` carries it as its light variant, so the theme now follows T3 Code's light/dark
  setting. `acid-01-light.json` is the same appearance as a theme of its own.
- Changed: `build.mjs` writes both files, refuses a variant that misses a color role, and runs
  T3 Code's own file-loading check (ported from `themeCssLoadsRemoteFiles`).
- Added: `gallery/`, a 19,480-character dark core edition for the t3themes.com gallery, which
  limits theme CSS to 20,000 characters.
- Dark is unchanged: its renders are identical to 1.0.4. The open thread's bar and floor line
  pass the display-scale check in both appearances (1512 of 1512 cases).

## 1.0.4 (2026-11-19)

- Fixed: on displays scaled to 110% to 140% (and 225%) the open thread's bar and the hazard
  tape ran one pixel past the lime floor line. The line was a 1px layer anchored to the bottom
  of the row, and at those scales the browser rounds such a layer to the pixel row above the
  row's own edge. Bar, glow and floor line are now all full-height layers, so they end on the
  same pixel row. Checked at 21 scales from 50% to 300%, on 2-line and 3-line cards, with and
  without the "needs you" tape: 756 of 756 cases, where 1.0.3 fails 150. Nothing changes at
  100% and 200%.

## 1.0.3 (2026-11-19)

- Changed: the open thread's highlight is back to the original full-height bar with a lime
  hairline along the bottom of the well. The 1.0.2 lamp is gone, here and in the settings nav.
- Fixed: in the live app the bar could run one pixel past the hairline. Bar, glow and hairline
  are now background layers of the row itself, so they share one bottom edge and follow the
  well's corners.

## 1.0.2 (2026-11-19)

- Changed: the open thread's highlight. The full-height bar and the lime hairline are replaced by
  an indicator lamp set into the row's leading edge: a short lit bar that stops short of the
  corners, with a soft glow on the well. The active page in the settings nav uses the same lamp.

## 1.0.1 (2026-11-19)

- Fixed: the thread preview card that appears when hovering a sidebar thread was painted as a
  cream label-tape tooltip with light text, so its text was invisible. Rich hover cards are now
  dark panels; plain tooltips keep the label tape.
- Fixed: muted hints inside plain tooltips (keyboard shortcuts) were too faint on the tape.

## 1.0.0 (2026-11-19)

- First release.
