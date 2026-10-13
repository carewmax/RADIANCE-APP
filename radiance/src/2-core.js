"use strict";
/* ============================================================
   RADIANCE — clinic website, patient app and staff console in one page
   Sections: config · utils · store · capabilities · shell · pages
   ============================================================ */

/* ---------- 1. Brand + deployment config (edit here) ----------
   Everything a clinic would change without touching code lives in CLINIC_DEFAULTS (2b-clinic.js)
   and can be edited from the staff console, then exported as content.json. */
const CONFIG = {
  brand: { name: "RADIANCE", full: "RADIANCE Dermatology & Aesthetics Clinic", mark: "R", tagline: "Your skin. Your hair. Your radiance." },
  limits: { freeSavedScans: 50, chatHistory: 40 },
  // Supabase: fill both to switch on real accounts, synced records and the shared booking system.
  // The anon key is designed to be public; row-level security (supabase/migrations) protects data.
  supabase: { url: "", anonKey: "" },
  // Server AI route for hosting outside claude.ai (netlify/functions/ai.mjs). Probed on load.
  aiEndpoint: "/.netlify/functions/ai",
  integrations: {
    professionals: true,    // clinic team pages (only verified profiles are shown)
    messaging: false,       // secure clinician messaging
    payments: false,        // consultation fees / deposits
    productCatalogue: false // verified product database / barcode lookup
  }
};

/* ---------- 2. Utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, "0");
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowISO = () => new Date().toISOString();
const fmtDate = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) => { if (!iso) return "—"; const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso); return isNaN(d) ? "—" : d.toLocaleDateString(undefined, opts); };
const fmtTime = iso => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split("."); let t = o; ks.slice(0, -1).forEach(k => { if (t[k] == null || typeof t[k] !== "object") t[k] = {}; t = t[k]; }); t[ks.at(-1)] = v; };
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const pretty = s => cap1(String(s || "").replace(/_/g, " "));

const I = { // inline icons (stroke)
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9 15c1.5 1.3 4.5 1.3 6 0"/>',
  hair: '<path d="M5 20c0-9 3-15 7-15s7 6 7 15"/><path d="M9 20c0-6 1-10 3-12M15 20c0-6-1-10-3-12"/>',
  studio: '<path d="M9 3h6v4l3 3v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V10l3-3z"/><path d="M6 13h12"/>',
  progress: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>',
  coach: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  learn: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  pro: '<path d="M12 3v6M9 6h6"/><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M9 15h6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15.4H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7M8 20v-6h8v6"/>',
  thumbUp: '<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 2l-1 4h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 1H7"/>',
  thumbDown: '<path d="M7 13V4H4v9zM7 13l4 7a2 2 0 0 0 3-2l-1-4h6a2 2 0 0 0 2-2l-2-7a2 2 0 0 0-2-1H7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  minus: '<path d="M5 12h14"/>',
  logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l7-7"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  log: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.4-1.6-1-2-2l1-1-1-2z"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>'
};
const ic = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ""}</svg>`;

function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  $("#toasts").append(t); setTimeout(() => t.remove(), 3200);
}

/* ---------- 3. Options (shared vocabularies) ---------- */
const OPT = {
  ageRange: ["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Prefer not to say"],
  goals: ["Calmer-looking skin", "More even-looking tone", "Fewer breakouts", "Simpler routine", "Sun protection habit", "Length retention", "Less breakage", "Healthier-feeling scalp", "Defined curls", "Understand my products"],
  skinType: ["Oily", "Dry", "Combination", "Balanced", "Not sure"],
  sensitivity: ["Not sensitive", "Somewhat sensitive", "Very sensitive", "Not sure"],
  tendency: ["Tends to dryness", "Tends to oiliness", "Varies by season", "Neither", "Not sure"],
  dehydration: ["No", "Sometimes feels tight", "Often feels tight", "Not sure"],
  skinConcerns: ["Blemishes", "Redness", "Uneven-looking tone", "Visible pores", "Dry patches", "Flaking", "Oiliness", "Dark spots", "Under-eye appearance", "Texture", "Irritation"],
  curl: ["Straight", "Wavy", "Curly", "Coily", "Mixed patterns", "Not sure"],
  porosity: ["Low", "Medium", "High", "Not sure", "Not assessed"],
  density: ["Low", "Medium", "High", "Not sure"],
  thickness: ["Fine", "Medium", "Coarse", "Not sure"],
  elasticity: ["Stretches and returns", "Stretches, slow to return", "Snaps with little stretch", "Over-stretches / gummy", "Not observed"],
  scalp: ["Oily", "Dry", "Balanced", "Combination", "Not sure"],
  level: ["None", "Mild", "Moderate", "Marked", "Not sure"],
  washFreq: ["More than twice a week", "Twice a week", "Weekly", "Every 2 weeks", "Less often", "Varies"],
  chemical: ["None", "Relaxer / texturiser", "Colour or bleach", "Perm / keratin treatment", "Not sure"],
  heat: ["Rarely or never", "Monthly", "Weekly", "Several times a week"],
  hairConcerns: ["Breakage", "Shedding", "Dryness", "Frizz", "Thinning-looking hairline", "Length retention", "Scalp flaking", "Itchy scalp", "Product buildup", "Heat damage", "Tangles"],
  productCats: ["Cleanser", "Moisturiser", "Sunscreen", "Serum", "Treatment", "Exfoliant", "Mask", "Shampoo", "Conditioner", "Deep conditioner", "Leave-in", "Styler", "Oil", "Scalp care", "Other"],
  productStatus: ["In use", "Unopened", "Paused", "Finished", "Stopped (reaction)"],
  severity: ["Mild", "Moderate", "Severe"],
  areas: ["Face", "Forehead", "Cheeks", "Chin / jaw", "Around eyes", "Lips", "Neck", "Scalp", "Hairline", "Body", "Other"]
};
const SRC = { self: ["self", "Self-reported"], questionnaire: ["self", "Questionnaire"], ai: ["ai", "AI-assisted"], clinician: ["clin", "Clinician-confirmed"] };
const srcChip = s => { const [c, l] = SRC[s] || SRC.self; return `<span class="chip ${c}">${l}</span>`; };
