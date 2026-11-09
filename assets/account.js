/* Client area (redesign): Profile / My products / Orders / Support. One script, one URL per page. */
(() => {
  const au = Auth.get();
  if (!au) { location.replace("/login"); return; }
  const u = au.user, page = window.ACCT_PAGE || "account";
  const root = document.getElementById("acctRoot");
  const name = esc(u.global_name || u.username);
  const svg = (d, w) => `<svg viewBox="0 0 24 24" width="${w || 18}" height="${w || 18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.6l2.2 11h10.4L21 7H7"/>',
    orders: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    dl: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6M9 11h6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2"/>',
    reset: '<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/>',
    out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/>',
    warn: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };
  const nav = [["account", "/account", "Profile", I.user], ["downloads", "/downloads", "My products", I.cart], ["orders", "/orders", "Orders", I.orders], ["support", "/support", "Support", I.help]];
  const cur = page === "keys" || page === "guides" ? "downloads" : page;
  const titles = { account: "Profile", downloads: "My products", orders: "Orders", keys: "My products", guides: "My products", support: "Support" };
  document.title = (titles[page] || "My account") + " – Strive Cheats";

  root.innerHTML = `
    <div class="ac">
      <aside class="ac-side">
        <div class="ac-top"><a class="ac-back" href="/" aria-label="Back to the store">${svg(I.back, 16)}</a><div><h1>My account</h1><p>Manage your account and purchases</p></div></div>
        <nav class="ac-nav">${nav.map(t => `<a href="${t[1]}"${t[0] === cur ? ' class="on"' : ""}>${svg(t[3], 18)}<span>${t[2]}</span></a>`).join("")}</nav>
        <div class="ac-help"><b>Support is online</b><p>Something not working? Our team usually answers within a couple of hours.</p><a href="${CONFIG.tickets}" target="_blank" rel="noopener">Open a ticket</a></div>
      </aside>
      <section class="ac-main" id="aMain"><p class="ac-muted">Loading...</p></section>
    </div>`;
  const main = document.getElementById("aMain");
  const head = (ico, t, sub, right) => `<div class="ac-ph"><div><h2><i>${svg(ico, 20)}</i>${t}</h2><p>${sub}</p></div>${right ? `<div class="ac-pa">${right}</div>` : ""}</div>`;
  const btn = (href, label, ext, cls) => `<a class="ac-btn ${cls || ""}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;

  const DEAD = /VOID|CANCEL|EXPIRE|REFUND|FAIL/i;
  const state = o => o.status === "COMPLETED" ? ["Delivered", "ok"] : DEAD.test(o.status) ? [o.status[0] + o.status.slice(1).toLowerCase(), "dead"] : ["In progress", "wait"];
  const dateOf = t => new Date(t).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const title = o => o.items.map(i => i.title + (i.variant ? " · " + i.variant : "") + (i.qty > 1 ? " × " + i.qty : "")).join(", ") || "Order";
  let granted = [];
  const owned = orders => CONFIG.products.filter(p => granted.includes(p.slug) || orders.some(o => o.status === "COMPLETED" && o.items.some(i => i.title === p.name)));

  // ----- pages -----
  function profile(orders) {
    const done = orders.filter(o => o.status === "COMPLETED"), prog = orders.filter(o => o.status !== "COMPLETED" && !DEAD.test(o.status));
    main.innerHTML = `
      <div class="ac-sec">${head(I.user, "Profile details", "Your account information is only visible to you", `<span class="ac-chip"><img src="${Auth.avatar(u)}" alt="">${name}</span>`)}
        <div class="ac-fields"><label><small>Username</small><div class="ac-in">${name}</div></label><label><small>Email</small><div class="ac-in">${esc(u.email || "No email on this Discord account")}</div></label></div>
        <div class="ac-cells"><div><small>DISCORD ID</small><b>${esc(String(u.id || ""))}</b></div><div><small>SIGNED IN WITH</small><b>Discord</b></div><div><small>LINKED DISCORD</small><b>@${esc(u.username || "")}</b></div></div>
      </div>
      <div class="ac-sec"><div class="ac-stats">
        <div><small>Total orders</small><b>${orders.length}</b></div><div><small>Delivered</small><b>${done.length}</b></div><div><small>In progress</small><b>${prog.length}</b></div><div><small>Total spent</small><b>${money(done.reduce((s, o) => s + o.total, 0))}</b></div></div></div>
      <div class="ac-sec">${head(I.star, "Customer role", "Bought something? Claim the role in Discord to unlock private channels and the /vouch command.", btn(CONFIG.discord, "Open Discord", true, "ghost"))}</div>
      <div class="ac-sec ac-danger">${head(I.warn, "Danger zone", "Sign out on this device.")}<div class="ac-row"><button type="button" class="ac-btn ghost" id="aOut">${svg(I.out, 16)}Sign out</button></div></div>`;
    document.getElementById("aOut").onclick = () => Auth.logout();
  }

  function products(orders, d) {
    const list = d.owner ? CONFIG.products : owned(orders);
    const GUIDE = { "fortnite-private": "fortnite-private", "temp-spoofer": "temp-spoofer", "perm-spoofer": "perm-spoofer" };
    if (!list.length) {
      main.innerHTML = `<div class="ac-sec">${head(I.cart, "My products", "Manage your purchased products.")}<div class="ac-empty"><i>${svg(I.cart, 26)}</i><b>No products yet</b><p>Products you buy will show up here with your loader and setup guide.</p>${btn("/products", "Browse products")}</div></div>`;
      return;
    }
    main.innerHTML = `<div class="ac-sec">${head(I.cart, "My products", `Manage your purchased products. ${list.length} product${list.length === 1 ? "" : "s"}.`)}` + list.map(p => {
      const url = (CONFIG.downloads || {})[p.slug];
      return `<div class="ac-prod"><div class="ac-pt">${p.img ? `<img src="${p.img}" alt="">` : ""}<div><h3>${esc(p.name)}</h3><span class="ac-tag">${esc(p.game === "Spoofer" ? "HWID Spoofer" : p.game)}</span></div></div>
        <div class="ac-line"><div><small>License key</small><b>Sent to your email</b><em>Shown on the payment page and emailed when your payment confirms.</em></div>${btn("/orders", "View orders", false, "ghost")}</div>
        <div class="ac-line"><div><small>Download</small><b>Loader for your product</b></div>${url ? btn(url, svg(I.dl, 15) + "Download", true) : btn(CONFIG.tickets, "Request download", true, "ghost")}</div>
        <div class="ac-line"><div><small>Setup guide</small><b>Get started with your product</b><em>Step by step install and troubleshooting.</em></div>${btn(GUIDE[p.slug] ? "/guides?g=" + GUIDE[p.slug] : "/guides", svg(I.book, 15) + "Open guide", false, "ghost")}</div>
        <div class="ac-line"><div><small>Review</small><b>How is your product?</b><em>Rate it with /vouch in our Discord.</em></div>${btn(CONFIG.discord, svg(I.star, 15) + "Write a review", true)}</div>
        <div class="ac-line"><div><small>Device access</small><b>Reset access for this product</b><em>Moved to a new PC? Open a ticket and we will reset it.</em></div>${btn(CONFIG.tickets, svg(I.reset, 15) + "Reset HWID", true, "ghost")}</div></div>`;
    }).join("") + `<p class="ac-foot">Need your key again? <a href="${CONFIG.tickets}" target="_blank" rel="noopener">Open a Delivery ticket</a> with your order number.</p></div>`;
  }

  function ordersPage(orders) {
    let tab = "all", q = "", pg = 1; const PER = 8;
    const done = orders.filter(o => o.status === "COMPLETED"), prog = orders.filter(o => o.status !== "COMPLETED" && !DEAD.test(o.status));
    main.innerHTML = `<div class="ac-sec">${head(I.orders, "Orders", "Your purchase history and receipts.")}
      <div class="ac-bar"><div class="ac-tabs"><button data-t="all" class="on">All <em>${orders.length}</em></button><button data-t="done">Delivered <em>${done.length}</em></button><button data-t="wait">In progress <em>${prog.length}</em></button></div>
        <label class="ac-search">${svg(I.search, 15)}<input id="aq" placeholder="Search orders"></label></div>
      <div id="aTbl"></div></div>`;
    const draw = () => {
      let list = orders.filter(o => tab === "all" || (tab === "done" ? o.status === "COMPLETED" : o.status !== "COMPLETED" && !DEAD.test(o.status)));
      if (q) list = list.filter(o => (title(o) + " " + o.id).toLowerCase().includes(q));
      const pages = Math.max(1, Math.ceil(list.length / PER)); pg = Math.min(pg, pages);
      const slice = list.slice((pg - 1) * PER, pg * PER);
      document.getElementById("aTbl").innerHTML = list.length ? `<div class="ac-table"><div class="th"><span>PRODUCT</span><span>ORDER DETAILS</span><span>PRICE</span><span>STATUS</span></div>${slice.map(o => { const [l, c] = state(o); return `<div class="tr"><span class="p"><b>${esc(title(o))}</b></span><span class="d"><b>#${esc(String(o.id))}</b><small>${dateOf(o.created)}</small></span><span class="a">${money(o.total)}</span><span class="s"><em class="pill ${c}">${l}</em></span></div>`; }).join("")}</div>
        <div class="ac-pager"><small>Showing ${(pg - 1) * PER + 1}-${(pg - 1) * PER + slice.length} of ${list.length} order${list.length === 1 ? "" : "s"}</small><div>${Array.from({ length: pages }, (_, i) => `<button data-p="${i + 1}" class="${i + 1 === pg ? "on" : ""}">${i + 1}</button>`).join("")}</div></div>`
        : `<div class="ac-empty"><i>${svg(I.orders, 26)}</i><b>No orders found</b><p>${esc(orders.length ? "Nothing matches that filter." : "Orders appear here when they were placed with the email on your Discord account.")}</p></div>`;
      document.querySelectorAll("#aTbl [data-p]").forEach(b => b.onclick = () => { pg = +b.dataset.p; draw(); });
    };
    main.querySelectorAll(".ac-tabs button").forEach(b => b.onclick = () => { tab = b.dataset.t; pg = 1; main.querySelectorAll(".ac-tabs button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    document.getElementById("aq").oninput = e => { q = e.target.value.trim().toLowerCase(); pg = 1; draw(); };
    draw();
  }

  function support() {
    main.innerHTML = `<div class="ac-sec">${head(I.help, "Support", "Get help with your purchases and products.", btn(CONFIG.tickets, svg(I.plus, 15) + "Create ticket", true, "ghost") + btn(CONFIG.discord, svg(I.chat, 15) + "Discord", true, "disc"))}
      <div class="ac-empty"><i>${svg(I.chat, 26)}</i><b>Tickets live in our Discord</b><p>Need a hand with a purchase or a product? Open a ticket in our Discord and the team will get back to you, usually within a couple of hours.</p>${btn(CONFIG.tickets, svg(I.plus, 15) + "Create ticket", true)}</div>
      <p class="ac-foot">Have your order number ready so we can find it quickly.</p></div>`;
  }

  const render = d => {
    granted = d.granted || [];
    const orders = d.orders || [];
    if (page === "account") profile(orders);
    else if (page === "orders") ordersPage(orders);
    else if (page === "support") support();
    else products(orders, d);
  };
  if (page === "support") { support(); return; }
  Api.get("/api/orders", au.token).then(render).catch(e => {
    if (e.status === 401) { try { localStorage.removeItem("strive_auth"); } catch { } location.replace("/login"); return; }
    main.innerHTML = `<div class="ac-sec"><p style="color:#ff6b6b;font-size:14px">Could not load your account right now. Please try again in a moment.</p></div>`;
  });
})();
