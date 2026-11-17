/* SRM 課程筆記：互動圖（不依賴任何外部函式庫） */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = { navy: '#1c3858', blue: '#2b6cb0', red: '#b4232c', gold: '#b88938', green: '#1f7a4a', gray: '#8a94a6',
    light: '#dce1e8', ink: '#172033', purple: '#6b46c1', teal: '#0f766e' };
  const PAL = [C.blue, C.red, C.gold, C.green, C.purple];

  // ---------- 小工具 ----------
  const E = (tag, a = {}, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const H = (tag, a = {}, p, html) => { const e = document.createElement(tag); for (const k in a) e.setAttribute(k, a[k]); if (html != null) e.innerHTML = html; if (p) p.appendChild(e); return e; };
  const f2 = (v, d = 2) => (Math.abs(v) >= 1e5 ? v.toExponential(2) : (+v).toFixed(d));
  const sum = a => a.reduce((s, v) => s + v, 0);
  const mean = a => sum(a) / a.length;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function normal(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
  const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  function tq975(df) { // t 分配 97.5% 分位數（Cornish–Fisher 近似，df≥2 誤差 <0.01）
    const z = 1.959964, z3 = z ** 3, z5 = z ** 5, z7 = z ** 7;
    return z + (z3 + z) / (4 * df) + (5 * z5 + 16 * z3 + 3 * z) / (96 * df * df) + (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df ** 3); }
  function ticks(a, b, n = 5) { const span = b - a, step0 = span / n, mag = 10 ** Math.floor(Math.log10(step0));
    const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n + 0.5) || mag * 10;
    const out = []; for (let v = Math.ceil(a / st - 1e-9) * st; v <= b + 1e-9; v += st) out.push(+v.toFixed(10)); return out; }
  function tickFmt(v) { return Math.abs(v) >= 1000 ? v.toFixed(0) : +v.toFixed(3) + ''; }

  // ---------- 座標圖 ----------
  class Plot {
    constructor(parent, o) {
      this.o = Object.assign({ w: 520, h: 300, m: { l: 46, r: 14, t: 12, b: 38 }, xlog: false, xlab: '', ylab: '' }, o);
      const { w, h } = this.o;
      this.svg = E('svg', { viewBox: `0 0 ${w} ${h}`, class: 'w-svg', role: 'img' }, parent);
      if (h / w > 0.75) this.svg.style.maxWidth = '470px';
      this.bg = E('g', {}, this.svg); this.g = E('g', {}, this.svg); this.top = E('g', {}, this.svg);
      this.setRange(this.o.xr, this.o.yr);
    }
    setRange(xr, yr) {
      this.xr = xr; this.yr = yr; const { w, h, m } = this.o;
      const L = this.o.xlog ? Math.log10 : (v => v);
      this.sx = x => m.l + (L(x) - L(xr[0])) / (L(xr[1]) - L(xr[0])) * (w - m.l - m.r);
      this.sy = y => h - m.b - (y - yr[0]) / (yr[1] - yr[0]) * (h - m.t - m.b);
      this.ix = px => { const t = (px - m.l) / (w - m.l - m.r); return this.o.xlog ? 10 ** (L(xr[0]) + t * (L(xr[1]) - L(xr[0]))) : xr[0] + t * (xr[1] - xr[0]); };
      this.iy = py => yr[0] + (h - m.b - py) / (h - m.t - m.b) * (yr[1] - yr[0]);
      this.drawAxes();
    }
    drawAxes() {
      const { w, h, m } = this.o, bg = this.bg; bg.innerHTML = '';
      E('rect', { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: '#fff', stroke: C.light }, bg);
      const xt = this.o.xlog ? [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].filter(v => v >= this.xr[0] && v <= this.xr[1]) : ticks(...this.xr, this.o.xn || 6);
      for (const v of xt) { const x = this.sx(v); E('line', { x1: x, x2: x, y1: m.t, y2: h - m.b, stroke: '#eef1f5' }, bg);
        E('text', { x, y: h - m.b + 15, 'text-anchor': 'middle', class: 'w-tick' }, bg).textContent = tickFmt(v); }
      for (const v of ticks(...this.yr, this.o.yn || 5)) { const y = this.sy(v); E('line', { x1: m.l, x2: w - m.r, y1: y, y2: y, stroke: '#eef1f5' }, bg);
        E('text', { x: m.l - 6, y: y + 4, 'text-anchor': 'end', class: 'w-tick' }, bg).textContent = tickFmt(v); }
      if (this.o.xlab) E('text', { x: (m.l + w - m.r) / 2, y: h - 4, 'text-anchor': 'middle', class: 'w-lab' }, bg).textContent = this.o.xlab;
      if (this.o.ylab) E('text', { x: 12, y: (m.t + h - m.b) / 2, 'text-anchor': 'middle', class: 'w-lab', transform: `rotate(-90 12 ${(m.t + h - m.b) / 2})` }, bg).textContent = this.o.ylab;
    }
    clear() { this.g.innerHTML = ''; }
    clip(y) { return Math.max(this.yr[0] - (this.yr[1] - this.yr[0]) * 0.05, Math.min(this.yr[1] + (this.yr[1] - this.yr[0]) * 0.05, y)); }
    path(xs, ys, a = {}, layer) { let d = ''; for (let i = 0; i < xs.length; i++) { if (ys[i] == null || !isFinite(ys[i])) continue; d += (d ? 'L' : 'M') + this.sx(xs[i]).toFixed(1) + ',' + this.sy(this.clip(ys[i])).toFixed(1); }
      return E('path', Object.assign({ d, fill: 'none', stroke: C.navy, 'stroke-width': 2 }, a), layer || this.g); }
    step(xs, ys, a) { const X = [], Y = []; for (let i = 0; i < xs.length; i++) { if (i) { X.push(xs[i]); Y.push(ys[i - 1]); } X.push(xs[i]); Y.push(ys[i]); } return this.path(X, Y, a); }
    dot(x, y, r = 3.5, a = {}, layer) { return E('circle', Object.assign({ cx: this.sx(x), cy: this.sy(y), r, fill: C.gray }, a), layer || this.g); }
    line(x1, y1, x2, y2, a = {}, layer) { return E('line', Object.assign({ x1: this.sx(x1), y1: this.sy(y1), x2: this.sx(x2), y2: this.sy(y2), stroke: C.gray }, a), layer || this.g); }
    text(x, y, s, a = {}, layer) { const t = E('text', Object.assign({ x: this.sx(x), y: this.sy(y), class: 'w-txt' }, a), layer || this.g); t.textContent = s; return t; }
    area(xs, lo, hi, a = {}) { let d = ''; xs.forEach((x, i) => d += (i ? 'L' : 'M') + this.sx(x).toFixed(1) + ',' + this.sy(this.clip(hi[i])).toFixed(1));
      for (let i = xs.length - 1; i >= 0; i--) d += 'L' + this.sx(xs[i]).toFixed(1) + ',' + this.sy(this.clip(lo[i])).toFixed(1);
      return E('path', Object.assign({ d: d + 'Z', fill: C.blue, 'fill-opacity': 0.12, stroke: 'none' }, a), this.g); }
    vline(x, a = {}) { return this.line(x, this.yr[0], x, this.yr[1], Object.assign({ stroke: C.gold, 'stroke-dasharray': '4 3', 'stroke-width': 1.5 }, a)); }
    point(ev) { const p = this.svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const q = p.matrixTransform(this.svg.getScreenCTM().inverse()); return { x: this.ix(q.x), y: this.iy(q.y) }; }
    legend(items, x0 = null, y0 = null) { const { w, m } = this.o; let y = (y0 ?? m.t + 14); const x = x0 ?? (w - m.r - 8);
      for (const [lab, col, dash] of items) { E('line', { x1: x - 116, x2: x - 96, y1: y - 4, y2: y - 4, stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': dash || '' }, this.top);
        E('text', { x: x - 90, y, class: 'w-leg' }, this.top).textContent = lab; y += 16; } }
  }
  function drag(plot, el, onMove) {
    el.style.cursor = 'grab'; el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => { e.preventDefault(); const id = e.pointerId; plot.svg.style.cursor = 'grabbing';
      let raf = 0, last = null;
      const mv = ev => { if (ev.pointerId !== id) return; ev.preventDefault(); last = ev; if (!raf) raf = requestAnimationFrame(() => { raf = 0; onMove(plot.point(last)); }); };
      const up = ev => { if (ev.pointerId !== id) return; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); plot.svg.style.cursor = ''; };
      window.addEventListener('pointermove', mv, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); });
  }

  // ---------- 控制項 ----------
  function slider(box, { label, min, max, step, value, fmt = v => v }, on) {
    const w = H('label', { class: 'w-sl' }, box); const t = H('span', { class: 'w-sl-t' }, w);
    const inp = H('input', { type: 'range', min, max, step, value }, w);
    const show = () => t.innerHTML = `${label}<b>${fmt(+inp.value)}</b>`; show();
    inp.addEventListener('input', () => { show(); on(+inp.value); });
    return { get v() { return +inp.value; }, set(v) { inp.value = v; show(); }, el: inp };
  }
  function choice(box, label, opts, value, on) {
    const w = H('div', { class: 'w-ch' }, box); if (label) H('span', { class: 'w-sl-t' }, w, label);
    const bs = opts.map(([v, t]) => { const b = H('button', { type: 'button', class: v === value ? 'on' : '' }, w, t);
      b.addEventListener('click', () => { bs.forEach(x => x.classList.remove('on')); b.classList.add('on'); on(v); }); return b; });
    return w;
  }
  function button(box, text, on) { const b = H('button', { type: 'button', class: 'w-btn' }, box, text); b.addEventListener('click', on); return b; }
  function frame(el, cols = 1) { const plots = H('div', { class: 'w-plots' + (cols > 1 ? ' two' : '') }, el); const ctl = H('div', { class: 'w-ctl' }, el); const out = H('div', { class: 'w-out' }, el); return { plots, ctl, out }; }

  // ---------- 線性迴歸的小計算 ----------
  function ols(x, y) { const n = x.length, mx = mean(x), my = mean(y); let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); }
    const b1 = sxy / sxx, b0 = my - b1 * mx; const e = x.map((v, i) => y[i] - b0 - b1 * v);
    return { b0, b1, mx, my, sxx, e, sse: sum(e.map(v => v * v)), n }; }

  const W = {};

  // ===== 第 1 章：偏差與變異數 =====
  W.bvflex = (el) => {
    const D = window.WD.bvflex, { plots, ctl, out } = frame(el, 2);
    const p1 = new Plot(plots, { xr: [0, 1], yr: [-1.6, 2.2], xlab: 'x', ylab: 'y' });
    const p2 = new Plot(plots, { xr: [0, 12], yr: [0, 0.8], xlab: '多項式次數（彈性）', ylab: '誤差' });
    p2.path(D.degs, D.train, { stroke: C.gray, 'stroke-dasharray': '5 3' }, p2.bg);
    p2.path(D.degs, D.test, { stroke: C.red, 'stroke-width': 2.5 }, p2.bg);
    p2.path(D.degs, D.bias2, { stroke: C.blue }, p2.bg); p2.path(D.degs, D.var, { stroke: C.gold }, p2.bg);
    p2.line(0, D.noise, 12, D.noise, { stroke: C.green, 'stroke-dasharray': '2 3' }, p2.bg);
    p2.legend([['測試 MSE', C.red], ['訓練 MSE', C.gray, '5 3'], ['偏差²', C.blue], ['變異數', C.gold], ['不可降低', C.green, '2 3']]);
    const draw = d => {
      p1.clear(); p1.path(D.grid, D.truth, { stroke: C.green, 'stroke-dasharray': '6 4' });
      D.x.forEach((x, i) => p1.dot(x, D.y[i], 3.5, { fill: C.gray }));
      p1.path(D.grid, D.curves[d], { stroke: C.red, 'stroke-width': 2.5 });
      p2.clear(); p2.vline(d); p2.dot(d, D.test[d], 5, { fill: C.red }); p2.dot(d, D.train[d], 4, { fill: C.gray });
      const best = D.test.indexOf(Math.min(...D.test));
      out.innerHTML = `次數 <b>${d}</b>：訓練 MSE ${f2(D.train[d], 3)}，期望測試 MSE <b>${f2(D.test[d], 3)}</b> ＝ 偏差² ${f2(D.bias2[d], 3)} ＋ 變異數 ${f2(D.var[d], 3)} ＋ 不可降低 ${f2(D.noise, 3)}。`
        + `<br>測試 MSE 在 ${best} 次最低；${d < best ? '現在偏差太大（太僵硬）。' : d > best ? '現在變異數太大（在追雜訊）。' : '這裡偏差與變異數取得平衡。'}`;
    };
    slider(ctl, { label: '多項式次數 ', min: 0, max: 12, step: 1, value: 1 }, draw); draw(1);
  };

  // ===== 第 2 章：拖曳資料點的最小平方 =====
  W.olsdrag = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 600, h: 330, xr: [0, 10], yr: [0, 10], xlab: 'x', ylab: 'y' });
    const P = [[1, 2.2], [2.5, 3.1], [4, 5.4], [5.5, 4.6], [7, 7.3], [8.6, 7.9]];
    let user = null;
    const draw = () => {
      const x = P.map(q => q[0]), y = P.map(q => q[1]), r = ols(x, y); p.clear();
      const L = user || { b0: r.b0, b1: r.b1 };
      const ex = P.map(([a, b]) => b - L.b0 - L.b1 * a);
      P.forEach(([a, b], i) => { const e = ex[i], px = Math.abs(p.sy(b) - p.sy(b - e));
        E('rect', { x: e > 0 ? p.sx(a) : p.sx(a) - px, y: Math.min(p.sy(b), p.sy(b - e)), width: px, height: px, fill: C.red, 'fill-opacity': 0.12, stroke: C.red, 'stroke-opacity': 0.4 }, p.g);
        p.line(a, b, a, b - e, { stroke: C.red, 'stroke-width': 1.5 }); });
      p.path([0, 10], [r.b0, r.b0 + 10 * r.b1], { stroke: C.navy, 'stroke-width': 2.5 });
      if (user) p.path([0, 10], [user.b0, user.b0 + 10 * user.b1], { stroke: C.gold, 'stroke-width': 2.5, 'stroke-dasharray': '7 4' });
      p.dot(r.mx, r.my, 5, { fill: C.gold, stroke: '#fff' });
      P.forEach((q, i) => { const hit = p.dot(q[0], q[1], 14, { fill: 'transparent' }); p.dot(q[0], q[1], 6, { fill: C.blue, stroke: '#fff', 'stroke-width': 1.5, 'pointer-events': 'none' });
        drag(p, hit, pt => { P[i] = [Math.max(0.2, Math.min(9.8, pt.x)), Math.max(0.2, Math.min(9.8, pt.y))]; draw(); }); });
      const sseU = sum(ex.map(v => v * v));
      out.innerHTML = `最小平方線（深藍）：ŷ ＝ ${f2(r.b0)} ＋ ${f2(r.b1)}x，SSE ＝ <b>${f2(r.sse)}</b>；一定通過 (x̄, ȳ)（金點）。`
        + (user ? `<br>你的直線（金色虛線）：SSE ＝ <b>${f2(sseU)}</b>${sseU > r.sse + 1e-6 ? `，比最小平方多 ${f2(sseU - r.sse)}。不管怎麼調，都贏不了最小平方。` : '，已經和最小平方一樣。'}` : '<br>紅色方塊的面積就是殘差平方；最小平方線讓這些面積的總和最小。拖動藍點看看線怎麼跟著變。');
    };
    const sw = H('div', { class: 'w-ch' }, ctl); const tb = button(sw, '自己調一條線', () => { if (user) { user = null; tb.textContent = '自己調一條線'; s0.el.parentNode.style.display = s1.el.parentNode.style.display = 'none'; } else { const r = ols(P.map(q => q[0]), P.map(q => q[1])); user = { b0: +(r.b0 + 1).toFixed(1), b1: +(r.b1 - 0.2).toFixed(2) }; s0.set(user.b0); s1.set(user.b1); tb.textContent = '收起我的直線'; s0.el.parentNode.style.display = s1.el.parentNode.style.display = ''; } draw(); });
    const s0 = slider(ctl, { label: '截距 ', min: -3, max: 8, step: 0.1, value: 1, fmt: v => v.toFixed(1) }, v => { if (user) { user.b0 = v; draw(); } });
    const s1 = slider(ctl, { label: '斜率 ', min: -0.5, max: 2, step: 0.01, value: 0.8, fmt: v => v.toFixed(2) }, v => { if (user) { user.b1 = v; draw(); } });
    s0.el.parentNode.style.display = s1.el.parentNode.style.display = 'none'; draw();
  };

  // ===== 第 9 章：信賴區間與預測區間 =====
  W.bands = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 600, h: 320, xr: [0, 16], yr: [-4, 22], xlab: 'x', ylab: 'y' });
    let n = 20, sig = 2, xs = 13, data;
    const gen = () => { const r = rng(7 + n); const x = [], y = []; for (let i = 0; i < n; i++) { const v = 2 + 8 * r(); x.push(v); y.push(1 + 1.2 * v + sig * normal(r)); } data = { x, y }; };
    const draw = () => {
      const r = ols(data.x, data.y), s = Math.sqrt(r.sse / (n - 2)), t = tq975(n - 2); p.clear();
      const G = Array.from({ length: 81 }, (_, i) => i * 0.2), fit = G.map(g => r.b0 + r.b1 * g);
      const hc = G.map(g => 1 / n + (g - r.mx) ** 2 / r.sxx);
      p.area(G, fit.map((f, i) => f - t * s * Math.sqrt(1 + hc[i])), fit.map((f, i) => f + t * s * Math.sqrt(1 + hc[i])), { 'fill-opacity': 0.1 });
      p.area(G, fit.map((f, i) => f - t * s * Math.sqrt(hc[i])), fit.map((f, i) => f + t * s * Math.sqrt(hc[i])), { 'fill-opacity': 0.3 });
      p.path(G, fit, { stroke: C.navy });
      data.x.forEach((x, i) => p.dot(x, data.y[i], 3, { fill: C.gray }));
      p.line(r.mx, -4, r.mx, 22, { stroke: C.gray, 'stroke-dasharray': '2 3' }); p.text(r.mx + 0.15, -3, 'x̄', { class: 'w-tick' });
      const h = 1 / n + (xs - r.mx) ** 2 / r.sxx, yh = r.b0 + r.b1 * xs; p.vline(xs);
      p.line(xs, yh - t * s * Math.sqrt(1 + h), xs, yh + t * s * Math.sqrt(1 + h), { stroke: C.blue, 'stroke-width': 5, 'stroke-opacity': 0.5 });
      p.line(xs, yh - t * s * Math.sqrt(h), xs, yh + t * s * Math.sqrt(h), { stroke: C.red, 'stroke-width': 5 });
      const ci = 2 * t * s * Math.sqrt(h), pi = 2 * t * s * Math.sqrt(1 + h);
      out.innerHTML = `x* ＝ ${f2(xs, 1)}，槓桿 h* ＝ 1/n ＋ (x*−x̄)²/S<sub>xx</sub> ＝ ${f2(h, 3)}，s ＝ ${f2(s)}，t ＝ ${f2(t, 3)}。`
        + `<br><span style="color:${C.red}">信賴區間（平均反應）寬 ${f2(ci)}</span> ＝ 2t·s·√h*；<span style="color:${C.blue}">預測區間（新觀察值）寬 ${f2(pi)}</span> ＝ 2t·s·√(1＋h*)。`
        + `<br>把 n 拉大：信賴區間會縮到 0，預測區間停在約 2×1.96σ ＝ ${f2(3.92 * sig)}。把 x* 拉離 x̄：兩個都變寬。`;
    };
    slider(ctl, { label: '樣本數 n ', min: 5, max: 200, step: 1, value: n }, v => { n = v; gen(); draw(); });
    slider(ctl, { label: '雜訊 σ ', min: 0.5, max: 4, step: 0.1, value: sig, fmt: v => v.toFixed(1) }, v => { sig = v; gen(); draw(); });
    slider(ctl, { label: '預測點 x* ', min: 0, max: 16, step: 0.1, value: xs, fmt: v => v.toFixed(1) }, v => { xs = v; draw(); });
    gen(); draw();
  };

  // ===== 第 5 章：槓桿與 Cook 距離 =====
  W.lev = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 600, h: 320, xr: [0, 20], yr: [0, 16], xlab: 'x', ylab: 'y' });
    const r0 = rng(21), base = Array.from({ length: 15 }, (_, i) => { const x = 1 + i * 0.6 + r0() * 0.4; return [x, 2 + 0.7 * x + 0.8 * normal(r0)]; });
    let red = [17, 6];
    const draw = () => {
      p.clear(); const all = base.concat([red]), x = all.map(q => q[0]), y = all.map(q => q[1]);
      const r = ols(x, y), r1 = ols(base.map(q => q[0]), base.map(q => q[1])), n = all.length, k1 = 2;
      const s2 = r.sse / (n - 2), h = 1 / n + (red[0] - r.mx) ** 2 / r.sxx, e = r.e[n - 1], rs = e / Math.sqrt(s2 * (1 - h)), D = rs * rs / k1 * h / (1 - h);
      p.path([0, 20], [r1.b0, r1.b0 + 20 * r1.b1], { stroke: C.gray, 'stroke-dasharray': '6 4' });
      p.path([0, 20], [r.b0, r.b0 + 20 * r.b1], { stroke: C.red, 'stroke-width': 2.5 });
      base.forEach(q => p.dot(q[0], q[1], 4, { fill: C.blue }));
      const hit = p.dot(red[0], red[1], 15, { fill: 'transparent' }); p.dot(red[0], red[1], 7, { fill: C.red, stroke: '#fff', 'stroke-width': 1.5, 'pointer-events': 'none' });
      drag(p, hit, pt => { red = [Math.max(0.3, Math.min(19.7, pt.x)), Math.max(0.3, Math.min(15.7, pt.y))]; draw(); });
      const tag = D > 1 ? `<b style="color:${C.red}">超過 1，是強影響點</b>` : D > 4 / n ? '偏大，值得檢查' : '影響不大';
      out.innerHTML = `紅點：槓桿 h ＝ <b>${f2(h, 3)}</b>（平均 ${f2(2 / n, 3)}），標準化殘差 r ＝ <b>${f2(rs)}</b>，Cook 距離 D ＝ r²/(k+1) · h/(1−h) ＝ <b>${f2(D, 3)}</b>，${tag}。`
        + `<br>斜率：不含紅點 ${f2(r1.b1, 3)}（灰虛線）→ 含紅點 ${f2(r.b1, 3)}（紅線）。試試把紅點拖到右邊遠處、再上下移動：槓桿只看水平位置，影響力要兩者都大。`;
    };
    draw();
  };

  // ===== 第 8 章：ridge 與 lasso 的預算區域 =====
  W.shrink = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 460, h: 400, xr: [-1.2, 3.2], yr: [-1.2, 2.8], xlab: 'b₁', ylab: 'b₂', m: { l: 40, r: 12, t: 12, b: 36 } });
    const A = [[1, 0.65], [0.65, 1]], bh = [2.3, 0.9]; let mode = 'lasso', s = 1.4;
    const Q = b => { const d = [b[0] - bh[0], b[1] - bh[1]]; return d[0] * (A[0][0] * d[0] + A[0][1] * d[1]) + d[1] * (A[1][0] * d[0] + A[1][1] * d[1]); };
    const Ab = [A[0][0] * bh[0] + A[0][1] * bh[1], A[1][0] * bh[0] + A[1][1] * bh[1]];
    const ridge = lam => { const a = A[0][0] + lam, b = A[0][1], c = A[1][0], d = A[1][1] + lam, det = a * d - b * c; return [(d * Ab[0] - b * Ab[1]) / det, (-c * Ab[0] + a * Ab[1]) / det]; };
    const lasso = lam => { let b = [0, 0]; for (let it = 0; it < 200; it++) for (let j = 0; j < 2; j++) { const o = 1 - j, z = Ab[j] - A[j][o] * b[o];
      b[j] = Math.sign(z) * Math.max(Math.abs(z) - lam / 2, 0) / A[j][j]; } return b; };
    const norm = b => mode === 'ridge' ? b[0] ** 2 + b[1] ** 2 : Math.abs(b[0]) + Math.abs(b[1]);
    const solve = () => { if (norm(bh) <= s) return { b: bh.slice(), lam: 0 }; let lo = 0, hi = 1e4;
      for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2, b = mode === 'ridge' ? ridge(mid) : lasso(mid); if (norm(b) > s) lo = mid; else hi = mid; }
      return { b: mode === 'ridge' ? ridge(hi) : lasso(hi), lam: hi }; };
    // A 的特徵分解（2×2 對稱）
    const tr = A[0][0] + A[1][1], dt = A[0][0] * A[1][1] - A[0][1] ** 2, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - dt), l2 = tr / 2 - Math.sqrt(tr * tr / 4 - dt);
    const v1 = [A[0][1], l1 - A[0][0]], nv = Math.hypot(...v1); v1[0] /= nv; v1[1] /= nv; const v2 = [-v1[1], v1[0]];
    const ell = k => { const X = [], Y = []; for (let i = 0; i <= 120; i++) { const t = i / 120 * 2 * Math.PI, a = Math.sqrt(k / l1) * Math.cos(t), b = Math.sqrt(k / l2) * Math.sin(t);
      X.push(bh[0] + a * v1[0] + b * v2[0]); Y.push(bh[1] + a * v1[1] + b * v2[1]); } return [X, Y]; };
    const draw = () => {
      p.clear(); p.line(-1.2, 0, 3.2, 0, { stroke: '#aab3c2' }); p.line(0, -1.2, 0, 2.8, { stroke: '#aab3c2' });
      const { b, lam } = solve(), k = Q(b);
      for (const kk of [0.05, 0.2, 0.5, 1, 1.8, 3]) { if (Math.abs(kk - k) < 0.02) continue; const [X, Y] = ell(kk); p.path(X, Y, { stroke: '#c7cfdb', 'stroke-width': 1 }); }
      if (mode === 'ridge') { const r = Math.sqrt(s); E('circle', { cx: p.sx(0), cy: p.sy(0), r: Math.abs(p.sx(r) - p.sx(0)), fill: C.blue, 'fill-opacity': 0.15, stroke: C.blue, 'stroke-width': 2 }, p.g); }
      else p.path([s, 0, -s, 0, s], [0, s, 0, -s, 0], { fill: C.blue, 'fill-opacity': 0.15, stroke: C.blue });
      if (k > 1e-6) { const [X, Y] = ell(k); p.path(X, Y, { stroke: C.navy, 'stroke-width': 2 }); }
      p.dot(bh[0], bh[1], 5, { fill: C.red }); p.text(bh[0] + 0.07, bh[1] + 0.1, '最小平方', { fill: C.red });
      p.dot(b[0], b[1], 6, { fill: C.gold, stroke: '#fff', 'stroke-width': 1.5 });
      const zero = Math.abs(b[0]) < 1e-6 || Math.abs(b[1]) < 1e-6;
      out.innerHTML = `${mode === 'ridge' ? 'Ridge：b₁²＋b₂² ≤ s（圓）' : 'Lasso：|b₁|＋|b₂| ≤ s（菱形）'}，預算 s ＝ ${f2(s)}，對應 λ ≈ ${lam ? f2(lam, 3) : '0（預算夠大，就是最小平方）'}。`
        + `<br>解（金點）：b₁ ＝ <b>${f2(b[0], 3)}</b>，b₂ ＝ <b>${f2(b[1], 3)}</b>。${zero && mode === 'lasso' ? '<b style="color:#b4232c">橢圓先碰到菱形的角，有一個係數剛好是 0：lasso 做了變數選擇。</b>' : mode === 'ridge' ? '圓沒有角，兩個係數都縮小但都不是 0。' : '預算還夠大，碰到的是菱形的邊，兩個係數都不是 0。'}`
        + `<br>黑色橢圓是 RSS 的等高線：在預算區域內 RSS 最小的點，就是等高線從紅點往外擴大、第一次碰到區域的位置。`;
    };
    choice(ctl, '懲罰：', [['lasso', 'Lasso'], ['ridge', 'Ridge']], mode, v => { mode = v; sl.el.max = v === 'ridge' ? 6.5 : 3.4; if (s > +sl.el.max) { s = +sl.el.max; sl.set(s); } draw(); });
    const sl = slider(ctl, { label: '預算 s ', min: 0.05, max: 3.4, step: 0.01, value: s, fmt: v => v.toFixed(2) }, v => { s = v; draw(); });
    draw();
  };

  // ===== 第 12 章：二元反應的三種連結 =====
  W.logit = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 600, h: 300, xr: [-10, 10], yr: [0, 1], xlab: 'x', ylab: 'π ＝ Pr(Y＝1)' });
    let b0 = -1, b1 = 0.6, x0 = 2, link = 'logit';
    const F = { logit: e => 1 / (1 + Math.exp(-e)), probit: Phi, cloglog: e => 1 - Math.exp(-Math.exp(e)) };
    const dF = { logit: e => { const q = F.logit(e); return q * (1 - q); }, probit: phi, cloglog: e => Math.exp(e - Math.exp(e)) };
    const draw = () => {
      p.clear(); const X = Array.from({ length: 201 }, (_, i) => -10 + i * 0.1);
      for (const [k, col] of [['logit', C.navy], ['probit', C.green], ['cloglog', C.gold]]) if (k !== link) p.path(X, X.map(x => F[k](b0 + b1 * x)), { stroke: col, 'stroke-width': 1, 'stroke-opacity': 0.45 });
      p.path(X, X.map(x => F[link](b0 + b1 * x)), { stroke: C.red, 'stroke-width': 2.5 });
      p.line(-10, 0.5, 10, 0.5, { stroke: '#c7cfdb', 'stroke-dasharray': '3 3' });
      const e = b0 + b1 * x0, pi = F[link](e), sl = b1 * dF[link](e);
      p.line(x0 - 2, pi - 2 * sl, x0 + 2, pi + 2 * sl, { stroke: C.gold, 'stroke-width': 2 }); p.dot(x0, pi, 5, { fill: C.red });
      out.innerHTML = `η ＝ β₀＋β₁x ＝ ${f2(e)}；π ＝ <b>${f2(pi, 4)}</b>，勝算 π/(1−π) ＝ <b>${f2(pi / (1 - pi), 3)}</b>${link === 'logit' ? `（logit 下就是 e^η ＝ ${f2(Math.exp(e), 3)}）` : ''}。`
        + `<br>x 加 1 時：${link === 'logit' ? `勝算永遠乘上 e^β₁ ＝ <b>${f2(Math.exp(b1), 3)}</b>，` : ''}機率的變化率（金色切線斜率）＝ β₁·dπ/dη ＝ <b>${f2(sl, 4)}</b>`
        + `${link === 'logit' ? `，最大不超過 β₁/4 ＝ ${f2(b1 / 4, 3)}（π＝0.5 時）` : ''}。淡色線是另外兩種連結用同一個 η 的結果。`;
    };
    choice(ctl, '連結：', [['logit', 'logit'], ['probit', 'probit'], ['cloglog', '互補 log-log']], link, v => { link = v; draw(); });
    slider(ctl, { label: '截距 β₀ ', min: -6, max: 6, step: 0.1, value: b0, fmt: v => v.toFixed(1) }, v => { b0 = v; draw(); });
    slider(ctl, { label: '斜率 β₁ ', min: -2, max: 2, step: 0.05, value: b1, fmt: v => v.toFixed(2) }, v => { b1 = v; draw(); });
    slider(ctl, { label: '看哪一點 x ', min: -10, max: 10, step: 0.1, value: x0, fmt: v => v.toFixed(1) }, v => { x0 = v; draw(); });
    draw();
  };

  // ===== 第 13 章：零膨脹與門檻 =====
  W.zip = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 600, h: 290, xr: [-0.6, 10.6], yr: [0, 0.8], xlab: '次數 y', ylab: '機率', xn: 10 });
    let mu = 2, w0 = 0.3, mode = 'zip';
    const pois = (k, m) => { let v = Math.exp(-m); for (let i = 1; i <= k; i++) v *= m / i; return v; };
    const draw = () => {
      p.clear(); const P = [], M = [];
      const p0 = pois(0, mu), kk = mode === 'zip' ? 1 - w0 : (1 - w0) / (1 - p0);
      for (let k = 0; k <= 10; k++) { P.push(pois(k, mu)); M.push(k === 0 ? (mode === 'zip' ? w0 + (1 - w0) * p0 : w0) : kk * pois(k, mu)); }
      for (let k = 0; k <= 10; k++) { E('rect', { x: p.sx(k - 0.38), y: p.sy(P[k]), width: p.sx(0.36) - p.sx(0), height: p.sy(0) - p.sy(P[k]), fill: '#c7cfdb' }, p.g);
        E('rect', { x: p.sx(k + 0.02), y: p.sy(Math.min(M[k], 0.8)), width: p.sx(0.36) - p.sx(0), height: p.sy(0) - p.sy(Math.min(M[k], 0.8)), fill: C.blue }, p.g); }
      p.legend([['Poisson(μ)', '#c7cfdb'], [mode === 'zip' ? '零膨脹' : '門檻', C.blue]]);
      const Em = mode === 'zip' ? (1 - w0) * mu : kk * mu, V = mode === 'zip' ? (1 - w0) * mu + mu * mu * w0 * (1 - w0) : kk * mu + kk * (1 - kk) * mu * mu;
      out.innerHTML = (mode === 'zip' ? `零膨脹：Pr(0) ＝ π＋(1−π)e^{−μ} ＝ <b>${f2(M[0], 4)}</b>；正整數都乘上 1−π ＝ ${f2(1 - w0, 3)}。`
        : `門檻：Pr(0) 直接設成 π ＝ <b>${f2(w0, 3)}</b>；正整數乘上 k ＝ (1−π)/(1−e^{−μ}) ＝ <b>${f2(kk, 4)}</b>。`)
        + `<br>平均 ${f2(Em, 4)}，變異數 ${f2(V, 4)}，變異數／平均 ＝ <b>${f2(V / Em, 4)}</b>${V / Em > 1.0005 ? '（過度離散）' : V / Em < 0.9995 ? '（<b>離散不足</b>：只有門檻模型做得到）' : ''}。Poisson 本身的比值是 1。`;
    };
    choice(ctl, '模型：', [['zip', '零膨脹'], ['hurdle', '門檻']], mode, v => { mode = v; draw(); });
    slider(ctl, { label: 'Poisson 平均 μ ', min: 0.2, max: 6, step: 0.1, value: mu, fmt: v => v.toFixed(1) }, v => { mu = v; draw(); });
    slider(ctl, { label: '0 的參數 π ', min: 0, max: 0.9, step: 0.01, value: w0, fmt: v => v.toFixed(2) }, v => { w0 = v; draw(); });
    draw();
  };

  // ===== 第 15 章：KNN 分類 =====
  W.knn = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 460, h: 420, xr: [-3, 3], yr: [-3, 3], xlab: 'X₁', ylab: 'X₂', m: { l: 38, r: 10, t: 10, b: 34 } });
    const r = rng(15), mk = n => Array.from({ length: n }, () => { const c = r() < 0.5 ? 0 : 1, a = normal(r), b = normal(r);
      const x = c ? [0.7 + 1.0 * a, 0.5 + 1.0 * b] : [-0.6 + 1.0 * a, -0.4 + 1.0 * b]; return [x[0], x[1], r() < 0.85 ? c : 1 - c]; });
    const tr = mk(100), te = mk(800); let K = 1;
    const pred = (x, y) => { const d = tr.map(q => [(q[0] - x) ** 2 + (q[1] - y) ** 2, q[2]]).sort((a, b) => a[0] - b[0]); let s = 0; for (let i = 0; i < K; i++) s += d[i][1]; return s / K > 0.5 ? 1 : 0; };
    const N = 44, cw = 6 / N;
    const draw = () => {
      p.clear();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -3 + (i + 0.5) * cw, y = -3 + (j + 0.5) * cw, c = pred(x, y);
        E('rect', { x: p.sx(-3 + i * cw), y: p.sy(-3 + (j + 1) * cw), width: p.sx(cw) - p.sx(0) + 0.5, height: p.sy(0) - p.sy(cw) + 0.5, fill: c ? '#fde2e2' : '#dde8f6' }, p.g); }
      tr.forEach(q => p.dot(q[0], q[1], 3.6, { fill: q[2] ? C.red : C.blue, stroke: '#fff', 'stroke-width': 0.8 }));
      const trErr = mean(tr.map(q => pred(q[0], q[1]) !== q[2] ? 1 : 0)), teErr = mean(te.map(q => pred(q[0], q[1]) !== q[2] ? 1 : 0));
      out.innerHTML = `K ＝ <b>${K}</b>：訓練錯誤率 <b>${f2(trErr, 3)}</b>，測試錯誤率（800 筆新資料）<b>${f2(teErr, 3)}</b>。`
        + `<br>${K === 1 ? 'K＝1 每個訓練點都猜對（訓練錯誤率 0），但邊界彎來彎去：彈性最高、變異數大。' : K > 60 ? 'K 很大時邊界幾乎是一條直線，甚至全部猜成同一類：偏差大。' : '把 K 從 1 慢慢拉大：訓練錯誤率一路上升，測試錯誤率先降後升。'}`;
    };
    slider(ctl, { label: '鄰居數 K ', min: 1, max: 99, step: 2, value: 1 }, v => { K = v; draw(); }); draw();
  };

  // ===== 第 16 章：成本複雜度修剪 =====
  W.prune = (el) => {
    const D = window.WD.prune, S = D.seq, { plots, ctl, out } = frame(el, 2);
    const p1 = new Plot(plots, { xr: [0, 10], yr: [-1, 13], xlab: 'x', ylab: 'y' });
    const L = S.map(s => s.leaves), mx = Math.max(...L);
    const p2 = new Plot(plots, { xr: [0, mx + 1], yr: [0, 6], xlab: '葉子數 |T|', ylab: 'MSE' });
    const n = D.x.length;
    p2.path(L, S.map(s => s.rss / n), { stroke: C.gray, 'stroke-dasharray': '5 3' }, p2.bg); p2.path(L, S.map(s => s.test), { stroke: C.red, 'stroke-width': 2.5 }, p2.bg);
    p2.legend([['測試 MSE', C.red], ['訓練 MSE', C.gray, '5 3']]);
    const draw = i => {
      const s = S[i]; p1.clear(); p1.path(D.grid, D.truth, { stroke: C.green, 'stroke-dasharray': '6 4' });
      D.x.forEach((x, j) => p1.dot(x, D.y[j], 3, { fill: C.gray })); p1.path(D.grid, s.pred, { stroke: C.red, 'stroke-width': 2.5 });
      p2.clear(); p2.vline(s.leaves); p2.dot(s.leaves, s.test, 5, { fill: C.red });
      const best = S.reduce((a, b) => b.test < a.test ? b : a);
      out.innerHTML = `α ＝ <b>${f2(s.alpha, 2)}</b>（α 落在這一段時都選這棵子樹）：葉子 <b>${s.leaves}</b> 片，訓練 RSS ${f2(s.rss, 1)}，RSS ＋ α|T| ＝ ${f2(s.rss + s.alpha * s.leaves, 1)}，測試 MSE <b>${f2(s.test, 3)}</b>。`
        + `<br>α 越大，每片葉子的「成本」越高，樹被剪得越小。測試 MSE 在 ${best.leaves} 片葉子時最低（${f2(best.test, 3)}）；不剪的大樹在追雜訊，剪太多又抓不到階梯。`;
    };
    slider(ctl, { label: 'α（往右越大） ', min: 0, max: S.length - 1, step: 1, value: 0, fmt: v => f2(S[v].alpha, 2) }, draw); draw(0);
  };

  // ===== 第 16 章：boosting =====
  W.boost = (el) => {
    const D = window.WD.boost, { plots, ctl, out } = frame(el, 2);
    const p1 = new Plot(plots, { xr: [0, 8], yr: [-2, 5], xlab: 'x', ylab: 'y' });
    const p2 = new Plot(plots, { xr: [1, 2000], yr: [0, 2.2], xlab: '樹的棵數 B（對數刻度）', ylab: 'MSE', xlog: true });
    let lam = '0.1', idx = 6;
    const draw = () => {
      const R = D.runs[lam], s = R[idx]; p1.clear(); p1.path(D.grid, D.truth, { stroke: C.green, 'stroke-dasharray': '6 4' });
      D.x.forEach((x, j) => p1.dot(x, D.y[j], 2.6, { fill: C.gray })); p1.path(D.grid, s.pred, { stroke: C.red, 'stroke-width': 2.5 });
      p2.clear(); p2.path(R.map(r => r.B), R.map(r => r.train), { stroke: C.gray, 'stroke-dasharray': '5 3' }); p2.path(R.map(r => r.B), R.map(r => r.test), { stroke: C.red, 'stroke-width': 2.5 });
      p2.line(1, D.noise, 2000, D.noise, { stroke: C.green, 'stroke-dasharray': '2 3' }); p2.vline(s.B); p2.dot(s.B, s.test, 5, { fill: C.red });
      const best = R.reduce((a, b) => b.test < a.test ? b : a);
      out.innerHTML = `λ ＝ ${lam}，B ＝ <b>${s.B}</b> 棵樹樁：訓練 MSE ${f2(s.train, 3)}，測試 MSE <b>${f2(s.test, 3)}</b>（綠虛線是不可降低的 ${D.noise}）。`
        + `<br>這個 λ 下測試 MSE 在 B ≈ ${best.B} 最低（${f2(best.test, 3)}）。λ 越小學得越慢，需要的 B 越大；B 太大時開始配到雜訊，測試 MSE 回升：boosting 會過度配適，bagging 與隨機森林不會。`;
    };
    choice(ctl, '學習率 λ：', [['0.5', '0.5'], ['0.1', '0.1'], ['0.01', '0.01']], lam, v => { lam = v; draw(); });
    const R0 = D.runs['0.1'];
    slider(ctl, { label: '樹的棵數 B ', min: 0, max: R0.length - 1, step: 1, value: idx, fmt: v => R0[v].B }, v => { idx = v; draw(); }); draw();
  };

  // ===== 第 17 章：轉動投影方向找第一主成分 =====
  W.pcarot = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 460, h: 420, xr: [-4, 4], yr: [-4, 4], xlab: 'X₁（置中）', ylab: 'X₂（置中）', m: { l: 38, r: 10, t: 10, b: 34 } });
    const r = rng(17); let P = Array.from({ length: 24 }, () => { const a = 1.6 * normal(r), b = 0.55 * normal(r); return [0.88 * a - 0.47 * b, 0.47 * a + 0.88 * b]; });
    const m0 = mean(P.map(q => q[0])), m1 = mean(P.map(q => q[1])); P = P.map(q => [q[0] - m0, q[1] - m1]);
    const tot = sum(P.map(q => q[0] ** 2 + q[1] ** 2)) / P.length;
    const vAt = deg => { const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return sum(P.map(q => (q[0] * c + q[1] * s) ** 2)) / P.length; };
    let bestD = 0, bv = -1; for (let d = 0; d < 180; d += 0.5) { const v = vAt(d); if (v > bv) { bv = v; bestD = d; } }
    let ang = 100;
    const draw = () => {
      p.clear(); const t = ang * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
      p.line(-6 * c, -6 * s, 6 * c, 6 * s, { stroke: C.navy, 'stroke-width': 2 });
      let perp = 0;
      P.forEach(q => { const z = q[0] * c + q[1] * s, pr = [z * c, z * s]; perp += (q[0] - pr[0]) ** 2 + (q[1] - pr[1]) ** 2;
        p.line(q[0], q[1], pr[0], pr[1], { stroke: C.red, 'stroke-opacity': 0.45 }); p.dot(pr[0], pr[1], 3, { fill: C.gold }); p.dot(q[0], q[1], 3.8, { fill: C.blue }); });
      const v = vAt(ang);
      out.innerHTML = `方向 ${ang}°，載荷 (φ₁, φ₂) ＝ (${f2(c, 3)}, ${f2(s, 3)})，平方和 1。`
        + `<br>分數（金點）的變異數 <b>${f2(v, 3)}</b> ＋ 平均垂直距離平方（紅線）<b>${f2(perp / P.length, 3)}</b> ＝ 總變異 ${f2(tot, 3)}（固定）。`
        + `<br>所以「讓投影的變異數最大」和「讓垂直距離最小」是同一件事。轉到 ${bestD}° 附近就是第一主成分，PVE ＝ ${f2(bv / tot, 3)}。`;
    };
    slider(ctl, { label: '投影方向（度） ', min: 0, max: 179, step: 1, value: ang }, v => { ang = v; draw(); }); draw();
  };

  // ===== 第 18 章：K 平均一步一步 =====
  W.kmeans = (el) => {
    const { plots, ctl, out } = frame(el);
    const p = new Plot(plots, { w: 520, h: 400, xr: [0, 10], yr: [0, 10], xlab: 'X₁', ylab: 'X₂', m: { l: 36, r: 10, t: 10, b: 34 } });
    const r = rng(18), cs = [[2.5, 7], [7, 7.5], [5, 2.5], [8, 3]];
    const P = []; cs.forEach((c, j) => { for (let i = 0; i < (j === 3 ? 8 : 14); i++) P.push([c[0] + 0.9 * normal(r), c[1] + 0.9 * normal(r)]); });
    let K = 3, lab, cen, phase, it, seed = 1, log = [];
    const obj = () => 2 * sum(P.map((q, i) => (q[0] - cen[lab[i]][0]) ** 2 + (q[1] - cen[lab[i]][1]) ** 2));
    const centroids = () => { cen = Array.from({ length: K }, (_, k) => { const m = P.filter((_, i) => lab[i] === k); return m.length ? [mean(m.map(q => q[0])), mean(m.map(q => q[1]))] : (cen ? cen[k] : [5, 5]); }); };
    const reset = () => { const rr = rng(100 + seed++); lab = P.map(() => Math.floor(rr() * K)); cen = null; centroids(); phase = 'assign'; it = 0; log = [`隨機起點：目標函數 ${f2(obj(), 1)}`]; draw(); };
    const step = () => {
      if (phase === 'assign') { let moved = 0; P.forEach((q, i) => { let b = 0, bd = 1e9; cen.forEach((c, k) => { const d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2; if (d < bd) { bd = d; b = k; } }); if (b !== lab[i]) moved++; lab[i] = b; });
        it++; log.push(`第 ${it} 輪：每點改派到最近的重心，${moved} 點換群，目標函數 ${f2(obj(), 1)}`); phase = moved ? 'update' : 'done'; }
      else if (phase === 'update') { centroids(); log.push(`　　重新計算重心，目標函數 ${f2(obj(), 1)}`); phase = 'assign'; }
      draw(); };
    const draw = () => {
      p.clear(); P.forEach((q, i) => p.dot(q[0], q[1], 4, { fill: PAL[lab[i]] }));
      cen.forEach((c, k) => { const x = p.sx(c[0]), y = p.sy(c[1]); E('path', { d: `M${x - 8},${y - 8}L${x + 8},${y + 8}M${x - 8},${y + 8}L${x + 8},${y - 8}`, stroke: '#fff', 'stroke-width': 6 }, p.g);
        E('path', { d: `M${x - 8},${y - 8}L${x + 8},${y + 8}M${x - 8},${y + 8}L${x + 8},${y - 8}`, stroke: PAL[k], 'stroke-width': 3 }, p.g); });
      out.innerHTML = log.slice(-6).join('<br>') + (phase === 'done' ? `<br><b>沒有點換群，演算法停止。</b>按「換一個隨機起點」再跑一次，看看會不會停在別的（局部最小）分群。` : '<br>目標函數每一步都只會下降或不變。');
      nb.disabled = phase === 'done'; nb.textContent = phase === 'update' ? '下一步：重算重心' : '下一步：重新分派';
    };
    const nb = button(ctl, '下一步', step); button(ctl, '換一個隨機起點', reset);
    slider(ctl, { label: '群數 K ', min: 2, max: 5, step: 1, value: K }, v => { K = v; reset(); }); reset();
  };

  // ===== 第 20 章：AR(1) =====
  W.ar1 = (el) => {
    const { plots, ctl, out } = frame(el, 2);
    const p1 = new Plot(plots, { xr: [0, 150], yr: [-8, 8], xlab: '時間 t', ylab: 'y' });
    const p2 = new Plot(plots, { xr: [-0.5, 15.5], yr: [-1, 1], xlab: '落後期數 k', ylab: '自相關', xn: 8 });
    const r = rng(20), eps = Array.from({ length: 400 }, () => normal(r)); let b = 0.7;
    const draw = () => {
      const y = [0]; for (let t = 1; t < 400; t++) y.push(b * y[t - 1] + eps[t]); const Y = y.slice(250);
      p1.clear(); p1.line(0, 0, 150, 0, { stroke: '#c7cfdb' }); p1.path(Y.map((_, i) => i), Y, { stroke: C.navy, 'stroke-width': 1.4 });
      const m = mean(Y), den = sum(Y.map(v => (v - m) ** 2)); p2.clear(); p2.line(-0.5, 0, 15.5, 0, { stroke: '#aab3c2' });
      const bd = 2 / Math.sqrt(Y.length); p2.line(-0.5, bd, 15.5, bd, { stroke: C.gray, 'stroke-dasharray': '3 3' }); p2.line(-0.5, -bd, 15.5, -bd, { stroke: C.gray, 'stroke-dasharray': '3 3' });
      for (let k = 0; k <= 15; k++) { let nu = 0; for (let t = k; t < Y.length; t++) nu += (Y[t] - m) * (Y[t - k] - m); const rk = nu / den;
        E('rect', { x: p2.sx(k - 0.3), y: p2.sy(Math.max(rk, 0)), width: p2.sx(0.6) - p2.sx(0), height: Math.abs(p2.sy(rk) - p2.sy(0)), fill: '#9fb3cc' }, p2.g);
        p2.dot(k, b ** k, 3.6, { fill: C.red }); }
      p2.legend([['理論 β₁ᵏ', C.red], ['樣本 r_k', '#9fb3cc']]);
      const v = Math.abs(b) < 1 ? 1 / (1 - b * b) : Infinity;
      out.innerHTML = `β₁ ＝ <b>${f2(b)}</b>：${b === 1 ? '<b>隨機漫步，不平穩</b>，變異數隨時間無限增加。' : `平穩，Var(y) ＝ σ²/(1−β₁²) ＝ <b>${f2(v, 2)}</b>σ²，自相關 ρ_k ＝ β₁ᵏ。`}`
        + `<br>${b < 0 ? 'β₁ 為負：數列上下鋸齒狀跳動，自相關正負交錯。' : b === 0 ? 'β₁＝0：白噪音，自相關都在虛線（±2/√T）內。' : 'β₁ 越接近 1，數列越「黏」、振幅越大，自相關衰減越慢。'}（同一組白噪音，只改 β₁。）`;
    };
    slider(ctl, { label: 'β₁ ', min: -0.95, max: 1, step: 0.05, value: b, fmt: v => v.toFixed(2) }, v => { b = +v.toFixed(2); draw(); }); draw();
  };

  // ===== 第 21 章：指數平滑的 w =====
  W.expsm = (el) => {
    const { plots, ctl, out } = frame(el, 2);
    const p1 = new Plot(plots, { xr: [1, 70], yr: [10, 40], xlab: '時間 t', ylab: 'y' });
    const p2 = new Plot(plots, { xr: [0, 1], yr: [0, 1], xlab: 'w（舊資訊的權重）', ylab: 'SS(w)（相對）' });
    const r = rng(21), Y = Array.from({ length: 70 }, (_, i) => (i < 35 ? 20 : 30) + 0.05 * i + 2.6 * normal(r));
    const run = w => { let s = Y[0], ss = 0; const S = [s]; for (let t = 1; t < Y.length; t++) { ss += (Y[t] - s) ** 2; s = (1 - w) * Y[t] + w * s; S.push(s); } return { S, ss }; };
    const W_ = Array.from({ length: 95 }, (_, i) => 0.02 + i * 0.01), SS = W_.map(w => run(w).ss), mn = Math.min(...SS), mxs = Math.max(...SS);
    const rel = v => (v - mn) / (mxs - mn) * 0.9 + 0.05;
    p2.path(W_, SS.map(rel), { stroke: C.red, 'stroke-width': 2 }, p2.bg); const wb = W_[SS.indexOf(mn)];
    let w = 0.8;
    const draw = () => { const { S, ss } = run(w); p1.clear(); Y.forEach((v, i) => p1.dot(i + 1, v, 2.6, { fill: C.gray }));
      p1.path(S.map((_, i) => i + 1), S, { stroke: C.red, 'stroke-width': 2.2 }); p1.line(35.5, 10, 35.5, 40, { stroke: C.gold, 'stroke-dasharray': '3 3' });
      p2.clear(); p2.vline(w); p2.dot(w, rel(ss), 5, { fill: C.red });
      out.innerHTML = `ŝ_t ＝ (1−w)y_t ＋ w·ŝ_{t−1}，w ＝ <b>${f2(w)}</b>：新觀察的權重 ${f2(1 - w)}，往前第 k 期的權重是 (1−w)wᵏ。`
        + `<br>一步預測誤差平方和 SS(w) ＝ Σ(y_t − ŝ_{t−1})² ＝ <b>${f2(ss, 1)}</b>，在 w ≈ ${f2(wb)} 最小。`
        + `<br>${w > 0.85 ? 'w 大：很平滑，但水準在第 36 期跳上去後要很久才追上。' : w < 0.4 ? 'w 小：反應快，但跟著雜訊上下抖。' : '中間的 w 在「平滑」與「反應速度」之間取捨。'}`; };
    slider(ctl, { label: '平滑參數 w ', min: 0.02, max: 0.96, step: 0.01, value: w, fmt: v => v.toFixed(2) }, v => { w = v; draw(); }); draw();
  };

  // ---------- 啟動 ----------
  const NEED_DATA = ['bvflex', 'prune', 'boost'];
  function init() {
    const els = [...document.querySelectorAll('.widget[data-w]')]; if (!els.length) return;
    const go = () => els.forEach(el => { const f = W[el.dataset.w]; if (!f) return; const body = H('div', { class: 'w-body' }, el);
      try { f(body); } catch (e) { body.innerHTML = '<p class="w-err">互動圖載入失敗。</p>'; console.error(e); } });
    if (els.some(el => NEED_DATA.includes(el.dataset.w)) && !window.WD) {
      const s = document.createElement('script'); const me = document.querySelector('script[src*="widgets.js"]');
      s.src = me.src.replace(/widgets\.js.*$/, 'widgets_data.js?v=' + (me.dataset.dv || '0')); s.onload = go; document.head.appendChild(s);
    } else go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.SRMW = W;
})();
