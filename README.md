# Smart ATS CV Builder v3.0

HTML + CSS + Vanilla JavaScript + Bootstrap 5 + Firebase resume/CV builder SaaS starter.

## Features
- CVBanao-style landing page
- Email/password login/register with Firebase Auth
- Firestore user CV save/load/delete
- Live CV preview
- 12 ATS-friendly templates
- Bangla and English headings
- Dynamic skills, experience, education, projects, certifications, custom sections
- ATS score and job keyword checker
- PDF export with html2pdf.js
- Mobile responsive Bootstrap 5 layout

## Firebase setup
1. Create a Firebase project.
2. Enable Authentication > Sign-in method > Email/Password.
3. Create Firestore Database.
4. Open `js/firebase-config.js` and replace the placeholder config.
5. Deploy to Firebase Hosting, Netlify, Vercel, or any static host.

## Firestore rules for testing
Use during development only:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Notes
- This is frontend-only. Real AI generation needs a secure backend or Firebase Cloud Function to protect API keys.
- Do not put OpenAI or payment secret keys in frontend JavaScript.
