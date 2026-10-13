
/* ---------- 4. State + persistence ----------
   Cloud mode: claude.ai artifact `db`, private per signed-in person (data/users/<id>).
   Local mode: this browser only (development persistence; not for production health records).
   Photos are stored as separate small JPEG records, never inside the main state document. */
const freshState = () => ({
  version: 1, onboarded: false, example: false, createdAt: nowISO(), patientId: uid(),
  profile: { name: "", ageRange: "", country: "", units: "metric", goals: [] },
  consent: { photos: false, ai: false, coachContext: true, history: [] },
  skin: { type: "", sensitivity: "", tendency: "", dehydration: "", allergies: "", concerns: [], goals: "", preferred: "", notes: "", src: {}, regionNotes: {}, history: [] },
  hair: { curl: "", curlDetail: "", porosity: "", density: "", thickness: "", elasticity: "", length: "", desiredLength: "", shrinkage: "",
    scalp: { type: "", oiliness: "", dryness: "", flaking: "", itch: "", sensitivity: "", buildup: "", notes: "" },
    chemical: "", colour: "", heat: "", washFreq: "", protective: "", detangling: "", concerns: [], goals: "", notes: "", src: {}, lengths: [], history: [] },
  assessments: [], routines: [], completions: {}, products: [], reactions: [], journal: [], questions: [], styles: [], appointments: [],
  chat: [], aiFeedback: [], savedArticles: [], readNotifs: [],
  settings: { theme: "system", dashHidden: [] }
});

const Store = {
  mode: "local", state: freshState(), db: null, uid: null, saving: false, pending: false, timer: null, lastError: null,
  LS: "radiance:v1",
  loadLocal() {
    try { const raw = localStorage.getItem(this.LS); if (raw) this.state = Object.assign(freshState(), JSON.parse(raw)); } catch (e) { /* storage blocked */ }
  },
  async connectCloud() { // claude.ai private store (when this page runs as a claude.ai artifact)
    if (!window.claude?.use || Backend.configured) return;
    try {
      const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      this.db = db; this.uid = id; await this.attach("cloud");
    } catch (e) { this.lastError = e?.code || "unavailable"; render(); }
  },
  async onAuth() { // Supabase account signed in or out
    if (!Backend.user) { this.mode = "local"; return; }
    try { await this.attach("account"); } catch (e) { this.lastError = "unavailable"; toast("Couldn't load your records. Check your connection."); }
  },
  async attach(mode) {
    const snap = await this.ref("state").get();
    const cloud = snap.exists ? snap.data() : null;
    if (cloud && cloud.json) this.state = Object.assign(freshState(), JSON.parse(cloud.json));
    else if (this.state.onboarded && !this.state.example) { // first sign-in: move this device's records into the account
      await this.ref("state").set({ json: JSON.stringify(this.state), updatedAt: nowISO() });
      for (const a of this.state.assessments) for (const pid of a.photoIds || []) { const d = this.localPhoto(pid); if (d) await this.ref("photo_" + pid).set({ dataUrl: d, at: a.at }); }
    } else this.state = freshState();
    if (Backend.user) { this.state.patientId = Backend.user.id; if (!this.state.profile.name) this.state.profile.name = Backend.user.user_metadata?.name || ""; }
    this.mode = "cloud"; render();
  },
  ref(key) { return Backend.sb && Backend.user ? Backend.doc(key) : this.db.collection("data/users/" + this.uid).doc(key); },
  save() { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 450); },
  async flush() {
    const json = JSON.stringify(this.state);
    try { localStorage.setItem(this.LS, json); } catch (e) {}
    if (this.mode !== "cloud") return;
    if (this.saving) { this.pending = true; return; }
    this.saving = true;
    try {
      if (json.length > 240000) { toast("Your record is near the storage limit. Export a backup and clear old chat history."); }
      await this.ref("state").set({ json, updatedAt: nowISO() }); this.lastError = null;
    } catch (e) { this.lastError = e?.code || "write_failed"; toast("Couldn't save to your private store. Your changes are kept in this browser for now."); }
    this.saving = false;
    if (this.pending) { this.pending = false; this.flush(); }
  },
  localPhoto(id) { try { return localStorage.getItem("radiance:photo:" + id); } catch (e) { return null; } },
  async putPhoto(id, dataUrl, at) {
    if (this.mode === "cloud") { await this.ref("photo_" + id).set({ dataUrl, at }); return; }
    try { localStorage.setItem("radiance:photo:" + id, dataUrl); }
    catch (e) { const err = new Error("Browser storage is full. Export your data and delete older photos."); err.code = "quota"; throw err; }
  },
  photoCache: {},
  async getPhoto(id) {
    if (this.photoCache[id]) return this.photoCache[id];
    let d = null;
    if (this.mode === "cloud") { try { const s = await this.ref("photo_" + id).get(); d = s.exists ? s.data().dataUrl : null; } catch (e) {} }
    if (!d) d = this.localPhoto(id);
    if (d) this.photoCache[id] = d; return d;
  },
  async deletePhoto(id) {
    delete this.photoCache[id];
    try { localStorage.removeItem("radiance:photo:" + id); } catch (e) {}
    if (this.mode === "cloud") { try { await this.ref("photo_" + id).delete(); } catch (e) {} }
  },
  async wipe() {
    for (const a of this.state.assessments) for (const p of a.photoIds || []) await this.deletePhoto(p);
    try { Object.keys(localStorage).filter(k => k.startsWith("radiance:photo:") || k === this.LS).forEach(k => localStorage.removeItem(k)); } catch (e) {}
    if (this.mode === "cloud") await this.ref("state").delete();
    const keepId = Backend.user?.id;
    this.state = freshState(); if (keepId) this.state.patientId = keepId;
  }
};
const S = () => Store.state;
const commit = (rerender = true) => { Store.save(); if (rerender) render(); };

/* Capabilities that may be missing (outside claude.ai, or declined) */
const Cap = {
  sample: undefined, downloads: undefined, imgOK: false,
  async init() {
    if (!window.claude?.use) { this.downloads = null; this.sample = await serverAI(); this.imgOK = !!this.sample; render(); return; }
    claude.use("sample").then(async s => { this.sample = s; if (s) { try { const l = await s.limits(); this.imgOK = !!l.images; } catch (e) { this.imgOK = false; } } render(); });
    claude.use("downloads").then(d => { this.downloads = d; });
  }
};
const AI_ERR = {
  not_granted: "AI access was declined for this page. You can still save photos and record observations yourself.",
  rate_limited: "The AI service is busy or you've reached a usage limit. Try again in a little while.",
  images_unavailable: "Image analysis isn't available in this view.",
  image_rejected: "That image couldn't be read. Try a JPEG or PNG under 20 MB.",
  invalid_json: "The analysis came back in an unexpected format, so nothing was saved as a finding. Try again.",
  invalid_response: "The analysis was incomplete, so no findings were recorded. Try again.",
  cancelled: "Analysis cancelled.",
  prompt_too_large: "Too much context was sent. Clear older chat messages and try again.",
  unavailable: "AI analysis isn't switched on for this website yet. You can still save photos and record observations yourself.",
  network: "The AI service couldn't be reached. Check your connection and try again.",
  provider_error: "The AI service had a problem. Nothing was saved. Try again in a moment.",
  disabled: "The clinic has turned this AI feature off for now. You can still save photos and record observations yourself."
};
const aiErr = e => AI_ERR[e?.code] || AI_ERR[e?.message] || "The AI request failed. Try again.";

async function saveFile(filename, data) {
  if (!window.claude) { // ordinary website: a normal browser download works
    try { const url = URL.createObjectURL(new Blob([data], { type: filename.endsWith(".json") ? "application/json" : "text/html" })); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast("Downloading " + filename); return; } catch (e) {}
  }
  if (Cap.downloads) {
    try { const r = await Cap.downloads.save({ filename, data }); if (r.status === "saved") toast("Saved " + filename); return; }
    catch (e) { if (e?.code === "cancelled" || e?.code === "declined") return; }
  }
  openModal(`<div class="spread"><h3>Copy your file</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    <p class="muted small" style="margin:8px 0 12px">Saving files isn't available here. Copy the contents and save them as <span class="mono">${esc(filename)}</span>.</p>
    <textarea id="copy-area" style="min-height:260px" readonly>${esc(typeof data === "string" ? data : "")}</textarea>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-a="copyArea">${ic("copy")} Copy</button></div>`);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast("Copied"); } catch (e) { toast("Copy isn't allowed here. Select the text and copy it manually."); }
}
