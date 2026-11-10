#!/usr/bin/env node
// Synapse : aperçu local, sans rien écrire sur le disque. Relit le vault à chaque fois que la page le demande
// (bouton « Relire », ou toutes les deux minutes), donc une note modifiée dans Obsidian apparaît tout de suite.
//
//   node synapse/serve.mjs              puis ouvrir http://localhost:4000
//   node synapse/serve.mjs --port 5000
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { build, fileHtml, KIT, loadConfig, pageHtml, ROOT, scan } from './build.mjs';
import { extOf } from './vault.mjs';

const argPort = process.argv.indexOf('--port');
const PORT = Number(argPort > 0 ? process.argv[argPort + 1] : process.env.PORT) || 4000;
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  avif: 'image/avif', ico: 'image/x-icon', bmp: 'image/bmp', pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav' };

let state = null; // { sig, data, scanned, json, etag }
function current() {
  const cfg = loadConfig();
  const scanned = scan(cfg);
  const appSig = ['synapse.js', 'synapse.css', 'index.html'].map((f) => statSync(join(KIT, 'app', f)).mtimeMs).join(':');
  const sig = `${scanned.sig}|${appSig}|${JSON.stringify(cfg)}`;
  if (!state || state.sig !== sig) {
    const data = build(cfg, scanned, { source: 'local' });
    const json = JSON.stringify(data);
    state = { sig, data, scanned, json, etag: `"${data.at}"` };
    console.log(`Vault relu : ${data.stats.notes} notes, ${data.stats.links} liens${data.stats.broken ? `, ${data.stats.broken} liens cassés` : ''}.`);
  }
  return state;
}

function send(res, status, type, body, headers = {}) {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', ...headers });
  res.end(body);
}

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return send(res, 400, 'text/plain; charset=utf-8', 'Adresse invalide'); }
    if (path === '/' || path === '/index.html') return send(res, 200, TYPES.html, pageHtml(current().data));
    if (['/synapse.js', '/synapse.css', '/icon.svg'].includes(path)) return send(res, 200, TYPES[extOf(path)], readFileSync(join(KIT, 'app', path.slice(1))));
    if (path === '/data.json') {
      const s = current();
      if (req.headers['if-none-match'] === s.etag) return send(res, 304, TYPES.json, '', { etag: s.etag });
      return send(res, 200, TYPES.json, s.json, { etag: s.etag });
    }
    // Only the files of the list: nothing else on the disk can be reached.
    const s = current();
    const m = /^\/(files|rendu)\/(.+)$/.exec(path);
    if (m) {
      const p = m[1] === 'rendu' ? m[2].replace(/\.html$/, '') : m[2];
      const f = s.data.files.find((x) => x.p === p);
      if (f && f.k !== 'big') {
        if (m[1] === 'rendu') return send(res, 200, TYPES.html, fileHtml(s.data, s.scanned, p));
        res.writeHead(200, { 'content-type': TYPES[extOf(p)] || (f.k === 'txt' ? 'text/plain; charset=utf-8' : 'application/octet-stream'), 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' });
        return createReadStream(join(ROOT, p)).pipe(res);
      }
    }
    send(res, 404, 'text/plain; charset=utf-8', 'Introuvable');
  } catch (err) {
    console.error(err);
    send(res, 500, 'text/plain; charset=utf-8', `Erreur : ${err.message}`);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  current();
  console.log(`Synapse : http://localhost:${PORT}  (Ctrl+C pour arrêter)`);
});
