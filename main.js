/* ============================================================
   NOVA — Web Studio · interactions
   ============================================================ */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  /* ---------- 2. Hero word reveal ---------- */
  const revealHero = () => {
    if (reduce || !window.gsap) return;
    const words = $$('.hero__title .word');
    gsap.fromTo(words, { y:'110%' }, { y:0, duration:1.1, ease:'expo.out', stagger:.09, delay:.05 });
    gsap.fromTo('.hero .reveal-up', { y:28, opacity:0 }, { y:0, opacity:1, duration:1, ease:'expo.out', stagger:.12, delay:.4 });
  };

  /* ---------- 3. Lenis smooth scroll ---------- */
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
        y:0, opacity:1, duration:1, ease:'expo.out', immediateRender:false,
        scrollTrigger:{ trigger:el, start:'top 88%' }
      });
    });

    // split-text word reveals (keeps <br> line breaks and em/italic spans intact)
    $$('[data-split]').forEach(el => {
      const parts = [];
      el.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(w => parts.push({ w }));
        } else if (node.nodeName === 'BR') {
          parts.push({ br: true });
        } else {
          const tag = node.nodeName.toLowerCase(), cls = node.className || '';
          node.textContent.split(/\s+/).filter(Boolean).forEach(w => parts.push({ w, tag, cls }));
        }
      });
      el.innerHTML = parts.map(p => p.br ? '<br/>' :
        `<span class="w" style="display:inline-block;overflow:hidden;vertical-align:top"><${p.tag||'span'} class="${p.cls||''}" style="display:inline-block">${p.w}</${p.tag||'span'}></span>`
      ).join(' ');
      gsap.fromTo(el.querySelectorAll('.w > *'), { yPercent:110 }, {
        yPercent:0, duration:1, ease:'expo.out', stagger:.03, immediateRender:false,
        scrollTrigger:{ trigger:el, start:'top 85%' }
      });
    });

    // services / steps stagger
    gsap.utils.toArray('[data-service]').forEach(el => {
      gsap.fromTo(el, { y:40, opacity:0 }, {
        y:0, opacity:1, duration:.9, ease:'power3.out', immediateRender:false,
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

  /* ---------- 4. Mobile menu ---------- */
  const initMenu = () => {
    const burger = $('[data-burger]');
    burger?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  };

  /* ---------- boot ---------- */
  const boot = () => {
    initGradient();
    revealHero();
    initLenis();
    initScroll();
    initMenu();
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 600);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
