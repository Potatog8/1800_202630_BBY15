const links = [
  { label: "Home", href: "home.html", icon: "home" },
  { label: "Books", href: "books.html", icon: "books" },
  { label: "Favorites", href: "favorites.html", icon: "favorites" },
  { label: "Profile", href: "profile.html", icon: "profile" },
];

export function renderBottomNav(targetId = "site-nav") {
  const target = document.getElementById(targetId);
  if (!target) return;

  const current = window.location.pathname.split("/").pop() || "index.html";

  const items = links
    .map(({ label, href, icon }) => {
      const isActive = current === href;
      const iconSrc = `images/${icon}-${isActive ? "orange" : "white"}.png`;

      return `
        <li class="nav-item">
          <a class="nav-link bottom-nav-link${isActive ? " active fw-bold" : ""}" href="${href}">
            <img src="${iconSrc}" alt="" class="bottom-nav-icon" />
            <span>${label}</span>
          </a>
        </li>`;
    })
    .join("");

  target.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-bottom">
      <div class="container-fluid">
        <ul class="navbar-nav flex-row w-100 justify-content-around">
          ${items}
        </ul>
      </div>
    </nav>
  `;
}