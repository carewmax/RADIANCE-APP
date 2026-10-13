
/* ---------- 15. Learn ---------- */
let learnCat = "All";
PAGES.learn = () => {
  const s = S(); s.readArticles = s.readArticles || [];
  const cats = ["All", "Saved", ...new Set(ARTICLES.map(a => a.cat))];
  const list = ARTICLES.filter(a => learnCat === "All" || (learnCat === "Saved" ? s.savedArticles.includes(a.id) : a.cat === learnCat));
  return pageHead("Learn", "Knowledge centre", "Short, plain explanations. General education written for this app from widely published dermatology guidance; not individually reviewed by a clinician.") +
  `<div class="row" style="margin-bottom:12px"><label class="sr" for="learn-q">Search articles</label><input type="text" id="learn-q" data-filter="art" placeholder="Search articles" style="max-width:340px"></div>
  <div class="row" style="gap:6px;margin-bottom:16px">${cats.map(c => `<button class="chip toggle-chip" aria-pressed="${learnCat === c}" data-a="learnCat" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
  ${list.length ? `<div class="grid g3">${list.map(a => `<button class="card" style="text-align:left;cursor:pointer" data-a="openArticle" data-id="${a.id}" data-filter-item="art" data-text="${esc((a.title + " " + a.summary + " " + a.cat + " " + a.body.join(" ")).toLowerCase())}"><div class="spread"><span class="label">${esc(a.cat)}</span>${s.readArticles.includes(a.id) ? `<span class="chip">Read</span>` : ""}</div><h3 style="margin-top:8px">${esc(a.title)}</h3><p class="muted small" style="margin-top:6px">${esc(a.summary)}</p></button>`).join("")}</div>` : emptyBox("No saved articles yet.")}`;
};
Object.assign(ACTIONS, {
  learnCat: el => { learnCat = el.dataset.c; rerenderKeep(); },
  openArticle: el => { const a = ARTICLES.find(x => x.id === el.dataset.id), s = S(); s.readArticles = s.readArticles || []; if (!s.readArticles.includes(a.id)) { s.readArticles.push(a.id); Store.save(); }
    const saved = s.savedArticles.includes(a.id);
    openModal(`<div class="spread"><span class="label">${esc(a.cat)}</span><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><h2 style="margin:8px 0 14px">${esc(a.title)}</h2>
      <div class="article">${a.body.map(p => `<p>${esc(p)}</p>`).join("")}</div>
      <p class="muted small" style="margin-top:10px">General education, written October 2026. Not a substitute for advice from a clinician who knows your history.</p>
      <div class="row" style="margin-top:16px"><button class="btn primary" data-a="go" data-page="${a.rel[0]}" data-tab="${a.rel[1]}">${esc(a.rel[2])}</button><button class="btn" data-a="saveArticle" data-id="${a.id}">${saved ? "Saved ✓" : "Save article"}</button></div>`, true); },
  saveArticle: el => { const a = S().savedArticles, i = a.indexOf(el.dataset.id); i >= 0 ? a.splice(i, 1) : a.push(el.dataset.id); el.textContent = i >= 0 ? "Save article" : "Saved ✓"; commit(false); }
});
const goClose = ACTIONS.go; ACTIONS.go = el => { closeModal(); goClose(el); };

/* ---------- 16. Appointments & care (connected to the clinic) ---------- */
PAGES.pro = () => {
  const t = R.tab || "appts";
  return pageHead("Appointments & care", "Your care at RADIANCE", "Book and track appointments, follow care plans from your clinician, and prepare what you'd like the team to see.", `<button class="btn primary" data-a="site" data-path="book">${ic("calendar")} Book an appointment</button>`) +
    tabs([["appts", "Appointments"], ["plans", "Care plans"], ["questions", "My questions"], ["prep", "Consultation report"]], t) +
    (t === "plans" ? plansView() : t === "questions" ? questionsView() : t === "prep" ? builder(prepSel, "prep", "Consultation preparation", "consultation-report", "You decide what goes in. Review the preview, then save the file, or attach selected photo assessments when you book.") : apptsView());
};
const bookingChip = b => ({ requested: `<span class="chip warn">Awaiting clinic confirmation</span>`, confirmed: `<span class="chip ok">Confirmed by the clinic</span>`, cancelled: `<span class="chip err">Cancelled</span>`, completed: `<span class="chip">Completed</span>`, "no-show": `<span class="chip">Missed</span>` }[b.status] || `<span class="chip">${esc(b.status)}</span>`);
function plansView() {
  const plans = myCarePlans(), done = S().planDone || {};
  if (!plans.length) return emptyBox("No care plans yet. After a consultation, your clinician's plan appears here: what to do, how often, and when to come back.", `<button class="btn sm" data-a="site" data-path="book">Book a consultation</button>`);
  return `<div class="notice" style="margin-bottom:14px">${ic("shield")}<div class="small">These instructions come from your clinician. The app and the Skin &amp; Hair Guide never change them. If something is unclear or you have a reaction, contact the clinic on <b>${esc(Clinic.c.info.phone)}</b>.</div></div>
  <div class="stack">${plans.map(p => `<article class="card raised"><div class="spread"><div><div class="label">Issued ${fmtDate(p.at)} · ${esc(p.clinician)}</div><h3 style="margin-top:4px">${esc(p.concern || "Care plan")}</h3></div><span class="chip clin">Clinician-issued</span></div>
    ${p.instructions ? `<p style="margin-top:10px;white-space:pre-wrap">${esc(p.instructions)}</p>` : ""}
    <div class="stack" style="gap:8px;margin-top:14px">${p.tasks.map(x => { const k = p.id + ":" + x.id; return `<label class="step ${done[k] ? "done" : ""}"><input type="checkbox" data-a="planTick" data-k="${k}" ${done[k] ? "checked" : ""}><span class="lbl">${esc(x.text)}${x.freq ? ` <span class="muted small">· ${esc(x.freq)}</span>` : ""}</span></label>`; }).join("")}</div>
    <div class="row small" style="margin-top:12px">${p.followUp ? `<span class="chip">${ic("calendar")} Review ${fmtDate(p.followUp)}</span>` : ""}${p.education ? `<span class="muted">${esc(p.education)}</span>` : ""}</div>
    <label class="field" for="pn-${p.id}" style="margin-top:12px"><span>How is it going? (shared with your clinician at your next visit)</span><textarea id="pn-${p.id}" data-bind="planNotes.${p.id}">${esc((S().planNotes || {})[p.id] || "")}</textarea></label>
    <p class="muted small" style="margin-top:8px">Possible reaction? Stop and contact the clinic. For swelling of the face, lips or tongue, or trouble breathing, get emergency care now.</p></article>`).join("")}</div>`;
}
function apptsView() {
  const bk = myBookings(), ap = [...S().appointments].sort((a, b) => b.date.localeCompare(a.date)), t = dayKey();
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Bookings with RADIANCE</h3><button class="btn sm" data-a="site" data-path="book">${ic("plus")} New booking</button></div>
    ${bk.length ? `<div class="list">${bk.map(b => `<div class="li"><span class="mono" style="min-width:110px">${b.date ? fmtDate(b.date) : "Date TBC"}${b.time ? "<br>" + esc(b.time) : b.window ? "<br>" + esc(b.window) : ""}</span><div class="grow"><b>${esc(Clinic.type(b.typeId)?.name || "Appointment")}</b> ${bookingChip(b)}<br><span class="muted small">Ref ${esc(b.ref)}${b.shared?.length ? ` · ${b.shared.length} photo assessment${b.shared.length === 1 ? "" : "s"} shared` : ""}${b.delivery === "device" ? " · not yet sent to the clinic" : ""}</span></div>
      ${["requested", "confirmed"].includes(b.status) && (b.date || "9999") >= t ? `<button class="btn sm danger" data-a="patientCancel" data-id="${b.id}">Cancel</button>` : ""}</div>`).join("")}</div>`
      : `<p class="muted small">No bookings yet. Bookings you make on this ${Backend.user ? "account" : "device"} appear here with their status.</p>`}</div>
  <div class="card"><div class="card-h"><h3>Appointments you've logged</h3><button class="btn sm" data-a="newAppt">${ic("plus")} Log one</button></div>
  <p class="muted small" style="margin-bottom:8px">For appointments made by phone or elsewhere. These stay on your timeline and aren't sent to the clinic.</p>
  ${ap.length ? `<div class="list">${ap.map(a => `<div class="li"><span class="mono" style="min-width:96px">${fmtDate(a.date)}</span><div class="grow"><b>${esc(a.with || "Clinician")}</b> <span class="chip self">Logged by you</span> ${a.date >= t ? `<span class="chip ok">Upcoming</span>` : ""}<br><span class="muted small">${esc(a.notes || "")}</span></div><button class="icon-btn" aria-label="Delete appointment" data-a="delAppt" data-id="${a.id}">${ic("trash")}</button></div>`).join("")}</div>` : `<p class="muted small">None logged.</p>`}</div>`;
}
Object.assign(ACTIONS, {
  planTick: el => { const s = S(); s.planDone = s.planDone || {}; s.planDone[el.dataset.k] = !s.planDone[el.dataset.k]; commit(false); rerenderKeep(); },
  patientCancel: el => confirmBox("Cancel this appointment?", `The clinic will see the cancellation${Backend.sb ? "" : " the next time this request is sent or when you call"}. To rearrange, call <b>${esc(Clinic.c.info.phone)}</b>.`, "Cancel appointment", async () => {
    const b = Clinic.ops.bookings.find(x => x.id === el.dataset.id);
    try { await Ops.patch("bookings", b, { status: "cancelled", cancelledBy: "patient" }); if (Forms.available && !Backend.sb) await Forms.send("booking-request", { ref: b.ref, action: "CANCELLED by patient", name: b.name, phone: b.phone }).catch(() => {}); toast("Appointment cancelled"); render(); }
    catch (e) { toast("Couldn't cancel. Check your connection or call the clinic."); } })
});
function questionModal(prefill = "") {
  openModal(`<h3>Question for my dermatologist</h3><label class="field" for="q-text" style="margin-top:12px"><span>Question</span><textarea id="q-text">${esc(prefill)}</textarea></label>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="saveQuestion">Save question</button></div>`);
}
function questionsView() {
  const qs = S().questions;
  return `<div class="spread" style="margin-bottom:14px"><p class="muted small">Note questions as they come up. Ticked questions go into your consultation report.</p><button class="btn primary" data-a="newQuestion">${ic("plus")} Add question</button></div>
  ${qs.length ? `<div class="card"><div class="list">${qs.map(q => `<div class="li"><input type="checkbox" aria-label="Include in report" data-a="toggleQ" data-id="${q.id}" ${q.include ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"><div class="grow">${esc(q.text)}<br><span class="muted small">${fmtDate(q.at)}</span></div><button class="icon-btn" aria-label="Delete question" data-a="delQ" data-id="${q.id}">${ic("trash")}</button></div>`).join("")}</div></div>` : emptyBox("No questions yet.")}`;
}
Object.assign(ACTIONS, {
  newQuestion: () => questionModal(),
  saveQuestion: () => { const t = $("#q-text").value.trim(); if (!t) { $("#q-text").focus(); return; } S().questions.unshift({ id: uid(), at: nowISO(), text: t, include: true }); closeModal(); commit(); toast("Question saved"); },
  toggleQ: el => { const q = S().questions.find(x => x.id === el.dataset.id); q.include = !q.include; commit(false); rerenderKeep(); },
  delQ: el => { S().questions = S().questions.filter(x => x.id !== el.dataset.id); commit(); }
});
Object.assign(ACTIONS, {
  newAppt: () => openModal(`<h3>Log an appointment</h3><div class="stack" style="margin-top:14px"><div class="grid g2"><label class="field" for="ap-date"><span>Date *</span><input type="date" id="ap-date" value="${dayKey()}"></label><label class="field" for="ap-with"><span>With</span><input type="text" id="ap-with" placeholder="Clinic or clinician name"></label></div>
    <label class="field" for="ap-notes"><span>Notes or outcome</span><textarea id="ap-notes" placeholder="What was discussed, plan, follow-up date"></textarea></label></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="saveAppt">Save</button></div>`),
  saveAppt: () => { const d = $("#ap-date").value; if (!d) return; S().appointments.push({ id: uid(), date: d, with: $("#ap-with").value.trim(), notes: $("#ap-notes").value.trim() }); closeModal(); commit(); },
  delAppt: el => { S().appointments = S().appointments.filter(a => a.id !== el.dataset.id); commit(); }
});

/* ---------- 17. Settings, privacy, data ---------- */
PAGES.settings = () => {
  const t = R.tab || "profile";
  return pageHead("Settings", "Settings and privacy", "Your profile, appearance, consent and data.") +
    tabs([["profile", "Profile & appearance"], ["privacy", "Privacy"], ["data", "Your data"], ["help", "Help & AI limits"]], t) +
    (t === "profile" ? settingsProfile() : t === "privacy" ? settingsPrivacy() : t === "data" ? settingsData() : settingsHelp());
};
function settingsProfile() {
  return `<div class="grid g2"><div class="card stack"><h3>Profile</h3>${txt("profile.name", "Name")}${sel("profile.ageRange", OPT.ageRange, "Age range", "", false)}${txt("profile.country", "Country")}
    <label class="field" for="f-units"><span>Units</span><select id="f-units" data-bind="profile.units"><option value="metric" ${S().profile.units !== "imperial" ? "selected" : ""}>Metric (cm)</option><option value="imperial" ${S().profile.units === "imperial" ? "selected" : ""}>Imperial (in)</option></select></label>
    <div class="field"><span>Goals</span>${chipsPick("profile.goals", OPT.goals)}</div></div>
  <div class="card stack"><h3>Appearance</h3>
    <label class="field" for="f-theme"><span>Theme</span><select id="f-theme" data-bind="settings.theme" data-rerender="1">${["system", "light", "dark"].map(t => `<option value="${t}" ${S().settings.theme === t ? "selected" : ""}>${cap1(t)}</option>`).join("")}</select></label>
    <label class="field" for="f-scale"><span>Text size</span><select id="f-scale" data-bind="settings.textScale" data-rerender="1">${[["100", "Default"], ["112", "Larger"], ["125", "Largest"]].map(([v, l]) => `<option value="${v}" ${(S().settings.textScale || "100") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <p class="muted small">Animations follow your device's reduced-motion setting.</p>
    <button class="btn" data-a="customiseDash" style="align-self:flex-start">Customise dashboard</button></div></div>`;
}
function settingsPrivacy() {
  const c = S().consent, nPhotos = S().assessments.reduce((n, a) => n + (a.photoIds?.length || 0), 0);
  const tg = (path, title, desc) => `<label class="card row" style="align-items:flex-start;gap:14px;cursor:pointer"><input type="checkbox" data-bind="${path}" data-rerender="1" ${getPath(S(), path) ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent);flex:none"><div class="stack" style="gap:4px"><b>${title}</b><span class="muted small">${desc}</span></div></label>`;
  return `<div class="grid g2"><div class="stack">
    ${tg("consent.photos", "Store photos with my records", "Photos are downscaled to about 560px and stored " + (Store.mode === "cloud" ? "in your private claude.ai store, readable only by your signed-in account." : "in this browser only. Clearing site data deletes them."))}
    ${tg("consent.ai", "Allow AI photo analysis", "Photos you choose to analyse are sent to Claude (Anthropic) via claude.ai. Analysis runs on a server. This app never uses your photos for model training.")}
    ${tg("consent.coachContext", "Share my records with the AI Coach", "Skin ID, Hair ID, products, routines, recent reactions and photo descriptions are included in coach questions so answers fit you.")}
    <div class="card"><h3>Clinician access</h3><p class="muted small" style="margin-top:6px">RADIANCE clinicians see only what you choose to attach to a booking (photo assessments and notes you tick). Your full records, notes and chat history are never shared automatically.</p></div></div>
  <div class="stack"><div class="card"><h3>Where your data lives</h3><p class="small" style="margin-top:8px">${Store.mode === "cloud" ? "Your records are in a private store tied to your claude.ai account, under a path only you can read. A copy is also cached in this browser." : "Your records are saved in this browser only, which suits trying the app out. They won't sync to other devices. Open the app on claude.ai while signed in to use a private synced store, or connect a database (see README)."}</p>
    <p class="muted small" style="margin-top:8px">${nPhotos} photo${nPhotos === 1 ? "" : "s"} on record.</p>
    <div class="row" style="margin-top:12px"><button class="btn danger sm" data-a="deletePhotos" ${nPhotos ? "" : "disabled"}>Delete all photos</button><button class="btn sm" data-a="clearChatHist">Clear AI chat history</button></div></div>
    <div class="card"><h3>Consent history</h3>${c.history.length ? `<div class="list" style="margin-top:8px">${c.history.slice(0, 12).map(h => `<div class="li small"><span class="mono muted">${fmtDate(h.at)} ${fmtTime(h.at)}</span><div class="grow">Photos ${h.photos ? "on" : "off"} · AI analysis ${h.ai ? "on" : "off"} · Coach context ${h.coachContext ? "on" : "off"}</div></div>`).join("")}</div>` : `<p class="muted small" style="margin-top:6px">No changes recorded.</p>`}</div></div></div>`;
}
document.addEventListener("change", e => { const p = e.target.dataset?.bind; if (p && p.startsWith("consent.")) { const c = S().consent; c.history.unshift({ at: nowISO(), photos: c.photos, ai: c.ai, coachContext: c.coachContext }); Store.save(); } });
function settingsData() {
  return `<div class="grid g2"><div class="card stack"><h3>Export</h3><p class="muted small">A JSON file with your profile, Skin ID, Hair ID, assessments, products, routines, journal and reports. Photos can be included.</p>
    <label class="row small"><input type="checkbox" id="ex-photos" checked style="width:18px;height:18px;accent-color:var(--accent)"> Include photos</label>
    <div class="row"><button class="btn primary" data-a="exportData">Export my data</button><button class="btn" data-a="importPick">Import a backup</button></div></div>
  <div class="card stack"><h3>Delete everything</h3><p class="muted small">Removes your profile, all records, all photos and AI chat history from ${Store.mode === "cloud" ? "your private store and this browser" : "this browser"}. This can't be undone.</p>
    <label class="field" for="del-confirm"><span>Type DELETE to confirm</span><input type="text" id="del-confirm" autocomplete="off"></label>
    <button class="btn danger" data-a="deleteAll" style="align-self:flex-start">Delete my account data</button><p id="del-msg" class="small" hidden></p></div></div>`;
}
function settingsHelp() {
  const faq = [["Is this a diagnosis?", "No. Photo analysis describes what's visible in one picture. It can be wrong, and it can't see what a dermatologist can feel, examine or test."],
    ["Why did my photo fail the check?", "On-device checks look at size, brightness, focus and glare. The AI also declines photos where the face, hairline or scalp isn't clearly visible. Even daylight from a window usually fixes it."],
    ["Does it work for my skin tone or hair type?", "It's designed to, and the analysis is instructed to treat every skin tone and texture equally and to state when lighting or tone limits what it can see. If you think a result missed the mark, use \"Report a problem\" on the assessment."],
    ["What can't a phone photo tell?", "Hair porosity, follicle counts, growth rate, strand diameter, the cause of hair loss, or whether a mark or mole is harmful."],
    ["Who can see my records?", Store.mode === "cloud" ? "Only your signed-in account. Clinicians see only what you attach to a booking." : "Anyone using this browser profile. Records stay on this device unless you attach them to a booking."],
    ["How do I contact the clinic?", "Phone " + Clinic.c.info.phone + " or email " + Clinic.c.info.email + ". For anything urgent, call rather than message."]];
  return `<div class="stack">${faq.map(([q, a]) => `<details class="card"><summary style="cursor:pointer;font-weight:600">${esc(q)}</summary><p class="small" style="margin-top:8px">${esc(a)}</p></details>`).join("")}
    <div class="card"><h3>What's live in this version</h3><div class="list" style="margin-top:8px">${[
      ["Photo capture, on-device quality checks, history and comparison", "Live"], ["AI photo observations and Skin & Hair Guide", Cap.sample ? "Live" : "Not switched on"], ["Secure account and synced records", Store.mode === "cloud" ? "Live" : "This device only"],
      ["Booking requests to the clinic", Backend.sb ? "Live" : Forms.available ? "Live (clinic confirms by phone)" : "Saved on this device"], ["Care plans from your clinician", Backend.sb ? "Live" : "On this device (demo)"], ["Secure messaging with the clinic", "Not connected"], ["Payments and subscriptions", "Not connected"], ["Product catalogue and barcode lookup", "Not connected"], ["Push and email reminders", "Not connected (in-app only)"]
    ].map(([f, s]) => `<div class="li small"><div class="grow">${f}</div><span class="chip ${s === "Live" ? "ok" : ""}">${s}</span></div>`).join("")}</div></div>
    <p class="muted small">${esc(CONFIG.brand.name)} patient app is a documentation and education tool that supports care from the clinic's team. It is not a medical device and has not been clinically validated.</p></div>`;
}
Object.assign(ACTIONS, {
  importPick: () => $("#import-input").click(),
  exportData: async () => {
    const data = JSON.parse(JSON.stringify(S()));
    if ($("#ex-photos")?.checked) { data.photos = {}; for (const a of S().assessments) for (const p of a.photoIds || []) { const d = await Store.getPhoto(p); if (d) data.photos[p] = d; } }
    data.exportedAt = nowISO(); data.app = CONFIG.brand.name;
    saveFile(`radiance-export-${dayKey()}.json`, JSON.stringify(data, null, 2));
  },
  deletePhotos: () => confirmBox("Delete all photos?", "Assessments keep their text, but every photo is permanently removed.", "Delete photos", async () => {
    for (const a of S().assessments) { for (const p of a.photoIds || []) await Store.deletePhoto(p); a.photoIds = []; a.photoStored = false; } commit(); toast("All photos deleted"); }),
  clearChatHist: () => confirmBox("Clear AI chat history?", "", "Clear", () => { S().chat = []; commit(); toast("Chat history cleared"); }),
  deleteAll: async () => {
    if ($("#del-confirm").value.trim() !== "DELETE") { const m = $("#del-msg"); m.hidden = false; m.style.color = "var(--red)"; m.textContent = "Type DELETE in capitals to confirm."; return; }
    try { await Store.wipe(); obStep = 0; cap = null; R = { page: "home" }; render(); toast("All your data was deleted"); }
    catch (e) { const m = $("#del-msg"); m.hidden = false; m.style.color = "var(--red)"; m.textContent = "Deletion didn't complete. Check your connection and try again."; }
  }
});
async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== "object" || !("skin" in data) || !("hair" in data)) throw new Error("bad");
    confirmBox("Replace your records with this backup?", `Backup from ${fmtDate(data.exportedAt)}. Your current records will be replaced.`, "Import", async () => {
      const photos = data.photos || {}; delete data.photos; delete data.exportedAt; delete data.app;
      Store.state = Object.assign(freshState(), data);
      for (const [id, d] of Object.entries(photos)) { try { await Store.putPhoto(id, d, nowISO()); } catch (e) {} }
      commit(); toast("Backup imported");
    }, false);
  } catch (e) { toast("That file isn't a RADIANCE patient backup."); }
}

/* ---------- 18. Global search ---------- */
ACTIONS.openSearch = () => {
  openModal(`<div class="row" style="flex-wrap:nowrap"><label class="sr" for="search-q">Search</label><input type="text" id="search-q" placeholder="Search products, ingredients, articles, notes, assessments…" autocomplete="off"><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div><div id="search-results" style="margin-top:14px"><p class="muted small">Searches only your own records and the article library.</p></div>`, true);
};
document.addEventListener("input", e => {
  if (e.target.id !== "search-q") return;
  const q = e.target.value.toLowerCase().trim(), out = $("#search-results"); if (!q) { out.innerHTML = ""; return; }
  const s = S(), hits = [], m = t => (t || "").toLowerCase().includes(q);
  s.products.filter(p => m(p.name) || m(p.brand) || p.ingredients.some(m)).forEach(p => hits.push(["Product", p.name, `data-a="viewProduct" data-id="${p.id}"`]));
  INGREDIENTS.filter(i => m(i.name) || i.aliases.some(m)).forEach(i => hits.push(["Ingredient", i.name, `data-a="viewIng" data-i="${esc(i.aliases[0])}"`]));
  ARTICLES.filter(a => m(a.title) || m(a.summary) || a.body.some(m)).forEach(a => hits.push(["Article", a.title, `data-a="openArticle" data-id="${a.id}"`]));
  s.assessments.filter(a => a.saved && (m(a.result?.summary) || m(a.notes))).forEach(a => hits.push(["Assessment", `${a.kind === "skin" ? "Face" : "Hair"} · ${fmtDate(a.at)}`, `data-a="go" data-page="${a.kind}" data-tab="history" data-id="${a.id}"`]));
  s.journal.filter(j => m(j.text)).forEach(j => hits.push(["Journal", j.text.slice(0, 80), `data-a="go" data-page="progress"`]));
  s.routines.filter(r => m(r.name) || r.steps.some(st => m(st.label))).forEach(r => hits.push(["Routine", r.name, `data-a="go" data-page="studio" data-tab="routines"`]));
  s.questions.filter(x => m(x.text)).forEach(x => hits.push(["Question", x.text.slice(0, 80), `data-a="go" data-page="pro" data-tab="questions"`]));
  s.appointments.filter(x => m(x.with) || m(x.notes)).forEach(x => hits.push(["Appointment", (x.with || "Clinician") + " · " + fmtDate(x.date), `data-a="go" data-page="pro" data-tab="appts"`]));
  out.innerHTML = hits.length ? `<div class="list">${hits.slice(0, 30).map(([k, t, a]) => `<button class="li" style="border:0;border-top:1px solid var(--line);background:none;text-align:left;cursor:pointer;width:100%" ${a}><span class="chip">${k}</span><span class="grow">${esc(t)}</span></button>`).join("")}</div>` : `<p class="muted small">No matches for “${esc(q)}”.</p>`;
});

