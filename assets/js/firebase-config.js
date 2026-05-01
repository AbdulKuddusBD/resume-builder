// 1) Create a Firebase project
// 2) Enable Authentication > Email/Password
// 3) Create Firestore Database
// 4) Replace the placeholder config below
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDYsxUnqgETGoJtjW6GCiU9ql3c-K5BzIM",
  authDomain: "resume-builder-710db.firebaseapp.com",
  projectId: "resume-builder-710db",
  storageBucket: "resume-builder-710db.firebasestorage.app",
  messagingSenderId: "330863968809",
  appId: "1:330863968809:web:298c227e3f572d8912d238",
  measurementId: "G-M13W8G7REX"
};

export const firebaseReady = !firebaseConfig.apiKey.includes("YOUR_");
