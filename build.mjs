#!/usr/bin/env node
// Packs src/theme.meta.json + src/theme.css into acid-01.json (T3 Code's theme file, version 1).
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

const css = minify(source);
const problems = [];
if (css.length > 100000) problems.push(`css is ${css.length} characters; T3 Code allows 100000`);
if (css.includes('\\')) problems.push('css contains a backslash: T3 Code drops any declaration whose value has one');
if (/@import|image-set\(|\bsrc\(/.test(css)) problems.push('css tries to load a file (@import, image-set() or src()): T3 Code ignores those');
for (const m of css.matchAll(/url\(\s*["']?([^)"']{0,10})/g)) if (!/^(data:|#|%23)/.test(m[1])) problems.push(`url() must be data: or #id, found url(${m[1]}…`);
if (problems.length) { for (const p of problems) console.error('✗ ' + p); process.exit(1); }

const theme = { version: 1, id: meta.id, name: meta.name, appearance: meta.appearance, canvas: meta.canvas, accent: meta.accent, colors: meta.colors, css };
const outFile = path.join(here, `${meta.id}.json`);
fs.writeFileSync(outFile, JSON.stringify(theme, null, 2) + '\n');
console.log(`wrote ${path.basename(outFile)}: ${Object.keys(meta.colors).length} color roles, ${css.length} characters of CSS`);
