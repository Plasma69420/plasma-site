/* Store-template header + footer. Load AFTER /assets/site.js (it needs CONFIG, Auth, Cart, esc, money).
   Replaces the old header/footer that site.js draws, keeps the same links, cart, login and Support popup. */
(() => {
  if (window.__nxLayout) return; window.__nxLayout = true;   // loaded once (site.js adds it; the homepage links it too)
  document.body.classList.add("nx");
  const $ = s => document.querySelector(s);
  ["#nav", "footer.foot"].forEach(s => { const el = $(s); if (el) el.remove(); });

  const svg = (d, w = 1.9) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    store: svg('<path d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>'),
    status: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>'),
    reviews: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 10h.01M15 10h.01"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),
    more: svg('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', 2.4),
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 2),
    cart: svg('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 8H6"/>', 2),
    key: svg('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2"/>', 2),
    burger: svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 2),
    up: svg('<path d="m6 15 6-6 6 6"/>', 2.6),
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18a19.8 19.8 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.2 13 1.3 11.5c-1-.3-1.1-1 .2-1.5L20.6 2.6c.9-.3 1.6.2 1.3 1.7Z"/></svg>'
  };

  // seasonal red/green touches (styles in nx.css under body.nx-xmas); false turns them off
  const XMAS = true;
  if (XMAS) document.body.classList.add("nx-xmas");
  const seg = location.pathname.replace(/^\/|\/$|\.html$/g, "") || "index";
  const on = k => (k === seg || (k === "products" && productBy(seg))) ? ' class="on"' : "";
  // products taken off the storefront (still in the shared product list on the live site until removed there)
  const HIDDEN = window.NX_HIDDEN = ["arc-raiders"];
  const GONE = window.NX_GONE = CONFIG.products.filter(p => HIDDEN.includes(p.slug));   // shown under "Discontinued" on /status
  CONFIG.products = CONFIG.products.filter(p => !HIDDEN.includes(p.slug));
  const live = CONFIG.products.filter(p => !p.soon && !p.dev);
  const gameOf = p => p.account ? "Fortnite Accounts" : p.game === "Spoofer" ? "HWID Spoofer" : p.game;
  const u = Auth.get();
  const uname = u ? esc(u.user.global_name || u.user.username) : "";

  const userHtml = u
    ? `<div class="nx-user" id="nxUser"><button type="button" aria-haspopup="true" aria-expanded="false"><img src="${Auth.avatar(u.user)}" alt=""><span>${uname}</span>${I.chev}</button>
        <div class="nx-menu" role="menu"><a href="/account">Client area</a><a href="/orders">My orders</a><a href="/keys">My keys</a><a href="/downloads">Downloads</a><a href="/guides">Guides</a><button type="button" id="nxOut">Log out</button></div></div>`
    : `<a class="nx-link signin" href="/login"><span>Existing user?</span> Sign in</a>`;

  const promo = CONFIG.promo || { text: "Christmas Sale: use", code: "CHRISTMAS25", after: "at checkout for 25% off everything" };
  let promoHidden = false; try { promoHidden = sessionStorage.getItem("nx_promo_x") === promo.code; } catch { }

  document.body.insertAdjacentHTML("afterbegin", `
${promoHidden ? "" : `<div class="nx-promo" id="nxPromo">${esc(promo.text)} <code title="Click to copy">${esc(promo.code)}</code> ${esc(promo.after || "")}<button type="button" aria-label="Hide">&times;</button></div>`}
<header class="nx-top"><div class="nx-w">
  <a class="nx-brand" href="/" aria-label="Strive Cheats"><img src="/img/logo.png" alt=""><b>Strive <em>Cheats</em></b></a>
  <div class="nx-acts">
    <a class="nx-online" id="navOnline" href="${CONFIG.discord}" target="_blank" rel="noopener" hidden><i></i><b id="navOnlineN">0</b> online</a>
    ${userHtml}
    <a class="nx-icon" href="/cart" aria-label="Cart">${I.cart}<b class="cart-count" hidden>0</b></a>
    <a class="nx-btn p" href="/keys">${I.key}<span>MY KEYS</span></a>
  </div>
</div></header>
<nav class="nx-nav" id="nxNav"><div class="nx-w">
  <button class="nx-icon nx-burger" id="nxBurger" type="button" aria-label="Menu">${I.burger}</button>
  <div class="nx-links">
    <a href="/products"${on("products")}>${I.store}Store</a>
    <a href="/status"${on("status")}>${I.status}Status</a>
    <a href="/reviews"${on("reviews")}>${I.reviews}Reviews</a>
    <div class="nx-dd"><button type="button" aria-haspopup="true" aria-expanded="false">${I.info}Products Info${I.chev}</button>
      <div class="nx-menu">${live.map(p => `<a href="/${p.slug}">${esc(p.name)}<small>${esc(gameOf(p))}</small></a>`).join("")}</div></div>
    <div class="nx-dd"><button type="button" aria-haspopup="true" aria-expanded="false">More${I.chev}</button>
      <div class="nx-menu"><a href="/blog">Blog</a><a href="/mini-games">Try it free</a><a href="/rewards">Rewards</a><a href="/affiliates">Affiliates</a><a href="/about">About us</a><a href="#support" data-support>Support</a><a href="${CONFIG.discord}" target="_blank" rel="noopener">Join Discord</a></div></div>
  </div>
  <form class="nx-search" id="nxSearch" role="search" autocomplete="off">${I.search}<input type="search" placeholder="Search..." aria-label="Search products"><div class="nx-menu" role="listbox"></div></form>
</div></nav>`);

  document.body.insertAdjacentHTML("beforeend", `
<footer class="nx-foot">
  <div class="nx-w nx-fgrid">
    <div>
      <a class="nx-brand" href="/"><img src="/img/logo.png" alt=""><b>Strive <em>Cheats</em></b></a>
      <p>Strive delivers your key instantly after payment. Check the live status page before you buy and read what other players say in the reviews. Questions before or after your order? Open a ticket and a real person will help.</p>
      <div class="nx-soc"><a href="${CONFIG.discord}" target="_blank" rel="noopener" aria-label="Discord">${I.discord}</a><a href="${CONFIG.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${I.telegram}</a></div>
    </div>
    <div><h4>Supported Games</h4><ul>${[...new Set(CONFIG.products.filter(p => !p.account && p.game !== "Spoofer").map(p => p.game))].map(g => `<li><a href="/products?category=${g.toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${esc(g)}</a></li>`).join("")}</ul></div>
    <div><h4>Important Information</h4><ul><li><a href="#support" data-support>Support</a></li><li><a href="/reviews">Reviews</a></li><li><a href="/status">Status</a></li><li><a href="/account">Client area</a></li><li><a href="/about">About us</a></li></ul></div>
    <div><h4>Legal</h4><ul><li><a href="/terms">Terms of Service</a></li><li><a href="/privacy">Privacy Policy</a></li><li><a href="/refund">Refund Policy</a></li></ul></div>
  </div>
  <div class="nx-fbar"><div class="nx-w">
    <div class="l"><a href="${CONFIG.tickets || CONFIG.discord}" target="_blank" rel="noopener">Contact Us</a><a href="/privacy">Privacy</a></div>
    <button class="nx-up" type="button" aria-label="Back to top">${I.up}</button>
    <div class="r"><img src="/img/logo.png" alt="">STRIVE &copy; ${new Date().getFullYear()}</div>
  </div></div>
</footer>`);

  // dropdowns (nav menus + account): one open at a time, close on outside click / Esc
  const dds = [...document.querySelectorAll(".nx-dd, .nx-user")];
  const close = except => dds.forEach(d => { if (d !== except) { d.classList.remove("open"); d.querySelector("button").setAttribute("aria-expanded", "false"); } });
  dds.forEach(d => d.querySelector("button").addEventListener("click", e => { e.stopPropagation(); const o = !d.classList.contains("open"); close(d); d.classList.toggle("open", o); e.currentTarget.setAttribute("aria-expanded", o); }));
  document.addEventListener("click", e => { if (!e.target.closest(".nx-dd, .nx-user")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { close(); $("#nxSearch").classList.remove("open"); } });
  if (u) $("#nxOut").addEventListener("click", () => Auth.logout());
  $("#nxBurger").addEventListener("click", () => $("#nxNav").classList.toggle("open"));
  $(".nx-up").addEventListener("click", () => scrollTo({ top: 0 }));

  // promo: click code to copy, x hides it for this visit
  const pr = $("#nxPromo");
  if (pr) {
    pr.querySelector("code").addEventListener("click", e => { navigator.clipboard && navigator.clipboard.writeText(promo.code); e.target.textContent = "Copied!"; setTimeout(() => e.target.textContent = promo.code, 1200); });
    pr.querySelector("button").addEventListener("click", () => { pr.remove(); try { sessionStorage.setItem("nx_promo_x", promo.code); } catch { } });
  }

  // search: live product matches, Enter opens the first one (or the store filtered by the text)
  const sf = $("#nxSearch"), si = sf.querySelector("input"), sm = sf.querySelector(".nx-menu");
  const match = q => { q = q.trim().toLowerCase(); return q ? CONFIG.products.filter(p => (p.name + " " + p.game + " " + (p.type || "")).toLowerCase().includes(q)).slice(0, 7) : []; };
  si.addEventListener("input", () => {
    const m = match(si.value);
    sm.innerHTML = m.length ? m.map(p => `<a href="/${p.slug}"><img src="${p.img}" alt="">${esc(p.name)}<small>${p.soon || p.dev ? "Soon" : "from " + money(Math.min(...p.plans.map(x => x.p)))}</small></a>`).join("") : (si.value.trim() ? `<a href="/products">No match. See all products</a>` : "");
    sf.classList.toggle("open", !!si.value.trim());
  });
  sf.addEventListener("submit", e => { e.preventDefault(); const m = match(si.value); location.href = m.length ? "/" + m[0].slug : "/products"; });
  document.addEventListener("click", e => { if (!sf.contains(e.target)) sf.classList.remove("open"); });

  if (typeof Cart !== "undefined") Cart.badge();

  // ---- /status: split the page's single "All products" grid into Undetected / Updating / In development /
  // Detected / Discontinued. The page redraws #groups every minute, so this re-runs whenever its content is replaced.
  if (seg === "status") {
    const pill = c => (c.querySelector(".sc-pill") || {}).textContent || "";
    const SECS = [
      { k: "ok", t: "Undetected", s: "Safe to use right now", m: c => c.classList.contains("ok") },
      { k: "warn", t: "Updating", s: "Being updated after a game patch. Hold off until it's back", m: c => /updat|mainten/i.test(pill(c)) },
      { k: "soon", t: "In development", s: "Coming soon", m: c => /develop|soon/i.test(pill(c)) || c.classList.contains("soon") },
      { k: "bad", t: "Detected / Down", s: "Don't use until it's back", m: c => c.classList.contains("bad"), hideEmpty: true }
    ];
    const card = p => `<div class="sc gone"><span class="sc-i"><img src="${esc(p.img)}" alt="" loading="lazy"></span>
      <span class="sc-b"><b>${esc(p.name)}</b><small>${esc(gameOf(p))} · No longer sold</small><span class="sc-pill"><i></i>Discontinued</span></span></div>`;
    const sec = (k, t, s, n, body) => `<section class="sv-sec nx-svsec s-${k}"><div class="sv-h"><h3><i></i>${t}</h3><span>${n} product${n === 1 ? "" : "s"} · ${s}</span></div>${body}</section>`;
    const regroup = () => {
      const g = document.getElementById("groups");
      if (!g || g.querySelector(".nx-svsec")) return;
      const cards = [...g.querySelectorAll(".sc")]; if (!cards.length) return;
      const bins = SECS.map(() => []), rest = [];
      cards.forEach(c => { const i = SECS.findIndex(S => S.m(c)); (i < 0 ? rest : bins[i]).push(c); });
      bins[0].forEach(c => { const p = c.querySelector(".sc-pill"); if (p && p.lastChild) p.lastChild.textContent = "Undetected"; });
      bins[2].forEach(c => { c.classList.remove("warn", "ok"); c.classList.add("soon"); });
      const holder = document.createElement("div");
      holder.innerHTML = SECS.map((S, i) => S.hideEmpty && !bins[i].length ? "" : sec(S.k, S.t, S.s, bins[i].length, bins[i].length ? `<div class="sv-grid" data-i="${i}"></div>` : `<p class="sv-empty">Nothing here right now.</p>`)).join("")
        + (rest.length ? sec("idle", "Other", "", rest.length, `<div class="sv-grid" data-i="rest"></div>`) : "")
        + (GONE.length ? sec("gone", "Discontinued", "No longer sold or supported", GONE.length, `<div class="sv-grid">${GONE.map(card).join("")}</div>`) : "");
      holder.querySelectorAll(".sv-grid[data-i]").forEach(el => (el.dataset.i === "rest" ? rest : bins[+el.dataset.i]).forEach(c => el.appendChild(c)));
      g.replaceChildren(...holder.children);
      const ok = document.querySelector(".sv-counts .ok small"); if (ok) ok.textContent = "Undetected";
    };
    new MutationObserver(regroup).observe(document.body, { childList: true, subtree: true });
    regroup();
  }

  // ---- /products: Fortnite AI Aim is the highlighted Fortnite pick ("Most Undetected") instead of Fortnite Private.
  // The page draws its grid itself (and again on every filter), so the badge is moved after each draw.
  // game scene behind the top of product and store-category pages. It starts under the menu bar (not behind the
  // header) and fades out downward. Images: local/cards/bg-<key>.webp (sources in local/src/dl-bg).
  const setGameBg = key => {
    let wrap = document.querySelector(".nx-gamebg-wrap");
    if (!key) { if (wrap) wrap.remove(); document.body.classList.remove("nx-has-gamebg"); return; }
    if (!wrap) { $("#nxNav").insertAdjacentHTML("afterend", '<div class="nx-gamebg-wrap" aria-hidden="true"><div class="nx-gamebg"></div></div>'); wrap = document.querySelector(".nx-gamebg-wrap"); }
    wrap.firstChild.style.setProperty("--bg-img", `url('/local/cards/bg-${key}.webp')`);
    document.body.classList.add("nx-has-gamebg");
  };
  const GAME_BG = { "Fortnite": "fortnite", "Fortnite Accounts": "fortnite", "Retrac": "retrac", "Rainbow Six Siege": "r6",
    "Rust": "rust", "Call of Duty": "cod", "Valorant": "valorant" };   // Retrac: Chapter 2 Season 4 key art

  if (seg === "products") {
    // a game picked (?category=… or the Game filter): that game's scene behind the top, like the product pages
    const CAT_BG = { "fortnite": "fortnite", "fortnite-accounts": "fortnite", "retrac": "retrac", "rainbow-six-siege": "r6", "rust": "rust", "call-of-duty": "cod", "valorant": "valorant" };
    let lastBg = null;
    const catBg = () => {
      const sel = document.getElementById("game"), key = CAT_BG[sel ? sel.value : (new URLSearchParams(location.search).get("category") || "")] || "";
      if (key === lastBg) return; lastBg = key;
      setGameBg(key);
    };
    // game categories read "Fortnite Cheats" / "Browse Fortnite cheats" (the page rewrites the title on each filter)
    const catTitle = () => {
      const sel = document.getElementById("game"), t = document.getElementById("title"), s = document.getElementById("sub");
      if (!sel || !t || !CAT_BG[sel.value] || sel.value === "fortnite-accounts") return;
      const name = sel.options[sel.selectedIndex].text;
      if (t.textContent !== name + " Cheats") t.textContent = name + " Cheats";
      if (s && s.textContent !== "Browse " + name + " cheats") s.textContent = "Browse " + name + " cheats";
    };
    const fixRec = () => {
      catBg(); catTitle();
      const grid = document.getElementById("grid"); if (!grid) return;
      grid.querySelectorAll('.ap-c[data-slug="fortnite-private"]').forEach(c => { c.classList.remove("rec"); const r = c.querySelector(".ap-rec"); if (r) r.remove(); });
      const star = (grid.querySelector(".ap-rec svg") || {}).outerHTML || "★";
      grid.querySelectorAll('.ap-c[data-slug="fortnite-ai"]').forEach(c => {
        if (c.querySelector(".ap-rec")) return;
        c.classList.add("rec"); const m = c.querySelector(".ap-m"); if (m) m.insertAdjacentHTML("beforeend", `<span class="ap-rec">${star}Most Undetected</span>`);
      });
    };
    new MutationObserver(fixRec).observe(document.body, { childList: true, subtree: true });
    fixRec();
  }

  // ---- /reviews: the homepage hero on top, a breadcrumb, a "Customer reviews" header panel, then the page's own
  // score + review wall (real Discord /vouch reviews) inside a panel
  if (seg === "reviews") {
    const main = document.querySelector("main.rv");
    if (main && !document.querySelector(".nx-rvhead")) {
      const title = main.querySelector(".rv-side > div:first-child"); if (title) title.remove();
      main.classList.add("nx-w");
      main.insertAdjacentHTML("beforebegin", `<section class="nx-hero nx-hero-sub"><div class="nx-w">
        <div class="nx-hero-copy"><h1>Strive for the best<br>with our <span>Premium Game Tools</span></h1>
        <p>Tools for Fortnite, Rainbow Six, Rust and Retrac, delivered the moment you pay. Live product status and real people in Discord whenever you need help.</p></div>
        <div class="nx-hero-art" aria-hidden="true"><img src="/local/cards/hero.webp" alt=""></div></div></section>
        <div class="nx-w nx-crumb"><div><a href="/">Home</a><span>Reviews</span></div></div>
        <div class="nx-w nx-rvhead"><h1>Customer <span>reviews</span></h1><p>Every review comes from a verified buyer in our Discord.</p></div>`);
    }
  }

  // ---- product pages: gallery thumbnails, variants as a list, About boxes, call to action, 1-1 support ----
  const prod = productBy(seg);
  if (prod) {
    const IC = {
      sys: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', 2),
      feat: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', 2),
      why: svg('<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>', 2),
      sup: svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z"/>', 2)
    };
    const feats = prod.features || [], find = re => feats.find(f => re.test(f));
    const winF = find(/windows/i), acF = find(/undetected|eac|battleye|anti-?cheat/i), ldF = find(/loader/i);
    const sys = prod.account ? [] : [
      ["Operating system", winF ? winF.replace(/,?\s*(intel|amd).*$/i, "") : "Windows 10 & 11"],
      ["CPU", winF && /intel|amd/i.test(winF) ? "Intel & AMD" : "Intel & AMD"],
      acF && ["Anti-cheat", acF.replace(/^fully\s+(\w)/i, (_, c) => c.toUpperCase())],
      ldF && ["Loader", ldF],
      ["Delivery", "Instant, key sent by email"],
      prod.updated && ["Last updated", prod.updated]
    ].filter(Boolean);
    const rest = feats.filter(f => f !== winF && f !== acF && f !== ldF);
    const why = ["<b>Instant delivery:</b> your key arrives the moment you pay", "<b>24/7 support:</b> real people in our Discord", "<b>Free updates</b> for as long as your key is active",
      "<b>Live status page</b> so you always know it's safe", "<b>Secure checkout</b> with PayPal, Cash App or crypto"];
    const li = a => a.map(x => `<li>${x}</li>`).join("");
    const box = (icon, title, items) => `<div class="nx-box"><h4><i>${icon}</i>${title}</h4><ul>${items}</ul></div>`;
    const keyName = n => prod.account || /key$/i.test(n) ? n : (/^(day|week|month|year)$/i.test(n) ? "1 " + n : n) + " Key";
    const from = prod.plans && prod.plans.length ? Math.min(...prod.plans.map(x => x.p)) : null;

    // the game's own scene behind the top (Steam library art for R6 / Rust / COD, a Valorant map splash, a Fortnite
    // screen, Chapter 2 Season 4 for Retrac); HWID spoofers have no game, so they keep the plain background
    setGameBg(GAME_BG[gameOf(prod)] || "");

    const enhance = () => {
      const root = document.getElementById("root"); if (!root || !root.querySelector(".lp")) return;
      // variants
      root.querySelectorAll(".lp-v:not([data-nx])").forEach(v => {
        v.dataset.nx = "1";
        const b = v.querySelector("b"), sm = v.querySelector("small");
        if (b) b.textContent = keyName(b.textContent.trim());
        if (sm) v.insertAdjacentHTML("beforeend", `<span class="nx-stk${sm.classList.contains("low") || sm.classList.contains("lim") ? " low" : ""}">${esc(sm.textContent.trim())}</span>`);
      });
      if (root.querySelector(".nx-ab-grid")) return;
      // gallery thumbnails
      const gal = (prod.gallery || []).filter(Boolean), main = root.querySelector(".lp-img img"), ct = root.querySelector(".lp-img .ct");
      if (gal.length > 1 && main) {
        if (ct) ct.textContent = "1 / " + gal.length;
        root.querySelector(".lp-img").insertAdjacentHTML("afterend", `<div class="nx-thumbs">${gal.map((g, i) => `<button type="button"${i ? "" : ' class="on"'} data-i="${i}" aria-label="Image ${i + 1}"><img src="${esc(g)}" alt="" loading="lazy"></button>`).join("")}</div>`);
        root.querySelectorAll(".nx-thumbs button").forEach(t => t.addEventListener("click", () => {
          main.src = gal[+t.dataset.i]; if (ct) ct.textContent = (+t.dataset.i + 1) + " / " + gal.length;
          root.querySelectorAll(".nx-thumbs button").forEach(o => o.classList.toggle("on", o === t));
        }));
      }
      // About boxes after the description, a heading over the full feature list
      const desc = root.querySelector(".lp-desc");
      if (desc) desc.insertAdjacentHTML("afterend", `<div class="nx-ab-grid">
        ${sys.length ? box(IC.sys, "System Information", li(sys.map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`))) : ""}
        ${box(IC.feat, "Features", li(rest.map(esc)))}
        ${box(IC.why, "Why Choose Strive", li(why))}</div>`);
      const fg = root.querySelector(".fgroups"); if (fg) fg.insertAdjacentHTML("beforebegin", `<h3 class="nx-fl-h">Full feature list</h3>`);
      // call to action + 1-1 support upsell (the AnyDesk add-on)
      root.insertAdjacentHTML("beforeend", `<section class="nx-cta"><h3>What are you waiting for?</h3>
        <p>Get ${esc(prod.name)}${from != null ? " from " + money(from) : ""}. Your key arrives the moment you pay, and our team is in Discord if you need a hand.</p>
        <button type="button" class="nx-btn p" id="nxCta">PURCHASE NOW</button></section>
        ${prod.addon ? `<section class="nx-sup"><i>${IC.sup}</i><div><b>Get 1-1 Support</b><p>Someone from our team connects with AnyDesk and sets up the loader, spoofer and drivers for you.</p></div>
        <button type="button" class="nx-btn g" id="nxSup">ADD FOR +${money(prod.addon.price)}</button></section>` : ""}`);
      const toBuy = () => { const v = root.querySelector(".lp-vars"); if (v) v.scrollIntoView({ behavior: "smooth", block: "center" }); };
      root.querySelector("#nxCta").addEventListener("click", toBuy);
      // the page may redraw the add-on checkbox, so always look it up fresh
      const sb = root.querySelector("#nxSup"), anyEl = () => document.getElementById("any");
      if (sb) {
        const sync = () => { const a = anyEl(); sb.textContent = a && a.checked ? "ADDED ✓" : "ADD FOR +" + money(prod.addon.price); };
        sb.addEventListener("click", () => { const a = anyEl(); if (a && !a.checked) a.click(); setTimeout(sync, 60); toBuy(); });
        document.addEventListener("change", e => { if (e.target && e.target.id === "any") setTimeout(sync, 0); });
        sync();
      }
    };
    const r0 = document.getElementById("root");
    new MutationObserver(enhance).observe(r0 || document.body, { childList: true, subtree: true });
    enhance();
  }
})();

/* ---- homepage card art (the store, status and product pages keep the product box art) ----
   A finished 16:9 card image, or { box, title, sub } to draw a matching card from the product's box art. */
window.nxArt = a => typeof a === "string" ? `<img src="${a}" alt="" loading="lazy">`
  : `<span class="nx-gen" style="--box:url('${a.box}')"><img src="${a.box}" alt="" loading="lazy"><span class="ttl"><b${a.small ? ' class="s"' : ""}>${esc(a.title)}</b>${a.sub ? `<em>${esc(a.sub)}</em>` : ""}</span></span>`;
