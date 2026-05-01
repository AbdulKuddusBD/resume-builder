import { firebaseConfig } from "./firebase-config.js";

const placeholderValues = Object.values(firebaseConfig).filter(Boolean).join(" ");
export const isFirebaseConfigured = !placeholderValues.includes("PASTE_YOUR");

let app = null;
let auth = null;
let db = null;
let firebaseModules = null;

async function loadFirebase() {
  if (!isFirebaseConfigured) return null;
  if (firebaseModules) return firebaseModules;

  const [
    appMod,
    authMod,
    firestoreMod
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  app = appMod.initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  db = firestoreMod.getFirestore(app);
  firebaseModules = { appMod, authMod, firestoreMod };
  return firebaseModules;
}

export async function getFirebaseState() {
  await loadFirebase();
  return { app, auth, db, isFirebaseConfigured };
}

export async function onUserChanged(callback) {
  const mods = await loadFirebase();
  if (!mods) {
    callback(null);
    return () => {};
  }
  return mods.authMod.onAuthStateChanged(auth, callback);
}

export async function signInGoogle() {
  const mods = await loadFirebase();
  if (!mods) throw new Error("Firebase config missing. Update js/firebase-config.js first.");
  const provider = new mods.authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await mods.authMod.signInWithPopup(auth, provider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function loginEmail(email, password) {
  const mods = await loadFirebase();
  if (!mods) throw new Error("Firebase config missing. Update js/firebase-config.js first.");
  const result = await mods.authMod.signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function registerEmail(email, password) {
  const mods = await loadFirebase();
  if (!mods) throw new Error("Firebase config missing. Update js/firebase-config.js first.");
  const result = await mods.authMod.createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function logoutUser() {
  const mods = await loadFirebase();
  if (!mods) return;
  await mods.authMod.signOut(auth);
}

async function ensureUserProfile(user) {
  if (!user) return;
  const mods = await loadFirebase();
  const ref = mods.firestoreMod.doc(db, "users", user.uid);
  await mods.firestoreMod.setDoc(ref, {
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: mods.firestoreMod.serverTimestamp()
  }, { merge: true });
}

export async function saveResume(user, resume) {
  const mods = await loadFirebase();
  if (!mods || !user) {
    localStorage.setItem("smartATSResumeDraft", JSON.stringify(resume));
    return { id: "local", local: true };
  }

  const collectionRef = mods.firestoreMod.collection(db, "users", user.uid, "resumes");
  const payload = {
    ...resume,
    ownerId: user.uid,
    updatedAt: mods.firestoreMod.serverTimestamp()
  };

  if (resume.id && resume.id !== "local") {
    const docRef = mods.firestoreMod.doc(db, "users", user.uid, "resumes", resume.id);
    await mods.firestoreMod.setDoc(docRef, payload, { merge: true });
    return { id: resume.id, local: false };
  }

  payload.createdAt = mods.firestoreMod.serverTimestamp();
  const docRef = await mods.firestoreMod.addDoc(collectionRef, payload);
  return { id: docRef.id, local: false };
}

export async function getResume(user, resumeId) {
  const mods = await loadFirebase();
  if (!mods || !user || !resumeId || resumeId === "local") {
    const local = localStorage.getItem("smartATSResumeDraft");
    return local ? JSON.parse(local) : null;
  }
  const docRef = mods.firestoreMod.doc(db, "users", user.uid, "resumes", resumeId);
  const snap = await mods.firestoreMod.getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listResumes(user) {
  const mods = await loadFirebase();
  if (!mods || !user) return [];
  const q = mods.firestoreMod.query(
    mods.firestoreMod.collection(db, "users", user.uid, "resumes"),
    mods.firestoreMod.orderBy("updatedAt", "desc")
  );
  const snap = await mods.firestoreMod.getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteResume(user, resumeId) {
  const mods = await loadFirebase();
  if (!mods || !user || !resumeId) return;
  await mods.firestoreMod.deleteDoc(mods.firestoreMod.doc(db, "users", user.uid, "resumes", resumeId));
}

export async function saveContactMessage(message) {
  const mods = await loadFirebase();
  const payload = {
    name: String(message.name || "").slice(0, 120),
    email: String(message.email || "").slice(0, 160),
    message: String(message.message || "").slice(0, 2000),
    createdAt: mods ? mods.firestoreMod.serverTimestamp() : new Date().toISOString()
  };

  if (!mods) {
    const existing = JSON.parse(localStorage.getItem("smartATSContactMessages") || "[]");
    existing.push(payload);
    localStorage.setItem("smartATSContactMessages", JSON.stringify(existing));
    return { local: true };
  }

  await mods.firestoreMod.addDoc(mods.firestoreMod.collection(db, "contactMessages"), payload);
  return { local: false };
}
