import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createFavoriteButton, isFavorited } from "./favoriteButton.js";
import { createRecipeImage } from "./recipeImage.js";

const params = new URLSearchParams(window.location.search);
const bookId = params.get("bookId");
const recipeId = params.get("id");

const details = document.getElementById("recipe-details");
const notFound = document.getElementById("recipe-not-found");

if (bookId) {
  document.getElementById("back-link").href =
    `book.html?id=${encodeURIComponent(bookId)}`;
}

async function loadRecipe(user) {
  if (!bookId || !recipeId) {
    notFound.classList.remove("d-none");
    return;
  }

  try {
    const recipeSnap = await getDoc(
      doc(db, "allBooks", bookId, "recipes", recipeId),
    );

    if (!recipeSnap.exists()) {
      notFound.classList.remove("d-none");
      return;
    }

    const recipe = recipeSnap.data();
    document.title = `${recipe.name} | Heirloom Recipes`;

    document.getElementById("recipe-title").textContent = recipe.name;
    document.getElementById("recipe-description").textContent =
      recipe.description;
    document.getElementById("recipe-origin").textContent = recipe.origin;
    document.getElementById("recipe-ingredients").textContent =
      recipe.ingredients;
    document.getElementById("recipe-instructions").textContent =
      recipe.instructions;

    const addedOn = recipe.createdAt?.toDate().toLocaleDateString();
    document.getElementById("recipe-meta").textContent =
      `Added by ${recipe.authorName ?? "Unknown"}` +
      (addedOn ? ` on ${addedOn}` : "");

    document.getElementById("favorite-btn-container").replaceChildren(
      createFavoriteButton(
        {
          id: recipeId,
          bookId,
          name: recipe.name,
          description: recipe.description,
          authorName: recipe.authorName,
          imageData: recipe.imageData,
        },
        await isFavorited(user, recipeId),
      ),
    );

    document
      .getElementById("recipe-image-container")
      .replaceChildren(
        createRecipeImage(recipe.imageData, recipe.name, "recipe-image-lg"),
      );

    details.classList.remove("d-none");
  } catch (err) {
    // Also covers permission-denied when the user isn't a member of the book
    console.error("Error loading recipe:", err);
    notFound.classList.remove("d-none");
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadRecipe(user); // main.js redirects logged-out users
  }
});
