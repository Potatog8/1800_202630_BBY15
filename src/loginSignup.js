import { auth } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const form = document.getElementById("auth-form");
const errorBox = document.getElementById("error");
const title = document.getElementById("title");
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const nameGroup = document.getElementById("name-group");
const nameInput = document.getElementById("name");
const passwordHint = document.getElementById("password-hint");
const submitBtn = document.getElementById("submit-btn");

let mode = "login"; // "login" or "signup"

function setMode(newMode) {
  mode = newMode;
  const isSignup = mode === "signup";

  title.textContent = isSignup ? "Create your account" : "Welcome back";
  submitBtn.textContent = isSignup ? "Sign Up" : "Log In";

  nameGroup.classList.toggle("d-none", !isSignup);
  passwordHint.classList.toggle("d-none", !isSignup);
  nameInput.required = isSignup;

  tabLogin.className = isSignup ? "btn btn-outline-primary" : "btn btn-primary";
  tabSignup.className = isSignup ? "btn btn-primary" : "btn btn-outline-primary";

  errorBox.classList.add("d-none");
  history.replaceState(null, "", isSignup ? "#signup" : "#login");
}

function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

tabLogin.addEventListener("click", () => setMode("login"));
tabSignup.addEventListener("click", () => setMode("signup"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("d-none");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    if (mode === "signup") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: nameInput.value.trim() });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    window.location.href = "home.html";
  } catch (err) {
    errorBox.textContent = friendlyError(err.code);
    errorBox.classList.remove("d-none");
  }
});

// Open in the right mode based on the link used (loginSignup.html#signup)
setMode(window.location.hash === "#signup" ? "signup" : "login");