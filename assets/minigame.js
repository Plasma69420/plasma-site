/* ESP Aim Trainer: a small first-person target range. Everything here is a toy in your browser, nothing touches a real game. */
(() => {
  const stage = document.getElementById("mgStage"), cv = document.getElementById("mg"), ctx = cv.getContext("2d");
  const over = document.getElementById("mgOver"), btn = document.getElementById("mgPlay");
  const $ = id => document.getElementById(id);
  let W = 800, H = 450, dpr = 1;
  let q = 1, onScreen = true;
  const resize = () => { dpr = Math.min(1.5, devicePixelRatio || 1) * q; W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener("resize", resize); document.addEventListener("fullscreenchange", () => setTimeout(resize, 60)); resize();

  // ---------- settings (bound to the panels under the game) ----------
  const cfg = { weapon: "rifle", shootBack: true, skel: true, box: true, name: true, radar: true, tracers: true, hpbar: true, aimbot: true, trigger: false, fovCircle: true, bone: "head", radius: 150, smooth: 60, sens: 1, vol: 0.7, music: true, mute: false };
  const WEAPONS = {
    rifle: { label: "RIFLE", auto: true, rate: 0.095, mag: 30, body: 22, head: 60, reload: 1.6, recoil: 0.012 },
    pistol: { label: "PISTOL", auto: false, rate: 0.2, mag: 12, body: 34, head: 90, reload: 1.2, recoil: 0.02 },
    sniper: { label: "SNIPER", auto: false, rate: 1.0, mag: 5, body: 100, head: 300, reload: 2.2, recoil: 0.05 }
  };
  const NAMES = ["Nova", "Raze", "Vex", "Kilo", "Echo", "Jinx", "Onyx", "Ryu", "Blitz", "Zed", "Mako", "Sable"];

  // ---------- state ----------
  let best = 0, lastBy = "", hits = [], feed = [], P, npcs, boxes, fx, running = false, dead = false, bossDone = false, last = 0, locked = false;
  const keys = {}; let mouseL = false, mouseR = false;
  const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
  const rnd = (a, b) => a + Math.random() * (b - a);

  function reset() {
    P = { x: 0, z: 0, y: 0, vy: 0, yaw: 0, pitch: 0, hp: 100, kills: 0, score: 0, mult: 1, lastKill: -99, shots: 0, hits: 0, heads: 0, ammo: WEAPONS[cfg.weapon].mag, cd: 0, reloading: 0, recoil: 0, t: 0, vx: 0, vz: 0, prot: 2.5, kp: 0, spr: 0 }; fx = { flash: 0, shake: 0, hit: 0, toast: "", toastT: 0, hitmark: 0, nums: [], hs: 0 };
    hits = []; feed = []; boxes = [[-12, 14, 4, 3.4], [10, 20, 5, 4], [-22, 30, 6, 3], [18, 36, 5, 3.6], [0, 42, 7, 4.4], [-30, 12, 3, 3], [28, 8, 4, 3.2], [-6, 26, 2.4, 2.2]].map(([x, z, w, h]) => ({ x, z, w, h }));
    npcs = []; bossDone = false;
    for (let i = 0; i < 6; i++) spawn();
  }
  function spawn(boss) {
    const a = rnd(0, Math.PI * 2), d = rnd(20, 38);
    const n = { x: P.x + Math.sin(a) * d, z: P.z + Math.cos(a) * d, hp: 100, max: 100, tx: 0, tz: 0, shoot: rnd(1, 2.5), name: NAMES[(Math.random() * NAMES.length) | 0], dead: false, t: Math.random() * 9, scale: 1, boss: false, flash: 0, speed: rnd(1.4, 2.4) };
    if (boss) { n.boss = true; n.name = "BRUNO"; n.hp = n.max = 2500; n.scale = 2.6; n.speed = 4.2; n.face = 1; n.orb = Math.random() < 0.5 ? 1 : -1; n.phase = 0; n.lunge = 0; n.bite = 0; n.x = P.x + Math.sin(P.yaw) * 30; n.z = P.z + Math.cos(P.yaw) * 30; }
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
  const hfov = () => (cfg.weapon === "sniper" && mouseR ? 0.5 : 1.3 + (P ? P.spr * 0.1 : 0));
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
    const ml = Math.hypot(mx, mz) || 1, want = (mx || mz) ? sp / dt : 0, k = 1 - Math.exp(-(want ? 11 : 14) * dt); P.vx += (mx / ml * want - P.vx) * k; P.vz += (mz / ml * want - P.vz) * k;
    P.spr += (((keys.ShiftLeft || keys.ShiftRight) && want ? 1 : 0) - P.spr) * Math.min(1, dt * 8); P.prot = Math.max(0, P.prot - dt);
    let nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
    for (const b of boxes) if (Math.abs(nx - b.x) < b.w / 2 + 0.4 && Math.abs(nz - b.z) < 1.2 + 0.4) { nx = P.x; nz = P.z; P.vx = P.vz = 0; }
    P.x = Math.max(-55, Math.min(55, nx)); P.z = Math.max(-55, Math.min(55, nz));
    if (keys.Space && P.y === 0) P.vy = 5.2; P.vy -= 14 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0 && P.vy < 0) P.vy = 0;
    // aim lock (right mouse)
    if (mouseR && cfg.aimbot) {
      const t = nearestInFov();
      if (t) {
        const f = focal(), a = Math.min(1, dt * 700 / (cfg.smooth + 12));
        P.yaw += Math.atan((t.pt.x - W / 2) / f) * a; P.pitch += Math.atan((H / 2 - t.pt.y) / f) * a;
      }
    }
    { const r = P.kp * Math.min(1, dt * 5); P.kp -= r; P.pitch -= r * 0.85; }
    P.pitch = Math.max(-0.9, Math.min(0.9, P.pitch)); P.recoil *= Math.pow(0.001, dt);
    // triggerbot: fires on its own while a target is under the crosshair
    if (cfg.trigger && P.cd <= 0 && P.reloading <= 0 && underCrosshair()) fire();
    // shooting
    P.cd -= dt; if (P.reloading > 0) { P.reloading -= dt; if (P.reloading <= 0) P.ammo = WEAPONS[cfg.weapon].mag; }
    const w = WEAPONS[cfg.weapon];
    if (mouseL && P.cd <= 0 && P.reloading <= 0 && (w.auto || !mouseL.fired)) { fire(); if (!w.auto) mouseL.fired = true; }
    // npcs
    let alive = 0;
    for (const n of npcs) {
      if (n.dead) continue; alive++;
      n.muzzle = Math.max(0, (n.muzzle || 0) - dt); n.t += dt; n.flash = Math.max(0, n.flash - dt);
      if (n.boss) { bossAI(n, dt); continue; }
      const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz);
      const pd = Math.hypot(P.x - n.x, P.z - n.z), stand = cfg.shootBack && pd < 30;
      if (d < 1) pick(n); else if (!stand || n.boss) { n.x += dx / d * n.speed * dt; n.z += dz / d * n.speed * dt; }
      if (cfg.shootBack && pd < 38) {
        n.shoot -= dt;
        if (n.shoot <= 0) {
          n.shoot = (n.boss ? rnd(0.45, 0.8) : rnd(1.2, 2.6)) * Math.max(0.6, 1 - P.kills * 0.02);
          n.muzzle = 0.12;
          if (Math.random() < Math.max(0.1, (n.boss ? 0.75 : 0.4 + Math.min(0.15, P.kills * 0.01)) - pd / 90)) { hurt(n.boss ? 11 : 7, n); }
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
    for (const h of hits) h.t -= dt; hits = hits.filter(h => h.t > 0); for (const f of feed) f.t -= dt; feed = feed.filter(f => f.t > 0); fx.flash = Math.max(0, fx.flash - dt * 2.2); fx.shake = Math.max(0, fx.shake - dt * 3); fx.toastT -= dt; fx.hitmark = Math.max(0, fx.hitmark - dt * 5); fx.mf = Math.max(0, (fx.mf || 0) - dt); fx.hs = Math.max(0, fx.hs - dt); for (const m of fx.nums) { m.t -= dt; m.y -= 40 * dt; } fx.nums = fx.nums.filter(m => m.t > 0); P.sw = Math.max(0, (P.sw || 0) - dt);
  }
  function bossAI(n, dt) {
    n.phase += dt; n.bite -= dt;
    if (n.lunge > 0) n.lunge -= dt; else if (n.phase > 4.5) { n.phase = 0; n.lunge = 2.2; if (Math.random() < 0.5) n.orb = -n.orb; tone(110, 0.35, "sawtooth", 0.18, 70); }
    const a = Math.atan2(n.x - P.x, n.z - P.z) + (n.lunge > 0 ? 0 : n.orb * dt * 0.55), R = n.lunge > 0 ? 2.2 : 10;
    const tx = P.x + Math.sin(a) * R, tz = P.z + Math.cos(a) * R, dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz) || 1, st = Math.min(d, n.speed * (n.lunge > 0 ? 1.5 : 1) * dt);
    const ox = n.x, oz = n.z; n.x += dx / d * st; n.z += dz / d * st;
    const vr = (n.x - ox) * Math.cos(P.yaw) - (n.z - oz) * Math.sin(P.yaw); if (Math.abs(vr) > 0.002) n.face = vr > 0 ? 1 : -1;
    if (cfg.shootBack && n.lunge > 0 && Math.hypot(P.x - n.x, P.z - n.z) < 4.4 && n.bite <= 0) { n.bite = 0.8; n.muzzle = 0.15; hurt(16, n, "bit you"); }
  }
  function spawnBoss() { bossDone = true; spawn(true); toast("BRUNO THE DOG HAS ARRIVED"); tone(90, 0.8, "sawtooth", 0.25, 45); }
  function hurt(d, n, verb) { if (P.prot > 0) return; if (n) { hits.push({ n, x: n.x, z: n.z, name: n.name, t: 1.6 }); feed.unshift({ text: n.name + " " + (verb || "shot you") + "  -" + d, boss: n.boss, t: 4 }); if (feed.length > 5) feed.pop(); lastBy = n.name; } P.hp -= d; fx.flash = 1; fx.shake = 0.5; noise(0.08, 0.25); if (P.hp <= 0 && !dead) die(); }
  function die() { dead = true; if (P.score > best) { best = P.score; try { localStorage.setItem("strive_mg_best", best); } catch { } } feed.unshift({ text: lastBy + " eliminated you", boss: false, t: 6 }); running = false; if (document.pointerLockElement) document.exitPointerLock(); showOverlay("Eliminated by " + (lastBy || "an NPC"), `Score <b>${P.score.toLocaleString()}</b> &nbsp;·&nbsp; Kills <b>${P.kills}</b> &nbsp;·&nbsp; Headshots <b>${P.heads}</b>`, "Play again"); }
  function nearestInFov() {
    let best = null, bd = 1e9; const cx = W / 2, cy = H / 2;
    for (const n of npcs) {
      if (n.dead) continue; const g = geo(n); if (!g) continue;
      const pt = cfg.bone === "head" ? g.aimHead : g.aimChest, d = Math.hypot(pt.x - cx, pt.y - cy);
      if (d < cfg.radius && d < bd) { bd = d; best = { n, pt }; }
    } return best;
  }
  function underCrosshair() { const cx = W / 2, cy = H / 2; for (const n of npcs) { if (n.dead) continue; const g = geo(n); if (g && (Math.hypot(cx - g.head.x, cy - g.head.y) <= g.head.r || (cx >= g.x0 && cx <= g.x1 && cy >= g.y0 && cy <= g.y1))) return true; } return false; }
  function fire() {
    const w = WEAPONS[cfg.weapon]; if (P.ammo <= 0) { reload(); return; }
    P.ammo--; fx.mf = 0.07; P.cd = w.rate; P.shots++; P.recoil += w.recoil; P.pitch += w.recoil * 0.6; P.kp += w.recoil * 0.6; fx.shake = Math.max(fx.shake, 0.18);
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
      { const g = geo(n); if (g) fx.nums.push({ x: hit.head ? g.head.x : g.f.x, y: hit.head ? g.head.y - g.head.r : g.aimChest.y, text: String(dmg), head: hit.head, t: 0.8 }); } if (hit.head) fx.hs = 0.6;
      n.hp -= dmg; if (n.hp <= 0) kill(n, hit.head);
    }
    if (P.ammo <= 0) reload();
  }
  function kill(n, head) {
    n.dead = true; n.fade = 0.5; P.kills++; P.hp = Math.min(100, P.hp + 15); feed.unshift({ text: "+15 HP", boss: false, good: true, t: 2 }); if (feed.length > 5) feed.pop();
    if (P.t - P.lastKill < 4) P.mult = Math.min(5, P.mult + 1); P.lastKill = P.t;
    const base = n.boss ? 5000 : head ? 250 : 100; P.score += base * P.mult;
    if (n.boss) toast("BRUNO DOWN  +" + (5000 * P.mult).toLocaleString()); else if (P.mult > 1) toast("x" + P.mult + " CHAIN");
    tone(520, 0.18, "triangle", 0.2, 880);
  }
  function reload() { if (P.reloading > 0) return; P.reloading = WEAPONS[cfg.weapon].reload; tone(300, 0.15, "square", 0.08); }
  function geo(n) {
    const f = proj(n.x, 0, n.z); if (!f) return null;
    if (n.boss) {
      const s = f.s * n.scale, fd = n.face || 1, X = f.x, Y = f.y, hr = 0.3 * s;
      const head = { x: X + fd * 0.95 * s, y: Y - 1.05 * s, r: hr };
      return { f, t: { y: Y - 1.32 * s }, head, x0: X - 0.82 * s, x1: X + 0.7 * s, y0: Y - 0.98 * s, y1: Y, hw: 1.2 * s, s, fd, aimHead: { x: head.x, y: head.y }, aimChest: { x: X + fd * 0.2 * s, y: Y - 0.7 * s } };
    }
    const t = proj(n.x, 1.82 * n.scale, n.z), h = proj(n.x, 1.62 * n.scale, n.z); if (!t || !h) return null;
    const hw = 0.28 * n.scale * f.s, r = 0.17 * n.scale * f.s;
    return { f, t, head: { x: h.x, y: h.y, r }, x0: f.x - hw, x1: f.x + hw, y0: h.y + r, y1: f.y, hw, s: f.s * n.scale, aimHead: { x: h.x, y: h.y }, aimChest: { x: f.x, y: f.y - 1.2 * f.s * n.scale } };
  }

  // ---------- render ----------
  function render() {
    const sx = q < 0.75 ? 0 : (Math.random() - 0.5) * fx.shake * 7, sy = q < 0.75 ? 0 : (Math.random() - 0.5) * fx.shake * 7;
    ctx.save(); ctx.translate(sx, sy);
    const f = focal(), hor = H / 2 + Math.tan(P.pitch) * f;
    // sky + ground
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(40, hor)); sky.addColorStop(0, "#04141b"); sky.addColorStop(1, "#0d4a63"); ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, Math.max(0, hor) + 10);
    const gr = ctx.createLinearGradient(0, hor, 0, H); gr.addColorStop(0, "#0a2a37"); gr.addColorStop(1, "#04141b"); ctx.fillStyle = gr; ctx.fillRect(-10, Math.max(0, hor), W + 20, H);
    ctx.strokeStyle = "rgba(31,182,255,.18)"; ctx.lineWidth = 1;
    const gx = Math.round(P.x / 4) * 4, gz = Math.round(P.z / 4) * 4;
    for (let i = -7; i <= 7; i++) { line3(gx + i * 4, 0, gz - 40, gx + i * 4, 0, gz + 40); line3(gx - 40, 0, gz + i * 4, gx + 40, 0, gz + i * 4); }
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
    const g = geo(n); if (!g) return; const s = g.s, alpha = n.dead ? Math.max(0, n.fade / 0.5) : 1, X = g.f.x, Y = g.f.y;
    ctx.save(); ctx.globalAlpha = alpha;
    if (n.boss) { drawDog(n, g); ctx.restore(); return; }
    const sway = Math.sin(n.t * 6) * 0.05 * s, col = n.flash > 0 ? "#ffffff" : "#e0533f", dark = n.flash > 0 ? "#dddddd" : "#7c2a1f";
    ctx.fillStyle = dark; ctx.fillRect(X - 0.2 * s, Y - 0.9 * s, 0.17 * s, 0.9 * s + sway); ctx.fillRect(X + 0.03 * s, Y - 0.9 * s, 0.17 * s, 0.9 * s - sway);
    const tg = ctx.createLinearGradient(0, Y - 1.5 * s, 0, Y - 0.85 * s); tg.addColorStop(0, col); tg.addColorStop(1, dark); ctx.fillStyle = tg;
    ctx.fillRect(X - 0.28 * s, Y - 1.5 * s, 0.56 * s, 0.65 * s);
    ctx.fillStyle = dark; ctx.fillRect(X - 0.4 * s, Y - 1.45 * s, 0.12 * s, 0.6 * s); ctx.fillRect(X + 0.28 * s, Y - 1.45 * s, 0.12 * s, 0.6 * s);
    ctx.fillStyle = "#10222a"; ctx.fillRect(X + 0.08 * s, Y - 1.2 * s, 0.5 * s, 0.1 * s); ctx.fillRect(X + 0.14 * s, Y - 1.12 * s, 0.1 * s, 0.18 * s);   // their rifle
    ctx.fillStyle = "#f1d2b8"; ctx.beginPath(); ctx.arc(g.head.x, g.head.y, g.head.r, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#222"; ctx.fillRect(X - 0.2 * s * 0.7, Y - 1.62 * s - 0.04 * s, 0.34 * s, 0.07 * s);
    ctx.restore();
  }
  function drawDog(n, g) {
    const s = g.s, fd = g.fd, X = g.f.x, Y = g.f.y, hit = n.flash > 0, fur = hit ? "#ffffff" : "#6b4a32", fur2 = hit ? "#dddddd" : "#4a3222", belly = hit ? "#eeeeee" : "#8a6446";
    const P2 = (dx, dy) => [X + fd * dx * s, Y + dy * s], bob = Math.sin(n.t * 10) * 0.05 * s, leg = Math.sin(n.t * 12) * 0.12;
    // tail
    ctx.strokeStyle = fur2; ctx.lineWidth = 0.12 * s; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...P2(-0.7, -0.85)); ctx.lineTo(...P2(-1.15, -1.1 + Math.sin(n.t * 14) * 0.12)); ctx.stroke();
    // legs
    ctx.strokeStyle = fur2; ctx.lineWidth = 0.17 * s;
    for (const [dx, ph] of [[-0.55, 0], [-0.3, Math.PI], [0.35, Math.PI], [0.6, 0]]) { ctx.beginPath(); ctx.moveTo(...P2(dx, -0.5)); ctx.lineTo(...P2(dx + Math.sin(n.t * 12 + ph) * 0.14, 0)); ctx.stroke(); }
    // body
    const bg = ctx.createLinearGradient(0, Y - 1 * s, 0, Y - 0.4 * s); bg.addColorStop(0, fur); bg.addColorStop(1, belly); ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(X - fd * 0.05 * s, Y - 0.7 * s + bob, 0.78 * s, 0.32 * s, 0, 0, 6.3); ctx.fill();
    // neck + head
    ctx.fillStyle = fur; ctx.beginPath(); ctx.moveTo(...P2(0.4, -0.95)); ctx.lineTo(...P2(0.85, -1.3)); ctx.lineTo(...P2(0.8, -0.75)); ctx.lineTo(...P2(0.45, -0.5)); ctx.fill();
    ctx.beginPath(); ctx.arc(g.head.x, g.head.y + bob, g.head.r, 0, 6.3); ctx.fill();
    ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(...P2(1.3, -0.97), 0.26 * s, 0.14 * s, 0, 0, 6.3); ctx.fill();   // snout
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(...P2(1.5, -1.0), 0.06 * s, 0, 6.3); ctx.fill();   // nose
    ctx.fillStyle = fur2; ctx.beginPath(); ctx.moveTo(...P2(0.75, -1.25)); ctx.lineTo(...P2(0.9, -1.55)); ctx.lineTo(...P2(1.05, -1.22)); ctx.fill();   // ear
    ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(...P2(1.08, -1.1), 0.045 * s, 0, 6.3); ctx.fill();   // eye
    ctx.fillStyle = "#1fb6ff"; ctx.beginPath(); ctx.ellipse(...P2(0.62, -0.95), 0.07 * s, 0.2 * s, 0, 0, 6.3); ctx.fill();   // collar
    if (n.lunge > 0) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.03 * s; ctx.beginPath(); ctx.moveTo(...P2(1.3, -0.9)); ctx.lineTo(...P2(1.42, -0.8)); ctx.stroke(); }
  }
  function drawEsp(n) {
    const g = geo(n); if (!g) return; const x0 = g.f.x - g.hw - 4, x1 = g.f.x + g.hw + 4, y0 = g.t.y - 4, y1 = g.f.y + 2, w = x1 - x0, h = y1 - y0;
    ctx.lineWidth = 1.6;
    if (cfg.tracers) { ctx.strokeStyle = n.boss ? "rgba(255,211,77,.55)" : "rgba(255,255,255,.3)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(g.f.x, y1); ctx.stroke(); ctx.lineWidth = 1.6; }
    if ((n.muzzle || 0) > 0) { ctx.fillStyle = "rgba(255,225,120,.9)"; ctx.beginPath(); ctx.arc(g.f.x + 0.35 * g.f.s * n.scale, g.f.y - 1.1 * g.f.s * n.scale, Math.max(3, 0.12 * g.f.s * n.scale), 0, 6.3); ctx.fill(); ctx.strokeStyle = "rgba(255,90,70,.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(g.f.x, g.f.y - 1.1 * g.f.s * n.scale); ctx.lineTo(W / 2 + rnd(-30, 30), H); ctx.stroke(); ctx.lineWidth = 1.6; }
    if (cfg.box) {
      ctx.strokeStyle = n.boss ? "#ffd34d" : "#ffffff"; const l = Math.max(6, Math.min(w, h) * 0.25); ctx.beginPath();
      ctx.moveTo(x0, y0 + l); ctx.lineTo(x0, y0); ctx.lineTo(x0 + l, y0); ctx.moveTo(x1 - l, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + l);
      ctx.moveTo(x0, y1 - l); ctx.lineTo(x0, y1); ctx.lineTo(x0 + l, y1); ctx.moveTo(x1 - l, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - l); ctx.stroke();
    }
    if (cfg.skel && n.boss) {
      const s = g.s, fd = g.fd, X = g.f.x, Y = g.f.y, Q = (dx, dy) => [X + fd * dx * s, Y + dy * s]; ctx.strokeStyle = "#37c4ff"; ctx.beginPath();
      ctx.moveTo(...Q(-0.7, -0.85)); ctx.lineTo(...Q(0.4, -0.95)); ctx.lineTo(g.head.x, g.head.y);
      for (const dx of [-0.55, -0.3, 0.35, 0.6]) { ctx.moveTo(...Q(dx > 0 ? 0.4 : -0.6, -0.8)); ctx.lineTo(...Q(dx, -0.4)); ctx.lineTo(...Q(dx, 0)); } ctx.stroke();
    } else if (cfg.skel) {
      const X = g.f.x, s = g.f.s * n.scale, Y = g.f.y; ctx.strokeStyle = "#37c4ff"; ctx.beginPath();
      ctx.moveTo(g.head.x, g.head.y + g.head.r); ctx.lineTo(X, Y - 0.95 * s);
      ctx.moveTo(X - 0.3 * s, Y - 1.4 * s); ctx.lineTo(X + 0.3 * s, Y - 1.4 * s); ctx.moveTo(X - 0.3 * s, Y - 1.4 * s); ctx.lineTo(X - 0.36 * s, Y - 0.85 * s); ctx.moveTo(X + 0.3 * s, Y - 1.4 * s); ctx.lineTo(X + 0.36 * s, Y - 0.85 * s);
      ctx.moveTo(X, Y - 0.95 * s); ctx.lineTo(X - 0.12 * s, Y); ctx.moveTo(X, Y - 0.95 * s); ctx.lineTo(X + 0.12 * s, Y); ctx.stroke();
    }
    if (cfg.name) { ctx.fillStyle = n.boss ? "#ffd34d" : "#fff"; ctx.font = "700 " + Math.max(10, Math.min(15, 0.2 * g.f.s * n.scale)) + "px Manrope,sans-serif"; ctx.textAlign = "center"; ctx.fillText(n.name + "  " + Math.round(Math.hypot(P.x - n.x, P.z - n.z)) + "m", g.f.x, y0 - 6); }
    if (cfg.hpbar && (n.hp < n.max || n.boss)) { const hp = Math.max(0, n.hp / n.max); ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(x0, y1 + 4, w, 4); ctx.fillStyle = hp > 0.5 ? "#44e08a" : hp > 0.25 ? "#ffb02e" : "#ff4d4d"; ctx.fillRect(x0, y1 + 4, w * hp, 4); }
  }
  function drawHud() {
    const cx = W / 2, cy = H / 2;
    if (cfg.fovCircle) { ctx.strokeStyle = mouseR ? "rgba(31,182,255,.9)" : "rgba(255,255,255,.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, cfg.radius, 0, 6.3); ctx.stroke(); }
    ctx.strokeStyle = fx.hitmark > 0 ? "#ff5a5a" : "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 3, cy); ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 9, cy); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy - 3); ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 9); ctx.stroke();
    // floating damage numbers + headshot banner
    ctx.textAlign = "center"; for (const m of fx.nums) { ctx.globalAlpha = Math.min(1, m.t * 2); ctx.fillStyle = m.head ? "#ffd34d" : "#ffffff"; ctx.font = (m.head ? "800 20px" : "700 15px") + " Manrope,sans-serif"; ctx.fillText(m.text, m.x, m.y); } ctx.globalAlpha = 1;
    if (fx.hs > 0) { ctx.globalAlpha = Math.min(1, fx.hs * 2); ctx.fillStyle = "#ffd34d"; ctx.font = "800 15px Manrope,sans-serif"; ctx.fillText("HEADSHOT", cx, cy + 46); ctx.globalAlpha = 1; }
    if (P.hp < 30 && P.hp > 0) { const pu = 0.25 + 0.2 * Math.sin(P.t * 7), v2 = ctx.createRadialGradient(cx, cy, H * 0.35, cx, cy, H * 0.9); v2.addColorStop(0, "rgba(255,0,0,0)"); v2.addColorStop(1, "rgba(255,30,30," + pu + ")"); ctx.fillStyle = v2; ctx.fillRect(0, 0, W, H); }
    if (P.prot > 0) { ctx.fillStyle = "#44e08a"; ctx.font = "700 12px Manrope,sans-serif"; ctx.fillText("SPAWN PROTECTION", cx, H * 0.2); }
    // who is shooting you: arrows around the crosshair pointing at each attacker
    for (const h of hits) { const bearing = Math.atan2(h.x - P.x, h.z - P.z), rel = ang(bearing - P.yaw), a = -rel + Math.PI / 2 * 0; const R = Math.min(W, H) * 0.3, px = cx + Math.sin(rel) * R, py = cy - Math.cos(rel) * R; ctx.save(); ctx.globalAlpha = Math.min(1, h.t); ctx.translate(px, py); ctx.rotate(rel); ctx.fillStyle = h.n.boss ? "#ffd34d" : "#ff3b3b"; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(13, 10); ctx.lineTo(0, 4); ctx.lineTo(-13, 10); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalAlpha = Math.min(1, h.t); ctx.fillStyle = "#fff"; ctx.font = "800 12px Manrope,sans-serif"; ctx.textAlign = "center"; ctx.fillText(h.name, cx + Math.sin(rel) * (R + 30), cy - Math.cos(rel) * (R + 30) + 4); ctx.restore(); }
    // hurt vignette
    if (fx.flash > 0) { const v = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.9); v.addColorStop(0, "rgba(255,0,0,0)"); v.addColorStop(1, "rgba(255,30,30," + 0.5 * fx.flash + ")"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    // gun
    drawGun(cx, cy); drawWeaponBar(cx);
    // damage feed
    ctx.textAlign = "left"; ctx.font = "700 13px Manrope,sans-serif"; feed.forEach((f, i) => { ctx.globalAlpha = Math.min(1, f.t); ctx.fillStyle = f.good ? "#44e08a" : f.boss ? "#ffd34d" : "#ff7a6b"; ctx.fillText(f.text, 16, H - 62 - i * 18); }); ctx.globalAlpha = 1;
    // text hud
    ctx.textAlign = "left"; ctx.font = "700 13px Manrope,sans-serif"; ctx.fillStyle = "#ffd34d";
    const acc = P.shots ? Math.round(P.hits / P.shots * 100) : 0;
    ctx.fillText(`Kills ${P.kills}  ·  Headshots ${P.heads}  ·  Accuracy ${acc}%`, 16, 24); ctx.fillText(`Score ${P.score.toLocaleString()}${P.mult > 1 ? "   x" + P.mult : ""}   ·   Best ${Math.max(best, P.score).toLocaleString()}`, 16, 44); if (!bossDone) { ctx.fillStyle = "#ff9b4a"; ctx.fillText("Bruno in " + Math.max(0, 10 - P.kills) + " kills", 16, 64); ctx.fillStyle = "#ffd34d"; }
    // health + ammo
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(16, H - 34, 190, 12); ctx.fillStyle = P.hp > 40 ? "#44e08a" : "#ff4d4d"; ctx.fillRect(16, H - 34, 190 * Math.max(0, P.hp) / 100, 12);
    ctx.fillStyle = "#fff"; ctx.fillText(Math.max(0, Math.ceil(P.hp)) + " HP", 214, H - 24);
    if (P.reloading > 0) { ctx.textAlign = "center"; ctx.font = "800 14px Manrope,sans-serif"; ctx.fillStyle = "#ffd34d"; ctx.fillText("RELOADING...", cx, H - 62); }
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

  // ---------- weapons ----------
  function poly(pts, fill, stroke) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } }
  function drawGun(cx, cy) {
    const w = cfg.weapon;
    if (w === "sniper" && mouseR) {   // scope view
      const r = Math.min(W, H) * 0.46; ctx.save(); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, r, 0, 6.3, true); ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(0,0,0,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      ctx.strokeStyle = "#1fb6ff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.stroke(); ctx.restore(); return;
    }
    const ads = mouseR ? 1 : 0, kick = P.recoil * 60, rl = P.reloading > 0 ? Math.sin((1 - P.reloading / WEAPONS[w].reload) * Math.PI) : 0, sw = P.sw > 0 ? P.sw / 0.35 : 0;
    const moving = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD, bob = Math.sin(P.t * 8) * (moving ? 8 : 2);
    // the gun is drawn in a 2000x1128 space like a first-person voxel model: slab on top, dark body, block grip
    ctx.save(); ctx.scale(W / 2000, H / 1128);
    ctx.translate(-(ads ? 330 : 0) + kick * 2.2, bob + (rl * 260 + sw * 300) + kick - (ads ? 40 : 0));
    ctx.translate(1850, 1128); ctx.scale(w === "pistol" ? 0.72 : w === "sniper" ? 1.12 : 1, w === "pistol" ? 0.72 : w === "sniper" ? 1.12 : 1); ctx.translate(-1850, -1128);
    if (rl) { ctx.translate(1500, 1000); ctx.rotate(-rl * 0.35); ctx.translate(-1500, -1000); }
    const dark = "#080b0d", dark2 = "#0e1519", edge = "rgba(31,182,255,.35)", top = "#37c8ff", top2 = "#8fe3ff";
    const P1 = (pts, fill, stroke) => poly(pts, fill, stroke);
    if (w === "pistol") { ctx.translate(250, 20); }
    P1([[1158, 722], [1210, 755], [1385, 938], [1570, 912], [1860, 1128], [1270, 1128], [1272, 985], [1190, 790]], dark, edge);   // body
    P1([[1190, 790], [1272, 985], [1270, 1128], [1235, 1128], [1170, 860]], dark2);                                             // left face
    const tg = ctx.createLinearGradient(1210, 750, 1570, 930); tg.addColorStop(0, top2); tg.addColorStop(1, top);
    P1([[1210, 755], [1315, 752], [1570, 910], [1385, 938]], tg);                                                                // bright top slab
    P1([[1512, 918], [1590, 912], [1668, 940], [1550, 947]], "#1b2328", edge);                                                  // block top
    P1([[1512, 918], [1550, 947], [1550, 1035], [1512, 1005]], dark2, edge);                                                    // block front
    P1([[1550, 947], [1668, 940], [1668, 1035], [1550, 1035]], dark, edge);                                                     // block side
    P1([[1205, 700], [1232, 698], [1234, 740], [1208, 742]], dark2, edge);                                                      // front sight
    if (w === "sniper") { P1([[1300, 690], [1520, 780], [1520, 840], [1300, 750]], dark2, edge); ctx.fillStyle = "#1fb6ff"; ctx.beginPath(); ctx.ellipse(1300, 720, 18, 34, 0.2, 0, 6.3); ctx.fill(); }
    if (fx.mf > 0) { ctx.fillStyle = "rgba(255,225,130,.95)"; ctx.beginPath(); for (let i = 0; i < 12; i++) { const an = i / 12 * 6.28, r = (i % 2 ? 26 : 64) * (0.8 + Math.random() * 0.4); ctx.lineTo(1190 + Math.cos(an) * r, 712 + Math.sin(an) * r); } ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(1190, 712, 18, 0, 6.3); ctx.fill(); }
    ctx.restore();
  }
  function drawWeaponBar(cx) {
    const list = [["rifle", "1", "RIFLE"], ["pistol", "2", "PISTOL"], ["sniper", "3", "SNIPER"]], bw = 86, gap = 8, x0 = cx - (bw * 3 + gap * 2) / 2, y = H - 50;
    list.forEach(([k, n, label], i) => {
      const x = x0 + i * (bw + gap), on = cfg.weapon === k; ctx.fillStyle = on ? "rgba(31,182,255,.28)" : "rgba(4,20,27,.62)"; ctx.fillRect(x, y, bw, 36); ctx.strokeStyle = on ? "#1fb6ff" : "rgba(110,200,255,.25)"; ctx.lineWidth = on ? 2 : 1; ctx.strokeRect(x, y, bw, 36);
      ctx.textAlign = "left"; ctx.fillStyle = on ? "#1fb6ff" : "#7fa6b8"; ctx.font = "800 11px Manrope,sans-serif"; ctx.fillText(n, x + 8, y + 14);
      ctx.fillStyle = on ? "#fff" : "#9fc4d4"; ctx.font = "700 12px Manrope,sans-serif"; ctx.fillText(label, x + 8, y + 29);
      ctx.textAlign = "right"; ctx.font = "700 10px Manrope,sans-serif"; ctx.fillStyle = "#7fa6b8"; ctx.fillText(on ? P.ammo + "/" + WEAPONS[k].mag : WEAPONS[k].mag, x + bw - 7, y + 14);
    });
  }

  // ---------- loop + overlay ----------
  let slow = 0, fast = 0, idle = 0;
  function frame(t) {
    requestAnimationFrame(frame); const raw = (t - last) || 16; last = t;
    if (document.hidden || !onScreen) return;
    const dt = Math.min(0.05, raw / 1000);
    if (running) {
      update(dt); render();
      // adaptive resolution: drop it when frames get slow, bring it back when there is headroom
      if (raw > 30) { slow++; fast = 0; } else if (raw < 20) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 25 && q > 0.5) { q = Math.max(0.5, q - 0.25); slow = 0; resize(); }
      else if (fast > 400 && q < 1) { q = Math.min(1, q + 0.25); fast = 0; resize(); }
    } else if (++idle % 20 === 0) render();   // paused: keep the backdrop alive without burning the GPU
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);
  function showOverlay(title, html, label) { $("mgTitle").textContent = title; $("mgText").innerHTML = html; btn.textContent = label; over.hidden = false; }
  const DESC = "Hunt down the NPC players. Hold right click to lock onto the nearest target inside your FOV circle. Every kill heals 15 HP and chains a score multiplier, and watch out: they shoot back. Reach 10 kills and Bruno, a huge dog, comes for you.";
  function start() {
    audio(); if (ac && ac.state === "suspended") ac.resume();
    if (dead || !P) { reset(); dead = false; }
    over.hidden = true; running = true; music(cfg.music);
    try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch { }
  }
  if (matchMedia("(pointer:coarse)").matches && !matchMedia("(pointer:fine)").matches) { $("mgText").textContent = "This trainer needs a mouse and keyboard. Open it on a PC to play."; btn.textContent = "Try anyway"; }
  btn.addEventListener("click", start);
  cv.addEventListener("click", () => { if (running && !document.pointerLockElement) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch { } } });
  document.addEventListener("visibilitychange", () => { if (document.hidden && running) { running = false; mouseL = mouseR = false; for (const k in keys) keys[k] = false; showOverlay("Paused", DESC, "Click to Play"); } });
  document.addEventListener("pointerlockchange", () => { locked = document.pointerLockElement === cv; if (!locked && running && !dead) { running = false; showOverlay("Paused", DESC, "Click to Play"); mouseL = mouseR = false; } });
  document.addEventListener("mousemove", e => { if (!running) return; const k = cfg.weapon === "sniper" && mouseR ? 0.0007 : 0.0022; P.yaw += e.movementX * k * cfg.sens; P.pitch -= e.movementY * k * cfg.sens; });
  cv.addEventListener("mousedown", e => { if (!running) return; if (e.button === 0) mouseL = { fired: false }; if (e.button === 2) mouseR = true; });
  document.addEventListener("mouseup", e => { if (e.button === 0) mouseL = false; if (e.button === 2) mouseR = false; });
  cv.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (e.code === "Escape" && running) { running = false; mouseL = mouseR = false; for (const k in keys) keys[k] = false; showOverlay("Paused", DESC, "Click to Play"); return; }
    if (!running) return; keys[e.code] = true; if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyR") reload(); if (e.code === "Digit1") setWeapon("rifle"); if (e.code === "Digit2") setWeapon("pistol"); if (e.code === "Digit3") setWeapon("sniper");
    if (e.code === "KeyX") toggle("skel"); if (e.code === "KeyC") toggle("box"); if (e.code === "KeyV") toggle("name"); if (e.code === "KeyB") toggle("fovCircle");
    if (e.code === "KeyZ") { cfg.bone = cfg.bone === "head" ? "chest" : "head"; sync(); } if (e.code === "KeyM") { cfg.mute = !cfg.mute; setVol(); sync(); }
    if (e.code === "KeyT") toggle("trigger"); if (e.code === "KeyF") toggle("aimbot"); if (e.code === "KeyP" && !bossDone) { spawnBoss(); }
  });
  document.addEventListener("keyup", e => { keys[e.code] = false; });
  $("mgFull").addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen && stage.requestFullscreen(); });

  // ---------- settings panels ----------
  function setWeapon(w) { if (w !== cfg.weapon && P) P.sw = 0.35; cfg.weapon = w; if (P) { P.ammo = WEAPONS[w].mag; P.reloading = 0; P.cd = 0.2; } sync(); }
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
  $("mgSens").addEventListener("input", e => { cfg.sens = e.target.value / 100; $("mgSensV").textContent = e.target.value + "%"; });
  $("mgRadius").addEventListener("input", e => { cfg.radius = +e.target.value; $("mgRadiusV").textContent = cfg.radius + "px"; });
  $("mgSmooth").addEventListener("input", e => { cfg.smooth = +e.target.value; $("mgSmoothV").textContent = cfg.smooth; });
  $("mgVol").addEventListener("input", e => { cfg.vol = e.target.value / 100; $("mgVolV").textContent = e.target.value + "%"; setVol(); });
  $("mgMusic").addEventListener("click", () => { cfg.music = !cfg.music; audio(); music(cfg.music && running); sync(); });
  $("mgMute").addEventListener("click", () => { cfg.mute = !cfg.mute; setVol(); sync(); });
  for (const id of ["mgSens", "mgRadius", "mgSmooth", "mgVol"]) { const el = $(id), upd = () => el.style.setProperty("--p", (el.value - el.min) / (el.max - el.min) * 100 + "%"); el.addEventListener("input", upd); upd(); }
  try { best = +localStorage.getItem("strive_mg_best") || 0; } catch { }
  sync(); reset(); requestAnimationFrame(frame);
})();
