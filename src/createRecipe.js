import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getUsername } from "./joinBook.js";

const form = document.getElementById("recipe-form");
const bookId = new URLSearchParams(window.location.search).get("bookId");
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
    authorId: currentUser.uid,
    authorName: getUsername(currentUser),
    createdAt: serverTimestamp(),
  };

  try {
    if (bookId) {
      // Same ID in both places so they always match
      const bookRecipeRef = doc(collection(db, "allBooks", bookId, "recipes"));
      const myRecipeRef = doc(
        db,
        "users",
        currentUser.uid,
        "createdRecipes",
        bookRecipeRef.id
      );

      const batch = writeBatch(db);
      batch.set(bookRecipeRef, { ...recipe, bookId });
      batch.set(myRecipeRef, { ...recipe, bookId });
      await batch.commit();

      form.reset();
      window.location.href = `book.html?id=${encodeURIComponent(bookId)}`;
    } else {
      // Opened without a book (e.g. from somewhere else): save to the user only
      await addDoc(
        collection(db, "users", currentUser.uid, "createdRecipes"),
        recipe
      );
      form.reset();
      window.location.href = "home.html";
    }
  } catch (err) {
    console.error("Error saving recipe:", err);
    alert("Could not save your recipe. Please try again.");
  }
});