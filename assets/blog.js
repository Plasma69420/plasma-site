/* Blog: list of posts (newest first) + reading time worked out from each post's text.
   To add a post: copy blog-retrac-private.html, write the article, add an entry here. */
const POSTS = [
  {
    url: "/blog-christmas-2024",
    title: "Merry Christmas from Strive",
    tag: "News",
    date: "2026-11-12",
    cover: "/img/blog/christmas-2024.png",
    excerpt: "The holidays are here. We're celebrating with a Christmas discount on every product in the store — use code Christmas25 at checkout."
  },
  {
    url: "/blog-retrac-private",
    title: "Retrac Private is here",
    tag: "New product",
    date: "2026-11-08",
    cover: "/img/blog/retrac-private.jpg",
    excerpt: "Our first cheat for Retrac is out now. Here's what's inside the menu, what it costs and what's coming next.",
    feat: true
  }
];
const WPM = 220; // average reading speed
const readMins = text => Math.max(1, Math.round(String(text).trim().split(/\s+/).filter(Boolean).length / WPM));
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// post page: fill in "x min read" from the article itself
(() => {
  const body = document.querySelector(".post-body"), out = document.getElementById("readTime");
  if (body && out) out.textContent = readMins(body.innerText) + " min read";
})();

// blog index: render cards, then fetch each post to count its words
(() => {
  const grid = document.getElementById("posts"); if (!grid) return;
  grid.innerHTML = POSTS.map((p, i) => `<a class="bl-card${p.feat ? " feat" : ""}" href="${p.url}">
    <div class="bl-img"><img src="${p.cover}" alt="${esc(p.title)}"></div>
    <div class="bl-txt"><div class="bl-meta"><span class="bl-tag">${esc(p.tag)}</span><span>${fmtDate(p.date)}</span><span class="bl-rt" data-u="${p.url}">… min read</span></div>
    <h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p><span class="bl-more">Read post <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div></a>`).join("");
  grid.querySelectorAll(".bl-rt").forEach(async el => {
    try {
      const html = await (await fetch(el.dataset.u)).text();
      const doc = new DOMParser().parseFromString(html, "text/html"), body = doc.querySelector(".post-body");
      el.textContent = body ? readMins(body.textContent) + " min read" : "";
    } catch { el.textContent = ""; }
  });
})();
