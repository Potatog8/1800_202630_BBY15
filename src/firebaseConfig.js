import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDOA8LLXOecfkFI2Yt3e9Lcc7gmFQAn7nQ",
  authDomain: "bby15-heirloom-recipes.firebaseapp.com",
  projectId: "bby15-heirloom-recipes",
  appId: "1:57790335264:web:61c261214c0d913e8baf45"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);