/* ============================================================
   html-motion — helper JS (không thư viện, Web Animations API)
   Nạp bằng thẻ script (src="js/motion.js", defer) rồi dùng window.Motion.
   Khi dán thẳng vào HTML: file này không chứa chuỗi đóng thẻ script.
   Đọc mọi giá trị từ token CSS trong motion.css.
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('m-js');

  const root = document.documentElement;
  const rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => rmq.matches;

  // ---- Token helpers ----
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  function ms(name) {
    // --dur-* là calc(Xms * var(--tempo)) → tự tính
    const raw = css(name);
    const m = raw.match(/([\d.]+)ms/);
    const base = m ? parseFloat(m[1]) : parseFloat(raw) || 300;
    const tempo = parseFloat(css('--tempo')) || 1;
    return raw.includes('tempo') ? base * tempo : base;
  }
  let linearOK = true;
  try { document.createElement('div').animate([{ opacity: 0 }, { opacity: 1 }], { easing: 'linear(0, 1)', duration: 1 }).cancel(); }
  catch (e) { linearOK = false; }
  function ease(name) {
    const v = css(name);
    if (v.startsWith('linear(') && !linearOK) return css('--ease-out'); // trình duyệt cũ
    return v || 'ease-out';
  }

  // ---- Reduced motion: bỏ transform/filter di chuyển, giữ opacity ----
  function calm(frames) {
    return frames.map((f) => {
      const g = { ...f };
      delete g.transform; delete g.translate; delete g.scale; delete g.rotate;
      if (g.filter && /blur/.test(g.filter)) delete g.filter;
      return g;
    });
  }

  // ---- animate(): mọi chuyển động đi qua đây ----
  // Bấm lại giữa chừng → tiếp tục từ trạng thái hiện tại (retarget), không giật về đầu.
  function animate(el, frames, { dur = '--dur-pop', easing = '--spring-pop', delay = 0, fill = 'both' } = {}) {
    if (!el) return null;
    const prev = el.__m;
    if (prev && prev.playState === 'running') {
      const cs = getComputedStyle(el);
      frames = [{ transform: cs.transform === 'none' ? 'none' : cs.transform, opacity: cs.opacity, filter: cs.filter === 'none' ? 'blur(0px)' : cs.filter }, frames[frames.length - 1]];
      prev.cancel();
    }
    const r = reduced();
    const a = el.animate(r ? calm(frames) : frames, {
      duration: r ? Math.min(ms(dur), 250) : ms(dur),
      easing: r ? 'ease-out' : ease(easing),
      delay: r ? 0 : delay,
      fill,
    });
    el.__m = a;
    return a;
  }

  // ---- Presets enter / exit (mức expressive) ----
  const presets = {
    popover: {
      in: () => [{ opacity: 0, transform: `scale(${css('--scale-popover')})`, filter: `blur(${css('--blur-swap')})` }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }],
      inOpt: { dur: '--dur-pop', easing: '--spring-pop' },
      out: () => [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: `scale(${css('--scale-menu')})` }],
    },
    menu: {
      in: () => [{ opacity: 0, transform: `scale(${css('--scale-menu')}) translateY(-4px)` }, { opacity: 1, transform: 'none' }],
      inOpt: { dur: '--dur-pop', easing: '--spring-pop' },
      out: () => [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.95)' }],
    },
    dialog: {
      in: () => [{ opacity: 0, transform: `translateY(${css('--shift-md')}) scale(${css('--scale-dialog')})`, filter: `blur(${css('--blur-swap')})` }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
      inOpt: { dur: '--dur-dialog', easing: '--spring-dialog' },
      out: () => [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${css('--shift-sm')}) scale(0.96)` }],
      outOpt: { dur: '--dur-exit', easing: '--ease-dismiss' },
    },
    sheet: { // từ cạnh phải; đặt data-side="left|bottom" để đổi
      in: (el) => [{ transform: sideT(el) }, { transform: 'none' }],
      inOpt: { dur: '--dur-dialog', easing: '--spring-dialog' },
      out: (el) => [{ transform: 'none' }, { transform: sideT(el) }],
      outOpt: { dur: '--dur-exit', easing: '--ease-dismiss' },
    },
    toast: {
      in: () => [{ opacity: 0, transform: `translateY(${css('--shift-lg')}) scale(0.9)` }, { opacity: 1, transform: 'none' }],
      inOpt: { dur: '--dur-bounce', easing: '--spring-bounce' },
      out: () => [{ opacity: 1 }, { opacity: 0, transform: 'translateX(40%)' }],
    },
    rise: { // khối nội dung, hero, card list
      in: () => [{ opacity: 0, transform: `translateY(${css('--shift-lg')}) scale(0.96)`, filter: `blur(${css('--blur-enter')})` }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
      inOpt: { dur: '--dur-bounce', easing: '--spring-bounce' },
      out: () => [{ opacity: 1 }, { opacity: 0, transform: `translateY(-${css('--shift-sm')})` }],
    },
    pop: { // huy hiệu, icon thành công
      in: () => [{ opacity: 0, transform: 'scale(0.3) rotate(-12deg)' }, { opacity: 1, transform: 'none' }],
      inOpt: { dur: '--dur-delight', easing: '--spring-delight' },
      out: () => [{ opacity: 1 }, { opacity: 0, transform: 'scale(0.6)' }],
    },
  };
  function sideT(el) {
    const s = el.dataset.side || 'right';
    return { right: 'translateX(100%)', left: 'translateX(-100%)', bottom: 'translateY(100%)', top: 'translateY(-100%)' }[s];
  }

  // Phần tử dùng thuộc tính `hidden` để ẩn/hiện.
  function enter(el, kind = 'rise', opt = {}) {
    const p = presets[kind];
    el.hidden = false;
    return animate(el, p.in(el), { ...p.inOpt, ...opt });
  }
  function exit(el, kind = 'rise', opt = {}) {
    const p = presets[kind];
    const a = animate(el, p.out(el), { dur: '--dur-exit', easing: '--ease-out', ...p.outOpt, ...opt });
    if (a) a.finished.then(() => { el.hidden = true; a.cancel(); }).catch(() => {});
    return a;
  }

  // Mọc từ trigger: đặt transform-origin của popup về phía nút mở nó.
  function originFrom(popup, trigger) {
    const p = popup.getBoundingClientRect(), t = trigger.getBoundingClientRect();
    const x = t.left + t.width / 2 - p.left, y = t.top + t.height / 2 - p.top;
    popup.style.transformOrigin = `${x}px ${y < 0 ? 0 : y > p.height ? p.height : y}px`;
  }

  // ---- Reveal khi cuộn (thêm .m-reveal vào HTML) ----
  function reveal(selector = '.m-reveal', { group = '[data-stagger]' } = {}) {
    document.querySelectorAll(group).forEach((g) => {
      [...g.querySelectorAll(selector)].forEach((el, i) => el.style.setProperty('--i', i));
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll(selector).forEach((el) => io.observe(el));
    return io;
  }

  // ---- Stagger entrance cho danh sách (ngay lập tức, không chờ cuộn) ----
  function stagger(els, kind = 'rise') {
    const step = ms('--stagger');
    return [...els].map((el, i) => enter(el, kind, { delay: i * step }));
  }

  // ---- Đổi nội dung tại chỗ: mờ + blur (không scale chữ) ----
  async function swap(el, update) {
    const out = animate(el, [{ opacity: 1, filter: 'blur(0px)', transform: 'none' }, { opacity: 0, filter: `blur(${css('--blur-swap')})`, transform: `translateY(-${css('--shift-sm')})` }], { dur: '--dur-exit', easing: '--ease-out' });
    if (out) await out.finished.catch(() => {});
    update(el);
    return animate(el, [{ opacity: 0, filter: `blur(${css('--blur-swap')})`, transform: `translateY(${css('--shift-sm')})` }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }], { dur: '--dur-pop', easing: '--spring-pop' });
  }

  // ---- Đếm số ----
  function counter(el, to, { from = 0, dur = '--dur-delight', decimals = 0, locale = 'vi-VN' } = {}) {
    const d = reduced() ? 0 : ms(dur) * 1.4;
    const fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const t0 = performance.now();
    cancelAnimationFrame(el.__raf);
    const tick = (now) => {
      const k = d ? Math.min(1, (now - t0) / d) : 1;
      const e = 1 - Math.pow(1 - k, 4); // ease-out quart
      el.textContent = fmt.format(from + (to - from) * e);
      if (k < 1) el.__raf = requestAnimationFrame(tick);
    };
    el.__raf = requestAnimationFrame(tick);
  }

  // ---- Thanh chỉ báo trượt (tabs, segmented control) ----
  // indicator: phần tử position:absolute bên trong container position:relative
  function slideTo(indicator, target) {
    const c = indicator.offsetParent.getBoundingClientRect(), t = target.getBoundingClientRect();
    const to = { transform: `translate(${t.left - c.left}px, ${t.top - c.top}px)`, width: `${t.width}px`, height: `${t.height}px` };
    if (!indicator.__placed || reduced()) {
      Object.assign(indicator.style, to); indicator.__placed = true; return null;
    }
    const cs = getComputedStyle(indicator);
    const a = indicator.animate([{ transform: cs.transform, width: cs.width, height: cs.height }, to], { duration: ms('--dur-pop'), easing: ease('--spring-pop') });
    Object.assign(indicator.style, to);
    return a;
  }

  // ---- Accordion / disclosure: animate height (ngoại lệ hợp lệ) ----
  function disclose(panel, open) {
    const from = panel.hidden ? 0 : panel.getBoundingClientRect().height;
    panel.hidden = false;
    panel.style.overflow = 'hidden';
    const to = open ? panel.scrollHeight : 0;
    const a = panel.animate(
      [{ height: from + 'px', opacity: open ? 0 : 1 }, { height: to + 'px', opacity: open ? 1 : 0 }],
      { duration: reduced() ? 0 : ms('--dur-disclosure'), easing: css('--ease-out-soft') }
    );
    a.finished.then(() => { panel.style.overflow = ''; if (!open) panel.hidden = true; }).catch(() => {});
    return a;
  }

  // ---- Đổi trang / view: View Transitions API nếu có ----
  function transition(update) {
    if (!document.startViewTransition || reduced()) { update(); return Promise.resolve(); }
    return document.startViewTransition(update).finished;
  }

  // ---- Vòng lặp chỉ chạy khi nhìn thấy ----
  function loopWhenVisible(el, frames, opt = {}) {
    const a = el.animate(frames, { duration: 2400, iterations: Infinity, easing: 'ease-in-out', ...opt });
    a.pause();
    if (reduced()) return a;
    new IntersectionObserver(([e]) => (e.isIntersecting ? a.play() : a.pause())).observe(el);
    return a;
  }

  // ---- Tempo toàn trang ----
  function setTempo(v) { root.style.setProperty('--tempo', Math.min(2, Math.max(0.5, v))); }

  window.Motion = { animate, enter, exit, originFrom, reveal, stagger, swap, counter, slideTo, disclose, transition, loopWhenVisible, setTempo, reduced, token: css, ms };
})();
