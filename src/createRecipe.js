import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const form = document.getElementById("recipe-form");
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    window.location.href = "loginSignup.html#login";
  }
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const recipe = {
    name: document.getElementById("recipe-name").value.trim(),
    description: document.getElementById("description").value.trim(),
    origin: document.getElementById("origin").value.trim(),
    ingredients: document.getElementById("ingredients").value.trim(),
    instructions: document.getElementById("instructions").value.trim(),
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(
      collection(db, "users", currentUser.uid, "createdRecipes"),
      recipe
    );
    form.reset();
    window.location.href = "home.html";
  } catch (err) {
    console.error("Error saving recipe:", err);
    alert("Could not save your recipe. Please try again.");
  }
});