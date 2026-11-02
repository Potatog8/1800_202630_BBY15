import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { renderHeader } from "./components/header.js";
import { renderBottomNav } from "./components/bottomNav.js";

const excludedPages = ['/', '/loginSignup.html'];
const currentPath = window.location.pathname;

if (!excludedPages.includes(currentPath)) {
  renderHeader();
  renderBottomNav();
}



const authBtn = document.getElementById("auth-btn");

onAuthStateChanged(auth, (user) => {
  if (!authBtn) return;

  if (user) {
    authBtn.textContent = "Sign Out";
    authBtn.href = "#";
    authBtn.onclick = async (e) => {
      e.preventDefault();
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