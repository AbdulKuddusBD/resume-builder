import {
  isFirebaseConfigured,
  onUserChanged,
  signInGoogle,
  loginEmail,
  registerEmail,
  logoutUser,
  listResumes,
  deleteResume,
  saveContactMessage
} from "./firebase-service.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let currentUser = null;

function showToast(message) {
  const toastEl = $("#appToast");
  const body = $("[data-toast-body]");
  if (!toastEl || !body || !window.bootstrap) {
    console.log(message);
    return;
  }
  body.textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastEl).show();
}

function displayName(user) {
  return user?.displayName || user?.email || "User";
}

async function handleGoogleLogin() {
  try {
    const user = await signInGoogle();
    showToast(`Welcome ${displayName(user)}`);
    if (document.body.dataset.page === "home") window.location.href = "dashboard.html";
  } catch (error) {
    showToast(error.message || "Google sign-in failed");
  }
}

async function handleEmailLogin(form) {
  const data = new FormData(form);
  try {
    const user = await loginEmail(data.get("email"), data.get("password"));
    showToast(`Logged in as ${displayName(user)}`);
    if (document.body.dataset.page === "home") window.location.href = "dashboard.html";
  } catch (error) {
    showToast(error.message || "Login failed");
  }
}

async function handleRegister(form) {
  const data = new FormData(form);
  try {
    const user = await registerEmail(data.get("email"), data.get("password"));
    showToast(`Account created for ${displayName(user)}`);
    if (document.body.dataset.page === "home") window.location.href = "dashboard.html";
  } catch (error) {
    showToast(error.message || "Registration failed");
  }
}


function bindContactForm() {
  const form = $("[data-contact-form]");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const status = $("[data-contact-status]", form);
    const data = new FormData(form);
    try {
      const result = await saveContactMessage({
        name: data.get("name"),
        email: data.get("email"),
        message: data.get("message")
      });
      form.reset();
      if (status) status.textContent = result.local
        ? "Message saved locally. Configure Firebase to receive messages in Firestore."
        : "Message sent successfully.";
      showToast("Message received");
    } catch (error) {
      if (status) status.textContent = error.message || "Could not send message.";
      showToast(error.message || "Could not send message");
    }
  });
}

function bindAuthUI() {
  $$("[data-google-login]").forEach(btn => btn.addEventListener("click", handleGoogleLogin));
  $$("[data-auth-form]").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      handleEmailLogin(form);
    });
  });
  $$("[data-register]").forEach(btn => {
    btn.addEventListener("click", () => {
      const form = btn.closest(".modal-body")?.querySelector("[data-auth-form]") || document.querySelector("[data-auth-form]");
      if (form) handleRegister(form);
    });
  });
  $$("[data-logout]").forEach(btn => btn.addEventListener("click", async () => {
    await logoutUser();
    showToast("Logged out");
  }));

  if (!isFirebaseConfigured) {
    $$("[data-auth-status]").forEach(el => {
      el.textContent = "Firebase config missing. Update js/firebase-config.js to enable login.";
    });
  }
}

async function renderDashboard() {
  const listEl = $("[data-resume-list]");
  if (!listEl) return;

  if (!currentUser) {
    listEl.innerHTML = `<div class="col-12"><div class="empty-state"><h3>Login required for cloud CV list</h3><p>Google বা Email দিয়ে login করলে saved CV list এখানে দেখাবে।</p><a class="btn btn-primary" href="builder.html">Guest হিসেবে CV তৈরি করুন</a></div></div>`;
    return;
  }

  listEl.innerHTML = `<div class="col-12"><div class="empty-state"><h3>Loading...</h3><p>Please wait.</p></div></div>`;
  try {
    const resumes = await listResumes(currentUser);
    if (!resumes.length) {
      listEl.innerHTML = `<div class="col-12"><div class="empty-state"><h3>No saved CV yet</h3><p>নতুন CV তৈরি করে save করুন।</p><a class="btn btn-primary" href="builder.html">Create New CV</a></div></div>`;
      return;
    }

    listEl.innerHTML = resumes.map(resume => {
      const name = resume.fullName || "Untitled CV";
      const role = resume.jobTitle || resume.targetTitle || "Resume";
      const updated = resume.updatedAt?.toDate ? resume.updatedAt.toDate().toLocaleString() : "Recently updated";
      return `
        <div class="col-md-6">
          <div class="resume-list-card h-100">
            <div class="d-flex justify-content-between gap-2">
              <div>
                <h3 class="h5 mb-1">${escapeHtml(name)}</h3>
                <p class="text-secondary mb-1">${escapeHtml(role)}</p>
                <p class="small text-secondary mb-0">${escapeHtml(updated)}</p>
              </div>
              <span class="badge text-bg-light border align-self-start">${escapeHtml(resume.language || "en")}</span>
            </div>
            <div class="d-flex flex-wrap gap-2 mt-3">
              <a class="btn btn-primary btn-sm" href="builder.html?id=${encodeURIComponent(resume.id)}">Edit</a>
              <a class="btn btn-outline-primary btn-sm" href="builder.html?id=${encodeURIComponent(resume.id)}&download=1">Open PDF</a>
              <button class="btn btn-outline-danger btn-sm" data-delete-resume="${escapeHtml(resume.id)}">Delete</button>
            </div>
          </div>
        </div>`;
    }).join("");

    $$("[data-delete-resume]").forEach(btn => btn.addEventListener("click", async () => {
      if (!confirm("Delete this CV?")) return;
      await deleteResume(currentUser, btn.dataset.deleteResume);
      showToast("CV deleted");
      renderDashboard();
    }));
  } catch (error) {
    listEl.innerHTML = `<div class="col-12"><div class="empty-state"><h3>Could not load CVs</h3><p>${escapeHtml(error.message)}</p></div></div>`;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

async function init() {
  bindAuthUI();
  bindContactForm();
  await onUserChanged(async user => {
    currentUser = user;
    $$("[data-logout]").forEach(btn => btn.classList.toggle("d-none", !user));
    $$("[data-user-email]").forEach(el => el.textContent = user ? (user.email || user.displayName || "Logged in") : "Guest user");
    $$("[data-user-avatar]").forEach(el => el.textContent = user ? displayName(user).slice(0, 1).toUpperCase() : "U");
    if (document.body.dataset.page === "dashboard") renderDashboard();
  });
}

init();
