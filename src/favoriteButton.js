import { auth, db } from "./firebaseConfig.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const ICON_EMPTY = "images/bookmark_empty.png";
const ICON_FILLED = "images/bookmark_yellow_filled.png";

// IDs of every recipe the user has favorited
export async function getFavoriteIds(user) {
  try {
    const snap = await getDocs(collection(db, "users", user.uid, "favorites"));
    return new Set(snap.docs.map((favoriteDoc) => favoriteDoc.id));
  } catch (err) {
    console.error("Error loading favorites:", err);
    return new Set();
  }
}

export async function isFavorited(user, recipeId) {
  try {
    const snap = await getDoc(doc(db, "users", user.uid, "favorites", recipeId));
    return snap.exists();
  } catch (err) {
    console.error("Error checking favorite:", err);
    return false;
  }
}

// recipe needs: id, bookId, name, description, authorName
export function createFavoriteButton(recipe, isFavorite = false, onChange) {
  let favorited = isFavorite;

  const icon = document.createElement("img");
  icon.alt = "";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-btn";
  button.appendChild(icon);

  function render() {
    const label = favorited ? "Remove from favorites" : "Add to favorites";
    icon.src = favorited ? ICON_FILLED : ICON_EMPTY;
    button.setAttribute("aria-pressed", String(favorited));
    button.setAttribute("aria-label", label);
    button.title = label;
  }
  render();

  button.addEventListener("click", async (e) => {
    // Cards are wrapped in a stretched link, so don't let the click navigate
    e.preventDefault();
    e.stopPropagation();

    const user = auth.currentUser;
    if (!user) return;

    button.disabled = true;
    const favoriteRef = doc(db, "users", user.uid, "favorites", recipe.id);

    try {
      if (favorited) {
        await deleteDoc(favoriteRef);
      } else {
        await setDoc(favoriteRef, {
          recipeId: recipe.id,
          bookId: recipe.bookId,
          name: recipe.name,
          description: recipe.description ?? "",
          authorName: recipe.authorName ?? "Unknown",
          favoritedAt: serverTimestamp(),
        });
      }
      favorited = !favorited;
      render();
      onChange?.(favorited);
    } catch (err) {
      console.error("Error updating favorite:", err);
      alert("Could not update your favorites. Please try again.");
    } finally {
      button.disabled = false;
    }
  });

  return button;
}