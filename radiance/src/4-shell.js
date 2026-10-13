
/* ---------- 5. Router, shell, events ---------- */
let PAGES = {};
let R = { page: "home", tab: null, id: null };
let sheet = null; // "notifs" | "more" | null
function go(page, tab = null, id = null) { SURFACE = "app"; R = { page, tab, id }; sheet = null; setHash("app/" + page); render(); window.scrollTo(0, 0); }

const NAV = [
  ["home", "Home", "home"], ["skin", "Skin Lab", "face"], ["hair", "Hair Lab", "hair"], ["studio", "Care Studio", "studio"],
  ["progress", "My Progress", "progress"], ["coach", "Skin & Hair Guide", "coach"], ["learn", "Learn", "learn"], ["pro", "Appointments & care", "pro"], ["settings", "Profile & privacy", "settings"]
];
const BOTTOM = [["home", "Home", "home"], ["skin", "Skin", "face"], ["hair", "Hair", "hair"], ["progress", "Progress", "progress"]];

function applyTheme() {
  const t = S().settings.theme; const r = document.documentElement;
  if (t === "light" || t === "dark") r.setAttribute("data-theme", t); else r.removeAttribute("data-theme");
}

function storePill() {
  if (Store.mode === "cloud") return `<span class="store-pill"><i class="dot ok"></i>Private store · synced</span>`;
  return `<span class="store-pill" title="Records are saved only in this browser"><i class="dot warn"></i>Saved in this browser only</span>`;
}

function renderApp() {
  applyTheme();
  const app = $("#app");
  const scrollY = window.scrollY;
  if (!S().onboarded) { app.className = ""; app.innerHTML = renderOnboarding(); return; }
  app.className = "app";
  const pageFn = PAGES[R.page] || PAGES.home;
  const notifs = notifications().filter(n => !S().readNotifs.includes(n.id));
  app.innerHTML = `
  <nav class="rail" aria-label="Main">
    <button class="brand brand-btn" data-a="site" data-path="" aria-label="RADIANCE website">${brandLockup("Patient portal")}</button>
    ${NAV.map(([k, l, i], n) => (n === 6 ? '<div class="sep"></div>' : "") + `<button class="nav-btn" data-a="go" data-page="${k}" ${R.page === k ? 'aria-current="page"' : ""}>${ic(i)}${l}</button>`).join("")}
    <div class="foot stack" style="gap:8px"><button class="nav-btn" data-a="site" data-path="book">${ic("calendar")}Book an appointment</button><button class="nav-btn" data-a="site" data-path="">${ic("globe")}Clinic website</button>${storePill()}</div>
  </nav>
  <main id="main">
    <div class="topbar">
      <div class="row"><button class="m-brand" data-a="site" data-path="" aria-label="RADIANCE website">${logoImg(30)}</button><div class="label">${esc(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }))}</div></div>
      <div class="actions">
        <button class="icon-btn" data-a="openSearch" aria-label="Search">${ic("search")}</button>
        <button class="icon-btn" data-a="cycleTheme" aria-label="Change theme (now ${S().settings.theme})">${ic("moon")}</button>
        <button class="icon-btn" data-a="toggleSheet" data-sheet="notifs" aria-label="Reminders, ${notifs.length} unread">${ic("bell")}${notifs.length ? `<span class="badge">${notifs.length}</span>` : ""}</button>
      </div>
    </div>
    ${portalBanner()}${S().example ? `<div class="notice warn" style="margin-bottom:16px">${ic("info")}<div class="grow">You're looking at <b>example data</b>, not a real person's records. <button class="btn sm" data-a="clearExample" style="margin-left:6px">Clear example data</button></div></div>` : ""}
    ${pageFn()}
  </main>
  <nav class="bottom" aria-label="Main">
    ${BOTTOM.map(([k, l, i]) => `<button data-a="go" data-page="${k}" ${R.page === k ? 'aria-current="page"' : ""}>${ic(i)}${l}</button>`).join("")}
    <button data-a="toggleSheet" data-sheet="more" ${["studio", "coach", "learn", "pro", "settings"].includes(R.page) ? 'aria-current="page"' : ""}>${ic("more")}More</button>
  </nav>
  ${sheet === "notifs" ? notifSheet(notifs) : ""}
  ${sheet === "more" ? `<div class="sheet" style="top:auto;bottom:80px">${NAV.filter(n => !BOTTOM.find(b => b[0] === n[0])).map(([k, l, i]) => `<button class="nav-btn" data-a="go" data-page="${k}">${ic(i)}${l}</button>`).join("")}<button class="nav-btn" data-a="site" data-path="book">${ic("calendar")}Book an appointment</button><button class="nav-btn" data-a="site" data-path="">${ic("globe")}Clinic website</button><div style="padding:8px 10px 0">${storePill()}</div></div>` : ""}`;
  if (R.restoreScroll) { window.scrollTo(0, scrollY); R.restoreScroll = false; }
  afterRender.forEach(f => f()); afterRender.length = 0; hydratePhotos();
}
const afterRender = [];
const rerenderKeep = () => { R.restoreScroll = true; render(); };

/* Modal */
function openModal(html, wide = false) {
  closeModal();
  const s = document.createElement("div"); s.className = "scrim"; s.id = "scrim";
  s.innerHTML = `<div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div>`;
  s.addEventListener("click", e => { if (e.target === s) closeModal(); });
  document.body.append(s);
  const f = s.querySelector("input,select,textarea,button.primary"); if (f) f.focus();
}
function closeModal() { $("#scrim")?.remove(); }
function confirmBox(title, body, okLabel, onOk, danger = true) {
  ACTIONS.__confirm = () => { closeModal(); onOk(); };
  openModal(`<h3>${esc(title)}</h3><p class="muted" style="margin:10px 0 20px">${body}</p>
    <div class="row" style="justify-content:flex-end"><button class="btn" data-a="closeModal">Cancel</button><button class="btn ${danger ? "danger" : "primary"}" data-a="__confirm">${esc(okLabel)}</button></div>`);
}

/* Notifications derived from real records only */
function notifications() {
  const out = [], s = S(), t = dayKey();
  s.products.forEach(p => {
    if (p.expiresAt && p.status !== "Finished") { const d = daysBetween(t, p.expiresAt);
      if (d <= 30) out.push({ id: `exp-${p.id}-${p.expiresAt}`, text: d < 0 ? `${p.name} passed its expiry date (${fmtDate(p.expiresAt)})` : `${p.name} expires ${fmtDate(p.expiresAt)}`, page: "studio", tab: "products" }); }
  });
  s.styles.filter(st => !st.removedAt && st.removeBy).forEach(st => { const d = daysBetween(t, st.removeBy);
    if (d <= 7) out.push({ id: `sty-${st.id}`, text: d < 0 ? `${st.style}: planned removal date has passed` : `${st.style}: planned removal in ${d} day${d === 1 ? "" : "s"}`, page: "studio", tab: "styles" }); });
  todaysRoutines().filter(r => r.area === "hair" && r.type === "Wash day").forEach(r => out.push({ id: `wash-${r.id}-${t}`, text: `Wash day today: ${r.name}`, page: "studio", tab: "routines" }));
  s.appointments.filter(a => a.date >= t && daysBetween(t, a.date) <= 7).forEach(a => out.push({ id: `appt-${a.id}`, text: `Appointment you logged: ${a.with || "clinician"} on ${fmtDate(a.date)}`, page: "pro", tab: "appts" }));
  myBookings().filter(b => b.status === "confirmed" && b.date >= t && daysBetween(t, b.date) <= 7).forEach(b => out.push({ id: `bk-${b.id}-${b.date}-${b.time}`, text: `Appointment at RADIANCE: ${fmtDate(b.date)}${b.time ? " at " + b.time : ""}`, page: "pro", tab: "appts" }));
  myCarePlans().forEach(p => { if (p.followUp && p.followUp >= t && daysBetween(t, p.followUp) <= 7) out.push({ id: `cp-${p.id}-${p.followUp}`, text: `Follow-up from your care plan: ${fmtDate(p.followUp)}`, page: "pro", tab: "plans" }); });
  return out;
}
function notifSheet(list) {
  return `<div class="sheet" role="dialog" aria-label="Reminders"><div class="spread" style="margin-bottom:8px"><h3>Reminders</h3>${list.length ? `<button class="btn sm ghost" data-a="readAll">Mark all read</button>` : ""}</div>
  ${list.length ? `<div class="list">${list.map(n => `<div class="li"><div class="grow small">${esc(n.text)}</div><button class="btn sm" data-a="openNotif" data-id="${n.id}" data-page="${n.page}" data-tab="${n.tab}">Open</button></div>`).join("")}</div>`
    : `<p class="muted small">Nothing due. Reminders come from dates you've entered: product expiry, protective-style removal, wash days and appointments you've logged.</p>`}
  <p class="muted small" style="margin-top:10px">Reminders appear here while the app is open. Push and email delivery need a notification service (see README).</p></div>`;
}

function todaysRoutines() {
  const wd = new Date().getDay();
  return S().routines.filter(r => !r.archived && (!r.days?.length || r.days.includes(wd)));
}

/* Events */
const ACTIONS = {};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-a]"); if (!el) { if (sheet && !e.target.closest(".sheet")) { sheet = null; rerenderKeep(); } return; }
  const fn = ACTIONS[el.dataset.a]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.bind) {
    const path = el.dataset.bind; const prev = getPath(S(), path);
    let v = el.type === "checkbox" ? el.checked : el.value;
    if (el.dataset.list === "csv") v = v.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    setPath(S(), path, v); trackChange(path, prev, v); commit(!!el.dataset.rerender);
  }
  if (el.id === "cam-input" || el.id === "cam-input-env" || el.id === "file-input") { const f = el.files?.[0]; el.value = ""; if (f) handleImageFile(f); }
  if (el.id === "import-input") { const f = el.files?.[0]; el.value = ""; if (f) importData(f); }
});
document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset.filter) { // client-side live filter without re-render
    const q = el.value.toLowerCase().trim();
    document.querySelectorAll(`[data-filter-item="${el.dataset.filter}"]`).forEach(n => { n.hidden = q && !n.dataset.text.includes(q); });
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if ($("#scrim")) closeModal(); else if (sheet) { sheet = null; rerenderKeep(); } }
  if (e.key === "Enter" && !e.shiftKey && e.target.id === "chat-input") { e.preventDefault(); ACTIONS.sendChat(); }
  if (e.key === "Enter" && e.target.id === "dash-ask") { e.preventDefault(); ACTIONS.dashAsk(); }
});

const TRACKED = /^(skin|hair)\.(?!history|regionNotes|lengths|src)/;
function trackChange(path, from, to) {
  if (!S().onboarded || !TRACKED.test(path)) return;
  const area = path.split(".")[0]; const h = S()[area].history;
  const field = path.split(".").slice(1).join(".");
  if (JSON.stringify(from) === JSON.stringify(to)) return;
  S()[area].src[field] = S()[area].src[field] === "ai" || S()[area].src[field] === "clinician" ? "self" : (S()[area].src[field] || "self");
  h.unshift({ at: nowISO(), field, from: Array.isArray(from) ? from.join(", ") : from, to: Array.isArray(to) ? to.join(", ") : to });
  h.length = Math.min(h.length, 120);
}

Object.assign(ACTIONS, {
  go: el => go(el.dataset.page, el.dataset.tab || null, el.dataset.id || null),
  tab: el => { R.tab = el.dataset.tab; R.id = null; render(); },
  closeModal: () => closeModal(),
  copyArea: () => { const t = $("#copy-area"); t.select(); copyText(t.value); },
  cycleTheme: () => { const o = ["system", "light", "dark"]; const s = S().settings; s.theme = o[(o.indexOf(s.theme) + 1) % 3]; toast("Theme: " + s.theme); commit(); },
  toggleSheet: el => { sheet = sheet === el.dataset.sheet ? null : el.dataset.sheet; rerenderKeep(); },
  readAll: () => { notifications().forEach(n => S().readNotifs.push(n.id)); sheet = null; commit(); },
  openNotif: el => { S().readNotifs.push(el.dataset.id); Store.save(); go(el.dataset.page, el.dataset.tab); },
  pick: el => { // single or multi choice chips bound to a path
    const p = el.dataset.path, v = el.dataset.val, prev = getPath(S(), p);
    let next;
    if (el.dataset.multi) { const arr = Array.isArray(prev) ? [...prev] : []; const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); next = arr; }
    else next = prev === v ? "" : v;
    setPath(S(), p, next); trackChange(p, prev, next); commit(false); rerenderKeep();
  },
  clearExample: () => confirmBox("Clear example data?", "This removes the example profile and starts onboarding fresh.", "Clear", async () => { await Store.wipe(); commit(); })
});

/* Form helpers */
const choices = (path, opts, multi = false) => {
  const cur = getPath(S(), path);
  return `<div class="choice-grid" role="group">${opts.map(o => { const on = multi ? (cur || []).includes(o) : cur === o;
    return `<button type="button" class="choice" aria-pressed="${on}" data-a="pick" data-path="${path}" data-val="${esc(o)}" ${multi ? 'data-multi="1"' : ""}>${esc(o)}</button>`; }).join("")}</div>`;
};
const chipsPick = (path, opts, multi = true) => {
  const cur = getPath(S(), path);
  return `<div class="row" style="gap:6px">${opts.map(o => { const on = multi ? (cur || []).includes(o) : cur === o;
    return `<button type="button" class="chip toggle-chip" aria-pressed="${on}" data-a="pick" data-path="${path}" data-val="${esc(o)}" ${multi ? 'data-multi="1"' : ""}>${esc(o)}</button>`; }).join("")}</div>`;
};
const sel = (path, opts, label, hint = "", rerender = true) => {
  const cur = getPath(S(), path) || ""; const id = "f-" + path.replace(/\./g, "-");
  return `<label class="field" for="${id}"><span>${label}</span><select id="${id}" data-bind="${path}" ${rerender ? 'data-rerender="1"' : ""}><option value="">Not recorded</option>${opts.map(o => `<option ${o === cur ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>${hint ? `<small>${hint}</small>` : ""}</label>`;
};
const txt = (path, label, hint = "", ph = "", area = false) => {
  const cur = getPath(S(), path) ?? ""; const id = "f-" + path.replace(/\./g, "-");
  return `<label class="field" for="${id}"><span>${label}</span>${area ? `<textarea id="${id}" data-bind="${path}" placeholder="${esc(ph)}">${esc(cur)}</textarea>` : `<input type="text" id="${id}" data-bind="${path}" value="${esc(cur)}" placeholder="${esc(ph)}">`}${hint ? `<small>${hint}</small>` : ""}</label>`;
};
const pageHead = (eyebrow, title, sub = "", right = "") => `<div class="page-h"><div><div class="label">${eyebrow}</div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>${right ? `<div class="row">${right}</div>` : ""}</div>`;
const tabs = (list, cur) => `<div class="tabs" role="tablist">${list.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${cur === k}" data-a="tab" data-tab="${k}">${l}</button>`).join("")}</div>`;
const emptyBox = (msg, btn = "") => `<div class="empty">${msg}${btn}</div>`;
