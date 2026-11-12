#!/usr/bin/env node
// Upload local images referenced by the DA bodies (/import-work/media/<file>) to DA under
// /media/<file> and rewrite the bodies to the DA content URLs, so the EDS pipeline ingests them as
// media. Dry run unless --yes. Token from DA_TOKEN only (never argv or disk).
// Usage: DA_TOKEN=... node tools/da-media.js [--yes]   (run from import-work/, after build.py)
const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(base, 'pages.json'), 'utf8'));
const { org, site } = cfg.da;
const daDir = path.join(base, cfg.da.dir || 'da');
const yes = process.argv.includes('--yes');
const token = process.env.DA_TOKEN;
if (yes && !token) { console.error('DA_TOKEN is not set'); process.exit(1); }

const REF = /\/import-work\/media\/([\w.-]+)/g;
(async () => {
  const files = fs.readdirSync(daDir).filter((f) => f.endsWith('.html'));
  const used = new Set();
  files.forEach((f) => { for (const m of fs.readFileSync(path.join(daDir, f), 'utf8').matchAll(REF)) used.add(m[1]); });
  for (const name of used) {
    const url = `https://admin.da.live/source/${org}/${site}/media/${name}`;
    const buf = fs.readFileSync(path.join(base, 'media', name));
    if (!yes) { console.log(`dry run: PUT ${url} (${buf.length}b)`); continue; }
    const form = new FormData();
    form.append('data', new Blob([buf], { type: 'image/png' }), name);
    const res = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: form });
    console.log(`PUT media/${name}: ${res.status}`);
    if (!res.ok) process.exit(1);
  }
  files.forEach((f) => {
    const p = path.join(daDir, f);
    const html = fs.readFileSync(p, 'utf8');
    const out = html.replace(REF, (_, n) => `https://content.da.live/${org}/${site}/media/${n}`);
    if (out !== html) { if (yes) fs.writeFileSync(p, out); console.log(`${yes ? 'rewrote' : 'would rewrite'} ${f}`); }
  });
})();
