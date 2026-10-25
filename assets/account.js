/* Client area: Home / Orders / Keys / Downloads (one script, one URL per page) */
(() => {
  const au = Auth.get();
  if (!au) { location.replace("/login"); return; }
  const u = au.user, page = window.ACCT_PAGE || "account";
  const root = document.getElementById("acctRoot");
  const name = esc(u.global_name || u.username);
  const svg = (d, w) => `<svg viewBox="0 0 24 24" width="${w || 18}" height="${w || 18}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const I = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
    orders: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    keys: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2"/>',
    dl: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.200 9.500l6.100-.9z"/>',
    store: '<path d="M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6"/>',
    out: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    dollar: '<path d="M12 3v18M16.500 7.500c0-1.400-1.800-2.500-4.500-2.500s-4.500 1.100-4.500 2.800c0 4 9 2 9 6.200 0 1.700-1.800 2.500-4.500 2.500s-4.500-1.200-4.500-2.700"/>'
  };
  const tabs = [["account", "/account", "Home", I.home], ["orders", "/orders", "Orders", I.orders], ["keys", "/keys", "Keys", I.keys], ["downloads", "/downloads", "Downloads", I.dl]];
  const titles = { account: "Client Area", orders: "My Orders", keys: "My Keys", downloads: "Downloads" };
  document.title = titles[page] + " – Strive Cheats";
  const hr = new Date().getHours(), hello = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  const DEAD = /VOID|CANCEL|EXPIRE|REFUND|FAIL/i;
  const state = o => o.status === "COMPLETED" ? ["Delivered", "ok"] : DEAD.test(o.status) ? [o.status[0] + o.status.slice(1).toLowerCase(), "dead"] : ["In progress", "wait"];
  const when = t => { const d = new Date(t); return `<b>${d.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "numeric" })}</b><small>${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>`; };
  const title = o => esc(o.items.map(i => i.title + (i.variant ? " — " + i.variant : "") + (i.qty > 1 ? " × " + i.qty : "")).join(", ") || "Order");

  root.innerHTML = `
    <nav class="ca-tabs">${tabs.map(t => `<a href="${t[1]}"${t[0] === page ? ' class="on"' : ""}>${svg(t[3], 15)}${t[2]}</a>`).join("")}<a href="${CONFIG.tickets}" target="_blank" rel="noopener">${svg(I.help, 15)}Support</a></nav>
    <h1 class="ca-h">${page === "account" ? `${hello}, ${name}` : titles[page]}</h1>
    <p class="ca-sub">${page === "account" ? "Here's a summary of your account and recent activity." : page === "orders" ? "Orders placed with the email on your Discord account." : page === "keys" ? "Where your license keys are delivered and how to get them again." : "Loaders for the products you own."}</p>
    <div class="ca-grid">
      <aside class="ca-side">
        <div class="ca-card">
          <div class="who"><img src="${Auth.avatar(u)}" alt=""><div><b>${name}</b><small>${esc(u.email || "No email on this Discord account")}</small></div></div>
          <div class="quick">
            <a href="/orders">${svg(I.orders, 22)}<span>Orders</span></a>
            <a href="/downloads">${svg(I.dl, 22)}<span>Downloads</span></a>
            <a href="${CONFIG.tickets}" target="_blank" rel="noopener">${svg(I.help, 22)}<span>Support</span></a>
          </div>
          <a class="row" href="/keys"><i>${svg(I.keys)}</i><div><b>My Keys</b><small>Where your keys are delivered</small></div>${svg(I.chev, 16)}</a>
          <a class="row" href="${CONFIG.discord}" target="_blank" rel="noopener"><i>${svg(I.star)}</i><div><b>Customer Role</b><small>Claim it in our Discord</small></div>${svg(I.chev, 16)}</a>
          <a class="row" href="/products"><i>${svg(I.store)}</i><div><b>Visit store</b><small>Continue shopping at our store</small></div>${svg(I.ext, 16)}</a>
          <button type="button" class="out" id="aOut">${svg(I.out, 16)}Sign out</button>
        </div>
      </aside>
      <div id="aMain"><div class="ca-card" style="padding:22px"><p class="muted">Loading...</p></div></div>
    </div>`;
  document.getElementById("aOut").onclick = () => Auth.logout();
  const main = document.getElementById("aMain");

  const table = list => `<div class="ca-table"><div class="th"><span>ORDER</span><span>DATE</span><span>AMOUNT</span><span>STATUS</span><span></span></div>${list.map(o => {
    const [label, cls] = state(o);
    return `<div class="tr"><span class="o"><i>${svg(I.orders, 16)}</i><div><b>${title(o)}</b><small>${esc(String(o.id))}</small></div></span><span class="d">${when(o.created)}</span><span class="a">${money(o.total)}</span><span><em class="pill ${cls}">${label}</em></span><span class="x">${svg(I.ext, 15)}</span></div>`;
  }).join("")}</div>`;
  const btn = (href, label, ext) => `<a class="btn btn-main" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  const btnGhost = (href, label, ext) => `<a class="btn btn-ghost" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;

  const render = d => {
    const orders = d.orders || [], done = orders.filter(o => o.status === "COMPLETED"), prog = orders.filter(o => o.status !== "COMPLETED" && !DEAD.test(o.status));
    const none = esc(d.note || "No orders yet for " + (u.email || "your account") + ".") + " Orders appear here when they were placed with your Discord email.";
    if (page === "account") {
      main.innerHTML = `
        <div class="ca-stats">
          <div><span>Total Orders</span><b>${orders.length}</b><small>All time orders</small><i>${svg(I.orders)}</i></div>
          <div><span>Delivered</span><b>${done.length}</b><small>Successfully delivered</small><i>${svg(I.check)}</i></div>
          <div><span>In Progress</span><b>${prog.length}</b><small>Awaiting delivery</small><i>${svg(I.clock)}</i></div>
          <div><span>Total Spent</span><b>${money(done.reduce((s, o) => s + o.total, 0))}</b><small>On delivered orders</small><i>${svg(I.dollar)}</i></div>
        </div>
        <div class="ca-two">
          <div class="ca-card promo"><div><b>Need a hand?</b><p>Open a ticket in our Discord and the team will help with setup, keys or any order.</p>${btn(CONFIG.tickets, "Open a ticket", true)}</div></div>
          <div class="ca-card promo"><div><b>Customer role</b><p>After your first purchase, claim the Customer role in our Discord to unlock private channels and the <b>/vouch</b> command.</p>${btnGhost(CONFIG.discord, "Open Discord", true)}</div></div>
        </div>
        <div class="ca-card"><div class="ca-ch"><i>${svg(I.clock)}</i><div><b>Recent Orders</b><small>Your last 5 most recent orders</small></div></div>
          ${orders.length ? table(orders.slice(0, 5)) : `<p class="muted" style="padding:22px">${none}</p>`}
          <div class="ca-foot"><span>Showing ${Math.min(5, orders.length)} of ${orders.length} orders</span><a class="btn btn-ghost" href="/orders">View All Orders</a></div></div>`;
    } else if (page === "orders") {
      main.innerHTML = `<div class="ca-card"><div class="ca-ch"><i>${svg(I.orders)}</i><div><b>Orders</b><small>${orders.length} total</small></div></div>${orders.length ? table(orders) : `<p class="muted" style="padding:22px">${none}</p>`}</div>`;
    } else if (page === "keys") {
      main.innerHTML = `
        <div class="ca-card" style="padding:24px"><b style="font-size:18px;color:#fff">How you get your key</b>
          <p class="muted" style="margin-top:12px;line-height:1.7">Your key is shown on the payment confirmation page and emailed to the address you entered at checkout as soon as the payment is confirmed. Keys are not stored in your account, so keep that email.</p>
          <p class="muted" style="margin-top:10px;line-height:1.7">Lost your key or didn't receive it? Open a <b style="color:#fff">Delivery</b> ticket in our Discord with your order number and our team will sort it out.</p>
          <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">${btn(CONFIG.tickets, "Open a ticket", true)}${btnGhost("/orders", "View my orders")}</div></div>
        <div class="ca-card" style="margin-top:16px"><div class="ca-ch"><i>${svg(I.check)}</i><div><b>Your delivered orders</b><small>${done.length}</small></div></div>${done.length ? table(done) : `<p class="muted" style="padding:22px">No delivered orders yet.</p>`}</div>`;
    } else {
      main.innerHTML = `<div class="ca-card" style="padding:44px 24px;text-align:center"><i style="display:inline-grid;place-items:center;width:54px;height:54px;border-radius:50%;background:rgba(31,182,255,.1);border:1px solid rgba(31,182,255,.25);color:#7fd6ff">${svg(I.dl, 24)}</i><b style="display:block;margin-top:16px;font:700 20px/1.2 'Manrope';color:#fff">No downloads right now</b><p class="muted" style="margin-top:8px;font-size:14px">Nothing is available to download at the moment. Check back soon, or open a ticket in our Discord if you need your loader now.</p><div style="margin-top:18px">${btnGhost(CONFIG.tickets, "Open a ticket", true)}</div></div>`;
    }
  };

  Api.get("/api/orders", au.token).then(render).catch(e => {
    if (e.status === 401) { try { localStorage.removeItem("strive_auth"); } catch { } location.replace("/login"); return; }
    main.innerHTML = `<div class="ca-card" style="padding:22px"><p style="color:var(--bad);font-size:14px">Could not load your orders right now. Please try again in a moment.</p></div>`;
  });
})();
