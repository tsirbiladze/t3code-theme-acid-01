#!/usr/bin/env node
// Generates section 13 (the new-thread screen's artwork) of src/theme.css: a plan-position scope with the
// composer as its hub. Run from the repository root, then build:
//   node tools/gen-scope.mjs [level] && node build.mjs
// level: loud | a | b | c, calmer each step. The theme ships level b.
// The SVG is drawn in CSS px, centred on (0,0) = the centre of the conversation box, which is the centre of the
// composer stack (deck + context strip + its padding). Measured at 1180/1440/1920 wide (the lane is 736 at all):
//   deck 736 x 111.5 at y -81.75..29.75, strip to y 61.75 (opaque); h1 box y -165.7..-129.7, up to 468 wide;
//   the line under it y -121.7..-97.7. Deck corners are ~377 from the centre.
// Two drawings per appearance:
//   STANDARD (window >= 874 tall): rim radius 414 at scale 1, clearing the deck by ~37px; the third range ring is
//     complete and frames the hero text; heading line from 000 down to just above the hero.
//   COMPACT (shorter windows): rim radius 347, passing behind the deck ~30px inside its corners; the upper half
//     keeps only the rim and its scale, so nothing comes near the hero text.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEVEL = process.argv[2] ?? 'b'; const CSS = path.join(path.resolve(process.argv[3] ?? '.'), 'src', 'theme.css');
const R1 = [[321, 215.6, 2.1, 5.5], [242, 199, 4.6, 2.6], [366, 186, 1.4, 3.2], [178, 171, 2.2, 2.4], [300, 154, 1.5, 2.6], [352, 128, 2, 2.4]];
const LEVELS = {
  // loud: everything on
  loud: { trail: 100, glow: [48, 62], rimW: 1.75, sweepW: 1.75, sweepOp: 1, tickW: [1, 1.25, 1.75], numStep: 30, range: true, plates: true, returns: R1, oldPaint: true, retK: 1, face: true,
    dark: { lip: 0.13, rim: 0.72, tickLo: 0.3, tick: 0.52, tickHi: 0.9, ring: 0.3, ringLo: 0.3, cross: 0.24, num: 0.66, leg: 0.5, halo: 0.3, bloom: 0.16 },
    light: { lip: 0.3, rim: 0.74, tickLo: 0.34, tick: 0.56, tickHi: 0.9, ring: 0.36, ringLo: 0.34, cross: 0.28, num: 0.76, leg: 0.6, halo: 0, bloom: 0.12 } },
  // a, calm: the same scope with the lights turned down; plates gone, a shorter afterglow, three returns
  a: { trail: 62, glow: [30, 40], rimW: 1.5, sweepW: 1.5, sweepOp: 1, tickW: [1, 1.25, 1.5], numStep: 30, range: true, plates: false, returns: [R1[0], R1[1], R1[3]], oldPaint: false, retK: 0.8, face: true,
    dark: { lip: 0.09, rim: 0.44, tickLo: 0.16, tick: 0.3, tickHi: 0.56, ring: 0.2, ringLo: 0.2, cross: 0.16, num: 0.42, leg: 0.32, halo: 0.2, bloom: 0.1 },
    light: { lip: 0.22, rim: 0.48, tickLo: 0.2, tick: 0.34, tickHi: 0.6, ring: 0.24, ringLo: 0.24, cross: 0.18, num: 0.52, leg: 0.4, halo: 0, bloom: 0.08 } },
  // b, plain: a quiet ring with ticks every 10 and 30, numerals at the four cardinals, a thin sweep with a short
  // faint glow and one return; no legends, no fine ticks
  b: { trail: 40, glow: [20, 28], rimW: 1.25, sweepW: 1.25, sweepOp: 0.9, tickW: [1, 1, 1.25], numStep: 90, range: false, plates: false, returns: [[321, 215.6, 2.1, 4]], oldPaint: false, retK: 0.62, face: true,
    dark: { lip: 0.06, rim: 0.3, tickLo: 0, tick: 0.2, tickHi: 0.42, ring: 0.14, ringLo: 0.14, cross: 0.11, num: 0.34, leg: 0, halo: 0.12, bloom: 0.07 },
    light: { lip: 0.16, rim: 0.34, tickLo: 0, tick: 0.24, tickHi: 0.46, ring: 0.18, ringLo: 0.18, cross: 0.13, num: 0.42, leg: 0, halo: 0, bloom: 0.06 } },
  // c, minimal: hairline rings, a tick every 30 degrees, the lime index and one thin sweep line. Nothing else.
  c: { trail: 22, glow: [11, 16], rimW: 1, sweepW: 1, sweepOp: 0.62, tickW: [1, 1, 1], numStep: 0, range: false, plates: false, returns: [], oldPaint: false, retK: 0, face: false,
    dark: { lip: 0, rim: 0.2, tickLo: 0, tick: 0, tickHi: 0.3, ring: 0.1, ringLo: 0, cross: 0, num: 0, leg: 0, halo: 0, bloom: 0 },
    light: { lip: 0, rim: 0.24, tickLo: 0, tick: 0, tickHi: 0.34, ring: 0.13, ringLo: 0, cross: 0, num: 0, leg: 0, halo: 0, bloom: 0 } },
};
const L = LEVELS[LEVEL]; if (!L) throw new Error('level must be one of ' + Object.keys(LEVELS).join(', '));

const f = (n) => { const s = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; };
const P = (r, deg) => { const a = (deg * Math.PI) / 180; return [r * Math.sin(a), -r * Math.cos(a)]; }; // bearing -> xy
const pt = (r, deg) => P(r, deg).map(f).join(' ');
const arc = (r, a0, a1) => `M${pt(r, a0)}A${f(r)} ${f(r)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${pt(r, a1)}`;
const lowArc = (r) => { const h = (Math.acos(58 / r) * 180) / Math.PI; return arc(r, 180 - h, 180 + h); }; // below the strip

const SWEEP = 222;       // bearing of the sweep's leading edge
const TRAIL = L.trail;   // degrees of afterglow behind it
const VB = 1000;         // svg box (px at scale 1)
const RS = 414, RC = 347; // rim radius: standard, compact

function scope(c, RB, full) {
  const k = RB / RS; // returns and legends keep their place in the scope
  const o = []; const svg = (s) => o.push(s);
  svg(`<defs><radialGradient id='b'><stop stop-color='${c.sig}' stop-opacity='${c.bloom}'/><stop offset='1' stop-color='${c.sig}' stop-opacity='0'/></radialGradient>${full ? `<path id='l' d='${arc(RB - 52, 296, 334)}'/><path id='r' d='${arc(RB - 52, 26, 64)}'/>` : ''}</defs>`);
  svg(`<g fill='none' stroke='${c.ink}'>`);
  // the rim: a void cut and a lit lip outside the bearing ring, so the scope reads as glass set into the screen
  svg(`<circle r='${RB + 2}' stroke='${c.cut}' stroke-width='2.5'/><circle r='${RB + 3.75}' stroke-opacity='${c.lip}'/><circle r='${RB}' stroke-opacity='${c.rim}' stroke-width='${L.rimW}'/>`);
  // the bearing scale: ticks every 2 / 10 / 30 degrees, inward from the rim (dashed circles, one dash per tick)
  const ticks = (len, deg, w, op) => { const r = RB - 0.75 - len / 2; const per = (w / (2 * Math.PI * r)) * 360; svg(`<circle r='${f(r)}' pathLength='360' stroke-width='${len}' stroke-dasharray='${f(per)} ${f(deg - per)}' stroke-dashoffset='${f(per / 2)}' stroke-opacity='${op}'/>`); };
  if (c.tickLo) ticks(5, 2, L.tickW[0], c.tickLo); if (c.tick) ticks(9, 10, L.tickW[1], c.tick); ticks(L.numStep === 0 ? 9 : 13, 30, L.tickW[2], c.tickHi);
  // range rings at quarters of the rim; below the deck all three show, above it only the standard third ring
  svg(full ? `<circle r='${f(RB * 0.75)}' stroke-opacity='${c.ring}'/>` : `<path d='${lowArc(RB * 0.75)}' stroke-opacity='${c.ring}'/>`);
  if (c.ringLo) svg(`<path d='${lowArc(RB / 2)}${lowArc(RB / 4)}' stroke-opacity='${c.ringLo}' stroke-dasharray='1.5 4.5'/>`);
  // the heading line (000) down to just above the hero text, and the south line below the deck
  if (c.cross) svg(`<path d='${full ? `M0 -${RB - 40}V-198` : ''}M0 84V${RB - 40}' stroke-opacity='${c.cross}'/>`);
  svg(`</g>`);
  // bearing numerals every 30 degrees, set along the ring; the lower half turned to read upright
  svg(`<g fill='${c.ink}' fill-opacity='${c.num}' font-family='Adwaita Mono,monospace' font-size='10.5' letter-spacing='.8' text-anchor='middle' dominant-baseline='central'>`);
  for (let d = 0; L.numStep && d < 360; d += L.numStep) {
    const lab = String(d).padStart(3, '0');
    svg(d > 90 && d < 270 ? `<text transform='rotate(${d - 180})' y='${RB - 25}'>${lab}</text>` : `<text transform='rotate(${d})' y='-${RB - 25}'>${lab}</text>`);
  }
  svg(`</g>`);
  // returns: radar paint, brightest just behind the edge and fading with the time since the sweep passed.
  // Each is a short arc (wider in bearing than in range, as a beam paints it) in a soft round bloom.
  const age = (b) => ((SWEEP - b) % 360 + 360) % 360;              // degrees since painted
  const lum = (b) => L.retK * Math.max(0.08, 0.96 * Math.exp(-age(b) / 62)); // phosphor decay
  const ret = (r0, b, span, w) => { const r = r0 * k; const op = lum(b); const [x, y] = P(r, b);
    if (op > 0.25) svg(`<circle cx='${f(x)}' cy='${f(y)}' r='${f(6 + span * r * 0.0087 + w * 1.6)}' fill='url(#b)' opacity='${f(op)}'/>`);
    svg(`<path d='${arc(r, b - span / 2, b + span / 2)}' fill='none' stroke='${c.sig}' stroke-opacity='${f(op)}' stroke-width='${f(w)}' stroke-linecap='round'/>`); };
  for (const r of L.returns) ret(...r);
  if (full && L.oldPaint) { ret(352, 14, 2, 2.4); ret(326, 300, 1.6, 2.4); } // old paint, almost gone
  // the sweep: a lit leading edge from the hub to the rim, with a narrow bloom
  // (the bloom is a quad along the edge filled with a gradient across it: soft without a blur filter)
  const [ex, ey] = P(RB - 0.75, SWEEP);
  if (c.halo) { const a = (SWEEP * Math.PI) / 180, W = 13, nx = Math.cos(a) * W, ny = Math.sin(a) * W; const [qx, qy] = P(RB - 3, SWEEP);
    svg(`<linearGradient id='h' gradientUnits='userSpaceOnUse' x1='${f(-nx)}' y1='${f(-ny)}' x2='${f(nx)}' y2='${f(ny)}'><stop stop-color='${c.sig}' stop-opacity='0'/><stop offset='.5' stop-color='${c.sig}' stop-opacity='${c.halo}'/><stop offset='1' stop-color='${c.sig}' stop-opacity='0'/></linearGradient>`);
    svg(`<path d='M${f(-nx)} ${f(-ny)}L${f(nx)} ${f(ny)}L${f(qx + nx)} ${f(qy + ny)}L${f(qx - nx)} ${f(qy - ny)}Z' fill='url(#h)'/>`); }
  svg(`<path d='M0 0L${f(ex)} ${f(ey)}' stroke='${c.sigLine}' stroke-opacity='${L.sweepOp}' stroke-width='${L.sweepW}'/>`);
  // heading marker at 000: a lime index inside the rim
  svg(`<path d='M-6.5 -${RB - 1}H6.5L0 -${RB - 13}Z' fill='${c.mark}'${c.markStroke ? ` stroke='${c.markStroke}' stroke-width='1.2' stroke-linejoin='round'` : ''}/>`);
  // legends: range ring numbers on the south line; standard adds two plates set along the rim in the upper sectors
  svg(`<g fill='${c.ink}' fill-opacity='${c.leg}' font-family='Adwaita Mono,monospace' font-size='9.5' letter-spacing='1.4'>`);
  if (L.range) svg([1, 2, 3].map((i) => `<text x='7' y='${f((RB * i) / 4 + 13)}'>${i}</text>`).join('') + `<text x='-8' y='${f(RB / 4 + 13)}' text-anchor='end'>RANGE</text>`);
  if (full && L.plates) svg(`<text text-anchor='middle'><textPath href='#l' startOffset='50%'>HEAD UP</textPath></text><text text-anchor='middle'><textPath href='#r' startOffset='50%'>ACID-01 &#183; PPI</textPath></text>`);
  svg(`</g>`);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${VB}' height='${VB}' viewBox='-${VB / 2} -${VB / 2} ${VB} ${VB}'>${o.join('')}</svg>`;
}

const enc = (s) => s.replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, "'");
const dark = { ink: '#e7e4d6', cut: '#000', sig: '#c9fd36', sigLine: '#d8ff6a', mark: '#c9fd36', ...L.dark };
const light = { ink: '#24231d', cut: '#fff', sig: '#567c02', sigLine: '#567c02', mark: '#c9fd36', markStroke: '#0d1204', ...L.light };
const svgs = { d: scope(dark, RS, true), dc: scope(dark, RC, false), l: scope(light, RS, true), lc: scope(light, RC, false) };

// the afterglow's decay behind the edge: a fast bright core and a long faint tail (phosphor persistence)
const decay = (d) => 0.58 * Math.exp(-d / 6) + 0.42 * Math.exp(-d / 34);
const glowStops = ['transparent', ...[70, 46, 28, 16, 9, 4, 1.5].map((d) => `color-mix(in srgb, var(--ph-glow) ${Math.round(decay(d) * 100)}%, transparent) ${f(TRAIL - (d * TRAIL) / 100)}deg`), `var(--ph-glow) ${f(TRAIL - 0.3)}deg`, `transparent ${f(TRAIL + 0.2)}deg`].join(', ');

// the rim diameter. Standard: the lane plus 46px a side (414 at the 736 lane), never wider than the box less
// 12px a side, never taller than the box less 16px top and bottom (the header is 40px), at most 476 radius.
// Compact: 21px inside the lane's edge a side (347), so the rim runs well under the deck.
const D_STD = 'min(2 * var(--ph-lane-hw, 23rem) + 92px, 100% - 24px, 100vh - 72px, 952px)';
const D_CMP = 'min(2 * var(--ph-lane-hw, 23rem) - 42px, 100vh - 72px)';
const section = `/* ---------------------------------------------------------------- 13 empty state */
/* A plan-position scope with the composer as its hub. It is centred on the composer stack (the
   centre of the conversation box) and sized by the reading lane and the window height. In windows
   874px and taller its bearing ring clears the deck by ~37px all round: ticks every 2, 10 and 30
   degrees, numerals every 30, a lit lip outside it. Range rings at quarters of the rim: the third
   frames the hero text, the inner two show below the deck. A heading line runs down from a lime
   index at 000 to just above the hero text, which sits on it. One sweep: a lime leading edge at ${SWEEP}
   degrees, a phosphor afterglow decaying behind it across the empty lower half, and the returns it
   has painted, brightest where it has just passed. Shorter windows get the compact scope, whose rim
   runs under the deck well inside its corners and whose upper half keeps only the rim and scale.
   By day the scope is a printed plotting sheet: ink rings on white paper, a lime highlighter wedge
   with a deep-acid edge. Generated by tools/gen-scope.mjs, level ${LEVEL}. */
:root {
  --ph-scope: url("data:image/svg+xml,${enc(svgs.d)}");
  --ph-scope-c: url("data:image/svg+xml,${enc(svgs.dc)}");
  --ph-scope-face: ${L.face ? '#080806' : 'var(--ph-screen)'};
  --ph-scope-edge: ${L.face ? 'rgba(0, 0, 0, .45)' : 'transparent'};
  --ph-glow: color-mix(in srgb, var(--ph-signal) ${L.glow[0]}%, transparent);
}
:root:not(.dark) {
  --ph-scope: url("data:image/svg+xml,${enc(svgs.l)}");
  --ph-scope-c: url("data:image/svg+xml,${enc(svgs.lc)}");
  --ph-scope-face: ${L.face ? 'var(--ph-void)' : 'var(--ph-screen)'};
  --ph-scope-edge: transparent;
  --ph-glow: color-mix(in srgb, var(--ph-signal) ${L.glow[1]}%, transparent);
}
[data-workspace-area="conversation"] [data-timeline-loading] {
  --ph-x: calc(50% + (var(--chat-lane-inset-start, 0px) - var(--chat-lane-inset-end, 0px)) / 2);
  --ph-d: ${D_STD};
  background-color: transparent;
}
/* the scope face and its afterglow: a disc the size of the rim, the face colour under a conic wedge
   that trails the edge; a radial veil of face colour lets the wedge rise out of the deck's shadow,
   and at night the glass falls off toward the rim as a tube face does */
[data-workspace-area="conversation"] [data-timeline-loading]::before {
  content: "";
  position: absolute;
  left: var(--ph-x);
  top: 50%;
  width: var(--ph-d);
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  pointer-events: none;
  background-color: var(--ph-scope-face);
  background-image: radial-gradient(closest-side, transparent 84%, var(--ph-scope-edge)), radial-gradient(closest-side, var(--ph-scope-face) 20%, transparent 55%), conic-gradient(from ${SWEEP - TRAIL}deg, ${glowStops});
}
/* the drawing: rim, scale, rings, sweep edge, returns, legends. Lines that pass under the deck come
   out from under the context strip (opaque, the colour of the face) faded in over 32px, not cut at
   its invisible lower edge; the mask spares everything outside the lane, so the rim never fades */
[data-workspace-area="conversation"] [data-timeline-loading]::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: var(--ph-scope);
  background-size: calc(${D_STD} * ${(VB / (2 * RS)).toFixed(4)}) auto;
  background-position: var(--ph-x) 50%;
  background-repeat: no-repeat;
  mask-image: linear-gradient(#000 calc(50% + 28px), transparent 0 calc(50% + 62px), #000 calc(50% + 94px)), linear-gradient(90deg, #000 calc(var(--ph-x) - var(--ph-lane-hw, 23rem) - 16px), transparent 0 calc(var(--ph-x) + var(--ph-lane-hw, 23rem) + 16px), #000 0);
}
@media (max-height: 873px) {
  /* the compact rim runs under the deck, so the strip's band reaches past the face: no face here */
  :root,
  :root:not(.dark) {
    --ph-scope-face: var(--ph-screen);
  }
  [data-workspace-area="conversation"] [data-timeline-loading] {
    --ph-d: ${D_CMP};
  }
  [data-workspace-area="conversation"] [data-timeline-loading]::after {
    background-image: var(--ph-scope-c);
    background-size: calc(${D_CMP} * ${(VB / (2 * RC)).toFixed(4)}) auto;
  }
}
/* below 700px the compact scope's numerals would reach the hero text: only its lower half stays */
@media (max-height: 700px) {
  [data-workspace-area="conversation"] [data-timeline-loading]::before,
  [data-workspace-area="conversation"] [data-timeline-loading]::after {
    mask-image: linear-gradient(transparent calc(50% + 30px), #000 calc(50% + 62px));
  }
}
@media (max-width: 1023px),(max-height: 640px) {
  [data-workspace-area="conversation"] [data-timeline-loading]::before,
  [data-workspace-area="conversation"] [data-timeline-loading]::after {
    content: none;
  }
}
[data-workspace-area="composer"] h1 {
  font-weight: 330;
  letter-spacing: -.025em;
  color: var(--ph-bright);
}
[data-workspace-area="composer"] h1 button {
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: var(--ph-signal);
  text-decoration-thickness: 2px;
  text-underline-offset: .18em;
}
/* by day a 2px lime line would vanish on the paper: the project name is marked the way you
   mark a calibration sheet, with a lime highlighter swipe under black ink */
:root:not(.dark) [data-workspace-area="composer"] h1 button {
  text-decoration-thickness: .36em;
  text-underline-offset: -.2em;
  text-decoration-skip-ink: none;
}
/* the context strip under the deck: mono data, on an opaque band the colour of the scope face (so
   it is invisible on the scope, and nothing behind it shows through) */
[data-slot="composer-context-strip"] {
  font-family: var(--ph-mono);
  letter-spacing: .01em;
  background-color: var(--ph-scope-face);
}

`;
const src = fs.readFileSync(CSS, 'utf8');
const a = src.indexOf('/* ---------------------------------------------------------------- 13 empty state */');
const b = src.indexOf('/* ---------------------------------------------------------------- 14 motion */');
if (a < 0 || b < 0) throw new Error('section markers not found');
fs.writeFileSync(CSS, src.slice(0, a) + section + src.slice(b));
console.log(`section 13: ${section.length} chars source; svgs ${Object.entries(svgs).map(([k, v]) => k + ' ' + enc(v).length).join(', ')}`);
