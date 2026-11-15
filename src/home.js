import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

const RECENT_COUNT = 3;

function toMillis(timestamp) {
  return timestamp?.toMillis?.() ?? 0;
}

// Last opened, falling back to when the book was joined or created
function lastTouched(book) {
  return (
    toMillis(book.lastAccessedAt) ||
    toMillis(book.joinedAt) ||
    toMillis(book.createdAt)
  );
}

function getRecentBooks(bookDocs) {
  return bookDocs
    .map((bookDoc) => ({ ...bookDoc.data(), id: bookDoc.id }))
    .sort((a, b) => lastTouched(b) - lastTouched(a))
    .slice(0, RECENT_COUNT);
}

async function getRecentRecipes(bookDocs) {
  // Grab the newest few recipes from each book, then merge and trim
  const perBook = await Promise.all(
    bookDocs.map(async (bookDoc) => {
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
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, RECENT_COUNT);
}

function renderBooks(books) {
  const container = document.getElementById("recent-books");
  const noBooks = document.getElementById("no-recent-books");

  if (books.length === 0) {
    noBooks.classList.remove("d-none");
    return;
  }

  books.forEach((book) => {
    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";

    // Link covers the whole card via Bootstrap's stretched-link
    const link = document.createElement("a");
    link.href = `book.html?id=${encodeURIComponent(book.id)}`;
    link.className = "stretched-link text-decoration-none text-reset";
    link.textContent = book.name;

    const title = document.createElement("h5");
    title.className = "card-title text-break";
    title.appendChild(link);

    const description = document.createElement("p");
    description.className = "card-text text-truncate";
    description.textContent = book.description;

    const role = document.createElement("p");
    role.className = "card-subtitle text-muted small";
    role.textContent = book.role === "owner" ? "Owner" : "Member";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.appendChild(title);
    cardBody.appendChild(description);
    cardBody.appendChild(role);

    const card = document.createElement("div");
    card.className = "card h-100 book-card";
    card.appendChild(cardBody);

    column.appendChild(card);
    container.appendChild(column);
  });
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

    // Link covers the whole card via Bootstrap's stretched-link
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
    const booksSnap = await getDocs(
      collection(db, "users", user.uid, "myBooks")
    );

    renderBooks(getRecentBooks(booksSnap.docs));
    renderRecipes(await getRecentRecipes(booksSnap.docs));
  } catch (err) {
    console.error("Error loading home page:", err);
    document.getElementById("no-recent-books").classList.remove("d-none");
    document.getElementById("no-recent-recipes").classList.remove("d-none");
  }
});