// Synapse : lit un vault Obsidian (des notes Markdown reliées par des [[liens]]) et prépare tout ce que la page
// affiche : le texte de chaque note en HTML, ses liens, ses tags, ses propriétés, et la liste des fichiers.
// Aucune dépendance. Tout ce qui est écrit dans une note est échappé : le seul HTML produit est celui écrit ici.
import { posix } from 'node:path';

export const DATA_VERSION = 1;
export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico']);
export const extOf = (p) => {
  const b = p.slice(p.lastIndexOf('/') + 1).toLowerCase();
  const dot = b.lastIndexOf('.');
  return dot > 0 ? b.slice(dot + 1) : '';
};
export const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');

// ---------- markdown (Obsidian flavour) ----------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function slug(text) {
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/`|\*|_|\[\[|\]\]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
}

/** Front matter between the first two `---` lines: `key: value`, `key: [a, b]` and `key:` followed by `- a` lines. */
export function frontMatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
  if (!m) return { data: {}, body: src, lines: 0 };
  const data = {};
  let last = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && last) { (Array.isArray(data[last]) ? data[last] : (data[last] = [])).push(unquote(item[1])); continue; }
    const kv = /^([^\s:#][^:]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    last = kv[1].trim();
    const v = kv[2].trim();
    // `[a, b]` is a list, but `[[Note]]` written without quotes is a link (Obsidian accepts it).
    data[last] = /^\[.*\]$/.test(v) && !/^\[\[[^\]]*\]\]$/.test(v) ? v.slice(1, -1).split(',').map((x) => unquote(x.trim())).filter(Boolean) : v === '' ? '' : unquote(v);
  }
  return { data, body: src.slice(m[0].length), lines: m[0].split('\n').length - 1 };
}
const unquote = (v) => String(v).replace(/^(["'])(.*)\1$/, '$2');

/** Plain text of a line of markdown, for search and for the context of a link. */
export function plain(md) {
  return String(md)
    .replace(/!?\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g, (_, t, h, a) => a || (h ? `${t} › ${h}` : t))
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`+([^`]*)`+/g, '$1')
    .replace(/(\*\*|__|~~|==)/g, '')
    .replace(/(^|\s)[*_](\S[^*_]*?)[*_](?=\s|$|[.,;:!?)])/g, '$1$2')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FENCE = /^(\s*)(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^\s{0,3}>/;
const LIST = /^(\s*)([-*+]|\d{1,9}[.)])(\s+|$)(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const isTableStart = (lines, i) => lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes('-');
const indentOf = (s) => s.replace(/\t/g, '    ').match(/^ */)[0].length;

/** Splits a table row on `|`, keeping pipes inside `code` and escaped `\|` (used by [[Note\|alias]] in tables). */
function cells(row) {
  let s = row.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const out = [];
  let cur = '';
  let tick = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' && s[i + 1] === '|') { cur += '|'; i++; continue; }
    if (ch === '`') tick = !tick;
    if (ch === '|' && !tick) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/**
 * Markdown to HTML. ctx: { wiki(target, alias, embed) -> html, code(text) -> html, link(textHtml, href) -> html,
 * ids: Set of heading ids already used, headings: [] filled with { level, text, id }, line: (raw) => void }.
 * Everything typed in a note is escaped: the only HTML that comes out is the one written here.
 */
export function renderMarkdown(src, ctx) {
  const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  return blocks(lines, ctx);
}

function blocks(lines, ctx) {
  const out = [];
  let i = 0;
  const startsBlock = (k) => FENCE.test(lines[k]) || HEADING.test(lines[k]) || HR.test(lines[k]) || QUOTE.test(lines[k]) || LIST.test(lines[k]) || isTableStart(lines, k);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    let m = FENCE.exec(line);
    if (m) {
      const [, pad, fence, lang] = m;
      const body = [];
      i++;
      while (i < lines.length && !(lines[i].trim().startsWith(fence[0].repeat(fence.length)) && lines[i].trim().replace(new RegExp(`^\\${fence[0]}+`), '').trim() === '')) {
        body.push(lines[i].startsWith(pad) ? lines[i].slice(pad.length) : lines[i]);
        i++;
      }
      i++;
      out.push(`<pre class="code"${lang ? ` data-lang="${esc(lang.toLowerCase())}"` : ''}><code>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }
    m = HEADING.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2];
      let id = slug(plain(text));
      if (ctx.ids) { let n = 2; const base = id; while (ctx.ids.has(id)) id = `${base}-${n++}`; ctx.ids.add(id); }
      ctx.headings?.push({ level, text: plain(text), id });
      ctx.line?.(text);
      out.push(`<h${level} id="${esc(id)}">${inline(text, ctx)}</h${level}>`);
      i++;
      continue;
    }
    if (HR.test(line)) { out.push('<hr>'); i++; continue; }
    if (QUOTE.test(line)) {
      const body = [];
      while (i < lines.length && QUOTE.test(lines[i])) { body.push(lines[i].replace(/^\s{0,3}>\s?/, '')); i++; }
      const call = /^\[!([\w-]+)\]([+-]?)\s*(.*)$/.exec(body[0] || '');
      if (call) {
        const kind = call[1].toLowerCase();
        const title = call[3] || kind.charAt(0).toUpperCase() + kind.slice(1);
        out.push(`<div class="callout co-${esc(kind)}"><p class="co-t">${inline(title, ctx)}</p>${blocks(body.slice(1), ctx)}</div>`);
      } else out.push(`<blockquote>${blocks(body, ctx)}</blockquote>`);
      continue;
    }
    if (isTableStart(lines, i)) {
      const head = cells(lines[i]);
      const align = cells(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'c' : /^-+:$/.test(c) ? 'r' : ''));
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) { rows.push(cells(lines[i])); i++; }
      const td = (tag, c, k) => `<${tag}${align[k] ? ` class="al-${align[k]}"` : ''}>${(ctx.line?.(c), inline(c, ctx))}</${tag}>`;
      out.push(`<div class="tbl"><table><thead><tr>${head.map((c, k) => td('th', c, k)).join('')}</tr></thead><tbody>${
        rows.map((r) => `<tr>${head.map((_, k) => td('td', r[k] ?? '', k)).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (LIST.test(line)) {
      const block = [];
      const base = indentOf(line);
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) {
          // A blank line ends the list unless the next line is still part of it (an item or indented text).
          const next = lines[i + 1];
          if (next != null && next.trim() && (LIST.test(next) && indentOf(next) >= base || indentOf(next) > base)) { block.push(''); i++; continue; }
          break;
        }
        if (block.length && !LIST.test(l) && indentOf(l) <= base && startsBlock(i)) break;
        if (block.length && !LIST.test(l) && indentOf(l) <= base && !lines[i - 1].trim()) break;
        block.push(l);
        i++;
      }
      out.push(list(block, ctx));
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && startsBlock(i))) { para.push(lines[i].trim()); i++; }
    if (!para.length) { para.push(line.trim()); i++; }
    out.push(`<p>${para.map((p) => (ctx.line?.(p), inline(p, ctx))).join('<br>')}</p>`);
  }
  return out.join('\n');
}

function list(lines, ctx) {
  // Items with their indentation; text lines that aren't items belong to the item above.
  const items = [];
  for (const l of lines) {
    const m = LIST.exec(l);
    if (m) items.push({ indent: indentOf(m[1]), ordered: /\d/.test(m[2]), start: parseInt(m[2], 10) || 1, body: [m[4]], kids: [] });
    else if (items.length) items[items.length - 1].body.push(l.replace(/^\s{0,8}/, ''));
  }
  const root = { indent: -1, kids: [] };
  const stack = [root];
  for (const it of items) {
    while (stack.length > 1 && it.indent <= stack[stack.length - 1].indent) stack.pop();
    stack[stack.length - 1].kids.push(it);
    stack.push(it);
  }
  const render = (kids) => {
    const groups = [];
    for (const k of kids) {
      const g = groups[groups.length - 1];
      if (g && g.ordered === k.ordered) g.items.push(k); else groups.push({ ordered: k.ordered, start: k.start, items: [k] });
    }
    return groups.map((g) => {
      const tag = g.ordered ? 'ol' : 'ul';
      const lis = g.items.map((k) => {
        let first = k.body[0] || '';
        let task = '';
        const t = /^\[([ xX])\]\s+(.*)$/.exec(first);
        if (t) { task = t[1] === ' ' ? 'todo' : 'done'; first = t[2]; }
        const rest = k.body.slice(1);
        ctx.line?.(first);
        const inner = rest.some((r) => r.trim())
          ? `${inline(first, ctx)}${blocks(rest, ctx).replace(/^<p>([\s\S]*)<\/p>$/, '<br>$1')}`
          : inline(first, ctx);
        const box = task ? `<span class="task ${task}" aria-label="${task === 'done' ? 'Fait' : 'À faire'}"></span>` : '';
        return `<li${task ? ' class="li-task"' : ''}>${box}${inner}${k.kids.length ? render(k.kids) : ''}</li>`;
      }).join('');
      return `<${tag}${g.ordered && g.start !== 1 ? ` start="${g.start}"` : ''}>${lis}</${tag}>`;
    }).join('');
  };
  return render(root.kids);
}

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export function inline(src, ctx) {
  const kept = [];
  const keep = (html) => `\u0000${kept.push(html) - 1}\u0000`;
  let s = String(src);
  s = s.replace(/(`+)(.+?)\1(?!`)/g, (_, __, code) => keep(ctx.code ? ctx.code(code.trim()) : `<code>${esc(code.trim())}</code>`));
  s = s.replace(/(!?)\[\[([^[\]\n]+?)\]\]/g, (_, bang, inner) => {
    const [target, alias] = inner.split(/\\?\|/);
    return keep(ctx.wiki ? ctx.wiki(target.trim(), alias?.trim() || '', !!bang) : esc(alias || target));
  });
  s = s.replace(/!\[([^\]]*)\]\(<?([^)\s>]+)>?(?:\s+"[^"]*")?\)/g, (_, alt, href) => keep(ctx.image ? ctx.image(alt, href)
    : SAFE_URL.test(href) ? `<a class="ext" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(alt || 'image')}</a>` : esc(alt)));
  s = s.replace(/\[([^\]]+)\]\(<?([^)\s>]+)>?(?:\s+"[^"]*")?\)/g, (_, text, href) => keep(ctx.link
    ? ctx.link(inline(text, { ...ctx, line: null }), href)
    : SAFE_URL.test(href) ? `<a class="ext" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${inline(text, ctx)}</a>` : inline(text, ctx)));
  s = s.replace(/<(https?:\/\/[^>\s]+)>/g, (_, url) => keep(`<a class="ext" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`));
  s = s.replace(/(^|[\s(«])(https?:\/\/[^\s<>()«»"]+[^\s<>()«»".,;:!?'])/g, (_, pre, url) => `${pre}${keep(`<a class="ext" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`)}`);
  s = esc(s)
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/(^|[^\w*])\*(?=[^\s*])([^*]*?[^\s*])\*(?![\w*])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=[^\s_])([^_]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
    .replace(/==(?=\S)([\s\S]*?\S)==/g, '<mark>$1</mark>')
    // #tags written in the text (Obsidian: letters, digits, _ - /, at least one that is not a digit)
    .replace(/(^|[\s(>])#([\p{L}\p{N}_/-]*[\p{L}_][\p{L}\p{N}_/-]*)/gu, (_, pre, t) => `${pre}${ctx.tag ? ctx.tag(t) : `<span class="tag">#${t}</span>`}`);
  // Kept pieces may hold other kept pieces (a link around code): restore until none is left.
  for (let k = 0; k < 3 && s.includes('\u0000'); k++) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => kept[Number(n)]);
  return s;
}

// ---------- the vault as a graph ----------

const groupOf = (id) => (id.includes('/') ? id.slice(0, id.indexOf('/')) : '');
const HIDDEN_PROPS = new Set(['tags', 'tag', 'aliases', 'alias', 'cssclasses', 'cssclass', 'publish', 'position']);
const imgHtml = (src, alt, size) => {
  const m = /^(\d{1,4})(?:x(\d{1,4}))?$/.exec(size || '');
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"${m ? ` width="${m[1]}"${m[2] ? ` height="${m[2]}"` : ''}` : ''}>`;
};

/**
 * Builds what the page needs.
 * notesIn: [{ id (path in the vault, without .md), text }]
 * files: Map(path from the repository root -> { size, kind: 'txt' | 'bin' | 'big' }), the files the page can open
 * opts: { vault: folder of the vault from the repository root ('' when the vault is the repository) }
 */
export function buildVault(notesIn, files, meta = {}, opts = {}) {
  const vaultDir = (opts.vault || '').replace(/^\.?\/?|\/+$/g, '');
  const prefix = vaultDir ? `${vaultDir}/` : '';
  const notes = notesIn.map((n) => ({ ...n, fm: frontMatter(n.text) })).sort((a, b) => a.id.localeCompare(b.id, 'fr'));
  const byId = new Map(notes.map((n) => [n.id.toLowerCase(), n]));
  const byName = new Map();
  const byAlias = new Map();
  for (const n of notes) {
    const k = posix.basename(n.id).toLowerCase();
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(n);
    for (const a of [].concat(n.fm.data.aliases || n.fm.data.alias || [])) {
      const key = String(a).trim().toLowerCase();
      if (key && !byAlias.has(key)) byAlias.set(key, n);
    }
  }
  // Obsidian's rules: a name alone is looked for everywhere (the shortest path wins), a path from the vault's root
  // or from the note's folder, then the aliases.
  const resolveNote = (raw, fromDir = '') => {
    const t = String(raw).replace(/\\/g, '/').replace(/\.md$/i, '').replace(/^\.\//, '').trim();
    if (!t) return null;
    if (t.includes('/')) {
      const rel = fromDir ? posix.normalize(`${fromDir}/${t}`) : t;
      return byId.get(rel.toLowerCase()) || byId.get(t.replace(/^\//, '').toLowerCase())
        || notes.find((n) => n.id.toLowerCase().endsWith(`/${t.toLowerCase()}`)) || null;
    }
    const list = byName.get(t.toLowerCase());
    if (list) return list.slice().sort((a, b) => a.id.length - b.id.length)[0];
    return byAlias.get(t.toLowerCase()) || null;
  };

  // Files by name, to turn `rapport.pdf` or `src/app.js` written in a note into a link to the file.
  const fileNames = new Map();
  for (const p of files.keys()) {
    const k = posix.basename(p).toLowerCase();
    if (!fileNames.has(k)) fileNames.set(k, []);
    fileNames.get(k).push(p);
  }
  const resolveFile = (raw) => {
    let t = String(raw).trim().replace(/^\.\//, '').replace(/:(\d+)(-\d+)?$/, '').replace(/[),.;]+$/, '');
    if (!t || t.length > 300 || !/[./]/.test(t)) return null;
    if (files.has(t)) return t;
    if (t.startsWith('/')) t = t.slice(1);
    if (files.has(t) || files.has(prefix + t)) return files.has(t) ? t : prefix + t;
    if (t.includes('/')) {
      const hits = [];
      for (const p of files.keys()) if (p.endsWith(`/${t}`)) { hits.push(p); if (hits.length > 1) break; }
      return hits.length === 1 ? hits[0] : null;
    }
    const same = /\.[a-z0-9]{1,6}$/i.test(t) ? fileNames.get(t.toLowerCase()) : null;
    return same && same.length === 1 ? same[0] : null;
  };
  // An attachment named in [[...]] or ![](...): next to the note first, then from the vault's root, then by name.
  const resolveAttachment = (raw, fromDir) => {
    let t = String(raw).replace(/\\/g, '/').replace(/^\.\//, '').trim();
    try { t = decodeURIComponent(t); } catch { /* keep it as written */ }
    if (!t) return null;
    for (const c of [posix.join(prefix + fromDir, t), posix.join(prefix || '.', t), t]) {
      const p = posix.normalize(c).replace(/^\.\//, '');
      if (files.has(p)) return p;
    }
    const same = fileNames.get(posix.basename(t).toLowerCase()) || [];
    const fit = same.filter((p) => !t.includes('/') || p.toLowerCase().endsWith(`/${t.toLowerCase()}`));
    return fit.sort((a, b) => (b.startsWith(prefix) - a.startsWith(prefix)) || a.length - b.length)[0] || null;
  };

  const ghosts = new Map(); // unresolved link target -> notes that point to it
  const out = [];
  for (const n of notes) {
    const fm = n.fm;
    const dir = posix.dirname(n.id) === '.' ? '' : posix.dirname(n.id);
    const links = new Map(); // id -> number of links
    const context = {}; // id -> the line where the first link to it is
    const code = new Set();
    const broken = new Set();
    const tags = new Set([].concat(fm.data.tags || fm.data.tag || []).flatMap((t) => String(t).split(/[\s,]+/)).map((t) => t.replace(/^#/, '').trim()).filter(Boolean));
    let current = '';
    const linkTo = (hit) => {
      if (hit === n) return;
      links.set(hit.id, (links.get(hit.id) || 0) + 1);
      if (!context[hit.id]) context[hit.id] = plain(current).slice(0, 260);
    };
    const fileLink = (p, html) => { code.add(p); return `<a class="fl" href="#f=${encodeURIComponent(p)}" data-file="${esc(p)}">${html}</a>`; };
    const ctx = {
      ids: new Set(),
      headings: [],
      line: (raw) => { current = raw; },
      tag: (t) => { tags.add(t); return `<a class="tag" href="#" data-tag="${esc(t)}">#${esc(t)}</a>`; },
      wiki: (target, alias, embed) => {
        const [name, ...anchor] = target.split('#');
        const h = anchor.join('#').replace(/^\^/, '');
        const ext = extOf(name);
        if (ext && ext !== 'md') {
          const p = resolveAttachment(name, dir);
          if (p) {
            if (embed && IMAGE_EXT.has(ext)) { code.add(p); return `<a class="img" href="#f=${encodeURIComponent(p)}" data-file="${esc(p)}">${imgHtml(`files/${encPath(p)}`, posix.basename(p), alias)}</a>`; }
            return fileLink(p, esc(alias || posix.basename(name)));
          }
        }
        const label = alias || (h ? `${name || posix.basename(n.id)} › ${h}` : name);
        const hit = name ? resolveNote(name, dir) : n;
        if (!hit) {
          broken.add(name);
          if (!ghosts.has(name)) ghosts.set(name, new Set());
          ghosts.get(name).add(n.id);
          return `<a class="wl ghost" href="#" data-ghost="${esc(name)}" title="Cette note n’existe pas encore">${esc(label)}</a>`;
        }
        linkTo(hit);
        return `<a class="wl${embed ? ' embed' : ''}" href="#n=${encodeURIComponent(hit.id)}${h ? `&h=${encodeURIComponent(slug(h))}` : ''}" data-note="${esc(hit.id)}"${h ? ` data-h="${esc(slug(h))}"` : ''}>${esc(label)}</a>`;
      },
      code: (text) => {
        const t = text.trim();
        const asNote = /\.md$/i.test(t) && (resolveNote(prefix && t.startsWith(prefix) ? t.slice(prefix.length) : t, dir));
        if (asNote) {
          linkTo(asNote);
          return `<a class="wl" href="#n=${encodeURIComponent(asNote.id)}" data-note="${esc(asNote.id)}"><code>${esc(text)}</code></a>`;
        }
        const p = /\s/.test(t) ? null : resolveFile(t);
        if (!p) return `<code>${esc(text)}</code>`;
        code.add(p);
        return `<code class="cf" data-file="${esc(p)}" title="Ouvrir ${esc(p)}">${esc(text)}</code>`;
      },
      image: (alt, href) => {
        if (/^https:\/\//i.test(href)) return imgHtml(href, alt);
        const p = SAFE_URL.test(href) ? null : resolveAttachment(href.split('#')[0], dir);
        if (p && IMAGE_EXT.has(extOf(p))) { code.add(p); return `<a class="img" href="#f=${encodeURIComponent(p)}" data-file="${esc(p)}">${imgHtml(`files/${encPath(p)}`, alt || posix.basename(p))}</a>`; }
        if (p) return fileLink(p, esc(alt || posix.basename(p)));
        return esc(alt);
      },
      link: (html, href) => {
        if (SAFE_URL.test(href)) return `<a class="ext" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
        let clean = '';
        try { clean = decodeURIComponent(href.split('#')[0] || ''); } catch { return html; }
        const note = clean && /\.md$/i.test(clean) ? resolveNote(clean, dir) : null;
        if (note) {
          linkTo(note);
          return `<a class="wl" href="#n=${encodeURIComponent(note.id)}" data-note="${esc(note.id)}">${html}</a>`;
        }
        const p = clean && (resolveAttachment(clean, dir) || resolveFile(clean));
        return p ? fileLink(p, html) : html;
      },
    };
    // %% comments %% are Obsidian's: not shown.
    const body = fm.body.replace(/%%[\s\S]*?%%/g, '');
    const html = renderMarkdown(body, ctx);
    // Properties (front matter) are shown above the note; a [[link]] in a property counts as a link, like in Obsidian.
    const props = [];
    for (const [k, v] of Object.entries(fm.data)) {
      if (HIDDEN_PROPS.has(k.toLowerCase()) || v === '' || v == null) continue;
      const vals = [].concat(v).map((x) => String(x));
      current = `${k} : ${vals.join(', ')}`;
      props.push([k, vals.map((x) => inline(x, ctx)).join(', ')]);
    }
    const text = plain(body);
    out.push({
      id: n.id,
      t: posix.basename(n.id),
      g: groupOf(n.id),
      d: dir,
      fm: fm.data,
      props,
      tags: [...tags],
      al: [].concat(fm.data.aliases || fm.data.alias || []).map(String),
      h: html,
      x: text,
      hd: ctx.headings.filter((h) => h.level <= 3).map(({ level, text: tx, id }) => [level, tx, id]),
      out: [...links.keys()],
      ctx: context,
      code: [...code],
      bad: [...broken],
      w: text ? text.split(' ').length : 0,
      s: Buffer.byteLength(n.text),
      m: n.mtime || 0,
    });
  }

  const groups = {};
  for (const n of out) groups[n.g] = (groups[n.g] || 0) + 1;
  return {
    v: DATA_VERSION,
    ...meta,
    vault: vaultDir,
    notes: out,
    ghosts: [...ghosts].map(([name, from]) => ({ name, from: [...from] })),
    files: [...files].map(([p, f]) => ({ p, s: f.size, k: f.kind })).sort((a, b) => a.p.localeCompare(b.p)),
    groups: Object.entries(groups).map(([id, count]) => ({ id, count })),
    stats: {
      notes: out.length,
      links: out.reduce((a, n) => a + n.out.length, 0),
      broken: out.reduce((a, n) => a + n.bad.length, 0),
      words: out.reduce((a, n) => a + n.w, 0),
      refs: new Set(out.flatMap((n) => n.code)).size,
      files: files.size,
    },
  };
}

/** A markdown file that isn't a note (README, guide): its links to notes and files open in the page. */
export function renderFileMarkdown(text, path, data, files) {
  const dir = posix.dirname(path);
  const prefix = data.vault ? `${data.vault}/` : '';
  const has = (p) => files.has(p);
  const noteByName = (name) => data.notes.find((x) => x.t.toLowerCase() === name.toLowerCase() || x.id.toLowerCase() === name.toLowerCase());
  const ctx = {
    ids: new Set(),
    code: (t) => {
      const p = has(t) ? t : has(posix.normalize(posix.join(dir, t))) ? posix.normalize(posix.join(dir, t)) : null;
      return p ? `<code class="cf" data-file="${esc(p)}" title="Ouvrir ${esc(p)}">${esc(t)}</code>` : `<code>${esc(t)}</code>`;
    },
    wiki: (target, alias) => {
      const n = noteByName(target.split('#')[0].replace(/\.md$/i, ''));
      return n ? `<a class="wl" href="#n=${encodeURIComponent(n.id)}" data-note="${esc(n.id)}">${esc(alias || target)}</a>` : esc(alias || target);
    },
    image: (alt, href) => {
      if (/^https:\/\//i.test(href)) return imgHtml(href, alt);
      let p = '';
      try { p = posix.normalize(posix.join(dir, decodeURIComponent(href.split('#')[0]))); } catch { return esc(alt); }
      return has(p) && IMAGE_EXT.has(extOf(p)) ? imgHtml(`files/${encPath(p)}`, alt) : esc(alt);
    },
    link: (html, href) => {
      if (SAFE_URL.test(href)) return `<a class="ext" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      let p = '';
      try { p = posix.normalize(posix.join(dir, decodeURIComponent(href.split('#')[0]))); } catch { return html; }
      if (p.startsWith(prefix) && p.endsWith('.md')) {
        const id = p.slice(prefix.length, -3);
        if (data.notes.some((x) => x.id === id)) return `<a class="wl" href="#n=${encodeURIComponent(id)}" data-note="${esc(id)}">${html}</a>`;
      }
      return has(p) ? `<a class="fl" href="#f=${encodeURIComponent(p)}" data-file="${esc(p)}">${html}</a>` : html;
    },
  };
  return renderMarkdown(frontMatter(text).body.replace(/%%[\s\S]*?%%/g, ''), ctx);
}
