import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { createFavoriteButton } from "./favoriteButton.js";
import { createRecipeImage } from "./recipeImage.js";

const container = document.getElementById("favoriteRecipesContainer");
const noFavorites = document.getElementById("no-favorites");

const DELETED = "deleted";

function showEmptyIfNeeded() {
  if (container.children.length === 0) {
    noFavorites.classList.remove("d-none");
  }
}

// Current recipe data, DELETED if the recipe is gone, or null if it can't be loaded
async function getLiveRecipe(favoriteId, favorite) {
  try {
    const recipeSnap = await getDoc(
      doc(db, "allBooks", favorite.bookId, "recipes", favoriteId)
    );
    return recipeSnap.exists() ? recipeSnap.data() : DELETED;
  } catch (err) {
    console.error("Error loading favorite recipe:", err);
    return null;
  }
}

async function loadFavorites(user) {
  try {
    const favoritesSnap = await getDocs(
      query(
        collection(db, "users", user.uid, "favorites"),
        orderBy("favoritedAt", "desc")
      )
    );

    const liveRecipes = await Promise.all(
      favoritesSnap.docs.map((favoriteDoc) =>
        getLiveRecipe(favoriteDoc.id, favoriteDoc.data())
      )
    );

    favoritesSnap.docs.forEach((favoriteDoc, index) => {
      const saved = favoriteDoc.data();
      const live = liveRecipes[index];

      // The recipe was deleted: skip it and tidy up this favorite
      if (live === DELETED) {
        deleteDoc(favoriteDoc.ref).catch((err) =>
          console.error("Error removing deleted favorite:", err)
        );
        return;
      }

      const recipe = {
        id: favoriteDoc.id,
        bookId: saved.bookId,
        name: live?.name ?? saved.name,
        description: live?.description ?? saved.description,
        authorName: live?.authorName ?? saved.authorName,
        imageData: live ? live.imageData : saved.imageData,
      };

      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";

      const image = createRecipeImage(
        recipe.imageData,
        recipe.name,
        "card-img-top"
      );

      const link = document.createElement("a");
      link.href = `recipe.html?bookId=${encodeURIComponent(recipe.bookId)}&id=${encodeURIComponent(recipe.id)}`;
      link.className = "stretched-link text-decoration-none text-reset";
      link.textContent = recipe.name;

      const title = document.createElement("h5");
      title.className = "card-title text-break";
      title.appendChild(link);

      // Un-favoriting here removes the card straight away
      const favoriteBtn = createFavoriteButton(recipe, true, (isFavorite) => {
        if (!isFavorite) {
          column.remove();
          showEmptyIfNeeded();
        }
      });

      const header = document.createElement("div");
      header.className = "d-flex justify-content-between align-items-start gap-2";
      header.appendChild(title);
      header.appendChild(favoriteBtn);

      const description = document.createElement("p");
      description.className = "card-text text-truncate";
      description.textContent = recipe.description;

      const author = document.createElement("p");
      author.className = "card-subtitle text-muted small";
      author.textContent = `Added by ${recipe.authorName ?? "Unknown"}`;

      const cardBody = document.createElement("div");
      cardBody.className = "card-body";
      cardBody.appendChild(header);
      cardBody.appendChild(description);
      cardBody.appendChild(author);

      const card = document.createElement("div");
      card.className = "card h-100 book-card";
      card.appendChild(image);
      card.appendChild(cardBody);

      column.appendChild(card);
      container.appendChild(column);
    });

    showEmptyIfNeeded();
  } catch (err) {
    console.error("Error loading favorites:", err);
    noFavorites.classList.remove("d-none");
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadFavorites(user); // main.js redirects logged-out users
  }
});