import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { createFavoriteButton } from "./favoriteButton.js";

const container = document.getElementById("favoriteRecipesContainer");
const noFavorites = document.getElementById("no-favorites");

function showEmptyIfNeeded() {
  if (container.children.length === 0) {
    noFavorites.classList.remove("d-none");
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

    favoritesSnap.docs.forEach((favoriteDoc) => {
      const favorite = favoriteDoc.data();
      const recipe = {
        id: favoriteDoc.id,
        bookId: favorite.bookId,
        name: favorite.name,
        description: favorite.description,
        authorName: favorite.authorName,
      };

      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";

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