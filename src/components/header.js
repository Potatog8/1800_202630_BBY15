export function renderHeader(targetId = "site-header") {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = `
    <nav class="navbar logo_header">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">
          <img
            src="images/Heirloom Recipes Logo.png"
            alt="Logo"
            width="100"
            height="100"
          />
        </a>
        <a href="loginSignup.html#login" id="auth-btn" class="btn btn-outline-light btn-lg invisible">Log In</a>
      </div>
    </nav>
  `;
}