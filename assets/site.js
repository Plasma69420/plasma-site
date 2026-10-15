/* Plasma storefront: shared config, cart, Discord login, layout */
// show clean URLs: /status instead of /status.html (the file still works either way)
if (/.html$/.test(location.pathname)) {
  history.replaceState(null, "", (location.pathname.replace(/(\/index)?\.html$/, "") || "/") + location.search + location.hash);
}
const CONFIG = {
  discord: "https://discord.gg/2nmZpcrC2",
  telegram: "https://t.me/+szYZUy4Er4EyZjkx",
  discordClientId: "1558554710384844972",
  api: "https://plasma-bot-production.up.railway.app",
  // invite to your separate Media Discord (leave empty to use the main Discord)
  mediaDiscord: "",
  // optional banner on the home page, e.g. { text: "10% off your first order, use code", code: "PLASMA10", href: "/products" }. Only set a code that exists as a coupon in SellApp.
  promo: null,
  // Paste your YouTube video link here (e.g. https://www.youtube.com/watch?v=XXXXXXXXXXX). Empty hides the showcase.
  showcaseYouTube: "",
  products: [
    {
      slug: "fortnite-private", name: "Fortnite Private", type: "Private", game: "Fortnite", img: "/img/fortnite.webp",
      desc: "Smooth private build with a clean in-game menu.",
      features: ["ESP & visibility checks", "Smooth aim assist", "Stream-proof menu"],
      details: "Plasma Fortnite Private is a private build with a clean in-game menu, visibility checks and smooth aim assist. Your key and loader are delivered instantly after payment, and support is available in our Discord.",
      hosted: "https://plasmacheats.sell.app/product/fortnite-private",
      plans: [{ n: "Day", p: 4.99, v: 416469 }, { n: "Week", p: 14.99, v: 416470 }, { n: "Month", p: 24.99, v: 416471 }, { n: "Lifetime", p: 79.99, v: 416472 }]
    },
    {
      slug: "fortnite-slotted", name: "Fortnite Slotted", type: "Slotted", game: "Fortnite", img: "/img/fortnite-slotted.webp",
      desc: "Slotted Fortnite cheat with limited slots per tier.",
      features: ["Aimbot with FOV, smoothing & prediction", "Player, loot & weapon ESP", "Limited slots for stable performance"],
      details: "Slotted Fortnite cheat with limited slots per tier. Premium features, stable performance and instant delivery, built for serious players. Slots refill slowly: once a tier is sold out, access closes until a slot expires.",
      slotNote: "Slots refill slowly. Once sold out, access closes until a slot expires.",
      groups: [
        ["Aimbot", ["High-precision aimbot with FOV slider", "Smoothness, prediction & visibility check", "Aim bone selection", "Silent aim option"]],
        ["Visuals", ["Player ESP (boxes, skeleton, healthbars)", "Loot & weapon ESP", "Vehicle highlighting", "Custom color palette"]],
        ["Performance", ["Optimized for low input delay", "Stream-proof rendering", "Stable 240Hz+ tickrate"]],
        ["Misc", ["Slot guarantees performance, no overcrowded servers", "Discord support included", "Lifetime updates on slotted plan"]]
      ],
      os: "Windows 10/11",
      steps: [["Buy your slot", "Pick your tier and pay with PayPal, Cash App or Solana. About 30 seconds."], ["Activate your slot", "Right after payment you will see exactly how to activate your slot and get the loader."], ["Queue and play", "Launch the game and play like normal. No sketchy accounts or extra steps."]],
      // slots = max slots in that tier, days = for the per-day price. v = SellApp variant id (null until the product is created in SellApp)
      plans: [{ n: "Week", p: 29.99, v: 416783, slots: 15, days: 7 }, { n: "Month", p: 69.99, v: 416784, slots: 10, days: 30 }, { n: "3 Months", p: 129.99, v: 416785, slots: 5, days: 90 }]
    },
    {
      slug: "r6-external", name: "R6 External", type: "External", game: "Rainbow Six Siege", img: "/img/r6-external.webp",
      desc: "External Rainbow Six Siege cheat with ESP and aim suite.",
      features: ["Smooth aim with FOV & smoothness sliders", "Player, drone & gadget ESP", "External, stream-proof rendering"],
      details: "External Rainbow Six Siege cheat with ESP and an aim suite. It runs externally with no game injection, renders stream-proof, and is delivered instantly with Discord support.",
      groups: [
        ["Aimbot", ["Smooth aim with FOV & smoothness sliders", "Bone targeting (head, chest, pelvis)", "Visibility check", "Aim key / toggle support"]],
        ["Visuals", ["Player ESP boxes & skeleton", "Distance, name & health", "Drone & gadget ESP", "Customizable colors"]],
        ["Security", ["External, no game injection", "BattlEye bypass updated regularly", "Stream-proof rendering"]],
        ["Extras", ["Configurable hotkeys", "Instant delivery & Discord support"]]
      ],
      plans: [{ n: "Day", p: 6.99, v: 416712 }, { n: "Week", p: 26.99, v: 416705 }, { n: "Month", p: 59.99, v: 416716 }, { n: "Lifetime", p: 149.99, v: 416735 }]
    },
    {
      slug: "marvel-rivals", name: "Marvel Rivals", type: "Private", game: "Marvel Rivals", img: "/img/marvel-rivals.webp",
      desc: "Hero-aware Marvel Rivals cheat with smooth aim and full ESP.",
      features: ["Hero-aware aim with prediction", "Full player ESP & radar", "Save and load configs"],
      details: "Hero-aware Marvel Rivals cheat with smooth aim and full ESP. Prediction is tuned per projectile hero, and everything is configurable with saveable configs.",
      groups: [
        ["Aimbot", ["Enable aimbot", "Aim key (rebindable)", "Require visible (occlusion check)", "Target lock (sticks to one enemy until they die / leave FOV)", "Target priority (closest to crosshair, lowest health first, closest world distance)", "Target bone (head, neck, chest, pelvis, feet, closest bone)", "Aim FOV cone", "Aim smoothing", "Vertical offset (fine-tune compensation in UU)", "Show FOV ring on screen (visualizer)"]],
        ["Prediction", ["Enable prediction", "Hero to customize (every projectile hero in the SDK)", "Projectile speed override (UU/s)", "Projectile gravity / drop override (UU/s²)", "Reset selected hero to table defaults", "Global speed override", "Global gravity override", "Motion curve (linear, ease-out, ease-in-out, S-curve)", "Reaction delay (ms)", "Reaction variance (% random)", "Target switch grace window (ms)", "Minimum aim speed (fraction)", "Pitch vs yaw speed ratio", "Overshoot past target (%)", "Hand tremor noise (degrees)", "Breathing amount (degrees)", "Apply LEGIT preset", "Apply RAGE preset", "Reset aim key to Mouse R"]],
        ["Visuals (ESP)", ["Enable ESP", "Players (self filter, teammates, enemies)", "Box (style: full / corner brackets / filled)", "Outline thickness", "Bracket corner length", "Filled box opacity", "Max ESP draw distance (m)", "Hide text below box height", "Player name", "Hero name", "K / D / A score", "Role badge (Strategist / Duelist / Vanguard)", "Distance", "Velocity (km/h)", "Snaplines", "Snapline origin (top, middle, bottom of screen)", "Snapline target (top, middle, bottom of box)", "Snapline thickness", "Custom snapline color (visible / occluded)", "Head dot", "Head dot vertical position (% of box)", "Health display", "Health style (bar, number, both)", "Ultimate status bar", "Only visible / visibility check", "Off-screen arrows", "Arrow size", "Screen edge margin"]],
        ["World", ["Custom crosshair", "Crosshair style (dot, cross, circle, +dot, T)", "Crosshair size", "Crosshair line thickness", "Crosshair center gap", "Black outline (readability)", "Crosshair color", "Mini radar", "Radar screen corner (TL, TR, BL, BR)", "Radar size", "Radar detection range (meters)", "Radar background opacity", "Filter (use team filter, show teammates)"]],
        ["Settings", ["Menu transparency", "UI scale (DPI)", "Overlay FPS cap (0 = uncapped)", "VSync", "Low-power mode when game is alt-tabbed", "Save config to file", "Load config from file", "Reset every setting to defaults"]]
      ],
      plans: [{ n: "1 Day", p: 5.99, v: 416737 }, { n: "1 Week", p: 19.99, v: 416738 }, { n: "1 Month", p: 39.99, v: 416739 }]
    },
    {
      slug: "arc-raiders", name: "Arc Raiders", type: "Private", game: "Arc Raiders", img: "/img/arc-raiders.webp",
      desc: "Premium Arc Raiders cheat for dominating every run.",
      features: ["Smooth aim with FOV & smoothness", "Player, loot & NPC ESP", "Auto-updates with game patches"],
      details: "Premium Arc Raiders cheat for dominating every run. Smooth aim, full ESP including loot and enemy NPCs, a stream-proof overlay, and updates that follow each Arc Raiders patch.",
      groups: [
        ["Aimbot", ["Smooth aim with adjustable FOV & smoothness", "Bone selection & visibility check", "Aim key / toggle modes"]],
        ["Visuals", ["Player ESP (boxes, skeleton, healthbars)", "Loot & enemy NPC ESP", "Distance, name & class labels", "Custom color palette"]],
        ["Extras", ["Stream-proof overlay", "Configurable hotkeys", "Instant delivery & Discord support", "Auto-updates with Arc Raiders patches"]]
      ],
      plans: [{ n: "1 Day", p: 5.99, v: 416741 }, { n: "1 Week", p: 22.99, v: 416742 }, { n: "1 Month", p: 54.99, v: 416743 }]
    },
    {
      slug: "roblox-external", name: "Roblox External", type: "External", game: "Roblox", img: "/img/roblox-external.webp", down: true,
      desc: "Secure, stable and silent Roblox external with a built-in menu.",
      features: ["Smooth UI & built-in menu", "Cloud-based loader, no FPS loss", "Auto-updates & maintenance included"],
      details: "Plasma Roblox is a premium Roblox external built to be secure, stable and silent. It ships with a smooth built-in menu, a lightweight cloud-based loader with no FPS or lag issues, and auto-updates included. Lifetime license is $7.99 or 1,000 Robux. NOTICE: this product is currently down, so purchases will not work until it is back online. Join our Discord for updates.",
      groups: [
        ["Why Plasma?", ["Active support team, help available when you need it", "Smooth UI & built-in menu with clean visuals", "Built to avoid Roblox detection systems", "Instant setup & fast launch", "Legit-friendly & exploit-safe"]],
        ["Secure & Lightweight", ["Cloud-based loader", "No FPS or lag issues", "Auto-updates & maintenance included"]],
        ["Compatibility", ["Windows 10 & 11", "Intel & AMD CPUs"]]
      ],
      os: "Windows 10/11",
      plans: [{ n: "Lifetime", p: 7.99, v: null, alt: "or 1,000 Robux" }]
    },
    {
      slug: "temp-spoofer", name: "Temp Spoofer", type: "Spoofer", game: "Spoofer", img: "/img/temp-spoofer.webp",
      desc: "Spoofs your serials until your next restart.",
      features: ["One-click spoof", "Resets on reboot", "Intel & AMD"],
      details: "Temporary HWID spoofer. It changes your hardware identifiers until your next restart, supports Intel and AMD, and runs in one click.",
      hosted: "https://plasmacheats.sell.app/product/temp-spoofer",
      // Day: v is null until the Day variant (.99) exists in SellApp; until then the page offers it by ticket
      plans: [{ n: "Day", p: 7.99, v: null }, { n: "Week", p: 14.99, v: 416474 }, { n: "Month", p: 29.99, v: 416475 }, { n: "Lifetime", p: 124.99, v: 416476 }]
    },
    {
      slug: "perm-spoofer", name: "Perm Spoofer", type: "Spoofer", game: "Spoofer", img: "/img/perm-spoofer.webp",
      desc: "Permanently changes your serials. Run it once.",
      features: ["Permanent change", "Disk & NIC support", "Intel & AMD"],
      details: "Permanent HWID spoofer. It changes your serials for good, so you only run it once. Supports disk and network adapters on Intel and AMD.",
      hosted: "https://plasmacheats.sell.app/product/perm-spoofer",
      plans: [{ n: "One Time", p: 14.99, v: 416478 }, { n: "Lifetime", p: 49.99, v: 416479 }]
    },
    {
      slug: "fortnite-accounts", name: "Fortnite Accounts", type: "Accounts", game: "Fortnite", account: true, updated: "October 11", img: "/img/fortnite-accounts.webp",
      desc: "Full access Fortnite accounts with verified inventories.",
      features: ["Verified skin & item counts", "Original email full access", "Login details + recovery email"],
      details: "Hand-picked full access Fortnite accounts with verified inventories. Pick a package, pay at checkout, then open a ticket in our Discord with your invoice ID to receive your account.",
      groups: [
        ["Account Quality", ["Verified skin & item counts", "Original email full access", "Account age & V-Bucks listed up front"]],
        ["Delivery", ["Delivered in a ticket after purchase (include your invoice ID)", "Login credentials + recovery email", "Cross-platform compatible"]],
        ["Support", ["Replacement policy on login issues", "Direct Discord support"]]
      ],
      plans: []
    }
  ]
};

// Fortnite Accounts packages: [group, label, price, stock shown, SellApp variant id]
// The stock number is a display value you control (edit it here to match what you really have). Variant ids come from SellApp.
const FA_PACKAGES = [
  ["Guaranteed Skins", "25-35 Skins", 4.50, 18], ["Guaranteed Skins", "35-45 Skins", 6.50, 14],
  ["Guaranteed Skins", "45-55 Skins", 8.50, 11], ["Guaranteed Skins", "55-65 Skins", 10.50, 9],
  ["Guaranteed Skins", "100-200 Skins", 16.99, 7], ["Guaranteed Skins", "200-400 Skins", 49.99, 4],
  ["Rare & OG Skins", "Chani", 12.99, 8], ["Rare & OG Skins", "Travis Scott", 39.99, 5],
  ["Rare & OG Skins", "Sparkle Specialist", 54.99, 4], ["Rare & OG Skins", "Galaxy", 59.99, 6],
  ["Rare & OG Skins", "Ikonik", 62.99, 3], ["Rare & OG Skins", "Black Knight", 79.99, 3],
  ["Rare & OG Skins", "Wildcat", 99.99, 2], ["Rare & OG Skins", "OG Skull Trooper (Purple)", 629.99, 1],
  ["Rare & OG Skins", "OG Aerial Assault Trooper", 899.99, 1], ["Rare & OG Skins", "OG Renegade Raider", 949.99, 1],
  ["Rare & OG Skins", "OG Ghoul Trooper (Pink)", 1099.99, 1],
  ["Rare Pickaxes", "Star Wand", 3.99, 16], ["Rare Pickaxes", "Cold Snap", 3.99, 13],
  ["Rare Pickaxes", "Vision", 5.99, 12], ["Rare Pickaxes", "Axe Of Champions 2.0", 5.99, 9],
  ["Rare Pickaxes", "Candy Axe", 7.99, 8], ["Rare Pickaxes", "Leviathan Axe", 19.99, 5],
  ["Rare Pickaxes", "Merry Mint Axe", 19.99, 5], ["Rare Pickaxes", "Trusty No. 2", 24.99, 4]
];
const FA_VARIANTS = [];   // SellApp variant ids, same order as FA_PACKAGES
CONFIG.products.find(p => p.slug === "fortnite-accounts").plans = FA_PACKAGES.map(([g, s, p, stock], i) => ({ n: g + " · " + s, g, s, p, stock, v: FA_VARIANTS[i] || null }));

// optional add-on sold next to any product (a separate SellApp product, filled in by variant id)
CONFIG.addon = {
  name: "AnyDesk Support", price: 4.99, v: 416744,
  desc: "Direct setup help from Plasma via AnyDesk: loader, spoofer, drivers, and troubleshooting.",
  fine: "Optional · Sessions scheduled by availability · Have AnyDesk or RustDesk ready before your session."
};

// every product gets its own AnyDesk add-on (own price, own SellApp variant id). Change a price or paste a variant id here.
CONFIG.tickets = "https://discord.com/channels/1555806695362666618/1556013981674635344";
// loader download links per product slug. Paste a URL to turn on the Download button on the /downloads page
// for customers who own that product; without one they get a "Request your download" ticket button.
CONFIG.downloads = { "fortnite-private": "", "r6-external": "", "marvel-rivals": "", "arc-raiders": "", "temp-spoofer": "", "perm-spoofer": "" };
CONFIG.products.forEach(p => { p.addon = Object.assign({ price: CONFIG.addon.price, v: CONFIG.addon.v }, p.addon); });

const STATUS = {
  undetected: ["Undetected", ""], updating: ["Updating", "updating"], maintenance: ["Maintenance", "updating"],
  detected: ["Detected", "down"], down: ["Down", "down"]
};
// products flagged down: true always show as Down, whatever the bot says
const statusOf = (p, live) => p.down ? "down" : ((live || {})[p.slug] || {}).status;
const money = n => "$" + Number(n).toFixed(2);
// purple trust pills (footer + product pages)
const trustHtml = (() => {
  const i = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const L = '<rect x="5" y="11" width="14" height="9" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';
  return '<div class="trustrow">' + [
    [L, "Secure SSL"],
    ['<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>', "Secure Checkout"],
    [L + '<circle cx="12" cy="15.5" r="1.3"/>', "SSL Encrypted"],
    ['<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>', "Instant Delivery"]
  ].map(t => '<span>' + i(t[0]) + t[1] + '</span>').join("") + '</div>';
})();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const productBy = slug => CONFIG.products.find(p => p.slug === slug);
const ico = {
  discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18a19.8 19.8 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-3c.5-5.1-.8-9.6-3.6-13.6ZM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 8H6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 6.9L12 17.5 5.8 21l1.4-6.9L2 9.3l7-.8z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};

/* ---------- cart (saved in this browser) ---------- */
const Cart = {
  items() { try { return (JSON.parse(localStorage.getItem("plasma_cart")) || []).filter(i => productBy(i.slug) && productBy(i.slug).plans[i.plan]); } catch { return []; } },
  save(list) { try { localStorage.setItem("plasma_cart", JSON.stringify(list)); } catch { } Cart.badge(); },
  // `any` = the item also includes the optional AnyDesk Support add-on (once per unit)
  add(slug, plan, qty = 1, any = false) {
    any = !!any;
    const list = Cart.items(), f = list.find(i => i.slug === slug && i.plan === plan && !!i.any === any);
    if (f) f.qty = Math.min(10, f.qty + qty); else list.push({ slug, plan, qty, any });
    Cart.save(list);
  },
  setQty(slug, plan, qty, any = false) {
    let list = Cart.items();
    list = list.map(i => i.slug === slug && i.plan === plan && !!i.any === !!any ? { ...i, qty: Math.max(0, Math.min(10, qty)) } : i).filter(i => i.qty > 0);
    Cart.save(list);
  },
  clear() { Cart.save([]); },
  count() { return Cart.items().reduce((a, i) => a + i.qty, 0); },
  unit(i) { const p = productBy(i.slug); return p.plans[i.plan].p + (i.any ? p.addon.price : 0); },
  // true when every item in the cart can actually be bought (its SellApp variant exists)
  buyable() { return Cart.items().every(i => { const p = productBy(i.slug); return p.plans[i.plan].v && (!i.any || p.addon.v); }); },
  total() { return Cart.items().reduce((a, i) => a + Cart.unit(i) * i.qty, 0); },
  badge() { const n = Cart.count(); document.querySelectorAll(".cart-count").forEach(b => { b.textContent = n; b.hidden = !n; }); }
};

/* ---------- Discord login (browser-only OAuth, no secret needed) ---------- */
const Auth = {
  get() { try { const a = JSON.parse(localStorage.getItem("plasma_auth") || "null"); if (a && a.exp > Date.now()) return a; } catch { } return null; },
  set(a) { try { localStorage.setItem("plasma_auth", JSON.stringify(a)); } catch { } },
  logout() { try { localStorage.removeItem("plasma_auth"); } catch { } location.href = "/"; },
  redirectUri() { return location.origin + "/login.html"; },
  loginUrl() {
    const state = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
    try { sessionStorage.setItem("plasma_state", state); } catch { }
    return "https://discord.com/oauth2/authorize?response_type=token&client_id=" + CONFIG.discordClientId +
      "&scope=" + encodeURIComponent("identify email") + "&state=" + state + "&redirect_uri=" + encodeURIComponent(Auth.redirectUri());
  },
  avatar(u) {
    if (u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128`;
    return `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`;
  }
};

/* ---------- API ---------- */
const Api = {
  async get(path, token) {
    const r = await fetch(CONFIG.api + path, { headers: token ? { Authorization: "Bearer " + token } : {} });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "Request failed"), { status: r.status });
    return j;
  },
  async post(path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    const r = await fetch(CONFIG.api + path, { method: "POST", headers, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || "Request failed"), { status: r.status });
    return j;
  },
  async status() { try { return (await Api.get("/api/status")).products; } catch { return {}; } }
};

/* ---------- shared layout ---------- */
(() => {
  const seg = location.pathname.replace(/^\/|\/$|\.html$/g, "") || "index";
  const here = productBy(seg) ? "products" : seg;
  const link = (href, label, key) => `<a href="${href}"${key === here ? ' class="on"' : ""}>${label}</a>`;
  const u = Auth.get();
  const mi = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const uname = u ? esc(u.user.global_name || u.user.username) : "";
  const userBtn = u
    ? `<div class="udrop" id="udrop">
        <button class="nav-btn" id="uTrig" aria-haspopup="true" aria-expanded="false"><img class="nav-av" src="${Auth.avatar(u.user)}" alt=""><span>${uname}</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
        <div class="umenu" id="uMenu" role="menu">
          <div class="uhead"><img src="${Auth.avatar(u.user)}" alt=""><div><b>${uname}</b><small>${esc(u.user.email || "")}</small></div></div>
          <a href="/account" role="menuitem">${mi('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')}My account</a>
          <a href="/orders" role="menuitem">${mi('<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>')}My orders<i class="ucount" id="uOrders">0</i></a>
          <a href="/keys" role="menuitem">${mi('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M16 7l3 3M14 9l2 2"/>')}My keys</a>
          <a href="/downloads" role="menuitem">${mi('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>')}Downloads</a>
          <button type="button" id="uOut" role="menuitem">${mi('<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>')}Logout</button>
        </div>
      </div>`
    : `<a class="nav-btn" href="/login">${ico.user}<span>Login</span></a>`;

  document.body.insertAdjacentHTML("afterbegin", `
<div class="bgfx" aria-hidden="true"><div class="top"></div></div>
<canvas class="stars" id="stars"></canvas>
<header class="nav" id="nav">
  <div class="nav-bar"><div class="nav-in">
    <a href="/" class="brand"><img src="/img/logo.png" alt="">Plasma</a>
    <nav class="nav-links" id="navLinks">
      ${link("/", "Home", "index")}${link("/products", "Products", "products")}${link("/reviews", "Reviews", "reviews")}${link("/status", "Status", "status")}${link("/media", "Media", "media")}
    </nav>
    <div class="nav-right">
      <a class="nav-btn" href="${CONFIG.discord}" target="_blank" rel="noopener">${ico.discord}<span>Discord</span></a>
      ${userBtn}
      <a class="nav-btn icon cart-btn" href="/cart" aria-label="Cart">${ico.cart}<b class="cart-count" hidden>0</b></a>
      <button class="nav-btn icon burger" id="burger" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div></div>
</header>`);

  document.body.insertAdjacentHTML("beforeend", `
<footer class="foot">
  <div class="fglow"></div>
  <div class="wrap">
    <div class="frow">
      <a href="/" class="brand" aria-label="Plasma"><img src="/img/logo.png" alt="">Plasma</a>
      <nav>
        <a href="/">Home</a><a href="/products">Products</a><a href="/reviews">Reviews</a><a href="/status">Status</a><a href="/media">Media</a><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/refund">Refund Policy</a>
      </nav>
      <div class="fsoc">
        <a href="${CONFIG.discord}" target="_blank" rel="noopener" aria-label="Discord">${ico.discord}</a>
        <a href="${CONFIG.telegram}" target="_blank" rel="noopener" aria-label="Telegram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.8 15.6 9.4 20c.6 0 .9-.3 1.200-.6l2.900-2.800 6 4.400c1.100.6 1.900.3 2.200-1l3.900-18.400c.4-1.600-.6-2.300-1.700-1.900L1.100 8.500c-1.600.6-1.600 1.500-.3 1.900l5.900 1.800L20.400 4c.6-.4 1.200-.2.700.2z" transform="translate(-1 0)"/></svg></a>
      </div>
    </div>
    ${trustHtml}
    <div class="fbar"><span>© ${new Date().getFullYear()} Plasma. All rights reserved.</span><span>Site made by <b>Punch</b></span></div>
  </div>
</footer>`);

  // account dropdown
  if (u) {
    const dd = document.getElementById("udrop"), trig = document.getElementById("uTrig");
    const setOpen = o => { dd.classList.toggle("open", o); trig.setAttribute("aria-expanded", o); };
    trig.addEventListener("click", e => { e.stopPropagation(); setOpen(!dd.classList.contains("open")); });
    document.addEventListener("click", e => { if (!dd.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
    document.getElementById("uOut").addEventListener("click", () => Auth.logout());
    Api.get("/api/orders", u.token).then(d => { document.getElementById("uOrders").textContent = d.orders.length; }).catch(() => { });
  }

  // nav: floating bar on every page
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const links = document.getElementById("navLinks");
  document.getElementById("burger").addEventListener("click", () => links.classList.toggle("open"));
  Cart.badge();

  // drifting particles
  const c = document.getElementById("stars"), x = c.getContext("2d");
  let w, h, dots = [];
  const size = () => {
    const d = devicePixelRatio || 1;
    w = c.width = innerWidth * d; h = c.height = innerHeight * d;
    c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
    dots = Array.from({ length: Math.round(innerWidth / 12) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.1 + .3) * d, v: (Math.random() * .2 + .04) * d, a: Math.random() * 6.28 }));
  };
  size(); addEventListener("resize", size);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tick = () => {
    x.clearRect(0, 0, w, h);
    for (const s of dots) {
      s.y -= s.v; s.a += .015;
      if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
      x.globalAlpha = .15 + Math.abs(Math.sin(s.a)) * .5; x.fillStyle = "#fff";
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill();
    }
    if (!still) requestAnimationFrame(tick);
  };
  tick();
})();

// reveal-on-scroll; call revealAll() after adding .reveal elements dynamically
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
const revealAll = () => document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
addEventListener("DOMContentLoaded", revealAll);
