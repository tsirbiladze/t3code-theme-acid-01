#!/usr/bin/env node
// Packs src/theme.meta.json + src/theme.css into acid-01.json in the t3themes.com gallery format:
//   { version, id, name, appearance, author, description, colors, css }   (keys in that order)
// It is T3 Code's ThemeFile v1 plus the gallery-only `author` and `description` fields.
// No dependencies:  node build.mjs
//
// The gallery caps theme CSS at 20,000 characters, so the packing is careful:
//   1. the palette tokens in the source's `@inline-tokens` :root block are build-time constants:
//      every var(--ph-*) is replaced by its literal colour and the block is dropped;
//   2. comments go, whitespace collapses, and the spaces CSS does not need go too (around { } ; ,
//      > ~ /, after a colon, before !important); attribute values that are plain identifiers
//      lose their quotes. Quoted strings, which hold the data: SVG, are otherwise copied verbatim;
//   3. the result is refused if it is over 20,000 characters or holds anything T3 Code's guard
//      or its text check would flag (a backslash, @import, image-set(), src(), or a url() that
//      does not start with data: or #, counting url()s inside a data: SVG).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIMIT = 20000;
const here = path.dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(fs.readFileSync(path.join(here, 'src', 'theme.meta.json'), 'utf8'));
let source = fs.readFileSync(path.join(here, 'src', 'theme.css'), 'utf8');
const problems = [];

// ---- 1. inline the build-time palette tokens
const block = source.match(/\/\*\s*@inline-tokens[\s\S]*?\*\/\s*:root\s*\{([^}]*)\}/);
const tokens = new Map();
if (block) {
  for (const decl of block[1].replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const m = decl.match(/^\s*(--[\w-]+)\s*:\s*([^;]+?)\s*$/);
    if (m) tokens.set(m[1], m[2]);
  }
  source = source.replace(block[0], '');
  source = source.replace(/var\(\s*(--ph-[\w-]+)\s*\)/g, (whole, name) => {
    if (!tokens.has(name)) { problems.push(`unknown token ${name}`); return whole; }
    return tokens.get(name);
  });
}

// ---- 2. minify
function minify(src) {
  const isSpace = (c) => c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\f';
  let out = '';
  for (let i = 0; i < src.length; ) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); i = end < 0 ? src.length : end + 2; out += ' '; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; continue; }
    if (isSpace(c)) { while (i < src.length && isSpace(src[i])) i++; out += ' '; continue; }
    out += c; i++;
  }
  // outside quoted strings only: drop the spaces CSS does not need
  return out
    .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/)
    .map((part, k) => (k % 2 ? part : part
      .replace(/\s*([{};,>~/])\s*/g, '$1')   // around braces, separators, combinators, slashes
      .replace(/:\s+/g, ':')                  // after a colon (never significant; a space BEFORE one is)
      .replace(/\s+!important/g, '!important')
      .replace(/;}/g, '}')
      .replace(/ {2,}/g, ' ')))
    .join('')
    .trim()
    // attribute values that are plain identifiers need no quotes: [data-slot="button"] -> [data-slot=button]
    .replace(/\[([\w-]+)([~|^$*]?=)"(-?[_a-zA-Z][\w-]*)"( i)?\]/g, '[$1$2$3$4]');
}
const css = minify(source);

// ---- 3. checks: the gallery's rules and T3 Code's guard
if (css.length > LIMIT) problems.push(`css is ${css.length} characters; the gallery allows ${LIMIT}`);
if (css.includes('\\')) problems.push('css contains a backslash: T3 Code drops any declaration whose value has one');
// T3 Code's own text check (themeCssLoadsRemoteFiles, which the gallery's `npm run validate` runs):
// it reads the whole text, quoted strings included, so even a url(%23id) INSIDE a data: SVG fails
if (/@import/i.test(css)) problems.push('css contains @import');
if (/image-set\(|\bsrc\(/i.test(css)) problems.push('css contains image-set() or src(): T3 Code reads those as file loads');
for (const m of css.matchAll(/url\((?![ \t\n\f\r]*["']?(?:data:|#))(.{0,24})/gi)) problems.push(`url() must start with data: or #, even inside a data: SVG; found url(${m[1]}…`);
const left = css.match(/var\(--ph-[\w-]+\)/);
if (left) problems.push(`unresolved build token ${left[0]}`);
if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(meta.id ?? '')) problems.push('id must match ^[a-z0-9][a-z0-9-]{0,47}$');
if (typeof meta.name !== 'string' || !meta.name.trim() || meta.name.length > 48) problems.push('name must be 1-48 characters');
if (meta.appearance !== 'dark') problems.push('this edition is dark only: appearance must be "dark"');
if ('variants' in meta) problems.push('this edition ships no variants');
if (!meta.author) problems.push('author (the GitHub user opening the gallery PR) is missing');
if (typeof meta.description !== 'string' || meta.description.length > 200) problems.push(`description must be 200 characters or fewer (is ${meta.description?.length})`);
const roles = Object.entries(meta.colors ?? {});
if (roles.length !== 61) problems.push(`expected all 61 colour roles, found ${roles.length}`);
for (const [role, value] of roles) if (!/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) problems.push(`colors.${role} is not a literal hex colour: ${value}`);
if (problems.length) { for (const p of problems) console.error('✗ ' + p); process.exit(1); }

// ---- 4. write, keys in the gallery's order
const theme = {
  version: 1,
  id: meta.id,
  name: meta.name,
  appearance: meta.appearance,
  author: meta.author,
  description: meta.description,
  colors: meta.colors,
  css,
};
const outFile = path.join(here, `${meta.id}.json`);
fs.writeFileSync(outFile, JSON.stringify(theme, null, 2) + '\n');
console.log(`wrote ${path.basename(outFile)}: ${roles.length} colour roles, ${tokens.size} tokens inlined, ${css.length} / ${LIMIT} characters of CSS (${LIMIT - css.length} to spare)`);
