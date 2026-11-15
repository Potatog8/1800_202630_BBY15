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
import { resizeImage } from "./recipeImage.js";

const form = document.getElementById("recipe-form");
const imageInput = document.getElementById("recipe-image");
const imagePreview = document.getElementById("image-preview");
const submitBtn = form?.querySelector('button[type="submit"]');
const bookId = new URLSearchParams(window.location.search).get("bookId");
let currentUser = null;
let imageData = "";

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    window.location.href = "loginSignup.html#login";
  }
});

imageInput?.addEventListener("change", async () => {
  const file = imageInput.files[0];
  imageData = "";
  imagePreview.classList.add("d-none");
  if (!file) return;

  // Block saving until the image has finished processing
  submitBtn.disabled = true;
  try {
    imageData = await resizeImage(file);
    imagePreview.src = imageData;
    imagePreview.classList.remove("d-none");
  } catch (err) {
    console.error("Error processing image:", err);
    imageInput.value = "";
    alert("Could not use that image. Please try a different one.");
  } finally {
    submitBtn.disabled = false;
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
    imageData,
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