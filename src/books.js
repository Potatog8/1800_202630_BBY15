import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

async function loadBooks(currentUser) {
  const booksRef = collection(db, "users", currentUser.uid, "createdBooks");
  const booksContainer = document.getElementById("recipeResults");
  const booksSnapshot = await getDocs(booksRef);

  const noResults = document.getElementById("noResults");
  if (!booksSnapshot.empty) {
    noResults.classList.add("d-none");
  }

  booksSnapshot.docs.forEach((book) => {
    console.log(book.data());

    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";

    const bookTitle = document.createElement("h5");
    bookTitle.textContent = book.data().name;
    bookTitle.className = "card-title";

    const card = document.createElement("div");
    card.className = "card";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";
    cardBody.appendChild(bookTitle);
    card.appendChild(cardBody);

    const bookDescription = document.createElement("p");
    bookDescription.textContent = book.data().description;
    bookDescription.className = "card-text";
    cardBody.appendChild(bookDescription);

    column.appendChild(card);
    booksContainer.appendChild(column);
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadBooks(user);
  }
});
