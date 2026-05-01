import {
  isFirebaseConfigured,
  onUserChanged,
  signInGoogle,
  logoutUser,
  saveResume,
  getResume
} from "./firebase-service.js";
import { AI_CONFIG } from "./firebase-config.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const templates = [
  ["classic", "Classic Professional"],
  ["modern", "Modern Minimal"],
  ["corporate", "Standard Corporate"],
  ["minimal", "Simple ATS"],
  ["elegant", "Elegant Clean"],
  ["creative", "Creative Clean"],
  ["tech", "Tech Resume"],
  ["fresher", "Fresher CV"],
  ["compact", "Compact One Page"],
  ["executive", "Executive"],
  ["bd", "Bangladesh Formal"],
  ["hybrid", "Hybrid ATS"]
];

const headings = {
  en: {
    summary: "Professional Summary",
    skills: "Skills",
    experience: "Work Experience",
    education: "Education",
    projects: "Projects",
    certifications: "Certifications"
  },
  bn: {
    summary: "পেশাগত সারাংশ",
    skills: "দক্ষতা",
    experience: "কর্ম অভিজ্ঞতা",
    education: "শিক্ষা",
    projects: "প্রকল্প",
    certifications: "সার্টিফিকেশন"
  }
};

const skillMap = {
  developer: ["JavaScript", "HTML5", "CSS3", "React", "REST API", "Git", "Firebase", "Problem Solving"],
  frontend: ["HTML5", "CSS3", "Bootstrap 5", "JavaScript", "React", "Responsive Design", "Web Performance"],
  backend: ["Node.js", "Express.js", "REST API", "MongoDB", "Firebase", "Authentication", "Security"],
  marketing: ["SEO", "Google Analytics", "Meta Ads", "Content Strategy", "Email Marketing", "Campaign Reporting"],
  sales: ["Lead Generation", "CRM", "Negotiation", "Client Relationship", "Pipeline Management", "Revenue Growth"],
  hr: ["Recruitment", "Employee Relations", "HR Operations", "Onboarding", "Payroll Coordination"],
  designer: ["UI Design", "Figma", "Branding", "Typography", "Wireframing", "Design Systems"],
  data: ["Excel", "SQL", "Power BI", "Data Analysis", "Dashboarding", "Reporting"],
  accountant: ["Accounting", "Tally", "QuickBooks", "Financial Reporting", "VAT", "Bank Reconciliation"]
};

const actionVerbs = ["Developed", "Led", "Managed", "Improved", "Designed", "Implemented", "Optimized", "Coordinated", "Analyzed", "Delivered"];
let currentUser = null;
let resumeId = new URLSearchParams(location.search).get("id");
let state = getDefaultState();

function getDefaultState() {
  return {
    id: resumeId || null,
    language: "en",
    template: "classic",
    accent: "#2563eb",
    font: "Arial, Helvetica, sans-serif",
    spacing: "comfortable",
    fullName: "",
    jobTitle: "",
    targetTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    customSections: []
  };
}

function sampleState() {
  return {
    ...getDefaultState(),
    language: "en",
    template: "modern",
    fullName: "Nusrat Jahan",
    jobTitle: "Digital Marketing Executive",
    targetTitle: "Digital Marketing Manager",
    email: "nusrat@example.com",
    phone: "+8801712345678",
    location: "Dhaka, Bangladesh",
    linkedin: "linkedin.com/in/nusrat",
    portfolio: "nusratportfolio.com",
    summary: "Results-driven Digital Marketing Executive with 3+ years of experience planning SEO, social media and paid campaign strategies for growing brands. Skilled in analytics, content planning and campaign optimization with a strong focus on measurable business growth.",
    skills: ["SEO", "Google Analytics", "Meta Ads", "Content Strategy", "Email Marketing", "Campaign Reporting"],
    experience: [
      { role: "Digital Marketing Executive", company: "ABC Digital", start: "Jan 2022", end: "Present", description: "Managed SEO and social media campaigns increasing qualified leads by 42%.\nOptimized Meta Ads budgets and improved campaign ROI by 28%.\nCreated monthly analytics reports for management decisions." }
    ],
    education: [
      { degree: "BBA in Marketing", institution: "University of Dhaka", year: "2021", result: "CGPA 3.65/4.00" }
    ],
    projects: [
      { name: "Lead Generation Campaign", link: "", description: "Planned a multi-channel campaign that generated 1,200+ qualified leads within 60 days." }
    ],
    certifications: [
      { name: "Google Analytics Certification", issuer: "Google", year: "2024" }
    ],
    customSections: [
      { title: "Achievements", content: "Best Performer Award 2023\nImproved organic traffic by 55% within six months" }
    ]
  };
}

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

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function parseLines(text = "") {
  return String(text).split(/\n|•|-/).map(x => x.trim()).filter(Boolean);
}

function updateField(name, value) {
  state[name] = value;
  localStorage.setItem("smartATSResumeDraft", JSON.stringify(state));
  render();
}

function bindBaseFields() {
  $$("[data-field]").forEach(field => {
    field.addEventListener("input", () => updateField(field.dataset.field, field.value));
    field.addEventListener("change", () => updateField(field.dataset.field, field.value));
  });
}

function populateTemplates() {
  const select = $("[data-template-select]");
  const grid = $("[data-template-grid]");
  if (select) {
    select.innerHTML = templates.map(([id, name]) => `<option value="${id}">${name}</option>`).join("");
  }
  if (grid) {
    grid.innerHTML = templates.map(([id, name]) => `<div class="template-choice" data-template-choice="${id}"><strong>${name}</strong><small class="text-secondary">ATS-safe clean layout</small></div>`).join("");
    $$("[data-template-choice]").forEach(card => card.addEventListener("click", () => {
      updateField("template", card.dataset.templateChoice);
      const sel = $("[data-template-select]");
      if (sel) sel.value = card.dataset.templateChoice;
      renderForm();
    }));
  }
}

function bindDynamicButtons() {
  $("[data-add-experience]")?.addEventListener("click", () => { state.experience.push({ role: "", company: "", start: "", end: "", description: "" }); renderForm(); render(); });
  $("[data-add-education]")?.addEventListener("click", () => { state.education.push({ degree: "", institution: "", year: "", result: "" }); renderForm(); render(); });
  $("[data-add-project]")?.addEventListener("click", () => { state.projects.push({ name: "", link: "", description: "" }); renderForm(); render(); });
  $("[data-add-certification]")?.addEventListener("click", () => { state.certifications.push({ name: "", issuer: "", year: "" }); renderForm(); render(); });
  $("[data-add-custom]")?.addEventListener("click", () => { state.customSections.push({ title: "", content: "" }); renderForm(); render(); });

  $("[data-skill-input]")?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !state.skills.includes(value)) state.skills.push(value);
      e.target.value = "";
      renderForm(); render();
    }
  });

  $$("[data-ai-summary]").forEach(btn => btn.addEventListener("click", generateSummary));
  $$("[data-ai-skills]").forEach(btn => btn.addEventListener("click", suggestSkills));
  $("[data-ai-experience]")?.addEventListener("click", improveExperience);
  $("[data-analyze-keywords]")?.addEventListener("click", analyzeKeywords);
  $$("[data-download-pdf]").forEach(btn => btn.addEventListener("click", downloadPdf));
  $("[data-save-resume]")?.addEventListener("click", saveCurrentResume);
  $("[data-load-sample]")?.addEventListener("click", () => { state = sampleState(); resumeId = null; renderForm(); render(); showToast("Sample CV loaded"); });
  $$("[data-preview-toggle]").forEach(btn => btn.addEventListener("click", () => $("[data-preview-panel]")?.classList.toggle("show")));
}

function renderForm() {
  $$("[data-field]").forEach(field => {
    const key = field.dataset.field;
    if (field.value !== String(state[key] ?? "")) field.value = state[key] ?? "";
  });

  $$("[data-template-choice]").forEach(card => card.classList.toggle("active", card.dataset.templateChoice === state.template));

  renderSkills();
  renderCollection("experience", "[data-experience-list]", "experienceTemplate");
  renderCollection("education", "[data-education-list]", "educationTemplate");
  renderCollection("projects", "[data-project-list]", "projectTemplate");
  renderCollection("certifications", "[data-certification-list]", "certificationTemplate");
  renderCollection("customSections", "[data-custom-list]", "customTemplate");
}

function renderSkills() {
  const list = $("[data-skill-list]");
  if (!list) return;
  list.innerHTML = state.skills.map((skill, index) => `<span class="skill-tag">${escapeHtml(skill)} <button type="button" aria-label="Remove skill" data-remove-skill="${index}">×</button></span>`).join("");
  $$("[data-remove-skill]").forEach(btn => btn.addEventListener("click", () => {
    state.skills.splice(Number(btn.dataset.removeSkill), 1);
    renderForm(); render();
  }));
}

function renderCollection(key, selector, templateId) {
  const container = $(selector);
  const template = $(`#${templateId}`);
  if (!container || !template) return;
  container.innerHTML = "";

  state[key].forEach((item, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelectorAll("[data-subfield]").forEach(input => {
      const sub = input.dataset.subfield;
      input.value = item[sub] || "";
      input.addEventListener("input", () => {
        state[key][index][sub] = input.value;
        localStorage.setItem("smartATSResumeDraft", JSON.stringify(state));
        render();
      });
    });
    node.querySelector("[data-remove]")?.addEventListener("click", () => {
      state[key].splice(index, 1);
      renderForm(); render();
    });
    container.appendChild(node);
  });

  if (!state[key].length) {
    container.innerHTML = `<p class="text-secondary small mb-0">No item added yet.</p>`;
  }
}

function resumeText() {
  return [
    state.fullName, state.jobTitle, state.targetTitle, state.summary,
    ...state.skills,
    ...state.experience.flatMap(x => [x.role, x.company, x.description]),
    ...state.education.flatMap(x => [x.degree, x.institution]),
    ...state.projects.flatMap(x => [x.name, x.description]),
    ...state.certifications.flatMap(x => [x.name, x.issuer]),
    ...state.customSections.flatMap(x => [x.title, x.content])
  ].join(" ").toLowerCase();
}

function render() {
  const preview = $("#resumePreview");
  if (!preview) return;
  const lang = state.language === "bn" ? "bn" : "en";
  const h = headings[lang];
  preview.className = `resume-page template-${state.template || "classic"} spacing-${state.spacing || "comfortable"}`;
  preview.style.setProperty("--resume-accent", state.accent || "#2563eb");
  preview.style.fontFamily = state.font || "Arial, Helvetica, sans-serif";

  const contact = [state.email, state.phone, state.location, state.linkedin, state.portfolio].filter(Boolean);
  preview.innerHTML = `
    <header class="resume-header">
      <h1>${escapeHtml(state.fullName || "Your Name")}</h1>
      <div class="resume-title">${escapeHtml(state.jobTitle || state.targetTitle || "Target Job Title")}</div>
      <div class="resume-contact">${contact.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    </header>

    ${state.summary ? section(h.summary, `<p>${escapeHtml(state.summary)}</p>`) : ""}
    ${state.skills.length ? section(h.skills, `<div class="resume-skills">${state.skills.map(skill => `<span class="resume-skill">${escapeHtml(skill)}</span>`).join("")}</div>`) : ""}
    ${state.experience.length ? section(h.experience, state.experience.map(exp => `
      <div class="resume-item">
        <div class="resume-item-head">
          <h3>${escapeHtml(exp.role || "Role")}</h3>
          <span class="resume-meta">${escapeHtml([exp.start, exp.end].filter(Boolean).join(" - "))}</span>
        </div>
        <div class="resume-sub">${escapeHtml(exp.company || "Company")}</div>
        ${bullets(exp.description)}
      </div>`).join("")) : ""}
    ${state.education.length ? section(h.education, state.education.map(edu => `
      <div class="resume-item">
        <div class="resume-item-head">
          <h3>${escapeHtml(edu.degree || "Degree")}</h3>
          <span class="resume-meta">${escapeHtml(edu.year || "")}</span>
        </div>
        <div>${escapeHtml([edu.institution, edu.result].filter(Boolean).join(" • "))}</div>
      </div>`).join("")) : ""}
    ${state.projects.length ? section(h.projects, state.projects.map(project => `
      <div class="resume-item">
        <div class="resume-item-head"><h3>${escapeHtml(project.name || "Project")}</h3><span class="resume-meta">${escapeHtml(project.link || "")}</span></div>
        ${bullets(project.description)}
      </div>`).join("")) : ""}
    ${state.certifications.length ? section(h.certifications, state.certifications.map(cert => `
      <div class="resume-item">
        <div class="resume-item-head"><h3>${escapeHtml(cert.name || "Certification")}</h3><span class="resume-meta">${escapeHtml(cert.year || "")}</span></div>
        <div>${escapeHtml(cert.issuer || "")}</div>
      </div>`).join("")) : ""}
    ${state.customSections.map(custom => custom.title || custom.content ? section(escapeHtml(custom.title || "Additional Information"), bullets(custom.content)) : "").join("")}
  `;

  updateAtsScore();
}

function section(title, content) {
  return `<section class="resume-section"><h2>${title}</h2>${content}</section>`;
}

function bullets(text = "") {
  const lines = parseLines(text);
  if (!lines.length) return "";
  if (lines.length === 1) return `<p>${escapeHtml(lines[0])}</p>`;
  return `<ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
}

async function generateSummary() {
  if (AI_CONFIG.endpoint) {
    try {
      const response = await fetch(AI_CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "summary", resume: state })
      });
      const data = await response.json();
      if (data.summary) {
        updateField("summary", data.summary);
        renderForm();
        showToast("AI summary generated from endpoint");
        return;
      }
    } catch (error) {
      console.warn(error);
    }
  }

  const lang = state.language === "bn" ? "bn" : "en";
  const title = state.targetTitle || state.jobTitle || (lang === "bn" ? "পেশাজীবী" : "Professional");
  const skills = state.skills.slice(0, 5).join(", ");
  const summary = lang === "bn"
    ? `${title} হিসেবে বাস্তব অভিজ্ঞতা ও শক্তিশালী problem-solving দক্ষতা সম্পন্ন একজন ফলাফলমুখী প্রার্থী। ${skills ? `${skills} বিষয়ে দক্ষ এবং ` : ""}পরিমাপযোগ্য ফলাফল, টিমওয়ার্ক এবং দ্রুত শেখার ক্ষমতার মাধ্যমে প্রতিষ্ঠানের লক্ষ্য অর্জনে অবদান রাখতে আগ্রহী।`
    : `Results-driven ${title} with hands-on experience delivering measurable outcomes in fast-paced environments. ${skills ? `Skilled in ${skills}, ` : ""}with a strong focus on problem-solving, collaboration and continuous improvement.`;
  updateField("summary", summary);
  renderForm();
  showToast("AI-style summary generated");
}

function suggestSkills() {
  const text = `${state.targetTitle} ${state.jobTitle}`.toLowerCase();
  let suggestions = [];
  Object.entries(skillMap).forEach(([key, skills]) => {
    if (text.includes(key)) suggestions.push(...skills);
  });
  if (!suggestions.length) suggestions = ["Communication", "Problem Solving", "Teamwork", "Microsoft Office", "Time Management", "Leadership"];
  suggestions.forEach(skill => {
    if (!state.skills.includes(skill)) state.skills.push(skill);
  });
  renderForm();
  render();
  showToast("Skills suggested");
}

function improveExperience() {
  if (!state.experience.length) {
    state.experience.push({ role: state.targetTitle || state.jobTitle || "Professional", company: "", start: "", end: "", description: "" });
  }
  state.experience = state.experience.map((exp, i) => {
    const role = exp.role || state.targetTitle || state.jobTitle || "professional responsibilities";
    const original = parseLines(exp.description);
    const improved = original.length ? original.map((line, idx) => improveLine(line, idx)) : [
      `Managed ${role.toLowerCase()} responsibilities while improving workflow efficiency by 25%.`,
      `Collaborated with cross-functional teams to deliver projects on time and maintain quality standards.`,
      `Analyzed performance data and implemented improvements that strengthened measurable outcomes.`
    ];
    return { ...exp, description: improved.join("\n") };
  });
  renderForm();
  render();
  showToast("Experience bullets improved");
}

function improveLine(line, index) {
  const startsWithVerb = actionVerbs.some(v => line.toLowerCase().startsWith(v.toLowerCase()));
  const verb = actionVerbs[index % actionVerbs.length];
  let cleaned = line.replace(/^worked on/i, "built").replace(/^did/i, "completed");
  if (!startsWithVerb) cleaned = `${verb} ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
  if (!/\d|%|৳|\$/.test(cleaned)) cleaned += " to improve efficiency and business impact.";
  return cleaned;
}

function extractKeywords(text) {
  const stop = new Set("the and for with you your are from this that will have has job role work team our must should able experience years using use strong good excellent about into within plus such as in on to of a an is be or by".split(" "));
  return [...new Set(String(text).toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stop.has(word)))]
    .slice(0, 40);
}

function analyzeKeywords() {
  const jd = $("[data-job-description]")?.value || "";
  const output = $("[data-keyword-results]");
  if (!output) return;
  if (!jd.trim()) {
    output.innerHTML = `<div class="alert alert-warning mb-0">Please paste a job description first.</div>`;
    return;
  }
  const words = extractKeywords(jd);
  const text = resumeText();
  const hits = words.filter(w => text.includes(w));
  const missing = words.filter(w => !text.includes(w)).slice(0, 18);
  output.innerHTML = `
    <div class="mb-2"><strong>Matched:</strong> ${hits.length}/${words.length}</div>
    <div>${hits.slice(0, 18).map(w => `<span class="keyword-pill keyword-hit">${escapeHtml(w)}</span>`).join("")}</div>
    <div class="mt-2"><strong>Missing keywords:</strong></div>
    <div>${missing.map(w => `<span class="keyword-pill keyword-miss">${escapeHtml(w)}</span>`).join("")}</div>
  `;
  updateAtsScore(words);
}

function updateAtsScore(jobWords = null) {
  const suggestions = [];
  let score = 0;

  if (state.fullName) score += 8; else suggestions.push("Add your full name.");
  if (state.email && /^[^@]+@[^@]+\.[^@]+/.test(state.email)) score += 8; else suggestions.push("Add a valid email address.");
  if (state.phone) score += 6; else suggestions.push("Add phone number.");
  if (state.summary && state.summary.length >= 80) score += 12; else suggestions.push("Write a professional summary of at least 80 characters.");
  if (state.skills.length >= 6) score += 14; else suggestions.push("Add at least 6 relevant skills.");
  if (state.experience.length) score += 12; else suggestions.push("Add work experience or internship/projects.");
  if (state.education.length) score += 8; else suggestions.push("Add education.");
  if (state.projects.length || state.certifications.length) score += 6; else suggestions.push("Add project or certification for stronger profile.");

  const bulletsText = state.experience.map(x => x.description || "").join("\n");
  if (parseLines(bulletsText).length >= 3) score += 8; else suggestions.push("Use 3+ bullet points in experience.");
  if (actionVerbs.some(v => bulletsText.toLowerCase().includes(v.toLowerCase()))) score += 6; else suggestions.push("Start bullets with action verbs like Developed, Managed, Improved.");
  if (/\d|%|৳|\$/.test(bulletsText)) score += 6; else suggestions.push("Add measurable results with numbers or percentages.");

  const jd = $("[data-job-description]")?.value || "";
  const words = jobWords || (jd ? extractKeywords(jd) : []);
  if (words.length) {
    const text = resumeText();
    const matched = words.filter(w => text.includes(w)).length;
    const keywordScore = Math.round((matched / words.length) * 12);
    score += keywordScore;
    if (keywordScore < 8) suggestions.push("Add more relevant keywords from the job description.");
  } else {
    score += 6;
    suggestions.push("Paste a job description to unlock full keyword score.");
  }

  score = Math.min(100, score);
  const scoreEl = $("[data-ats-score]");
  const suggestionsEl = $("[data-ats-suggestions]");
  const circle = $(".score-circle");
  if (scoreEl) scoreEl.textContent = score;
  if (circle) circle.style.background = `conic-gradient(var(--primary) ${score * 3.6}deg, #e2e8f0 0deg)`;
  if (suggestionsEl) suggestionsEl.innerHTML = suggestions.slice(0, 7).map(s => `<li>${escapeHtml(s)}</li>`).join("") || "<li>Great! Your CV is well optimized.</li>";
}

async function saveCurrentResume() {
  if (!validateRequired()) return;
  try {
    const result = await saveResume(currentUser, state);
    state.id = result.id;
    resumeId = result.id;
    localStorage.setItem("smartATSResumeDraft", JSON.stringify(state));
    showToast(result.local ? "Saved as local draft. Login to save in Firebase." : "CV saved to Firebase.");
  } catch (error) {
    showToast(error.message || "Save failed");
  }
}

function validateRequired() {
  const form = $("#resumeForm");
  if (!state.fullName || !state.email) {
    form?.classList.add("was-validated");
    showToast("Full name and email are required.");
    return false;
  }
  return true;
}

async function downloadPdf() {
  if (!validateRequired()) return;
  const element = $("#resumePreview");
  if (!element || !window.html2pdf) {
    showToast("PDF library not loaded");
    return;
  }
  document.body.classList.add("pdf-mode");
  const filename = `${(state.fullName || "resume").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-cv.pdf`;
  const opt = {
    margin: [0.18, 0.18, 0.18, 0.18],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };
  try {
    await html2pdf().set(opt).from(element).save();
    showToast("PDF downloaded");
  } finally {
    document.body.classList.remove("pdf-mode");
  }
}

function bindAuth() {
  $$("[data-google-login]").forEach(btn => btn.addEventListener("click", async () => {
    try {
      await signInGoogle();
      showToast("Google login successful");
    } catch (error) {
      showToast(error.message || "Google login failed");
    }
  }));
  $$("[data-logout]").forEach(btn => btn.addEventListener("click", logoutUser));
}

async function loadInitialResume() {
  const warning = $("[data-firebase-warning]");
  if (warning) warning.classList.toggle("d-none", isFirebaseConfigured);

  await onUserChanged(async user => {
    currentUser = user;
    $$("[data-logout]").forEach(btn => btn.classList.toggle("d-none", !user));
    $$("[data-user-email]").forEach(el => el.textContent = user ? (user.email || user.displayName || "Logged in") : "Guest mode");

    if (resumeId && user) {
      const remote = await getResume(user, resumeId);
      if (remote) {
        state = { ...getDefaultState(), ...remote, id: resumeId };
        renderForm(); render();
        if (new URLSearchParams(location.search).get("download") === "1") setTimeout(downloadPdf, 800);
      }
    }
  });

  if (!resumeId) {
    const local = localStorage.getItem("smartATSResumeDraft");
    if (local) {
      try { state = { ...getDefaultState(), ...JSON.parse(local) }; } catch {}
    }
    if (!state.experience.length) state.experience.push({ role: "", company: "", start: "", end: "", description: "" });
    if (!state.education.length) state.education.push({ degree: "", institution: "", year: "", result: "" });
  }
}

async function init() {
  populateTemplates();
  bindBaseFields();
  bindDynamicButtons();
  bindAuth();
  await loadInitialResume();
  renderForm();
  render();
}

init();
