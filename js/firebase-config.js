// Firebase configuration
// 1) Firebase Console > Project settings > Your apps > Web app থেকে config copy করে এখানে paste করুন.
// 2) Authentication > Sign-in method থেকে Email/Password এবং Google enable করুন.
// 3) Authentication > Settings > Authorized domains এ আপনার domain যোগ করুন.
// 4) Firestore Database create করে firestore.rules file-এর rules publish করুন.

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Optional: Real AI integration endpoint (Firebase Cloud Function / secure backend proxy).
// Never put OpenAI/Gemini API keys directly in frontend JavaScript.
export const AI_CONFIG = {
  endpoint: ""
};
