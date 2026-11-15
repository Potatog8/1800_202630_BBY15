import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

const RECENT_COUNT = 3;

async function getRecentRecipes(user) {
  const booksSnap = await getDocs(
    collection(db, "users", user.uid, "myBooks")
  );

  // Grab the newest few recipes from each book, then merge and trim
  const perBook = await Promise.all(
    booksSnap.docs.map(async (bookDoc) => {
      try {
        const recipesSnap = await getDocs(
          query(
            collection(db, "allBooks", bookDoc.id, "recipes"),
            orderBy("createdAt", "desc"),
            limit(RECENT_COUNT)
          )
        );

        return recipesSnap.docs.map((recipeDoc) => ({
          ...recipeDoc.data(),
          id: recipeDoc.id,
          bookId: bookDoc.id,
          bookName: bookDoc.data().name,
        }));
      } catch (err) {
        console.error(`Error loading recipes for book ${bookDoc.id}:`, err);
        return [];
      }
    })
  );

  return perBook
    .flat()
    .sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
    )
    .slice(0, RECENT_COUNT);
}

function renderRecipes(recipes) {
  const container = document.getElementById("recent-recipes");
  const noRecipes = document.getElementById("no-recent-recipes");

  if (recipes.length === 0) {
    noRecipes.classList.remove("d-none");
    return;
  }

  recipes.forEach((recipe) => {
    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";

    const link = document.createElement("a");
    link.href = `recipe.html?bookId=${encodeURIComponent(recipe.bookId)}&id=${encodeURIComponent(recipe.id)}`;
    link.className = "stretched-link text-decoration-none text-reset";
    link.textContent = recipe.name;

    const title = document.createElement("h5");
    title.className = "card-title text-break";
    title.appendChild(link);

    const description = document.createElement("p");
    description.className = "card-text text-truncate";
    description.textContent = recipe.description;

    const bookLine = document.createElement("p");
    bookLine.className = "card-subtitle text-muted small mb-1";
    bookLine.textContent = `In ${recipe.bookName ?? "Unknown book"}`;

    const author = document.createElement("p");
    author.className = "card-subtitle text-muted small";
    author.textContent = `Added by ${recipe.authorName ?? "Unknown"}`;

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.appendChild(title);
    cardBody.appendChild(description);
    cardBody.appendChild(bookLine);
    cardBody.appendChild(author);

    const card = document.createElement("div");
    card.className = "card h-100 book-card";
    card.appendChild(cardBody);

    column.appendChild(card);
    container.appendChild(column);
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return; // main.js redirects logged-out users

  try {
    renderRecipes(await getRecentRecipes(user));
  } catch (err) {
    console.error("Error loading recent recipes:", err);
    document.getElementById("no-recent-recipes").classList.remove("d-none");
  }
});