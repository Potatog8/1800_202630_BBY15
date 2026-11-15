import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { renderHeader } from "./components/header.js";
import { renderBottomNav } from "./components/bottomNav.js";

const publicPages = ['/', '/index.html', '/loginSignup.html'];
const hideHeaderPages = ['/loginSignup.html'];
const hideBottomNavPages = ['/', '/loginSignup.html', '/index.html'];
const currentPath = window.location.pathname;
const isPublicPage = publicPages.includes(currentPath);

// Hide protected pages until we know the user is logged in (styled in style.css)
if (!isPublicPage) {
  document.documentElement.classList.add('auth-pending');
}

if (!hideHeaderPages.includes(currentPath)) {
  renderHeader();
}

if (!hideBottomNavPages.includes(currentPath)) {
  renderBottomNav();
}

const authBtn = document.getElementById("auth-btn");
let signingOut = false;

onAuthStateChanged(auth, (user) => {
  if (!isPublicPage) {
    if (!user) {
      if (!signingOut) {
        window.location.replace("loginSignup.html#login");
      }
      return;
    }
    document.documentElement.classList.remove('auth-pending');
  }

  if (!authBtn) return;

  if (user) {
    authBtn.textContent = "Sign Out";
    authBtn.href = "#";
    authBtn.onclick = async (e) => {
      e.preventDefault();
      signingOut = true;
      await signOut(auth);
      window.location.href = "index.html";
    };
  } else {
    authBtn.textContent = "Log In";
    authBtn.href = "loginSignup.html#login";
    authBtn.onclick = null;
  }

  authBtn.classList.remove("invisible");
});