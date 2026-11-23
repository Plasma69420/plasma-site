/* Products that are announced but not released yet. Loaded right after /assets/site.js (see nx-boot.js), before any page
   script runs, so every page (store, status, search, product pages) sees them in CONFIG.products.
   They use the same "dev: true" setup as Roblox External: status "In development", no checkout. Their single plan has
   no price and no SellApp variant (v: null), so the page offers "Open a ticket" instead of a Buy button; nx-layout.js
   shows "Coming soon" where a price would be.
   To release one: give it real plans with SellApp variant ids (v) and remove `dev: true`. */
(() => {
  if (typeof CONFIG === "undefined" || !CONFIG.products) return;
  const soon = [
    {
      slug: "chest-cheat", name: "Chest Cheat", type: "Private", game: "Fortnite", img: "/local/cards/box-chest-cheat.webp", dev: true,
      desc: "Chest Cheat for Fortnite. Coming soon.",
      features: ["In development", "Details and release date announced in our Discord", "Instant key delivery and support like every Strive product"],
      details: "Chest Cheat for Fortnite is in development. Pricing, features and the release date will be announced in our Discord, and this page will update when it is ready.",
      groups: [["Coming soon", ["In development right now", "Release date announced in our Discord", "Instant key delivery once it launches", "Same Discord support as every Strive product"]]],
      os: "Windows 10/11",
      plans: [{ n: "Coming soon", p: 0, v: null }]
    },
    {
      slug: "rob-run", name: "Rob Run", type: "Private", game: "Rob Run", img: "/local/cards/box-rob-run.webp", dev: true,
      desc: "Rob Run (Steam) tool. Coming soon.",
      features: ["In development", "Details and release date announced in our Discord", "Instant key delivery and support like every Strive product"],
      details: "Our Rob Run tool is in development. Rob Run is a multiplayer crime game on Steam. Pricing, features and the release date will be announced in our Discord, and this page will update when it is ready.",
      groups: [["Coming soon", ["In development right now", "Release date announced in our Discord", "Instant key delivery once it launches", "Same Discord support as every Strive product"]]],
      os: "Windows 10/11",
      plans: [{ n: "Coming soon", p: 0, v: null }]
    }
  ];
  // site.js gives every product its add-on (AnyDesk support) when it loads, before these exist: do the same here
  soon.forEach(p => { if (!CONFIG.products.some(x => x.slug === p.slug)) { p.addon = Object.assign({ price: CONFIG.addon.price, v: CONFIG.addon.v }, p.addon); CONFIG.products.push(p); } });
})();
