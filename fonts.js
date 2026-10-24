document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function bgFor(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.75 ? '#000000' : '#ffffff';
  }
  const hexRgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

  /* ================= Font catalogue ================= */
  const STANDARD = [
    ['Arial', 'Arial, Helvetica, sans-serif'], ['Helvetica', 'Helvetica, Arial, sans-serif'],
    ['Verdana', 'Verdana, Geneva, sans-serif'], ['Tahoma', 'Tahoma, Geneva, sans-serif'],
    ['Trebuchet MS', '"Trebuchet MS", Helvetica, sans-serif'], ['Impact', 'Impact, "Arial Narrow Bold", sans-serif'],
    ['Georgia', 'Georgia, serif'], ['Times New Roman', '"Times New Roman", Times, serif'],
    ['Palatino', '"Palatino Linotype", Palatino, "Book Antiqua", serif'], ['Garamond', 'Garamond, "Times New Roman", serif'],
    ['Courier New', '"Courier New", Courier, monospace'], ['Brush Script MT', '"Brush Script MT", cursive'],
    ['Comic Sans MS', '"Comic Sans MS", "Comic Sans", cursive']
  ];

  // The open-source fonts live in the fonts/ folder and are packed into fonts-data.js (see build-fonts.py).
  // To add a font: put the file in fonts/, add a line here, run build-fonts.py.
  //   [display name, file in fonts/, designers, year, source, caps-only?]
  const SOURCES = {
    typotheque: { label: 'Typothèque of ESA le 75', url: 'https://typotheque.le75.be/', license: 'SIL Open Font License' },
    fonderie: { label: 'Fonderie Download', url: 'https://fonderie.download/', license: 'WTFPL licence' }
  };
  const OPEN = [
    ['Barlow-TypoDesBois', 'barlow-typodesbois.otf', 'Eric Eribon, Lucie Danloy, Nicoletta Molino, Sofia D. Pimentel', 2019, 'typotheque'],
    ['Ding Dong', 'ding-dong.otf', 'Victor Dubien', 2022, 'typotheque'],
    ['Elastic', 'elastic.otf', 'Dries Hamels, Florjent Nuhiji, Olivia Marly', 2019, 'typotheque'],
    ['Goozette', 'goozette.otf', 'Alexandra Lambert, Madeleine Barbaroux', 2020, 'typotheque'],
    ['Rami', 'rami.otf', 'Justine Douard', 2023, 'typotheque', true],
    ['SpaceNotoriousRounded', 'spacenotoriousrounded.otf', 'Michaël Dewilder, Structure Baton', 2018, 'typotheque'],
    ['Beast', 'beast.otf', 'Tanguy Vanlaeys', '', 'fonderie'],
    ['Crédible', 'credible.otf', 'JLFC', 2019, 'fonderie']
  ];

  const fonts = [
    ...STANDARD.map(([name, stack]) => ({ kind: 'system', name, stack })),
    ...OPEN.map(([name, file, designers, year, source, caps], i) => ({
      kind: 'open', name, file, designers, year, source, caps: !!caps, family: `typefont${i}`, status: 'loading'
    }))
  ];

  /* ================= State ================= */
  const S = { font: fonts[0], text: 'Custom type', size: 160, tracking: 0, weight: 400, ink: '#193438', strength: 0, brush: 120 };
  function say(msg, kind) { const el = $('status'); el.textContent = msg; el.className = 'status' + (kind ? ' ' + kind : ''); }

  const stackOf = f => f.kind === 'system' ? f.stack : (f.status === 'ready' ? `"${f.family}", sans-serif` : null);
  const shown = (f, t) => f.caps ? t.toUpperCase() : t;

  /* ================= Font list ================= */
  const rowEls = new Map();
  function buildList() {
    const root = $('font-groups');
    root.textContent = '';
    rowEls.clear();
    const add = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; root.appendChild(e); return e; };
    const link = (p, s) => { const a = document.createElement('a'); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.label; p.append(a); };
    const put = f => { const r = row(f); rowEls.set(f, r); root.appendChild(r); };

    add('h2', 'group-head', 'Standard fonts');
    add('p', 'group-note', 'Common fonts found on most devices. Availability depends on your device.');
    fonts.filter(f => f.kind === 'system').forEach(put);

    add('h2', 'group-head', 'Open-source fonts');
    for (const key of ['typotheque', 'fonderie']) {
      const list = fonts.filter(f => f.source === key);
      if (!list.length) continue;
      const note = add('p', 'group-note');
      note.append(key === 'typotheque' ? 'From the ' : 'From ');
      link(note, SOURCES[key]);
      note.append(`. ${SOURCES[key].license}.`);
      list.forEach(put);
    }
  }
  function refreshRow(f) { const old = rowEls.get(f); if (!old) return; const r = row(f); old.replaceWith(r); rowEls.set(f, r); }

  function row(f) {
    const b = document.createElement('button');
    b.className = 'font-row';
    b.setAttribute('aria-current', f === S.font);
    const name = document.createElement('span'); name.className = 'font-name';
    // The name is set in the font itself, so the list works as a specimen.
    const prev = document.createElement('span'); prev.className = 'font-preview'; prev.textContent = shown(f, f.name);
    const st = stackOf(f);
    if (st) prev.style.fontFamily = st;
    name.appendChild(prev);
    if (f.kind === 'open') {
      const m = document.createElement('span'); m.className = 'font-meta';
      m.textContent = f.status === 'failed' ? `${f.name} could not be loaded` : [f.year, f.designers].filter(Boolean).join(' · ');
      name.appendChild(m);
    }
    b.appendChild(name);
    if (f.kind === 'open' && f.status !== 'ready') {
      const s = document.createElement('span'); s.className = 'font-state'; s.textContent = f.status === 'failed' ? 'Unavailable' : 'Loading…'; b.appendChild(s);
    }
    b.onclick = () => select(f);
    return b;
  }

  function select(f) {
    S.font = f;
    document.querySelectorAll('.font-row[aria-current]').forEach(r => r.setAttribute('aria-current', String(rowEls.get(f) === r)));
    updateCredit();
    render();
  }

  function updateCredit() {
    const f = S.font, el = $('credit');
    el.textContent = '';
    if (f.kind === 'system') { el.textContent = `${f.name} is a system font. How it looks depends on your device.`; return; }
    const src = SOURCES[f.source];
    el.append(f.name);
    if (f.designers) el.append(` by ${f.designers}`);
    if (f.year) el.append(` (${f.year})`);
    el.append(`. ${src.license}. Font from `);
    const a = document.createElement('a'); a.href = src.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = src.label;
    el.append(a, '. Please credit the designers if you use it.');
    if (f.caps) el.append(' This font has capital letters only, so your text is shown in capitals.');
  }

  /* ================= Loading the fonts ================= */
  function bytesOf(b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  async function loadOne(f) {
    try {
      const data = window.FONT_DATA && window.FONT_DATA[f.file];
      if (!data) throw new Error('missing from fonts-data.js');
      const face = new FontFace(f.family, bytesOf(data));
      await face.load();
      document.fonts.add(face);
      f.status = 'ready';
    } catch (err) { console.error(f.name, err); f.status = 'failed'; }
    refreshRow(f);
    if (f === S.font) { updateCredit(); render(); }
  }
  async function loadAll() {
    const open = fonts.filter(f => f.kind === 'open');
    if (!window.FONT_DATA) { open.forEach(f => { f.status = 'failed'; refreshRow(f); }); say('fonts-data.js did not load. Run build-fonts.py and reload.', 'error'); return; }
    await Promise.all(open.map(loadOne));
    const bad = open.filter(f => f.status === 'failed').length;
    if (bad) say(`${bad} font${bad > 1 ? 's' : ''} could not be loaded`, 'error');
    else say('Fonts ready', 'ok');
  }

  /* ================= Controls ================= */
  const ctrls = [
    ['size', 'size', v => v, v => `${v} px`, true],
    ['tracking', 'tracking', v => v / 100, v => `${v}%`, true],
    ['weight', 'weight', v => v, v => `${v}`, false],
    ['strength', 'strength', v => v, v => `${v}%`, false],
    ['brush', 'brush', v => v, v => `${v} px`, false]
  ];
  for (const [id, key, conv, fmt, reset] of ctrls) {
    const el = $(id), out = $(id + '-out');
    const upd = () => { S[key] = conv(+el.value); out.textContent = fmt(+el.value); };
    el.addEventListener('input', () => {
      upd();
      if (id === 'strength') $('preview').classList.toggle('distort', S.strength > 0);
      if (id === 'size' || id === 'tracking' || id === 'weight') render();
    });
    upd();
  }
  $('ink').addEventListener('input', e => { S.ink = e.target.value; render(); });
  $('text').addEventListener('input', e => { S.text = e.target.value; render(); });

  /* ================= Rendering ================= */
  const cv = $('preview'), cx = cv.getContext('2d', { willReadFrequently: true });
  const src = document.createElement('canvas'), sx = src.getContext('2d', { willReadFrequently: true });
  const hasLS = 'letterSpacing' in sx;
  let srcData = null, field = null, dirty = null, dpr = 1;

  function resetField() { field = null; dirty = null; }
  // Canvas size follows the text; the distortion is carried over so it stays put.
  function remapField(ow, oh, nw, nh) {
    if (!field) return;
    const nf = new Float32Array(nw * nh * 2), cw = Math.min(ow, nw) * 2;
    for (let y = 0; y < Math.min(oh, nh); y++) nf.set(field.subarray(y * ow * 2, y * ow * 2 + cw), y * nw * 2);
    field = nf;
    if (dirty) {
      dirty = { x0: dirty.x0, y0: dirty.y0, x1: Math.min(dirty.x1, nw - 1), y1: Math.min(dirty.y1, nh - 1) };
      if (dirty.x0 > dirty.x1 || dirty.y0 > dirty.y1) dirty = null;
    }
  }

  function metrics(ln, ls) {
    if (hasLS) { sx.letterSpacing = ls + 'px'; return sx.measureText(ln).width; }
    let w = 0; for (const ch of ln) w += sx.measureText(ch).width + ls; return w;
  }
  function paint(ln, x, y, ls, stroke) {
    if (hasLS) { sx.letterSpacing = ls + 'px'; stroke ? sx.strokeText(ln, x, y) : sx.fillText(ln, x, y); return; }
    for (const ch of ln) { stroke ? sx.strokeText(ch, x, y) : sx.fillText(ch, x, y); x += sx.measureText(ch).width + ls; }
  }

  let raf = 0;
  function render() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

  function draw() {
    const wrap = $('preview-wrap'), stack = stackOf(S.font), f = S.font;
    wrap.style.background = bgFor(S.ink);
    const notice = $('notice');
    if (!stack) {
      cv.style.display = 'none'; notice.hidden = false;
      notice.style.background = 'var(--color-background)';
      $('notice-text').textContent = f.status === 'failed' ? `${f.name} could not be loaded.` : `Loading ${f.name}…`;
      return;
    }
    notice.hidden = true; cv.style.display = 'block';

    const size = S.size, ls = S.tracking * size, pad = size * 0.3, lineH = size * 1.2;
    const lines = shown(f, S.text).split('\n');
    const fontStr = `${size}px ${stack}`;
    sx.font = fontStr;
    const textW = Math.max(0, ...lines.map(l => metrics(l, ls)));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(300, Math.ceil(textW + pad * 2), wrap.clientWidth - 34);
    const H = Math.max(200, Math.ceil(lines.length * lineH + pad * 2));
    const pw = Math.ceil(W * dpr), ph = Math.ceil(H * dpr);
    if (src.width !== pw || src.height !== ph) {
      const ow = src.width, oh = src.height;
      src.width = cv.width = pw; src.height = cv.height = ph;
      remapField(ow, oh, pw, ph);
    }
    cv.style.width = W + 'px'; cv.style.height = H + 'px';

    sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, pw, ph);
    sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sx.font = fontStr; sx.textBaseline = 'alphabetic'; sx.fillStyle = S.ink; sx.strokeStyle = S.ink; sx.lineJoin = 'round';
    const y0 = pad + size * 0.9;
    lines.forEach((ln, i) => paint(ln, pad, y0 + i * lineH, ls, false));

    // Weight: 400 = font as drawn; heavier grows the outline, lighter erodes it.
    const w = S.weight;
    if (w !== 400) {
      const t = w > 400 ? (w - 400) / 500 * 0.07 * size : (400 - w) / 300 * 0.05 * size;
      sx.lineWidth = t;
      if (w < 400) { sx.globalCompositeOperation = 'destination-out'; sx.strokeStyle = '#000'; }
      lines.forEach((ln, i) => paint(ln, pad, y0 + i * lineH, ls, true));
      sx.globalCompositeOperation = 'source-over';
    }
    srcData = sx.getImageData(0, 0, pw, ph);
    present();
  }

  function present() {
    if (!srcData) return;
    if (!field || !dirty) { cx.putImageData(srcData, 0, 0); return; }
    const w = srcData.width, h = srcData.height, sd = srcData.data;
    const out = new ImageData(new Uint8ClampedArray(sd), w, h), od = out.data;
    const [r, g, b] = hexRgb(S.ink);
    const x0 = Math.max(0, dirty.x0), x1 = Math.min(w - 1, dirty.x1), y0 = Math.max(0, dirty.y0), y1 = Math.min(h - 1, dirty.y1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x, fx = field[2 * i], fy = field[2 * i + 1];
        if (Math.abs(fx) < 0.01 && Math.abs(fy) < 0.01) continue;
        const px = x - fx, py = y - fy;
        let a = 0;
        if (px >= 0 && py >= 0 && px < w - 1 && py < h - 1) {
          const ix = px | 0, iy = py | 0, tx = px - ix, ty = py - iy, j = iy * w + ix;
          a = (sd[4 * j + 3] * (1 - tx) + sd[4 * (j + 1) + 3] * tx) * (1 - ty) +
              (sd[4 * (j + w) + 3] * (1 - tx) + sd[4 * (j + w + 1) + 3] * tx) * ty;
        }
        const o = 4 * i; od[o] = r; od[o + 1] = g; od[o + 2] = b; od[o + 3] = a;
      }
    }
    cx.putImageData(out, 0, 0);
  }

  /* ---------- Cursor distortion: drag to push edges ---------- */
  let last = null, pRaf = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; };
  cv.addEventListener('pointerdown', e => {
    if (S.strength <= 0) return;
    cv.setPointerCapture(e.pointerId); last = pos(e);
  });
  cv.addEventListener('pointermove', e => {
    if (!last) return;
    const p = pos(e), dx = p[0] - last[0], dy = p[1] - last[1];
    last = p;
    const w = cv.width, h = cv.height, R = S.brush * dpr, sig2 = 2 * (R / 2) * (R / 2), amp = S.strength / 100;
    if (!field) field = new Float32Array(w * h * 2);
    const bx0 = Math.max(0, Math.floor(p[0] - R)), bx1 = Math.min(w - 1, Math.ceil(p[0] + R));
    const by0 = Math.max(0, Math.floor(p[1] - R)), by1 = Math.min(h - 1, Math.ceil(p[1] + R));
    const lim = R * 1.5;
    for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
      const d2 = (x - p[0]) ** 2 + (y - p[1]) ** 2;
      if (d2 > R * R) continue;
      const k = Math.exp(-d2 / sig2) * amp, i = 2 * (y * w + x);
      field[i] = clamp(field[i] + dx * k, -lim, lim);
      field[i + 1] = clamp(field[i + 1] + dy * k, -lim, lim);
    }
    dirty = dirty ? { x0: Math.min(dirty.x0, bx0), x1: Math.max(dirty.x1, bx1), y0: Math.min(dirty.y0, by0), y1: Math.max(dirty.y1, by1) }
                  : { x0: bx0, x1: bx1, y0: by0, y1: by1 };
    if (!pRaf) pRaf = requestAnimationFrame(() => { pRaf = 0; present(); });
  });
  const endDrag = () => { last = null; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  $('reset-distort').onclick = () => { resetField(); present(); };

  /* ================= Export ================= */
  $('export-png').onclick = () => {
    if (cv.style.display === 'none' || !cv.width) return say('Add this font before exporting', 'error');
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d'); x.fillStyle = bgFor(S.ink); x.fillRect(0, 0, c.width, c.height); x.drawImage(cv, 0, 0);
    c.toBlob(b => {
      if (!b) return say('PNG export failed. Try a smaller size.', 'error');
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${S.font.name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      say('PNG exported', 'ok');
    }, 'image/png');
  };

  /* ================= Init ================= */
  buildList(); updateCredit(); render();
  loadAll();
  window.addEventListener('resize', render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
});
