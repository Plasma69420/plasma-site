/* Plasma storefront: shared config, cart, Discord login, layout */
const CONFIG = {
  discord: "https://discord.gg/2nmZpcrC2",
  discordClientId: "1558554710384844972",
  api: "https://plasma-bot-production.up.railway.app",
  // Paste your YouTube video link here (e.g. https://www.youtube.com/watch?v=XXXXXXXXXXX). Empty hides the showcase.
  showcaseYouTube: "",
  products: [
    {
      slug: "fortnite-private", name: "Fortnite Private", type: "Private", game: "Fortnite", img: "img/fortnite.webp",
      desc: "Smooth private build with a clean in-game menu.",
      features: ["ESP & visibility checks", "Smooth aim assist", "Stream-proof menu"],
      details: "Plasma Fortnite Private is a private build with a clean in-game menu, visibility checks and smooth aim assist. Your key and loader are delivered instantly after payment, and support is available in our Discord.",
      hosted: "https://plasmacheats.sell.app/product/fortnite-private",
      plans: [{ n: "Day", p: 4.99, v: 416469 }, { n: "Week", p: 14.99, v: 416470 }, { n: "Month", p: 24.99, v: 416471 }, { n: "Lifetime", p: 79.99, v: 416472 }]
    },
    {
      slug: "temp-spoofer", name: "Temp Spoofer", type: "Spoofer", game: "Spoofer", img: "img/temp-spoofer.webp",
      desc: "Spoofs your serials until your next restart.",
      features: ["One-click spoof", "Resets on reboot", "Intel & AMD"],
      details: "Temporary HWID spoofer. It changes your hardware identifiers until your next restart, supports Intel and AMD, and runs in one click.",
      hosted: "https://plasmacheats.sell.app/product/temp-spoofer",
      plans: [{ n: "Week", p: 14.99, v: 416474 }, { n: "Month", p: 29.99, v: 416475 }, { n: "Lifetime", p: 124.99, v: 416476 }]
    },
    {
      slug: "perm-spoofer", name: "Perm Spoofer", type: "Spoofer", game: "Spoofer", img: "img/perm-spoofer.webp",
      desc: "Permanently changes your serials. Run it once.",
      features: ["Permanent change", "Disk & NIC support", "Intel & AMD"],
      details: "Permanent HWID spoofer. It changes your serials for good, so you only run it once. Supports disk and network adapters on Intel and AMD.",
      hosted: "https://plasmacheats.sell.app/product/perm-spoofer",
      plans: [{ n: "One Time", p: 14.99, v: 416478 }, { n: "Lifetime", p: 49.99, v: 416479 }]
    }
  ]
};

const STATUS = {
  undetected: ["Undetected", ""], updating: ["Updating", "updating"], maintenance: ["Maintenance", "updating"],
  detected: ["Detected", "down"], down: ["Down", "down"]
};
const money = n => "$" + Number(n).toFixed(2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const productBy = slug => CONFIG.products.find(p => p.slug === slug);
const ico = {
  discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18a19.8 19.8 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 8H6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 6.9L12 17.5 5.8 21l1.4-6.9L2 9.3l7-.8z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};

/* ---------- cart (saved in this browser) ---------- */
const Cart = {
  items() { try { return (JSON.parse(localStorage.getItem("plasma_cart")) || []).filter(i => productBy(i.slug) && productBy(i.slug).plans[i.plan]); } catch { return []; } },
  save(list) { try { localStorage.setItem("plasma_cart", JSON.stringify(list)); } catch { } Cart.badge(); },
  add(slug, plan, qty = 1) {
    const list = Cart.items(), f = list.find(i => i.slug === slug && i.plan === plan);
    if (f) f.qty = Math.min(10, f.qty + qty); else list.push({ slug, plan, qty });
    Cart.save(list);
  },
  setQty(slug, plan, qty) {
    let list = Cart.items();
    list = list.map(i => i.slug === slug && i.plan === plan ? { ...i, qty: Math.max(0, Math.min(10, qty)) } : i).filter(i => i.qty > 0);
    Cart.save(list);
  },
  clear() { Cart.save([]); },
  count() { return Cart.items().reduce((a, i) => a + i.qty, 0); },
  total() { return Cart.items().reduce((a, i) => a + productBy(i.slug).plans[i.plan].p * i.qty, 0); },
  badge() { const n = Cart.count(); document.querySelectorAll(".cart-count").forEach(b => { b.textContent = n; b.hidden = !n; }); }
};

/* ---------- Discord login (browser-only OAuth, no secret needed) ---------- */
const Auth = {
  get() { try { const a = JSON.parse(localStorage.getItem("plasma_auth") || "null"); if (a && a.exp > Date.now()) return a; } catch { } return null; },
  set(a) { try { localStorage.setItem("plasma_auth", JSON.stringify(a)); } catch { } },
  logout() { try { localStorage.removeItem("plasma_auth"); } catch { } location.href = "index.html"; },
  redirectUri() { return location.origin + "/login.html"; },
  loginUrl() {
    const state = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
    try { sessionStorage.setItem("plasma_state", state); } catch { }
    return "https://discord.com/oauth2/authorize?response_type=token&client_id=" + CONFIG.discordClientId +
      "&scope=" + encodeURIComponent("identify email") + "&state=" + state + "&redirect_uri=" + encodeURIComponent(Auth.redirectUri());
  },
  avatar(u) {
    if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
  }
};

/* ---------- API ---------- */
const Api = {
  async get(path, token) {
    const r = await fetch(CONFIG.api + path, { headers: token ? { Authorization: "Bearer " + token } : {} });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "Request failed"), { status: r.status });
    return j;
  },
  async post(path, body) {
    const r = await fetch(CONFIG.api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "Request failed"), { status: r.status });
    return j;
  },
  async status() { try { return (await Api.get("/api/status")).products; } catch { return {}; } }
};

/* ---------- shared layout ---------- */
(() => {
  const here = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  const link = (href, label, key) => `<a href="${href}"${key === here ? ' class="on"' : ""}>${label}</a>`;
  const u = Auth.get();
  const userBtn = u
    ? `<a class="nav-btn" href="account.html"><img class="nav-av" src="${Auth.avatar(u.user)}" alt=""><span>${esc(u.user.global_name || u.user.username)}</span></a>`
    : `<a class="nav-btn" href="login.html">${ico.user}<span>Login</span></a>`;

  document.body.insertAdjacentHTML("afterbegin", `
<div class="bgfx" aria-hidden="true"><div class="top"></div></div>
<canvas class="stars" id="stars"></canvas>
<header class="nav" id="nav">
  <div class="nav-bar"><div class="nav-in">
    <a href="index.html" class="brand"><img src="img/logo.png" alt="">Plasma</a>
    <nav class="nav-links" id="navLinks">
      ${link("index.html", "Home", "index")}${link("products.html", "Products", "products")}${link("reviews.html", "Reviews", "reviews")}${link("status.html", "Status", "status")}
    </nav>
    <div class="nav-right">
      <a class="nav-btn" href="${CONFIG.discord}" target="_blank" rel="noopener">${ico.discord}<span>Discord</span></a>
      ${userBtn}
      <a class="nav-btn icon cart-btn" href="cart.html" aria-label="Cart">${ico.cart}<b class="cart-count" hidden>0</b></a>
      <button class="nav-btn icon burger" id="burger" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div></div>
</header>`);

  document.body.insertAdjacentHTML("beforeend", `
<footer>
  <div class="wrap">
    <a href="index.html" class="brand"><img src="img/logo.png" alt="">Plasma</a>
    <nav>
      <a href="index.html">Home</a><a href="products.html">Products</a><a href="reviews.html">Reviews</a><a href="status.html">Status</a>
      <a href="${CONFIG.discord}" target="_blank" rel="noopener">Discord</a>
    </nav>
    <small>© ${new Date().getFullYear()} Plasma. All rights reserved.</small>
  </div>
</footer>`);

  // nav: full-width strip at the top, floating bar once scrolled
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const links = document.getElementById("navLinks");
  document.getElementById("burger").addEventListener("click", () => links.classList.toggle("open"));
  Cart.badge();

  // drifting particles
  const c = document.getElementById("stars"), x = c.getContext("2d");
  let w, h, dots = [];
  const size = () => {
    const d = devicePixelRatio || 1;
    w = c.width = innerWidth * d; h = c.height = innerHeight * d;
    c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
    dots = Array.from({ length: Math.round(innerWidth / 12) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.1 + .3) * d, v: (Math.random() * .2 + .04) * d, a: Math.random() * 6.28 }));
  };
  size(); addEventListener("resize", size);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tick = () => {
    x.clearRect(0, 0, w, h);
    for (const s of dots) {
      s.y -= s.v; s.a += .015;
      if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
      x.globalAlpha = .15 + Math.abs(Math.sin(s.a)) * .5; x.fillStyle = "#fff";
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill();
    }
    if (!still) requestAnimationFrame(tick);
  };
  tick();
})();

// reveal-on-scroll; call revealAll() after adding .reveal elements dynamically
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
const revealAll = () => document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
addEventListener("DOMContentLoaded", revealAll);
