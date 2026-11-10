import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

const bookId = new URLSearchParams(window.location.search).get("id");

async function loadRecipes() {
  const list = document.getElementById("recipe-list");
  const noRecipes = document.getElementById("no-recipes");

  try {
    const recipesSnap = await getDocs(
      query(
        collection(db, "allBooks", bookId, "recipes"),
        orderBy("createdAt", "desc")
      )
    );

    if (recipesSnap.empty) {
      noRecipes.classList.remove("d-none");
      return;
    }

    noRecipes.classList.add("d-none");

    recipesSnap.docs.forEach((recipeDoc) => {
      const recipe = recipeDoc.data();

      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";

      const title = document.createElement("h5");
      title.className = "card-title text-break";
      title.textContent = recipe.name;

      const description = document.createElement("p");
      description.className = "card-text text-truncate";
      description.textContent = recipe.description;

      const author = document.createElement("p");
      author.className = "card-subtitle text-muted small";
      author.textContent = `Added by ${recipe.authorName ?? "Unknown"}`;

      const cardBody = document.createElement("div");
      cardBody.className = "card-body";
      cardBody.appendChild(title);
      cardBody.appendChild(description);
      cardBody.appendChild(author);

      const card = document.createElement("div");
      card.className = "card";
      card.appendChild(cardBody);

      column.appendChild(card);
      list.appendChild(column);
    });
  } catch (err) {
    console.error("Error loading recipes:", err);
    noRecipes.classList.remove("d-none");
  }
}

async function loadBook(user) {
  const details = document.getElementById("book-details");
  const notFound = document.getElementById("book-not-found");

  if (!bookId) {
    notFound.classList.remove("d-none");
    return;
  }

  try {
    const bookSnap = await getDoc(doc(db, "users", user.uid, "myBooks", bookId));

    if (!bookSnap.exists()) {
      notFound.classList.remove("d-none");
      return;
    }

    const book = bookSnap.data();
    document.title = `${book.name} | Heirloom Recipes`;
    document.getElementById("book-title").textContent = book.name;
    document.getElementById("book-description").textContent = book.description;

    document.getElementById("add-recipe-btn").href =
      `create_recipe.html?bookId=${encodeURIComponent(bookId)}`;

    details.classList.remove("d-none");
    loadRecipes();
  } catch (err) {
    console.error("Error loading book:", err);
    notFound.classList.remove("d-none");
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadBook(user);
  } else {
    window.location.href = "loginSignup.html#login";
  }
});