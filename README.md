# Smart ATS CV Builder Firebase v4

A professional CVBanao-style static SaaS MVP built with:

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript
- Firebase Authentication
- Firestore Database
- Google Sign-In
- Email Login/Register
- Bangla + English CV
- Live preview
- ATS score
- Job keyword analyzer
- AI-style summary/skills/experience writer
- PDF download
- Dashboard with save/edit/delete
- Contact form with Firestore/local fallback
- GitHub Pages / shared hosting compatible

## Important

This is a static frontend app. It can run on GitHub Pages, Netlify, Vercel static hosting, Hostinger/cPanel shared hosting, or Firebase Hosting.

Firebase is the cloud backend. You do not need Node.js hosting for this version.

## Files

```text
smart-ats-cv-builder-firebase-v4/
├── index.html
├── dashboard.html
├── builder.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── builder.js
│   ├── firebase-config.js
│   └── firebase-service.js
├── firestore.rules
├── firebase.json
└── README.md
```

## Firebase Setup

### 1. Create Firebase project

Go to Firebase Console and create a new project.

### 2. Add Web App

Project settings > Your apps > Web app.

Copy the Firebase config and paste it into:

```text
js/firebase-config.js
```

Replace:

```js
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};
```

### 3. Enable Email/Password Auth

Firebase Console > Authentication > Sign-in method > Email/Password > Enable.

### 4. Enable Google Sign-In

Firebase Console > Authentication > Sign-in method > Google > Enable.

Add support email and save.

### 5. Add Authorized Domains

Firebase Console > Authentication > Settings > Authorized domains.

Add your hosting domain:

- `yourusername.github.io`
- `yourdomain.com`
- `localhost` for local testing if needed

Without this, Google login may show `auth/unauthorized-domain`.

### 6. Enable Firestore

Firebase Console > Firestore Database > Create database.

Start in production mode, then publish the rules from `firestore.rules`.

## Firestore Rules

Use:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, create, update, delete: if isOwner(userId);

      match /resumes/{resumeId} {
        allow read, create, update, delete: if isOwner(userId);
      }
    }

    match /contactMessages/{messageId} {
      allow create: if request.resource.data.keys().hasOnly(["name", "email", "message", "createdAt"])
                    && request.resource.data.name is string
                    && request.resource.data.email is string
                    && request.resource.data.message is string
                    && request.resource.data.name.size() <= 120
                    && request.resource.data.email.size() <= 160
                    && request.resource.data.message.size() <= 2000
                    && request.resource.data.createdAt == request.time;
      allow read, update, delete: if false;
    }
  }
}
```

## GitHub Pages Deployment

1. Create a GitHub repository.
2. Upload all project files.
3. Go to Settings > Pages.
4. Select branch: `main`.
5. Select folder: `/root`.
6. Save.
7. Add `yourusername.github.io` in Firebase Authorized domains.

## Shared Hosting / cPanel Deployment

1. Upload all files into `public_html`.
2. Make sure `index.html`, `builder.html`, and `dashboard.html` are in the root.
3. Add your domain in Firebase Authorized domains.
4. Use HTTPS.

## Local Test

Use a local server, not direct file open:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## AI Feature Note

This version includes a secure static AI-style writer using rules/templates:

- Summary generation
- Skill suggestions
- Experience bullet improvement
- Keyword analyzer

For real GPT/OpenAI/Gemini integration, do not place API keys inside frontend JavaScript.

Recommended secure upgrade:

- Firebase Cloud Functions
- Node.js API proxy
- Callable HTTPS function
- Store API key as server secret
- Add rate limiting per user

Then set the function URL in:

```js
export const AI_CONFIG = {
  endpoint: "https://your-cloud-function-url"
};
```

The frontend will try that endpoint first and fall back to local AI-style generation if unavailable.

## SaaS Upgrade Checklist

- Payment: bKash / SSLCommerz / Stripe
- Subscription plans
- Admin panel
- Template marketplace
- Cover letter builder
- LinkedIn optimizer
- Real AI resume score
- Email verification
- Password reset
- Usage limits
- Analytics
- Privacy policy and Terms pages

## ATS Notes

The resume preview avoids tables and icons inside main resume content. It uses semantic headings and bullet points. For global ATS, English headings are usually safer. Bangla CV is included for local Bangladesh-focused use cases.
