// Firebase configuration
// 1) Firebase Console > Project settings > Your apps > Web app থেকে config copy করে এখানে paste করুন.
// 2) Authentication > Sign-in method থেকে Email/Password এবং Google enable করুন.
// 3) Authentication > Settings > Authorized domains এ আপনার domain যোগ করুন.
// 4) Firestore Database create করে firestore.rules file-এর rules publish করুন.

export const firebaseConfig = {
  apiKey: "AIzaSyDYsxUnqgETGoJtjW6GCiU9ql3c-K5BzIM",
  authDomain: "resume-builder-710db.firebaseapp.com",
  projectId: "resume-builder-710db",
  storageBucket: "resume-builder-710db.firebasestorage.app",
  messagingSenderId: "330863968809",
  appId: "1:330863968809:web:298c227e3f572d8912d238",
  measurementId: "G-M13W8G7REX"
};
// Optional: Real AI integration endpoint (Firebase Cloud Function / secure backend proxy).
// Never put OpenAI/Gemini API keys directly in frontend JavaScript.
export const AI_CONFIG = {
  endpoint: ""
};
