/* =========================================================
   SOMAAMRIT — phone-only full-screen comic
   tap the comic → "tilt your phone" popup → landscape reader
   (the real comic book is moved into the reader, so every
    interaction keeps working; a camera zooms panel by panel)
   ========================================================= */
(() => {
  const api = window.comicAPI;
  const tilt = document.getElementById("tiltPrompt");
  const fs = document.getElementById("comicFS");
  const view = document.getElementById("fsView");
  if (!api || !tilt || !fs || !view) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const book = api.book;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const landscapeMQ = window.matchMedia("(orientation: landscape)");
  const touchMQ = window.matchMedia("(hover: none) and (pointer: coarse)");

  const enterBtn = $("#comicEnter");
  const bar = $("#fsBar");
  const titleEl = $("#fsTitle");
  const prevBtn = $("#fsPrev");
  const nextBtn = $("#fsNext");
  const nextLabel = $("span", nextBtn);
  const overviewBtn = $("#fsOverview");

  /* ---------- phones only (shorter screen side ≤ 600px), in either orientation ---------- */
  const isPhone = () => touchMQ.matches && Math.min(screen.width, screen.height) <= 600;
  const syncPhone = () => root.classList.toggle("is-phone", isPhone());
  syncPhone();

  const KEY = "soma-comic-normal";
  let declined = false;                       // the reader pressed ✕: normal in-page mode until they ask again
  try { declined = sessionStorage.getItem(KEY) === "1"; } catch (_) {}

  let session = false;                        // tilt popup or reader is open
  let holder = null;                          // keeps the page the same height while the book lives in the reader
  let savedY = 0;
  let lastFocus = null;
  let steps = [];                             // every panel of the comic, in reading order
  let overview = false;
  let pending = null;                         // panel to land on after a page change we started
  const cur = { page: 0, panel: 0 };

  const panelsOf = (pi) => $$(".panel", api.pages[pi]);
  const stepIndex = () => steps.findIndex((s) => s.page === cur.page && s.panel === cur.panel);

  /* ---------- open / close ---------- */
  function open() {
    if (session) return;
    session = true;
    lastFocus = document.activeElement;
    savedY = window.scrollY;
    root.classList.add("fs-lock");

    // swap in a spacer so the page keeps its exact height (margins included) and the scroll position doesn't jump
    const parent = book.parentElement;
    const heightBefore = parent.offsetHeight;
    const bookH = book.offsetHeight;
    holder = document.createElement("div");
    holder.className = "cbook-holder";
    holder.style.height = `${bookH}px`;
    book.replaceWith(holder);
    holder.style.height = `${bookH + (heightBefore - parent.offsetHeight)}px`;
    view.appendChild(book);
    book.classList.remove("reveal", "is-in");
    delete book.dataset.anim;
    book.classList.add("is-immersive");

    steps = [];
    api.pages.forEach((_, pi) => panelsOf(pi).forEach((__, i) => steps.push({ page: pi, panel: i })));
    bar.innerHTML = steps.map(() => "<i></i>").join("");
    cur.page = api.index();
    cur.panel = 0;
    overview = false;
    overviewBtn.setAttribute("aria-pressed", "false");
    sync();
  }

  function close({ decline = false, hash = "" } = {}) {
    if (!session) return;
    session = false;
    tilt.hidden = true;
    fs.hidden = true;
    book.classList.remove("is-immersive", "is-overview");
    $$(".is-focus", book).forEach((n) => n.classList.remove("is-focus"));
    book.style.transform = "";
    book.style.transition = "";
    book.style.opacity = "";
    if (holder) { holder.replaceWith(book); holder = null; }
    root.classList.remove("fs-lock");

    root.style.scrollBehavior = "auto";
    window.scrollTo(0, savedY);
    root.style.scrollBehavior = "";

    if (decline) {
      declined = true;
      try { sessionStorage.setItem(KEY, "1"); } catch (_) {}
    }
    if (hash) {
      const t = document.querySelector(hash);
      if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* portrait → "tilt" popup, landscape → reader */
  function sync() {
    if (!session) return;
    const land = landscapeMQ.matches;
    tilt.hidden = land;
    fs.hidden = !land;
    if (land) {
      requestAnimationFrame(() => { focusStep(true); if (!touchMQ.matches) $("#fsClose").focus({ preventScroll: true }); });
    } else if (!touchMQ.matches) {
      $("#tiltClose").focus({ preventScroll: true });
    }
  }

  /* ---------- camera ---------- */
  function offsetIn(el, within) {
    let x = 0, y = 0;
    for (let n = el; n && n !== within; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  function camera(r, pad, maxK, jump) {
    const vw = view.clientWidth, vh = view.clientHeight;
    if (vw < 80 || vh < 60) return;
    const k = Math.min((vw - pad * 2) / r.w, (vh - pad * 2) / r.h, maxK);
    const x = (vw - r.w * k) / 2 - r.x * k;
    const y = (vh - r.h * k) / 2 - r.y * k;
    book.style.transition = jump || reduce ? "none" : "";
    book.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${k.toFixed(4)})`;
  }

  function focusStep(jump) {
    if (!session || fs.hidden) return;
    const page = api.pages[cur.page];
    const panel = panelsOf(cur.page)[cur.panel];
    if (!panel) return;
    $$(".is-focus", book).forEach((n) => n.classList.remove("is-focus"));
    panelsOf(cur.page)[cur.panel].classList.add("is-focus");
    book.classList.toggle("is-overview", overview);
    if (overview) camera(offsetIn(page, book), 12, 1, jump);
    else camera(offsetIn(panel, book), 5, 1.4, jump);
    hud();
  }

  function hud() {
    const i = stepIndex();
    titleEl.textContent = `Page ${cur.page + 1}/${api.pages.length} · ${api.pages[cur.page].dataset.title || ""}`;
    $$("i", bar).forEach((n, k) => { n.classList.toggle("is-on", k <= i); n.classList.toggle("is-now", k === i); });
    prevBtn.disabled = i <= 0;
    const last = i === steps.length - 1;
    nextBtn.classList.toggle("is-finish", last);
    nextLabel.textContent = last ? "Finish" : "Next";
  }

  /* ---------- moving through the comic ---------- */
  function step(d) {
    const i = stepIndex() + d;
    if (i < 0) return;
    overview = false;
    overviewBtn.setAttribute("aria-pressed", "false");
    if (i >= steps.length) { close(); return; }          // comic over → back to the website
    const s = steps[i];
    if (s.page !== cur.page) {
      pending = s.panel;
      api.go(s.page);                                    // fires comic:change, which re-aims the camera
    } else {
      cur.panel = s.panel;
      focusStep(false);
    }
  }

  // page changes from anywhere (our steps, the cover's "Open the comic" button…)
  book.addEventListener("comic:change", (e) => {
    if (!session) return;
    cur.page = e.detail.index;
    cur.panel = pending == null ? 0 : pending;
    pending = null;
    overview = false;
    overviewBtn.setAttribute("aria-pressed", "false");
    book.style.transition = "none";
    book.style.opacity = "0";
    focusStep(true);
    requestAnimationFrame(() => requestAnimationFrame(() => { book.style.transition = ""; book.style.opacity = ""; }));
  });

  /* ---------- controls ---------- */
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  overviewBtn.addEventListener("click", () => {
    overview = !overview;
    overviewBtn.setAttribute("aria-pressed", String(overview));
    focusStep(false);
  });
  $("#fsClose").addEventListener("click", () => close({ decline: true }));
  $("#tiltClose").addEventListener("click", () => close({ decline: true }));
  $("#tiltSkip").addEventListener("click", () => close({ decline: true }));

  document.addEventListener("keydown", (e) => {
    if (!session) return;
    if (e.key === "Escape") close({ decline: true });
    else if (!fs.hidden && e.key === "ArrowRight") step(1);
    else if (!fs.hidden && e.key === "ArrowLeft") step(-1);
  });

  // swipe left / right = next / previous panel
  let sx = 0, sy = 0, tracking = false;
  view.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; tracking = true; });
  view.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  });
  view.addEventListener("pointercancel", () => { tracking = false; });

  // the finale's "Explore the collection" / "Meet Shilajit" links: leave the reader, then go there
  view.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    close({ hash: a.getAttribute("href") });
  });

  // nothing in the reader should ever scroll the page underneath
  [tilt, fs].forEach((n) => n.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false }));

  /* ---------- tap the comic (phones, in-page) → start ---------- */
  book.addEventListener("click", (e) => {
    if (session || declined || !isPhone()) return;
    if (!e.target.closest(".cbook__stage") || e.target.closest(".cbook__corner")) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  if (enterBtn) enterBtn.addEventListener("click", () => {
    declined = false;
    try { sessionStorage.removeItem(KEY); } catch (_) {}
    open();
  });

  /* ---------- orientation / size ---------- */
  let raf = 0;
  const onResize = () => {
    syncPhone();
    if (!session) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(sync);
  };
  window.addEventListener("resize", onResize);
  if (landscapeMQ.addEventListener) landscapeMQ.addEventListener("change", onResize);
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", onResize);
})();
