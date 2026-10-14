/* punch - development: behaviour for /dev */
const DEV_API = "https://plasma-bot-production.up.railway.app";

// Client reviews. Add them here when you have them, for example:
// { text: "Fast delivery and exactly what I asked for.", name: "Name", role: "Client" }
const DEV_REVIEWS = [];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

$("#yr").textContent = new Date().getFullYear();

/* reviews */
(() => {
  const box = $("#reviews");
  if (!DEV_REVIEWS.length) {
    box.innerHTML = `<article class="card rev empty"><div class="st">★★★★★</div><p>Client reviews are being collected and will be listed here soon.</p><div class="who"><b>Want to be first?</b><span>Send a request and tell me how it went afterwards.</span></div></article>`;
    return;
  }
  box.innerHTML = DEV_REVIEWS.map(r => `<article class="card rev"><div class="st">★★★★★</div><p>${esc(r.text)}</p><div class="who"><b>${esc(r.name)}</b><span>${esc(r.role || "Client")}</span></div></article>`).join("");
})();

/* scroll reveal + counters */
const countUp = el => {
  const target = +el.dataset.count || 0, suffix = el.dataset.suffix || "", t0 = performance.now(), dur = 1300;
  const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(target * e) + suffix; if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  $$("[data-count]", e.target).forEach(countUp);
  io.unobserve(e.target);
}), { threshold: .12 });
$$(".reveal").forEach(el => io.observe(el));

/* live positive-review share from the Plasma store (falls back to 100) */
fetch(DEV_API + "/api/vouches").then(r => r.json()).then(d => {
  if (d && d.total) { const good = (d.distribution[3] || 0) + (d.distribution[4] || 0); $("#s3").dataset.count = Math.round(good / d.total * 100); }
}).catch(() => { });

/* nav: active link while scrolling, mobile menu */
const links = $$("#links a"), sections = links.map(a => $(a.getAttribute("href")));
const spy = () => { let cur = -1; sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; }); links.forEach((a, i) => a.classList.toggle("on", i === cur)); };
addEventListener("scroll", spy, { passive: true }); spy();
const burger = $("#burger"), nav = $("#links");
burger.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
links.forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); }));

/* request modal */
const modal = $("#modal"), msg = $("#fMsg"), form = $("#form");
const openModal = service => {
  if (service) $("#fService").value = service;
  msg.hidden = true; modal.hidden = false; document.body.style.overflow = "hidden";
  setTimeout(() => $("#fDetails").focus(), 60);
};
const closeModal = () => { modal.hidden = true; document.body.style.overflow = ""; };
$$("[data-open]").forEach(b => b.addEventListener("click", () => openModal(b.dataset.service)));
$("#mClose").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

const say = (t, ok) => { msg.hidden = false; msg.className = "fmsg " + (ok ? "ok" : "bad"); msg.textContent = t; };
form.addEventListener("submit", async e => {
  e.preventDefault();
  const body = { service: $("#fService").value, details: $("#fDetails").value.trim(), budget: $("#fBudget").value.trim(), contact: $("#fContact").value.trim(), website: $("#fHp").value };
  if (body.details.length < 10) return say("Add a few more details so I can quote it properly.", false);
  if (body.contact.length < 3) return say("Add your Discord name or an email so I can reply.", false);
  const btn = $("#fSend"); btn.disabled = true; btn.textContent = "Sending...";
  try {
    const r = await fetch(DEV_API + "/api/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Could not send. Try again.");
    say("Request sent. I will reply with a plan and a price soon.", true);
    form.reset();
    setTimeout(closeModal, 2200);
  } catch (err) { say(err.message, false); }
  finally { btn.disabled = false; btn.textContent = "Send request"; }
});
