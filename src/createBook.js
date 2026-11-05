import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const form = document.getElementById("book-form");
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

  const book = {
    name: document.getElementById("book-name").value.trim(),
    description: document.getElementById("book-description").value.trim(),
    createdAt: serverTimestamp(),
  };

  try {
    await addDoc(
      collection(db, "users", currentUser.uid, "createdBooks"),
      book
    );
    form.reset();
    window.location.href = "books.html";
  } catch (err) {
    console.error("Error saving book:", err);
    alert("Could not save your book. Please try again.");
  }
});