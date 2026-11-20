/* =========================================================
   SOMAAMRIT — motion: scroll animations everywhere
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  document.documentElement.classList.remove("no-js");

  /* ---------- 1. tag elements with animation variants + stagger ---------- */
  const variants = {
    ".product": "zoom", ".pillar": "flip", ".step": "up", ".gift": "rotate", ".stat": "zoom",
    ".faq details": "right", ".crow": "left", ".signature__list li": "right", ".lab__points li": "left",
    ".shilajit__specs div": "up", ".ritual": "zoom", ".origins__map": "zoom", ".report": "rotate",
    ".compare__table": "up", ".slider": "zoom", ".verse__sa": "blur", ".verse__en": "blur", ".hero__arch": "zoom",
    ".footer__col": "up", ".footer__brand": "up", ".drip": "drip",
    ".signature__visual": "zoom", ".meet__points li": "right", ".shilajit__visual": "rotate", ".story__copy": "up",
  };
  Object.entries(variants).forEach(([sel, v]) => $$(sel).forEach((el) => {
    el.classList.add("reveal");
    if (v !== "up") el.dataset.anim = v;
  }));
  // let the comic book's own entrance animation read data-anim="book"
  const groups = [".products", ".pillars", ".steps", ".gift-grid", ".stats__grid", ".footer__grid", ".faq__list",
    ".signature__list", ".meet__points", ".lab__points", ".shilajit__specs", ".compare__table"];
  groups.forEach((g) => $$(g).forEach((parent) => {
    [...parent.children].filter((c) => c.classList.contains("reveal")).forEach((c, i) => c.style.setProperty("--d", `${Math.min(i * 0.09, 0.7)}s`));
  }));
  $$(".report__rows div").forEach((d, i) => d.style.setProperty("--n", i));
  $$(".gift__stage .pkg").forEach((p, i) => p.style.setProperty("--k", `${(i % 3) * 0.12}s`));

  /* ---------- 2. split headings into words ---------- */
  function splitWords(el) {
    const label = el.textContent.replace(/\s+/g, " ").trim();
    let wi = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            const inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--wi", wi++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.setAttribute("aria-label", label);
    el.dataset.split = "";
  }
  if (!reduce) {
    $$(".sec-head h2, .cta h2, .signature__copy h2, .shilajit h2, .lab__copy h2, .meet h2, .hero__title, .comic .sec-head h2").forEach((h) => {
      h.classList.remove("reveal");
      splitWords(h);
    });
  }

  /* ---------- 3. reveal observer ---------- */
  const unreveal = (el) => {
    const delay = (parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0) * 1000;
    setTimeout(() => { el.classList.remove("reveal", "is-in"); delete el.dataset.anim; }, 1500 + delay);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-in");
      el.setAttribute("data-seen", "");
      io.unobserve(el);
      if (el.classList.contains("reveal") && !el.hasAttribute("data-split")) unreveal(el);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -50px 0px" });
  $$(".reveal, [data-split]").forEach((el) => {
    if (reduce) { el.classList.add("is-in"); el.setAttribute("data-seen", ""); return; }
    io.observe(el);
  });
  // the hero is above the fold: trigger its split title on load
  requestAnimationFrame(() => $$(".hero [data-split]").forEach((el) => { el.style.setProperty("--d", ".15s"); }));

  /* ---------- 4. generic particles (hero, verse, cta) ---------- */
  const makePollen = (host, count) => {
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.style.left = `${Math.random() * 100}%`;
      p.style.setProperty("--s", `${3 + Math.random() * 6}px`);
      p.style.setProperty("--t", `${10 + Math.random() * 14}s`);
      p.style.setProperty("--delay", `${-Math.random() * 20}s`);
      p.style.setProperty("--dx", `${(Math.random() - 0.5) * 160}px`);
      host.appendChild(p);
    }
  };
  if (!reduce) {
    const n = window.innerWidth < 640 ? 10 : 22;
    const heroP = $("#pollen");
    if (heroP) { heroP.classList.add("pollen"); makePollen(heroP, n + 6); }
    ["#join", ".verse", ".signature"].forEach((sel) => {
      const sec = $(sel);
      if (!sec) return;
      const host = document.createElement("div");
      host.className = "pollen";
      host.setAttribute("aria-hidden", "true");
      sec.prepend(host);
      makePollen(host, n);
    });
  }

  /* ---------- 5. scroll loop: progress, header, parallax, spin, journey ---------- */
  const progress = document.createElement("div");
  progress.className = "progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  const header = $(".header");
  const hero = $(".hero");
  const heroGrid = $(".hero__grid");
  const layers = $$(".hero__range path");
  const comicSection = $(".comic");
  const steps = $(".steps");
  const stepEls = $$(".step");
  const tracks = [$(".marquee__track"), $(".announce__track")].filter(Boolean);

  const par = [
    [".hero__visual", -0.05], [".float-card--a", -0.1], [".float-card--b", 0.09], [".hero__seal", 0.07],
    [".signature__halo", 0.1], [".signature__dipper", -0.1], [".shilajit__slate", -0.06], [".verse__glow", 0.14],
    [".report", 0.05], [".origins__card", -0.04], [".cbook", 0],
  ].flatMap(([sel, speed]) => $$(sel).map((el) => ({ el, speed, cur: 0 }))).filter((p) => p.speed);
  const spins = $$(".verse__mark");

  let lastY = window.scrollY;
  let dir = 1, rate = 1;
  const anims = [];
  tracks.forEach((t) => t.getAnimations().forEach((a) => { a.currentTime = 600000; anims.push(a); }));

  let ticking = false;
  function frame() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    progress.style.setProperty("--p", clamp(y / (doc.scrollHeight - vh), 0, 1));

    // header hides while scrolling down
    if (header && !document.body.classList.contains("menu-open")) {
      const d = y - lastY;
      if (y > 420 && d > 6) header.classList.add("is-hidden");
      else if (d < -6 || y < 420) header.classList.remove("is-hidden");
    }

    // marquee speed + direction follow scroll
    const v = y - lastY;
    if (v !== 0) dir = v > 0 ? 1 : -1;
    const target = dir * (1 + Math.min(Math.abs(v) * 0.22, 7));
    rate += (target - rate) * 0.12;
    anims.forEach((a) => { try { a.updatePlaybackRate(rate); } catch (_) {} });
    lastY = y;

    if (reduce) return;

    // hero scroll-out
    if (hero && y < vh * 1.2) {
      const t = clamp(y / (vh * 0.8), 0, 1);
      if (heroGrid) { heroGrid.style.translate = `0 ${y * 0.18}px`; heroGrid.style.opacity = String(1 - t * 0.9); }
      layers.forEach((l, i) => { l.style.translate = `0 ${y * (0.1 - i * 0.035)}px`; });
    }

    // parallax (uses the independent `translate` property so it never fights CSS animations)
    par.forEach((p) => {
      const r = p.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const center = r.top + r.height / 2 - p.cur;
      p.cur = (center - vh / 2) * p.speed;
      p.el.style.translate = `0 ${p.cur.toFixed(1)}px`;
    });
    spins.forEach((s) => { s.style.rotate = `${(y * 0.06) % 360}deg`; });
    if (comicSection) comicSection.style.setProperty("--bgy", (y * 0.25).toFixed(0));

    // journey line + lit steps
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.2), 0, 1);
      steps.style.setProperty("--p", p.toFixed(3));
      stepEls.forEach((s, i) => s.classList.toggle("is-lit", p > (i + 0.4) / stepEls.length));
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  // keep the marquee gliding even when the page is idle
  setInterval(() => { if (!ticking && Math.abs(rate) > 1.02) request(); }, 60);
  frame();

  /* ---------- 6. 3D tilt + magnetic buttons ---------- */
  if (fine && !reduce) {
    $$(".product, .pillar, .gift").forEach((card) => {
      card.classList.add("tilt");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-y * 9).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
    });
    $$(".btn--gold, .btn--forest, .cbtn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`;
      });
      b.addEventListener("pointerleave", () => { b.style.translate = "0 0"; });
    });
  }

  /* ---------- 7. smooth FAQ accordion ---------- */
  $$(".faq details").forEach((d) => {
    const sum = $("summary", d);
    const body = $("p", d);
    let anim = null;
    sum.addEventListener("click", (e) => {
      if (reduce) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (d.open) {
        const h = body.offsetHeight;
        anim = body.animate({ height: [`${h}px`, "0px"], opacity: [1, 0] }, { duration: 320, easing: "ease" });
        anim.onfinish = () => { d.open = false; anim = null; };
      } else {
        d.open = true;
        const h = body.offsetHeight;
        anim = body.animate({ height: ["0px", `${h}px`], opacity: [0, 1] }, { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
        anim.onfinish = () => { anim = null; };
      }
    });
  });
})();
