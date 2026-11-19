# Changelog

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
