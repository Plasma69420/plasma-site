/* staff panel UI. No secrets here: every action is checked by the API, which needs a staff login. */
(() => {
  const root = document.getElementById("root");
  if (!root) return;
  const KEY = "plasma_adm";   // sessionStorage: signing out happens when the tab closes
  const tok = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
  const setTok = v => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch { } };
  const agoText = t => { const s = Math.max(0, (Date.now() - t) / 1000 | 0); return s < 60 ? "just now" : s < 3600 ? (s / 60 | 0) + "m ago" : s < 86400 ? (s / 3600 | 0) + "h ago" : (s / 86400 | 0) + "d ago"; };
  const av = u => u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
  let timers = [];
  const clear = () => { timers.forEach(clearInterval); timers = []; };

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
      try {
        const r = await Api.post("/api/admin/login", { user: f.u.value, pass: f.p.value });
        setTok(r.token); panelView();
      } catch (err) { m.className = "msg err"; m.textContent = err.message; go.disabled = false; f.p.value = ""; }
    };
  }

  async function panelView() {
    clear();
    let me;
    try { me = await Api.get("/api/admin/me", tok()); } catch { setTok(null); return loginView(); }
    const can = p => me.perms.includes(p);
    root.innerHTML = `<div class="adm">
      <div class="adm-top"><h1>Admin <em>panel</em></h1>
        <div class="who"><span>Signed in as <b style="color:#fff">${esc(me.name)}</b></span><button class="btn btn-ghost sm" id="out">Sign out</button></div></div>
      <div class="adm-grid">
        <div>${can("orders") ? `<section class="card panel"><h3>Recent orders <span class="pill">VIEW ONLY</span></h3><div class="list" id="orders"><div class="none">Loading...</div></div></section>` : ""}</div>
        <div>
          ${can("grant") ? `<section class="card panel"><h3>Customer role</h3><p>Search a member of the Discord server and give them the Customer role.</p>
            <label class="field">Search by name<input id="q" autocomplete="off" spellcheck="false" placeholder="Start typing a username"></label>
            <div class="msg" id="gm"></div><div class="list" id="members"></div></section>` : ""}
          ${can("viewers") ? `<section class="card panel"><h3>On the site now <span class="pill" id="vcount">0</span></h3><p>Discord-signed-in visitors from the last 3 minutes. No IP addresses are collected.</p><div class="list" id="viewers"></div></section>` : ""}
        </div></div></div>`;
    document.getElementById("out").onclick = () => { setTok(null); loginView(); };
    const expired = e => { if (e.status === 401) { setTok(null); loginView(); return true; } return false; };

    if (can("orders")) {
      const box = document.getElementById("orders");
      const load = async () => {
        try {
          const { orders } = await Api.get("/api/admin/orders", tok());
          box.innerHTML = orders.length ? orders.map(o => `<div class="order"><div><b>${esc(o.items.join(", ") || "Order")}</b>
            <small>${esc(o.email)} · ${agoText(Date.parse(o.created))} · #${esc(String(o.id).slice(-8))}</small></div>
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
          try { const r = await Api.get("/api/admin/members?q=" + encodeURIComponent(v), tok()); if (my === seq) render(r.members); }
          catch (e) { if (!expired(e)) { gm.className = "msg err"; gm.textContent = e.message; } }
        }, 300);
      };
      list.onclick = async e => {
        const b = e.target.closest("button[data-id]"); if (!b) return;
        b.disabled = true; gm.className = "msg"; gm.textContent = "Giving role...";
        try { await Api.post("/api/admin/grant", { id: b.dataset.id }, tok()); gm.className = "msg ok"; gm.textContent = "Customer role given."; q.oninput(); }
        catch (err) { if (!expired(err)) { gm.className = "msg err"; gm.textContent = err.message; b.disabled = false; } }
      };
    }

    if (can("viewers")) {
      const box = document.getElementById("viewers"), cnt = document.getElementById("vcount");
      const load = async () => {
        try {
          const { viewers } = await Api.get("/api/admin/viewers", tok());
          cnt.textContent = viewers.length;
          box.innerHTML = viewers.length ? viewers.map(u => `<div class="row"><img src="${av(u)}" alt=""><div class="t"><b>${esc(u.name)}</b><small>Viewing ${esc(u.page)} · ${agoText(u.at)}</small></div><span class="dot"></span></div>`).join("")
            : `<div class="none">Nobody signed in is on the site right now.</div>`;
        } catch (e) { expired(e); }
      };
      load(); timers.push(setInterval(load, 15000));
    }
  }

  tok() ? panelView() : loginView();
})();
