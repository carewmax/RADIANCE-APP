
/* ---------- 13. Progress: timeline, charts, reports ---------- */
const CAT_LABEL = { skin: "Skin", hair: "Hair", product: "Products", reaction: "Reactions", routine: "Routines", lifestyle: "Lifestyle", pro: "Professional care", general: "Notes" };
function timelineItems() {
  const s = S(), out = [];
  s.assessments.filter(a => a.saved).forEach(a => out.push({ at: a.at, cat: a.kind, title: a.kind === "skin" ? "Face photo" : (HAIR_MODES[a.mode]?.[0] || "Hair photo"), text: a.result?.summary || a.notes || "Photo saved", photo: a.photoIds?.[0], link: [a.kind, "history", a.id] }));
  s.products.forEach(p => p.createdAt && out.push({ at: p.createdAt, cat: "product", title: `Added ${p.name}`, text: [p.category, p.brand].filter(Boolean).join(" · ") }));
  s.reactions.forEach(r => out.push({ at: r.at, cat: "reaction", title: `Reaction: ${r.symptoms}`, text: `${r.severity} (self-rated) · ${r.area}` }));
  s.journal.forEach(j => out.push({ at: j.at, cat: j.category || "general", title: j.auto ? "Routine change" : CAT_LABEL[j.category] + " note", text: j.text + (j.tags?.length ? " · " + j.tags.join(", ") : ""), jid: j.id }));
  s.styles.forEach(st => out.push({ at: st.installedAt || dayKey(), cat: "hair", title: `Installed ${st.style}`, text: st.notes || st.comfort || "" }));
  s.hair.lengths.forEach(l => out.push({ at: l.at, cat: "hair", title: `Length measured: ${l.value} ${l.unit}`, text: l.where || "" }));
  s.appointments.forEach(a => out.push({ at: a.date, cat: "pro", title: `Appointment: ${a.with || "clinician"}`, text: a.notes || "" }));
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
const tlItem = it => `<div class="tl-item" data-cat="${it.cat}"><div class="row" style="gap:8px"><span class="mono muted">${fmtDate(it.at)}</span><span class="chip">${CAT_LABEL[it.cat] || it.cat}</span></div>
  <div class="row" style="gap:12px;margin-top:6px;flex-wrap:nowrap;align-items:flex-start">${it.photo ? `<img class="thumb" data-photo="${it.photo}" alt="">` : ""}<div style="min-width:0"><b class="small">${esc(it.title)}</b>${it.text ? `<p class="small muted" style="margin-top:2px">${esc(it.text)}</p>` : ""}
  ${it.link ? `<button class="btn sm ghost" style="padding-left:0" data-a="go" data-page="${it.link[0]}" data-tab="${it.link[1]}" data-id="${it.link[2]}">Open</button>` : ""}${it.jid ? `<button class="btn sm ghost" style="padding-left:0" data-a="delJournal" data-id="${it.jid}">Delete</button>` : ""}</div></div></div>`;

let tlFilter = "all";
PAGES.progress = () => {
  const t = R.tab || "timeline";
  return pageHead("My Progress", "Everything, in order", "One timeline for photos, products, reactions, routines and notes. Charts appear only once there's data behind them.", `<button class="btn" data-a="newJournal">${ic("plus")} Journal entry</button>`) +
    tabs([["timeline", "Timeline"], ["charts", "Charts"], ["report", "Monthly report"], ["passport", "Care Passport"]], t) +
    (t === "timeline" ? timelineView() : t === "charts" ? chartsView() : t === "report" ? reportView() : passportView());
};
function timelineView() {
  const items = timelineItems().filter(i => tlFilter === "all" || i.cat === tlFilter);
  return `<div class="row" style="gap:6px;margin-bottom:16px">${[["all", "All"], ...Object.entries(CAT_LABEL)].map(([k, l]) => `<button class="chip toggle-chip" aria-pressed="${tlFilter === k}" data-a="tlFilter" data-k="${k}">${l}</button>`).join("")}</div>
  ${items.length ? `<div class="card"><div class="tl">${items.slice(0, 150).map(tlItem).join("")}</div></div>` : emptyBox("Nothing here yet.")}`;
}
ACTIONS.tlFilter = el => { tlFilter = el.dataset.k; rerenderKeep(); };

function lineChart(pts, unit) {
  const W = 600, H = 220, P = { l: 44, r: 16, t: 14, b: 30 };
  const xs = pts.map(p => new Date(p.x).getTime()), ys = pts.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1, yMin = Math.floor(Math.min(...ys) * 0.9), yMax = Math.ceil(Math.max(...ys) * 1.05) || 1;
  const sx = x => P.l + (x - x0) / (x1 - x0 || 1) * (W - P.l - P.r), sy = y => H - P.b - (y - yMin) / (yMax - yMin || 1) * (H - P.t - P.b);
  const ticks = [yMin, (yMin + yMax) / 2, yMax].map(v => Math.round(v * 10) / 10);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${sx(xs[i]).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart, ${pts.length} points">${ticks.map(t => `<line x1="${P.l}" x2="${W - P.r}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--line)"/><text x="${P.l - 6}" y="${sy(t) + 3}" text-anchor="end">${t}</text>`).join("")}
    <path d="${path} L${sx(xs.at(-1))} ${H - P.b} L${sx(xs[0])} ${H - P.b} Z" fill="var(--sage-soft)"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    ${pts.map((p, i) => `<circle cx="${sx(xs[i])}" cy="${sy(p.y)}" r="${i === pts.length - 1 ? 5 : 3.5}" fill="var(--accent)"><title>${fmtDate(p.x)}: ${Math.round(p.y * 10) / 10} ${unit}</title></circle>`).join("")}
    <text x="${sx(xs[0])}" y="${H - 8}" text-anchor="start">${fmtDate(pts[0].x, { day: "numeric", month: "short" })}</text><text x="${sx(xs.at(-1))}" y="${H - 8}" text-anchor="end">${fmtDate(pts.at(-1).x, { day: "numeric", month: "short" })}</text>
    <text x="8" y="${P.t + 4}">${unit}</text></svg>`;
}
function barChart(data, aria) {
  const W = 600, H = 200, P = { l: 30, r: 10, t: 14, b: 30 }, max = Math.max(1, ...data.map(d => d.v));
  const bw = (W - P.l - P.r) / data.length;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}"><line x1="${P.l}" x2="${W - P.r}" y1="${H - P.b}" y2="${H - P.b}" stroke="var(--line-2)"/><text x="${P.l - 6}" y="${P.t + 4}" text-anchor="end">${max}</text><line x1="${P.l}" x2="${W - P.r}" y1="${P.t}" y2="${P.t}" stroke="var(--line)"/>
    ${data.map((d, i) => { const h = d.v / max * (H - P.t - P.b); return `<rect x="${P.l + i * bw + bw * 0.18}" y="${H - P.b - h}" width="${bw * 0.64}" height="${h}" rx="3" fill="${i === data.length - 1 ? "var(--accent)" : "var(--sage)"}"><title>${esc(d.l)}: ${d.v}</title></rect>${data.length <= 16 && (i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) ? `<text x="${P.l + i * bw + bw / 2}" y="${H - 10}" text-anchor="middle">${esc(d.s || d.l)}</text>` : ""}`; }).join("")}</svg>`;
}
function chartsView() {
  const s = S(), cards = [];
  if (Object.keys(s.completions).length) {
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5); const k = dayKey(d); return { l: fmtDate(k), s: String(d.getDate()), v: Object.keys(s.completions[k] || {}).length }; });
    cards.push(`<div class="card chart"><div class="label">Routine steps ticked · last 14 days</div><div style="margin-top:12px">${barChart(days, "Routine steps ticked per day")}</div><p class="muted small" style="margin-top:6px">Only counts steps you chose to tick. Days without ticks aren't failures.</p></div>`);
  }
  if (s.hair.lengths.length >= 2) cards.push(`<div class="card chart"><div class="label">Measured hair length</div><div style="margin-top:12px">${lineChart([...s.hair.lengths].sort((a, b) => a.at.localeCompare(b.at)).map(x => ({ x: x.at, y: x.unit === "in" ? x.value * 2.54 : x.value })), "cm")}</div></div>`);
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d.toISOString().slice(0, 7); });
  const mlabel = m => new Date(m + "-15").toLocaleDateString(undefined, { month: "short" });
  if (s.reactions.length) cards.push(`<div class="card chart"><div class="label">Reactions logged · by month</div><div style="margin-top:12px">${barChart(months.map(m => ({ l: m, s: mlabel(m), v: s.reactions.filter(r => r.at.startsWith(m)).length })), "Reactions logged per month")}</div></div>`);
  const sa = s.assessments.filter(a => a.saved);
  if (sa.length) cards.push(`<div class="card chart"><div class="label">Photos saved · by month</div><div style="margin-top:12px">${barChart(months.map(m => ({ l: m, s: mlabel(m), v: sa.filter(a => a.at.startsWith(m)).length })), "Photos saved per month")}</div></div>`);
  return cards.length ? `<div class="grid g2">${cards.join("")}</div><p class="muted small" style="margin-top:14px">Charts show counts of things you recorded. They are not health scores.</p>` : emptyBox("No charts yet. Tick routine steps, log hair lengths or save photos and they'll appear here.");
}

function docWrap(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font:15px/1.55 -apple-system,Segoe UI,sans-serif;color:#242923;max-width:760px;margin:32px auto;padding:0 16px}h1{font-family:Georgia,serif;font-weight:400;color:#234C3B}h2{font-family:Georgia,serif;font-weight:400;border-bottom:1px solid #E2DED3;padding-bottom:4px;margin-top:28px}dt{color:#6B716B}dl{display:grid;grid-template-columns:200px 1fr;gap:4px 12px}dd{margin:0}.note{font-size:13px;color:#6B716B;border-top:1px solid #E2DED3;padding-top:12px;margin-top:28px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #E2DED3;padding:6px;text-align:left;font-size:14px}</style></head><body>
<h1>${esc(title)}</h1><p>${esc(S().profile.name || "")} · generated ${fmtDate(nowISO())} by ${esc(CONFIG.brand.name)}</p>${body}</body></html>`;
}
const dl = rows => `<dl>${rows.filter(r => r[1]).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(Array.isArray(v) ? v.join(", ") : v)}</dd>`).join("")}</dl>`;
const SECTIONS = {
  skin: ["Skin ID", () => { const s = S().skin; return `<h2>Skin ID</h2>${dl([["Skin type", s.type], ["Sensitivity", s.sensitivity], ["Tendency", s.tendency], ["Feels tight", s.dehydration], ["Concerns", s.concerns], ["Goals", s.goals], ["Notes", s.notes]])}<p class="note">All self-reported unless marked otherwise.</p>`; }],
  hair: ["Hair ID", () => { const h = S().hair; return `<h2>Hair ID</h2>${dl([["Curl pattern", h.curl + (h.curlDetail ? " (" + h.curlDetail + ")" : "")], ["Porosity", h.porosity && h.porosity + (h.src.porosity === "questionnaire" ? " (questionnaire)" : " (self-reported)")], ["Density", h.density], ["Strand thickness", h.thickness], ["Elasticity", h.elasticity], ["Scalp type", h.scalp.type], ["Flaking", h.scalp.flaking], ["Itch", h.scalp.itch], ["Chemical treatments", h.chemical], ["Heat", h.heat], ["Wash frequency", h.washFreq], ["Concerns", h.concerns], ["Goals", h.goals]])}`; }],
  sens: ["Allergies, sensitivities and reactions", () => `<h2>Allergies and reactions</h2>${dl([["Recorded allergies / sensitivities", S().skin.allergies || "None recorded"]])}${S().reactions.length ? `<table><tr><th>Date</th><th>What happened</th><th>Severity (self-rated)</th><th>Products</th></tr>${S().reactions.map(r => `<tr><td>${fmtDate(r.at)}</td><td>${esc(r.symptoms)} (${esc(r.area)})</td><td>${esc(r.severity)}</td><td>${esc(r.productIds.map(id => S().products.find(p => p.id === id)?.name || "—").join(", "))}</td></tr>`).join("")}</table>` : "<p>No reactions logged.</p>"}`],
  routines: ["Current routines", () => `<h2>Routines</h2>${S().routines.filter(r => !r.archived).map(r => `<p><b>${esc(r.name)}</b> (${r.days?.length ? r.days.map(d => WD[d]).join(" ") : "daily"}): ${r.steps.map(st => esc(st.label) + (st.productId ? " – " + esc(S().products.find(p => p.id === st.productId)?.name || "") : "")).join("; ")}</p>`).join("") || "<p>None.</p>"}`],
  products: ["Product inventory", () => `<h2>Products</h2>${S().products.length ? `<table><tr><th>Product</th><th>Category</th><th>Status</th><th>Ingredients</th></tr>${S().products.map(p => `<tr><td>${esc(p.name)}${p.brand ? "<br><small>" + esc(p.brand) + "</small>" : ""}</td><td>${esc(p.category)}</td><td>${esc(p.status)}</td><td><small>${esc(p.ingredients.join(", ") || "Not recorded")}</small></td></tr>`).join("")}</table><p class="note">Product details are user-entered and unverified.</p>` : "<p>None.</p>"}`],
  assess: ["Selected photo assessments", () => { const sel = S().assessments.filter(a => a.saved && a.includeInReport); return `<h2>Photo assessments</h2>${sel.length ? sel.map(a => `<p><b>${fmtDate(a.at)} · ${a.kind === "skin" ? "Face" : esc(HAIR_MODES[a.mode]?.[0] || "Hair")}</b><br>${esc(a.result?.summary || "Photo only")}${a.notes ? "<br><i>Note: " + esc(a.notes) + "</i>" : ""}</p>`).join("") + `<p class="note">AI descriptions (Claude, via claude.ai) of visible features in a single photo. Not diagnoses.</p>` : `<p>None selected. Tick "Include in my next consultation report" on an assessment to add it.</p>`}`; }],
  questions: ["Questions for the clinician", () => `<h2>My questions</h2>${S().questions.filter(q => q.include).map(q => `<p>• ${esc(q.text)}</p>`).join("") || "<p>None.</p>"}`],
  timeline: ["Recent timeline (90 days)", () => { const cut = dayKey(new Date(Date.now() - 90 * 864e5)); const it = timelineItems().filter(i => i.at.slice(0, 10) >= cut); return `<h2>Last 90 days</h2>${it.length ? `<table>${it.map(i => `<tr><td>${fmtDate(i.at)}</td><td>${esc(CAT_LABEL[i.cat] || i.cat)}</td><td>${esc(i.title)}${i.text ? "<br><small>" + esc(i.text) + "</small>" : ""}</td></tr>`).join("")}</table>` : "<p>No entries.</p>"}`; }]
};
let passSel = ["skin", "hair", "sens", "routines", "products"], prepSel = ["skin", "hair", "sens", "products", "assess", "questions", "timeline"];
function builder(selArr, key, title, fname, intro) {
  const html = selArr.map(k => SECTIONS[k][1]()).join("");
  return `<div class="grid" style="grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:20px" id="coach-grid"><div class="card"><div class="label">Include</div><div class="stack" style="margin-top:10px;gap:6px">${Object.entries(SECTIONS).map(([k, [l]]) => `<label class="row small"><input type="checkbox" data-a="secToggle" data-set="${key}" data-k="${k}" ${selArr.includes(k) ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> ${l}</label>`).join("")}</div>
    <p class="muted small" style="margin-top:12px">${intro}</p><div class="stack" style="margin-top:12px"><button class="btn primary" data-a="saveDoc" data-set="${key}" data-title="${esc(title)}" data-f="${fname}">Save as file</button></div></div>
    <div class="card report" style="overflow-x:auto"><div class="label">Preview</div><h2 style="margin-top:6px">${esc(title)}</h2>${html.replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>")}</div></div>`;
}
const passportView = () => builder(passSel, "pass", "Personal Care Passport", "care-passport", "A summary you control. Review the preview before sharing it with anyone.");
Object.assign(ACTIONS, {
  secToggle: el => { const arr = el.dataset.set === "pass" ? passSel : prepSel; const k = el.dataset.k, i = arr.indexOf(k); i >= 0 ? arr.splice(i, 1) : arr.push(k); arr.sort((a, b) => Object.keys(SECTIONS).indexOf(a) - Object.keys(SECTIONS).indexOf(b)); rerenderKeep(); },
  saveDoc: el => { const arr = el.dataset.set === "pass" ? passSel : prepSel; saveFile(`${el.dataset.f}-${dayKey()}.html`, docWrap(el.dataset.title, arr.map(k => SECTIONS[k][1]()).join("") + `<p class="note">Self-reported information and AI-assisted photo descriptions. Not a medical record or diagnosis.</p>`)); }
});

let reportMonth = new Date().toISOString().slice(0, 7);
function monthReport(m) {
  const s = S(), inM = d => (d || "").startsWith(m);
  const A = s.assessments.filter(a => a.saved && inM(a.at)), P = s.products.filter(p => inM(p.createdAt)), X = s.reactions.filter(r => inM(r.at)), J = s.journal.filter(j => inM(j.at) && !j.auto);
  const hist = [...s.skin.history, ...s.hair.history].filter(h => inM(h.at)), days = Object.keys(s.completions).filter(k => k.startsWith(m) && Object.keys(s.completions[k]).length).length;
  return `<h2>Recorded data</h2><dl><dt>Photos saved</dt><dd>${A.length} (${A.filter(a => a.kind === "skin").length} face, ${A.filter(a => a.kind === "hair").length} hair/scalp)</dd><dt>Products added</dt><dd>${P.map(p => esc(p.name)).join(", ") || "None"}</dd><dt>Reactions logged</dt><dd>${X.length}</dd><dt>Days with routine steps ticked</dt><dd>${days}</dd><dt>Profile changes</dt><dd>${hist.length ? hist.map(h => esc(pretty(h.field)) + " → " + esc(h.to || "—")).join("; ") : "None"}</dd><dt>Open questions</dt><dd>${s.questions.length}</dd></dl>
  ${A.filter(a => a.result).length ? `<h2>AI photo descriptions</h2>${A.filter(a => a.result).map(a => `<p><b>${fmtDate(a.at)}</b>: ${esc(a.result.summary)}</p>`).join("")}<p class="note">Generated by Claude from single photos. Descriptions of what was visible, not diagnoses.</p>` : ""}
  <h2>Your own notes</h2>${J.length || X.length ? [...J.map(j => `<p>${fmtDate(j.at)}: ${esc(j.text)}</p>`), ...X.map(r => `<p>${fmtDate(r.at)}: ${esc(r.symptoms)} (${esc(r.severity)}, self-rated)</p>`)].join("") : "<p>No notes this month.</p>"}`;
}
function reportView() {
  const months = [...new Set([new Date().toISOString().slice(0, 7), ...timelineItems().map(i => i.at.slice(0, 7))])].sort().reverse();
  return `<div class="spread" style="margin-bottom:14px"><label class="field" for="rep-m" style="max-width:240px"><span>Month</span><select id="rep-m" data-a2="repm">${months.map(m => `<option value="${m}" ${m === reportMonth ? "selected" : ""}>${new Date(m + "-15").toLocaleDateString(undefined, { month: "long", year: "numeric" })}</option>`).join("")}</select></label><button class="btn primary" data-a="saveReport">Save as file</button></div>
  <div class="card report">${monthReport(reportMonth).replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>")}</div>`;
}
document.addEventListener("change", e => { if (e.target.dataset.a2 === "repm") { reportMonth = e.target.value; rerenderKeep(); } });
ACTIONS.saveReport = () => saveFile(`monthly-report-${reportMonth}.html`, docWrap(`Monthly report · ${new Date(reportMonth + "-15").toLocaleDateString(undefined, { month: "long", year: "numeric" })}`, monthReport(reportMonth)));

/* Journal (incl. optional lifestyle factors) */
const LIFESTYLE = ["Lots of sun", "Humid weather", "Dry or windy weather", "Travel", "Poor sleep", "Stressful week", "Exercise / sweat", "New diet", "Period", "Swimming"];
function newJournalModal(cat = "general", prefill = "") {
  openModal(`<h3>Journal entry</h3><div class="stack" style="margin-top:14px"><div class="grid g2"><label class="field" for="jn-cat"><span>About</span><select id="jn-cat">${Object.entries(CAT_LABEL).filter(([k]) => !["product", "reaction", "pro"].includes(k)).map(([k, l]) => `<option value="${k}" ${k === cat ? "selected" : ""}>${l}</option>`).join("")}</select></label><label class="field" for="jn-date"><span>Date</span><input type="date" id="jn-date" value="${dayKey()}"></label></div>
    <label class="field" for="jn-text"><span>Note</span><textarea id="jn-text">${esc(prefill)}</textarea></label>
    <div class="field"><span>Optional factors</span><div class="row" style="gap:6px">${LIFESTYLE.map(t => `<button type="button" class="chip toggle-chip jn-tag" aria-pressed="false" data-a="jnTag">${t}</button>`).join("")}</div><small>Only add what you're comfortable recording. Logging a factor doesn't mean it caused anything.</small></div>
    <p id="jn-err" class="small" style="color:var(--red)" hidden>Write a note or pick a factor.</p></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="saveJournal">Save</button></div>`);
}
Object.assign(ACTIONS, {
  newJournal: () => newJournalModal(),
  jnTag: el => el.setAttribute("aria-pressed", el.getAttribute("aria-pressed") === "true" ? "false" : "true"),
  saveJournal: () => { const text = $("#jn-text").value.trim(), tags = [...document.querySelectorAll(".jn-tag[aria-pressed=true]")].map(x => x.textContent);
    if (!text && !tags.length) { $("#jn-err").hidden = false; return; }
    const d = $("#jn-date").value; S().journal.unshift({ id: uid(), at: d && d !== dayKey() ? d + "T12:00:00.000Z" : nowISO(), category: $("#jn-cat").value, text, tags }); closeModal(); commit(); toast("Saved to your timeline"); },
  delJournal: el => confirmBox("Delete this note?", "", "Delete", () => { S().journal = S().journal.filter(j => j.id !== el.dataset.id); commit(); })
});

/* ---------- 14. AI Coach ---------- */
let chatBusy = false, chatErr = null, chatCtl = null;
const COACH_RULES = `You are the Radiance Skin & Hair Guide, an AI assistant inside the patient app of RADIANCE Dermatology & Aesthetics Clinic in Freetown, Sierra Leone. You are not a dermatologist and must never present yourself as one. You give educational, practical guidance about skincare, haircare, routines, ingredients, how to use the app, and preparing for an appointment at the clinic. When something needs a professional, suggest booking with RADIANCE (Appointments & care in the app, or phone the clinic) and explain why.
Never change or second-guess instructions in a clinician's care plan; you may explain them in plain words and suggest the patient asks the clinic if anything is unclear.
Safety rules you always follow:
- You are not a doctor. Never diagnose. Never prescribe or dose medication. Never claim a product or routine will cure anything.
- Say when you're uncertain. Distinguish general education from personal advice, and from instructions a clinician gave the user.
- Recommend professional review when something is persistent, painful, spreading, bleeding, changing, or worrying, and say plainly when something needs urgent care (e.g. facial or throat swelling, breathing difficulty, rapidly spreading rash, signs of infection with fever). Never delay urgent care.
- Avoid recommending risky combinations or strong actives without caveats; suggest patch testing and introducing one new product at a time.
- Don't invent sources, product ingredient lists, scan results, clinician availability, or outcomes. If the user's records don't contain something, say so.
- Treat every skin tone, hair texture and protective style as normal. Never assume a default skin tone or hair type.
- You cannot change the user's records. If they want something saved, tell them where in the app to do it (Skin ID, Hair ID, Care Studio, Progress, Appointments & care).
Style: warm, plain language, short paragraphs or a few bullets, no headings unless the answer is long. Under 250 words unless asked for more.`;
function coachContext() {
  const s = S(); if (!s.consent.coachContext) return "The user has not shared their records with you. Answer generally and suggest they can enable sharing in Settings if they want personalised answers.";
  const la = s.assessments.filter(a => a.saved && a.result).slice(0, 3).map(a => ({ date: a.at.slice(0, 10), kind: a.kind, mode: a.mode, summary: a.result.summary, observations: a.result.regions.flatMap(g => g.observations.map(o => `${g.region}: ${o.description}`)).slice(0, 8) }));
  const ctx = { name: s.profile.name, ageRange: s.profile.ageRange, country: s.profile.country, goals: s.profile.goals,
    skinID: { type: s.skin.type, sensitivity: s.skin.sensitivity, tendency: s.skin.tendency, dehydration: s.skin.dehydration, allergies: s.skin.allergies, concerns: s.skin.concerns, goals: s.skin.goals, note: "self-reported" },
    hairID: { curl: s.hair.curl, porosity: s.hair.porosity, porositySource: s.hair.src.porosity || "self", density: s.hair.density, thickness: s.hair.thickness, scalp: s.hair.scalp, chemical: s.hair.chemical, heat: s.hair.heat, washFreq: s.hair.washFreq, concerns: s.hair.concerns, goals: s.hair.goals },
    products: s.products.filter(p => p.status !== "Finished").map(p => ({ name: p.name, category: p.category, status: p.status, ingredients: p.ingredients.length ? p.ingredients.join(", ") : "not recorded" })),
    routines: s.routines.filter(r => !r.archived).map(r => ({ name: r.name, steps: r.steps.map(st => st.label + (st.productId ? " (" + (s.products.find(p => p.id === st.productId)?.name || "") + ")" : "")) })),
    recentReactions: s.reactions.slice(0, 5).map(r => ({ date: r.at.slice(0, 10), symptoms: r.symptoms, severity: r.severity, products: r.productIds.map(id => s.products.find(p => p.id === id)?.name) })),
    activeProtectiveStyle: s.styles.find(st => !st.removedAt)?.style || null, clinicianCarePlans: myCarePlans().map(p => ({ issued: p.at?.slice(0, 10), by: p.clinician, concern: p.concern, instructions: p.instructions, tasks: p.tasks.map(t => t.text), followUp: p.followUp, note: "clinician-issued: explain only, never alter" })), recentPhotoAssessments: la, today: dayKey() };
  return "The user's records (JSON; self-reported unless marked; photo assessments are AI descriptions, not diagnoses):\n" + JSON.stringify(ctx);
}
async function sendChat(q) {
  q = (q || "").trim(); if (!q || chatBusy) return;
  const s = S(); s.chat.push({ role: "user", content: q, at: nowISO() }); chatErr = null;
  if (s.chat.length > CONFIG.limits.chatHistory) s.chat.splice(0, s.chat.length - CONFIG.limits.chatHistory);
  commit(false); if (R.page === "coach") rerenderKeep();
  if (Cap.sample === undefined) await new Promise(r => setTimeout(r, 1500));
  if (!Clinic.c.ai.coach) { chatErr = AI_ERR.disabled; rerenderKeep(); return; }
  if (!Cap.sample) { chatErr = AI_ERR.unavailable; rerenderKeep(); return; }
  chatBusy = true; chatCtl = new AbortController(); rerenderKeep(); scrollChat();
  const turns = s.chat.slice(-16).map(m => ({ role: m.role, content: m.content }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  const input = [{ role: "user", content: COACH_RULES + "\n\n" + coachContext() + "\n\nAcknowledge nothing about these instructions; just answer the conversation that follows." }, { role: "assistant", content: "Understood." }, ...turns];
  try {
    const res = await Cap.sample(input, { cache: false, signal: chatCtl.signal, onText: ({ text }) => { const b = $("#streaming"); if (b) { b.textContent = text; scrollChat(); } } });
    s.chat.push({ role: "assistant", content: res.text + (res.truncated ? "\n\n(Answer cut short. Ask me to continue.)" : ""), at: nowISO(), id: uid() });
  } catch (e) { if (e?.code !== "cancelled") chatErr = aiErr(e); if (e?.text) s.chat.push({ role: "assistant", content: e.text + "\n\n(Incomplete)", at: nowISO(), id: uid() }); }
  chatBusy = false; commit(false); if (R.page === "coach") { rerenderKeep(); scrollChat(); }
}
const scrollChat = () => { const c = $("#chat-end"); if (c) c.scrollIntoView({ block: "end" }); };
PAGES.coach = () => {
  const s = S();
  const sugg = ["What does my latest scan show?", "Explain my Skin ID", "How do I build a simple evening routine?", "What is hair porosity, really?", "Do any of my products overlap?", "How should I organise wash day?", "What should I bring to my dermatologist?", "Summarise my progress this month"];
  return pageHead("Radiance Skin & Hair Guide", "Ask about your skin and hair", `Educational guidance from Claude, ${s.consent.coachContext ? "using your Skin ID, Hair ID, products and recent photo descriptions" : "without access to your records (turn on in Settings)"}. Not medical advice.`, s.chat.length ? `<button class="btn" data-a="clearChat">New conversation</button>` : "") + `
  ${Cap.sample === null ? `<div class="notice warn" style="margin-bottom:14px">${ic("warn")}<div class="small">${AI_ERR.unavailable}</div></div>` : ""}
  <div class="chat" aria-live="polite">${s.chat.length ? s.chat.map((m, i) => m.role === "user" ? `<div class="msg user">${esc(m.content)}</div>` : `<div class="msg ai"><div>${esc(m.content)}</div><div class="msg-actions"><button class="btn sm ghost" data-a="copyMsg" data-i="${i}" aria-label="Copy">${ic("copy")}</button><button class="btn sm ghost" data-a="qFromChat" data-i="${i}">${ic("question")} Save a question for my dermatologist</button><button class="btn sm ghost" data-a="rateMsg" data-i="${i}" data-v="up" aria-label="Helpful" ${m.rating === "up" ? 'aria-pressed="true" style="color:var(--accent)"' : ""}>${ic("thumbUp")}</button><button class="btn sm ghost" data-a="rateMsg" data-i="${i}" data-v="down" aria-label="Not helpful" ${m.rating === "down" ? 'aria-pressed="true" style="color:var(--red)"' : ""}>${ic("thumbDown")}</button></div></div>`).join("")
    : `<div class="card lav"><p>Try one of these, or ask anything about skincare, haircare, ingredients or preparing for an appointment.</p></div>`}
    ${chatBusy ? `<div class="msg ai"><div id="streaming"><span class="spinner" style="display:inline-block"></span></div><button class="btn sm ghost" data-a="stopChat" style="margin-top:6px">Stop</button></div>` : ""}
    ${chatErr ? `<div class="notice err">${ic("warn")}<div class="small">${esc(chatErr)} ${s.chat.at(-1)?.role === "user" ? `<button class="btn sm" data-a="retryChat">Retry</button>` : ""}</div></div>` : ""}
    <div id="chat-end"></div></div>
  <div class="row" style="gap:6px;margin-top:14px">${sugg.map(q => `<button class="chip toggle-chip" data-a="askPreset" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
  <div class="composer"><label class="sr" for="chat-input">Message</label><textarea id="chat-input" placeholder="Ask a question…" ${chatBusy ? "disabled" : ""}></textarea><button class="btn primary" data-a="sendChat" ${chatBusy ? "disabled" : ""}>Send</button></div>
  <p class="muted small">If something is painful, spreading, bleeding or changing, or you feel unwell, contact a doctor. For facial swelling or trouble breathing, get emergency care.</p>`;
};
Object.assign(ACTIONS, {
  sendChat: () => { const t = $("#chat-input"); const v = t?.value; if (t) t.value = ""; sendChat(v); },
  stopChat: () => chatCtl?.abort(),
  retryChat: () => { const last = S().chat.pop(); chatErr = null; sendChat(last.content); },
  clearChat: () => confirmBox("Start a new conversation?", "This clears the current chat history.", "Clear", () => { S().chat = []; chatErr = null; commit(); }),
  copyMsg: el => copyText(S().chat[+el.dataset.i].content),
  rateMsg: el => { const m = S().chat[+el.dataset.i]; m.rating = m.rating === el.dataset.v ? null : el.dataset.v; S().aiFeedback.unshift({ id: uid(), at: nowISO(), target: "chat", kind: m.rating || "cleared" }); commit(false); rerenderKeep(); },
  qFromChat: el => { const i = +el.dataset.i; const prevQ = [...S().chat.slice(0, i)].reverse().find(m => m.role === "user")?.content || ""; questionModal(prevQ); }
});
