import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { createFavoriteButton, getFavoriteIds } from "./favoriteButton.js";

const bookId = new URLSearchParams(window.location.search).get("id");

async function loadRecipes(user) {
  const list = document.getElementById("recipe-list");
  const noRecipes = document.getElementById("no-recipes");

  try {
    const [recipesSnap, favoriteIds] = await Promise.all([
      getDocs(
        query(
          collection(db, "allBooks", bookId, "recipes"),
          orderBy("createdAt", "desc")
        )
      ),
      getFavoriteIds(user),
    ]);

    if (recipesSnap.empty) {
      noRecipes.classList.remove("d-none");
      return;
    }

    noRecipes.classList.add("d-none");

    recipesSnap.docs.forEach((recipeDoc) => {
      const recipe = recipeDoc.data();

      const column = document.createElement("div");
      column.className = "col-12 col-md-6 col-lg-4";

      const link = document.createElement("a");
      link.href = `recipe.html?bookId=${encodeURIComponent(bookId)}&id=${encodeURIComponent(recipeDoc.id)}`;
      link.className = "stretched-link text-decoration-none text-reset";
      link.textContent = recipe.name;

      const title = document.createElement("h5");
      title.className = "card-title text-break";
      title.appendChild(link);

      const favoriteBtn = createFavoriteButton(
        {
          id: recipeDoc.id,
          bookId,
          name: recipe.name,
          description: recipe.description,
          authorName: recipe.authorName,
        },
        favoriteIds.has(recipeDoc.id)
      );

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
      card.className = "card book-card";
      card.appendChild(cardBody);

      column.appendChild(card);
      list.appendChild(column);
    });
  } catch (err) {
    console.error("Error loading recipes:", err);
    noRecipes.classList.remove("d-none");
  }
}

async function loadMembers() {
  const list = document.getElementById("members-list");
  const message = document.getElementById("members-message");

  list.replaceChildren();
  message.classList.add("d-none");

  if (!bookId) return;

  try {
    const membersSnap = await getDocs(
      collection(db, "allBooks", bookId, "members"),
    );

    // Owner first, then by who joined earliest
    const members = membersSnap.docs
      .map((memberDoc) => memberDoc.data())
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
        return (a.joinedAt?.toMillis() ?? 0) - (b.joinedAt?.toMillis() ?? 0);
      });

    if (members.length === 0) {
      message.textContent = "No members found.";
      message.classList.remove("d-none");
      return;
    }

    members.forEach((member) => {
      const name = document.createElement("span");
      name.className = "text-break";
      name.textContent = member.username ?? "Unknown user";

      const role = document.createElement("span");
      const isOwner = member.role === "owner";
      role.className = `badge ${isOwner ? "text-bg-warning" : "text-bg-secondary"}`;
      role.textContent = isOwner ? "Owner" : "Member";

      const item = document.createElement("li");
      item.className =
        "list-group-item d-flex justify-content-between align-items-center gap-2";
      item.appendChild(name);
      item.appendChild(role);

      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading members:", err);
    message.textContent = "Could not load members. Please try again.";
    message.classList.remove("d-none");
  }
}

// Reload the list every time the modal opens so it's always current
document
  .getElementById("membersModal")
  .addEventListener("show.bs.modal", loadMembers);

async function loadBook(user) {
  const details = document.getElementById("book-details");
  const notFound = document.getElementById("book-not-found");

  if (!bookId) {
    notFound.classList.remove("d-none");
    return;
  }

  try {
    const bookSnap = await getDoc(
      doc(db, "users", user.uid, "myBooks", bookId),
    );

    if (!bookSnap.exists()) {
      notFound.classList.remove("d-none");
      return;
    }

    // Remember when this book was last opened (used for "recently opened" on home)
    updateDoc(doc(db, "users", user.uid, "myBooks", bookId), {
      lastAccessedAt: serverTimestamp(),
    }).catch((err) => console.error("Error updating last accessed:", err));

    const book = bookSnap.data();
    document.title = `${book.name} | Heirloom Recipes`;
    document.getElementById("book-title").textContent = book.name;
    document.getElementById("book-description").textContent = book.description;

    document.getElementById("add-recipe-btn").href =
      `create_recipe.html?bookId=${encodeURIComponent(bookId)}`;

    details.classList.remove("d-none");
    loadRecipes(user);
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
