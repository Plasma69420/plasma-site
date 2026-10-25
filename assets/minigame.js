/* ESP Aim Trainer: a small 3D target range (WebGL). Everything here is a toy in your browser, nothing touches a real game. */
(() => {
  const $ = id => document.getElementById(id);
  const stage = $("mgStage"), cv = $("mg"), ctx = cv.getContext("2d"), glc = $("mgGL"), over = $("mgOver"), btn = $("mgPlay");
  let W = 800, H = 450, dpr = 1, q = 1, onScreen = true;

  // ---------- WebGL ----------
  const gl = glc.getContext("webgl", { antialias: true, alpha: false, powerPreference: "high-performance" });
  const VS = "attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;attribute float aK;uniform mat4 uM;varying vec3 vN,vC,vW;varying float vK;void main(){vN=aN;vC=aC;vK=aK;vW=aP;gl_Position=uM*vec4(aP,1.);}";
  const FS = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" +
    "varying vec3 vN,vC,vW;varying float vK;uniform vec3 uEye;" +
    "void main(){vec3 col=vC;float d=length(vW-uEye);vec3 fog=vec3(.04,.2,.28);" +
    "if(vK>2.5&&vK<3.5){vec3 dir=normalize(vW-uEye);float h=clamp(dir.y*1.7,0.,1.);gl_FragColor=vec4(mix(fog,vec3(.008,.04,.075),h),1.);return;}" +
    "if(vK>1.5&&vK<2.5){gl_FragColor=vec4(col,1.);return;}" +
    "if(vK>3.5){gl_FragColor=vec4(0.,0.,0.,.38);return;}" +
    "float lam=.62+.62*max(dot(normalize(vN),normalize(vec3(.4,.8,.35))),0.);" +
    "if(vK>.5&&vK<1.5){vec2 e=abs(fract(vW.xz/4.-.5)-.5);float l=1.-smoothstep(0.,.035+d*.004,min(e.x,e.y))*(1.-clamp(d/70.,0.,.85));col=mix(vec3(.035,.12,.17),vec3(.1,.5,.75),l*.8);lam=1.;}" +
    "col=min(col*lam,vec3(1.));float f=1.-exp(-d*d*.00013);gl_FragColor=vec4(mix(col,fog,f),1.);}";
  let prog, loc = {}, vbo;
  function initGL() {
    if (!gl) return false;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog); loc.m = gl.getUniformLocation(prog, "uM"); loc.eye = gl.getUniformLocation(prog, "uEye");
    vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    [["aP", 3, 0], ["aN", 3, 3], ["aC", 3, 6], ["aK", 1, 9]].forEach(([n, s, o]) => { const a = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, s, gl.FLOAT, false, 40, o * 4); });
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }
  const glOK = initGL();
  const resize = () => {
    dpr = Math.min(1.5, devicePixelRatio || 1) * q; W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    glc.width = Math.round(W * dpr); glc.height = Math.round(H * dpr); if (gl) gl.viewport(0, 0, glc.width, glc.height);
  };
  addEventListener("resize", resize); resize();

  // vertex buffer helpers: 10 floats per vertex (pos, normal, color, kind)
  let buf = new Float32Array(10 * 6 * 5 * 640), bi = 0;
  const FACES = [[1, 3, 7, 5], [0, 4, 6, 2], [2, 6, 7, 3], [4, 5, 7, 6], [0, 2, 3, 1]];
  const hex = c => [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];
  const colCache = {}; const rgb = c => colCache[c] || (colCache[c] = hex(c));
  function tris(V, col, k) {
    if (bi + 300 > buf.length) return;
    let mx = 0, my = 0, mz = 0; for (const v of V) { mx += v[0]; my += v[1]; mz += v[2]; } mx /= 8; my /= 8; mz /= 8;
    for (const f of FACES) {
      const a = V[f[0]], b = V[f[1]], c = V[f[2]], d = V[f[3]];
      let nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (nx * ((a[0] + c[0]) / 2 - mx) + ny * ((a[1] + c[1]) / 2 - my) + nz * ((a[2] + c[2]) / 2 - mz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      for (const v of [a, b, c, a, c, d]) { buf[bi++] = v[0]; buf[bi++] = v[1]; buf[bi++] = v[2]; buf[bi++] = nx; buf[bi++] = ny; buf[bi++] = nz; buf[bi++] = col[0]; buf[bi++] = col[1]; buf[bi++] = col[2]; buf[bi++] = k; }
    }
  }
  function wbox(x, y, z, sx, sy, sz, col, k) { const V = []; for (let i = 0; i < 8; i++) V.push([x + ((i & 1) ? sx : -sx) / 2, y + ((i & 2) ? sy : -sy) / 2, z + ((i & 4) ? sz : -sz) / 2]); tris(V, rgb(col), k || 0); }
  // posable model: parts rotate about their own pivot, the whole body can tip over, and it turns to face a heading
  const B = (cx, cy, cz, sx, sy, sz, col, rx, py, pz, k) => ({ c: [cx, cy, cz], s: [sx, sy, sz], col, rx: rx || 0, py: py || 0, pz: pz || 0, k: k || 0 });
  function emit(n, parts, sc, fall, flash) {
    const ry = n.ry || 0, cy = Math.cos(ry), sy = Math.sin(ry), cf = Math.cos(fall || 0), sf = Math.sin(fall || 0), oy = n.y || 0;
    for (const p of parts) {
      const cr = Math.cos(p.rx), sr = Math.sin(p.rx), V = [];
      for (let i = 0; i < 8; i++) {
        const lx = (p.c[0] + ((i & 1) ? p.s[0] : -p.s[0]) / 2) * sc, ly = p.c[1] + ((i & 2) ? p.s[1] : -p.s[1]) / 2, lz = p.c[2] + ((i & 4) ? p.s[2] : -p.s[2]) / 2;
        const dy = ly - p.py, dz = lz - p.pz, y2 = (p.py + dy * cr - dz * sr) * sc, z2 = (p.pz + dy * sr + dz * cr) * sc;
        const y3 = y2 * cf - z2 * sf, z3 = y2 * sf + z2 * cf;
        V.push([n.x + lx * cy + z3 * sy, oy + y3, n.z - lx * sy + z3 * cy]);
      }
      tris(V, flash && !p.k ? [1, 1, 1] : rgb(p.col), p.k);
    }
  }
  function drawBuf(M, eyeV) {
    gl.uniformMatrix4fv(loc.m, false, M); gl.uniform3f(loc.eye, eyeV[0], eyeV[1], eyeV[2]);
    gl.bufferData(gl.ARRAY_BUFFER, buf.subarray(0, bi), gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLES, 0, bi / 10);
  }
  function viewProj(yaw, pitch, ex, ey, ez) {
    const f = focal(), kx = f / (W / 2), ky = f / (H / 2), n = 0.15, fa = 400, A = (fa + n) / (fa - n), Bz = -2 * fa * n / (fa - n);
    const s = Math.sin(yaw), c = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const r0 = [kx * c, 0, -kx * s], r1 = [-ky * sp * s, ky * cp, -ky * sp * c], r2 = [A * cp * s, A * sp, A * cp * c], r3 = [cp * s, sp, cp * c];
    const dot = r => r[0] * ex + r[1] * ey + r[2] * ez, M = new Float32Array(16);
    [[r0, -dot(r0)], [r1, -dot(r1)], [r2, Bz - dot(r2)], [r3, -dot(r3)]].forEach(([r, t], i) => { M[i] = r[0]; M[4 + i] = r[1]; M[8 + i] = r[2]; M[12 + i] = t; });
    return M;
  }

  // ---------- settings (bound to the panels under the game) ----------
  const cfg = { weapon: "rifle", shootBack: true, skel: true, box: true, name: true, radar: true, tracers: true, hpbar: true, aimbot: true, trigger: false, fovCircle: true, bone: "head", radius: 150, smooth: 60, sens: 1, vol: 0.7, music: true, mute: false };
  const WEAPONS = {
    rifle: { label: "RIFLE", auto: true, rate: 0.095, mag: 30, body: 22, head: 60, reload: 1.6, recoil: 0.012 },
    pistol: { label: "PISTOL", auto: false, rate: 0.2, mag: 12, body: 34, head: 90, reload: 1.2, recoil: 0.02 },
    sniper: { label: "SNIPER", auto: false, rate: 1.0, mag: 5, body: 100, head: 300, reload: 2.2, recoil: 0.05 }
  };
  const NAMES = ["Nova", "Raze", "Vex", "Kilo", "Echo", "Jinx", "Onyx", "Ryu", "Blitz", "Zed", "Mako", "Sable"];
  const PALS = [{ b: "#ff5a48", d: "#9a2f24", a: "#ffc23a" }, { b: "#a47bff", d: "#5b3fb0", a: "#ff8ae0" }, { b: "#ff9a3a", d: "#9a5a1a", a: "#fff07a" }, { b: "#36dba0", d: "#177a58", a: "#c4ffee" }];

  // ---------- map ----------
  const OB = [];   // {x,z,w,d,h}
  const CRATES = [[-12, 14, 5, 4, 3.6], [10, 20, 6, 5, 4.4], [-22, 30, 7, 4, 3.4], [18, 36, 6, 6, 4], [0, 42, 8, 5, 5.4], [-30, 12, 4, 4, 3.2], [28, 8, 5, 5, 3.4], [-6, 26, 3, 3, 2.4], [-34, -10, 6, 6, 5], [22, -18, 7, 5, 4], [0, -26, 5, 5, 6.5], [-16, -34, 8, 4, 3], [36, -36, 5, 5, 3.6], [-44, 36, 5, 5, 7], [44, 24, 4, 8, 5], [10, -8, 3, 3, 2.2], [-18, -8, 4, 4, 2.6], [-40, -34, 6, 6, 4.2], [14, 48, 5, 4, 3]];
  let mapN = 0, mapBuf = null;
  function buildMap() {
    OB.length = 0; bi = 0;
    [[0, -58, 120, 4, 10], [0, 58, 120, 4, 10], [-58, 0, 4, 120, 10], [58, 0, 4, 120, 10]].forEach(([x, z, w, d, h]) => OB.push({ x, z, w, d, h, wall: 1 }));
    CRATES.forEach(([x, z, w, d, h]) => OB.push({ x, z, w, d, h }));
    wbox(0, -0.02, 0, 130, 0.04, 130, "#0a2a37", 1);
    for (const o of OB) {
      wbox(o.x, o.h / 2, o.z, o.w, o.h, o.d, o.wall ? "#0f2f40" : "#14465f");
      const t = 0.07, y = o.h + 0.01, c = "#35c4ff";
      wbox(o.x, y, o.z - o.d / 2, o.w, t, t, c, 2); wbox(o.x, y, o.z + o.d / 2, o.w, t, t, c, 2); wbox(o.x - o.w / 2, y, o.z, t, t, o.d, c, 2); wbox(o.x + o.w / 2, y, o.z, t, t, o.d, c, 2);
      if (!o.wall) wbox(o.x, o.h + 0.02, o.z, o.w - 0.4, 0.03, o.d - 0.4, "#1c6d91");
    }
    mapN = bi; mapBuf = buf.slice(0, mapN);
  }
  const blocked = (x, z, r) => { for (const o of OB) if (Math.abs(x - o.x) < o.w / 2 + r && Math.abs(z - o.z) < o.d / 2 + r) return true; return false; };
  function los(ax, ay, az, bx, by, bz) {
    const d = [bx - ax, by - ay, bz - az], a = [ax, ay, az];
    for (const o of OB) {
      const mn = [o.x - o.w / 2, 0, o.z - o.d / 2], mxv = [o.x + o.w / 2, o.h, o.z + o.d / 2]; let t0 = 0, t1 = 1, ok = true;
      for (let i = 0; i < 3; i++) {
        if (Math.abs(d[i]) < 1e-6) { if (a[i] < mn[i] || a[i] > mxv[i]) { ok = false; break; } continue; }
        let u = (mn[i] - a[i]) / d[i], v = (mxv[i] - a[i]) / d[i]; if (u > v) [u, v] = [v, u];
        t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) { ok = false; break; }
      }
      if (ok) return false;
    }
    return true;
  }

  // ---------- state ----------
  let best = 0, lastBy = "", hits = [], feed = [], P, npcs, fx, running = false, dead = false, bossDone = false, last = 0, locked = false;
  const keys = {}; let mouseL = false, mouseR = false, shkY = 0, shkP = 0;
  const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const turn = (a, b, k) => (a === undefined ? b : a + ang(b - a) * Math.min(1, k));
  function reset() {
    if (!mapN) buildMap(); bi = mapN;
    P = { x: 0, z: 0, y: 0, vy: 0, yaw: 0, pitch: 0, hp: 100, max: 100, kills: 0, score: 0, mult: 1, lastKill: -99, shots: 0, hits: 0, heads: 0, ammo: WEAPONS[cfg.weapon].mag, cd: 0, reloading: 0, recoil: 0, t: 0, vx: 0, vz: 0, prot: 2.5, kp: 0, spr: 0, sw: 0, lockN: null };
    hits = []; feed = []; npcs = []; bossDone = false;
    fx = { flash: 0, shake: 0, hit: 0, toast: "", toastT: 0, hitmark: 0, nums: [], hs: 0, mf: 0 };
    for (let i = 0; i < 6; i++) spawn();
  }
  function spawn(boss) {
    let x, z, tries = 0; do { const a = rnd(0, 6.283), d = rnd(22, 42); x = P.x + Math.sin(a) * d; z = P.z + Math.cos(a) * d; } while ((blocked(x, z, boss ? 3 : 1) || Math.abs(x) > 52 || Math.abs(z) > 52) && ++tries < 40);
    const n = { x, z, hp: 100, max: 100, tx: 0, tz: 0, shoot: rnd(1, 2.5), name: NAMES[(Math.random() * NAMES.length) | 0], dead: false, t: Math.random() * 9, scale: 1, boss: false, flash: 0, speed: rnd(1.6, 2.6), ry: 0, ph: 0, vm: 0, pal: PALS[(Math.random() * PALS.length) | 0], seed: rnd(0, 6) };
    if (boss) { n.boss = true; n.name = "BRUNO"; n.hp = n.max = 2500; n.scale = 2.6; n.speed = 4.2; n.orb = Math.random() < 0.5 ? 1 : -1; n.phase = 0; n.lunge = 0; n.bite = 0; n.x = Math.max(-50, Math.min(50, P.x + Math.sin(P.yaw) * 30)); n.z = Math.max(-50, Math.min(50, P.z + Math.cos(P.yaw) * 30)); }
    pick(n); npcs.push(n); return n;
  }
  function pick(n) { for (let i = 0; i < 20; i++) { const a = rnd(0, 6.28), d = rnd(6, 26), x = n.x + Math.sin(a) * d, z = n.z + Math.cos(a) * d; if (Math.abs(x) < 52 && Math.abs(z) < 52 && !blocked(x, z, 1)) { n.tx = x; n.tz = z; return; } } n.tx = n.x; n.tz = n.z; }
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

  // ---------- camera + projection (same maths as the GL matrix, used for ESP and hit tests) ----------
  const hfov = () => (cfg.weapon === "sniper" && mouseR ? 0.5 : 1.3 + (P ? P.spr * 0.1 : 0));
  const focal = () => (W / 2) / Math.tan(hfov() / 2);
  const eye = () => 1.65 + P.y;
  function proj(x, y, z) {
    const yaw = P.yaw + shkY, pit = P.pitch + shkP, s = Math.sin(yaw), c = Math.cos(yaw), sp = Math.sin(pit), cp = Math.cos(pit);
    const dx = x - P.x, dz = z - P.z, dy = y - eye(), xc = dx * c - dz * s, z0 = dx * s + dz * c, zc = dy * sp + z0 * cp;
    if (zc < 0.2) return null;
    const yc = dy * cp - z0 * sp, f = focal();
    return { x: W / 2 + xc / zc * f, y: H / 2 - yc / zc * f, s: f / zc, z: zc };
  }
  const mw = (n, lx, ly, lz) => { const c = Math.cos(n.ry || 0), s = Math.sin(n.ry || 0); return [n.x + lx * c + lz * s, ly, n.z - lx * s + lz * c]; };
  const pj = (n, lx, ly, lz, sc) => { const w = mw(n, lx * sc, ly * sc, lz * sc); return proj(w[0], w[1], w[2]); };

  // ---------- characters ----------
  function humanParts(n) {
    const pal = n.pal, mv = n.vm > 0.1, sw = mv ? Math.sin(n.ph) * 0.7 : 0, d = "#10222a";
    return [
      B(-0.12, 0.46, 0, 0.2, 0.92, 0.22, pal.d, sw, 0.92, 0), B(-0.12, 0.05, 0.06, 0.22, 0.1, 0.36, d, sw, 0.92, 0),
      B(0.12, 0.46, 0, 0.2, 0.92, 0.22, pal.d, -sw, 0.92, 0), B(0.12, 0.05, 0.06, 0.22, 0.1, 0.36, d, -sw, 0.92, 0),
      B(0, 0.97, 0, 0.5, 0.12, 0.3, d), B(0, 1.27, 0, 0.5, 0.58, 0.3, pal.b), B(0, 1.32, 0.16, 0.4, 0.32, 0.05, pal.d), B(0, 1.12, 0.17, 0.12, 0.08, 0.03, pal.a, 0, 0, 0, 2),
      B(-0.34, 1.53, 0, 0.18, 0.14, 0.28, pal.a), B(0.34, 1.53, 0, 0.18, 0.14, 0.28, pal.a),
      B(-0.36, 1.2, 0, 0.14, 0.56, 0.16, pal.b, -sw * 0.8, 1.48, 0), B(0.35, 1.38, 0.24, 0.14, 0.14, 0.5, pal.b),
      B(0.31, 1.3, 0.55, 0.09, 0.14, 0.74, d), B(0.31, 1.3, 1.0, 0.045, 0.045, 0.3, "#05090b"), B(0.31, 1.18, 0.44, 0.06, 0.18, 0.08, "#05090b"),
      B(0, 1.6, 0, 0.12, 0.08, 0.12, "#e0b89c"), B(0, 1.74, 0, 0.26, 0.28, 0.26, "#f1d2b8"), B(0, 1.86, -0.01, 0.31, 0.12, 0.31, d), B(0, 1.75, 0.135, 0.24, 0.07, 0.03, "#37c8ff", 0, 0, 0, 2)
    ];
  }
  function dogParts(n) {
    const sw = n.vm > 0.1 ? Math.sin(n.ph) * 0.55 : 0, wag = Math.sin(n.t * 14) * 0.1, fur = "#a0714a", dk = "#5e4029", lt = "#d0a272";
    return [
      B(-0.17, 0.25, 0.45, 0.14, 0.5, 0.15, dk, sw, 0.5, 0.45), B(0.17, 0.25, 0.45, 0.14, 0.5, 0.15, dk, -sw, 0.5, 0.45), B(-0.17, 0.25, -0.45, 0.14, 0.5, 0.15, dk, -sw, 0.5, -0.45), B(0.17, 0.25, -0.45, 0.14, 0.5, 0.15, dk, sw, 0.5, -0.45),
      B(0, 0.68, 0, 0.5, 0.46, 1.25, fur), B(0, 0.95, 0.55, 0.36, 0.42, 0.4, fur), B(0, 0.86, 0.52, 0.4, 0.1, 0.4, "#1fb6ff", 0, 0, 0, 2),
      B(0, 1.02, 0.92, 0.34, 0.32, 0.36, fur), B(0, 0.94, 1.2, 0.18, 0.14, 0.28, lt), B(0, 0.99, 1.35, 0.09, 0.08, 0.05, "#111"),
      B(-0.1, 1.24, 0.88, 0.07, 0.2, 0.1, dk), B(0.1, 1.24, 0.88, 0.07, 0.2, 0.1, dk), B(-0.1, 1.08, 1.1, 0.05, 0.05, 0.03, "#ffd34d", 0, 0, 0, 2), B(0.1, 1.08, 1.1, 0.05, 0.05, 0.03, "#ffd34d", 0, 0, 0, 2),
      B(wag, 1.0, -0.8, 0.09, 0.09, 0.5, dk, 0.5, 0.95, -0.62)
    ];
  }
  function geo(n) {
    const f = proj(n.x, 0, n.z); if (!f) return null; const sc = n.scale;
    if (n.boss) {
      const hd = pj(n, 0, 1.02, 0.95, sc); if (!hd) return null;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9;
      for (let i = 0; i < 8; i++) { const q2 = pj(n, ((i & 1) ? 0.25 : -0.25), ((i & 2) ? 0.93 : 0.45), ((i & 4) ? 0.6 : -0.6), sc); if (!q2) return null; x0 = Math.min(x0, q2.x); x1 = Math.max(x1, q2.x); y0 = Math.min(y0, q2.y); }
      const r = 0.2 * sc * hd.s; x0 = Math.min(x0, hd.x - r); x1 = Math.max(x1, hd.x + r); y0 = Math.min(y0, hd.y - r);
      const bc = pj(n, 0, 0.68, 0, sc) || f;
      return { f: { x: (x0 + x1) / 2, y: f.y, s: f.s }, t: { y: y0 }, head: { x: hd.x, y: hd.y, r }, x0, x1, y0, y1: f.y, hw: (x1 - x0) / 2, s: f.s * sc, aimHead: { x: hd.x, y: hd.y }, aimChest: { x: bc.x, y: bc.y } };
    }
    const t = proj(n.x, 1.95, n.z), h = proj(n.x, 1.74, n.z), ch = proj(n.x, 1.3, n.z); if (!t || !h || !ch) return null;
    const hw = 0.3 * f.s, r = 0.17 * f.s;
    return { f, t, head: { x: h.x, y: h.y, r }, x0: f.x - hw, x1: f.x + hw, y0: h.y + r, y1: f.y, hw, s: f.s, aimHead: { x: h.x, y: h.y }, aimChest: { x: ch.x, y: ch.y } };
  }
  const targetPt = n => [n.x, n.boss ? 0.9 * n.scale : 1.35, n.z];
  const visible = n => { const t = targetPt(n); return los(P.x, eye(), P.z, t[0], t[1], t[2]); };

  // ---------- aim lock ----------
  function nearestInFov() {
    let bestT = null, bd = 1e9; const cx = W / 2, cy = H / 2;
    for (const n of npcs) {
      if (n.dead) continue; const g = geo(n); if (!g || !visible(n)) continue;
      const pt = cfg.bone === "head" ? g.aimHead : g.aimChest, d = Math.hypot(pt.x - cx, pt.y - cy);
      if (d < cfg.radius && d < bd) { bd = d; bestT = { n, pt }; }
    } return bestT;
  }
  // stays on the same target while you hold right click, so it does not flick between enemies
  function lockTarget() {
    const cx = W / 2, cy = H / 2, cur = P.lockN;
    if (cur && !cur.dead && visible(cur)) { const g = geo(cur); if (g) { const pt = cfg.bone === "head" ? g.aimHead : g.aimChest; if (Math.hypot(pt.x - cx, pt.y - cy) < cfg.radius * 1.8) return { n: cur, pt }; } }
    const t = nearestInFov(); P.lockN = t ? t.n : null; return t;
  }

  // ---------- update ----------
  function update(dt) {
    P.t += dt;
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 7.5 : 4.5) * dt;
    let mx = 0, mz = 0; const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
    if (keys.KeyW) { mx += s; mz += c; } if (keys.KeyS) { mx -= s; mz -= c; } if (keys.KeyD) { mx += c; mz -= s; } if (keys.KeyA) { mx -= c; mz += s; }
    const ml = Math.hypot(mx, mz) || 1, want = (mx || mz) ? sp / dt : 0, k = 1 - Math.exp(-(want ? 11 : 14) * dt);
    P.vx += (mx / ml * want - P.vx) * k; P.vz += (mz / ml * want - P.vz) * k;
    P.spr += (((keys.ShiftLeft || keys.ShiftRight) && want ? 1 : 0) - P.spr) * Math.min(1, dt * 8); P.prot = Math.max(0, P.prot - dt);
    const nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
    if (!blocked(nx, P.z, 0.45)) P.x = nx; else P.vx = 0; if (!blocked(P.x, nz, 0.45)) P.z = nz; else P.vz = 0;
    if (keys.Space && P.y === 0) P.vy = 5.2; P.vy -= 14 * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y === 0 && P.vy < 0) P.vy = 0;
    // aim lock (hold right click): glides onto the visible target inside the FOV circle
    if (mouseR && cfg.aimbot) {
      const t = lockTarget();
      if (t) { const f = focal(), a = cfg.smooth <= 0 ? 1 : Math.min(1, dt * 700 / (cfg.smooth + 12)); P.yaw += Math.atan((t.pt.x - W / 2) / f) * a; P.pitch += Math.atan((H / 2 - t.pt.y) / f) * a; }
    } else P.lockN = null;
    { const r = P.kp * Math.min(1, dt * 5); P.kp -= r; P.pitch -= r * 0.85; }
    P.pitch = Math.max(-1.2, Math.min(1.2, P.pitch)); P.recoil *= Math.pow(0.001, dt);
    P.cd -= dt; if (P.reloading > 0) { P.reloading -= dt; if (P.reloading <= 0) P.ammo = WEAPONS[cfg.weapon].mag; }
    const w = WEAPONS[cfg.weapon];
    if (cfg.trigger && P.cd <= 0 && P.reloading <= 0 && hitTest()) fire();
    if (mouseL && P.cd <= 0 && P.reloading <= 0 && (w.auto || !mouseL.fired)) { fire(); if (!w.auto) mouseL.fired = true; }
    for (const n of npcs) {
      if (n.dead) { n.fade -= dt; continue; }
      n.t += dt; n.flash = Math.max(0, n.flash - dt); n.muzzle = Math.max(0, (n.muzzle || 0) - dt);
      if (n.boss) { bossAI(n, dt); continue; }
      const pd = Math.hypot(P.x - n.x, P.z - n.z), stand = cfg.shootBack && pd < 30;
      n.ry = turn(n.ry, Math.atan2(P.x - n.x, P.z - n.z), dt * 5);
      let vx = 0, vz = 0;
      if (stand) { const st = Math.sin(n.t * 0.9 + n.seed) * 1.7; vx = Math.cos(n.ry) * st; vz = -Math.sin(n.ry) * st; }
      else { const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz); if (d < 1.2) pick(n); else { vx = dx / d * n.speed; vz = dz / d * n.speed; } }
      const ex = n.x + vx * dt, ez = n.z + vz * dt; if (!blocked(ex, n.z, 0.5)) n.x = ex; else if (!stand) pick(n); if (!blocked(n.x, ez, 0.5)) n.z = ez; else if (!stand) pick(n);
      n.vm = Math.hypot(vx, vz) > 0.2 ? 1 : 0; n.ph += dt * (4 + Math.hypot(vx, vz) * 2) * n.vm;
      if (cfg.shootBack && pd < 38) {
        n.shoot -= dt;
        if (n.shoot <= 0) {
          n.shoot = rnd(1.2, 2.6) * Math.max(0.6, 1 - P.kills * 0.02);
          if (visible(n)) { n.muzzle = 0.12; if (Math.random() < Math.max(0.1, 0.4 + Math.min(0.15, P.kills * 0.01) - pd / 90)) hurt(7, n); tone(200, 0.12, "sawtooth", 0.08, 70); }
        }
      }
    }
    if (!bossDone && P.kills >= 10 && !npcs.some(n => n.boss && !n.dead)) spawnBoss();
    while (npcs.filter(n => !n.dead && !n.boss).length < 6) spawn();
    npcs = npcs.filter(n => !n.dead || n.fade > 0);
    if (P.t - P.lastKill > 4) P.mult = 1;
    for (const h of hits) h.t -= dt; hits = hits.filter(h => h.t > 0); for (const f of feed) f.t -= dt; feed = feed.filter(f => f.t > 0);
    fx.flash = Math.max(0, fx.flash - dt * 2.2); fx.shake = Math.max(0, fx.shake - dt * 3); fx.toastT -= dt; fx.hitmark = Math.max(0, fx.hitmark - dt * 5);
    fx.mf = Math.max(0, fx.mf - dt); fx.hs = Math.max(0, fx.hs - dt); P.sw = Math.max(0, P.sw - dt);
    for (const m of fx.nums) { m.t -= dt; m.y -= 40 * dt; } fx.nums = fx.nums.filter(m => m.t > 0);
  }
  function bossAI(n, dt) {
    n.phase += dt; n.bite -= dt;
    if (n.lunge > 0) n.lunge -= dt; else if (n.phase > 4.5) { n.phase = 0; n.lunge = 2.2; if (Math.random() < 0.5) n.orb = -n.orb; tone(110, 0.35, "sawtooth", 0.18, 70); }
    const a = Math.atan2(n.x - P.x, n.z - P.z) + (n.lunge > 0 ? 0 : n.orb * dt * 0.55), R = n.lunge > 0 ? 2.2 : 10;
    const tx = Math.max(-52, Math.min(52, P.x + Math.sin(a) * R)), tz = Math.max(-52, Math.min(52, P.z + Math.cos(a) * R)), dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz) || 1, st = Math.min(d, n.speed * (n.lunge > 0 ? 1.5 : 1) * dt);
    const ox = n.x, oz = n.z; n.x += dx / d * st; n.z += dz / d * st;
    const mv = Math.hypot(n.x - ox, n.z - oz);
    if (mv > 0.002) n.ry = turn(n.ry, n.lunge > 0 ? Math.atan2(P.x - n.x, P.z - n.z) : Math.atan2(n.x - ox, n.z - oz), dt * 6);
    n.vm = mv > 0.002 ? 1 : 0; n.ph += dt * 11 * n.vm;
    if (cfg.shootBack && n.lunge > 0 && Math.hypot(P.x - n.x, P.z - n.z) < 4.4 && n.bite <= 0) { n.bite = 0.8; hurt(16, n, "bit you"); }
  }
  function spawnBoss() { bossDone = true; spawn(true); toast("BRUNO THE DOG HAS ARRIVED"); tone(90, 0.8, "sawtooth", 0.25, 45); }
  function hurt(d, n, verb) {
    if (P.prot > 0) return;
    if (n) { hits.push({ n, x: n.x, z: n.z, name: n.name, t: 1.6 }); feed.unshift({ text: n.name + " " + (verb || "shot you") + "  -" + d, boss: n.boss, t: 4 }); if (feed.length > 5) feed.pop(); lastBy = n.name; }
    P.hp -= d; fx.flash = 1; fx.shake = 0.5; noise(0.08, 0.25); if (P.hp <= 0 && !dead) die();
  }
  function die() {
    dead = true; feed.unshift({ text: lastBy + " eliminated you", boss: false, t: 6 }); running = false; mouseL = mouseR = false; if (document.pointerLockElement) document.exitPointerLock();
    if (P.score > best) { best = P.score; try { localStorage.setItem("strive_mg_best", best); } catch { } }
    showOverlay("Eliminated by " + (lastBy || "an NPC"), `Score <b>${P.score.toLocaleString()}</b> &nbsp;·&nbsp; Kills <b>${P.kills}</b> &nbsp;·&nbsp; Headshots <b>${P.heads}</b>`, "Play again");
    submitScore();
  }
  function hitTest() {
    const cx = W / 2, cy = H / 2;
    for (const n of npcs.filter(m => !m.dead).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))) {
      const g = geo(n); if (!g) continue;
      const h = Math.hypot(cx - g.head.x, cy - g.head.y) <= g.head.r, b = cx >= g.x0 && cx <= g.x1 && cy >= g.y0 && cy <= g.y1;
      if ((h || b) && visible(n)) return { n, head: h };
    }
    return null;
  }
  function fire() {
    const w = WEAPONS[cfg.weapon]; if (P.ammo <= 0) { reload(); return; }
    const hit = hitTest();   // the shot lands where the crosshair is now; recoil only affects the next one
    P.ammo--; fx.mf = 0.07; P.cd = w.rate; P.shots++; P.recoil += w.recoil; if (!(mouseR && cfg.aimbot && P.lockN)) { P.pitch += w.recoil * 0.6; P.kp += w.recoil * 0.6; }   // aim lock cancels the camera kick fx.shake = Math.max(fx.shake, 0.18);
    noise(cfg.weapon === "sniper" ? 0.22 : 0.07, cfg.weapon === "sniper" ? 0.5 : 0.28);
    if (hit) {
      P.hits++; fx.hitmark = 1; const n = hit.n; n.flash = 0.12; const dmg = hit.head ? w.head : w.body;
      if (hit.head) { P.heads++; tone(1400, 0.1, "sine", 0.25); } else tone(700, 0.06, "square", 0.12);
      { const g = geo(n); if (g) fx.nums.push({ x: hit.head ? g.head.x : g.aimChest.x, y: hit.head ? g.head.y - g.head.r : g.aimChest.y, text: String(dmg), head: hit.head, t: 0.8 }); } if (hit.head) fx.hs = 0.6;
      n.hp -= dmg; if (n.hp <= 0) kill(n, hit.head);
    }
    if (P.ammo <= 0) reload();
  }
  function kill(n, head) {
    n.dead = true; n.fade = 0.9; P.kills++; P.max = Math.min(200, P.max + 5); P.hp = Math.min(P.max, P.hp + 15);
    feed.unshift({ text: "+15 HP  ·  MAX HP " + P.max, boss: false, good: true, t: 2.5 }); if (feed.length > 5) feed.pop();
    if (P.t - P.lastKill < 4) P.mult = Math.min(5, P.mult + 1); P.lastKill = P.t;
    const base = n.boss ? 5000 : head ? 250 : 100; P.score += base * P.mult;
    if (n.boss) toast("BRUNO DOWN  +" + (5000 * P.mult).toLocaleString()); else if (P.mult > 1) toast("x" + P.mult + " CHAIN");
    tone(520, 0.18, "triangle", 0.2, 880);
  }
  function reload() { if (P.reloading > 0) return; P.reloading = WEAPONS[cfg.weapon].reload; tone(300, 0.15, "square", 0.08); }

  // ---------- 3D gun (drawn in camera space on top of the world) ----------
  function gunParts(w) {
    const d = "#0d1418", d2 = "#151d22", sl = "#101c24", skin = "#1a2226";
    if (w === "pistol") return { muz: 0.3, y: 0.03, parts: [
      B(0, 0.03, 0.1, 0.06, 0.07, 0.3, "#1a2830"), B(0, -0.012, 0.08, 0.055, 0.05, 0.26, d), B(0, 0.072, 0.1, 0.045, 0.012, 0.26, "#37c8ff", 0, 0, 0, 2),
      B(0, -0.11, -0.03, 0.055, 0.17, 0.08, d, -0.2, -0.04, -0.01), B(0, 0.075, -0.03, 0.02, 0.02, 0.02, "#ff3b3b", 0, 0, 0, 2), B(0, 0.065, 0.24, 0.015, 0.03, 0.015, d),
      B(0.01, -0.17, -0.07, 0.075, 0.07, 0.1, skin), B(0.02, -0.22, -0.3, 0.09, 0.09, 0.4, sl, 0.15, -0.2, -0.1)] };
    if (w === "sniper") return { muz: 1.18, y: 0.03, parts: [
      B(0, 0.02, 0.05, 0.08, 0.1, 0.5, d), B(0, 0.03, 0.7, 0.032, 0.032, 0.85, "#090d10"), B(0, 0.01, 0.4, 0.09, 0.09, 0.3, d2), B(0, -0.01, -0.35, 0.07, 0.13, 0.4, d),
      B(0, 0.115, 0.12, 0.06, 0.06, 0.36, "#0a0f12"), B(0, 0.115, 0.31, 0.062, 0.062, 0.015, "#37c8ff", 0, 0, 0, 2), B(0, 0.115, -0.07, 0.05, 0.05, 0.015, "#37c8ff", 0, 0, 0, 2), B(0, 0.085, 0.12, 0.03, 0.03, 0.1, d),
      B(0.065, 0.04, 0.0, 0.06, 0.02, 0.02, "#37c8ff", 0, 0, 0, 2), B(0, -0.13, 0.08, 0.05, 0.14, 0.09, d, 0.1, -0.06, 0.08), B(0, -0.12, -0.08, 0.06, 0.16, 0.07, d, -0.3, -0.04, -0.06),
      B(0.01, -0.2, -0.09, 0.075, 0.07, 0.1, skin), B(-0.01, -0.12, 0.42, 0.08, 0.08, 0.14, skin), B(0.03, -0.24, -0.3, 0.09, 0.09, 0.4, sl, 0.15, -0.2, -0.1), B(-0.04, -0.2, 0.28, 0.07, 0.07, 0.4, sl, 0.1, -0.12, 0.3)] };
    return { muz: 0.76, y: 0.03, parts: [
      B(0, 0.02, 0.05, 0.08, 0.1, 0.42, d), B(0, 0.075, 0.1, 0.07, 0.025, 0.3, "#55d0ff", 0, 0, 0, 2), B(0, 0.03, 0.5, 0.035, 0.035, 0.5, "#090d10"), B(0, 0.0, 0.32, 0.085, 0.085, 0.26, d2),
      B(0, -0.01, -0.3, 0.07, 0.13, 0.32, d), B(0, -0.13, 0.08, 0.06, 0.2, 0.1, "#0b1114", 0.15, -0.03, 0.08), B(0, -0.13, -0.06, 0.06, 0.16, 0.07, d, -0.3, -0.05, -0.06),
      B(0, 0.11, 0.1, 0.05, 0.05, 0.1, d), B(0, 0.118, 0.15, 0.02, 0.02, 0.015, "#ff3b3b", 0, 0, 0, 2), B(0, -0.07, 0.4, 0.06, 0.08, 0.08, d), B(0, 0.065, 0.76, 0.015, 0.04, 0.015, d),
      B(0.01, -0.2, -0.07, 0.075, 0.07, 0.1, skin), B(-0.02, -0.12, 0.4, 0.08, 0.08, 0.14, skin), B(0.04, -0.28, -0.26, 0.09, 0.09, 0.4, sl, 0.15, -0.2, -0.1), B(-0.04, -0.2, 0.3, 0.07, 0.07, 0.4, sl, 0.1, -0.12, 0.3)] };
  }
  function gunPass() {
    const w = cfg.weapon, ads = mouseR ? 1 : 0, g = gunParts(w), rl = P.reloading > 0 ? Math.sin((1 - P.reloading / WEAPONS[w].reload) * Math.PI) : 0, sw = P.sw > 0 ? P.sw / 0.35 : 0;
    const moving = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD, bob = Math.sin(P.t * 8) * (moving ? 0.012 : 0.003), bx = Math.cos(P.t * 4) * (moving ? 0.01 : 0.002);
    const kick = P.recoil * 3.2;
    const pos = { x: 0.26 * (1 - ads * 0.92) + bx, y: -0.29 + ads * 0.1 + bob - rl * 0.2 - sw * 0.35, z: 0.68 - kick * 0.5, ry: -0.05 * (1 - ads) };
    bi = 0; emit(pos, g.parts, 1, -(rl * 0.7) + kick * 0.5, false);
    if (fx.mf > 0) { const sx = rnd(0.08, 0.16); emit(pos, [B(0, g.y, g.muz + 0.05, sx, sx, 0.1, "#ffe48a", 0, 0, 0, 2), B(0, g.y, g.muz + 0.02, sx * 0.5, sx * 0.5, 0.2, "#ffffff", 0, 0, 0, 2), B(0, g.y, g.muz + 0.1, sx * 1.8, 0.02, 0.06, "#ffb02e", 0, 0, 0, 2), B(0, g.y, g.muz + 0.1, 0.02, sx * 1.8, 0.06, "#ffb02e", 0, 0, 0, 2)], 1, 0, false); }
    gl.clear(gl.DEPTH_BUFFER_BIT);
    drawBuf(viewProj(0, 0, 0, 0, 0), [0, 0, 0]);
  }

  // ---------- render ----------
  function renderWorld() {
    const yaw = P.yaw + shkY, pit = P.pitch + shkP, ex = P.x, ey = eye(), ez = P.z;
    buf.set(mapBuf, 0); bi = mapN; const sk = 150, V = []; for (let i = 0; i < 8; i++) V.push([ex + ((i & 1) ? sk : -sk), ey + ((i & 2) ? sk : -sk), ez + ((i & 4) ? sk : -sk)]);
    tris(V, [0, 0, 0], 3);
    for (const n of npcs) {
      const fall = n.dead ? -Math.min(1.45, (0.9 - n.fade) * 2.6) : 0, sc = n.scale;
      if (!n.dead) wbox(n.x, 0.015, n.z, 1.0 * sc, 0.01, 1.0 * sc, "#000000", 5);
      emit(n, n.boss ? dogParts(n) : humanParts(n), sc, fall, n.flash > 0);
    }
    gl.viewport(0, 0, glc.width, glc.height); gl.clearColor(0.04, 0.2, 0.28, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawBuf(viewProj(yaw, pit, ex, ey, ez), [ex, ey, ez]);
    if (!(cfg.weapon === "sniper" && mouseR)) gunPass();
  }
  function render() {
    shkY = q < 0.75 ? 0 : (Math.random() - 0.5) * fx.shake * 0.012; shkP = q < 0.75 ? 0 : (Math.random() - 0.5) * fx.shake * 0.012;
    if (glOK) renderWorld();
    ctx.clearRect(0, 0, W, H);
    for (const n of npcs) if (!n.dead) drawEsp(n);
    drawHud(); shkY = shkP = 0;
  }
  function drawEsp(n) {
    const g = geo(n); if (!g) return; const x0 = g.f.x - g.hw - 4, x1 = g.f.x + g.hw + 4, y0 = g.t.y - 4, y1 = g.f.y + 2, w = x1 - x0, h = y1 - y0, sc = n.scale;
    ctx.lineWidth = 1.6;
    if (cfg.tracers) { ctx.strokeStyle = n.boss ? "rgba(255,211,77,.55)" : "rgba(255,255,255,.3)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(g.f.x, y1); ctx.stroke(); ctx.lineWidth = 1.6; }
    if ((n.muzzle || 0) > 0 && !n.boss) { const m = pj(n, 0.31, 1.3, 1.1, 1); if (m) { ctx.fillStyle = "rgba(255,225,120,.9)"; ctx.beginPath(); ctx.arc(m.x, m.y, Math.max(3, 0.12 * m.s), 0, 6.3); ctx.fill(); ctx.strokeStyle = "rgba(255,90,70,.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(W / 2 + rnd(-30, 30), H); ctx.stroke(); ctx.lineWidth = 1.6; } }
    if (cfg.box) {
      ctx.strokeStyle = n.boss ? "#ffd34d" : "#ffffff"; const l = Math.max(6, Math.min(w, h) * 0.25); ctx.beginPath();
      ctx.moveTo(x0, y0 + l); ctx.lineTo(x0, y0); ctx.lineTo(x0 + l, y0); ctx.moveTo(x1 - l, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + l);
      ctx.moveTo(x0, y1 - l); ctx.lineTo(x0, y1); ctx.lineTo(x0 + l, y1); ctx.moveTo(x1 - l, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - l); ctx.stroke();
    }
    if (cfg.skel) {
      ctx.strokeStyle = "#37c4ff"; ctx.beginPath();
      const J = (a, b, c) => pj(n, a, b, c, sc), L = (a, b) => { if (a && b) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } };
      if (n.boss) {
        const hd = J(0, 1.02, 0.95), sh = J(0, 0.9, 0.5), hip = J(0, 0.8, -0.5), tl = J(0, 0.98, -0.95), sn = J(0, 0.94, 1.3);
        L(sn, hd); L(hd, sh); L(sh, hip); L(hip, tl);
        for (const [x, z] of [[-0.17, 0.45], [0.17, 0.45], [-0.17, -0.45], [0.17, -0.45]]) { L(z > 0 ? sh : hip, J(x, 0.5, z)); L(J(x, 0.5, z), J(x, 0, z)); }
      } else {
        const hd = J(0, 1.74, 0), nk = J(0, 1.55, 0), pl = J(0, 0.97, 0), sl = J(-0.33, 1.5, 0), sr = J(0.33, 1.5, 0), hl = J(-0.36, 0.95, 0.05), hr = J(0.31, 1.3, 0.7);
        L(hd, nk); L(nk, pl); L(sl, sr); L(sl, hl); L(sr, hr);
        for (const x of [-0.12, 0.12]) { L(pl, J(x, 0.5, 0)); L(J(x, 0.5, 0), J(x, 0, 0)); }
      }
      ctx.stroke();
    }
    if (cfg.name) { ctx.fillStyle = n.boss ? "#ffd34d" : "#fff"; ctx.font = "700 " + Math.max(10, Math.min(15, 0.2 * g.f.s * sc)) + "px Manrope,sans-serif"; ctx.textAlign = "center"; ctx.fillText(n.name + "  " + Math.round(Math.hypot(P.x - n.x, P.z - n.z)) + "m", g.f.x, y0 - 6); }
    if (cfg.hpbar && (n.hp < n.max || n.boss)) { const hp = Math.max(0, n.hp / n.max); ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(x0, y1 + 4, w, 4); ctx.fillStyle = hp > 0.5 ? "#44e08a" : hp > 0.25 ? "#ffb02e" : "#ff4d4d"; ctx.fillRect(x0, y1 + 4, w * hp, 4); }
  }
  function drawHud() {
    const cx = W / 2, cy = H / 2;
    if (cfg.weapon === "sniper" && mouseR) {
      const r = Math.min(W, H) * 0.46; ctx.save(); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, r, 0, 6.3, true); ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(0,0,0,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      ctx.strokeStyle = "#1fb6ff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.stroke(); ctx.restore();
    }
    if (cfg.fovCircle) { ctx.strokeStyle = mouseR ? "rgba(31,182,255,.9)" : "rgba(255,255,255,.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, cfg.radius, 0, 6.3); ctx.stroke(); }
    ctx.strokeStyle = fx.hitmark > 0 ? "#ff5a5a" : "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx - 3, cy); ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 9, cy); ctx.moveTo(cx, cy - 9); ctx.lineTo(cx, cy - 3); ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 9); ctx.stroke();
    ctx.textAlign = "center"; for (const m of fx.nums) { ctx.globalAlpha = Math.min(1, m.t * 2); ctx.fillStyle = m.head ? "#ffd34d" : "#ffffff"; ctx.font = (m.head ? "800 20px" : "700 15px") + " Manrope,sans-serif"; ctx.fillText(m.text, m.x, m.y); } ctx.globalAlpha = 1;
    if (fx.hs > 0) { ctx.globalAlpha = Math.min(1, fx.hs * 2); ctx.fillStyle = "#ffd34d"; ctx.font = "800 15px Manrope,sans-serif"; ctx.fillText("HEADSHOT", cx, cy + 46); ctx.globalAlpha = 1; }
    if (P.hp < P.max * 0.3 && P.hp > 0) { const pu = 0.25 + 0.2 * Math.sin(P.t * 7), v2 = ctx.createRadialGradient(cx, cy, H * 0.35, cx, cy, H * 0.9); v2.addColorStop(0, "rgba(255,0,0,0)"); v2.addColorStop(1, "rgba(255,30,30," + pu + ")"); ctx.fillStyle = v2; ctx.fillRect(0, 0, W, H); }
    if (P.prot > 0) { ctx.fillStyle = "#44e08a"; ctx.font = "700 12px Manrope,sans-serif"; ctx.fillText("SPAWN PROTECTION", cx, H * 0.2); }
    // who is shooting you: arrows around the crosshair pointing at each attacker
    for (const h of hits) { const rel = ang(Math.atan2(h.x - P.x, h.z - P.z) - P.yaw), R = Math.min(W, H) * 0.3, px = cx + Math.sin(rel) * R, py = cy - Math.cos(rel) * R; ctx.save(); ctx.globalAlpha = Math.min(1, h.t); ctx.translate(px, py); ctx.rotate(rel); ctx.fillStyle = h.n.boss ? "#ffd34d" : "#ff3b3b"; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(13, 10); ctx.lineTo(0, 4); ctx.lineTo(-13, 10); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalAlpha = Math.min(1, h.t); ctx.fillStyle = "#fff"; ctx.font = "800 12px Manrope,sans-serif"; ctx.textAlign = "center"; ctx.fillText(h.name, cx + Math.sin(rel) * (R + 30), cy - Math.cos(rel) * (R + 30) + 4); ctx.restore(); }
    if (fx.flash > 0) { const v = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, H * 0.9); v.addColorStop(0, "rgba(255,0,0,0)"); v.addColorStop(1, "rgba(255,30,30," + 0.5 * fx.flash + ")"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    drawWeaponBar(cx);
    ctx.textAlign = "left"; ctx.font = "700 13px Manrope,sans-serif"; feed.forEach((f, i) => { ctx.globalAlpha = Math.min(1, f.t); ctx.fillStyle = f.good ? "#44e08a" : f.boss ? "#ffd34d" : "#ff7a6b"; ctx.fillText(f.text, 16, H - 62 - i * 18); }); ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffd34d"; const acc = P.shots ? Math.round(P.hits / P.shots * 100) : 0;
    ctx.fillText(`Kills ${P.kills}  ·  Headshots ${P.heads}  ·  Accuracy ${acc}%`, 16, 24); ctx.fillText(`Score ${P.score.toLocaleString()}${P.mult > 1 ? "   x" + P.mult : ""}   ·   Best ${Math.max(best, P.score).toLocaleString()}`, 16, 44);
    if (!bossDone) { ctx.fillStyle = "#ff9b4a"; ctx.fillText("Bruno in " + Math.max(0, 10 - P.kills) + " kills", 16, 64); }
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(16, H - 34, 190, 12); ctx.fillStyle = P.hp > P.max * 0.4 ? "#44e08a" : "#ff4d4d"; ctx.fillRect(16, H - 34, 190 * Math.max(0, P.hp) / P.max, 12);
    ctx.fillStyle = "#fff"; ctx.fillText(Math.max(0, Math.ceil(P.hp)) + " / " + P.max + " HP", 214, H - 24);
    if (P.reloading > 0) { ctx.textAlign = "center"; ctx.font = "800 14px Manrope,sans-serif"; ctx.fillStyle = "#ffd34d"; ctx.fillText("RELOADING...", cx, H - 62); }
    const b = npcs.find(n => n.boss && !n.dead); if (b) { const bw = Math.min(420, W * 0.5), bx = cx - bw / 2; ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(bx, 16, bw, 12); ctx.fillStyle = "#ff4a3d"; ctx.fillRect(bx, 16, bw * Math.max(0, b.hp / b.max), 12); ctx.textAlign = "center"; ctx.fillStyle = "#ffd34d"; ctx.font = "800 12px Manrope,sans-serif"; ctx.fillText("BRUNO", cx, 46); }
    if (cfg.radar) {
      const R = 52, rx = W - R - 18, ry = R + 18; ctx.fillStyle = "rgba(4,20,27,.7)"; ctx.beginPath(); ctx.arc(rx, ry, R, 0, 6.3); ctx.fill(); ctx.strokeStyle = "rgba(31,182,255,.5)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - R, ry); ctx.lineTo(rx + R, ry); ctx.moveTo(rx, ry - R); ctx.lineTo(rx, ry + R); ctx.strokeStyle = "rgba(31,182,255,.18)"; ctx.stroke();
      const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
      for (const n of npcs) { if (n.dead) continue; const dx = n.x - P.x, dz = n.z - P.z, f2 = (dx * s + dz * c) / 45 * R, r2 = (dx * c - dz * s) / 45 * R, d = Math.hypot(f2, r2), k = d > R - 4 ? (R - 4) / d : 1; ctx.fillStyle = n.boss ? "#ffd34d" : "#ff5a4a"; ctx.beginPath(); ctx.arc(rx + r2 * k, ry - f2 * k, n.boss ? 5 : 3, 0, 6.3); ctx.fill(); }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(rx, ry - 6); ctx.lineTo(rx - 4, ry + 4); ctx.lineTo(rx + 4, ry + 4); ctx.fill();
    }
    if (fx.toastT > 0) { ctx.textAlign = "center"; ctx.globalAlpha = Math.min(1, fx.toastT); ctx.fillStyle = "#ffd34d"; ctx.font = "800 26px Manrope,sans-serif"; ctx.fillText(fx.toast, cx, H * 0.28); ctx.globalAlpha = 1; }
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

  // ---------- leaderboard (Discord login) ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const hasApi = typeof Api !== "undefined" && typeof Auth !== "undefined";
  async function loadLb() {
    const ul = $("lbList"); if (!ul) return;
    try {
      const d = await Api.get("/api/minigame/leaderboard");
      ul.innerHTML = d.list.length ? d.list.map((r, i) => '<li class="' + (i < 3 ? "top" : "") + '"><b>' + (i + 1) + '</b><img src="' + esc(r.avatar || "/img/logo.png") + '" alt="" loading="lazy"><span class="n">' + esc(r.name) + '</span><span class="k">' + r.kills + ' kills</span><span class="s">' + r.score.toLocaleString() + '</span></li>').join("") : '<li class="empty">No scores yet. Be the first on the board.</li>';
    } catch { ul.innerHTML = '<li class="empty">The leaderboard is offline right now.</li>'; }
  }
  function lbAuth() {
    const el = $("lbAuth"); if (!el || !hasApi) return; const a = Auth.get();
    el.innerHTML = a ? '<span class="who"><img src="' + Auth.avatar(a.user) + '" alt="">' + esc(a.user.global_name || a.user.username) + '</span>' : '<a class="btn btn-main" id="lbLogin" href="#">Log in with Discord</a>';
    const b = $("lbLogin"); if (b) b.addEventListener("click", e => { e.preventDefault(); try { sessionStorage.setItem("strive_next", "/mini-games"); } catch { } location.href = Auth.loginUrl(); });
  }
  async function submitScore() {
    if (!hasApi) return; const a = Auth.get(), add = t => { $("mgText").innerHTML += "<br><span class='mg-rank'>" + t + "</span>"; };
    if (!a) { add("Log in with your Discord account to put this score on the leaderboard."); return; }
    if (!P.score) return;
    try { const r = await Api.post("/api/minigame/score", { score: P.score, kills: P.kills, heads: P.heads }, a.token); add(r.best ? "New personal best. You are #" + r.rank + " on the leaderboard." : "Your best is " + r.score.toLocaleString() + " (#" + r.rank + " on the leaderboard)."); loadLb(); }
    catch (e) { add(e.status === 401 ? "Your login expired. Log in again to save scores." : "Could not save to the leaderboard right now."); }
  }

  // ---------- loop + overlay ----------
  let slow = 0, fast = 0, idle = 0;
  function frame(t) {
    requestAnimationFrame(frame); const raw = (t - last) || 16; last = t;
    if (document.hidden || !onScreen) return;
    const dt = Math.min(0.05, raw / 1000);
    if (running) {
      update(dt); if (running) render();
      if (raw > 30) { slow++; fast = 0; } else if (raw < 20) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 25 && q > 0.5) { q = Math.max(0.5, q - 0.25); slow = 0; resize(); }
      else if (fast > 400 && q < 1) { q = Math.min(1, q + 0.25); fast = 0; resize(); }
    } else if (++idle % 20 === 1) render();
  }
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);
  function showOverlay(title, html, label) { $("mgTitle").textContent = title; $("mgText").innerHTML = html; btn.textContent = label; over.hidden = false; }
  const DESC = "Hunt down the NPC players in a 3D arena. Hold right click to lock onto the nearest target inside your FOV circle. Every kill heals 15 HP, raises your max health and chains a score multiplier, and watch out: they shoot back. Reach 10 kills and Bruno, a huge dog, comes for you.";
  function pause() { if (!running) return; running = false; mouseL = mouseR = false; for (const k in keys) keys[k] = false; showOverlay("Paused", DESC, "Click to Play"); }
  function start() {
    audio(); if (ac && ac.state === "suspended") ac.resume();
    if (dead || !P) { reset(); dead = false; }
    over.hidden = true; running = true; music(cfg.music);
    // go fullscreen when you press play (this click is the user gesture the browser needs)
    if (!document.fullscreenElement && stage.requestFullscreen) { try { const r = stage.requestFullscreen(); if (r && r.catch) r.catch(() => { }); } catch { } }
    try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch { }
  }
  if (!glOK) { $("mgText").textContent = "Your browser does not support WebGL, so the 3D trainer cannot start."; btn.style.display = "none"; }
  if (matchMedia("(pointer:coarse)").matches && !matchMedia("(pointer:fine)").matches) { $("mgText").textContent = "This trainer needs a mouse and keyboard. Open it on a PC to play."; btn.textContent = "Try anyway"; }
  btn.addEventListener("click", start);
  cv.addEventListener("click", () => { if (running && !document.pointerLockElement) { try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch { } } });
  document.addEventListener("fullscreenchange", () => { setTimeout(resize, 60); if (!document.fullscreenElement && running) pause(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  document.addEventListener("pointerlockchange", () => { locked = document.pointerLockElement === cv; if (!locked && running && !dead && !document.fullscreenElement) pause(); });
  document.addEventListener("mousemove", e => { if (!running) return; const k = cfg.weapon === "sniper" && mouseR ? 0.0007 : 0.0022; P.yaw += e.movementX * k * cfg.sens; P.pitch -= e.movementY * k * cfg.sens; });
  cv.addEventListener("mousedown", e => { if (!running) return; if (e.button === 0) mouseL = { fired: false }; if (e.button === 2) mouseR = true; });
  document.addEventListener("mouseup", e => { if (e.button === 0) mouseL = false; if (e.button === 2) mouseR = false; });
  cv.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (e.code === "Escape" && running) { pause(); return; }
    if (!running) return; keys[e.code] = true; if (["Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyR") reload(); if (e.code === "Digit1") setWeapon("rifle"); if (e.code === "Digit2") setWeapon("pistol"); if (e.code === "Digit3") setWeapon("sniper");
    if (e.code === "KeyX") toggle("skel"); if (e.code === "KeyC") toggle("box"); if (e.code === "KeyV") toggle("name"); if (e.code === "KeyB") toggle("fovCircle");
    if (e.code === "KeyZ") { cfg.bone = cfg.bone === "head" ? "chest" : "head"; sync(); } if (e.code === "KeyM") { cfg.mute = !cfg.mute; setVol(); sync(); }
    if (e.code === "KeyT") toggle("trigger"); if (e.code === "KeyF") toggle("aimbot"); if (e.code === "KeyP" && !bossDone) spawnBoss();
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
  sync(); reset(); lbAuth(); loadLb(); requestAnimationFrame(frame);
})();
