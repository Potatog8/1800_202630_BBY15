import { joinBookByCode } from "../joinBook.js";

export function renderHeader(targetId = "site-header") {
  const target = document.getElementById(targetId);
  if (!target) return;

  const hideJoinBookPages = ["/", "/index.html"];
  const showJoinBook = !hideJoinBookPages.includes(window.location.pathname);

  const joinBookButton = showJoinBook
    ? `<button type="button" id="join-book-btn" class="btn btn-outline-light btn-lg" data-bs-toggle="modal" data-bs-target="#joinBookModal">Join Book</button>`
    : "";

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
        <div class="d-flex gap-2">
          ${joinBookButton}
          <a href="loginSignup.html#login" id="auth-btn" class="btn btn-outline-light btn-lg invisible">Log In</a>
        </div>
      </div>
    </nav>
  `;

  if (showJoinBook && !document.getElementById("joinBookModal")) {
    renderJoinBookModal();
  }
}

function renderJoinBookModal() {
  // Added to <body> so it isn't affected by the navbar's layout
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="modal fade" id="joinBookModal" tabindex="-1" aria-labelledby="joinBookModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <form id="join-book-form" novalidate>
            <div class="modal-header">
              <h5 class="modal-title" id="joinBookModalLabel">Join a Book</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <label for="join-code-input" class="form-label">Enter the 5-character join code</label>
              <input
                type="text"
                id="join-code-input"
                class="form-control form-control-lg text-center text-uppercase join-code-input"
                maxlength="5"
                autocomplete="off"
                placeholder="ABC12"
                required
              />
              <div id="join-code-feedback" class="invalid-feedback">Join codes are 5 letters or numbers.</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-warning">Join Book</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    `
  );

  const modalEl = document.getElementById("joinBookModal");
  const form = document.getElementById("join-book-form");
  const input = document.getElementById("join-code-input");
  const feedback = document.getElementById("join-code-feedback");
  const submitBtn = form.querySelector('button[type="submit"]');

  function showError(message) {
    feedback.textContent = message;
    input.classList.add("is-invalid");
  }

  // Only allow letters/numbers, always uppercase
  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    input.classList.remove("is-invalid");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = input.value;

    if (!/^[A-Z0-9]{5}$/.test(code)) {
      showError("Join codes are 5 letters or numbers.");
      return;
    }

    submitBtn.disabled = true;
    try {
      await joinBookByCode(code);
      window.location.href = "books.html";
    } catch (err) {
      const messages = {
        NOT_SIGNED_IN: "Please log in to join a book.",
        CODE_NOT_FOUND: "No book matches that code.",
        BOOK_NOT_FOUND: "That book no longer exists.",
        ALREADY_JOINED: "You're already in that book.",
      };
      showError(messages[err.message] ?? "Something went wrong. Please try again.");
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  });

  modalEl.addEventListener("shown.bs.modal", () => input.focus());
  modalEl.addEventListener("hidden.bs.modal", () => {
    form.reset();
    input.classList.remove("is-invalid");
    feedback.textContent = "Join codes are 5 letters or numbers.";
  });
}