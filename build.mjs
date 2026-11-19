#!/usr/bin/env node
// Packs src/theme.meta.json + src/theme.css into T3 Code theme files (version 1):
//   acid-01.json        dark, with the light appearance as `variants.light` (follows the app's light/dark setting)
//   acid-01-light.json  the light appearance as a theme of its own
// T3 Code does not derive a variant: every role it omits would fall back to the app's pink
// built-in palette, so the build refuses a variant that misses any role.
// No dependencies:  node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(fs.readFileSync(path.join(here, 'src', 'theme.meta.json'), 'utf8'));
const source = fs.readFileSync(path.join(here, 'src', 'theme.css'), 'utf8');

// Strip comments and collapse whitespace. Strings and unquoted url() bodies are copied verbatim.
function minify(src) {
  const isSpace = (c) => c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\f';
  let out = '';
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); i = end < 0 ? src.length : end + 2; out += ' '; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; continue; }
    if (src.startsWith('url(', i)) { const end = src.indexOf(')', i); const inner = src.slice(i + 4, end).trim(); if (!inner.startsWith('"') && !inner.startsWith("'")) { out += src.slice(i, end + 1); i = end + 1; continue; } }
    if (isSpace(c)) { while (i < src.length && isSpace(src[i])) i++; out += ' '; continue; }
    out += c; i++;
  }
  return out
    .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/)
    .map((part, k) => (k % 2 ? part : part.replace(/\s*([{};])\s*/g, '$1').replace(/;}/g, '}').replace(/\s*,\s*/g, ',').replace(/ {2,}/g, ' ')))
    .join('')
    .trim();
}

// T3 Code's own early check (themeCssLoadsRemoteFiles in packages/shared/src/themeCss.ts), ported as is.
// The server refuses a theme that fails it, so the build does too.
const FETCHES_BY_STRING = /image-set\(|\bsrc\(/i;
const URL_NOT_LOCAL = /url\((?![ \t\n\f\r]*["']?(?:data:|#))/i;
const URL_OR_STRING = /url\((?![ \t\n\f\r]*["'])[^)]*|url\([ \t\n\f\r]*("[^"\n\r\f]*"|'[^'\n\r\f]*')|"[^"\n\r\f]*"|'[^'\n\r\f]*'/gi;
function loadsRemoteFiles(text) {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(URL_OR_STRING, (token, urlString) => {
    if (urlString !== undefined) return /^["'](?:data:|#)/i.test(urlString) ? '' : 'url(';
    return token.startsWith('"') || token.startsWith("'") ? '' : token;
  });
  return /@import/i.test(code) || FETCHES_BY_STRING.test(code) || URL_NOT_LOCAL.test(code);
}

const css = minify(source);
const problems = [];
if (css.length > 100000) problems.push(`css is ${css.length} characters; T3 Code allows 100000`);
if (css.includes('\\')) problems.push('css contains a backslash: T3 Code drops any declaration whose value has one');
if (loadsRemoteFiles(css)) problems.push('css fails T3 Code\'s file-loading check: remove @import, image-set(), src() and any url() that is not data: or #id');
const roles = Object.keys(meta.colors);
for (const [appearance, colors] of Object.entries(meta.variants ?? {})) {
  if (appearance === meta.appearance || !['light', 'dark'].includes(appearance)) { problems.push(`variants.${appearance}: only the other appearance ("${meta.appearance === 'dark' ? 'light' : 'dark'}") may be a variant`); continue; }
  const missing = roles.filter((r) => !(r in colors));
  const extra = Object.keys(colors).filter((r) => !roles.includes(r));
  if (missing.length) problems.push(`variants.${appearance} misses ${missing.length} role(s), which T3 Code would fill from its pink palette: ${missing.join(', ')}`);
  if (extra.length) problems.push(`variants.${appearance} has role(s) the base does not: ${extra.join(', ')}`);
}
if (problems.length) { for (const p of problems) console.error('✗ ' + p); process.exit(1); }

const write = (theme) => {
  const file = path.join(here, `${theme.id}.json`);
  fs.writeFileSync(file, JSON.stringify(theme, null, 2) + '\n');
  const variants = Object.entries(theme.variants ?? {}).map(([a, c]) => ` + ${a} variant (${Object.keys(c).length} roles)`).join('');
  console.log(`wrote ${path.basename(file)}: ${theme.appearance}${variants}, ${Object.keys(theme.colors).length} color roles, ${css.length} characters of CSS`);
};
write({ version: 1, id: meta.id, name: meta.name, appearance: meta.appearance, canvas: meta.canvas, accent: meta.accent, colors: meta.colors, ...(meta.variants ? { variants: meta.variants } : {}), css });
for (const [appearance, alone] of Object.entries(meta.standalone ?? {})) {
  const colors = meta.variants?.[appearance];
  if (!colors) { console.error(`✗ standalone.${appearance} needs variants.${appearance}`); process.exit(1); }
  write({ version: 1, id: alone.id, name: alone.name, appearance, canvas: colors.canvas, accent: colors.accent, colors, css });
}
