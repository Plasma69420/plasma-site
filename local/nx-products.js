/* Chest Cheat (Fortnite) and Rob Run (Steam). Loaded right after /assets/site.js (see nx-boot.js), before any page script
   runs, so every page (store, status, search, product pages) sees them in CONFIG.products.

   Plans: n = name, p = price, pop = "Most popular" badge, sold = sold out.
   v = SellApp variant id: NOT SET YET, so the Buy button isn't shown and the page offers "Open a ticket to buy" instead
   (ticketOnly). When the SellApp products exist, put each plan's variant id in v and remove ticketOnly: Buy Now, Add to Cart
   and the checkout then work like every other product. */
(() => {
  if (typeof CONFIG === "undefined" || !CONFIG.products) return;
  // "How it works" for ticket orders (the page's default steps describe the instant-checkout flow)
  const ticketSteps = [["Buy your key", "Pick your plan and pay with Cash App or Solana. About 30 seconds."], ["Get your key", "Once you've paid, your order page shows how to get your key and the setup guide."], ["Queue and play", "Launch the game and play like normal. Our Discord support team is there if you need a hand."]];
  const items = [
    {
      slug: "chest-cheat", name: "Chest Cheat", type: "Private", game: "Fortnite", img: "/local/cards/box-chest-cheat.webp", desc: "Chest Cheat for Fortnite. Available for a limited time.",
      features: ["Chest Cheat for Fortnite", "Limited time only", "Instant key delivery and Discord support"],
      details: "Chest Cheat for Fortnite is only available for a limited time. Keys are delivered through our Discord, and our team is there if you need a hand with setup.",
      slotNote: "Chest Cheat is only available for a limited time.",
      groups: [["Chest Cheat", ["Made for Fortnite", "Available for a limited time only", "Delivered through our Discord", "Same Discord support as every Strive product"]]],
      os: "Windows 10/11",
      plans: [{ n: "1 Day", p: 9.99, v: 426214 }, { n: "7 Days", p: 59.99, v: 426215, pop: true }, { n: "30 Days", p: 144.99, v: 426216 }]
    },
    {
      slug: "rob-run", name: "Rob Run", type: "Private", game: "Rob Run", img: "/local/cards/box-rob-run.webp", desc: "Rob Run (Steam) tool.",
      features: ["Made for Rob Run on Steam", "Day, week, month and lifetime keys", "Instant key delivery and Discord support"],
      details: "Our Rob Run tool is made for Rob Run, the multiplayer crime game on Steam. Pick a day, week, month or lifetime key. Keys are delivered through our Discord, and our team is there if you need a hand with setup.",
      groups: [["Rob Run", ["Made for Rob Run on Steam", "Day, 3 day, week, month and lifetime keys", "Delivered through our Discord", "Same Discord support as every Strive product"]]],
      os: "Windows 10/11",
      plans: [{ n: "1 Day", p: 4.99, v: 426218 }, { n: "3 Day", p: 8.99, v: 426219 }, { n: "1 Week", p: 15.99, v: 426220, pop: true }, { n: "1 Month", p: 32.99, v: 426221 }, { n: "Lifetime", p: 109.99, v: 426222 }]
    }
  ];
  // site.js gives every product its add-on (AnyDesk support) when it loads, before these exist: do the same here
  // the live status (set by the team's bot, per product slug) doesn't know these two yet: until it does, show them as Undetected,
  // which is also what the store page assumes for any product without a status
  if (typeof Api !== "undefined" && Api.status) {
    const orig = Api.status.bind(Api);
    Api.status = (...a) => orig(...a).then(d => { d = d || {}; items.forEach(p => { if (!d[p.slug]) d[p.slug] = { status: "undetected" }; }); return d; });
  }
  // fake vouches taken off the site, matched on their exact post time (the bot's vouch numbers can be reused).
  // The count and average shown on the pages leave them out too.
  const FAKE_VOUCHES = [1795759643364];
  if (typeof Api !== "undefined" && Api.get) {
    const get = Api.get.bind(Api);
    Api.get = (path, ...rest) => get(path, ...rest).then(d => {
      if (!String(path).startsWith("/api/vouches") || !d || !Array.isArray(d.reviews)) return d;
      const gone = d.reviews.filter(r => FAKE_VOUCHES.includes(+new Date(r.at)));
      if (!gone.length) return d;
      const reviews = d.reviews.filter(r => !gone.includes(r)), total = d.total - gone.length;
      const stars = gone.reduce((s, r) => s + r.stars, 0), average = total > 0 ? (d.reviews.length === d.total ? reviews.reduce((s, r) => s + r.stars, 0) : d.average * d.total - stars) / total : 0;
      return Object.assign({}, d, { reviews, total, average: Math.round(average * 100) / 100 });
    });
  }
  items.forEach(p => { p.steps = ticketSteps; if (!CONFIG.products.some(x => x.slug === p.slug)) { p.addon = Object.assign({ price: CONFIG.addon.price, v: CONFIG.addon.v }, p.addon); CONFIG.products.push(p); } });
  // plans with no keys left in SellApp: checkout refuses them ("maximum purchase quantity of 0"), so they show as
  // sold out. After adding keys in SellApp, take the plan off this list.
  const SOLD_OUT = { "fortnite-private": ["Day"], "r6-external": ["3 Day"], "fortnite-ai": ["3 Days"] };
  CONFIG.products.forEach(p => (p.plans || []).forEach(x => { if ((SOLD_OUT[p.slug] || []).includes(x.n)) { x.sold = true; x.stock = 0; } }));
})();
