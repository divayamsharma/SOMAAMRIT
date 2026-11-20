/* =========================================================
   SOMAAMRIT — interactions
   ========================================================= */

// Somaamrit WhatsApp / phone: +91 85447 65043 (country code, no "+" or spaces).
const WHATSAPP_NUMBER = "918544765043";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- WhatsApp enquiry links ---------- */
$$("[data-enquire]").forEach((el) => {
  const item = el.dataset.enquire;
  const text = `Namaste Somaamrit! I'd like to know more about ${item}.`;
  el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  el.target = "_blank";
  el.rel = "noopener";
});

/* ---------- Header: scrolled state + back-to-top ---------- */
const header = $(".header");
const toTop = $("#toTop");
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("is-scrolled", y > 40);
  toTop.classList.toggle("is-visible", y > 900);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* "#top" is the sticky header, so the browser has nothing to scroll to: send these links to the top of the page */
$$('a[href="#top"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
});

/* ---------- Mobile menu ---------- */
const burger = $("#burger");
const nav = $("#nav");
const setMenu = (open) => {
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
};
burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* ---------- Active nav link ---------- */
const navLinks = $$('.nav a[href^="#"]:not(.btn)');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
navLinks.forEach((a) => {
  const target = $(a.getAttribute("href"));
  if (target) sectionObserver.observe(target);
});

/* ---------- Product filters ---------- */
const filters = $$(".filter");
const products = $$(".product");
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    filters.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    });
    products.forEach((card) => {
      const match = f === "all" || card.dataset.cat.split(" ").includes(f);
      card.classList.toggle("is-hidden", !match);
      if (match) card.classList.add("is-in");
    });
  });
});

/* ---------- Counters ---------- */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const end = Number(el.dataset.count);
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(end * eased).toLocaleString("en-IN");
      if (t < 1) requestAnimationFrame(tick);
    };
    if (reduceMotion) el.textContent = end.toLocaleString("en-IN");
    else requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
$$("[data-count]").forEach((el) => counterObserver.observe(el));

/* ---------- Origins map ---------- */
const regions = [
  { name: "Palampur", alt: "Kangra Valley", text: "Green foothills beneath the snow-capped Dhauladhar range — one of the two home towns of Somaamrit.", prod: "Honey · Haldi · Triphala" },
  { name: "Shimla", alt: "Shimla Hills", text: "The old Queen of the Hills — our second home town, perched among the pines of Himachal Pradesh.", prod: "Saffron · Alpine Honey" },
  { name: "The High Himalaya", alt: "Himachal Pradesh", text: "Cold, clean mountain air above the valleys, where Shilajit resin and Cordyceps are gathered.", prod: "Shilajit · Cordyceps" },
];
const pins = $$(".pin");
const card = $("#originCard");
pins.forEach((pin) => {
  pin.addEventListener("click", () => {
    const r = regions[Number(pin.dataset.region)];
    pins.forEach((p) => p.classList.toggle("is-active", p === pin));
    card.classList.add("is-swapping");
    setTimeout(() => {
      $("#originName").textContent = r.name;
      $("#originAlt").textContent = r.alt;
      $("#originText").textContent = r.text;
      $("#originProd").textContent = r.prod;
      card.classList.remove("is-swapping");
    }, 220);
  });
});

/* ---------- Ritual tabs ---------- */
const rtabs = $$(".rtab");
const rituals = $$(".ritual");
rtabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const i = Number(tab.dataset.ritual);
    rtabs.forEach((t, j) => {
      t.classList.toggle("is-active", j === i);
      t.setAttribute("aria-selected", String(j === i));
    });
    rituals.forEach((r, j) => r.classList.toggle("is-active", j === i));
  });
});

/* ---------- Testimonial slider ---------- */
const track = $("#sliderTrack");
const slides = $$(".quote", track);
const dotsWrap = $("#sliderDots");
let current = 0;
let autoplay;

slides.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
  dot.addEventListener("click", () => { goTo(i); restart(); });
  dotsWrap.appendChild(dot);
});
const dots = $$("button", dotsWrap);

function goTo(i) {
  current = (i + slides.length) % slides.length;
  track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
  dots.forEach((d, j) => d.classList.toggle("is-active", j === current));
}
function restart() {
  clearInterval(autoplay);
  if (!reduceMotion) autoplay = setInterval(() => goTo(current + 1), 6000);
}
$("#prevBtn").addEventListener("click", () => { goTo(current - 1); restart(); });
$("#nextBtn").addEventListener("click", () => { goTo(current + 1); restart(); });
track.addEventListener("scroll", () => {
  const i = Math.round(track.scrollLeft / track.clientWidth);
  if (i !== current && i >= 0 && i < slides.length) {
    current = i;
    dots.forEach((d, j) => d.classList.toggle("is-active", j === current));
  }
}, { passive: true });
dots[0].classList.add("is-active");
restart();

/* ---------- Newsletter ---------- */
const form = $("#newsletter");
const msg = $("#newsletterMsg");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  msg.classList.toggle("is-error", !valid);
  if (!valid) {
    msg.textContent = "Please enter a valid email address.";
    return;
  }
  msg.textContent = "Dhanyavaad! Welcome to the Somaamrit Circle — check your inbox soon.";
  form.reset();
});

/* ---------- Product pop-up ---------- */
const PRODUCTS = {
  "shilajit": {
    cat: "Flagship · Ayurveda", name: "Himalayan Shilajit Resin", hi: "शिलाजीत", flag: true,
    desc: "Our most important essential. Purified Shilajit resin drawn from Himalayan rock and revered in Ayurveda as a rasayana — a quiet daily ritual in warm water or milk.",
    facts: [["Form", "Purified resin"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Additives", "None"]],
    how: "Dissolve a pea-sized portion in warm water or milk, once a day.",
  },
  "raw-honey": {
    cat: "Honey", name: "Himalayan Raw Honey", hi: "कच्चा हिमालयी शहद",
    desc: "Unheated, unfiltered and straight from the comb — honey the way the mountains make it. Thick, floral and full of character.",
    facts: [["Form", "Raw, unheated"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Added sugar", "None"]],
    how: "A spoon in warm water at dawn, on toast, or straight from the jar.",
  },
  "alpine-honey": {
    cat: "Honey", name: "Alpine Wildflower Honey", hi: "अल्पाइन शहद",
    desc: "Gathered from wild Himachali blooms. Light, floral and rare by nature — a companion to breakfast or a finishing touch for a favourite dish.",
    facts: [["Form", "Raw wildflower honey"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Added sugar", "None"]],
    how: "Drizzle over fruit, yoghurt or warm milk.",
  },
  "cordyceps-honey": {
    cat: "Honey · Signature blend", name: "Cordyceps-Infused Honey", hi: "कॉर्डिसेप्स शहद",
    desc: "Raw Himalayan honey slow-infused with Cordyceps, cold and unhurried — golden sweetness with an earthy depth, for an everyday ritual of vitality.",
    facts: [["Form", "Cold-infused honey"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Added sugar", "None"]],
    how: "One spoon each morning — straight, or stirred into warm water or tea.",
  },
  "cordyceps-extract": {
    cat: "Honey · Concentrate", name: "Cordyceps Honey Extract", hi: "कॉर्डिसेप्स अर्क",
    desc: "A concentrated spoonful of the mountain — a small jar for a big daily ritual, made in small batches.",
    facts: [["Form", "Concentrated extract"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Additives", "None"]],
    how: "Take a small spoon daily, or stir into warm water.",
  },
  "cordyceps-mushroom": {
    cat: "Superfood", name: "Cordyceps Mushroom", hi: "कॉर्डिसेप्स मशरूम",
    desc: "Whole dried Cordyceps fruiting bodies — steep as a tea, add to broths, or infuse in honey.",
    facts: [["Form", "Whole, sun-dried"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Additives", "None"]],
    how: "Steep a few pieces in hot water for a mellow, earthy tea.",
  },
  "triphala": {
    cat: "Ayurveda", name: "Triphala Powder", hi: "त्रिफला",
    desc: "The classic trio of Amla, Haritaki and Bibhitaki, stone-ground in small batches.",
    facts: [["Form", "Stone-ground powder"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Additives", "None"]],
    how: "Traditionally taken in warm water in the evening.",
  },
  "saffron": {
    cat: "Spices", name: "Organic Saffron", hi: "केसर",
    desc: "Hand-picked threads with a deep crimson colour and honeyed aroma — a few strands transform milk, rice and sweets.",
    facts: [["Form", "Whole threads"], ["Grade", "Organic"], ["Testing", "Lab-verified batches"], ["Additives", "None"]],
    how: "Steep 3–4 threads in warm milk or water before using.",
  },
  "haldi": {
    cat: "Spices · Ayurveda", name: "Himalayan Haldi", hi: "हल्दी",
    desc: "Sun-dried, stone-ground turmeric root with a bright colour and warm, earthy depth.",
    facts: [["Form", "Stone-ground root"], ["Origin", "Himachal Pradesh"], ["Testing", "Lab-verified batches"], ["Additives", "None"]],
    how: "A pinch in warm milk, dal or your morning honey water.",
  },
};

const modal = $("#productModal");
let lastFocus = null;
function openProduct(slug) {
  const d = PRODUCTS[slug];
  if (!d) return;
  lastFocus = document.activeElement;
  $("#pmCat").textContent = d.cat;
  $("#pmTitle").textContent = d.name;
  $("#pmHi").textContent = d.hi;
  $("#pmDesc").textContent = d.desc;
  $("#pmHow").textContent = d.how;
  $("#pmFlag").hidden = !d.flag;
  $("#pmFacts").innerHTML = d.facts.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join("");
  const stage = $("#pmStage");
  $$(".pkg", stage).forEach((n) => n.remove());
  const src = $(`[data-product="${slug}"] .product__stage .pkg`);
  if (src) stage.prepend(src.cloneNode(true));
  const text = `Namaste Somaamrit! I'd like to enquire about ${d.name}.`;
  $("#pmEnquire").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => modal.classList.add("is-open"));
  $(".modal__dialog", modal).scrollTop = 0;
  $(".modal__close", modal).focus();
}
function closeProduct() {
  if (modal.hidden) return;
  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setTimeout(() => { modal.hidden = true; }, reduceMotion ? 0 : 300);
  if (lastFocus) lastFocus.focus();
}
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-open-product]");
  if (opener) { openProduct(opener.dataset.openProduct); return; }
  const card = e.target.closest(".product[data-product]");
  if (card) { openProduct(card.dataset.product); return; }
  if (e.target.closest("[data-close]")) closeProduct();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeProduct();
  if (e.key === "Tab" && !modal.hidden) {
    const f = $$("a[href], button:not([disabled])", modal).filter((n) => n.offsetParent !== null);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Footer year ---------- */
$("#year").textContent = new Date().getFullYear();
