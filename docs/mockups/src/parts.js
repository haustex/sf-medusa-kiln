// Shared header/footer for the static mockups (the real theme renders these as React server components).
const I = {
  search: '<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  heart: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z"/></svg>',
  bag: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  user: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
  menu: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  arrow: '<svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  chev: '<svg class="icon" viewBox="0 0 24 24" style="width:18px;height:18px"><path d="m6 9 6 6 6-6"/></svg>',
  star: '<svg viewBox="0 0 20 20" style="width:14px;height:14px;fill:#0c0c0c"><path d="m10 1.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5Z"/></svg>',
};
const CATS = ["All", "Cutting boards", "Trays", "Bowls", "Ceramics", "Textiles", "Furniture", "Journal"];
const header = (active = "") => `
<header class="header frost">
  <div class="container">
    <div class="header-row desktop-only">
      <a class="wordmark" href="#"><i></i>Nord Atelier</a>
      <div class="header-search"><div class="field">${I.search}<span>Search boards, bowls, makers…</span></div></div>
      <div class="header-actions">
        <a href="#">${I.user}Sign in</a>
        <a href="#" aria-label="Wishlist">${I.heart}</a>
        <a href="#">${I.bag}<span class="count">2</span></a>
      </div>
    </div>
    <nav class="nav-row desktop-only" aria-label="Categories">
      ${CATS.map((c) => `<a href="#" class="${c === active ? "on" : ""}">${c}</a>`).join("")}
      <span class="spacer"></span><a href="#">Makers</a><a href="#">Custom orders</a>
    </nav>
    <div class="header-row mobile-only">
      <button class="btn btn-icon" style="background:none;border:0" aria-label="Menu">${I.menu}</button>
      <a class="wordmark" href="#"><i></i>Nord Atelier</a>
      <div class="header-actions"><a href="#" aria-label="Account">${I.user}</a><a href="#">${I.bag}<span class="count">2</span></a></div>
    </div>
    <div class="m-search mobile-only"><div class="field" style="flex:1">${I.search}<span>Search boards, bowls, makers…</span></div></div>
    <div class="m-cats mobile-only">${CATS.map((c) => `<span class="chip ${c === active ? "on" : ""}">${c}</span>`).join("")}</div>
  </div>
</header>`;
const footer = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div><a class="wordmark" href="#"><i></i>Nord Atelier</a><p class="muted t-small" style="max-width:34ch;margin:12px 0 0">Small-batch objects for the home, made by independent makers. Every piece ships from the workshop that made it.</p></div>
      <div><h4>Shop</h4><ul><li>Cutting boards</li><li>Trays</li><li>Bowls</li><li>Ceramics</li><li>Textiles</li><li>Furniture</li></ul></div>
      <div><h4>Help</h4><ul><li>Shipping</li><li>Track an order</li><li>Returns</li><li>Contact</li><li>Custom orders</li></ul></div>
      <div><h4>Studio</h4><ul><li>About</li><li>Makers</li><li>Journal</li><li>Privacy</li><li>Terms</li></ul></div>
    </div>
    <div class="footer-bottom"><span>© 2026 Nord Atelier · Ships worldwide from Jepara, Indonesia</span><span>Built by Haus Kayu · Kiln theme for Medusa</span></div>
  </div>
</footer>`;
const stars = (avg, n) => `<span class="stars">${I.star}<b>${avg}</b><span>(${n})</span></span>`;
const card = (p, i) => `
<article class="card">
  <a href="#" class="ph sq ${["", "v2", "v3", "v4"][i % 4]}"></a>
  ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
  <button class="heart" aria-label="Save">${I.heart}</button>
  <div><div class="maker">${p.maker}</div><div class="title">${p.title}</div></div>
  <div class="meta"><span class="t-price">${p.price}</span>${stars(p.rating, p.count)}</div>
</article>`;
window.K = { I, header, footer, card, stars };
document.querySelectorAll("[data-part]").forEach((el) => {
  const [name, arg] = el.dataset.part.split(":");
  el.outerHTML = name === "header" ? header(arg) : footer;
});
