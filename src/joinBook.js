import { auth, db } from "./firebaseConfig.js";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";

// Swap this for a username field from your users doc if signup stores one
export function getUsername(user) {
  return user.displayName || user.email?.split("@")[0] || "Unknown user";
}

export async function joinBookByCode(rawCode) {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_SIGNED_IN");

  const code = rawCode.trim().toUpperCase();

  // 1. Find the code
  const codeSnap = await getDoc(doc(db, "joinCodes", code));
  if (!codeSnap.exists()) throw new Error("CODE_NOT_FOUND");
  const { bookId } = codeSnap.data();

  // 2. Load the book and check they haven't already joined
  const myBookRef = doc(db, "users", user.uid, "myBooks", bookId);
  const bookSnap = await getDoc(doc(db, "allBooks", bookId));
  if (!bookSnap.exists()) throw new Error("BOOK_NOT_FOUND");
  if ((await getDoc(myBookRef)).exists()) throw new Error("ALREADY_JOINED");

  // 3. Add the book to their myBooks AND add them to the book's members
  const memberRef = doc(db, "allBooks", bookId, "members", user.uid);
  const batch = writeBatch(db);
  batch.set(myBookRef, {
    ...bookSnap.data(),
    role: "member",
    joinedAt: serverTimestamp(),
  });
  batch.set(memberRef, {
    uid: user.uid,
    username: getUsername(user),
    role: "member",
    joinedAt: serverTimestamp(),
  });
  await batch.commit();

  return bookSnap.data().name;
}