/* =========================================================
   SOMAAMRIT — interactive comic book
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const book = $("#comicBook");
  if (!book) return;

  const stage = $("#comicStage");
  const pages = $$(".cpage", stage);
  const dotsWrap = $("#comicDots");
  const label = $("#comicLabel");
  const prevBtn = $("#comicPrev");
  const nextBtn = $("#comicNext");
  const hint = $("#comicHint");
  let idx = 0;
  let busy = false;
  let learned = false;

  // the reader has driven the controls themselves: calm the hint + Next nudge
  function learn() {
    if (learned) return;
    learned = true;
    nextBtn.classList.remove("is-nudge");
    if (hint) hint.classList.add("is-learned");
  }

  // panel stagger index per page
  pages.forEach((pg) => $$(".panel", pg).forEach((p, i) => p.style.setProperty("--i", i)));

  /* ---------- dots ---------- */
  pages.forEach((pg, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Page ${i + 1}: ${pg.dataset.title}`);
    b.addEventListener("click", () => { learn(); go(i); });
    dotsWrap.appendChild(b);
  });
  const dots = $$("button", dotsWrap);

  function update() {
    dots.forEach((d, i) => { d.classList.toggle("is-active", i === idx); d.setAttribute("aria-selected", String(i === idx)); });
    label.textContent = `Page ${idx + 1} of ${pages.length} · ${pages[idx].dataset.title}`;
    book.dispatchEvent(new CustomEvent("comic:change", { detail: { index: idx } }));
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === pages.length - 1;
    // Next only starts pulsing once the cover's own "Open the comic" button has done its job
    nextBtn.classList.toggle("is-nudge", !learned && idx > 0);
  }

  function go(n) {
    n = Math.max(0, Math.min(pages.length - 1, n));
    if (n === idx || busy) return;
    const dir = n > idx ? "next" : "prev";
    const out = pages[idx];
    const inn = pages[n];
    idx = n;
    const reader = book.classList.contains("is-immersive");   // phone full-screen reader: no page-turn, no auto-scroll
    const animate = !reduce && window.innerWidth > 820 && !reader;
    out.classList.remove("is-active");
    inn.classList.add("is-active");
    if (animate) {
      busy = true;
      out.dataset.dir = dir;
      out.classList.add("is-leaving");
      setTimeout(() => { out.classList.remove("is-leaving"); delete out.dataset.dir; busy = false; }, 880);
    }
    update();
    onEnter(inn, n);
    if (!reader && stage.getBoundingClientRect().top < 40) {
      stage.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }
  window.comicGo = go;
  window.comicAPI = { go, book, pages, index: () => idx };

  function onEnter(page, n) {
    if (n === pages.length - 1) setTimeout(() => confetti($(".confetti", page), 46), 900);
  }

  prevBtn.addEventListener("click", () => { learn(); go(idx - 1); });
  nextBtn.addEventListener("click", () => { learn(); go(idx + 1); });
  update();

  /* ---------- keyboard (only while the book is on screen) ---------- */
  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.intersectionRatio > 0.25; }, { threshold: [0, 0.25, 0.5] }).observe(book);
  document.addEventListener("keydown", (e) => {
    if (!inView || book.classList.contains("is-immersive") || e.target.closest("input, textarea") || !$("#productModal").hidden) return;
    if (e.key === "ArrowRight") { learn(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { learn(); go(idx - 1); }
    else if ((e.key === "Enter" || e.key === " ") && e.target.matches(".panel--flip")) {
      e.preventDefault();
      e.target.classList.toggle("is-flipped");
    }
  });

  /* ---------- swipe ---------- */
  let sx = 0, sy = 0, tracking = false;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; tracking = true; });
  stage.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    if (book.classList.contains("is-immersive")) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) { learn(); go(dx < 0 ? idx + 1 : idx - 1); }
  });
  stage.addEventListener("pointercancel", () => { tracking = false; });

  /* ---------- data-go buttons ---------- */
  book.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) go(Number(g.dataset.go));
  });

  /* ---------- links elsewhere on the site that open a specific comic page ---------- */
  document.addEventListener("click", (e) => {
    const l = e.target.closest("[data-comic-page]");
    if (!l) return;
    e.preventDefault();
    const n = Number(l.dataset.comicPage);
    const top = book.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => go(n), reduce ? 0 : 750);
  });

  /* ---------- speech bubbles on figures ---------- */
  const scaleOf = (el) => (el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1) || 1;
  function placeIn(panel, el, node) {
    const r = el.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const sc = scaleOf(panel);
    node.style.left = `${(r.left + r.width / 2 - pr.left) / sc}px`;
    node.style.top = `${Math.max((r.top - pr.top) / sc, 40)}px`;
  }
  function speak(panel, el) {
    const lines = el.dataset.lines.split("|");
    const n = Number(el.dataset.n || 0);
    el.dataset.n = n + 1;
    $$(".say", panel).forEach((s) => s.remove());
    const b = document.createElement("span");
    b.className = "say";
    b.textContent = lines[n % lines.length];
    panel.appendChild(b);
    placeIn(panel, el, b);
    // keep the bubble inside the panel
    const pw = panel.clientWidth;
    const half = b.offsetWidth / 2 + 8;
    const x = parseFloat(b.style.left);
    b.style.left = `${Math.min(Math.max(x, half), pw - half)}px`;
    b.addEventListener("animationend", () => b.remove());
    const s = el.querySelector(".stk");
    if (s) { s.classList.remove("hop"); void s.getBoundingClientRect(); s.classList.add("hop"); }
  }

  /* ---------- helpers ---------- */
  function confetti(box, n = 36) {
    if (!box || reduce) return;
    box.innerHTML = "";
    const cols = ["#FFD23F", "#D8261A", "#2C4A34", "#fff", "#E8B020", "#B8661A"];
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i");
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = cols[i % cols.length];
      c.style.setProperty("--dl", `${Math.random() * 0.9}s`);
      c.style.setProperty("--dx", `${(Math.random() - 0.5) * 140}px`);
      c.style.setProperty("--rot", `${360 + Math.random() * 540}deg`);
      box.appendChild(c);
    }
    setTimeout(() => { box.innerHTML = ""; }, 4600);
  }
  function restart(node, cls) { node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls); }

  /* ---------- interactions ---------- */
  const fx = {
    om(el, panel, e) {
      for (let i = 0; i < 3; i++) {
        const o = document.createElement("span");
        o.className = "om-float";
        o.textContent = "ॐ";
        const pr = panel.getBoundingClientRect();
        const sc = scaleOf(panel);
        o.style.left = `${(e.clientX - pr.left) / sc + (i - 1) * 22}px`;
        o.style.top = `${(e.clientY - pr.top) / sc}px`;
        o.style.setProperty("--dx", `${(i - 1) * 26}px`);
        o.style.animationDelay = `${i * 0.12}s`;
        panel.appendChild(o);
        o.addEventListener("animationend", () => o.remove());
      }
    },

    churn(el, panel) {
      const page = panel.closest(".cpage");
      if (page.dataset.amrit !== undefined) {
        // reset
        delete page.dataset.amrit;
        page.dataset.pulls = 0;
        page.style.setProperty("--churn", 0);
        $$("[data-amrit]", page).forEach((n) => n.removeAttribute("data-amrit"));
        $("#churnCount").textContent = 0;
        return;
      }
      const pulls = Math.min(8, Number(page.dataset.pulls || 0) + 1);
      page.dataset.pulls = pulls;
      page.style.setProperty("--churn", pulls / 8);
      $("#churnCount").textContent = pulls;
      restart(panel, "tugging");
      setTimeout(() => panel.classList.remove("tugging"), 360);
      if (pulls === 8) {
        page.dataset.amrit = "";
        $$(".panel--amrit", page).forEach((p) => p.setAttribute("data-amrit", ""));
        confetti(buildConfetti($(".panel--amrit", page)), 40);
      }
    },

    "bee-game"(el, panel, e) {
      const f = e.target.closest(".flower");
      const bee = $(".bee", panel);
      if (panel.hasAttribute("data-done")) {
        // reset
        panel.removeAttribute("data-done");
        panel.dataset.flowers = 0;
        panel.style.setProperty("--honey", 0);
        $$(".flower", panel).forEach((n) => n.classList.remove("is-done"));
        $(".fcount", panel).textContent = 0;
        bee.style.setProperty("--bx", 140); bee.style.setProperty("--by", 100);
        return;
      }
      if (!f || f.classList.contains("is-done") || panel.dataset.busy) return;
      panel.dataset.busy = "1";
      bee.style.setProperty("--bx", f.dataset.bx);
      bee.style.setProperty("--by", f.dataset.by);
      setTimeout(() => {
        f.classList.add("is-done");
        bee.style.setProperty("--bx", 340);
        bee.style.setProperty("--by", 150);
      }, 1000);
      setTimeout(() => {
        const n = Number(panel.dataset.flowers || 0) + 1;
        panel.dataset.flowers = n;
        $(".fcount", panel).textContent = n;
        panel.style.setProperty("--honey", n / 3);
        bee.style.setProperty("--bx", 140); bee.style.setProperty("--by", 100);
        delete panel.dataset.busy;
        if (n === 3) {
          panel.setAttribute("data-done", "");
          const keeper = $(".stk.wave", panel);
          if (keeper) { keeper.classList.remove("hop"); void keeper.getBoundingClientRect(); keeper.classList.add("hop"); }
        }
      }, 2000);
    },

    steps(el, panel) {
      const s = (Number(panel.dataset.state || 0) + 1) % 4;
      panel.dataset.state = s;
    },

    test(el, panel) {
      const result = el.dataset.result;
      el.classList.remove("tested");
      void el.getBoundingClientRect();
      el.classList.add("tested");
      const t = $(".tcount", panel);
      t.textContent = Number(t.textContent) + 1;
      const sci = $$(".hit", panel).find((h) => h.dataset.lines && h.dataset.lines.includes("Verified"));
      if (sci) {
        const bubble = document.createElement("span");
        bubble.className = "say";
        bubble.textContent = result === "pass" ? "VERIFIED. Pure!" : "REJECTED. Added syrup!";
        $$(".say", panel).forEach((n) => n.remove());
        panel.appendChild(bubble);
        placeIn(panel, sci, bubble);
        bubble.addEventListener("animationend", () => bubble.remove());
        const stk = sci.querySelector(".stk");
        if (stk) { stk.classList.remove("hop"); void stk.getBoundingClientRect(); stk.classList.add("hop"); }
      }
    },

    flip(el) { el.classList.toggle("is-flipped"); },

    cover(el, panel, e) {
      if (e.target.closest(".cover__bee")) {
        const bee = e.target.closest(".cover__bee");
        bee.style.animationDuration = "1.2s";
        setTimeout(() => { bee.style.animationDuration = ""; }, 2200);
      }
    },
  };

  function buildConfetti(panel) {
    let box = $(".confetti", panel);
    if (!box) { box = document.createElement("div"); box.className = "confetti"; panel.appendChild(box); }
    return box;
  }

  book.addEventListener("click", (e) => {
    const panel = e.target.closest(".panel");
    if (!panel || e.target.closest("a, button")) return;
    panel.setAttribute("data-touched", "");
    const talk = e.target.closest("[data-lines]");
    if (talk) speak(panel, talk);
    const hook = e.target.closest("[data-fx]");
    if (hook && fx[hook.dataset.fx]) fx[hook.dataset.fx](hook, panel, e);
  });

  /* ---------- cover parallax ---------- */
  const cover = $(".panel--cover");
  if (cover && !reduce && window.matchMedia("(hover: hover)").matches) {
    const layers = $$(".layer", cover);
    cover.addEventListener("pointermove", (e) => {
      const r = cover.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach((l) => { const d = Number(l.dataset.depth); l.style.translate = `${-x * d * 60}px ${-y * d * 24}px`; });
    });
    cover.addEventListener("pointerleave", () => layers.forEach((l) => { l.style.translate = "0 0"; }));
  }
})();
