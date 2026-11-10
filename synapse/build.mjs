#!/usr/bin/env node
// Synapse : construit le site statique (pour GitHub Pages) à partir du vault Obsidian du dépôt.
//
//   node synapse/build.mjs            construit le site dans _site/ (ou le dossier "sortie" de synapse.config.json)
//   node synapse/build.mjs --check    vérifie seulement le vault : liens cassés, notes isolées, dossiers sans note
//                                     d'index, notes qu'on n'atteint pas depuis la note d'accueil
//   node synapse/build.mjs --strict   comme --check, mais s'arrête en erreur s'il y a un lien cassé
//
// Node 18 ou plus, aucune dépendance. Le dépôt est le dossier qui contient le dossier synapse/.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVault, esc, extOf, IMAGE_EXT, renderFileMarkdown } from './vault.mjs';

export const KIT = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(KIT, '..');
const MAX_TEXT = 600 * 1024; // un fichier texte plus gros est listé, pas copié (le lecteur renvoie vers GitHub)
const MAX_BIN = 20 * 1024 * 1024; // pareil pour une image, un PDF…
const BINARY_EXT = new Set([...IMAGE_EXT, 'pdf', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'woff', 'woff2', 'ttf', 'otf', 'zip', 'gz', 'tar',
  '7z', 'rar', 'exe', 'dll', 'bin', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'doc', 'xls', 'ppt', 'psd', 'ai', 'sketch', 'fig', 'heic', 'tif', 'tiff']);
// Jamais publiés, même si quelqu'un a oublié de les ignorer : fichiers de secrets et de configuration locale.
const SECRET = /(^|\/)(\.env(?!\.example$)[^/]*|[^/]*\.(pem|key|p12|pfx|keystore|jks)|id_(rsa|dsa|ecdsa|ed25519)[^/]*|\.npmrc|\.netrc|\.pypirc|credentials[^/]*\.json|secrets?\.[a-z]+)$/i;
const SKIP_DIRS = new Set(['.git', 'node_modules', '.obsidian', '.trash', '.venv', '__pycache__', '.DS_Store']);

const DEFAULTS = { titre: 'Mon cerveau', vault: 'vault', fichiers: 'vault', sortie: '_site', accueil: 'Accueil', exclure: [], groupes: {} };

export function loadConfig() {
  const file = join(ROOT, 'synapse.config.json');
  let cfg = {};
  if (existsSync(file)) {
    try { cfg = JSON.parse(readFileSync(file, 'utf8')); } catch (err) { fail(`synapse.config.json n’est pas un JSON valide : ${err.message}`); }
  }
  cfg = { ...DEFAULTS, ...cfg };
  cfg.vault = String(cfg.vault || '.').replace(/^\.?\/?|\/+$/g, '');
  cfg.sortie = String(cfg.sortie || '_site').replace(/^\.\/|\/+$/g, '');
  if (!['vault', 'depot', 'aucun'].includes(cfg.fichiers)) fail('"fichiers" doit valoir "vault", "depot" ou "aucun" dans synapse.config.json.');
  if (!existsSync(join(ROOT, cfg.vault || '.'))) fail(`Le dossier du vault « ${cfg.vault} » n’existe pas (clé "vault" de synapse.config.json).`);
  if (!cfg.sortie || cfg.sortie === '.' || cfg.sortie.startsWith('..') || cfg.sortie === cfg.vault || cfg.sortie === 'synapse') fail('Le dossier "sortie" doit être un dossier à part, par exemple "_site".');
  cfg.exclure = [].concat(cfg.exclure || []).map((x) => String(x).replace(/^\.?\/|\/+$/g, '')).filter(Boolean);
  return cfg;
}

function fail(msg) {
  console.error(`Synapse : ${msg}`);
  process.exit(1);
}

function git(args) {
  try { return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; }
}

function walk(rel = '') {
  const out = [];
  for (const e of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) out.push(...walk(p)); } else if (e.isFile()) out.push(p);
  }
  return out;
}

/** Everything the site is made from: the notes of the vault and the files the page may open. */
export function scan(cfg) {
  const listed = git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  const paths = (listed ? listed.split('\0').filter(Boolean) : walk())
    .filter((p) => !p.split('/').some((part) => SKIP_DIRS.has(part)) && !SECRET.test(p) && p !== cfg.sortie && !p.startsWith(`${cfg.sortie}/`));
  const prefix = cfg.vault ? `${cfg.vault}/` : '';
  const excluded = (id) => cfg.exclure.some((x) => id === x || id.startsWith(`${x}/`));
  const notes = [];
  const files = new Map();
  const sig = createHash('sha1');
  for (const p of paths) {
    let st;
    try { st = statSync(join(ROOT, p)); } catch { continue; }
    if (!st.isFile()) continue;
    const inVault = p.startsWith(prefix);
    const rel = inVault ? p.slice(prefix.length) : '';
    if (inVault && excluded(rel)) continue;
    const isNote = inVault && /\.md$/i.test(p);
    if (isNote) notes.push({ id: rel.slice(0, -3), path: p, mtime: Math.round(st.mtimeMs) });
    const listedFile = cfg.fichiers === 'depot' || (cfg.fichiers === 'vault' && inVault && !isNote);
    if (!listedFile && !isNote) continue;
    sig.update(`${p}:${st.size}:${st.mtimeMs}|`);
    if (listedFile) files.set(p, { size: st.size, kind: '' });
  }
  return { notes, files, sig: sig.digest('hex') };
}

const n = (count, one, many = `${one}s`) => `${count} ${count > 1 ? many : one}`;
const isBinary = (buf) => buf.subarray(0, 8000).includes(0);

/** Reads the notes, sorts the files (text, binary, too big) and builds the data of the page. */
export function build(cfg, scanned, extra = {}) {
  const notes = scanned.notes.map((n) => ({ ...n, text: readFileSync(join(ROOT, n.path), 'utf8') }));
  for (const [p, f] of scanned.files) {
    const ext = extOf(p);
    if (BINARY_EXT.has(ext)) f.kind = f.size > MAX_BIN ? 'big' : 'bin';
    else if (f.size > MAX_TEXT) f.kind = 'big';
    else {
      let buf;
      try { buf = readFileSync(join(ROOT, p)); } catch { f.kind = 'big'; continue; }
      f.kind = isBinary(buf) ? (f.size > MAX_BIN ? 'big' : 'bin') : 'txt';
    }
  }
  const remote = /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?\s*$/.exec(git(['remote', 'get-url', 'origin']) || '');
  const meta = {
    title: String(cfg.titre || DEFAULTS.titre),
    home: String(cfg.accueil || ''),
    filesMode: cfg.fichiers,
    groupNames: cfg.groupes || {},
    repo: process.env.GITHUB_REPOSITORY || (remote ? remote[1] : ''),
    branch: process.env.GITHUB_REF_NAME || (git(['rev-parse', '--abbrev-ref', 'HEAD']) || '').trim(),
    sha: process.env.GITHUB_SHA || (git(['rev-parse', 'HEAD']) || '').trim(),
    at: Date.now(),
    source: process.env.GITHUB_ACTIONS ? 'pages' : 'local',
    ...extra,
  };
  return buildVault(notes, scanned.files, meta, { vault: cfg.vault });
}

/** What the page shows when a file is opened: the file itself, and for markdown its rendering. */
export function fileHtml(data, scanned, p) {
  const text = readFileSync(join(ROOT, p), 'utf8');
  return renderFileMarkdown(text, p, data, scanned.files);
}

export function pageHtml(data) {
  return readFileSync(join(KIT, 'app', 'index.html'), 'utf8')
    .replaceAll('{{TITRE}}', esc(data.title))
    .replaceAll('{{VERSION}}', String(data.at));
}

/** The vault's health: what --check prints. */
export function check(data) {
  const notes = data.notes;
  const ids = new Set(notes.map((n) => n.id));
  const linked = new Map(notes.map((n) => [n.id, new Set()]));
  for (const n of notes) for (const t of n.out) { linked.get(n.id).add(t); linked.get(t)?.add(n.id); }
  const orphans = notes.filter((n) => !linked.get(n.id).size).map((n) => n.id);
  // A folder's index note has the folder's name and sits inside it (Projets/Projets.md), or is named index / README.
  const dirs = new Set(notes.map((n) => n.d).filter(Boolean));
  for (const d of [...dirs]) { const parts = d.split('/'); for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/')); }
  const indexOf = (d) => [`${d}/${posix.basename(d)}`, `${d}/index`, `${d}/README`, `${d}/_index`].find((id) => ids.has(id))
    || notes.find((n) => n.d === d && ['index', 'readme', '_index', posix.basename(d).toLowerCase()].includes(n.t.toLowerCase()))?.id;
  const noIndex = [...dirs].sort().filter((d) => !indexOf(d));
  // Notes that are not linked with their folder's index note (in one direction or the other).
  const loose = notes.filter((n) => {
    if (!n.d) return false;
    const idx = indexOf(n.d);
    return idx && idx !== n.id && !linked.get(n.id).has(idx);
  }).map((n) => n.id);
  const home = notes.find((n) => n.t.toLowerCase() === String(data.home || '').toLowerCase() && !n.d) || notes.find((n) => n.t.toLowerCase() === String(data.home || '').toLowerCase());
  let unreachable = [];
  if (home) {
    const seen = new Set([home.id]);
    const queue = [home.id];
    while (queue.length) for (const t of linked.get(queue.shift())) if (!seen.has(t)) { seen.add(t); queue.push(t); }
    unreachable = notes.filter((n) => !seen.has(n.id)).map((n) => n.id);
  }
  return { orphans, noIndex, loose, home: home?.id || null, unreachable, broken: data.ghosts };
}

function printCheck(data, r) {
  const s = data.stats;
  const list = (title, items, hint) => {
    if (!items.length) return;
    console.log(`\n${title} (${items.length})${hint ? ` : ${hint}` : ''}`);
    for (const x of items.slice(0, 60)) console.log(`  - ${x}`);
    if (items.length > 60) console.log(`  … et ${items.length - 60} autres`);
  };
  console.log(`Vault « ${data.vault || '.'} » : ${n(s.notes, 'note')}, ${n(s.links, 'lien')} entre notes, ${n(s.words, 'mot')}, ${n(s.broken, 'lien cassé', 'liens cassés')}, ${n(s.files, 'fichier')}.`);
  if (data.home && !r.home) console.log(`\nPas de note d’accueil « ${data.home} » (clé "accueil" de synapse.config.json) : crée-la, c’est la porte d’entrée du vault.`);
  list('Liens cassés', r.broken.map((g) => `[[${g.name}]] dans ${g.from.join(', ')}`), 'crée la note ou corrige le lien');
  list('Notes isolées', r.orphans, 'aucun lien ne part ni n’arrive, relie-les à une note de leur sujet');
  list('Dossiers sans note d’index', r.noIndex, 'ajoute une note du même nom que le dossier, dedans, qui liste ses notes');
  list('Notes pas reliées à l’index de leur dossier', r.loose, 'ajoute le lien dans l’index du dossier, ou un lien vers lui');
  list('Notes qu’on n’atteint pas depuis l’accueil', r.home ? r.unreachable : [], 'relie leur index de dossier à l’accueil');
  const ok = !r.broken.length && !r.orphans.length && !r.noIndex.length && !r.loose.length && !(r.home ? r.unreachable.length : 0);
  console.log(ok ? '\nTout est relié. Bravo.' : '');
}

/** Writes the site: page, script, style, data, and a copy of each file the page may open. */
export function writeSite(cfg, data, scanned) {
  const out = join(ROOT, cfg.sortie);
  if (existsSync(out)) {
    if (!existsSync(join(out, '.synapse')) && readdirSync(out).length) fail(`Le dossier « ${cfg.sortie} » existe et ne vient pas de Synapse : choisis un autre "sortie".`);
    rmSync(out, { recursive: true, force: true });
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, '.synapse'), 'Dossier construit par synapse/build.mjs : il est effacé à chaque construction.\n');
  writeFileSync(join(out, '.nojekyll'), '');
  writeFileSync(join(out, 'index.html'), pageHtml(data));
  for (const f of ['synapse.js', 'synapse.css', 'icon.svg']) copyFileSync(join(KIT, 'app', f), join(out, f));
  writeFileSync(join(out, 'data.json'), JSON.stringify(data));
  let copied = 0;
  for (const f of data.files) {
    if (f.k === 'big') continue;
    const dest = join(out, 'files', ...f.p.split('/'));
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(ROOT, f.p), dest);
    copied++;
    if (f.k === 'txt' && /\.(md|markdown)$/i.test(f.p)) {
      const html = join(out, 'rendu', ...`${f.p}.html`.split('/'));
      mkdirSync(dirname(html), { recursive: true });
      writeFileSync(html, fileHtml(data, scanned, f.p));
    }
  }
  return { out, copied };
}

// ---------- command line ----------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  const cfg = loadConfig();
  const scanned = scan(cfg);
  const data = build(cfg, scanned);
  if (args.has('--check') || args.has('--strict')) {
    const r = check(data);
    printCheck(data, r);
    if (args.has('--strict') && r.broken.length) process.exit(1);
  } else {
    const { out, copied } = writeSite(cfg, data, scanned);
    const s = data.stats;
    console.log(`Synapse construit dans ${posix.join(...out.slice(ROOT.length + 1).split(/[\\/]/))}/ : ${n(s.notes, 'note')}, ${n(s.links, 'lien')}, ${n(copied, 'fichier copié', 'fichiers copiés')}${s.broken ? `, ${n(s.broken, 'lien cassé', 'liens cassés')} (node synapse/build.mjs --check)` : ''}.`);
  }
}
