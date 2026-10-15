const links = [
  { label: "Home", href: "home.html" },
  { label: "Favorites", href: "#" },
  { label: "Collections", href: "#" },
  { label: "Profile", href: "#" },
];

export function renderBottomNav(targetId = "site-nav") {
  const target = document.getElementById(targetId);
  if (!target) return;

  const current = window.location.pathname.split("/").pop() || "index.html";

  const items = links
    .map(
      ({ label, href }) => `
        <li class="nav-item">
          <a class="nav-link${current === href ? " active fw-bold" : ""}" href="${href}">${label}</a>
        </li>`
    )
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