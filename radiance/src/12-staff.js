
/* ============================================================
   STAFF CONSOLE: clinicians, administrators, support staff
   With Supabase configured: real sign-in, roles from the staff_roles table, data under RLS.
   Without it: a clearly labelled demo on this device, with a role picker.
   Least privilege: administrators manage the clinic but can't open clinical records;
   clinicians see patients only through bookings that shared information with the clinic.
   ============================================================ */
const PERM = {
  clinician: ["overview", "appointments", "patients"],
  admin: ["overview", "appointments", "enquiries", "content", "photos", "gallery", "services", "shop", "team", "learn", "campaigns", "schedule", "staff", "ai", "reports", "audit"],
  support: ["overview", "appointments", "enquiries"]
};
const ST_NAV = [["overview", "Overview", "home"], ["appointments", "Appointments", "calendar"], ["patients", "Patients", "users"], ["enquiries", "Enquiries", "mail"],
  ["content", "Website & contact", "globe"], ["photos", "Photos", "camera"], ["gallery", "Before & after", "eye"], ["services", "Services", "studio"], ["shop", "Shop", "bag"], ["team", "Clinical team", "pro"], ["learn", "Articles", "learn"], ["campaigns", "Campaigns", "sparkle"],
  ["schedule", "Scheduling", "clock"], ["staff", "Staff & roles", "shield"], ["ai", "AI settings", "coach"], ["reports", "Reports", "progress"], ["audit", "Audit log", "log"]];
const ROLE_LABEL = { clinician: "Clinician", admin: "Administrator", support: "Support staff" };
const Staff = {
  session: null, view: "list", filter: "active", patientKey: null,
  load() { if (!Backend.configured) this.session = lsGet(LSK.staff); },
  can(p) { return !!this.session && PERM[this.session.role]?.includes(p); }
};
Staff.load();

function renderStaff() {
  applyTheme();
  const app = $("#app"); app.className = "staff"; document.title = "Staff console · RADIANCE";
  if (!Staff.session) { app.className = "site"; app.innerHTML = staffGate(); return; }
  let p = SR.staffPage; if (!Staff.can(p)) p = SR.staffPage = "overview";
  app.innerHTML = `<nav class="st-rail" aria-label="Staff">
    <div style="padding:2px 6px 16px">${brandLockup("Staff console")}</div>
    ${ST_NAV.filter(([k]) => Staff.can(k)).map(([k, l, i]) => `<button class="nav-btn" data-a="stGo" data-p="${k}" ${p === k ? 'aria-current="page"' : ""}>${ic(i)}${l}</button>`).join("")}
    <div class="sep" style="background:rgba(255,255,255,.12)"></div>
    <div class="foot stack" style="gap:6px;margin-top:auto"><button class="nav-btn" data-a="site" data-path="">${ic("globe")}View website</button><button class="nav-btn" data-a="stOut">${ic("x")}Sign out</button></div></nav>
  <main class="st-main" id="main"><div class="st-top"><div><div class="label">${esc(ROLE_LABEL[Staff.session.role])} · ${esc(Staff.session.name)}</div></div>
    <div class="row">${Backend.sb ? `<span class="chip ok">Live database</span>` : `<span class="demo-flag">Demo console · data on this device only</span>`}<button class="icon-btn" data-a="sTheme" aria-label="Change theme">${ic("moon")}</button></div></div>
    ${(ST_PAGES[p] || ST_PAGES.overview)()}</main>`;
  afterRender.forEach(f => f()); afterRender.length = 0;
}
function staffGate() {
  if (Backend.configured) return `<div class="ob" style="max-width:460px;padding-top:60px"><div style="margin-bottom:24px">${brandLockup("Staff console")}</div>
    <div class="card raised stack"><h2>Staff sign-in</h2>${!Backend.ready ? `<p class="muted"><span class="spinner" style="display:inline-block"></span> Connecting…</p>` : Backend.error ? `<div class="notice err">${ic("warn")}<span class="small">${esc(Backend.error)}</span></div>` : `
      <form id="st-login" class="stack"><label class="field" for="st-email"><span>Work email</span><input type="email" id="st-email" autocomplete="username" required></label>
      <label class="field" for="st-pass"><span>Password</span><input type="password" id="st-pass" autocomplete="current-password" required></label>
      <p id="st-msg" class="err-text" hidden></p><button class="btn primary" type="submit">Sign in</button></form>`}
      <button class="btn ghost sm" data-a="site" data-path="">Back to website</button></div></div>`;
  return `<div class="ob" style="max-width:820px;padding-top:48px"><div style="margin-bottom:24px">${brandLockup("Staff console")}</div>
    <div class="card raised stack"><span class="demo-flag" style="align-self:flex-start">Demo mode</span><h2>Explore the staff console</h2>
    <p class="muted">This copy of the platform isn't connected to the clinic's secure database, so there's no real staff sign-in yet. Choose a role to explore what each person can do. Everything you change stays on this device.</p>
    <div class="grid g3">${[["clinician", "Appointments, authorised patient records, AI assessment review, clinical notes and care plans."], ["admin", "Website content, services, team, articles, campaigns, scheduling, staff roles, AI settings, reports and audit log. No access to clinical records."], ["support", "Appointments and enquiries only."]].map(([r, d]) => `<button class="card" style="text-align:left;cursor:pointer" data-a="stDemo" data-r="${r}"><h3>${ROLE_LABEL[r]}</h3><p class="muted small" style="margin-top:6px">${d}</p></button>`).join("")}</div>
    <button class="btn ghost sm" style="align-self:flex-start" data-a="site" data-path="">Back to website</button></div></div>`;
}
document.addEventListener("submit", async e => {
  if (e.target.id !== "st-login") return; e.preventDefault();
  const m = $("#st-msg"); m.hidden = true;
  try {
    await Backend.signIn($("#st-email").value.trim(), $("#st-pass").value);
    const { data } = await Backend.sb.from("staff_roles").select("role,name,active").eq("user_id", Backend.user.id).maybeSingle();
    if (!data || !data.active) { await Backend.signOut(); m.hidden = false; m.textContent = "This account doesn't have staff access. Ask an administrator."; return; }
    Staff.session = { id: Backend.user.id, name: data.name, role: data.role }; await Backend.pullOps(); audit("Signed in"); render();
  } catch (x) { m.hidden = false; m.textContent = "Sign-in failed. Check your email and password."; }
});
Object.assign(ACTIONS, {
  stGo: el => { SR.staffPage = el.dataset.p; Staff.patientKey = null; setHash("staff/" + el.dataset.p); render(); window.scrollTo(0, 0); },
  stDemo: el => { Staff.session = { id: "demo-" + el.dataset.r, name: "Demo " + ROLE_LABEL[el.dataset.r].toLowerCase(), role: el.dataset.r, demo: true }; lsSet(LSK.staff, Staff.session); audit("Signed in (demo)"); SR.staffPage = "overview"; render(); },
  stOut: async () => { audit("Signed out"); Staff.session = null; try { localStorage.removeItem(LSK.staff); } catch (e) {} if (Backend.sb) await Backend.signOut(); render(); }
});

/* ---------- helpers ---------- */
const stHead = (title, sub = "", right = "") => `<div class="page-h"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>${right ? `<div class="row">${right}</div>` : ""}</div>`;
const bookingsActive = () => Clinic.ops.bookings.filter(b => !["cancelled"].includes(b.status));
const patientKey = b => b.patientId || (b.name + "|" + b.phone).toLowerCase();
const clinName = id => Clinic.c.team.find(t => t.id === id)?.name || "Unassigned";
const cmsIn = (path, label, opts = {}) => { const v = getPath(Clinic.c, path) ?? "", id = "cms-" + path.replace(/\W/g, "-");
  return `<label class="field" for="${id}"><span>${label}</span>${opts.area ? `<textarea id="${id}" data-cms="${path}">${esc(v)}</textarea>` : `<input type="${opts.type || "text"}" id="${id}" data-cms="${path}" value="${esc(v)}">`}${opts.hint ? `<small>${opts.hint}</small>` : ""}</label>`; };
document.addEventListener("change", e => {
  const el = e.target; if (!el.dataset.cms) return;
  let v = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) : el.value;
  setPath(Clinic.c, el.dataset.cms, v); Clinic.saveContent("Edited " + el.dataset.cms); toast("Saved"); if (el.dataset.rr) render();
});
const when = b => `${b.date ? fmtDate(b.date) : "Date TBC"}${b.time ? " " + b.time : b.window ? " · " + b.window : ""}`;

/* ---------- pages ---------- */
const ST_PAGES = {
  overview() {
    const t = dayKey(), today = bookingsActive().filter(b => b.date === t && b.status === "confirmed").sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const pending = Clinic.ops.bookings.filter(b => b.status === "requested"), enq = Clinic.ops.enquiries.filter(x => x.status === "new");
    const toReview = Clinic.ops.bookings.filter(b => b.status !== "cancelled" && b.shared?.some(s => !Clinic.ops.reviews.some(r => r.assessmentId === s.id && r.bookingId === b.id)));
    const fu = Clinic.ops.carePlans.filter(p => p.followUp && p.followUp >= t && daysBetween(t, p.followUp) <= 7);
    const r = Staff.session.role;
    return stHead(`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}`, fmtDate(t, { weekday: "long", day: "numeric", month: "long", year: "numeric" })) + `
    <div class="grid g4" style="margin-bottom:18px"><div class="stat"><span class="label">Today's appointments</span><b>${today.length}</b></div><div class="stat"><span class="label">Requests to confirm</span><b>${pending.length}</b></div>
      ${r === "clinician" ? `<div class="stat"><span class="label">Shared assessments to review</span><b>${toReview.length}</b></div><div class="stat"><span class="label">Follow-ups this week</span><b>${fu.length}</b></div>` : `<div class="stat"><span class="label">New enquiries</span><b>${enq.length}</b></div><div class="stat"><span class="label">Bookings this month</span><b>${Clinic.ops.bookings.filter(b => b.at.slice(0, 7) === t.slice(0, 7)).length}</b></div>`}</div>
    <div class="grid g2"><section class="card"><div class="card-h"><h3>Today</h3><button class="btn sm" data-a="stGo" data-p="appointments">All appointments</button></div>${today.length ? `<div class="list">${today.map(apRow).join("")}</div>` : `<p class="muted small">No confirmed appointments today.</p>`}</section>
      <section class="card"><div class="card-h"><h3>Booking requests</h3></div>${pending.length ? `<div class="list">${pending.slice(0, 6).map(apRow).join("")}</div>` : `<p class="muted small">No requests waiting. New online bookings appear here${Backend.sb ? "" : Forms.available ? " (and in the clinic's Netlify Forms inbox)" : ""}.</p>`}</section>
      ${r === "clinician" ? `<section class="card"><div class="card-h"><h3>Assessments to review</h3></div>${toReview.length ? `<div class="list">${toReview.slice(0, 6).map(b => `<div class="li"><div class="grow"><b>${esc(b.name)}</b><br><span class="muted small">${b.shared.length} shared · ${when(b)}</span></div><button class="btn sm" data-a="stPatient" data-k="${esc(patientKey(b))}">Open record</button></div>`).join("")}</div>` : `<p class="muted small">Nothing waiting for review.</p>`}</section>
        <section class="card"><div class="card-h"><h3>Follow-ups due</h3></div>${fu.length ? `<div class="list">${fu.map(p => `<div class="li small"><div class="grow"><b>${esc(p.patientName)}</b> · ${esc(p.concern)}</div><span class="mono">${fmtDate(p.followUp)}</span></div>`).join("")}</div>` : `<p class="muted small">No care-plan reviews in the next 7 days.</p>`}</section>` : ""}
    </div>${!Backend.sb ? `<p class="muted small" style="margin-top:18px">Demo note: this console shows bookings and enquiries made in this browser. On the live system, every device shares one secure database.</p>` : ""}`;
  },
  appointments() {
    const f = Staff.filter, list = Clinic.ops.bookings.filter(b => f === "all" || (f === "active" ? ["requested", "confirmed"].includes(b.status) : b.status === f)).sort((a, b) => (a.date || "9").localeCompare(b.date || "9") || (a.time || "").localeCompare(b.time || ""));
    const filt = [["active", "Active"], ["requested", "Requests"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All"]];
    return stHead("Appointments", "Confirm requests, reschedule, assign clinicians and record outcomes.", `<button class="btn" data-a="stView">${Staff.view === "list" ? "Week view" : "List view"}</button><button class="btn primary" data-a="stNewAppt">${ic("plus")} Phone booking</button>`) +
    `<div class="row" style="gap:6px;margin-bottom:14px">${filt.map(([k, l]) => `<button class="chip toggle-chip" aria-pressed="${f === k}" data-a="stFilter" data-f="${k}">${l}</button>`).join("")}</div>` +
    (Staff.view === "week" ? weekView() : list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Patient</th><th>Appointment</th><th>Clinician</th><th>Status</th><th></th></tr></thead><tbody>${list.map(b => `<tr><td class="num">${when(b)}</td><td><b>${esc(b.name)}</b><br><span class="muted small">${esc(b.phone)}</span></td><td>${esc(Clinic.type(b.typeId)?.name || "")}${b.shared?.length ? `<br><span class="chip ai">${b.shared.length} shared</span>` : ""}</td><td>${esc(clinName(b.clin))}</td><td>${bookingChip(b)}</td><td><button class="btn sm" data-a="stAppt" data-id="${b.id}">Open</button></td></tr>`).join("")}</tbody></table></div>` : emptyBox("No appointments match this filter."));
  },
  patients() {
    const groups = {}; Clinic.ops.bookings.forEach(b => { const k = patientKey(b); (groups[k] = groups[k] || []).push(b); });
    if (Staff.patientKey && groups[Staff.patientKey]) return patientRecord(Staff.patientKey, groups[Staff.patientKey]);
    const keys = Object.keys(groups);
    return stHead("Patients", "People who have booked with the clinic. You see only what each patient chose to share.") + (keys.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Patient</th><th>Contact</th><th>Visits</th><th>Shared assessments</th><th>Care plans</th><th></th></tr></thead><tbody>${keys.map(k => { const bs = groups[k], b = bs[0]; return `<tr><td><b>${esc(b.name)}</b>${b.patientId ? `<br><span class="chip">App user</span>` : ""}</td><td class="small">${esc(b.phone)}<br>${esc(b.email || "")}</td><td class="num">${bs.length}</td><td class="num">${bs.reduce((n, x) => n + (x.shared?.length || 0), 0)}</td><td class="num">${Clinic.ops.carePlans.filter(p => p.patientKey === k).length}</td><td><button class="btn sm" data-a="stPatient" data-k="${esc(k)}">Open record</button></td></tr>`; }).join("")}</tbody></table></div>` : emptyBox("No patients yet. Records appear when someone books."));
  },
  enquiries() {
    const l = Clinic.ops.enquiries;
    return stHead("Enquiries", "Messages from the website contact form.") + (l.length ? `<div class="stack">${l.map(q => `<div class="card"><div class="spread"><div><b>${esc(q.name)}</b> <span class="muted small">${esc(q.email)} ${q.phone ? "· " + esc(q.phone) : ""}</span><br><span class="label">${esc(q.category)} · ${fmtDate(q.at)} ${fmtTime(q.at)} · ${esc(q.ref)}</span></div><span class="chip ${q.status === "new" ? "warn" : "ok"}">${q.status === "new" ? "New" : q.status === "replied" ? "Replied" : "Closed"}</span></div><p style="margin-top:10px;white-space:pre-wrap">${esc(q.message)}</p>
      <div class="row" style="margin-top:10px">${q.status === "new" ? `<button class="btn sm" data-a="stEnq" data-id="${q.id}" data-s="replied">Mark replied</button>` : ""}${q.status !== "closed" ? `<button class="btn sm ghost" data-a="stEnq" data-id="${q.id}" data-s="closed">Close</button>` : ""}<a class="btn sm ghost" href="mailto:${esc(q.email)}">Reply by email</a></div></div>`).join("")}</div>` : emptyBox("No enquiries yet."));
  },
  content() {
    const i = Clinic.c.info;
    return stHead("Website & contact", "Edit what visitors see. Changes save as you go.", `<button class="btn" data-a="cmsExport">${ic("save")} Export content.json</button><button class="btn" data-a="cmsImportPick">${ic("upload")} Import</button>`) + `
    <div class="notice" style="margin-bottom:16px">${ic("info")}<div class="small">${Backend.sb ? "Changes publish to the live website for everyone." : "Demo: edits show on this device straight away. To publish for everyone, export content.json and add it to the website files (see README), or connect the database."}</div></div>
    <div class="grid g2"><section class="card stack"><h3>Announcement bar</h3><label class="row small"><input type="checkbox" data-cms="announcement.on" data-rr="1" ${Clinic.c.announcement.on ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Show announcement</label>${cmsIn("announcement.text", "Text")}<div class="grid g2">${cmsIn("announcement.linkLabel", "Button label")}${cmsIn("announcement.link", "Button links to", { hint: "e.g. hair-scalp, book, services/acne" })}</div></section>
    <section class="card stack"><h3>Homepage hero</h3>${cmsIn("hero.eyebrow", "Eyebrow")}${cmsIn("hero.title", "Headline")}${cmsIn("hero.text", "Supporting text", { area: true })}
      <div class="row">${Clinic.c.hero.image ? `<img src="${Clinic.c.hero.image}" alt="" class="thumb">` : ""}<button class="btn sm" data-a="cmsImg" data-path="hero.image">${ic("upload")} ${Clinic.c.hero.image ? "Replace" : "Upload"} hero photo</button>${Clinic.c.hero.image ? `<button class="btn sm danger" data-a="cmsImgDel" data-path="hero.image">Remove</button>` : ""}</div><small class="muted">Use a licensed photo. Never use a patient photo without written consent.</small></section>
    <section class="card stack"><h3>Contact details</h3>${cmsIn("info.address", "Address")}<div class="grid g2">${cmsIn("info.phone", "Phone")}${cmsIn("info.whatsapp", "WhatsApp number", { hint: "Digits only with country code, e.g. 23274898964" })}</div><div class="grid g2">${cmsIn("info.email", "Email", { type: "email" })}${cmsIn("info.instagram", "Instagram handle")}</div>${cmsIn("info.mapsQuery", "Map search text")}</section>
    <section class="card stack"><h3>Opening hours</h3>${i.hours.length ? i.hours.map((h, n) => `<div class="row" style="flex-wrap:nowrap">${cmsIn(`info.hours.${n}.days`, "Days")}${cmsIn(`info.hours.${n}.time`, "Hours")}<button class="icon-btn" aria-label="Remove row" data-a="hoursDel" data-n="${n}" style="margin-top:22px">${ic("trash")}</button></div>`).join("") : `<p class="muted small">No hours published. The website asks visitors to call.</p>`}<button class="btn sm" data-a="hoursAdd" style="align-self:flex-start">${ic("plus")} Add row</button></section></div>
    <div class="grid g2" style="margin-top:16px"><section class="card stack"><h3>About page</h3>${cmsIn("about.story", "Our story (blank line between paragraphs)", { area: true })}${cmsIn("about.quote", "Quote banner")}${cmsIn("about.quoteSub", "Quote subline")}
      <div class="grid g2">${Clinic.c.about.values.map((v, n) => `<div class="stack" style="gap:6px">${cmsIn(`about.values.${n}.title`, "Value " + (n + 1))}${cmsIn(`about.values.${n}.text`, "Line")}</div>`).join("")}</div></section>
    <section class="card stack"><h3>Homepage highlights</h3><p class="muted small">The four points under the homepage hero. Only claim what the clinic can stand behind.</p>${Clinic.c.highlights.map((h, n) => `<div class="grid g2">${cmsIn(`highlights.${n}.title`, "Title " + (n + 1))}${cmsIn(`highlights.${n}.text`, "Line")}</div>`).join("")}</section></div>
    <section class="card stack" style="margin-top:16px"><h3>Reset</h3><p class="muted small">Restore the original content that shipped with the site. Bookings and records aren't affected.</p><button class="btn danger sm" style="align-self:flex-start" data-a="cmsReset">Reset website content</button></section>`;
  },
  photos() {
    const keys = Object.keys(CLINIC_DEFAULTS.photos), lbl = k => k.replace(/^svc-/, "Service: ").replace(/^art-/, "Article: ").replace(/^hero/, "Page banner: ").replace(/^tile/, "Gallery tile: ").replace(/([a-z])([A-Z])/g, "$1 $2");
    return stHead("Photos", "Every photo on the website. Replace stock photos with the clinic's own as they become available.") + `
    <div class="notice" style="margin-bottom:16px">${ic("info")}<div class="small">Stock photos come from Unsplash (free licence) and show models, not patients. Upload only photos you own or have permission to use, and never a patient photo without written consent.</div></div>
    <div class="team-grid">${keys.map(k => { const own = (Clinic.c.photos[k] || "").startsWith("data:"); return `<article class="person"><div class="ph" style="aspect-ratio:4/3">${phImg(k, lbl(k), 400)}</div><div class="bd"><b class="small">${esc(lbl(k))}</b><span class="chip ${own ? "ok" : ""}" style="justify-self:start">${own ? "Clinic photo" : "Stock photo"}</span><div class="row" style="margin-top:6px"><button class="btn sm" data-a="cmsImg" data-path="photos.${k}">${ic("upload")} Replace</button>${own ? `<button class="btn sm ghost" data-a="photoReset" data-k="${k}">Use stock</button>` : ""}</div></div></article>`; }).join("")}</div>`;
  },
  gallery() {
    const g = Clinic.c.gallery;
    return stHead("Before & after", "Real patient results for the Gallery page. Each needs the patient's written consent before it can be published.", `<button class="btn primary" data-a="galEdit" data-id="">${ic("plus")} Add result</button>`) +
    (g.length ? `<div class="ba-grid">${g.map(x => `<div class="stack">${x.before && x.after ? baCard(x) : `<div class="ba-empty"><span class="ic">${ic("camera")}</span><div class="small">Photos missing</div></div>`}<div class="row">${x.consent ? `<span class="chip ok">Consent recorded</span>` : `<span class="chip err">No consent</span>`}<span class="chip">${x.published && x.consent ? "Published" : "Hidden"}</span><button class="btn sm" data-a="galEdit" data-id="${x.id}">Edit</button></div></div>`).join("")}</div>` : emptyBox("No results yet. The Gallery page explains that results are added with patients' consent."));
  },
  services() {
    return stHead("Services", "Only published services appear on the website. Mark each as confirmed once the clinic has checked the wording.", `<button class="btn primary" data-a="svcEdit" data-id="">${ic("plus")} Add service</button>`) +
    `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Service</th><th>Area</th><th>Booking type</th><th>Published</th><th>Clinic confirmed</th><th></th></tr></thead><tbody>${Clinic.c.services.map((s, n) => `<tr><td><b>${esc(s.name)}</b><br><span class="muted small">${esc(s.short)}</span></td><td>${{ medical: "Dermatology", hair: "Hair & scalp", aesthetic: "Aesthetic" }[s.cat]}</td><td class="small">${esc(Clinic.type(s.typeId)?.name || "")}</td>
      <td><input type="checkbox" aria-label="Published" data-cms="services.${n}.published" data-rr="1" ${s.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"></td><td><input type="checkbox" aria-label="Confirmed by clinic" data-cms="services.${n}.confirmed" data-rr="1" ${s.confirmed ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> ${s.confirmed ? "" : `<span class="chip warn">Check</span>`}</td><td><button class="btn sm" data-a="svcEdit" data-id="${s.id}">Edit</button></td></tr>`).join("")}</tbody></table></div>`;
  },
  shop() {
    const P = Clinic.c.products || [], O = Clinic.ops.orders || [], sh = Clinic.c.shop || {};
    return stHead("Shop", "Products for the app's shop. The shop and bag icon only appear once at least one product is published with a price.", `<button class="btn primary" data-a="prodEdit" data-id="">${ic("plus")} Add product</button>`) + `
    <div class="notice" style="margin-bottom:16px">${ic("info")}<div class="small">Orders are <b>requests</b>: nothing is paid in the app. Each order reaches the clinic through the website's order form (Netlify Forms → turn on email notifications), and the team calls the patient to confirm stock, total and payment. Only list products the clinic actually stocks, at real prices.</div></div>
    <div class="card" style="margin-bottom:16px"><div class="grid g2"><label class="field" for="sh-cur"><span>Currency label</span><input type="text" id="sh-cur" data-cms="shop.currency" value="${esc(sh.currency || "Le")}"></label><label class="field" for="sh-col"><span>Collection option wording</span><input type="text" id="sh-col" data-cms="shop.collect" value="${esc(sh.collect || "")}"></label></div>
      <label class="field" for="sh-del" style="margin-top:12px"><span>Delivery note shown at checkout</span><input type="text" id="sh-del" data-cms="shop.deliveryNote" value="${esc(sh.deliveryNote || "")}"></label></div>
    ${P.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Product</th><th>Price</th><th>In stock</th><th>Published</th><th></th></tr></thead><tbody>${P.map((x, n) => `<tr><td><div class="row" style="flex-wrap:nowrap">${x.image ? `<img src="${x.image}" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover">` : ""}<div><b>${esc(x.name)}</b><br><span class="muted small">${esc(x.category || "")}</span></div></div></td><td>${esc((sh.currency || "Le") + " " + x.price)}</td>
      <td><input type="checkbox" aria-label="In stock" data-cms="products.${n}.inStock" data-rr="1" ${x.inStock !== false ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"></td><td><input type="checkbox" aria-label="Published" data-cms="products.${n}.published" data-rr="1" ${x.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"></td>
      <td><div class="row"><button class="btn sm" data-a="cmsImg" data-path="products.${n}.image">${ic("upload")} Photo</button><button class="btn sm" data-a="prodEdit" data-id="${x.id}">Edit</button></div></td></tr>`).join("")}</tbody></table></div>` : `<div class="card"><p class="muted">No products yet. The shop stays hidden in the app until you add one.</p></div>`}
    <h3 style="margin:24px 0 10px">Orders on this device</h3>${O.length ? `<div class="stack">${O.map(o => `<div class="card"><div class="spread"><b>${esc(o.ref)} · ${esc(o.name)}</b><span class="chip ${o.delivery === "sent" ? "ok" : "warn"}">${o.delivery === "sent" ? "Sent to inbox" : "Not sent"}</span></div><p class="small muted" style="margin-top:6px">${fmtDate(o.at.slice(0, 10))} · ${esc(o.phone)} · ${o.method === "deliver" ? "Delivery: " + esc(o.address) : "Collect at clinic"}</p><p class="small" style="margin-top:6px">${o.items.map(i => esc(i.qty + " × " + i.name)).join(", ")} · ${esc(o.currency + " " + o.subtotal)}</p></div>`).join("")}</div>` : `<p class="muted small">Orders sent from patients' phones arrive in the clinic's inbox (Netlify Forms), not here.</p>`}`;
  },
  team() {
    return stHead("Clinical team", "Profiles appear publicly only when verified and published. Never add qualifications you haven't checked.", `<button class="btn primary" data-a="teamEdit" data-id="">${ic("plus")} Add profile</button>`) +
    (Clinic.c.team.length ? `<div class="team-grid">${Clinic.c.team.map(p => `<article class="person"><div class="ph">${p.photo ? `<img src="${p.photo}" alt="">` : ic("users")}</div><div class="bd"><b>${esc(p.name)}</b><span class="small">${esc(p.title)}</span><div class="row" style="gap:6px;margin-top:6px">${p.verified ? `<span class="chip ok">Verified ${p.verifiedBy ? "by " + esc(p.verifiedBy) : ""}</span>` : `<span class="chip warn">Not verified</span>`}${p.published ? `<span class="chip">Published</span>` : `<span class="chip">Hidden</span>`}</div><button class="btn sm" style="margin-top:8px;justify-self:start" data-a="teamEdit" data-id="${p.id}">Edit</button></div></article>`).join("")}</div>` : emptyBox("No team profiles yet. The website shows a 'profiles being prepared' message until you add verified ones."));
  },
  learn() {
    return stHead("Articles", "Education library. Mark an article reviewed only after a qualified clinician has checked it.", `<button class="btn primary" data-a="artEdit" data-id="">${ic("plus")} New article</button>`) +
    `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Article</th><th>Category</th><th>Clinical review</th><th>Published</th><th></th></tr></thead><tbody>${Clinic.c.articles.map((a, n) => `<tr><td><b>${esc(a.title)}</b><br><span class="muted small">${esc(a.summary)}</span></td><td class="small">${esc(a.cat)}</td><td>${a.reviewer ? `<span class="chip ok">${esc(a.reviewer)}</span>` : `<span class="chip warn">Awaiting review</span>`}</td><td><input type="checkbox" aria-label="Published" data-cms="articles.${n}.published" data-rr="1" ${a.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"></td><td><button class="btn sm" data-a="artEdit" data-id="${a.id}">Edit</button></td></tr>`).join("")}</tbody></table></div>`;
  },
  campaigns() {
    const t = dayKey();
    return stHead("Campaigns", "Awareness campaigns in the clinic's blue pattern style. Shown on the homepage between their start and end dates.", `<button class="btn primary" data-a="campEdit" data-id="">${ic("plus")} New campaign</button>`) +
    `<div class="camp-grid">${Clinic.c.campaigns.map(c => { const live = c.published && (!c.start || c.start <= t) && (!c.end || c.end >= t); return `<div class="stack">${campCard(c)}<div class="row"><span class="chip ${live ? "ok" : ""}">${live ? "Live" : !c.published ? "Unpublished" : c.end && c.end < t ? "Ended" : "Scheduled"}</span><span class="muted small">${c.start ? fmtDate(c.start) : "No start"} – ${c.end ? fmtDate(c.end) : "no end"}</span><button class="btn sm" data-a="campEdit" data-id="${c.id}">Edit</button></div></div>`; }).join("")}</div>`;
  },
  schedule() {
    const av = Clinic.c.availability, D = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return stHead("Scheduling", "Appointment types and the hours patients can book online.") + `
    <div class="grid g2"><section class="card stack"><h3>Weekly availability</h3><p class="muted small">${hasHours() ? "Patients see exact slots from these hours." : "No hours set: the website takes booking requests with a preferred day and time of day, and you confirm by phone."}</p>
      ${D.map((d, n) => { const s = av.days[n]; return `<div class="row" style="flex-wrap:nowrap;gap:8px"><label class="row small" style="width:130px;flex:none"><input type="checkbox" data-a="dayToggle" data-n="${n}" ${s ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)">${d}</label>${s ? `<input type="time" aria-label="${d} opens" data-cms="availability.days.${n}.0" value="${s[0]}"><input type="time" aria-label="${d} closes" data-cms="availability.days.${n}.1" value="${s[1]}">` : `<span class="muted small">Closed</span>`}</div>`; }).join("")}
      <label class="field" for="cms-slot"><span>Slot interval (minutes)</span><select id="cms-slot" data-cms="availability.slotMinutes">${[15, 20, 30, 45, 60].map(m => `<option ${av.slotMinutes == m ? "selected" : ""}>${m}</option>`).join("")}</select></label>
      ${cmsIn("availability.policy", "Booking & cancellation policy shown to patients", { area: true, hint: "Leave empty until the clinic has agreed a policy." })}</section>
    <section class="card stack"><h3>Closed dates</h3><div class="row">${av.closedDates.map(d => `<span class="chip">${fmtDate(d)} <button class="btn sm ghost" style="padding:0 4px" aria-label="Remove ${d}" data-a="closedDel" data-d="${d}">${ic("x")}</button></span>`).join("") || `<span class="muted small">None</span>`}</div><div class="row" style="flex-wrap:nowrap"><label class="sr" for="closed-add">Add closed date</label><input type="date" id="closed-add"><button class="btn sm" data-a="closedAdd">Add</button></div>
      <h3 style="margin-top:10px">Appointment types</h3>${Clinic.c.apptTypes.map((t, n) => `<div class="card" style="padding:12px"><div class="grid g2">${cmsIn(`apptTypes.${n}.name`, "Name")}<div class="grid g2">${cmsIn(`apptTypes.${n}.duration`, "Minutes", { type: "number" })}${cmsIn(`apptTypes.${n}.fee`, "Fee (optional)", { hint: "Only if agreed" })}</div></div><label class="row small" style="margin-top:6px"><input type="checkbox" data-cms="apptTypes.${n}.active" data-rr="1" ${t.active ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Bookable online</label></div>`).join("")}
      <button class="btn sm" style="align-self:flex-start" data-a="typeAdd">${ic("plus")} Add type</button></section></div>`;
  },
  staff() {
    const list = Clinic.ops.staff;
    return stHead("Staff & roles", "Least-privilege access: each role sees only what it needs.", Backend.sb ? "" : `<button class="btn primary" data-a="staffAdd">${ic("plus")} Add staff member</button>`) + `
    <div class="tbl-wrap" style="margin-bottom:16px"><table class="tbl"><thead><tr><th>Role</th><th>Can access</th></tr></thead><tbody>${Object.entries(PERM).map(([r, p]) => `<tr><td><b>${ROLE_LABEL[r]}</b></td><td class="small">${p.map(k => ST_NAV.find(n => n[0] === k)[1]).join(", ")}</td></tr>`).join("")}</tbody></table></div>
    ${Backend.sb ? `<div class="notice">${ic("info")}<div class="small">Staff accounts are managed in the database: create the user in Supabase Auth, then add a row to <span class="mono">staff_roles</span> (see README).</div></div>` :
      list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>${list.map(s => `<tr><td>${esc(s.name)}</td><td class="small">${esc(s.email)}</td><td>${ROLE_LABEL[s.role]}</td><td>${s.active ? `<span class="chip ok">Active</span>` : `<span class="chip">Deactivated</span>`}</td><td><button class="btn sm" data-a="staffToggle" data-id="${s.id}">${s.active ? "Deactivate" : "Reactivate"}</button></td></tr>`).join("")}</tbody></table></div>` : emptyBox("No staff accounts recorded in this demo.")}`;
  },
  ai() {
    const a = Clinic.c.ai;
    return stHead("AI settings", "Switch AI features on or off for patients. Model changes need technical and clinical review before going live.") + `
    <div class="grid g2"><section class="card stack"><h3>Features</h3>${[["skin", "Skin photo observations"], ["hair", "Hair & scalp photo observations"], ["coach", "Skin & Hair Guide (chat)"]].map(([k, l]) => `<label class="row" style="flex-wrap:nowrap"><input type="checkbox" data-cms="ai.${k}" data-rr="1" ${a[k] ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent);flex:none"><span><b>${l}</b><br><span class="muted small">${a[k] ? "On" : "Off: patients can still save photos and record observations themselves"}</span></span></label>`).join("")}</section>
    <section class="card stack"><h3>Model &amp; disclosure</h3>${cmsIn("ai.modelNote", "Model note shown to patients", { area: true })}<dl class="kv"><dt>Connection in this browser</dt><dd>${Cap.sample ? `<span class="chip ok">Connected</span>` : `<span class="chip">Not connected</span>`}</dd><dt>Validation status</dt><dd>Not clinically validated</dd><dt>Training use</dt><dd>Patient photos are never used for training</dd></dl></section></div>`;
  },
  reports() {
    const b = Clinic.ops.bookings, by = (arr, f) => arr.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});
    const types = by(b, x => Clinic.type(x.typeId)?.name || "Other"), status = by(b, x => x.status), months = by(b, x => x.at.slice(0, 7)), enq = by(Clinic.ops.enquiries, x => x.category);
    const bars = obj => { const e = Object.entries(obj).sort((a, b) => b[1] - a[1]), mx = Math.max(1, ...e.map(x => x[1])); return e.length ? `<div class="stack" style="gap:8px">${e.map(([k, v]) => `<div><div class="spread small"><span>${esc(k)}</span><b style="font-variant-numeric:tabular-nums">${v}</b></div><div class="bar"><i style="width:${(v / mx) * 100}%"></i></div></div>`).join("")}</div>` : `<p class="muted small">No data yet.</p>`; };
    return stHead("Reports", "Aggregated counts only. No patient names or clinical details appear here.") + `<div class="grid g4" style="margin-bottom:16px"><div class="stat"><span class="label">Bookings</span><b>${b.length}</b></div><div class="stat"><span class="label">Cancelled</span><b>${status.cancelled || 0}</b></div><div class="stat"><span class="label">Completed</span><b>${status.completed || 0}</b></div><div class="stat"><span class="label">Enquiries</span><b>${Clinic.ops.enquiries.length}</b></div></div>
    <div class="grid g3"><section class="card"><h3 style="margin-bottom:12px">Bookings by type</h3>${bars(types)}</section><section class="card"><h3 style="margin-bottom:12px">Bookings by month</h3>${bars(months)}</section><section class="card"><h3 style="margin-bottom:12px">Enquiries by subject</h3>${bars(enq)}</section></div>
    <p class="muted small" style="margin-top:14px">Website visits and AI usage need an analytics service; none is connected, by design, until the clinic chooses a privacy-respecting one.</p>`;
  },
  audit() {
    const l = Clinic.ops.audit;
    return stHead("Audit log", "Every staff action is recorded with who did it and when.") + (l.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>${l.slice(0, 200).map(a => `<tr><td class="num small">${fmtDate(a.at)} ${fmtTime(a.at)}</td><td class="small">${esc(a.who)}</td><td>${esc(a.action)}</td><td class="small muted">${esc(a.detail || "")}</td></tr>`).join("")}</tbody></table></div>` : emptyBox("No activity yet."));
  }
};
const apRow = b => `<div class="li"><span class="mono" style="min-width:92px">${b.time || (b.window || "TBC")}</span><div class="grow"><b>${esc(b.name)}</b> ${bookingChip(b)}<br><span class="muted small">${esc(Clinic.type(b.typeId)?.name || "")} · ${when(b)}</span></div><button class="btn sm" data-a="stAppt" data-id="${b.id}">Open</button></div>`;
function weekView() {
  const start = new Date(); start.setDate(start.getDate() - start.getDay() + 1 + (Staff.weekOff || 0) * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return dayKey(d); });
  return `<div class="row" style="margin-bottom:10px"><button class="btn sm" data-a="stWeek" data-d="-1">Previous</button><b>${fmtDate(days[0])} – ${fmtDate(days[6])}</b><button class="btn sm" data-a="stWeek" data-d="1">Next</button></div>
  <div style="overflow-x:auto"><div class="week">${days.map(d => `<div class="col"><span class="label">${fmtDate(d, { weekday: "short", day: "numeric" })}</span>${Clinic.ops.bookings.filter(b => b.date === d && b.status !== "cancelled").sort((a, b) => (a.time || "z").localeCompare(b.time || "z")).map(b => `<button class="ap ${b.status === "requested" ? "req" : ""}" data-a="stAppt" data-id="${b.id}"><b>${b.time || b.window}</b><br>${esc(b.name)}</button>`).join("") || `<span class="muted small">—</span>`}</div>`).join("")}</div></div>`;
}

/* ---------- appointment actions ---------- */
function apptModal(b) {
  const t = Clinic.type(b.typeId), canClin = Staff.can("patients");
  openModal(`<div class="spread"><h3>${esc(b.name)} · ${esc(b.ref)}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    <div class="row" style="margin:8px 0 14px">${bookingChip(b)}${b.delivery === "inbox" ? `<span class="chip">Also in Netlify inbox</span>` : ""}</div>
    <dl class="kv"><dt>Appointment</dt><dd>${esc(t?.name)}</dd><dt>Concern</dt><dd>${esc(Clinic.svc(b.svcId)?.name || "Not given")}</dd><dt>When</dt><dd>${when(b)}</dd><dt>Clinician</dt><dd>${esc(clinName(b.clin))}</dd><dt>Phone</dt><dd>${esc(b.phone)} · prefers ${esc(b.contactPref || "phone")}</dd>${b.email ? `<dt>Email</dt><dd>${esc(b.email)}</dd>` : ""}
      ${canClin && b.reason ? `<dt>Reason</dt><dd>${esc(b.reason)}</dd>` : b.reason ? `<dt>Reason</dt><dd class="muted">Visible to clinicians</dd>` : ""}<dt>Shared</dt><dd>${b.shared?.length ? `${b.shared.length} assessment${b.shared.length === 1 ? "" : "s"}${canClin ? "" : " (clinicians only)"}` : "Nothing"}</dd></dl>
    <div class="grid g3" style="margin-top:16px"><label class="field" for="ap-d"><span>Date</span><input type="date" id="ap-d" value="${esc(b.date || "")}"></label><label class="field" for="ap-t"><span>Time</span><input type="time" id="ap-t" value="${esc(b.time || "")}"></label>
      <label class="field" for="ap-c"><span>Clinician</span><select id="ap-c"><option value="">Unassigned</option>${Clinic.c.team.map(p => `<option value="${p.id}" ${b.clin === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label></div>
    <p id="ap-msg" class="err-text" hidden></p>
    <div class="row" style="margin-top:14px">${b.status === "requested" ? `<button class="btn primary" data-a="apSet" data-id="${b.id}" data-s="confirmed">Confirm appointment</button>` : ""}${["requested", "confirmed"].includes(b.status) ? `<button class="btn" data-a="apSet" data-id="${b.id}" data-s="${b.status}">Save changes</button><button class="btn" data-a="apSet" data-id="${b.id}" data-s="completed">Mark completed</button><button class="btn" data-a="apSet" data-id="${b.id}" data-s="no-show">No-show</button><button class="btn danger" data-a="apSet" data-id="${b.id}" data-s="cancelled">Cancel</button>` : ""}
      ${canClin ? `<button class="btn ghost" data-a="stPatient" data-k="${esc(patientKey(b))}">Patient record</button>` : ""}</div>
    <p class="muted small" style="margin-top:10px">After confirming, call or message the patient${b.delivery === "device" || !Backend.sb ? "" : "; they'll also see the status in their app"}. Automatic SMS/email reminders need a messaging service.</p>
    <details style="margin-top:12px"><summary class="small" style="cursor:pointer">History</summary><div class="list small">${(b.history || []).map(h => `<div class="li"><span class="mono muted">${fmtDate(h.at)} ${fmtTime(h.at)}</span><span class="grow">${esc(h.what)}</span></div>`).join("")}</div></details>`, true);
}
Object.assign(ACTIONS, {
  stAppt: el => apptModal(Clinic.ops.bookings.find(b => b.id === el.dataset.id)),
  stFilter: el => { Staff.filter = el.dataset.f; render(); },
  stView: () => { Staff.view = Staff.view === "list" ? "week" : "list"; render(); },
  stWeek: el => { Staff.weekOff = (Staff.weekOff || 0) + Number(el.dataset.d); render(); },
  apSet: async el => {
    const b = Clinic.ops.bookings.find(x => x.id === el.dataset.id), s = el.dataset.s, m = $("#ap-msg");
    const date = $("#ap-d").value, time = $("#ap-t").value, clin = $("#ap-c").value;
    if ((s === "confirmed" || ["requested", "confirmed"].includes(s)) && s !== "cancelled") {
      if (s === "confirmed" && (!date || !time)) { m.hidden = false; m.textContent = "Set a date and time before confirming."; return; }
      if (date && time) { const dur = Clinic.type(b.typeId)?.duration || 30, s0 = toMin(time);
        const clash = Clinic.ops.bookings.find(x => x.id !== b.id && ["requested", "confirmed"].includes(x.status) && x.date === date && x.time && (!clin || !x.clin || x.clin === clin) && s0 < toMin(x.time) + (Clinic.type(x.typeId)?.duration || 30) && toMin(x.time) < s0 + dur);
        if (clash) { m.hidden = false; m.textContent = `Clashes with ${clash.name} at ${clash.time}. Choose another time or clinician.`; return; } }
    }
    const what = { confirmed: "Confirmed", cancelled: "Cancelled", completed: "Marked completed", "no-show": "Marked no-show" }[s] || "Updated";
    const changed = (date !== (b.date || "") || time !== (b.time || "")) && b.status === "confirmed" ? "Rescheduled" : what;
    try { await Ops.patch("bookings", b, { status: s, date: date || b.date, time: time || b.time, window: time ? "" : b.window, clin, history: [...(b.history || []), { at: nowISO(), what: `${changed} by ${Staff.session.name}` }] }, `${changed} appointment`); closeModal(); toast(changed); render(); }
    catch (e) { m.hidden = false; m.textContent = "Couldn't save. Check your connection and try again."; }
  },
  stNewAppt: () => openModal(`<h3>Phone booking</h3><div class="stack" style="margin-top:14px"><div class="grid g2"><label class="field" for="nb-name"><span>Patient name *</span><input type="text" id="nb-name"></label><label class="field" for="nb-phone"><span>Phone *</span><input type="tel" id="nb-phone"></label></div>
    <div class="grid g3"><label class="field" for="nb-type"><span>Type</span><select id="nb-type">${Clinic.c.apptTypes.filter(t => t.active).map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label><label class="field" for="ap-d"><span>Date *</span><input type="date" id="ap-d"></label><label class="field" for="ap-t"><span>Time *</span><input type="time" id="ap-t"></label></div>
    <label class="field" for="ap-c"><span>Clinician</span><select id="ap-c"><option value="">Unassigned</option>${Clinic.c.team.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label><p id="ap-msg" class="err-text" hidden></p></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="nbSave">Book and confirm</button></div>`),
  nbSave: async () => {
    const m = $("#ap-msg"), n = $("#nb-name").value.trim(), p = $("#nb-phone").value.trim(), d = $("#ap-d").value, t = $("#ap-t").value, typeId = $("#nb-type").value, clin = $("#ap-c").value;
    if (!n || !p || !d || !t) { m.hidden = false; m.textContent = "Fill in name, phone, date and time."; return; }
    if (isTaken(d, t, Clinic.type(typeId)?.duration || 30, clin)) { m.hidden = false; m.textContent = "That time clashes with another appointment."; return; }
    const rec = { id: uid(), ref: "P-" + Math.random().toString(36).slice(2, 7).toUpperCase(), at: nowISO(), typeId, svcId: "", clin, date: d, time: t, window: "", name: n, phone: p, email: "", reason: "", contactPref: "Phone call", status: "confirmed", shared: [], patientId: null, delivery: "staff", history: [{ at: nowISO(), what: `Booked by phone and confirmed by ${Staff.session.name}` }] };
    try { await Ops.add("bookings", rec); audit("Created phone booking", rec.ref); closeModal(); toast("Booked and confirmed"); render(); } catch (e) { m.hidden = false; m.textContent = "Couldn't save. Try again."; }
  },
  stEnq: async el => { const q = Clinic.ops.enquiries.find(x => x.id === el.dataset.id); await Ops.patch("enquiries", q, { status: el.dataset.s }, "Enquiry " + el.dataset.s); render(); }
});

/* ---------- patient record (clinicians) ---------- */
function patientRecord(k, bs) {
  const b0 = bs[0], shared = bs.flatMap(b => (b.shared || []).map(s => ({ ...s, bookingId: b.id }))), notes = Clinic.ops.notes.filter(n => n.patientKey === k), plans = Clinic.ops.carePlans.filter(p => p.patientKey === k);
  return `<button class="btn sm ghost" data-a="stGo" data-p="patients" style="margin-bottom:10px">← All patients</button>` + stHead(esc(b0.name), `${esc(b0.phone)}${b0.email ? " · " + esc(b0.email) : ""} · ${b0.patientId ? "uses the patient app" : "no app account"}`, `<button class="btn" data-a="noteNew" data-k="${esc(k)}">${ic("edit")} Clinical note</button><button class="btn primary" data-a="planNew" data-k="${esc(k)}">${ic("plus")} Care plan</button>`) + `
  <div class="row small" style="gap:8px;margin-bottom:16px"><span class="src-block self" style="padding:4px 10px">Patient-entered</span><span class="src-block ai" style="padding:4px 10px">AI-generated observation</span><span class="src-block clin" style="padding:4px 10px">Clinician-recorded</span></div>
  <div class="grid g2" style="align-items:start"><div class="stack">
    <section class="card"><h3 style="margin-bottom:10px">Appointments</h3><div class="list">${bs.map(b => `<div class="li"><div class="grow"><b>${esc(Clinic.type(b.typeId)?.name || "")}</b> ${bookingChip(b)}<br><span class="muted small">${when(b)}</span>${b.reason ? `<div class="src-block self small" style="margin-top:6px">Reason (patient): ${esc(b.reason)}</div>` : ""}</div><button class="btn sm" data-a="stAppt" data-id="${b.id}">Open</button></div>`).join("")}</div>
      <p class="small muted" style="margin-top:8px">Consent to share assessments: ${bs.some(b => b.consentToShare) ? "given for the bookings listed" : "not given"}.</p></section>
    <section class="card"><h3 style="margin-bottom:10px">Shared photo assessments</h3>${shared.length ? shared.map(s => { const rv = Clinic.ops.reviews.find(r => r.assessmentId === s.id && r.bookingId === s.bookingId); return `<div class="stack" style="gap:8px;padding:12px 0;border-top:1px solid var(--line)">
      <div class="spread"><b>${s.kind === "skin" ? "Skin" : "Hair & scalp"} · ${fmtDate(s.at)}</b>${rv ? `<span class="chip clin">Reviewed by ${esc(rv.by)}</span>` : `<span class="chip warn">Not reviewed</span>`}</div>
      ${s.photo ? `<img src="${s.photo}" alt="Patient photo, ${s.kind}" style="max-width:220px;border-radius:12px">` : `<span class="muted small">Photo not shared${b0.delivery === "inbox" ? " (online form sends summaries only)" : ""}.</span>`}
      <div class="src-block ai small"><b>AI observation</b> (${esc(s.provider || "AI")}) · image quality: ${esc(s.quality || "not recorded")}<br>${esc(s.summary || "")}${(s.regions || []).map(g => `<br>• ${esc(g.region)}: ${g.observations.map(o => esc(o.description)).join("; ")}`).join("")}${s.limitations?.length ? `<br><span class="muted">Limitations: ${esc(s.limitations.join("; "))}</span>` : ""}</div>
      ${s.notes ? `<div class="src-block self small"><b>Patient note:</b> ${esc(s.notes)}</div>` : ""}
      ${rv ? `<div class="src-block clin small"><b>Clinician findings</b> (${esc(rv.by)}, ${fmtDate(rv.at)}): ${esc(rv.findings || "Reviewed, no additional findings recorded.")}</div>` : `<label class="field" for="rv-${s.id}"><span class="small">Your findings (not copied from the AI)</span><textarea id="rv-${s.id}" placeholder="What you observe or plan to examine in person"></textarea></label><button class="btn sm" style="align-self:flex-start" data-a="rvSave" data-id="${s.id}" data-b="${s.bookingId}">Mark reviewed</button>`}</div>`; }).join("") : `<p class="muted small">The patient hasn't shared any assessments.</p>`}</section></div>
  <div class="stack"><section class="card"><h3 style="margin-bottom:10px">Clinical notes</h3>${notes.length ? notes.map(n => `<div class="src-block clin small" style="margin-bottom:10px"><div class="spread"><b>${fmtDate(n.at)} · ${esc(n.by)}</b>${n.final ? `<span class="chip">Finalised</span>` : `<span class="chip warn">Draft</span>`}</div>
      <dl class="kv" style="margin-top:6px">${NOTE_FIELDS.filter(([f]) => n[f]).map(([f, l]) => `<dt>${l}</dt><dd style="white-space:pre-wrap">${esc(n[f])}</dd>`).join("")}</dl>
      ${(n.amendments || []).map(a => `<p style="margin-top:6px"><b>Amendment ${fmtDate(a.at)} (${esc(a.by)}):</b> ${esc(a.text)}</p>`).join("")}
      <div class="row" style="margin-top:8px">${n.final ? `<button class="btn sm" data-a="noteAmend" data-id="${n.id}">Add amendment</button>` : `<button class="btn sm" data-a="noteEdit" data-id="${n.id}">Edit draft</button>`}</div></div>`).join("") : `<p class="muted small">No notes yet.</p>`}</section>
    <section class="card"><h3 style="margin-bottom:10px">Care plans</h3>${plans.length ? plans.map(p => `<div class="src-block clin small" style="margin-bottom:10px"><div class="spread"><b>${esc(p.concern)}</b><span class="chip ${p.status === "active" ? "ok" : ""}">${esc(p.status)}</span></div><p style="margin-top:6px;white-space:pre-wrap">${esc(p.instructions)}</p><ul style="margin:6px 0 0;padding-left:18px">${p.tasks.map(t => `<li>${esc(t.text)}${t.freq ? " · " + esc(t.freq) : ""}</li>`).join("")}</ul><p class="muted" style="margin-top:6px">Issued ${fmtDate(p.at)} by ${esc(p.clinician)}${p.followUp ? ` · review ${fmtDate(p.followUp)}` : ""}${p.patientId ? " · visible in the patient's app" : " · patient has no app account: give a printed copy"}</p>${p.status === "active" ? `<button class="btn sm" style="margin-top:6px" data-a="planEnd" data-id="${p.id}">Mark completed</button>` : ""}</div>`).join("") : `<p class="muted small">No care plans yet.</p>`}</section></div></div>`;
}
const NOTE_FIELDS = [["concern", "Presenting concern"], ["history", "Relevant history"], ["exam", "Examination findings"], ["assessment", "Assessment"], ["diagnosis", "Diagnosis (clinician-established)"], ["plan", "Plan"], ["followup", "Follow-up instructions"], ["review", "Next review date"]];
function noteModal(k, n) {
  openModal(`<div class="spread"><h3>${n ? "Edit draft note" : "New clinical note"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    <p class="muted small" style="margin:6px 0 12px">You're responsible for these conclusions. AI observations are never copied in automatically.</p>
    <div class="stack">${NOTE_FIELDS.map(([f, l]) => f === "review" ? `<label class="field" for="nf-${f}"><span>${l}</span><input type="date" id="nf-${f}" value="${esc(n?.[f] || "")}"></label>` : `<label class="field" for="nf-${f}"><span>${l}</span><textarea id="nf-${f}" style="min-height:56px">${esc(n?.[f] || "")}</textarea></label>`).join("")}</div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="noteSave" data-k="${esc(k)}" data-id="${n?.id || ""}" data-final="">Save draft</button><button class="btn primary" data-a="noteSave" data-k="${esc(k)}" data-id="${n?.id || ""}" data-final="1">Finalise</button></div>`, true);
}
function planModal(k) {
  openModal(`<div class="spread"><h3>New care plan</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    <div class="stack" style="margin-top:12px"><label class="field" for="cp-concern"><span>Concern *</span><input type="text" id="cp-concern"></label>
    <label class="field" for="cp-instr"><span>Instructions for the patient</span><textarea id="cp-instr" placeholder="Plain-language instructions, including any product or medicine details you've decided on"></textarea></label>
    <label class="field" for="cp-tasks"><span>Steps the patient can tick off (one per line; add frequency after a | )</span><textarea id="cp-tasks" placeholder="Apply cream to affected areas | every night&#10;Daily sunscreen | every morning"></textarea></label>
    <div class="grid g2"><label class="field" for="cp-fu"><span>Review date</span><input type="date" id="cp-fu"></label><label class="field" for="cp-edu"><span>Education note (optional)</span><input type="text" id="cp-edu" placeholder="e.g. Read: Sunscreen for every skin tone"></label></div>
    <p id="cp-msg" class="err-text" hidden></p></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="planSave" data-k="${esc(k)}">Issue care plan</button></div>`, true);
}
Object.assign(ACTIONS, {
  stPatient: el => { if (!Staff.can("patients")) { toast("Your role can't open clinical records."); return; } closeModal(); SURFACE = "staff"; SR.staffPage = "patients"; Staff.patientKey = el.dataset.k; const b = Clinic.ops.bookings.find(x => patientKey(x) === el.dataset.k); audit("Opened patient record", b?.name || ""); render(); window.scrollTo(0, 0); },
  rvSave: async el => { const f = $("#rv-" + el.dataset.id).value.trim(); const rec = { id: uid(), at: nowISO(), by: Staff.session.name, assessmentId: el.dataset.id, bookingId: el.dataset.b, findings: f };
    try { await Ops.add("reviews", rec); audit("Reviewed shared assessment"); toast("Marked reviewed"); render(); } catch (e) { toast("Couldn't save the review."); } },
  noteNew: el => noteModal(el.dataset.k),
  noteEdit: el => { const n = Clinic.ops.notes.find(x => x.id === el.dataset.id); noteModal(n.patientKey, n); },
  noteSave: async el => {
    const v = {}; NOTE_FIELDS.forEach(([f]) => v[f] = $("#nf-" + f).value.trim());
    if (!v.concern && !v.exam && !v.plan) { toast("Add at least a concern, findings or a plan."); return; }
    const ex = el.dataset.id && Clinic.ops.notes.find(x => x.id === el.dataset.id);
    try { if (ex) await Ops.patch("notes", ex, { ...v, final: !!el.dataset.final }, el.dataset.final ? "Finalised clinical note" : "Edited draft note");
      else { await Ops.add("notes", { id: uid(), at: nowISO(), by: Staff.session.name, patientKey: el.dataset.k, ...v, final: !!el.dataset.final, amendments: [] }); audit(el.dataset.final ? "Finalised clinical note" : "Saved draft note"); }
      closeModal(); toast(el.dataset.final ? "Note finalised" : "Draft saved"); render(); } catch (e) { toast("Couldn't save the note."); } },
  noteAmend: el => { openModal(`<h3>Add amendment</h3><p class="muted small" style="margin:6px 0 10px">Finalised notes can't be edited. Amendments are added with your name and the time.</p><label class="field" for="am-t"><span>Amendment</span><textarea id="am-t"></textarea></label><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="amSave" data-id="${el.dataset.id}">Add</button></div>`); },
  amSave: async el => { const t = $("#am-t").value.trim(); if (!t) return; const n = Clinic.ops.notes.find(x => x.id === el.dataset.id); await Ops.patch("notes", n, { amendments: [...(n.amendments || []), { at: nowISO(), by: Staff.session.name, text: t }] }, "Amended clinical note"); closeModal(); render(); },
  planNew: el => planModal(el.dataset.k),
  planSave: async el => {
    const c = $("#cp-concern").value.trim(), m = $("#cp-msg"); if (!c) { m.hidden = false; m.textContent = "Add the concern this plan is for."; return; }
    const k = el.dataset.k, b = Clinic.ops.bookings.find(x => patientKey(x) === k);
    const tasks = $("#cp-tasks").value.split("\n").map(l => l.trim()).filter(Boolean).map(l => { const [text, freq] = l.split("|").map(x => x.trim()); return { id: uid(), text, freq: freq || "" }; });
    const rec = { id: uid(), at: nowISO(), clinician: Staff.session.name, patientKey: k, patientId: b?.patientId || null, patientName: b?.name || "", concern: c, instructions: $("#cp-instr").value.trim(), tasks, followUp: $("#cp-fu").value, education: $("#cp-edu").value.trim(), status: "active" };
    try { await Ops.add("carePlans", rec); audit("Issued care plan", c); closeModal(); toast("Care plan issued"); render(); } catch (e) { m.hidden = false; m.textContent = "Couldn't save. Try again."; }
  },
  planEnd: async el => { const p = Clinic.ops.carePlans.find(x => x.id === el.dataset.id); await Ops.patch("carePlans", p, { status: "completed" }, "Completed care plan"); render(); }
});

/* ---------- content editing (administrators) ---------- */
let cmsImgPath = null;
Object.assign(ACTIONS, {
  cmsImg: el => { cmsImgPath = el.dataset.path; $("#cms-image").click(); },
  photoReset: el => { Clinic.c.photos[el.dataset.k] = CLINIC_DEFAULTS.photos[el.dataset.k]; Clinic.saveContent("Restored stock photo", el.dataset.k); render(); },
  galEdit: el => { const x = Clinic.c.gallery.find(g => g.id === el.dataset.id) || { id: "", title: "", treatment: "", concern: "", duration: "", before: "", after: "", consent: false, consentRef: "", published: false };
    GAL.draft = clone(x);
    openModal(galForm(), true); },
  galPick: el => { GAL.side = el.dataset.side; GAL.collect(); $("#gal-file").click(); },
  galSave: () => { GAL.collect(); const d = GAL.draft, m = $("#gal-msg");
    if (!d.title || !d.before || !d.after) { m.hidden = false; m.textContent = "Add a title and both photos."; return; }
    if (d.published && !d.consent) { m.hidden = false; m.textContent = "Record the patient's written consent before publishing."; return; }
    if (!d.id) { d.id = uid(); Clinic.c.gallery.unshift(d); } else Object.assign(Clinic.c.gallery.find(g => g.id === d.id), d);
    Clinic.saveContent("Saved before & after", d.title); closeModal(); render(); },
  galDel: el => { Clinic.c.gallery = Clinic.c.gallery.filter(g => g.id !== el.dataset.id); Clinic.saveContent("Deleted before & after"); closeModal(); render(); },
  cmsImgDel: el => { setPath(Clinic.c, el.dataset.path, ""); Clinic.saveContent("Removed image"); render(); },
  hoursAdd: () => { Clinic.c.info.hours.push({ days: "", time: "" }); Clinic.saveContent("Added hours row"); render(); },
  hoursDel: el => { Clinic.c.info.hours.splice(+el.dataset.n, 1); Clinic.saveContent("Removed hours row"); render(); },
  cmsExport: () => { audit("Exported content.json"); saveFile("content.json", JSON.stringify(Clinic.c, null, 2)); },
  cmsImportPick: () => $("#cms-import").click(),
  cmsReset: () => confirmBox("Reset website content?", "Services, articles, campaigns, team, hours and contact details go back to the shipped version.", "Reset", () => { Clinic.c = clone(CLINIC_DEFAULTS); Clinic.saveContent("Reset website content"); render(); }),
  dayToggle: el => { const d = Clinic.c.availability.days; if (d[el.dataset.n]) delete d[el.dataset.n]; else d[el.dataset.n] = ["09:00", "17:00"]; Clinic.saveContent("Changed availability"); render(); },
  closedAdd: () => { const v = $("#closed-add").value; if (!v) return; Clinic.c.availability.closedDates.push(v); Clinic.saveContent("Added closed date", v); render(); },
  closedDel: el => { Clinic.c.availability.closedDates = Clinic.c.availability.closedDates.filter(d => d !== el.dataset.d); Clinic.saveContent("Removed closed date"); render(); },
  typeAdd: () => { Clinic.c.apptTypes.push({ id: uid(), name: "New appointment type", duration: 30, fee: "", active: false }); Clinic.saveContent("Added appointment type"); render(); },
  staffAdd: () => openModal(`<h3>Add staff member</h3><div class="stack" style="margin-top:12px"><label class="field" for="sa-n"><span>Name</span><input type="text" id="sa-n"></label><label class="field" for="sa-e"><span>Work email</span><input type="email" id="sa-e"></label><label class="field" for="sa-r"><span>Role</span><select id="sa-r">${Object.keys(PERM).map(r => `<option value="${r}">${ROLE_LABEL[r]}</option>`).join("")}</select></label></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="staffSave">Add</button></div>`),
  staffSave: () => { const n = $("#sa-n").value.trim(), e = $("#sa-e").value.trim(); if (!n || !e) return; Clinic.ops.staff.push({ id: uid(), name: n, email: e, role: $("#sa-r").value, active: true }); Clinic.saveOps(); audit("Added staff member", `${n} (${$("#sa-r").value})`); closeModal(); render(); },
  staffToggle: el => { const s = Clinic.ops.staff.find(x => x.id === el.dataset.id); s.active = !s.active; Clinic.saveOps(); audit(s.active ? "Reactivated staff" : "Deactivated staff", s.name); render(); },
  svcEdit: el => { const s = Clinic.svc(el.dataset.id) || { id: "", cat: "medical", name: "", short: "", overview: "", concerns: [], involves: "", inPerson: "", faq: [], typeId: "initial", published: false, confirmed: false };
    openModal(`<div class="spread"><h3>${s.id ? "Edit service" : "New service"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><div class="stack" style="margin-top:12px">
      <div class="grid g2"><label class="field" for="sv-name"><span>Name *</span><input type="text" id="sv-name" value="${esc(s.name)}"></label><label class="field" for="sv-cat"><span>Area</span><select id="sv-cat">${[["medical", "Dermatology"], ["hair", "Hair & scalp"], ["aesthetic", "Aesthetic"]].map(([k, l]) => `<option value="${k}" ${s.cat === k ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
      <label class="field" for="sv-short"><span>One-line summary</span><input type="text" id="sv-short" value="${esc(s.short)}"></label><label class="field" for="sv-ov"><span>Overview</span><textarea id="sv-ov">${esc(s.overview)}</textarea></label>
      <label class="field" for="sv-con"><span>Concerns it may address (one per line)</span><textarea id="sv-con">${esc(s.concerns.join("\n"))}</textarea></label><label class="field" for="sv-inv"><span>What the consultation involves</span><textarea id="sv-inv">${esc(s.involves)}</textarea></label><label class="field" for="sv-ip"><span>When an in-person assessment is needed</span><textarea id="sv-ip">${esc(s.inPerson)}</textarea></label>
      <label class="field" for="sv-type"><span>Booking type</span><select id="sv-type">${Clinic.c.apptTypes.map(t => `<option value="${t.id}" ${s.typeId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></label><p class="muted small">Don't promise cures or outcomes, and only name procedures the clinic actually offers.</p></div>
      <div class="spread" style="margin-top:14px">${s.id ? `<button class="btn danger" data-a="svcDel" data-id="${s.id}">Delete</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="svcSave" data-id="${s.id}">Save</button></div></div>`, true); },
  svcSave: el => { const name = $("#sv-name").value.trim(); if (!name) { $("#sv-name").focus(); return; }
    let s = Clinic.svc(el.dataset.id); if (!s) { s = { id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid(), faq: [], published: false, confirmed: false }; Clinic.c.services.push(s); }
    Object.assign(s, { name, cat: $("#sv-cat").value, short: $("#sv-short").value.trim(), overview: $("#sv-ov").value.trim(), concerns: $("#sv-con").value.split("\n").map(x => x.trim()).filter(Boolean), involves: $("#sv-inv").value.trim(), inPerson: $("#sv-ip").value.trim(), typeId: $("#sv-type").value });
    Clinic.saveContent("Saved service " + name); closeModal(); render(); },
  svcDel: el => confirmBox("Delete this service?", "It will be removed from the website.", "Delete", () => { Clinic.c.services = Clinic.c.services.filter(s => s.id !== el.dataset.id); Clinic.saveContent("Deleted service"); render(); }),
  teamEdit: el => { const p = Clinic.c.team.find(x => x.id === el.dataset.id) || { id: "", name: "", title: "", qualifications: "", specialties: "", languages: "", photo: "", verified: false, verifiedBy: "", published: false };
    openModal(`<div class="spread"><h3>${p.id ? "Edit profile" : "New profile"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><div class="stack" style="margin-top:12px">
      <div class="grid g2"><label class="field" for="tm-name"><span>Name *</span><input type="text" id="tm-name" value="${esc(p.name)}"></label><label class="field" for="tm-title"><span>Professional title</span><input type="text" id="tm-title" value="${esc(p.title)}" placeholder="e.g. Consultant Dermatologist"></label></div>
      <label class="field" for="tm-q"><span>Verified qualifications</span><input type="text" id="tm-q" value="${esc(p.qualifications)}"></label><div class="grid g2"><label class="field" for="tm-s"><span>Specialties</span><input type="text" id="tm-s" value="${esc(p.specialties)}"></label><label class="field" for="tm-l"><span>Languages</span><input type="text" id="tm-l" value="${esc(p.languages)}" placeholder="e.g. English, Krio"></label></div>
      <div class="card" style="background:var(--surface-2)"><label class="row small" style="flex-wrap:nowrap"><input type="checkbox" id="tm-v" ${p.verified ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent);flex:none"><span>I have checked this person's qualifications and professional registration</span></label><label class="field" for="tm-vb" style="margin-top:8px"><span>Verified by</span><input type="text" id="tm-vb" value="${esc(p.verifiedBy || Staff.session.name)}"></label></div>
      <label class="row small"><input type="checkbox" id="tm-p" ${p.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Show on website (only if verified)</label><p id="tm-msg" class="err-text" hidden></p></div>
      <div class="spread" style="margin-top:14px">${p.id ? `<button class="btn danger" data-a="teamDel" data-id="${p.id}">Delete</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="teamSave" data-id="${p.id}">Save</button></div></div>`, true); },
  teamSave: el => { const n = $("#tm-name").value.trim(), m = $("#tm-msg"); if (!n) { m.hidden = false; m.textContent = "Add a name."; return; }
    if ($("#tm-p").checked && !$("#tm-v").checked) { m.hidden = false; m.textContent = "Verify the profile before publishing it."; return; }
    let p = Clinic.c.team.find(x => x.id === el.dataset.id); if (!p) { p = { id: uid(), photo: "" }; Clinic.c.team.push(p); }
    Object.assign(p, { name: n, title: $("#tm-title").value.trim(), qualifications: $("#tm-q").value.trim(), specialties: $("#tm-s").value.trim(), languages: $("#tm-l").value.trim(), verified: $("#tm-v").checked, verifiedBy: $("#tm-v").checked ? $("#tm-vb").value.trim() : "", verifiedAt: $("#tm-v").checked ? (p.verifiedAt || nowISO()) : "", published: $("#tm-p").checked });
    Clinic.saveContent("Saved team profile " + n); closeModal(); render(); },
  teamDel: el => { Clinic.c.team = Clinic.c.team.filter(p => p.id !== el.dataset.id); Clinic.saveContent("Deleted team profile"); closeModal(); render(); },
  artEdit: el => { const a = Clinic.c.articles.find(x => x.id === el.dataset.id) || { id: "", cat: "", title: "", summary: "", body: [], reviewer: "", reviewedOn: "", published: false };
    openModal(`<div class="spread"><h3>${a.id ? "Edit article" : "New article"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><div class="stack" style="margin-top:12px">
      <label class="field" for="ar-t"><span>Title *</span><input type="text" id="ar-t" value="${esc(a.title)}"></label><div class="grid g2"><label class="field" for="ar-c"><span>Category</span><input type="text" id="ar-c" value="${esc(a.cat)}"></label><label class="field" for="ar-svc"><span>Related service</span><select id="ar-svc"><option value="">None</option>${Clinic.c.services.map(s => `<option value="${s.id}" ${a.service === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label></div>
      <label class="field" for="ar-s"><span>Summary</span><input type="text" id="ar-s" value="${esc(a.summary)}"></label><label class="field" for="ar-b"><span>Body (blank line between paragraphs)</span><textarea id="ar-b" style="min-height:220px">${esc(a.body.join("\n\n"))}</textarea></label>
      <div class="grid g2"><label class="field" for="ar-r"><span>Clinical reviewer</span><input type="text" id="ar-r" value="${esc(a.reviewer)}" placeholder="Name of the clinician who reviewed it"></label><label class="field" for="ar-rd"><span>Review date</span><input type="date" id="ar-rd" value="${esc(a.reviewedOn)}"></label></div></div>
      <div class="spread" style="margin-top:14px">${a.id ? `<button class="btn danger" data-a="artDel" data-id="${a.id}">Delete</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="artSave" data-id="${a.id}">Save</button></div></div>`, true); },
  artSave: el => { const t = $("#ar-t").value.trim(); if (!t) { $("#ar-t").focus(); return; }
    let a = Clinic.c.articles.find(x => x.id === el.dataset.id); if (!a) { a = { id: t.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50), published: false, written: dayKey(), rel: ["learn", null, "More articles"] }; Clinic.c.articles.push(a); }
    Object.assign(a, { title: t, cat: $("#ar-c").value.trim() || "General", service: $("#ar-svc").value, summary: $("#ar-s").value.trim(), body: $("#ar-b").value.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean), reviewer: $("#ar-r").value.trim(), reviewedOn: $("#ar-rd").value });
    Clinic.saveContent("Saved article " + t); closeModal(); render(); },
  artDel: el => { Clinic.c.articles = Clinic.c.articles.filter(a => a.id !== el.dataset.id); Clinic.saveContent("Deleted article"); closeModal(); render(); },
  campEdit: el => { const c = Clinic.c.campaigns.find(x => x.id === el.dataset.id) || { id: "", title: "", text: "", cta: "Learn more", link: "", start: dayKey(), end: "", published: false, cat: "" };
    openModal(`<div class="spread"><h3>${c.id ? "Edit campaign" : "New campaign"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><div class="stack" style="margin-top:12px">
      <div class="grid g2"><label class="field" for="cm-t"><span>Title *</span><input type="text" id="cm-t" value="${esc(c.title)}"></label><label class="field" for="cm-c"><span>Category</span><input type="text" id="cm-c" value="${esc(c.cat)}" placeholder="e.g. Alopecia awareness"></label></div>
      <label class="field" for="cm-x"><span>Text</span><textarea id="cm-x">${esc(c.text)}</textarea></label><div class="grid g2"><label class="field" for="cm-cta"><span>Button label</span><input type="text" id="cm-cta" value="${esc(c.cta)}"></label><label class="field" for="cm-l"><span>Button links to</span><input type="text" id="cm-l" value="${esc(c.link)}" placeholder="e.g. services/hair-loss or book"></label></div>
      <div class="grid g2"><label class="field" for="cm-s"><span>Start</span><input type="date" id="cm-s" value="${esc(c.start)}"></label><label class="field" for="cm-e"><span>End (optional)</span><input type="date" id="cm-e" value="${esc(c.end)}"></label></div>
      <label class="row small"><input type="checkbox" id="cm-p" ${c.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Published</label><p class="muted small">Don't reuse graphic clinical photos from social media without the patient's written consent.</p></div>
      <div class="spread" style="margin-top:14px">${c.id ? `<button class="btn danger" data-a="campDel" data-id="${c.id}">Delete</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="campSave" data-id="${c.id}">Save</button></div></div>`, true); },
  campSave: el => { const t = $("#cm-t").value.trim(); if (!t) { $("#cm-t").focus(); return; }
    let c = Clinic.c.campaigns.find(x => x.id === el.dataset.id); if (!c) { c = { id: uid() }; Clinic.c.campaigns.unshift(c); }
    Object.assign(c, { title: t, cat: $("#cm-c").value.trim(), text: $("#cm-x").value.trim(), cta: $("#cm-cta").value.trim(), link: $("#cm-l").value.trim(), start: $("#cm-s").value, end: $("#cm-e").value, published: $("#cm-p").checked });
    Clinic.saveContent("Saved campaign " + t); closeModal(); render(); },
  prodEdit: el => { const x = (Clinic.c.products || []).find(p => p.id === el.dataset.id) || { id: "", name: "", category: "", price: "", description: "", inStock: true, published: false };
    openModal(`<div class="spread"><h3>${x.id ? "Edit product" : "New product"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><div class="stack" style="margin-top:12px">
      <div class="grid g2"><label class="field" for="pr-name"><span>Name *</span><input type="text" id="pr-name" value="${esc(x.name)}"></label><label class="field" for="pr-price"><span>Price (${esc(Clinic.c.shop?.currency || "Le")}) *</span><input type="number" min="0" step="any" id="pr-price" value="${esc(x.price)}"></label></div>
      <label class="field" for="pr-cat"><span>Category</span><input type="text" id="pr-cat" value="${esc(x.category)}" placeholder="Cleanser, sunscreen, hair care…"></label>
      <label class="field" for="pr-desc"><span>Short description</span><textarea id="pr-desc">${esc(x.description)}</textarea></label>
      <label class="row small"><input type="checkbox" id="pr-pub" ${x.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Published in the app shop</label>
      <p class="muted small">Add a photo from the table after saving. Don't make medical claims about products.</p></div>
      <div class="spread" style="margin-top:14px">${x.id ? `<button class="btn danger" data-a="prodDel" data-id="${x.id}">Delete</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="prodSave" data-id="${x.id}">Save</button></div></div>`, true); },
  prodSave: el => { const name = $("#pr-name").value.trim(), price = Number($("#pr-price").value); if (!name) { $("#pr-name").focus(); return; } if (!(price > 0)) { $("#pr-price").focus(); toast("Enter the real price."); return; }
    Clinic.c.products = Clinic.c.products || []; let x = Clinic.c.products.find(p => p.id === el.dataset.id); if (!x) { x = { id: uid(), image: "", inStock: true }; Clinic.c.products.push(x); }
    Object.assign(x, { name, price, category: $("#pr-cat").value.trim(), description: $("#pr-desc").value.trim(), published: $("#pr-pub").checked }); Clinic.saveContent("Saved product " + name); closeModal(); render(); },
  prodDel: el => { Clinic.c.products = (Clinic.c.products || []).filter(p => p.id !== el.dataset.id); Clinic.saveContent("Deleted product"); closeModal(); render(); },
  campDel: el => { Clinic.c.campaigns = Clinic.c.campaigns.filter(c => c.id !== el.dataset.id); Clinic.saveContent("Deleted campaign"); closeModal(); render(); }
});
document.addEventListener("change", async e => {
  if (e.target.id === "cms-image") { const f = e.target.files?.[0]; e.target.value = ""; if (!f || !cmsImgPath) return;
    if (f.size > 8e6) { toast("Choose an image under 8 MB."); return; }
    const img = new Image(); img.onload = () => { const c = document.createElement("canvas"), k = Math.min(1, 1400 / Math.max(img.width, img.height)); c.width = img.width * k; c.height = img.height * k; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      setPath(Clinic.c, cmsImgPath, c.toDataURL("image/jpeg", .82)); Clinic.saveContent("Uploaded image"); URL.revokeObjectURL(img.src); render(); };
    img.onerror = () => toast("That file couldn't be read as an image."); img.src = URL.createObjectURL(f); }
  if (e.target.id === "cms-import") { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (j.version !== 1 || !j.services) throw 0; confirmBox("Replace website content?", "This replaces services, articles, campaigns, team and contact details with the imported file.", "Import", () => { Clinic.c = Object.assign(clone(CLINIC_DEFAULTS), j); Clinic.saveContent("Imported content.json"); render(); }, false); }
    catch (x) { toast("That isn't a RADIANCE content.json file."); } }
});

/* before & after editor */
const GAL = { draft: null, side: null,
  collect() { const d = this.draft, v = id => $("#" + id)?.value.trim() ?? ""; if (!$("#gal-title")) return;
    Object.assign(d, { title: v("gal-title"), treatment: v("gal-treat"), concern: v("gal-concern"), duration: v("gal-dur"), consentRef: v("gal-ref"), consent: $("#gal-consent").checked, published: $("#gal-pub").checked }); } };
function galForm() {
  const d = GAL.draft, slot = side => `<div class="stack" style="gap:6px"><span class="label">${side}</span><div style="aspect-ratio:1;border-radius:10px;overflow:hidden;background:var(--surface-2);display:grid;place-items:center">${d[side.toLowerCase()] ? `<img src="${d[side.toLowerCase()]}" alt="${side}" style="width:100%;height:100%;object-fit:cover">` : `<span class="muted small">No photo</span>`}</div><button class="btn sm" data-a="galPick" data-side="${side.toLowerCase()}">${ic("upload")} ${d[side.toLowerCase()] ? "Replace" : "Upload"}</button></div>`;
  return `<div class="spread"><h3>${d.id ? "Edit result" : "New before & after"}</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    <input type="file" id="gal-file" accept="image/jpeg,image/png,image/webp" class="sr" aria-hidden="true" tabindex="-1">
    <div class="grid g2" style="margin-top:12px">${slot("Before")}${slot("After")}</div>
    <div class="grid g2" style="margin-top:12px"><label class="field" for="gal-title"><span>Title *</span><input type="text" id="gal-title" value="${esc(d.title)}" placeholder="e.g. Acne treatment"></label><label class="field" for="gal-treat"><span>Treatment</span><input type="text" id="gal-treat" value="${esc(d.treatment)}"></label></div>
    <div class="grid g2" style="margin-top:10px"><label class="field" for="gal-concern"><span>Concern</span><input type="text" id="gal-concern" value="${esc(d.concern)}" placeholder="e.g. Dark spots"></label><label class="field" for="gal-dur"><span>Time between photos</span><input type="text" id="gal-dur" value="${esc(d.duration)}" placeholder="e.g. 8 weeks"></label></div>
    <div class="card" style="margin-top:12px;background:var(--surface-2)"><label class="row small" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" id="gal-consent" ${d.consent ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent);flex:none;margin-top:2px"><span>The patient has given written consent for these photos to appear on the website.</span></label>
      <label class="field" for="gal-ref" style="margin-top:8px"><span>Consent form reference</span><input type="text" id="gal-ref" value="${esc(d.consentRef)}" placeholder="Where the signed form is filed"></label></div>
    <label class="row small" style="margin-top:10px"><input type="checkbox" id="gal-pub" ${d.published ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Show on the website</label>
    <p class="muted small" style="margin-top:6px">Use photos taken in similar light and angle, unedited. Crop out identifying features unless the patient agreed to be identifiable.</p><p id="gal-msg" class="err-text" hidden></p>
    <div class="spread" style="margin-top:14px">${d.id ? `<button class="btn danger" data-a="galDel" data-id="${d.id}">Delete</button>` : "<span></span>"}<div class="row"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="galSave">Save</button></div></div>`;
}
document.addEventListener("change", e => {
  if (e.target.id !== "gal-file") return; const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
  const img = new Image(); img.onload = () => { const c = document.createElement("canvas"), k = Math.min(1, 900 / Math.max(img.width, img.height)); c.width = img.width * k; c.height = img.height * k; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    GAL.draft[GAL.side] = c.toDataURL("image/jpeg", .82); URL.revokeObjectURL(img.src); openModal(galForm(), true); };
  img.onerror = () => toast("That file couldn't be read as an image."); img.src = URL.createObjectURL(f);
});
