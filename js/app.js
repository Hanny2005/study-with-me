(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('swm-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('swm-' + k, JSON.stringify(v)); } catch (e) {} },
  };
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  $('#dateLine').textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' }).format(new Date());

  /* ---------- Toast ---------- */
  function toast(msg, ms = 3400) {
    const t = Object.assign(document.createElement('div'), { className: 'toast', textContent: msg });
    $('.toasts').append(t); Motion.enter(t, 'toast');
    setTimeout(() => Motion.exit(t, 'toast')?.finished.then(() => t.remove()).catch(() => t.remove()), ms);
  }

  /* ---------- Dial ---------- */
  const C = 2 * Math.PI * 86, prog = $('#prog');
  prog.style.strokeDasharray = C;
  $('#ticks').innerHTML = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2, r1 = i % 5 ? 97 : 94, r2 = 99;
    return `<line x1="${100 + r1 * Math.cos(a)}" y1="${100 + r1 * Math.sin(a)}" x2="${100 + r2 * Math.cos(a)}" y2="${100 + r2 * Math.sin(a)}"/>`;
  }).join('');

  /* ---------- Timer state ---------- */
  const MODES = {
    focus: { min: 25, label: 'Phiên tập trung', idle: 'Sẵn sàng khi bạn sẵn sàng', run: 'Đang tập trung', tab: 'm-focus' },
    short: { min: 5, label: 'Nghỉ ngắn', idle: 'Đứng dậy, uống nước', run: 'Nghỉ một chút', tab: 'm-short' },
    long: { min: 15, label: 'Nghỉ dài', idle: 'Đi bộ, nhìn ra xa', run: 'Nghỉ dài', tab: 'm-long' },
  };
  let mode = 'focus', total = MODES.focus.min * 60, left = total, endAt = 0, ticker = null;
  let cycleCount = store.get('cycle', 0) % 4;
  const timeEl = $('#time'), startBtn = $('#startBtn'), startLabel = $('#startLabel');
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const running = () => !!ticker;

  function draw() {
    timeEl.textContent = fmt(Math.ceil(left));
    prog.style.strokeDashoffset = C * (1 - left / total);
    document.title = running() ? `${fmt(Math.ceil(left))} · ${mode === 'focus' ? 'Tập trung' : 'Nghỉ'}` : 'Study With Me';
  }
  function drawDots() { $$('#dots i').forEach((d, i) => d.classList.toggle('on', i < cycleCount)); }
  function setPhaseText() {
    const M = MODES[mode];
    $('#phase').innerHTML = running() ? `<b>●</b> ${M.run}` : M.idle;
  }

  function setMode(m, { animate = true } = {}) {
    clearInterval(ticker); ticker = null; root.classList.remove('running');
    mode = m; total = MODES[m].min * 60; left = total;
    root.classList.toggle('is-break', m !== 'focus');
    tabs.forEach((t) => { const on = t.dataset.mode === m; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    Motion.slideTo(modeInd, tabs.find((t) => t.dataset.mode === m));
    const apply = () => { $('#phaseLabel').textContent = MODES[m].label; draw(); setPhaseText(); };
    if (animate) Motion.swap($('.dial-center'), apply);
    else apply();
    swapStart('Bắt đầu');
  }

  function swapStart(text) { if (startLabel.textContent !== text) Motion.swap(startLabel, (el) => (el.textContent = text)); }

  function start() {
    if (running()) return;
    audio.unlock();
    endAt = Date.now() + left * 1000;
    ticker = setInterval(tick, 250);
    root.classList.add('running');
    swapStart('Tạm dừng'); setPhaseText(); tick();
  }
  function stop() {
    if (!running()) return;
    clearInterval(ticker); ticker = null;
    root.classList.remove('running');
    swapStart('Tiếp tục'); setPhaseText(); draw();
  }
  function tick() {
    left = Math.max(0, (endAt - Date.now()) / 1000);
    draw();
    if (left <= 0) complete();
  }
  function complete(skipped = false) {
    clearInterval(ticker); ticker = null; root.classList.remove('running');
    if (mode === 'focus') {
      if (!skipped) {
        logFocus(MODES.focus.min);
        cycleCount = (cycleCount + 1); store.set('cycle', cycleCount);
        const cur = tasks.find((t) => t.id === currentId && !t.done);
        if (cur) { cur.done_p = (cur.done_p || 0) + 1; saveTasks(); renderTasks(); }
        audio.chime();
        const dot = $$('#dots i')[(cycleCount - 1) % 4]; drawDots();
        if (dot) Motion.animate(dot, [{ transform: 'scale(0.2)' }, { transform: 'scale(1.15)' }], { dur: '--dur-delight', easing: '--spring-delight' });
        toast(cycleCount % 4 === 0 ? 'Xong 4 phiên! Nghỉ dài 15 phút nhé.' : 'Hết phiên. Nghỉ 5 phút.');
      }
      if (cycleCount >= 4 && cycleCount % 4 === 0) { setMode('long'); cycleCount = 0; store.set('cycle', 0); setTimeout(drawDots, 1200); }
      else setMode('short');
    } else {
      if (!skipped) { audio.chime(true); toast('Hết giờ nghỉ. Quay lại học thôi.'); }
      setMode('focus');
    }
  }

  const tabs = $$('.modes [role=tab]'), modeInd = $('.mode-ind');
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { if (t.dataset.mode !== mode) setMode(t.dataset.mode); });
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); setMode(n.dataset.mode);
    });
  });
  const placeInd = () => { modeInd.__placed = false; Motion.slideTo(modeInd, tabs.find((t) => t.getAttribute('aria-selected') === 'true')); };
  placeInd(); addEventListener('resize', placeInd); document.fonts?.ready.then(placeInd);

  startBtn.addEventListener('click', () => (running() ? stop() : start()));
  startBtn.addEventListener('pointerdown', () => Motion.animate(startBtn, [{ transform: 'scale(1)' }, { transform: `scale(${Motion.token('--scale-press')})` }], { dur: '--dur-menu', easing: '--ease-out' }));
  const release = () => Motion.animate(startBtn, [{ transform: `scale(${Motion.token('--scale-press')})` }, { transform: 'scale(1)' }], { dur: '--dur-press', easing: '--spring-press' });
  startBtn.addEventListener('pointerup', release); startBtn.addEventListener('pointerleave', (e) => { if (e.buttons) release(); });
  $('#resetBtn').addEventListener('click', () => { setMode(mode); });
  $('#skipBtn').addEventListener('click', () => complete(true));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space' && !e.target.closest('button')) { e.preventDefault(); startBtn.click(); }
    else if (e.key === 'r' || e.key === 'R') $('#resetBtn').click();
    else if (e.key === 'f' || e.key === 'F') $('#focusBtn').click();
  });
  document.addEventListener('visibilitychange', () => { if (running()) tick(); });

  /* ---------- Focus mode ---------- */
  $('#focusBtn').addEventListener('click', () => {
    const on = !document.body.classList.contains('focus');
    $('#focusBtn').setAttribute('aria-pressed', on);
    Motion.transition(() => document.body.classList.toggle('focus', on)).then(placeInd);
    if (!document.startViewTransition) placeInd();
  });

  /* ---------- Tasks ---------- */
  let tasks = store.get('tasks', null);
  let isSample = false;
  if (!tasks) {
    isSample = true;
    tasks = [
      { id: 's1', name: 'Đọc chương 4: Hàm và phạm vi biến', est: 2, done_p: 1, done: false },
      { id: 's2', name: 'Làm 10 bài tập Flexbox', est: 1, done_p: 0, done: false },
      { id: 's3', name: 'Ôn từ vựng tiếng Anh, 30 từ', est: 1, done_p: 1, done: true },
    ];
  }
  let currentId = store.get('current', tasks.find((t) => !t.done)?.id || null);
  const list = $('#tasks');
  function saveTasks() { if (isSample) return; store.set('tasks', tasks); store.set('current', currentId); }
  function leaveSample() { if (!isSample) return; isSample = false; $('#sampleTag').hidden = true; }
  function rowHTML(t) {
    return `<li class="task${t.done ? ' done' : ''}${t.id === currentId ? ' current' : ''}" data-id="${t.id}">
      <button class="check" aria-label="${t.done ? 'Bỏ đánh dấu xong' : 'Đánh dấu xong'}: ${esc(t.name)}" aria-pressed="${t.done}"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7"/></svg></button>
      <button class="t-name" aria-current="${t.id === currentId}">${esc(t.name)}</button>
      <span class="t-pomo">${t.done_p || 0}/${t.est}</span>
      <button class="t-del" aria-label="Xóa: ${esc(t.name)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </li>`;
  }
  function renderTasks() {
    list.innerHTML = tasks.length ? tasks.map(rowHTML).join('') : '<li class="empty">Chưa có việc nào. Thêm một việc nhỏ, làm được trong 1–2 phiên.</li>';
    $('#sampleTag').hidden = !isSample;
    const cur = tasks.find((t) => t.id === currentId && !t.done);
    const nt = $('#nowTask');
    const html = cur ? `Đang học: <b>${esc(cur.name)}</b>` : 'Chọn một việc bên cạnh để biết mình đang học gì.';
    if (nt.innerHTML !== html) { if (nt.innerHTML) Motion.swap(nt, (el) => (el.innerHTML = html)); else nt.innerHTML = html; }
  }
  renderTasks();

  $('#addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#taskIn').value.trim();
    if (!name) { Motion.animate($('#taskIn'), [0, -6, 5, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })), { dur: '--dur-pop', easing: '--ease-in-out' }); $('#taskIn').focus(); return; }
    leaveSample();
    const t = { id: 't' + Date.now().toString(36), name, est: Math.min(8, Math.max(1, +$('#pomoIn').value || 1)), done_p: 0, done: false };
    tasks.push(t); if (!currentId) currentId = t.id;
    saveTasks(); renderTasks();
    const row = list.querySelector(`[data-id="${t.id}"]`); row.hidden = true; Motion.enter(row, 'rise');
    $('#taskIn').value = ''; $('#pomoIn').value = 1;
  });
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.task'); if (!row) return;
    const t = tasks.find((x) => x.id === row.dataset.id);
    if (e.target.closest('.check')) {
      leaveSample();
      t.done = !t.done;
      if (t.done && currentId === t.id) currentId = tasks.find((x) => !x.done)?.id || null;
      saveTasks();
      row.classList.toggle('done', t.done);
      const chk = row.querySelector('.check'); chk.setAttribute('aria-pressed', t.done);
      if (t.done) { Motion.animate(chk, [{ transform: 'scale(.6)' }, { transform: 'scale(1)' }], { dur: '--dur-delight', easing: '--spring-delight' }); toast('Xong một việc. Giỏi lắm!'); }
      setTimeout(renderTasks, 450);
    } else if (e.target.closest('.t-del')) {
      leaveSample();
      Motion.animate(row, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }], { dur: '--dur-exit', easing: '--ease-out' })?.finished.then(() => {
        tasks = tasks.filter((x) => x !== t); if (currentId === t.id) currentId = tasks.find((x) => !x.done)?.id || null;
        saveTasks(); renderTasks();
      }).catch(() => {});
    } else if (e.target.closest('.t-name') && !t.done) {
      leaveSample(); currentId = t.id; saveTasks();
      $$('.task', list).forEach((r) => { r.classList.toggle('current', r === row); r.querySelector('.t-name').setAttribute('aria-current', r === row); });
      renderTasks();
    }
  });

  /* ---------- Focus log (giữ để đếm phiên) ---------- */
  function logFocus(min) {
    const log = store.get('log', {}); const k = dayKey();
    log[k] = log[k] || { min: 0, ses: 0 }; log[k].min += min; log[k].ses += 1;
    store.set('log', log);
  }

  /* ---------- Thời khóa biểu ---------- */
  const DAYS = [1, 2, 3, 4, 5, 6, 0]; // T2..T7, CN (theo getDay)
  const dayName = (d) => (d === 0 ? 'CN' : 'T' + (d + 1));
  const dayLong = (d) => (d === 0 ? 'Chủ nhật' : 'Thứ ' + ['', '', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy'][d + 1]);
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  let tt = store.get('tt', null), ttSample = false;
  if (!tt) {
    ttSample = true;
    tt = [
      [1, '07:00', '08:30', 'Toán', 'P.204'], [1, '08:45', '10:15', 'Tiếng Anh', 'P.108'], [1, '19:30', '21:00', 'Tự học: HTML', 'Bài 3–4'],
      [2, '07:00', '09:15', 'Vật lý', 'Phòng thí nghiệm'], [2, '20:00', '21:30', 'Ôn từ vựng', '30 từ mới'],
      [3, '07:00', '08:30', 'Ngữ văn', 'P.204'], [3, '19:30', '21:00', 'Tự học: CSS Flexbox', ''],
      [4, '07:00', '10:15', 'Toán', 'Kiểm tra 15 phút'], [4, '20:00', '21:00', 'Làm bài tập Lý', ''],
      [5, '08:00', '09:30', 'Tiếng Anh', 'Speaking'], [5, '19:30', '21:30', 'Tự học: JavaScript', 'DOM và sự kiện'],
      [6, '09:00', '11:00', 'Dự án web học tập', 'Làm trang chủ'], [6, '14:00', '15:30', 'Câu lạc bộ lập trình', ''],
      [0, '09:00', '10:00', 'Ôn tập tuần', 'Xem lại ghi chú'],
    ].map(([day, start, end, name, room], i) => ({ id: 'e' + i, day, start, end, name, room }));
  }
  const saveTT = () => { if (!ttSample) store.set('tt', tt); };
  const leaveTTSample = () => { if (ttSample) { ttSample = false; $('#ttSample').hidden = true; } };
  let selDay = new Date().getDay();
  const daysEl = $('#days'), slotsEl = $('#slots'), dayInd = $('.day-ind');
  daysEl.insertAdjacentHTML('beforeend', DAYS.map((d) => `<button role="tab" data-d="${d}" id="d-${d}" aria-controls="slots" aria-label="${dayLong(d)}"><b>${dayName(d)}</b><small></small></button>`).join(''));
  $('#ttDay').innerHTML = DAYS.map((d) => `<option value="${d}">${dayLong(d)}</option>`).join('');
  const dayTabs = $$('[role=tab]', daysEl);

  function slotState(e, now) {
    const today = now.getDay(), mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    if (e.day !== today) return { cls: '' };
    const s = toMin(e.start), en = toMin(e.end);
    if (mins >= en) return { cls: 'past', pill: 'Đã xong' };
    if (mins >= s) return { cls: 'now', pill: `Đang học · còn ${Math.ceil(en - mins)} phút`, p: (mins - s) / (en - s) };
    return { cls: 'upcoming', wait: s - mins };
  }
  function slotHTML(e, st) {
    return `<li class="slot ${st.cls}" data-id="${e.id}">
      <span class="slot-time"><b>${e.start}</b>${e.end}</span>
      <span class="slot-main"><span class="slot-name">${esc(e.name)}</span>${e.room ? `<span class="slot-sub">${esc(e.room)}</span>` : ''}${st.pill ? `<span class="slot-pill">${st.pill}</span>` : ''}</span>
      <button class="slot-del" aria-label="Xóa tiết ${esc(e.name)} ${dayLong(e.day)} ${e.start}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      ${st.cls === 'now' ? `<span class="slot-bar" style="--p:${st.p.toFixed(3)}" aria-hidden="true"></span>` : ''}
    </li>`;
  }
  function renderSlots() {
    const now = new Date();
    const list = tt.filter((e) => e.day === selDay).sort((a, b) => toMin(a.start) - toMin(b.start));
    const states = list.map((e) => slotState(e, now));
    const nextIdx = states.findIndex((s) => s.cls === 'upcoming');
    if (nextIdx > -1 && !states.some((s) => s.cls === 'now')) {
      const w = Math.round(states[nextIdx].wait);
      states[nextIdx] = { cls: 'next', pill: w < 60 ? `Sau ${w} phút` : `Sau ${Math.floor(w / 60)} giờ ${w % 60 ? (w % 60) + ' phút' : ''}`.trim() };
    }
    slotsEl.innerHTML = list.length ? list.map((e, i) => slotHTML(e, states[i])).join('') : `<li class="tt-empty">${dayLong(selDay)} chưa có tiết nào.</li>`;
    $('#ttSample').hidden = !ttSample;
    dayTabs.forEach((t) => { const n = tt.filter((e) => e.day === +t.dataset.d).length; t.querySelector('small').textContent = n ? n + ' tiết' : '–'; t.classList.toggle('is-today', +t.dataset.d === now.getDay()); });
  }
  function updateLive() { // cập nhật trạng thái mà không render lại (không giật)
    const now = new Date();
    if (selDay !== now.getDay()) return;
    const sig = tt.filter((e) => e.day === selDay).map((e) => slotState(e, now).cls).join();
    if (sig !== updateLive.sig) { updateLive.sig = sig; renderSlots(); return; }
    $$('.slot.now', slotsEl).forEach((row) => {
      const st = slotState(tt.find((e) => e.id === row.dataset.id), now);
      if (st.cls !== 'now') return;
      row.querySelector('.slot-bar')?.style.setProperty('--p', st.p.toFixed(3));
      row.querySelector('.slot-pill').textContent = st.pill;
    });
    if (!slotsEl.querySelector('.slot.now')) renderSlots();
  }
  function selectDay(t, { animate = true } = {}) {
    selDay = +t.dataset.d;
    dayTabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    slotsEl.setAttribute('aria-labelledby', t.id);
    Motion.slideTo(dayInd, t);
    $('#ttDay').value = selDay;
    if (animate) Motion.swap(slotsEl, () => { renderSlots(); staggerRows(); }); else renderSlots();
  }
  function staggerRows() {
    if (Motion.reduced()) return;
    $$('.slot', slotsEl).forEach((r, i) => Motion.animate(r, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: r.classList.contains('past') ? .55 : 1, transform: 'none' }], { dur: '--dur-pop', easing: '--spring-pop', delay: i * Motion.ms('--stagger') * 0.6, fill: 'backwards' }));
  }
  dayTabs.forEach((t, i) => {
    t.addEventListener('click', () => { if (+t.dataset.d !== selDay) selectDay(t); });
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); const n = dayTabs[(i + d + dayTabs.length) % dayTabs.length]; n.focus(); selectDay(n);
    });
  });
  const placeDayInd = () => { dayInd.__placed = false; Motion.slideTo(dayInd, dayTabs.find((x) => x.getAttribute('aria-selected') === 'true')); };
  selectDay(dayTabs.find((t) => +t.dataset.d === selDay), { animate: false });
  addEventListener('resize', placeDayInd); document.fonts?.ready.then(placeDayInd);
  setInterval(updateLive, 20000);

  slotsEl.addEventListener('click', (e) => {
    const del = e.target.closest('.slot-del'); if (!del) return;
    const row = del.closest('.slot'), id = row.dataset.id;
    leaveTTSample();
    Motion.animate(row, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }], { dur: '--dur-exit', easing: '--ease-out' })?.finished.then(() => {
      tt = tt.filter((x) => x.id !== id); saveTT(); renderSlots();
    }).catch(() => {});
  });

  const ttToggle = $('#ttToggle'), ttWrap = $('#ttFormWrap'), ttErr = $('#ttErr');
  ttToggle.addEventListener('click', () => {
    const open = ttToggle.getAttribute('aria-expanded') !== 'true';
    ttToggle.setAttribute('aria-expanded', open);
    Motion.disclose(ttWrap, open);
    if (open) { $('#ttDay').value = selDay; setTimeout(() => $('#ttName').focus({ preventScroll: true }), 50); }
  });
  $('#ttForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#ttName').value.trim(), day = +$('#ttDay').value, start = $('#ttStart').value, end = $('#ttEnd').value, room = $('#ttRoom').value.trim();
    let bad = null;
    if (!name) bad = ['#ttName', 'Nhập tên môn hoặc việc cần học.'];
    else if (!start || !end) bad = ['#ttStart', 'Chọn giờ bắt đầu và kết thúc.'];
    else if (toMin(end) <= toMin(start)) bad = ['#ttEnd', 'Giờ kết thúc phải sau giờ bắt đầu.'];
    if (bad) {
      ttErr.textContent = bad[1];
      Motion.animate($(bad[0]), [0, -6, 5, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })), { dur: '--dur-pop', easing: '--ease-in-out' });
      $(bad[0]).focus(); return;
    }
    const clash = tt.find((x) => x.day === day && toMin(start) < toMin(x.end) && toMin(end) > toMin(x.start));
    ttErr.textContent = '';
    leaveTTSample();
    const entry = { id: 'u' + Date.now().toString(36), day, start, end, name, room };
    tt.push(entry); saveTT();
    $('#ttName').value = ''; $('#ttRoom').value = '';
    const target = dayTabs.find((t) => +t.dataset.d === day);
    const reveal = () => { const row = slotsEl.querySelector(`[data-id="${entry.id}"]`); if (row) { row.hidden = true; Motion.enter(row, 'rise'); } };
    if (day !== selDay) { selectDay(target); setTimeout(reveal, Motion.ms('--dur-exit') + 20); }
    else { renderSlots(); reveal(); }
    toast(clash ? `Đã thêm ${name}. Lưu ý: trùng giờ với ${clash.name}.` : `Đã thêm ${name} vào ${dayLong(day)}.`);
  });

  /* ---------- Bảng điểm & GPA ---------- */
  const SCALE = [[8.5, 'A', 4], [8.0, 'B+', 3.5], [7.0, 'B', 3], [6.5, 'C+', 2.5], [5.5, 'C', 2], [5.0, 'D+', 1.5], [4.0, 'D', 1], [0, 'F', 0]];
  const conv = (s) => SCALE.find(([min]) => s >= min);
  const rankOf = (g) => g >= 3.6 ? 'Xuất sắc' : g >= 3.2 ? 'Giỏi' : g >= 2.5 ? 'Khá' : g >= 2.0 ? 'Trung bình' : 'Yếu';
  let grades = store.get('grades', null), gSample = false;
  if (!grades) {
    gSample = true;
    grades = [['Giải tích 1', 3, 8.2], ['Lập trình cơ bản', 4, 9.0], ['Tiếng Anh 1', 3, 7.4], ['Vật lý đại cương', 3, 6.8], ['Triết học Mác–Lênin', 3, 7.9]]
      .map(([name, tc, score], i) => ({ id: 'g' + i, name, tc, score }));
  }
  const gBody = $('#gBody'), gProg = $('#gProg'), GC = 2 * Math.PI * 42;
  gProg.style.strokeDasharray = GC; gProg.style.strokeDashoffset = GC;
  const saveGrades = () => { if (!gSample) store.set('grades', grades); };
  const leaveGSample = () => { if (gSample) { gSample = false; $('#gSample').hidden = true; } };
  const letterCls = (l) => 'l-' + l[0].toLowerCase();
  function gRow(g) {
    const [, l] = conv(g.score);
    return `<tr data-id="${g.id}">
      <td class="name">${esc(g.name)}</td>
      <td class="num"><input class="g-in tc" type="number" min="1" max="10" step="1" value="${g.tc}" aria-label="Tín chỉ ${esc(g.name)}" data-f="tc"></td>
      <td class="num"><input class="g-in" type="number" min="0" max="10" step="0.1" value="${g.score}" aria-label="Điểm ${esc(g.name)}" data-f="score"></td>
      <td class="num"><span class="letter ${letterCls(l)}">${l}</span></td>
      <td><button class="g-del" type="button" aria-label="Xóa môn ${esc(g.name)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></td>
    </tr>`;
  }
  function renderGrades() {
    gBody.innerHTML = grades.length ? grades.map(gRow).join('') : '<tr><td colspan="5" class="tt-empty">Chưa có môn nào. Thêm môn đầu tiên bên dưới.</td></tr>';
    $('#gSample').hidden = !gSample;
    updateGPA();
  }
  function tween(el, to, digits) {
    const from = parseFloat(el.textContent) || 0;
    if (Motion.reduced() || Math.abs(from - to) < 0.001) { el.textContent = to.toFixed(digits); return; }
    cancelAnimationFrame(el.__raf); const t0 = performance.now(), d = 700;
    const step = (now) => { const k = Math.min(1, (now - t0) / d); el.textContent = (from + (to - from) * (1 - Math.pow(1 - k, 3))).toFixed(digits); if (k < 1) el.__raf = requestAnimationFrame(step); };
    el.__raf = requestAnimationFrame(step);
  }
  let lastRank = null;
  function updateGPA() {
    const valid = grades.filter((g) => g.tc > 0 && g.score >= 0 && g.score <= 10);
    const tc = valid.reduce((s, g) => s + g.tc, 0);
    const g4 = tc ? valid.reduce((s, g) => s + conv(g.score)[2] * g.tc, 0) / tc : 0;
    const g10 = tc ? valid.reduce((s, g) => s + g.score * g.tc, 0) / tc : 0;
    tween($('#gpa4'), g4, 2); tween($('#gpa10'), g10, 2);
    $('#gCredits').textContent = tc;
    $('#gPassed').textContent = `${valid.filter((g) => g.score >= 4).length}/${valid.length}`;
    gProg.style.strokeDashoffset = GC * (1 - g4 / 4);
    gProg.style.stroke = g4 >= 3.2 ? 'var(--ok)' : g4 >= 2.5 ? 'var(--lamp)' : g4 >= 2 ? 'var(--break)' : 'var(--bad)';
    const rank = tc ? `Xếp loại: ${rankOf(g4)}` : 'Chưa có điểm';
    const rankEl = $('#gRank');
    if (rank !== lastRank) {
      if (lastRank === null) rankEl.textContent = rank;
      else Motion.swap(rankEl, (el) => (el.textContent = rank));
      lastRank = rank;
    }
  }
  gBody.addEventListener('input', (e) => {
    const inp = e.target.closest('.g-in'); if (!inp) return;
    const row = inp.closest('tr'), g = grades.find((x) => x.id === row.dataset.id);
    const v = parseFloat(inp.value), f = inp.dataset.f;
    const ok = !isNaN(v) && (f === 'tc' ? v >= 1 && v <= 10 && Number.isInteger(v) : v >= 0 && v <= 10);
    inp.classList.toggle('bad', !ok);
    if (!ok) return;
    leaveGSample();
    g[f] = v; saveGrades();
    if (f === 'score') {
      const [, l] = conv(v), badge = row.querySelector('.letter');
      if (badge.textContent !== l) {
        badge.textContent = l; badge.className = 'letter ' + letterCls(l);
        Motion.animate(badge, [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { dur: '--dur-pop', easing: '--spring-pop' });
      }
    }
    updateGPA();
  });
  gBody.addEventListener('focusout', (e) => { const inp = e.target.closest('.g-in.bad'); if (inp) { const g = grades.find((x) => x.id === inp.closest('tr').dataset.id); inp.value = g[inp.dataset.f]; inp.classList.remove('bad'); } });
  gBody.addEventListener('click', (e) => {
    const del = e.target.closest('.g-del'); if (!del) return;
    const row = del.closest('tr'); leaveGSample();
    Motion.animate(row, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }], { dur: '--dur-exit', easing: '--ease-out' })?.finished.then(() => {
      grades = grades.filter((x) => x.id !== row.dataset.id); saveGrades(); renderGrades();
    }).catch(() => {});
  });
  $('#gForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#gName').value.trim(), tc = parseInt($('#gTc').value, 10), score = parseFloat($('#gScore').value);
    let bad = null;
    if (!name) bad = ['#gName', 'Nhập tên môn.'];
    else if (!(tc >= 1 && tc <= 10)) bad = ['#gTc', 'Số tín chỉ từ 1 đến 10.'];
    else if (isNaN(score) || score < 0 || score > 10) bad = ['#gScore', 'Điểm từ 0 đến 10, ví dụ 7.5.'];
    if (bad) {
      $('#gErr').textContent = bad[1];
      Motion.animate($(bad[0]), [0, -6, 5, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })), { dur: '--dur-pop', easing: '--ease-in-out' });
      $(bad[0]).focus(); return;
    }
    $('#gErr').textContent = '';
    leaveGSample();
    const g = { id: 'u' + Date.now().toString(36), name, tc, score: Math.round(score * 10) / 10 };
    grades.push(g); saveGrades(); renderGrades();
    const row = gBody.querySelector(`[data-id="${g.id}"]`); if (row) Motion.animate(row, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { dur: '--dur-pop', easing: '--spring-pop' });
    $('#gName').value = ''; $('#gScore').value = ''; $('#gName').focus();
    toast(`Đã thêm ${name}: ${g.score} điểm (${conv(g.score)[1]}).`);
  });
  renderGrades();

  /* ---------- Ambient audio (Web Audio, không cần file) ---------- */
  const audio = (() => {
    let ctx = null; const nodes = {};
    function ensure() { if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    function noise(kind) {
      const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0, b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; return src;
    }
    function build(name) {
      const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
      let src;
      if (name === 'rain') { src = noise('pink'); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; src.connect(hp).connect(lp).connect(gain); }
      else if (name === 'waves') { src = noise('brown'); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; const swell = ctx.createGain(); swell.gain.value = 0.6; const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09; const depth = ctx.createGain(); depth.gain.value = 0.4; lfo.connect(depth).connect(swell.gain); lfo.start(); src.connect(lp).connect(swell).connect(gain); }
      else { src = noise('brown'); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280; src.connect(lp).connect(gain); }
      src.start(); return { gain, src };
    }
    return {
      unlock: ensure,
      toggle(name, on, vol) {
        if (!ensure()) return false;
        if (!nodes[name]) nodes[name] = build(name);
        const g = nodes[name].gain.gain; g.cancelScheduledValues(ctx.currentTime); g.setTargetAtTime(on ? vol : 0, ctx.currentTime, 0.35);
        return true;
      },
      volume(name, vol) { if (ctx && nodes[name] && nodes[name].on) nodes[name].gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1); },
      mark(name, on) { if (nodes[name]) nodes[name].on = on; },
      chime(soft) {
        if (!ensure()) return;
        const notes = soft ? [659.25, 523.25] : [523.25, 659.25, 783.99];
        notes.forEach((f, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.18;
          o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.5);
        });
      },
    };
  })();
  $$('.sound-btn').forEach((b) => b.addEventListener('click', () => {
    const name = b.dataset.sound, on = b.getAttribute('aria-pressed') !== 'true', vol = +$('#vol-' + name).value;
    if (!audio.toggle(name, on, vol)) { toast('Trình duyệt này không phát được âm thanh nền.'); return; }
    audio.mark(name, on); b.setAttribute('aria-pressed', on);
  }));
  ['rain', 'waves', 'hum'].forEach((n) => $('#vol-' + n).addEventListener('input', (e) => audio.volume(n, +e.target.value)));

  /* ---------- Theme ---------- */
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = store.get('theme', null); if (savedTheme) root.dataset.theme = savedTheme;
  $('#themeBtn').addEventListener('click', (e) => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => { root.dataset.theme = next; store.set('theme', next); };
    if (!document.startViewTransition || Motion.reduced()) { apply(); return; }
    const r0 = e.currentTarget.getBoundingClientRect(), x = r0.left + r0.width / 2, y = r0.top + r0.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
      { duration: Motion.ms('--dur-dialog') * 1.2, easing: Motion.token('--ease-out-soft'), pseudoElement: '::view-transition-new(root)' }));
  });

  /* ---------- Init ---------- */
  drawDots(); draw(); setPhaseText();
})();
