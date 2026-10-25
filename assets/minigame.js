/* ESP Aim Trainer: a small first-person target range. Everything here is a toy in your browser, nothing touches a real game. */
(() => {
  const stage = document.getElementById("mgStage"), cv = document.getElementById("mg"), ctx = cv.getContext("2d");
  const over = document.getElementById("mgOver"), btn = document.getElementById("mgPlay");
  const $ = id => document.getElementById(id);
  let W = 800, H = 450, dpr = 1;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener("resize", resize); document.addEventListener("fullscreenchange", () => setTimeout(resize, 60)); resize();

  // ---------- settings (bound to the panels under the game) ----------
  const cfg = { weapon: "rifle", shootBack: true, skel: true, box: true, name: true, radar: true, fovCircle: true, bone: "head", radius: 150, smooth: 60, vol: 0.7, music: true, mute: false };
  const WEAPONS = {
    rifle: { label: "RIFLE", auto: true, rate: 0.095, mag: 30, body: 22, head: 60, reload: 1.6, recoil: 0.012 },
    pistol: { label: "PISTOL", auto: false, rate: 0.2, mag: 12, body: 34, head: 90, reload: 1.2, recoil: 0.02 },
    sniper: { label: "SNIPER", auto: false, rate: 1.0, mag: 5, body: 100, head: 300, reload: 2.2, recoil: 0.05 }
  };
  const NAMES = ["Nova", "Raze", "Vex", "Kilo", "Echo", "Jinx", "Onyx", "Ryu", "Blitz", "Zed", "Mako", "Sable"];

  // ---------- state ----------
  let P, npcs, boxes, fx, running = false, dead = false, bossDone = false, last = 0, locked = false;
  const keys = {}; let mouseL = false, mouseR = false;
  const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
  const rnd = (a, b) => a + Math.random() * (b - a);

  function reset() {
    P = { x: 0, z: 0, y: 0, vy: 0, yaw: 0, pitch: 0, hp: 100, kills: 0, score: 0, mult: 1, lastKill: -99, shots: 0, hits: 0, heads: 0, ammo: WEAPONS[cfg.weapon].mag, cd: 0, reloading: 0, recoil: 0, t: 0 };
    boxes = [[-12, 14, 4, 3.4], [10, 20, 5, 4], [-22, 30, 6, 3], [18, 36, 5, 3.6], [0, 42, 7, 4.4], [-30, 12, 3, 3], [28, 8, 4, 3.2], [-6, 26, 2.4, 2.2]].map(([x, z, w, h]) => ({ x, z, w, h }));
    npcs = []; fx = { flash: 0, shake: 0, hit: 0, toast: "", toastT: 0, hitmark: 0 }; bossDone = false;
    for (let i = 0; i < 6; i++) spawn();
  }
  function spawn(boss) {
    const a = rnd(0, Math.PI * 2), d = rnd(14, 34);
    const n = { x: P.x + Math.sin(a) * d, z: P.z + Math.cos(a) * d, hp: 100, max: 100, tx: 0, tz: 0, shoot: rnd(1, 2.5), name: NAMES[(Math.random() * NAMES.length) | 0], dead: false, t: Math.random() * 9, scale: 1, boss: false, flash: 0, speed: rnd(1.4, 2.4) };
    if (boss) { n.boss = true; n.name = "BRUNO"; n.hp = n.max = 1800; n.scale = 2.4; n.speed = 1.7; n.x = P.x + Math.sin(P.yaw) * 30; n.z = P.z + Math.cos(P.yaw) * 30; }
    pick(n); npcs.push(n); return n;
  }
  const pick = n => { const a = rnd(0, 6.28), d = rnd(6, 26); n.tx = P.x + Math.sin(a) * d; n.tz = P.z + Math.cos(a) * d; };
  const toast = t => { fx.toast = t; fx.toastT = 2.6; };

  // ---------- audio ----------
  let ac = null, master = null, musicTimer = null;
  function audio() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination); setVol(); } catch { } }
  const setVol = () => { if (master) master.gain.value = cfg.mute ? 0 : cfg.vol * 0.5; };
  function tone(f, d, type, v, f2) { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = type || "sine"; o.frequency.value = f; if (f2) o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + d); g.gain.setValueAtTime(v || 0.3, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.connect(g); g.connect(master); o.start(); o.stop(ac.currentTime + d); }
  function noise(d, v) { if (!ac) return; const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), c = b.getChannelData(0); for (let i = 0; i < c.length; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / c.length); const s = ac.createBufferSource(), g = ac.createGain(); g.gain.value = v; s.buffer = b; s.connect(g); g.connect(master); s.start(); }
  function music(on) {
    clearInterval(musicTimer); musicTimer = null; if (!on || !ac) return;
    const scale = [110, 130.8, 146.8, 165, 196, 220]; let i = 0;
    musicTimer = setInterval(() => { if (running && cfg.music) { tone(scale[(i * 3 + (i >> 2)) % scale.length], 0.5, "triangle", 0.05); if (i % 4 === 0) tone(scale[0] / 2, 0.9, "sine", 0.07); } i++; }, 260);
  }

  // ---------- projection ----------
  const hfov = () => (cfg.weapon === "sniper" && mouseR ? 0.5 : 1.3);
  const focal = () => (W / 2) / Math.tan(hfov() / 2);
  const eye = () => 1.65 + P.y;
  function proj(x, y, z) {
    const dx = x - P.x, dz = z - P.z, s = Math.sin(P.yaw), c = Math.cos(P.yaw);
    const zc = dx * s + dz * c, xc = dx * c - dz * s;
    if (zc < 0.25) return null;
    const f = focal(), hor = H / 2 + Math.tan(P.pitch) * f;
    return { x: W / 2 + xc / zc * f, y: hor + (eye() - y) / zc * f, s: f / zc, z: zc };
  }
  function line3(x1, y1, z1, x2, y2, z2) {
    const dx1 = x1 - P.x, dz1 = z1 - P.z, dx2 = x2 - P.x, dz2 = z2 - P.z, s = Math.sin(P.yaw), c = Math.cos(P.yaw);
    let a = dx1 * s + dz1 * c, b = dx2 * s + dz2 * c;
    if (a < 0.3 && b < 0.3) return;
    if (a < 0.3) { const t = (0.3 - a) / (b - a); x1 += (x2 - x1) * t; z1 += (z2 - z1) * t; } else if (b < 0.3) { const t = (0.3 - b) / (a - b); x2 += (x1 - x2) * t; z2 += (z1 - z2) * t; }
    const p = proj(x1, y1, z1), q = proj(x2, y2, z2); if (!p || !q) return;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }

  // ---------- update ----------
  function update(dt) {
    P.t += dt;
    // look + move
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 7.5 : 4.5) * dt;
    let mx = 0, mz = 0; const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
    if (keys.KeyW) { mx += s; mz += c; } if (keys.KeyS) { mx -= s; mz -= c; } if (keys.KeyD) { mx += c; mz -= s; } if (keys.KeyA) { mx -= c; mz += s; }
    const ml = Math.hypot(mx, mz) || 1; let nx = P.x + mx / ml * sp * (mx || mz ? 1 : 0), nz = P.z + mz / ml * sp * (mx || mz ? 1 : 0);
    for (const b of boxes) if (Math.abs(nx - b.x) < b.w / 2 + 0.4 && Math.abs(nz - b.z) < 1.2 + 0.4) { nx = P.x; nz = P.z; }
    P.x = Math.max(-55, Math.min(55, nx)); P.z = Math.max(-55, Math.min(55, nz));
    if (keys.Space && P.y === 0) P.vy = 5.2; P.vy -= 14 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0 && P.vy < 0) P.vy = 0;
    // aim lock (right mouse)
    if (mouseR) {
      const t = nearestInFov();
      if (t) {
        const by = t.n.boss ? (cfg.bone === "head" ? 3.7 : 2.6) : (cfg.bone === "head" ? 1.62 : 1.2);
        const dx = t.n.x - P.x, dz = t.n.z - P.z, ty = Math.atan2(dx, dz), tp = Math.atan2(by - eye(), Math.hypot(dx, dz));
        const a = Math.min(1, dt * 700 / (cfg.smooth + 12));
        P.yaw += ang(ty - P.yaw) * a; P.pitch += (tp - P.pitch) * a;
      }
    }
    P.pitch = Math.max(-0.9, Math.min(0.9, P.pitch)); P.recoil *= Math.pow(0.001, dt);
    // shooting
    P.cd -= dt; if (P.reloading > 0) { P.reloading -= dt; if (P.reloading <= 0) P.ammo = WEAPONS[cfg.weapon].mag; }
    const w = WEAPONS[cfg.weapon];
    if (mouseL && P.cd <= 0 && P.reloading <= 0 && (w.auto || !mouseL.fired)) { fire(); if (!w.auto) mouseL.fired = true; }
    // npcs
    let alive = 0;
    for (const n of npcs) {
      if (n.dead) continue; alive++;
      n.t += dt; n.flash = Math.max(0, n.flash - dt);
      const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz);
      const pd = Math.hypot(P.x - n.x, P.z - n.z), stand = cfg.shootBack && pd < 30;
      if (d < 1) pick(n); else if (!stand || n.boss) { n.x += dx / d * n.speed * dt; n.z += dz / d * n.speed * dt; }
      if (cfg.shootBack && pd < 38) {
        n.shoot -= dt;
        if (n.shoot <= 0) {
          n.shoot = n.boss ? rnd(0.45, 0.8) : rnd(1.0, 2.4);
          if (Math.random() < Math.max(0.1, (n.boss ? 0.75 : 0.5) - pd / 80)) { hurt(n.boss ? 11 : 7); }
          tone(n.boss ? 120 : 200, 0.12, "sawtooth", 0.08, 70);
        }
      }
    }
    // boss + respawn
    if (!bossDone && P.kills >= 10 && !npcs.some(n => n.boss && !n.dead)) { spawnBoss(); }
    while (npcs.filter(n => !n.dead && !n.boss).length < 6) spawn();
    npcs = npcs.filter(n => !n.dead || n.fade === undefined || n.fade > 0);
    for (const n of npcs) if (n.dead) n.fade -= dt;
    if (P.t - P.lastKill > 4) P.mult = 1;
    fx.flash = Math.max(0, fx.flash - dt * 2.2); fx.shake = Math.max(0, fx.shake - dt * 3); fx.toastT -= dt; fx.hitmark = Math.max(0, fx.hitmark - dt * 5);
  }
  function spawnBoss() { bossDone = true; spawn(true); toast("BRUNO HAS ARRIVED"); tone(90, 0.8, "sawtooth", 0.25, 45); }
  function hurt(d) { P.hp -= d; fx.flash = 1; fx.shake = 0.5; noise(0.08, 0.25); if (P.hp <= 0 && !dead) die(); }
  function die() { dead = true; running = false; if (document.pointerLockElement) document.exitPointerLock(); showOverlay("You were eliminated", `Score <b>${P.score.toLocaleString()}</b> &nbsp;·&nbsp; Kills <b>${P.kills}</b> &nbsp;·&nbsp; Headshots <b>${P.heads}</b>`, "Play again"); }
  function nearestInFov() {
    let best = null, bd = 1e9; const cx = W / 2, cy = H / 2;
    for (const n of npcs) {
      if (n.dead) continue; const p = proj(n.x, (n.boss ? 2.6 : 1.2), n.z); if (!p) continue;
      const d = Math.hypot(p.x - cx, p.y - cy); if (d < cfg.radius && d < bd) { bd = d; best = { n, p }; }
    } return best;
  }
  function fire() {
    const w = WEAPONS[cfg.weapon]; if (P.ammo <= 0) { reload(); return; }
    P.ammo--; P.cd = w.rate; P.shots++; P.recoil += w.recoil; P.pitch += w.recoil * 0.6; fx.shake = Math.max(fx.shake, 0.18);
    noise(cfg.weapon === "sniper" ? 0.22 : 0.07, cfg.weapon === "sniper" ? 0.5 : 0.28);
    // hit test at the crosshair, nearest first
    const cx = W / 2, cy = H / 2; let hit = null;
    for (const n of npcs.slice().sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))) {
      if (n.dead) continue; const g = geo(n); if (!g) continue;
      if (Math.hypot(cx - g.head.x, cy - g.head.y) <= g.head.r) { hit = { n, head: true }; break; }
      if (cx >= g.x0 && cx <= g.x1 && cy >= g.y0 && cy <= g.y1) { hit = { n, head: false }; break; }
    }
    if (hit) {
      P.hits++; fx.hitmark = 1; const n = hit.n; n.flash = 0.12; const dmg = hit.head ? w.head : w.body;
      if (hit.head) { P.heads++; tone(1400, 0.1, "sine", 0.25); } else tone(700, 0.06, "square", 0.12);
      n.hp -= dmg; if (n.hp <= 0) kill(n, hit.head);
    }
    if (P.ammo <= 0) reload();
  }
  function kill(n, head) {
    n.dead = true; n.fade = 0.5; P.kills++;
    if (P.t - P.lastKill < 4) P.mult = Math.min(5, P.mult + 1); P.lastKill = P.t;
    const base = n.boss ? 5000 : head ? 250 : 100; P.score += base * P.mult;
    if (n.boss) toast("BRUNO DOWN  +" + (5000 * P.mult).toLocaleString()); else if (P.mult > 1) toast("x" + P.mult + " CHAIN");
    tone(520, 0.18, "triangle", 0.2, 880);
  }
  function reload() { if (P.reloading > 0) return; P.reloading = WEAPONS[cfg.weapon].reload; tone(300, 0.15, "square", 0.08); }
  function geo(n) {
    const f = proj(n.x, 0, n.z), t = proj(n.x, 1.82 * n.scale, n.z), h = proj(n.x, 1.62 * n.scale, n.z); if (!f || !t || !h) return null;
    const hw = 0.28 * n.scale * f.s;
    return { f, t, head: { x: h.x, y: h.y, r: 0.17 * n.scale * f.s }, x0: f.x - hw, x1: f.x + hw, y0: h.y + 0.17 * n.scale * f.s, y1: f.y, hw };
  }

  // ---------- render ----------
  function render() {
    const sx = (Math.random() - 0.5) * fx.shake * 7, sy = (Math.random() - 0.5) * fx.shake * 7;
    ctx.save(); ctx.translate(sx, sy);
    const f = focal(), hor = H / 2 + Math.tan(P.pitch) * f;
    // sky + ground
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(40, hor)); sky.addColorStop(0, "#04141b"); sky.addColorStop(1, "#0d4a63"); ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, Math.max(0, hor) + 10);
    const gr = ctx.createLinearGradient(0, hor, 0, H); gr.addColorStop(0, "#0a2a37"); gr.addColorStop(1, "#04141b"); ctx.fillStyle = gr; ctx.fillRect(-10, Math.max(0, hor), W + 20, H);
    ctx.strokeStyle = "rgba(31,182,255,.18)"; ctx.lineWidth = 1;
    const gx = Math.round(P.x / 4) * 4, gz = Math.round(P.z / 4) * 4;
    for (let i = -14; i <= 14; i++) { line3(gx + i * 4, 0, gz - 56, gx + i * 4, 0, gz + 56); line3(gx - 56, 0, gz + i * 4, gx + 56, 0, gz + i * 4); }
    // drawables sorted far -> near
    const items = [];
    for (const b of boxes) { const p = proj(b.x, 0, b.z); if (p) items.push({ z: p.z, kind: "box", b }); }
    for (const n of npcs) { const p = proj(n.x, 0, n.z); if (p) items.push({ z: p.z, kind: "npc", n }); }
    items.sort((a, b) => b.z - a.z);
    for (const it of items) it.kind === "box" ? drawBox(it.b) : drawNpc(it.n);
    // ESP overlays on top of everything (like a real overlay)
    for (const n of npcs) if (!n.dead) drawEsp(n);
    ctx.restore();
    drawHud();
  }
  function drawBox(b) {
    const a = proj(b.x - b.w / 2, 0, b.z), c = proj(b.x + b.w / 2, b.h, b.z); if (!a || !c) return;
    const g = ctx.createLinearGradient(0, c.y, 0, a.y); g.addColorStop(0, "#14516a"); g.addColorStop(1, "#0a2f3f");
    ctx.fillStyle = g; ctx.fillRect(a.x, c.y, c.x - a.x, a.y - c.y); ctx.strokeStyle = "rgba(31,182,255,.35)"; ctx.lineWidth = 1.5; ctx.strokeRect(a.x, c.y, c.x - a.x, a.y - c.y);
  }
  function drawNpc(n) {
    const g = geo(n); if (!g) return; const s = g.f.s * n.scale, alpha = n.dead ? Math.max(0, n.fade / 0.5) : 1;
    ctx.save(); ctx.globalAlpha = alpha;
    const sway = Math.sin(n.t * 6) * 0.05 * s, col = n.flash > 0 ? "#ffffff" : n.boss ? "#ff4a3d" : "#e0533f", dark = n.flash > 0 ? "#dddddd" : n.boss ? "#8f1d16" : "#7c2a1f";
    const X = g.f.x, Y = g.f.y;
    ctx.fillStyle = dark; ctx.fillRect(X - 0.2 * s, Y - 0.9 * s, 0.17 * s, 0.9 * s + sway); ctx.fillRect(X + 0.03 * s, Y - 0.9 * s, 0.17 * s, 0.9 * s - sway);   // legs
    const tg = ctx.createLinearGradient(0, Y - 1.5 * s, 0, Y - 0.85 * s); tg.addColorStop(0, col); tg.addColorStop(1, dark); ctx.fillStyle = tg;
    ctx.fillRect(X - 0.28 * s, Y - 1.5 * s, 0.56 * s, 0.65 * s);                                                                                    // torso
    ctx.fillStyle = dark; ctx.fillRect(X - 0.4 * s, Y - 1.45 * s, 0.12 * s, 0.6 * s); ctx.fillRect(X + 0.28 * s, Y - 1.45 * s, 0.12 * s, 0.6 * s);   // arms
    ctx.fillStyle = "#f1d2b8"; ctx.beginPath(); ctx.arc(g.head.x, g.head.y, g.head.r, 0, 6.3); ctx.fill();                                           // head
    ctx.fillStyle = "#222"; ctx.fillRect(X - 0.2 * s * 0.7, Y - 1.62 * s - 0.04 * s, 0.34 * s, 0.07 * s);
    ctx.restore();
  }
  function drawEsp(n) {
    const g = geo(n); if (!g) return; const x0 = g.f.x - g.hw - 4, x1 = g.f.x + g.hw + 4, y0 = g.t.y - 4, y1 = g.f.y + 2, w = x1 - x0, h = y1 - y0;
    ctx.lineWidth = 1.6;
    if (cfg.box) {
      ctx.strokeStyle = n.boss ? "#ffd34d" : "#ffffff"; const l = Math.max(6, Math.min(w, h) * 0.25); ctx.beginPath();
      ctx.moveTo(x0, y0 + l); ctx.lineTo(x0, y0); ctx.lineTo(x0 + l, y0); ctx.moveTo(x1 - l, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + l);
      ctx.moveTo(x0, y1 - l); ctx.lineTo(x0, y1); ctx.lineTo(x0 + l, y1); ctx.moveTo(x1 - l, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - l); ctx.stroke();
    }
    if (cfg.skel) {
      const X = g.f.x, s = g.f.s * n.scale, Y = g.f.y; ctx.strokeStyle = "#37c4ff"; ctx.beginPath();
      ctx.moveTo(g.head.x, g.head.y + g.head.r); ctx.lineTo(X, Y - 0.95 * s);
      ctx.moveTo(X - 0.3 * s, Y - 1.4 * s); ctx.lineTo(X + 0.3 * s, Y - 1.4 * s); ctx.moveTo(X - 0.3 * s, Y - 1.4 * s); ctx.lineTo(X - 0.36 * s, Y - 0.85 * s); ctx.moveTo(X + 0.3 * s, Y - 1.4 * s); ctx.lineTo(X + 0.36 * s, Y - 0.85 * s);
      ctx.moveTo(X, Y - 0.95 * s); ctx.lineTo(X - 0.12 * s, Y); ctx.moveTo(X, Y - 0.95 * s); ctx.lineTo(X + 0.12 * s, Y); ctx.stroke();
    }
    if (cfg.name) { ctx.fillStyle = n.boss ? "#ffd34d" : "#fff"; ctx.font = "700 " + Math.max(10, Math.min(15, 0.2 * g.f.s * n.scale)) + "px Manrope,sans-serif"; ctx.textAlign = "center"; ctx.fillText(n.name + "  " + Math.round(Math.hypot(P.x - n.x, P.z - n.z)) + "m", g.f.x, y0 - 6); }
    if (n.hp < n.max || n.boss) { const hp = Math.max(0, n.hp / n.max); ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(x0, y1 + 4, w, 4); ctx.fillStyle = hp > 0.5 ? "#44e08a" : hp > 0.25 ? "#ffb02e" : "#ff4d4d"; ctx.fillRect(x0, y1 + 4, w * hp, 4); }
  }
  function drawHud() {
    const cx = W / 2, cy = H / 2;
    if (cfg.fovCircle) { ctx.strokeStyle = mouseR ? "rgba(31,182,255,.9)" : "rgba(255,255,255,.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, cfg.radius, 0, 6.3); ctx.stroke(); }
    ctx.strokeStyle = fx.hitmark > 0 ? "#ff5a5a" : "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 3, cy); ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 9, cy); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy - 3); ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 9); ctx.stroke();
    // hurt vignette
    if (fx.flash > 0) { const v = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.9); v.addColorStop(0, "rgba(255,0,0,0)"); v.addColorStop(1, "rgba(255,30,30," + 0.5 * fx.flash + ")"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    // gun
    const gx = W - 250 + (P.recoil * 700), gy = H - 150 + P.recoil * 300; ctx.save(); ctx.translate(gx, gy); ctx.fillStyle = "#0b1a21"; ctx.fillRect(0, 40, 190, 54); ctx.fillStyle = "#16313d"; ctx.fillRect(40, 20, 150, 28); ctx.fillStyle = "#1fb6ff"; ctx.fillRect(150, 28, 30, 4); ctx.fillStyle = "#0b1a21"; ctx.fillRect(70, 94, 26, 54); ctx.restore();
    // text hud
    ctx.textAlign = "left"; ctx.font = "700 13px Manrope,sans-serif"; ctx.fillStyle = "#ffd34d";
    const acc = P.shots ? Math.round(P.hits / P.shots * 100) : 0;
    ctx.fillText(`Kills ${P.kills}  ·  Headshots ${P.heads}  ·  Accuracy ${acc}%`, 16, 24); ctx.fillText(`Score ${P.score.toLocaleString()}${P.mult > 1 ? "   x" + P.mult : ""}`, 16, 44);
    // health + ammo
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(16, H - 34, 190, 12); ctx.fillStyle = P.hp > 40 ? "#44e08a" : "#ff4d4d"; ctx.fillRect(16, H - 34, 190 * Math.max(0, P.hp) / 100, 12);
    ctx.fillStyle = "#fff"; ctx.fillText(Math.max(0, Math.ceil(P.hp)) + " HP", 214, H - 24);
    ctx.textAlign = "right"; ctx.font = "800 22px Manrope,sans-serif"; ctx.fillText(P.reloading > 0 ? "RELOADING" : P.ammo + " / " + WEAPONS[cfg.weapon].mag, W - 18, H - 22); ctx.font = "700 11px Manrope,sans-serif"; ctx.fillStyle = "#7fd6ff"; ctx.fillText(WEAPONS[cfg.weapon].label, W - 18, H - 46);
    // boss bar
    const b = npcs.find(n => n.boss && !n.dead); if (b) { const bw = Math.min(420, W * 0.5), bx = cx - bw / 2; ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(bx, 16, bw, 12); ctx.fillStyle = "#ff4a3d"; ctx.fillRect(bx, 16, bw * Math.max(0, b.hp / b.max), 12); ctx.textAlign = "center"; ctx.fillStyle = "#ffd34d"; ctx.font = "800 12px Manrope,sans-serif"; ctx.fillText("BRUNO", cx, 46); }
    // radar
    if (cfg.radar) {
      const R = 52, rx = W - R - 18, ry = R + 18; ctx.fillStyle = "rgba(4,20,27,.7)"; ctx.beginPath(); ctx.arc(rx, ry, R, 0, 6.3); ctx.fill(); ctx.strokeStyle = "rgba(31,182,255,.5)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - R, ry); ctx.lineTo(rx + R, ry); ctx.moveTo(rx, ry - R); ctx.lineTo(rx, ry + R); ctx.strokeStyle = "rgba(31,182,255,.18)"; ctx.stroke();
      const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
      for (const n of npcs) { if (n.dead) continue; const dx = n.x - P.x, dz = n.z - P.z, fx2 = (dx * s + dz * c) / 45 * R, rx2 = (dx * c - dz * s) / 45 * R; const d = Math.hypot(fx2, rx2); const k = d > R - 4 ? (R - 4) / d : 1; ctx.fillStyle = n.boss ? "#ffd34d" : "#ff5a4a"; ctx.beginPath(); ctx.arc(rx + rx2 * k, ry - fx2 * k, n.boss ? 5 : 3, 0, 6.3); ctx.fill(); }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(rx, ry - 6); ctx.lineTo(rx - 4, ry + 4); ctx.lineTo(rx + 4, ry + 4); ctx.fill();
    }
    // toast
    if (fx.toastT > 0) { ctx.textAlign = "center"; ctx.globalAlpha = Math.min(1, fx.toastT); ctx.fillStyle = "#ffd34d"; ctx.font = "800 26px Manrope,sans-serif"; ctx.fillText(fx.toast, cx, H * 0.28); ctx.globalAlpha = 1; }
  }

  // ---------- loop + overlay ----------
  function frame(t) { requestAnimationFrame(frame); const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; if (running) update(dt); render(); }
  function showOverlay(title, html, label) { $("mgTitle").textContent = title; $("mgText").innerHTML = html; btn.textContent = label; over.hidden = false; }
  const DESC = "Hunt down the NPC players. Hold right click to lock onto the nearest target inside your FOV circle. Chain kills for a score multiplier, and watch out: they shoot back. Reach 10 kills and something big shows up.";
  function start() {
    audio(); if (ac && ac.state === "suspended") ac.resume();
    if (dead || !P) { reset(); dead = false; }
    over.hidden = true; running = true; music(cfg.music);
    try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch { }
  }
  btn.addEventListener("click", start);
  cv.addEventListener("click", () => { if (!running && !over.hidden === false) start(); else if (running && !document.pointerLockElement) { try { cv.requestPointerLock(); } catch { } } });
  document.addEventListener("pointerlockchange", () => { locked = document.pointerLockElement === cv; if (!locked && running && !dead) { running = false; showOverlay("Paused", DESC, "Click to Play"); mouseL = mouseR = false; } });
  document.addEventListener("mousemove", e => { if (!locked || !running) return; const k = cfg.weapon === "sniper" && mouseR ? 0.0007 : 0.0022; P.yaw += e.movementX * k; P.pitch -= e.movementY * k; });
  cv.addEventListener("mousedown", e => { if (!running) return; if (e.button === 0) mouseL = { fired: false }; if (e.button === 2) mouseR = true; });
  document.addEventListener("mouseup", e => { if (e.button === 0) mouseL = false; if (e.button === 2) mouseR = false; });
  cv.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (!running) return; keys[e.code] = true; if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyR") reload(); if (e.code === "Digit1") setWeapon("rifle"); if (e.code === "Digit2") setWeapon("pistol"); if (e.code === "Digit3") setWeapon("sniper");
    if (e.code === "KeyX") toggle("skel"); if (e.code === "KeyC") toggle("box"); if (e.code === "KeyV") toggle("name"); if (e.code === "KeyB") toggle("fovCircle");
    if (e.code === "KeyZ") { cfg.bone = cfg.bone === "head" ? "chest" : "head"; sync(); } if (e.code === "KeyM") { cfg.mute = !cfg.mute; setVol(); sync(); }
    if (e.code === "KeyP" && !bossDone) { spawnBoss(); }
  });
  document.addEventListener("keyup", e => { keys[e.code] = false; });
  $("mgFull").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen && stage.requestFullscreen(); });

  // ---------- settings panels ----------
  function setWeapon(w) { cfg.weapon = w; if (P) { P.ammo = WEAPONS[w].mag; P.reloading = 0; P.cd = 0.2; } sync(); }
  function toggle(k) { cfg[k] = !cfg[k]; sync(); }
  function sync() {
    document.querySelectorAll("[data-w]").forEach(b => b.classList.toggle("on", b.dataset.w === cfg.weapon));
    document.querySelectorAll("[data-t]").forEach(b => b.classList.toggle("on", !!cfg[b.dataset.t]));
    document.querySelectorAll("[data-bone]").forEach(b => b.classList.toggle("on", b.dataset.bone === cfg.bone));
    $("mgMusic").classList.toggle("on", cfg.music); $("mgMute").classList.toggle("on", cfg.mute);
    $("mgWdesc").textContent = { rifle: "Full auto, 30 rounds", pistol: "Semi auto, 12 rounds", sniper: "Bolt action, 5 rounds. Hold right click to scope" }[cfg.weapon];
  }
  document.querySelectorAll("[data-w]").forEach(b => b.addEventListener("click", () => setWeapon(b.dataset.w)));
  document.querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => toggle(b.dataset.t)));
  document.querySelectorAll("[data-bone]").forEach(b => b.addEventListener("click", () => { cfg.bone = b.dataset.bone; sync(); }));
  $("mgRadius").addEventListener("input", e => { cfg.radius = +e.target.value; $("mgRadiusV").textContent = cfg.radius + "px"; });
  $("mgSmooth").addEventListener("input", e => { cfg.smooth = +e.target.value; $("mgSmoothV").textContent = cfg.smooth; });
  $("mgVol").addEventListener("input", e => { cfg.vol = e.target.value / 100; $("mgVolV").textContent = e.target.value + "%"; setVol(); });
  $("mgMusic").addEventListener("click", () => { cfg.music = !cfg.music; audio(); music(cfg.music && running); sync(); });
  $("mgMute").addEventListener("click", () => { cfg.mute = !cfg.mute; setVol(); sync(); });
  for (const id of ["mgRadius", "mgSmooth", "mgVol"]) { const el = $(id), upd = () => el.style.setProperty("--p", (el.value - el.min) / (el.max - el.min) * 100 + "%"); el.addEventListener("input", upd); upd(); }
  sync(); reset(); requestAnimationFrame(frame);
})();
