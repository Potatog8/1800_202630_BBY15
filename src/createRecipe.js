import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getUsername } from "./joinBook.js";
import { resizeImage } from "./recipeImage.js";

const form = document.getElementById("recipe-form");
const pageTitle = document.getElementById("page-title");
const imageInput = document.getElementById("recipe-image");
const imagePreview = document.getElementById("image-preview");
const removeImageBtn = document.getElementById("remove-image-btn");
const submitBtn = form?.querySelector('button[type="submit"]');

const params = new URLSearchParams(window.location.search);
const bookId = params.get("bookId");
const recipeId = params.get("id"); // only present when editing
const isEditing = Boolean(bookId && recipeId);

const recipePageUrl = `recipe.html?bookId=${encodeURIComponent(bookId)}&id=${encodeURIComponent(recipeId)}`;

let currentUser = null;
let imageData = "";
let originalRecipe = null;
let formReady = !isEditing; // when editing, wait until the recipe has loaded

if (isEditing) {
  document.title = "Edit Recipe";
  pageTitle.textContent = "EDIT RECIPE";
  submitBtn.textContent = "SAVE CHANGES";
  submitBtn.disabled = true;
}

function showImage(data) {
  imageData = data;
  if (data) {
    imagePreview.src = data;
    imagePreview.classList.remove("d-none");
    removeImageBtn.classList.remove("d-none");
  } else {
    imagePreview.classList.add("d-none");
    removeImageBtn.classList.add("d-none");
    imageInput.value = "";
  }
}

async function loadRecipeForEdit(user) {
  try {
    const recipeSnap = await getDoc(
      doc(db, "allBooks", bookId, "recipes", recipeId)
    );

    if (!recipeSnap.exists() || recipeSnap.data().authorId !== user.uid) {
      alert("You can only edit recipes you added.");
      window.location.href = recipePageUrl;
      return;
    }

    originalRecipe = recipeSnap.data();

    document.getElementById("recipe-name").value = originalRecipe.name ?? "";
    document.getElementById("description").value =
      originalRecipe.description ?? "";
    document.getElementById("origin").value = originalRecipe.origin ?? "";
    document.getElementById("ingredients").value =
      originalRecipe.ingredients ?? "";
    document.getElementById("instructions").value =
      originalRecipe.instructions ?? "";
    showImage(originalRecipe.imageData ?? "");

    formReady = true;
    submitBtn.disabled = false;
  } catch (err) {
    console.error("Error loading recipe for editing:", err);
    alert("Could not load this recipe. Please try again.");
    window.location.href = "home.html";
  }
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    window.location.href = "loginSignup.html#login";
    return;
  }
  if (isEditing) {
    loadRecipeForEdit(user);
  }
});

imageInput?.addEventListener("change", async () => {
  const file = imageInput.files[0];
  if (!file) return;

  // Block saving until the image has finished processing
  submitBtn.disabled = true;
  try {
    showImage(await resizeImage(file));
  } catch (err) {
    console.error("Error processing image:", err);
    imageInput.value = "";
    alert("Could not use that image. Please try a different one.");
  } finally {
    submitBtn.disabled = !formReady;
  }
});

removeImageBtn?.addEventListener("click", () => showImage(""));

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const fields = {
    name: document.getElementById("recipe-name").value.trim(),
    description: document.getElementById("description").value.trim(),
    origin: document.getElementById("origin").value.trim(),
    ingredients: document.getElementById("ingredients").value.trim(),
    instructions: document.getElementById("instructions").value.trim(),
    imageData,
  };

  try {
    if (isEditing) {
      if (!originalRecipe) return;

      const updates = { ...fields, updatedAt: serverTimestamp() };
      const bookRecipeRef = doc(db, "allBooks", bookId, "recipes", recipeId);
      const myRecipeRef = doc(
        db,
        "users",
        currentUser.uid,
        "createdRecipes",
        recipeId
      );

      // Keep both copies of the recipe in sync
      const batch = writeBatch(db);
      batch.update(bookRecipeRef, updates);
      batch.set(myRecipeRef, { ...originalRecipe, ...updates, bookId });
      await batch.commit();

      window.location.href = recipePageUrl;
      return;
    }

    const recipe = {
      ...fields,
      authorId: currentUser.uid,
      authorName: getUsername(currentUser),
      createdAt: serverTimestamp(),
    };

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