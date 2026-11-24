import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  document.getElementById("profile-name").textContent =
    user.displayName || "Not set";

  document.getElementById("profile-email").textContent =
    user.email || "Not available";
});

const editButton = document.getElementById("edit-profile-btn");
const editForm = document.getElementById("edit-profile-form");
const cancelButton = document.getElementById("cancel-edit-btn");
const nameInput = document.getElementById("profile-name-input");

editButton.addEventListener("click", () => {
  nameInput.value = document.getElementById("profile-name").textContent;
  editForm.classList.remove("d-none");
  editButton.classList.add("d-none");
});

cancelButton.addEventListener("click", () => {
  editForm.classList.add("d-none");
  editButton.classList.remove("d-none");
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newName = nameInput.value.trim();
  const user = auth.currentUser;

  if (!user || !newName) return;

  try {
    // Update name in Firebase Authentication
    await updateProfile(user, {
      displayName: newName,
    });

    // Update name in Firestore
    await updateDoc(doc(db, "users", user.uid), {
      name: newName,
    });

    // Display the updated name
    document.getElementById("profile-name").textContent = newName;

    // Hide the form and show Edit Profile again
    editForm.classList.add("d-none");
    editButton.classList.remove("d-none");
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Could not update your profile. Please try again.");
  }
});
