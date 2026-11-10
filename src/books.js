import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

async function loadBooks(currentUser) {
  const booksRef = collection(db, "users", currentUser.uid, "myBooks");
  const booksContainer = document.getElementById("recipeResults");
  const booksSnapshot = await getDocs(booksRef);

  const noResults = document.getElementById("noResults");
  if (!booksSnapshot.empty) {
    noResults.classList.add("d-none");
  }

  booksSnapshot.docs.forEach((book) => {
    const data = book.data();

    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";

    // Link covers the whole card via Bootstrap's stretched-link
    const bookLink = document.createElement("a");
    bookLink.href = `book.html?id=${encodeURIComponent(book.id)}`;
    bookLink.className = "stretched-link text-decoration-none text-reset";
    bookLink.textContent = data.name;

    const bookTitle = document.createElement("h5");
    bookTitle.className = "card-title";
    bookTitle.appendChild(bookLink);

    const bookDescription = document.createElement("p");
    bookDescription.textContent = data.description;
    bookDescription.className = "card-text text-truncate";

    const joinCode = document.createElement("p");
    joinCode.textContent = `Join code: ${data.joinCode}`;
    joinCode.className = "card-subtitle text-muted small";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.appendChild(bookTitle);
    cardBody.appendChild(bookDescription);
    cardBody.appendChild(joinCode);

    const card = document.createElement("div");
    card.className = "card book-card";
    card.appendChild(cardBody);

    column.appendChild(card);
    booksContainer.appendChild(column);
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadBooks(user);
  }
});
