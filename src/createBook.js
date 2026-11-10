import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getUsername } from "./joinBook.js";

const form = document.getElementById("book-form");
let currentUser = null;

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 5;
const MAX_ATTEMPTS = 10;

function generateJoinCode() {
  const randomValues = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (n) => CODE_CHARS[n % CODE_CHARS.length]).join("");
}

async function saveBookWithUniqueCode(book) {
  const allBookRef = doc(collection(db, "allBooks"));
  const myBookRef = doc(db, "users", currentUser.uid, "myBooks", allBookRef.id);
  const memberRef = doc(db, "allBooks", allBookRef.id, "members", currentUser.uid);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const joinCode = generateJoinCode();
    const codeRef = doc(db, "joinCodes", joinCode);

    try {
      await runTransaction(db, async (transaction) => {
        const codeSnap = await transaction.get(codeRef);
        if (codeSnap.exists()) {
          throw new Error("CODE_TAKEN");
        }

        const bookData = { ...book, joinCode };

        transaction.set(codeRef, {
          bookId: allBookRef.id,
          ownerId: currentUser.uid,
        });
        transaction.set(allBookRef, bookData);
        transaction.set(myBookRef, { ...bookData, role: "owner" });
        transaction.set(memberRef, {
          uid: currentUser.uid,
          username: getUsername(currentUser),
          role: "owner",
          joinedAt: serverTimestamp(),
        });
      });
      return joinCode; // success
    } catch (err) {
      if (err.message !== "CODE_TAKEN") throw err; // real error
      // code was taken, loop and try a new one
    }
  }

  throw new Error("Could not generate a unique join code.");
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    window.location.href = "loginSignup.html#login";
  }
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const book = {
    name: document.getElementById("book-name").value.trim(),
    description: document.getElementById("book-description").value.trim(),
    ownerId: currentUser.uid,
    createdAt: serverTimestamp(),
  };

  try {
    await saveBookWithUniqueCode(book);
    form.reset();
    window.location.href = "books.html";
  } catch (err) {
    console.error("Error saving book:", err);
    alert("Could not save your book. Please try again.");
  }
});