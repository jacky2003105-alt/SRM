/* 練習測驗：計時、作答、交卷計分。答案存在 localStorage（無法使用時只存在記憶體）。 */
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.querySelector('.exam-bar'); if (!bar) return;
  const KEY = 'srm-' + location.pathname.split('/').pop();
  const store = { get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return mem } }, set(v) { mem = v; try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { } } };
  let mem = null;
  let st = store.get() || { ans: {}, start: null, done: false, used: null };
  const QS = [...document.querySelectorAll('.exam-q')], N = QS.length, MIN = +bar.dataset.minutes;
  const timer = bar.querySelector('.timer'), prog = bar.querySelector('.progress'), res = document.querySelector('.exam-result');
  const grid = [...document.querySelectorAll('.exam-grid a')];
  const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0') };
  const opts = q => [...q.querySelectorAll('.prompt .opts p')].filter(p => /^\s*\([A-E]\)/.test(p.textContent));
  QS.forEach(q => {
    const no = q.id.slice(1);
    opts(q).forEach(p => {
      const L = p.textContent.trim()[1]; p.dataset.k = L; p.tabIndex = 0; p.setAttribute('role', 'button');
      const pick = () => { if (st.done) return; st.ans[no] = st.ans[no] === L ? undefined : L; if (!st.ans[no]) delete st.ans[no]; store.set(st); paint() };
      p.onclick = pick; p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick() } };
    });
    const o = q.querySelector('.prompt .opts'); if (o) o.classList.add('mc');
  });
  function paint() {
    let n = 0;
    QS.forEach((q, i) => {
      const no = q.id.slice(1), a = st.ans[no], k = q.dataset.key;
      if (a) n++;
      opts(q).forEach(p => { p.classList.toggle('picked', p.dataset.k === a); p.classList.toggle('is-key', st.done && p.dataset.k === k); p.classList.toggle('is-wrong', st.done && a && p.dataset.k === a && a !== k) });
      const s = q.querySelector('.q-state');
      s.textContent = st.done ? (a === k ? '✓ 答對' : (a ? '✗ 答錯（選 ' + a + '，正確 ' + k + '）' : '— 未作答（正確 ' + k + '）')) : (a ? '已選 ' + a : '');
      s.className = 'q-state' + (st.done ? (a === k ? ' ok' : ' bad') : '');
      q.querySelector('.exam-sol').hidden = !st.done;
      const g = grid[i]; g.className = st.done ? (a === k ? 'ok' : 'bad') : (a ? 'done' : '');
    });
    prog.textContent = '已作答 ' + n + '／' + N;
    bar.querySelector('.start').hidden = !!st.start || st.done;
    bar.querySelector('.submit').hidden = st.done;
    if (st.done) showResult();
    else res.hidden = true;
  }
  function showResult() {
    let ok = 0; const by = {};
    QS.forEach(q => { const no = q.id.slice(1), r = st.ans[no] === q.dataset.key; if (r) ok++; q.dataset.ch.split(',').forEach(c => { by[c] = by[c] || [0, 0]; by[c][1]++; if (r) by[c][0]++ }) });
    const rows = Object.keys(by).sort((a, b) => a - b).map(c => { const [a, t] = by[c], pct = Math.round(100 * a / t); return `<tr class="${pct < 60 ? 'weak' : ''}"><td><a href="ch${String(c).padStart(2, '0')}.html">第 ${c} 章</a></td><td>${a}／${t}</td><td>${pct}%</td></tr>` }).join('');
    const pct = Math.round(100 * ok / N);
    res.innerHTML = `<h2>成績：${ok}／${N}（${pct}%）</h2><p>${st.used != null ? '用時 ' + fmt(st.used) + '。' : ''}SOA 不公布及格分數，一般估計約需答對 70% 左右；下表標成紅色的是答對率低於 60% 的章節，建議優先複習。每一題的解析已經展開在下面。</p><div class="tabwrap"><table><thead><tr><th>章節</th><th>答對</th><th>答對率</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    res.hidden = false;
  }
  let tick;
  function run() {
    clearInterval(tick);
    const upd = () => {
      if (st.done) { timer.textContent = '⏱ 已交卷'; return }
      if (!st.start) { timer.textContent = '⏱ ' + fmt(MIN * 60); return }
      const left = MIN * 60 - (Date.now() - st.start) / 1000;
      timer.textContent = '⏱ 剩 ' + fmt(left); timer.classList.toggle('low', left < 600);
      if (left <= 0) submit(true);
    };
    upd(); tick = setInterval(upd, 1000);
  }
  function submit(auto) {
    if (st.done) return;
    const left = N - Object.keys(st.ans).length;
    if (!auto && left && !confirmBox(left)) return;
    st.done = true; st.used = st.start ? Math.min(MIN * 60, (Date.now() - st.start) / 1000) : null; store.set(st); paint(); run();
    res.scrollIntoView({ behavior: 'smooth' });
  }
  // 不用瀏覽器的 confirm（會阻塞）；第一次按交卷時提醒，再按一次才交
  let armed = false;
  function confirmBox(left) {
    if (armed) return true;
    armed = true; const b = bar.querySelector('.submit'); b.textContent = `還有 ${left} 題沒答，再按一次交卷`; setTimeout(() => { armed = false; b.textContent = '交卷' }, 5000); return false;
  }
  bar.querySelector('.start').onclick = () => { st.start = Date.now(); store.set(st); paint(); run() };
  bar.querySelector('.submit').onclick = () => submit(false);
  bar.querySelector('.reset').onclick = () => { const b = bar.querySelector('.reset'); if (b.dataset.armed) { st = { ans: {}, start: null, done: false, used: null }; store.set(st); delete b.dataset.armed; b.textContent = '清除重來'; paint(); run(); scrollTo(0, 0) } else { b.dataset.armed = 1; b.textContent = '確定清除？再按一次'; setTimeout(() => { delete b.dataset.armed; b.textContent = '清除重來' }, 4000) } };
  paint(); run();
});
