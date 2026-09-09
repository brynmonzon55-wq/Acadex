import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signOut, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../../firebase-config.json";

// Active Firebase configuration with optional env override
const activeConfig = {
  ...firebaseConfig,
  ...(import.meta.env.VITE_FIREBASE_API_KEY ? { apiKey: import.meta.env.VITE_FIREBASE_API_KEY } : {}),
};

// Initialize Firebase
const app = initializeApp(activeConfig);

// Initialize Firestore. Uses a named database if the config specifies one
// (firestoreDatabaseId), otherwise falls back to the project's "(default)"
// database.
export const db = "firestoreDatabaseId" in activeConfig
  ? getFirestore(app, (activeConfig as { firestoreDatabaseId: string }).firestoreDatabaseId)
  : getFirestore(app);

// Real Firebase Authentication - passwords are hashed & managed by Firebase,
// never stored in or synced from Firestore.
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// The Firebase Auth client SDK signs you in as whatever account you just
// created. That's a problem when a TEACHER creates a STUDENT account from
// the dashboard - we don't want that to log the teacher out. To work around
// this without needing a backend/Cloud Function, we spin up a short-lived
// secondary Firebase App instance just for the account-creation call, then
// tear it down. The teacher's own session (on the primary `auth`) is never
// touched.
export async function createUserWithoutSigningIn(email: string, password: string) {
  const secondaryApp = initializeApp(activeConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    // Clean up the temporary app instance
    const instance = getApps().find((a) => a.name === secondaryApp.name);
    if (instance) {
      await deleteApp(instance);
    }
  }
}

// Synthetic email used since this app logs in with a "Student/Teacher ID"
// rather than a real email address. Firebase Auth requires an email format.
export function idToAuthEmail(id: string): string {
  const sanitized = id.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
  return `${sanitized || "user"}@attendance-hub.local`;
}
