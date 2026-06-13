/* ============================================================
   NOVA — Web Studio · interactions
   ============================================================ */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  document.querySelector('[data-year]').textContent = new Date().getFullYear();

  /* ---------- 1. Animated hero gradient (canvas) ---------- */
  const initGradient = () => {
    const canvas = $('[data-gradient]');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, t = 0, raf;
    const blobs = [
      { x:.25, y:.35, r:.55, col:[216,255,71] },   // lime
      { x:.75, y:.55, r:.6,  col:[60,80,40]   },   // deep olive
      { x:.55, y:.2,  r:.45, col:[30,40,25]   },
      { x:.85, y:.85, r:.5,  col:[120,150,60] },
    ];
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0b0a';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      blobs.forEach((b, i) => {
        const ox = Math.sin(t * .0006 + i * 1.7) * .12;
        const oy = Math.cos(t * .0005 + i * 2.3) * .12;
        const cx = (b.x + ox) * w, cy = (b.y + oy) * h;
        const rad = b.r * Math.max(w, h) * (.8 + Math.sin(t*.001+i)*.08);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const [r,gr,bl] = b.col;
        g.addColorStop(0, `rgba(${r},${gr},${bl},${i===0?.5:.32})`);
        g.addColorStop(1, 'rgba(10,11,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      t += 16;
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    addEventListener('resize', resize);
    if (reduce) { cancelAnimationFrame(raf); draw(); cancelAnimationFrame(raf); }
  };

  /* ---------- 2. Loader ---------- */
  const initLoader = () => {
    const loader = $('.loader');
    const countEl = $('[data-count]');
    const bar = $('.loader__bar span');
    let n = 0;
    const dur = reduce ? 250 : 1300;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      n = Math.round(eased * 100);
      countEl.textContent = n;
      bar.style.width = n + '%';
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    };
    const finish = () => {
      loader.classList.add('is-done');
      document.body.style.overflow = '';
      revealHero();
      setTimeout(() => loader.remove(), 1100);
    };
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(tick);
  };

  /* ---------- 3. Hero word reveal ---------- */
  const revealHero = () => {
    const words = $$('.hero__title .word');
    if (reduce) { words.forEach(w => w.style.transform='none'); return; }
    if (window.gsap) {
      gsap.to(words, { y:0, duration:1.1, ease:'expo.out', stagger:.09, delay:.05 });
      gsap.fromTo('.hero .reveal-up', { y:28, opacity:0 }, { y:0, opacity:1, duration:1, ease:'expo.out', stagger:.12, delay:.4 });
    } else {
      words.forEach(w => w.style.transform='none');
    }
  };

  /* ---------- 4. Custom cursor + magnetic ---------- */
  const initCursor = () => {
    if (!hasFinePointer) return;
    const cursor = $('.cursor');
    const dot = $('.cursor__dot'), ring = $('.cursor__ring');
    let mx=innerWidth/2, my=innerHeight/2, rx=mx, ry=my;
    addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });
    const loop = () => { rx += (mx-rx)*.18; ry += (my-ry)*.18; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(loop); };
    loop();
    $$('a, button, [data-magnetic], [data-tilt], .service').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    // magnetic pull
    $$('[data-magnetic]').forEach(el => {
      const strength = el.hasAttribute('data-strong') ? .5 : .3;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width/2) * strength;
        const y = (e.clientY - r.top - r.height/2) * strength;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform=''; });
    });
  };

  /* ---------- 5. Lenis smooth scroll ---------- */
  let lenis;
  const initLenis = () => {
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ duration:1.1, easing:t => Math.min(1, 1.001 - Math.pow(2, -10*t)), smoothWheel:true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    // anchor links
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset:0 }); document.body.classList.remove('menu-open'); }
    }));
  };

  /* ---------- 6. GSAP scroll animations ---------- */
  const initScroll = () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduce) { $$('.reveal-up').forEach(e=>{e.style.opacity=1;e.style.transform='none';}); return; }

    // generic reveal-up (skip hero, handled by loader)
    $$('.reveal-up').forEach(el => {
      if (el.closest('.hero')) return;
      gsap.fromTo(el, { y:28, opacity:0 }, {
        y:0, opacity:1, duration:1, ease:'expo.out',
        scrollTrigger:{ trigger:el, start:'top 88%' }
      });
    });

    // split-text word reveals
    $$('[data-split]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(w => `<span class="w" style="display:inline-block;overflow:hidden;vertical-align:top"><span style="display:inline-block">${w}</span></span>`).join(' ');
      gsap.fromTo(el.querySelectorAll('.w > span'), { yPercent:110 }, {
        yPercent:0, duration:1, ease:'expo.out', stagger:.03,
        scrollTrigger:{ trigger:el, start:'top 85%' }
      });
    });

    // services / steps stagger
    gsap.utils.toArray('[data-service]').forEach(el => {
      gsap.fromTo(el, { y:40, opacity:0 }, {
        y:0, opacity:1, duration:.9, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 90%' }
      });
    });

    // horizontal pinned work track
    const track = $('[data-track]'), inner = $('[data-track-inner]');
    if (track && inner && innerWidth > 760) {
      const getScroll = () => inner.scrollWidth - innerWidth + 80;
      gsap.to(inner, {
        x: () => -getScroll(),
        ease:'none',
        scrollTrigger:{
          trigger:track,
          start:'top top',
          end:() => '+=' + getScroll(),
          pin:true, scrub:1, invalidateOnRefresh:true
        }
      });
    }

    // counters
    $$('[data-target]').forEach(el => {
      const target = +el.dataset.target, suffix = el.dataset.suffix || '';
      const obj = { v:0 };
      ScrollTrigger.create({
        trigger:el, start:'top 90%', once:true,
        onEnter:() => gsap.to(obj, { v:target, duration:1.8, ease:'power2.out',
          onUpdate:() => el.textContent = Math.round(obj.v) + suffix })
      });
    });

    // nav hide on scroll-down
    let last = 0;
    const nav = $('[data-nav]');
    ScrollTrigger.create({
      start:0, end:'max',
      onUpdate:self => {
        const y = self.scroll();
        if (y > 200 && y > last) nav.classList.add('is-hidden');
        else nav.classList.remove('is-hidden');
        last = y;
      }
    });

    // scroll progress bar
    const prog = $('.scrollbar span');
    ScrollTrigger.create({ start:0, end:'max', onUpdate:self => prog.style.transform = `scaleX(${self.progress})` });
  };

  /* ---------- 7. Marquee drift ---------- */
  const initMarquee = () => {
    $$('[data-marquee]').forEach(m => {
      let x = 0, speed = m.classList.contains('marquee--big') ? .4 : .6;
      const half = m.scrollWidth / 2;
      const step = () => {
        x -= speed;
        if (-x >= half) x = 0;
        m.style.transform = `translateX(${x}px)`;
        requestAnimationFrame(step);
      };
      if (!reduce) step();
    });
  };

  /* ---------- 8. Mobile menu ---------- */
  const initMenu = () => {
    const burger = $('[data-burger]');
    burger?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  };

  /* ---------- boot ---------- */
  const boot = () => {
    initGradient();
    initLoader();
    initCursor();
    initLenis();
    initScroll();
    initMarquee();
    initMenu();
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 600);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
