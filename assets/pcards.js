/* Product cards + product popup (local redesign). Needs site.js globals: CONFIG, Cart, Api, esc, money, STATUS, statusOf */
(function () {
  const arrow = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const left = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  const right = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
  const check = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>';
  const grid = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M14 15h6M14 19h6"/></svg>';
  const from = p => Math.min.apply(null, p.plans.map(x => x.p));
  const find = slug => CONFIG.products.find(p => p.slug === slug);
  const sub = p => p.sub || (p.account ? "Fortnite · Accounts" : p.game === "Spoofer" ? "HWID Spoofer" : p.game + " · " + p.type);

  // ---------- card (used by older layouts) ----------
  function card(p, o) {
    o = o || {};
    const badge = o.label ? '<span class="pcb r ' + (o.cls || "ok") + '">' + esc(o.label) + '</span>' : "";
    return '<a class="pc" href="/' + p.slug + '" data-slug="' + p.slug + '"><div class="pcart">' + (p.img ? '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy">' : "") + (o.popular ? '<span class="pcb l">Popular</span>' : "") + badge + '</div>' +
      '<div class="pcpanel"><div class="pcrow"><span class="pcico"><img src="/img/logo.png" alt=""></span><div class="pcnm"><b>' + esc(p.name) + '</b><small>' + esc(sub(p)) + '</small></div></div>' +
      '<div class="pcfoot"><span class="pcp">' + money(from(p)) + '</span><i class="pca">' + arrow + '</i></div></div></a>';
  }

  // ---------- popup ----------
  let root = null;
  function close() { if (!root) return; root.classList.remove("on"); document.documentElement.classList.remove("pm-lock"); const r = root; root = null; setTimeout(() => r.remove(), 200); }
  const stars = n => "★".repeat(n) + '<span class="off">' + "★".repeat(5 - n) + "</span>";
  function open(slug) {
    const p = find(slug); if (!p || p.soon) return;
    if (p.account || !p.plans.length) { location.href = "/" + p.slug; return; }
    close();
    let plan = 0, idx = 0;
    const CAT = { "Fortnite": "cat-fortnite", "Rainbow Six Siege": "cat-r6", "Rust": "cat-rust", "Arc Raiders": "cat-arc3", "Roblox": "cat-roblox", "Spoofer": "cat-hwid" };
    const imgs = (p.gallery && p.gallery.length ? p.gallery : [p.img, CAT[p.game] ? "/img/" + CAT[p.game] + ".webp" : null]).filter(Boolean);
    const down = !!p.down;
    root = document.createElement("div"); root.className = "pm-back";
    root.innerHTML = '<div class="pm" role="dialog" aria-modal="true" aria-label="' + esc(p.name) + '"><button class="pm-x" aria-label="Close">&times;</button>' +
      '<div class="pm-top"><div class="pm-gal">' +
        '<div class="pm-main"><img src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '"><span class="pm-grid" aria-hidden="true">' + grid + '</span>' +
          (imgs.length > 1 ? '<button class="pm-nav l" aria-label="Previous image">' + left + '</button><button class="pm-nav r" aria-label="Next image">' + right + '</button>' : "") +
          '<span class="pm-ct">1/' + imgs.length + '</span></div>' +
        (imgs.length > 1 ? '<div class="pm-th">' + imgs.slice(0, 3).map((s, i) => '<button type="button" class="pm-t' + (i ? "" : " on") + '" data-i="' + i + '"><img src="' + esc(s) + '" alt=""></button>').join("") + '</div>' : "") +
      '</div>' +
      '<div class="pm-info"><h2>' + esc(p.name) + '</h2><div class="pm-sub">' + esc(sub(p)) + '</div><p class="pm-desc">' + esc(p.desc || "") + '</p>' +
        (p.features && p.features.length ? '<h6>Characteristics</h6><ul class="pm-feat">' + p.features.map(f => '<li>' + check + esc(f) + '</li>').join("") + '</ul>' : "") +
        '<div class="pm-plans"></div>' +
        '<label class="pm-chk"><input type="checkbox" id="pmTos"><i></i><span>I confirm my order and accept the <a href="/terms" target="_blank" rel="noopener">Terms of Service</a></span></label>' +
        '<label class="pm-chk"><input type="checkbox" id="pmNews"><i></i><span>I want to receive emails about discounts and new products</span></label>' +
        '<button class="pm-buy" id="pmBuy" disabled>' + (down ? "Currently down" : "Buy") + '</button><div class="pm-fine" id="pmFine"></div>' +
      '</div></div>' +
      '<div class="pm-rev"><div class="pm-rh"><h3>Customer reviews <span id="pmRn"></span></h3><a class="pm-write" href="' + esc(CONFIG.discord) + '" target="_blank" rel="noopener">Write a review</a></div>' +
        '<div class="pm-rb"><div class="pm-sum" id="pmSum"><b>–<small> /5</small></b><div class="st">' + stars(0) + '</div><span class="pm-cnt">No reviews yet</span><div class="pm-bars" id="pmBars"></div><p class="pm-note">Reviews can be left by buyers of this product.</p></div>' +
        '<div class="pm-side"><div class="pm-sort" id="pmSort"><button class="on" data-s="new">Newest</button><button data-s="high">Highest</button><button data-s="low">Lowest</button></div>' +
        '<div class="pm-list" id="pmList"><p class="pm-none">Loading reviews...</p></div>' +
        '<div class="pm-pager"><span id="pmPage"></span><div><button id="pmPrev" aria-label="Previous page">' + left + '</button><button id="pmNext" aria-label="Next page">' + right + '</button></div></div></div></div></div></div>';
    document.body.appendChild(root); document.documentElement.classList.add("pm-lock"); requestAnimationFrame(() => root && root.classList.add("on"));
    const q = s => root.querySelector(s), tos = q("#pmTos"), buy = q("#pmBuy"), fine = q("#pmFine");
    // gallery
    const show = i => { idx = (i + imgs.length) % imgs.length; q(".pm-main img").src = imgs[idx]; q(".pm-ct").textContent = (idx + 1) + "/" + imgs.length; root.querySelectorAll(".pm-t").forEach(b => b.classList.toggle("on", +b.dataset.i === idx)); };
    root.querySelectorAll(".pm-t").forEach(b => b.onclick = () => show(+b.dataset.i));
    if (q(".pm-nav.l")) { q(".pm-nav.l").onclick = () => show(idx - 1); q(".pm-nav.r").onclick = () => show(idx + 1); }
    // plans
    function drawPlans() {
      q(".pm-plans").innerHTML = p.plans.map((x, j) => {
        const tag = x.stock != null ? (x.stock ? x.stock + " in stock" : "Sold out") : x.slots ? x.slots + " slots" : "In stock";
        return '<button type="button" class="pm-plan' + (j === plan ? " on" : "") + '" data-j="' + j + '"><i></i><span class="pn">' + esc(x.n) + '</span><small' + (x.stock === 0 ? ' class="out"' : "") + '>' + tag + '</small><b>' + money(x.p) + '</b></button>';
      }).join("");
      root.querySelectorAll(".pm-plan").forEach(b => b.onclick = () => { plan = +b.dataset.j; drawPlans(); sync(); });
    }
    const sync = () => { const pl = p.plans[plan]; buy.disabled = down || !tos.checked || pl.stock === 0; fine.innerHTML = !pl.v && !down ? "This plan is sold through Discord: Buy opens a ticket with your choice." : ""; };
    drawPlans(); tos.onchange = sync; sync();
    buy.onclick = () => {
      if (buy.disabled) return; const pl = p.plans[plan];
      if (!pl.v) { window.open(CONFIG.tickets || CONFIG.discord, "_blank", "noopener"); fine.innerHTML = 'Opened Discord. Make a ticket and say you want <b>' + esc(p.name) + ' · ' + esc(pl.n) + '</b>.'; return; }
      Cart.save([{ slug: p.slug, plan: plan, qty: 1, any: false }]); location.href = "/checkout";
    };
    q(".pm-x").onclick = close; root.addEventListener("mousedown", e => { if (e.target === root) close(); });
    // reviews: summary + sortable, paged list
    let reviews = [], sort = "new", page = 0; const per = 3;
    function drawReviews() {
      if (!reviews.length) { q("#pmList").innerHTML = '<p class="pm-none">No reviews yet.</p>'; q("#pmPage").textContent = ""; return; }
      const list = reviews.slice().sort((a, b) => sort === "high" ? b.stars - a.stars || b.at - a.at : sort === "low" ? a.stars - b.stars || b.at - a.at : b.at - a.at);
      const pages = Math.max(1, Math.ceil(list.length / per)); page = Math.min(page, pages - 1);
      q("#pmList").innerHTML = list.slice(page * per, page * per + per).map(r => '<article class="pm-r"><div class="pm-rt"><div><b>' + esc(r.username || "Anonymous") + '</b><small>Verified purchase</small></div><div class="pm-rs"><span class="st">' + stars(r.stars) + '</span><em>' + new Date(r.at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + '</em></div></div><p>' + esc(typeof cleanMsg === "function" ? cleanMsg(r.message) : r.message) + '</p>' + (r.proof ? '<img class="pm-proof" src="' + esc(CONFIG.api + r.proof) + '" alt="" loading="lazy">' : "") + '</article>').join("");
      q("#pmPage").textContent = "Page " + (page + 1) + " of " + pages;
      q("#pmPrev").disabled = page === 0; q("#pmNext").disabled = page >= pages - 1;
    }
    q("#pmSort").onclick = e => { const b = e.target.closest("button"); if (!b) return; sort = b.dataset.s; page = 0; root.querySelectorAll("#pmSort button").forEach(x => x.classList.toggle("on", x === b)); drawReviews(); };
    q("#pmPrev").onclick = () => { page = Math.max(0, page - 1); drawReviews(); };
    q("#pmNext").onclick = () => { page++; drawReviews(); };
    const fill = d => {
      if (!root) return;
      if (!d || !d.total) { q("#pmList").innerHTML = '<p class="pm-none">No reviews yet.</p>'; return; }
      reviews = (d.reviews || []).map(r => Object.assign({}, r, { at: +new Date(r.at) || 0 }));
      q("#pmRn").textContent = d.total;
      q("#pmSum").querySelector("b").innerHTML = d.average.toFixed(1) + '<small> /5</small>';
      q("#pmSum").querySelector(".st").innerHTML = stars(Math.round(d.average));
      q("#pmSum").querySelector(".pm-cnt").textContent = d.total + " review" + (d.total === 1 ? "" : "s") + " for this product";
      q("#pmBars").innerHTML = [5, 4, 3, 2, 1].map(s => { const c = reviews.filter(r => r.stars === s).length; return '<div><span>' + s + ' ★</span><i><u style="width:' + (reviews.length ? Math.round(c / reviews.length * 100) : 0) + '%"></u></i><em>' + c + '</em></div>'; }).join("");
      drawReviews();
    };
    PCards._fill = fill;
    Api.get("/api/vouches").then(fill).catch(() => { if (root) q("#pmList").innerHTML = '<p class="pm-none">Reviews could not be loaded.</p>'; });
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  // any product card opens the popup (modified clicks still open the page)
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a.pc[data-slug], a.pk[data-slug], a.ap-c[data-slug], a.lcard[href]"); if (!a) return;
    const sl = a.dataset.slug || (a.getAttribute("href") || "").replace(/^\//, ""); if (!find(sl)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); open(sl);
  });
  const dl = location.search.match(/[?&]open=([a-z0-9-]+)/); if (dl) window.addEventListener("load", () => setTimeout(() => open(dl[1]), 400));
  window.PCards = { card: card, open: open, close: close };
})();
