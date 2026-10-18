/* staff panel UI. No secrets here: every action is checked by the API, which needs a staff login. */
(() => {
  const root = document.getElementById("root");
  if (!root) return;
  const KEY = "plasma_adm";   // sessionStorage: signing out happens when the tab closes
  const tok = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
  const setTok = v => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch { } };
  const ago = t => { const s = Math.max(0, (Date.now() - t) / 1000 | 0); return s < 60 ? "just now" : s < 3600 ? (s / 60 | 0) + "m ago" : s < 86400 ? (s / 3600 | 0) + "h ago" : (s / 86400 | 0) + "d ago"; };
  const left = t => { const s = (t - Date.now()) / 1000 | 0; if (s <= 0) return "ended"; return s < 3600 ? (s / 60 | 0) + "m left" : s < 172800 ? (s / 3600 | 0) + "h left" : (s / 86400 | 0) + "d left"; };
  const date = t => t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  const av = u => u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
  const PRODUCTS = [["fortnite", "Fortnite Private"], ["r6", "R6 External"], ["marvel", "Marvel Rivals"], ["arc", "Arc Raiders Private"], ["tempspoof", "Temporary Swoofer"], ["permspoof", "Permanent Swoofer"]];
  const DURATIONS = [["1d", "1 Day"], ["3d", "3 Days"], ["1w", "1 Week"], ["1m", "1 Month"], ["3m", "3 Months"], ["6m", "6 Months"], ["lifetime", "Lifetime"]];
  const opts = list => list.map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
  let timers = [];
  const clear = () => { timers.forEach(clearInterval); timers = []; };
  const copy = async t => { try { await navigator.clipboard.writeText(t); return true; } catch { return false; } };

  function loginView() {
    clear();
    root.innerHTML = `<div class="auth"><form class="authcard" id="f" autocomplete="off">
      <div class="lock">${ico.lock}</div>
      <h2>Staff login</h2><p>Authorized access only.</p>
      <label class="field">Login<input id="u" name="u" autocomplete="off" spellcheck="false" required></label>
      <label class="field">Password<input id="p" name="p" type="password" autocomplete="off" required></label>
      <button class="btn btn-main" style="width:100%;justify-content:center;margin-top:18px;height:46px" id="go">Sign in</button>
      <div class="msg" id="m"></div></form></div>`;
    const f = document.getElementById("f"), m = document.getElementById("m"), go = document.getElementById("go");
    f.onsubmit = async e => {
      e.preventDefault(); go.disabled = true; m.className = "msg"; m.textContent = "Checking...";
      try { const r = await Api.post("/api/admin/login", { user: f.u.value, pass: f.p.value }); setTok(r.token); panelView(); }
      catch (err) { m.className = "msg err"; m.textContent = err.message; go.disabled = false; f.p.value = ""; }
    };
  }

  async function panelView() {
    clear();
    let me;
    try { me = await Api.get("/api/admin/me", tok()); } catch { setTok(null); return loginView(); }
    const can = p => me.perms.includes(p);
    const expired = e => { if (e && e.status === 401) { setTok(null); loginView(); return true; } return false; };
    const get = p => Api.get(p, tok()), post = (p, b) => Api.post(p, b, tok());

    const tabs = [
      ["overview", "Overview", can("orders") || can("grant") || can("viewers")],
      ["keys", "Keys", can("keys") || can("genkeys")],
      ["blacklist", "Blacklist", can("blacklist")],
    ].filter(t => t[2]);
    if (!tabs.length) { root.innerHTML = `<div class="empty"><b>No access</b>This account has no permissions.</div>`; return; }

    root.innerHTML = `<div class="adm">
      <div class="adm-top"><h1>Admin <em>panel</em></h1>
        <div class="who"><span>Signed in as <b style="color:#fff">${esc(me.name)}</b></span><button class="btn btn-ghost sm" id="out">Sign out</button></div></div>
      <div class="tabs" id="tabs">${tabs.map(t => `<button data-t="${t[0]}">${t[1]}</button>`).join("")}</div>
      <div id="view"></div></div>`;
    document.getElementById("out").onclick = () => { setTok(null); loginView(); };
    const view = document.getElementById("view");
    const show = name => {
      clear(); view.onclick = null;
      document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === name));
      try { sessionStorage.setItem("plasma_adm_tab", name); } catch { }
      ({ overview, keys, blacklist })[name]();
    };
    document.getElementById("tabs").onclick = e => { const b = e.target.closest("button[data-t]"); if (b) show(b.dataset.t); };

    /* ---------------- overview ---------------- */
    function overview() {
      view.innerHTML = `<div class="adm-grid">
        <div>${can("orders") ? `<section class="card panel"><h3>Recent orders <span class="pill">VIEW ONLY</span></h3><div class="list" id="orders"><div class="none">Loading...</div></div></section>` : ""}</div>
        <div>
          ${can("grant") ? `<section class="card panel"><h3>Customer role</h3><p>Search a member of the Discord server and give them the Customer role.</p>
            <label class="field">Search by name<input id="q" autocomplete="off" spellcheck="false" placeholder="Start typing a username"></label>
            <div class="msg" id="gm"></div><div class="list" id="members"></div></section>` : ""}
          ${can("viewers") ? `<section class="card panel"><h3>On the site now <span class="pill" id="vcount">0</span></h3><p>Discord-signed-in visitors from the last 3 minutes. No IP addresses are collected.</p><div class="list" id="viewers"></div></section>` : ""}
        </div></div>`;

      if (can("orders")) {
        const box = document.getElementById("orders");
        const load = async () => {
          try {
            const { orders } = await get("/api/admin/orders");
            box.innerHTML = orders.length ? orders.map(o => `<div class="order"><div><b>${esc(o.items.join(", ") || "Order")}</b>
              <small>${esc(o.email)} · ${ago(Date.parse(o.created))} · #${esc(String(o.id).slice(-8))}</small></div>
              <div style="display:flex;align-items:center;gap:12px"><span class="st ${/COMPLETE/i.test(o.status) ? "done" : ""}">${esc(String(o.status))}</span><span class="amt">$${o.total.toFixed(2)}</span></div></div>`).join("")
              : `<div class="none">No orders yet.</div>`;
          } catch (e) { if (!expired(e)) box.innerHTML = `<div class="none">${esc(e.message)}</div>`; }
        };
        load(); timers.push(setInterval(load, 60000));
      }

      if (can("grant")) {
        const q = document.getElementById("q"), list = document.getElementById("members"), gm = document.getElementById("gm");
        let t, seq = 0;
        const render = ms => {
          list.innerHTML = ms.length ? ms.map(u => `<div class="row"><img src="${av(u)}" alt=""><div class="t"><b>${esc(u.name)}</b><small>@${esc(u.username)}</small></div>
            ${u.customer ? `<span class="tag">CUSTOMER</span>` : `<button class="btn btn-main sm" data-id="${esc(u.id)}">Give role</button>`}</div>`).join("") : `<div class="none">No members found.</div>`;
        };
        q.oninput = () => {
          clearTimeout(t); const v = q.value.trim();
          if (v.length < 2) { list.innerHTML = ""; return; }
          t = setTimeout(async () => {
            const my = ++seq;
            try { const r = await get("/api/admin/members?q=" + encodeURIComponent(v)); if (my === seq) render(r.members); }
            catch (e) { if (!expired(e)) { gm.className = "msg err"; gm.textContent = e.message; } }
          }, 300);
        };
        list.onclick = async e => {
          const b = e.target.closest("button[data-id]"); if (!b) return;
          b.disabled = true; gm.className = "msg"; gm.textContent = "Giving role...";
          try { await post("/api/admin/grant", { id: b.dataset.id }); gm.className = "msg ok"; gm.textContent = "Customer role given."; q.oninput(); }
          catch (err) { if (!expired(err)) { gm.className = "msg err"; gm.textContent = err.message; b.disabled = false; } }
        };
      }

      if (can("viewers")) {
        const box = document.getElementById("viewers"), cnt = document.getElementById("vcount");
        const load = async () => {
          try {
            const { viewers } = await get("/api/admin/viewers");
            cnt.textContent = viewers.length;
            box.innerHTML = viewers.length ? viewers.map(u => `<div class="row"><img src="${av(u)}" alt=""><div class="t"><b>${esc(u.name)}</b><small>Viewing ${esc(u.page)} · ${ago(u.at)}</small></div><span class="dot"></span></div>`).join("")
              : `<div class="none">Nobody signed in is on the site right now.</div>`;
          } catch (e) { expired(e); }
        };
        load(); timers.push(setInterval(load, 15000));
      }
    }

    /* ---------------- keys ---------------- */
    function keys() {
      view.innerHTML = `
        ${can("genkeys") ? `<section class="card panel"><h3>Generate keys</h3>
          <div class="frm">
            <label class="field">Product<select id="gp">${opts(PRODUCTS)}</select></label>
            <label class="field">Duration<select id="gd">${opts(DURATIONS)}</select></label>
            <label class="field">How many<input id="gc" type="number" min="1" max="10" value="1"></label>
            <label class="field">Discord ID <span class="opt">(optional)</span><input id="gu" inputmode="numeric" autocomplete="off" placeholder="Who it's for"></label>
            <button class="btn btn-main" id="gg" style="align-self:end;height:46px">Generate</button>
          </div>
          <div class="msg" id="gmsg"></div><div class="list" id="gout"></div></section>` : ""}
        ${can("keys") ? `<section class="card panel"><h3>All keys <span class="pill" id="ktotal">0</span></h3>
          <div class="chips" id="kchips"></div>
          <div class="frm slim"><label class="field">Search<input id="ks" autocomplete="off" spellcheck="false" placeholder="Key, owner or product"></label>
            <label class="field">Status<select id="kf"><option value="">All</option><option>unused</option><option>active</option><option>expired</option><option>revoked</option></select></label></div>
          <div class="msg" id="kmsg"></div><div class="list" id="klist"><div class="none">Loading...</div></div></section>` : ""}`;

      if (can("genkeys")) {
        const gg = document.getElementById("gg"), gm = document.getElementById("gmsg"), out = document.getElementById("gout");
        gg.onclick = async () => {
          gg.disabled = true; gm.className = "msg"; gm.textContent = "Generating...";
          try {
            const r = await post("/api/admin/keys/generate", { product: gp.value, duration: gd.value, count: gc.value, user: gu.value.trim() || undefined });
            gm.className = "msg ok"; gm.textContent = `${r.keys.length} key${r.keys.length > 1 ? "s" : ""} created. Click a key to copy.`;
            out.innerHTML = r.keys.map(k => `<div class="row"><div class="t"><b class="mono copy" data-k="${esc(k)}">${esc(k)}</b><small>${esc(gp.selectedOptions[0].text)} · ${esc(gd.selectedOptions[0].text)}</small></div><button class="btn btn-ghost sm copy" data-k="${esc(k)}">Copy</button></div>`).join("");
            if (can("keys")) loadKeys();
          } catch (e) { if (!expired(e)) { gm.className = "msg err"; gm.textContent = e.message; } }
          gg.disabled = false;
        };
        out.onclick = async e => { const c = e.target.closest(".copy"); if (c) { c.textContent === "Copy" && (c.textContent = (await copy(c.dataset.k)) ? "Copied" : "Copy"); } };
      }

      if (can("keys")) {
        const list = document.getElementById("klist"), msg = document.getElementById("kmsg"), chips = document.getElementById("kchips");
        const ks = document.getElementById("ks"), kf = document.getElementById("kf");
        let all = [];
        const draw = () => {
          const q = ks.value.trim().toLowerCase(), f = kf.value;
          const rows = all.filter(k => (!f || k.status === f) && (!q || [k.key, k.product, k.userName, k.userId, k.account].some(x => x && String(x).toLowerCase().includes(q))));
          list.innerHTML = rows.length ? rows.map(k => {
            const when = k.status === "active" ? (k.lifetime ? "Lifetime" : left(k.expiresAt)) : k.status === "unused" ? (k.lifetime ? "Lifetime" : "Starts on first use") : k.status === "expired" ? "Ended " + date(k.expiresAt) : "";
            const owner = k.userId ? (k.userName ? `${esc(k.userName)}` : esc(k.userId)) : k.account ? `acct ${esc(k.account)}` : "No owner";
            return `<div class="row key"><div class="t"><b class="mono copy" data-k="${esc(k.key)}" title="Click to copy">${esc(k.key)}</b>
              <small>${esc(k.product)} · ${esc(k.duration)} · ${owner}${k.activatedAt ? " · activated " + date(k.activatedAt) : ""}${k.hwidTail ? " · device …" + esc(k.hwidTail) : ""}</small></div>
              <div class="kr"><span class="when">${esc(when)}</span><span class="stt ${k.status}">${k.status}</span>
              ${can("revoke") ? (k.status === "revoked" ? `<button class="btn btn-ghost sm" data-a="restore" data-k="${esc(k.key)}">Restore</button>` : `<button class="btn btn-ghost sm bad" data-a="revoke" data-k="${esc(k.key)}">Revoke</button>`) : ""}
              ${can("blacklist") && k.hwidTail ? `<button class="btn btn-ghost sm bad" data-a="hwid" data-k="${esc(k.key)}">Ban device</button>` : ""}</div></div>`;
          }).join("") : `<div class="none">No keys match.</div>`;
        };
        window.loadKeys = async () => {
          try {
            const r = await get("/api/admin/keys");
            all = r.keys; document.getElementById("ktotal").textContent = r.total;
            chips.innerHTML = Object.entries(r.counts).map(([k, v]) => `<span class="chip ${k}"><b>${v}</b> ${k}</span>`).join("");
            draw();
          } catch (e) { if (!expired(e)) list.innerHTML = `<div class="none">${esc(e.message)}</div>`; }
        };
        ks.oninput = draw; kf.onchange = draw;
        list.onclick = async e => {
          const c = e.target.closest(".copy"); if (c && !c.dataset.a) { const o = c.textContent; if (await copy(c.dataset.k)) { c.textContent = "Copied"; setTimeout(() => c.textContent = o, 900); } return; }
          const b = e.target.closest("button[data-a]"); if (!b) return;
          const a = b.dataset.a, k = b.dataset.k;
          try {
            if (a === "hwid") { if (!confirm("Blacklist the device this key is bound to?\nAny key used from that device will stop working.")) return; await post("/api/admin/blacklist/add", { type: "hwid", fromKey: k, reason: "From key " + k.slice(-5) }); msg.className = "msg ok"; msg.textContent = "Device blacklisted."; }
            else if (a === "revoke") { if (!confirm("Revoke this key? The license (and any Fortnite account made with it) stops working.")) return; await post("/api/admin/keys/revoke", { key: k, revoked: true }); msg.className = "msg ok"; msg.textContent = "Key revoked."; loadKeys(); }
            else { await post("/api/admin/keys/revoke", { key: k, revoked: false }); msg.className = "msg ok"; msg.textContent = "Key restored."; loadKeys(); }
          } catch (err) { if (!expired(err)) { msg.className = "msg err"; msg.textContent = err.message; } }
        };
        loadKeys(); timers.push(setInterval(loadKeys, 60000));
      }
    }

    /* ---------------- blacklist ---------------- */
    function blacklist() {
      view.innerHTML = `<div class="adm-grid">
        <div><section class="card panel"><h3>Blacklisted users <span class="pill" id="bu">0</span></h3><p>Blacklisting a user revokes their keys, blocks Fortnite accounts made with them, removes the Customer role and stops new keys being issued to them.</p><div class="list" id="ulist"><div class="none">Loading...</div></div></section>
        <section class="card panel"><h3>Blacklisted devices <span class="pill" id="bh">0</span></h3><p>Any license used from a listed device is refused.</p><div class="list" id="hlist"></div></section></div>
        <div><section class="card panel"><h3>Blacklist a user</h3>
          <label class="field">Discord ID<input id="bid" inputmode="numeric" autocomplete="off" placeholder="Right click user, Copy User ID"></label>
          <label class="field">Reason<input id="br" maxlength="120" autocomplete="off" placeholder="e.g. chargeback, sharing keys"></label>
          <button class="btn btn-main" id="bgo" style="margin-top:14px;height:46px;width:100%;justify-content:center">Blacklist user</button></section>
        <section class="card panel"><h3>Blacklist a device</h3>
          <label class="field">Full HWID<input id="bh_id" autocomplete="off" spellcheck="false"></label>
          <label class="field">Reason<input id="bh_r" maxlength="120" autocomplete="off"></label>
          <button class="btn btn-main" id="bhgo" style="margin-top:14px;height:46px;width:100%;justify-content:center">Blacklist device</button>
          <p style="margin-top:10px">Tip: on the Keys tab, "Ban device" blacklists the device a key is bound to.</p></section>
          <div class="msg" id="bmsg"></div></div></div>`;
      const msg = document.getElementById("bmsg"), ul = document.getElementById("ulist"), hl = document.getElementById("hlist");
      const ok = t => { msg.className = "msg ok"; msg.textContent = t; }, bad = e => { if (!expired(e)) { msg.className = "msg err"; msg.textContent = e.message; } };
      const load = async () => {
        try {
          const r = await get("/api/admin/blacklist");
          document.getElementById("bu").textContent = r.users.length; document.getElementById("bh").textContent = r.hwids.length;
          ul.innerHTML = r.users.length ? r.users.map(u => `<div class="row"><div class="t"><b>${esc(u.name || u.id)}</b><small>${esc(u.id)} · ${esc(u.reason)} · by ${esc(u.by)} ${ago(u.at)}</small></div><button class="btn btn-ghost sm" data-t="user" data-id="${esc(u.id)}">Unblacklist</button></div>`).join("") : `<div class="none">Nobody is blacklisted.</div>`;
          hl.innerHTML = r.hwids.length ? r.hwids.map(h => `<div class="row"><div class="t"><b class="mono">…${esc(h.tail)}</b><small>${esc(h.reason)} · by ${esc(h.by)} ${ago(h.at)}</small></div><button class="btn btn-ghost sm" data-t="hwid" data-id="${esc(h.id)}">Unblacklist</button></div>`).join("") : `<div class="none">No devices listed.</div>`;
        } catch (e) { bad(e); }
      };
      document.getElementById("bgo").onclick = async () => {
        try { const r = await post("/api/admin/blacklist/add", { type: "user", id: bid.value.trim(), reason: br.value }); ok(`Blacklisted. ${r.keysRevoked} key${r.keysRevoked === 1 ? "" : "s"} revoked.`); bid.value = br.value = ""; load(); } catch (e) { bad(e); }
      };
      document.getElementById("bhgo").onclick = async () => {
        try { await post("/api/admin/blacklist/add", { type: "hwid", hwid: bh_id.value.trim(), reason: bh_r.value }); ok("Device blacklisted."); bh_id.value = bh_r.value = ""; load(); } catch (e) { bad(e); }
      };
      view.onclick = async e => {
        const b = e.target.closest("button[data-t]"); if (!b) return;
        try { const r = await post("/api/admin/blacklist/remove", { type: b.dataset.t, id: b.dataset.id }); ok(b.dataset.t === "user" ? `Unblacklisted. ${r.keysRestored} key${r.keysRestored === 1 ? "" : "s"} restored (re-add the Customer role yourself if needed).` : "Device removed."); load(); } catch (err) { bad(err); }
      };
      load();
    }

    let first = "overview";
    try { const s = sessionStorage.getItem("plasma_adm_tab"); if (tabs.some(t => t[0] === s)) first = s; else first = tabs[0][0]; } catch { first = tabs[0][0]; }
    show(first);
  }

  tok() ? panelView() : loginView();
})();
