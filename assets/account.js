/* Account area: Overview / Orders / Keys / Downloads (one script, one URL per page, no hash routing) */
(() => {
  const au = Auth.get();
  if (!au) { location.replace("/login"); return; }
  const u = au.user, page = window.ACCT_PAGE || "account";
  const root = document.getElementById("acctRoot");
  const name = esc(u.global_name || u.username);
  const created = new Date(Number((BigInt(u.id) >> 22n) + 1420070400000n));
  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const tabs = [
    ["account", "/account", "Overview", svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')],
    ["orders", "/orders", "Orders", svg('<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>')],
    ["keys", "/keys", "Keys", svg('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2"/>')],
    ["downloads", "/downloads", "Downloads", svg('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>')]
  ];
  const titles = { account: "My Account", orders: "My Orders", keys: "My Keys", downloads: "Downloads" };
  const subs = {
    account: "Your profile and a quick look at your purchases.",
    orders: "Orders placed with the email on your Discord account.",
    keys: "Where your license keys are delivered and how to get them again.",
    downloads: "Loaders for the products you own."
  };
  document.title = titles[page] + " – Plasma";

  root.innerHTML = `
    <div class="page-head left"><span class="pill">Dashboard</span><h1>${titles[page]}</h1><p>${subs[page]}</p></div>
    <div class="acct">
      <aside>
        <div class="card prof">
          <div class="who"><img src="${Auth.avatar(u)}" alt=""><div><b>${name}</b><small>${esc(u.email || "No email on this Discord account")}</small></div></div>
          <div class="kv">
            <div><span>Email</span><b>${u.email ? (u.verified ? "Verified" : "Not verified") : "None"}</b></div>
            <div><span>Discord</span><b>${esc(u.username)}</b></div>
            <div><span>Discord since</span><b>${created.toISOString().slice(0, 10)}</b></div>
          </div>
        </div>
        <nav class="card anav">${tabs.map(t => `<a href="${t[1]}"${t[0] === page ? ' class="on"' : ""}>${t[3]}${t[2]}</a>`).join("")}<button type="button" id="aOut">${svg('<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>')}Logout</button></nav>
      </aside>
      <div id="aMain"><section class="card panel"><p class="muted">Loading...</p></section></div>
    </div>`;
  document.getElementById("aOut").onclick = () => Auth.logout();
  const main = document.getElementById("aMain");
  const empty = (msg, extra) => `<p class="muted">${msg}</p>${extra || ""}`;
  const btn = (href, label, ext) => `<a class="btn btn-ghost abtn" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;

  const orderRows = list => `<div class="orders">` + list.map(o => `<div class="order"><div><b>Order #${o.id}</b><small>${esc(o.items.map(i => i.title + (i.variant ? " · " + i.variant : "") + " × " + i.qty).join(", "))} · ${new Date(o.created).toLocaleDateString()}</small></div>
      <div class="oright"><span class="st ${o.status === "COMPLETED" ? "done" : ""}">${esc(o.status)}</span><span class="amt">${money(o.total)}</span></div></div>`).join("") + `</div>`;

  const render = d => {
    const orders = d.orders || [], done = orders.filter(o => o.status === "COMPLETED");
    const none = esc(d.note || "No orders yet for " + (u.email || "your account") + ".") + " Orders appear here when they were placed with your Discord email.";
    if (page === "account") {
      main.innerHTML = `
        <div class="stats3">
          <div class="card stat"><span>Orders</span><b>${orders.length}</b></div>
          <div class="card stat"><span>Completed</span><b>${done.length}</b></div>
          <div class="card stat"><span>Spent</span><b>${money(done.reduce((s, o) => s + o.total, 0))}</b></div>
        </div>
        <section class="card panel"><h3>Recent orders</h3>${orders.length ? orderRows(orders.slice(0, 3)) : empty(none, `<div class="arow">${btn("/products", "Browse products")}</div>`)}
          ${orders.length > 3 ? `<div class="arow">${btn("/orders", "View all orders")}</div>` : ""}</section>
        <section class="card panel"><h3>Customer role</h3><p>After your first purchase, claim the Customer role in our Discord with your order number to unlock private channels, priority support and the <b>/vouch</b> command for leaving a review.</p>
          <div class="arow">${btn(CONFIG.discord, "Open Discord", true)}</div></section>`;
    } else if (page === "orders") {
      main.innerHTML = `<section class="card panel"><h3>Orders <em>${orders.length}</em></h3>${orders.length ? orderRows(orders) : empty(none, `<div class="arow">${btn("/products", "Browse products")}</div>`)}</section>`;
    } else if (page === "keys") {
      main.innerHTML = `
        <section class="card panel"><h3>How you get your key</h3>
          <p>Your key is shown on the payment confirmation page and emailed to the address you entered at checkout as soon as the payment is confirmed. Keys are not stored in your account, so keep that email.</p>
          <p style="margin-top:10px">Lost your key or didn't receive it? Open a <b>Delivery</b> ticket in our Discord with your order number and our team will sort it out.</p>
          <div class="arow">${btn(CONFIG.tickets, "Open a ticket", true)}${btn("/orders", "View my orders")}</div></section>
        <section class="card panel"><h3>Your completed orders <em>${done.length}</em></h3>${done.length ? orderRows(done) : empty("No completed orders yet.")}</section>`;
    } else {
      const owned = p => d.owner || (d.granted || []).includes(p.slug) || done.some(o => o.items.some(i => (i.title || "").toLowerCase().includes(p.name.toLowerCase())));
      main.innerHTML = `<div class="dls">` + CONFIG.products.filter(p => !p.account).map(p => {
        const has = owned(p), link = (CONFIG.downloads || {})[p.slug];
        const action = !has ? `${btn("/" + p.slug, "Get " + esc(p.name))}`
          : link ? `<a class="btn btn-main abtn" href="${esc(link)}" target="_blank" rel="noopener">${svg('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>')}Download</a>`
            : `<button type="button" class="btn btn-main abtn dlsoon">${svg('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>')}Download</button>`;
        return `<div class="card dl${has ? " on" : ""}"><img src="${p.img}" alt=""><div class="dli"><b>${esc(p.name)}</b><small>${has ? (link ? "Ready to download" : "Access unlocked") : "Not purchased yet"}</small></div>${action}</div>`;
      }).join("") + `</div>
        <p class="muted" style="margin-top:14px;font-size:13px">Downloads unlock for products on a completed order placed with your Discord email. Use your key in the loader after downloading.</p>`;
    }
  };

  Api.get("/api/orders", au.token).then(render).catch(e => {
    if (e.status === 401) { try { localStorage.removeItem("plasma_auth"); } catch { } location.replace("/login"); return; }
    main.innerHTML = `<section class="card panel"><p style="color:var(--bad);font-size:14px">Could not load your orders right now. Please try again in a moment.</p></section>`;
  });
})();
