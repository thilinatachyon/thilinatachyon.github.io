// FlowLabs landing page — vanilla JS, no dependencies.
(() => {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const toTop = document.getElementById('to-top');

  // Sticky nav background + back-to-top button
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    toTop.classList.toggle('show', y > 700);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Mobile menu
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // Highlight the nav link for the section in view
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]:not(.btn)')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  // Cursor-follow glow on service cards
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // 3D tilt + shine on team cards (mouse only, skipped for reduced motion)
  const canTilt = matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.tilt').forEach((el) => {
    const max = el.classList.contains('spotlight') ? 4 : 8;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
      if (!canTilt) return;
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  // Contact form — no backend yet, so hand off to the visitor's email client.
  const form = document.getElementById('contact-form');
  const note = document.getElementById('form-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.textContent = 'Please fill in your name, a valid email and a message.';
      form.reportValidity();
      return;
    }
    const d = new FormData(form);
    const subject = `[${d.get('topic')}] Enquiry from ${d.get('name')}`;
    const body = `${d.get('message')}\n\n— ${d.get('name')} (${d.get('email')})`;
    const cc = form.dataset.cc ? `cc=${encodeURIComponent(form.dataset.cc)}&` : '';
    window.location.href = `mailto:${form.dataset.mailto}?${cc}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Your email app should open now. If it doesn’t, email us directly at ' + form.dataset.mailto + '.';
  });

  // Theme switcher — remembers the choice per visitor
  const root = document.documentElement;
  const themeSwitch = document.getElementById('theme-switch');
  const themeBtn = document.getElementById('theme-btn');
  const themeOpts = document.querySelectorAll('.theme-opt');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const themeBg = { dark: '#07080d', light: '#f5f6fb', ocean: '#050b16', sunset: '#0d0907' };

  const applyTheme = (name, animate) => {
    if (!themeBg[name]) name = 'dark';
    if (animate) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 400);
    }
    if (name === 'dark') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);
    themeOpts.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.themeValue === name)));
    if (metaTheme) metaTheme.setAttribute('content', themeBg[name]);
  };
  const setThemeMenu = (open) => {
    themeSwitch.classList.toggle('open', open);
    themeBtn.setAttribute('aria-expanded', String(open));
  };

  applyTheme(root.getAttribute('data-theme') || 'dark', false);
  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setThemeMenu(!themeSwitch.classList.contains('open'));
  });
  themeOpts.forEach((o) => o.addEventListener('click', () => {
    const name = o.dataset.themeValue;
    applyTheme(name, true);
    // a manual pick applies now; the next reload continues the cycle from this theme
    try { localStorage.setItem('flowlabs-last-theme', name); } catch (e) {}
    setThemeMenu(false);
  }));
  document.addEventListener('click', (e) => { if (!themeSwitch.contains(e.target)) setThemeMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setThemeMenu(false); });

  // EPCFlow preview tabs — auto-rotate until the visitor picks a tab
  const demo = document.getElementById('erp-demo');
  if (demo) {
    const tabs = [...demo.querySelectorAll('[role="tab"]')];
    const path = document.getElementById('demo-path');
    const ms = 2500;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0, timer = null, userPicked = false, inView = false;
    demo.style.setProperty('--demo-ms', ms + 'ms');

    const show = (i, focus) => {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        const on = k === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      path.textContent = tabs[current].dataset.tab;
      if (focus) tabs[current].focus();
      restart();
    };
    const stop = () => { clearTimeout(timer); demo.classList.remove('playing'); };
    const restart = () => {
      stop();
      if (userPicked || !inView || reduceMotion) return;
      void demo.offsetWidth; // restart the progress bar animation
      demo.classList.add('playing');
      timer = setTimeout(() => show(current + 1), ms);
    };

    tabs.forEach((t, k) => {
      t.addEventListener('click', () => { userPicked = true; show(k); });
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault(); userPicked = true; show(current + (e.key === 'ArrowRight' ? 1 : -1), true);
        }
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; restart(); }, { threshold: 0.4 }).observe(demo);
    }
  }

  // Module / feature explorers (EPCFlow, FlowSync) — accessible tabs, one set per explorer.
  // They auto-advance every 4s while on screen; any click or arrow key hands control to the visitor.
  const reduceMotionPref = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.mod-tabs').forEach((strip) => {
    const tabs = [...strip.querySelectorAll('[role="tab"]')];
    const explorer = strip.closest('.mod-explorer');
    const ms = 4000;
    let current = 0, timer = null, userPicked = false, inView = false;
    explorer.style.setProperty('--mod-ms', ms + 'ms');

    const stop = () => { clearTimeout(timer); explorer.classList.remove('playing'); };
    const play = () => {
      stop();
      if (userPicked || !inView || reduceMotionPref) return;
      void explorer.offsetWidth; // restart the progress bar on the active tab
      explorer.classList.add('playing');
      timer = setTimeout(() => show((current + 1) % tabs.length), ms);
    };
    const show = (i, focus) => {
      current = i;
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tabs[i].focus({ preventScroll: true });
      // On phones the tabs are a horizontal strip: scroll only the strip, never the page
      if (strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({ left: tabs[i].offsetLeft - strip.offsetLeft - 16, behavior: 'smooth' });
      }
      play();
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => { userPicked = true; show(k); });
      t.addEventListener('keydown', (e) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        userPicked = true;
        show((k + step + tabs.length) % tabs.length, true);
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; play(); }, { threshold: 0.35 }).observe(explorer);
    }
  });

  // Buttons with data-topic pre-select the contact form's "I'm interested in" option
  document.querySelectorAll('[data-topic]').forEach((btn) => btn.addEventListener('click', () => {
    const sel = document.getElementById('f-topic');
    const opt = [...sel.options].find((o) => o.text === btn.dataset.topic);
    if (opt) sel.value = opt.value;
  }));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
