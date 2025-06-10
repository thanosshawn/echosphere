// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
// import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;
// let storage: FirebaseStorage | null = null;

// Check for essential Firebase configuration variables
// API Key and Project ID are usually the most critical for initialization.
if (firebaseConfigValues.apiKey && firebaseConfigValues.projectId) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfigValues);
    } else {
      app = getApp();
    }
    // Initialize services only if app was successfully initialized
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    // storage = getStorage(app);
  } catch (error) {
    console.error("Firebase Initialization Error: Failed to initialize Firebase services. This could be due to invalid configuration values (even if present). Please verify your Firebase project settings in your .env.local file.", error);
    // Ensure services are null if initialization failed
    app = null;
    auth = null;
    db = null;
    rtdb = null;
  }
} else {
  console.error(
    "Firebase Configuration Missing: Essential Firebase configuration (NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set in your environment variables. " +
    "Firebase features will be disabled. " +
    "Please create or update your .env.local file in the root of your project with your Firebase project's configuration. Ensure all Firebase-related variables are prefixed with NEXT_PUBLIC_ (e.g., NEXT_PUBLIC_FIREBASE_API_KEY)."
  );
}

export { app, auth, db, rtdb /*, storage */ };
