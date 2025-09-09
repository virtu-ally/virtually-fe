import {
  GoogleAuthProvider,
  browserSessionPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithRedirect,
} from "firebase/auth";

import { initializeApp } from "firebase/app";

// Optionally import analytics if you want it
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Optionally add measurementId if you want analytics
  // measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set up session-based authentication persistence
// This ensures users are logged out when the browser session ends
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session persistence configured successfully");
  })
  .catch((error) => {
    console.error("Failed to set session persistence:", error);
  });

// Optionally export analytics
// export const analytics = getAnalytics(app);

export default app;
