// Save the dashboard as a PNG: draws the page's own boxes, text and charts onto a canvas.
(function () {
  const SKIP = el => el.matches('.mr-noexport, .mr-tip, input, script, style');
  const clear = c => !c || c === 'transparent' || /rgba?\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);

  function bgOf(el) {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (!clear(c)) return c;
    }
    return '#ffffff';
  }

  function fontOf(cs) {
    return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  }

  function drawBox(ctx, el, cs, o) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = r.left - o.x, y = r.top - o.y, w = r.width, h = r.height;
    const rad = parseFloat(cs.borderTopLeftRadius) || 0;
    const bg = cs.backgroundColor;
    if (!clear(bg)) {
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, rad) : ctx.rect(x, y, w, h); ctx.fill();
    }
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map(s => ({
      s, w: parseFloat(cs[`border${s}Width`]) || 0, c: cs[`border${s}Color`], st: cs[`border${s}Style`]
    }));
    const vis = sides.filter(b => b.w > 0 && b.st !== 'none' && b.st !== 'hidden' && !clear(b.c));
    if (!vis.length) return;
    if (vis.length === 4 && vis.every(b => b.w === vis[0].w && b.c === vis[0].c)) {
      const bw = vis[0].w;
      ctx.strokeStyle = vis[0].c; ctx.lineWidth = bw;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x + bw / 2, y + bw / 2, w - bw, h - bw, Math.max(0, rad - bw / 2)) : ctx.rect(x + bw / 2, y + bw / 2, w - bw, h - bw);
      ctx.stroke();
      return;
    }
    vis.forEach(b => {
      ctx.fillStyle = b.c;
      if (b.s === 'Top') ctx.fillRect(x, y, w, b.w);
      if (b.s === 'Bottom') ctx.fillRect(x, y + h - b.w, w, b.w);
      if (b.s === 'Left') ctx.fillRect(x, y, b.w, h);
      if (b.s === 'Right') ctx.fillRect(x + w - b.w, y, b.w, h);
    });
  }

  // draw a run of text at the rect of its first character, one call per visual line
  function drawLine(ctx, str, rect, cs, o) {
    str = str.replace(/\s+/g, ' ');
    if (!str.trim()) return;
    ctx.font = fontOf(cs);
    const m = ctx.measureText('กAg');
    const asc = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8;
    const desc = m.fontBoundingBoxDescent || parseFloat(cs.fontSize) * 0.2;
    const y = rect.top - o.y + (rect.height - (asc + desc)) / 2 + asc;
    ctx.fillText(str, rect.left - o.x, y);
  }

  function drawTextNode(ctx, node, cs, o) {
    const t = node.textContent;
    if (!t || !t.trim() || clear(cs.color) || parseFloat(cs.opacity) === 0) return;
    ctx.fillStyle = cs.color;
    const range = document.createRange();
    let line = null;
    for (let i = 0; i < t.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1);
      const rs = range.getClientRects();
      const r = rs.length ? rs[0] : null;
      if (r && r.width > 0 && (!line || Math.abs(r.top - line.rect.top) > r.height / 2)) {
        if (line) drawLine(ctx, line.str, line.rect, cs, o);
        line = { rect: r, str: t[i] };
      } else if (line) line.str += t[i];
    }
    if (line) drawLine(ctx, line.str, line.rect, cs, o);
  }

  const SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility'];

  async function drawSvg(ctx, svg, o) {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el), d = dst[i];
      SVG_PROPS.forEach(p => d.style.setProperty(p, cs.getPropertyValue(p)));
      if (el.tagName.toLowerCase() === 'text') d.style.setProperty('display', 'none'); // text is drawn with the page's fonts below
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', r.width); clone.setAttribute('height', r.height);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.drawImage(img, r.left - o.x, r.top - o.y, r.width, r.height);
    svg.querySelectorAll('text').forEach(t => {
      const cs = getComputedStyle(t);
      if (cs.display === 'none' || cs.visibility === 'hidden' || t.getAttribute('display') === 'none') return;
      const tr = t.getBoundingClientRect();
      if (!tr.width) return;
      ctx.fillStyle = cs.fill && cs.fill !== 'none' ? cs.fill : cs.color;
      drawLine(ctx, t.textContent, tr, cs, o);
    });
  }

  async function walk(ctx, el, o) {
    if (SKIP(el)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (el.tagName.toLowerCase() === 'svg') return drawSvg(ctx, el, o);
    drawBox(ctx, el, cs, o);
    for (const ch of el.childNodes) {
      if (ch.nodeType === 3) drawTextNode(ctx, ch, cs, o);
      else if (ch.nodeType === 1) await walk(ctx, ch, o);
    }
  }

  async function renderPng(root, { pad = 32 } = {}) {
    await document.fonts.ready;
    const rr = root.getBoundingClientRect();
    const W = Math.ceil(rr.width + pad * 2), H = Math.ceil(rr.height + pad * 2);
    const scale = Math.max(1, Math.min(2, Math.sqrt(16e6 / (W * H))));
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(W * scale); canvas.height = Math.floor(H * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = bgOf(root); ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    await walk(ctx, root, { x: rr.left - pad, y: rr.top - pad });
    return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png'));
  }

  const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // mode: 'summary' leaves out the name lists, 'full' keeps them
  window.mrExportImage = async function (mode) {
    const page = document.querySelector('.mr');
    page.classList.add('mr-exporting');
    if (mode === 'summary') page.classList.add('mr-exporting-summary');
    try {
      await nextFrame();
      return await renderPng(page);
    } finally {
      page.classList.remove('mr-exporting', 'mr-exporting-summary');
    }
  };

  let downloadsP = null;
  const getDownloads = () => {
    if (!downloadsP) downloadsP = (window.claude && typeof window.claude.use === 'function')
      ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
    return downloadsP;
  };

  async function onClick(mode, btn, status) {
    const say = t => { status.textContent = t; };
    btn.disabled = true; say('กำลังสร้างภาพ…');
    try {
      const blob = await window.mrExportImage(mode);
      const name = mode === 'summary' ? 'รายงานมิไรบุ-2026-รวมภาค11-สรุป.png' : 'รายงานมิไรบุ-2026-รวมภาค11-ฉบับเต็ม.png';
      const dl = await getDownloads();
      if (dl) {
        try { await dl.save({ filename: name, data: blob }); say('บันทึกแล้ว'); }
        catch (e) { say(e && e.code === 'declined' ? '' : 'บันทึกภาพในหน้านี้ไม่ได้'); }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 30000);
        say('');
      }
    } catch (e) {
      console.error(e); say('สร้างภาพไม่สำเร็จ');
    } finally {
      btn.disabled = false;
      setTimeout(() => { if (status.textContent === 'บันทึกแล้ว') say(''); }, 4000);
    }
  }

  const status = document.getElementById('mr-export-status');
  document.querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', () => onClick(b.dataset.export, b, status)));
  getDownloads();
})();
