/* Emanuele Ambrogi – interazioni e animazioni */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: stato allo scroll + menu mobile */
  const header = document.querySelector('.header');
  const mobileCta = document.querySelector('.mobile-cta');
  const forms = [...document.querySelectorAll('.form-card, .footer')];
  const onScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle('is-scrolled', y > 40);
    if (mobileCta) {
      // nascosta sopra la piega e quando il modulo o il footer sono visibili
      const overForm = forms.some(f => {
        const r = f.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      const nearTop = document.body.dataset.ctaFrom === 'top' ? false : y < window.innerHeight * 0.6;
      mobileCta.classList.toggle('show', !nearTop && !overForm);
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = document.querySelector('.burger');
  burger && burger.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => header.classList.remove('menu-open')));

  /* Titoli che si rivelano parola per parola */
  document.querySelectorAll('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  });

  /* Reveal allo scroll */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, [data-split], [data-observe]').forEach(el => io.observe(el));

  /* Domande che si "accendono" passando al centro dello schermo */
  const qs = [...document.querySelectorAll('.questions li')];
  /* Step del metodo + linea di avanzamento */
  const steps = [...document.querySelectorAll('.step')];
  const line = document.querySelector('.steps-line i');
  const stepsWrap = document.querySelector('.steps');
  const checks = [...document.querySelectorAll('.check')];

  const onScrollFx = () => {
    const mid = window.innerHeight * 0.62;
    qs.forEach(li => li.classList.toggle('is-lit', li.getBoundingClientRect().top < mid));

    if (stepsWrap && line) {
      const r = stepsWrap.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      line.style.setProperty('--p', p.toFixed(3));
      let on = 0;
      steps.forEach(s => {
        const lit = s.getBoundingClientRect().top < mid;
        s.classList.toggle('is-on', lit);
        if (lit) on++;
      });
      checks.forEach((c, idx) => c.classList.toggle('done', idx < on));
    }
  };
  if (qs.length || steps.length) {
    onScrollFx();
    window.addEventListener('scroll', onScrollFx, { passive: true });
    window.addEventListener('resize', onScrollFx);
  }

  /* Hero: una sola sfumatura che segue il cursore, lenta e fluida.
     Senza cursore (telefono/tablet) si muove da sola, piano. */
  const panel = document.querySelector('.hero-panel');
  const glow = document.querySelector('.cursor-glow');
  if (panel && glow) {
    const FOLLOW_TIME = 1.4; // secondi per raggiungere il cursore: più alto = più lento
    const r0 = panel.getBoundingClientRect();
    let tx = r0.width * .65, ty = r0.height * .45, x = tx, y = ty, last = 0;
    const set = () => { glow.style.setProperty('--gx', x.toFixed(1) + 'px'); glow.style.setProperty('--gy', y.toFixed(1) + 'px'); };
    set();
    if (!reduce && window.matchMedia('(pointer: fine)').matches) {
      let raf = null;
      const loop = now => {
        const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
        const k = 1 - Math.exp(-dt * 3 / FOLLOW_TIME);
        x += (tx - x) * k; y += (ty - y) * k; set();
        if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
      };
      panel.addEventListener('pointermove', e => {
        const r = panel.getBoundingClientRect();
        tx = e.clientX - r.left;
        ty = e.clientY - r.top - (window.scrollY < window.innerHeight * 1.2 ? window.scrollY * 0.25 : 0);
        panel.classList.add('has-cursor');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      panel.addEventListener('pointerleave', () => panel.classList.remove('has-cursor'));
    } else if (!reduce) {
      // movimento autonomo lento su un percorso morbido
      const t0 = performance.now();
      const drift = now => {
        const t = (now - t0) / 1000, r = panel.getBoundingClientRect();
        x = r.width * (.55 + .3 * Math.sin(t * .23));
        y = r.height * (.45 + .25 * Math.sin(t * .17 + 1.3));
        set(); requestAnimationFrame(drift);
      };
      requestAnimationFrame(drift);
    }
  }

  /* Parallax leggero sui blob dell'hero */
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && !reduce) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) heroBg.style.transform = `translateY(${y * 0.25}px)`;
    }, { passive: true });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });

  /* Slider testimonianze */
  document.querySelectorAll('[data-slider]').forEach(root => {
    const track = root.querySelector('.slides');
    const slides = [...track.children];
    const dots = root.querySelector('.dots');
    let index = 0;
    const perView = () => (window.innerWidth <= 860 ? 1 : window.innerWidth <= 1024 ? 2 : 3);
    const max = () => Math.max(0, slides.length - perView());
    const render = () => {
      index = Math.min(index, max());
      const step = slides[0].getBoundingClientRect().width + 20;
      track.style.transform = `translateX(${-index * step}px)`;
      if (dots) {
        dots.innerHTML = '';
        for (let i = 0; i <= max(); i++) {
          const d = document.createElement('i');
          if (i === index) d.className = 'on';
          dots.appendChild(d);
        }
      }
    };
    root.querySelector('[data-prev]')?.addEventListener('click', () => { index = index <= 0 ? max() : index - 1; render(); });
    root.querySelector('[data-next]')?.addEventListener('click', () => { index = index >= max() ? 0 : index + 1; render(); });
    // swipe su mobile
    let x0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { index = dx < 0 ? Math.min(max(), index + 1) : Math.max(0, index - 1); render(); }
      x0 = null;
    });
    window.addEventListener('resize', render);
    render();
  });

  /* Modulo: per ora conferma solo a schermo.
     TODO: collegare al foglio Google dei lead + evento Meta "Lead". */
  document.querySelectorAll('form[data-lead]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const card = form.closest('.form-card');
      card.classList.add('sent');
      card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      // if (window.fbq) fbq('track', 'Lead');
    });
  });

  /* Anno nel footer */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();

/* Testo che si "accende" parola per parola mentre si scorre (pagina Chi sono) */
(() => {
  const els = [...document.querySelectorAll('[data-lit]')];
  if (!els.length) return;
  const all = [];
  els.forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="lw">${w}</span>`).join(' ');
    all.push(...el.querySelectorAll('.lw'));
  });
  const update = () => {
    const line = window.innerHeight * 0.7;
    all.forEach(w => w.classList.toggle('on', w.getBoundingClientRect().top < line));
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

/* Footer: la luce segue il cursore (lenta, come nell'hero) e rivela le parole */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.footer').forEach(footer => {
    const word = footer.querySelector('.footer-word');
    if (!word) return;
    const FOLLOW_TIME = 1.4;
    let tx = 0.5, ty = 0.5, x = 0.5, y = 0.5, last = 0, raf = null;
    const set = () => { word.style.setProperty('--fx', (x * 100).toFixed(2) + '%'); word.style.setProperty('--fy', (y * 100).toFixed(2) + '%'); };
    set();
    if (reduce) { word.classList.add('lit'); return; }
    if (window.matchMedia('(pointer: fine)').matches) {
      const loop = now => {
        const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
        const k = 1 - Math.exp(-dt * 3 / FOLLOW_TIME);
        x += (tx - x) * k; y += (ty - y) * k; set();
        if (Math.abs(tx - x) + Math.abs(ty - y) > 0.0005) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
      };
      footer.addEventListener('pointermove', e => {
        const r = word.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
        word.classList.add('lit');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      footer.addEventListener('pointerleave', () => word.classList.remove('lit'));
    } else {
      // senza cursore: la luce scorre da sola lungo la scritta
      word.classList.add('lit');
      const t0 = performance.now();
      const drift = now => { const t = (now - t0) / 1000; x = .5 + .45 * Math.sin(t * .35); y = .5 + .2 * Math.sin(t * .5); set(); requestAnimationFrame(drift); };
      requestAnimationFrame(drift);
    }
  });
})();

/* Card "Come funziona": la luce interna segue il cursore */
(() => {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('.how-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();
