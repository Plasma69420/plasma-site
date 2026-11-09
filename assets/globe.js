/* Home "worldwide" section: dotted globe that spins on its own and can be dragged, with city cards popping up.
   Land shapes come from world-atlas (110m) via jsDelivr; if that fails the globe still renders as a grid. */
(function () {
  const wrap = document.getElementById("globeWrap"); if (!wrap) return;
  const cv = document.getElementById("globe"), ctx = cv.getContext("2d");
  const cardsEl = document.getElementById("globeCards");
  let W = 0, R = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  function size() { W = wrap.clientWidth; cv.width = W * dpr; cv.height = W * dpr; cv.style.width = W + "px"; cv.style.height = W + "px"; R = W * 0.36; }
  size(); window.addEventListener("resize", size);

  // ---- land dots ----
  let dots = [];
  const grid = () => { const out = []; for (let lat = -80; lat <= 80; lat += 4) for (let lon = -180; lon < 180; lon += 4) out.push([lat, lon, 0]); return out; };
  async function loadLand() {
    try {
      const [topo, tj] = await Promise.all([
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json").then(r => r.json()),
        import("https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm")
      ]);
      const land = tj.feature(topo, topo.objects.land);
      // paint the land onto a small equirectangular canvas, then sample it on a lat/lon grid
      const MW = 720, MH = 360, m = document.createElement("canvas"); m.width = MW; m.height = MH; const mx = m.getContext("2d");
      mx.fillStyle = "#fff";
      // rings that cross the date line are unwrapped and drawn three times (shifted by 360) so they don't smear a band across the map
      const ring = (r, off) => { let prev = null; r.forEach(([lon, lat], i) => { if (prev !== null) { while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; } prev = lon; const x = (lon + off + 180) / 360 * MW, y = (90 - lat) / 180 * MH; i ? mx.lineTo(x, y) : mx.moveTo(x, y); }); mx.closePath(); };
      land.features.forEach(f => { const g = f.geometry; const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates; polys.forEach(poly => { for (const off of [0, -360, 360]) { mx.beginPath(); poly.forEach(r => ring(r, off)); mx.fill("evenodd"); } }); });
      const px = mx.getImageData(0, 0, MW, MH).data, out = [], step = 1.9;
      for (let lat = -54; lat <= 80; lat += step) {
        const n = Math.max(8, Math.round(360 / step * Math.cos(lat * Math.PI / 180)));
        for (let i = 0; i < n; i++) { const lon = -180 + i * 360 / n; const x = Math.floor((lon + 180) / 360 * MW), y = Math.floor((90 - lat) / 180 * MH); if (px[(y * MW + x) * 4 + 3] > 100) out.push([lat, lon, 1]); }
      }
      dots = out;
    } catch (e) { dots = grid(); }
  }
  dots = grid(); loadLand();

  // ---- cities shown as cards ----
  const CITIES = [
    ["London", "UK", 51.5, -0.1], ["New York", "US", 40.7, -74], ["Toronto", "CA", 43.7, -79.4], ["Los Angeles", "US", 34, -118.2],
    ["Berlin", "DE", 52.5, 13.4], ["Paris", "FR", 48.9, 2.35], ["Stockholm", "SE", 59.3, 18.1], ["Madrid", "ES", 40.4, -3.7],
    ["São Paulo", "BR", -23.5, -46.6], ["Sydney", "AU", -33.9, 151.2], ["Singapore", "SG", 1.35, 103.8], ["Dubai", "AE", 25.2, 55.3],
    ["Warsaw", "PL", 52.2, 21], ["Amsterdam", "NL", 52.4, 4.9], ["Mexico City", "MX", 19.4, -99.1], ["Tokyo", "JP", 35.7, 139.7]
  ];
  const sellable = () => (typeof CONFIG !== "undefined" ? CONFIG.products.filter(p => p.plans && p.plans.length && !p.down && !p.soon) : []);
  let active = []; // {city, el, born}

  // ---- rotation state (auto spin + drag with inertia) ----
  let rotY = 1.2, tilt = -0.32, vel = 0.0022, dragging = false, lastX = 0, lastY = 0, lastT = 0;
  const D2R = Math.PI / 180;
  function project(lat, lon) {
    const la = lat * D2R, lo = lon * D2R + rotY;
    let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
    const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
    return [W / 2 + x * R, W / 2 - y2 * R, z2];
  }
  wrap.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); wrap.setPointerCapture(e.pointerId); wrap.classList.add("grab"); });
  wrap.addEventListener("pointermove", e => {
    if (!dragging) return; const now = performance.now(), dx = e.clientX - lastX, dy = e.clientY - lastY;
    rotY += dx * 0.006; tilt = Math.max(-0.9, Math.min(0.9, tilt + dy * 0.004)); vel = dx * 0.006 / Math.max(16, now - lastT) * 16;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  const end = () => { dragging = false; wrap.classList.remove("grab"); };
  wrap.addEventListener("pointerup", end); wrap.addEventListener("pointercancel", end);

  function spawn() {
    const list = sellable(); if (!list.length) return;
    const vis = CITIES.filter(c => project(c[2], c[3])[2] > 0.35 && !active.some(a => { if (a.city === c) return true; const p1 = project(a.city[2], a.city[3]), p2 = project(c[2], c[3]); return Math.abs(p1[1] - p2[1]) < 90 && Math.abs(p1[0] - p2[0]) < 260; }));
    if (!vis.length) return;
    const c = vis[Math.floor(Math.random() * vis.length)], p = list[Math.floor(Math.random() * list.length)], pl = p.plans[Math.floor(Math.random() * p.plans.length)];
    const el = document.createElement("div"); el.className = "glc";
    el.innerHTML = '<i><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></i><div><small>Instant delivery</small><b>' + c[0] + ' <em>· ' + c[1] + '</em></b><span>' + p.name + ' · ' + pl.n + '</span></div><strong>' + money(pl.p) + '</strong>';
    cardsEl.appendChild(el); requestAnimationFrame(() => el.classList.add("on"));
    active.push({ city: c, el, born: performance.now() });
    if (active.length > 2) { const old = active.shift(); old.el.classList.remove("on"); setTimeout(() => old.el.remove(), 400); }
  }
  setInterval(() => { if (!document.hidden) spawn(); }, 2600); setTimeout(spawn, 700);

  function frame() {
    if (!dragging) { rotY += vel; vel += (0.0022 - vel) * 0.02; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    // glow + body
    const g = ctx.createRadialGradient(W / 2, W / 2, R * 0.6, W / 2, W / 2, R * 1.25); g.addColorStop(0, "rgba(77,181,255,0)"); g.addColorStop(0.78, "rgba(77,181,255,.18)"); g.addColorStop(1, "rgba(77,181,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W / 2, W / 2, R * 1.25, 0, 7); ctx.fill();
    const b = ctx.createRadialGradient(W / 2 - R * .3, W / 2 - R * .35, R * .1, W / 2, W / 2, R); b.addColorStop(0, "#0e1d36"); b.addColorStop(1, "#060c18");
    ctx.fillStyle = b; ctx.beginPath(); ctx.arc(W / 2, W / 2, R, 0, 7); ctx.fill();
    // dots
    const ds = Math.max(1.3, R / 150);
    for (const d of dots) { const [x, y, z] = project(d[0], d[1]); if (z <= 0) continue; ctx.globalAlpha = 0.25 + z * 0.75; ctx.fillStyle = d[2] ? "#9fd2ff" : "rgba(120,170,230,.35)"; ctx.fillRect(x - ds / 2, y - ds / 2, ds, ds); }
    ctx.globalAlpha = 1;
    // city pins + card positions
    for (const c of CITIES) { const [x, y, z] = project(c[2], c[3]); if (z <= 0.05) continue; ctx.fillStyle = "rgba(77,181,255," + (0.4 + z * 0.6) + ")"; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
    for (const a of active) {
      const [x, y, z] = project(a.city[2], a.city[3]);
      a.el.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)"; a.el.style.opacity = z > 0.1 ? "" : "0";
      const t = (performance.now() - a.born) / 1000, pr = (t % 1.6) / 1.6;
      if (z > 0.05) { ctx.strokeStyle = "rgba(77,181,255," + (1 - pr) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4 + pr * 18, 0, 7); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); }
    }
    // rim
    ctx.strokeStyle = "rgba(77,181,255,.9)"; ctx.lineWidth = 2.5; ctx.shadowColor = "rgba(77,181,255,.9)"; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(W / 2, W / 2, R, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
