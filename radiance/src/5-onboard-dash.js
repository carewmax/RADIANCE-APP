
/* ---------- 6. Onboarding ---------- */
let obStep = 0;
const OB_TOTAL = 5;
function renderOnboarding() {
  const s = S();
  const steps = `<div class="ob-steps" aria-hidden="true">${Array.from({ length: OB_TOTAL }, (_, i) => `<i class="${i < obStep ? "on" : ""}"></i>`).join("")}</div>`;
  const nav = (next = "Continue", skip = true) => `<div class="spread" style="margin-top:28px"><button class="btn ghost" data-a="obBack">Back</button><div class="row">${skip ? `<button class="btn ghost" data-a="obNext">Skip for now</button>` : ""}<button class="btn primary" data-a="obNext">${next}</button></div></div>`;
  let body = "";
  if (obStep === 0) {
    return `<div class="ob" style="max-width:1040px">
      <div class="spread" style="padding:0 0 30px"><button class="brand brand-btn" data-a="site" data-path="">${brandLockup("Patient portal")}</button><button class="btn sm ghost" data-a="site" data-path="">Back to website</button></div>
      <div class="hero">
        <div class="stack" style="gap:18px">
          <h1>Your skin and hair, <em>between visits.</em></h1>
          <p class="muted" style="font-size:1.08rem;max-width:52ch">Build your skin and hair profile once, take guided photos with quality checks, follow your care plan from the RADIANCE team, and arrive at each appointment with a clear history.</p>
          <div class="row"><button class="btn primary" data-a="obStart">Set up my profile</button><button class="btn" data-a="obExample">Explore with example data</button></div>
          <p class="muted small" style="max-width:56ch">${ic("info", "")} AI photo observations describe what's visible in a picture. They don't diagnose conditions and don't replace an examination by a RADIANCE clinician.</p>
          ${Backend.configured ? `<p class="small">Signed in as ${esc(Backend.user?.email || "")}. <button class="btn sm ghost" data-a="signOut">Sign out</button></p>` : ""}
        </div>
        <div class="specimen" aria-hidden="true">
          <div class="idcard"><div class="spread"><span class="label">Skin ID</span><span class="code">SKN · 0001</span></div>
            <dl class="kv" style="margin-top:12px"><dt>Type</dt><dd>Combination ${srcChip("self")}</dd><dt>Sensitivity</dt><dd>Somewhat sensitive</dd><dt>Watching</dt><dd>Dark spots, texture</dd></dl></div>
          <div class="idcard"><div class="spread"><span class="label">Hair ID</span><span class="code">HR · 0001</span></div>
            <dl class="kv" style="margin-top:12px"><dt>Pattern</dt><dd>Coily</dd><dt>Porosity</dt><dd>High ${srcChip("questionnaire")}</dd><dt>Density</dt><dd>Medium</dd></dl></div>
          <p class="mono muted">Illustration of the profiles you'll build</p>
        </div>
      </div></div>`;
  }
  if (obStep === 1) body = `<h2>About you</h2><p class="muted" style="margin-top:6px">Everything here is optional and can be changed later.</p>
    <div class="grid g2" style="margin-top:20px">${txt("profile.name", "What should we call you?", "", "First name or nickname")}${sel("profile.ageRange", OPT.ageRange, "Age range", "Used only to tailor general guidance.", false)}${txt("profile.country", "Country", "Helps with time zones and sun-protection guidance.", "e.g. Sierra Leone")}</div>
    <div class="field" style="margin-top:18px"><span>What would you like help with?</span>${chipsPick("profile.goals", OPT.goals)}</div>`;
  if (obStep === 2) body = `<h2>Your skin, as you see it</h2><p class="muted" style="margin-top:6px">These are recorded as <b>self-reported</b>. Type, sensitivity and allergies are different things, so each gets its own answer.</p>
    <div class="stack" style="margin-top:20px;gap:18px">
      <div class="field"><span>Skin type</span>${choices("skin.type", OPT.skinType)}</div>
      <div class="field"><span>Sensitivity</span>${choices("skin.sensitivity", OPT.sensitivity)}</div>
      <div class="field"><span>Main concerns</span>${chipsPick("skin.concerns", OPT.skinConcerns)}</div>
      ${txt("skin.allergies", "Known ingredient allergies or sensitivities", "Separate with commas. Used to flag products in your inventory.", "e.g. fragrance, lanolin")}
    </div>`;
  if (obStep === 3) body = `<h2>Your hair and scalp</h2><p class="muted" style="margin-top:6px">Pick "Not sure" freely. Porosity in particular is hard to know without a guided check, and you can do that later in Hair Lab.</p>
    <div class="stack" style="margin-top:20px;gap:18px">
      <div class="field"><span>Curl pattern</span>${choices("hair.curl", OPT.curl)}</div>
      <div class="grid g3">${sel("hair.porosity", OPT.porosity, "Porosity", "", false)}${sel("hair.density", OPT.density, "Density", "How much hair overall", false)}${sel("hair.thickness", OPT.thickness, "Strand thickness", "Width of a single strand", false)}</div>
      <div class="grid g3">${sel("hair.scalp.type", OPT.scalp, "Scalp type", "", false)}${sel("hair.washFreq", OPT.washFreq, "Wash frequency", "", false)}${sel("hair.chemical", OPT.chemical, "Chemical treatments", "", false)}</div>
      <div class="field"><span>Main concerns</span>${chipsPick("hair.concerns", OPT.hairConcerns)}</div>
    </div>`;
  if (obStep === 4) body = `<h2>Photos and AI: your choice</h2><p class="muted" style="margin-top:6px">Nothing is captured or sent until you start a scan yourself.</p>
    <div class="stack" style="margin-top:20px">
      <label class="card row" style="align-items:flex-start;gap:14px;cursor:pointer"><input type="checkbox" data-bind="consent.photos" ${s.consent.photos ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"><div class="stack" style="gap:4px"><b>Store my photos with my records</b>
        <span class="muted small">Photos are downscaled and kept in ${Store.mode === "cloud" ? "your private store on claude.ai, readable only by your signed-in account" : "this browser's storage on this device"}. You can delete any photo, or everything, from Settings.</span></div></label>
      <label class="card row" style="align-items:flex-start;gap:14px;cursor:pointer"><input type="checkbox" data-bind="consent.ai" ${s.consent.ai ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"><div class="stack" style="gap:4px"><b>Allow AI photo analysis</b>
        <span class="muted small">When you choose "Analyse", the photo is sent to Claude (Anthropic) through claude.ai to describe visible features. Analysis runs on a server, not on your device. Results are cosmetic observations, not diagnoses, and are never used to train models by this app.</span></div></label>
      <label class="card row" style="align-items:flex-start;gap:14px;cursor:pointer"><input type="checkbox" data-bind="consent.coachContext" ${s.consent.coachContext ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"><div class="stack" style="gap:4px"><b>Let the AI Coach read my Skin ID, Hair ID and products</b>
        <span class="muted small">So you don't have to repeat yourself. The coach never changes your records without asking.</span></div></label>
      <p class="muted small">No records are shared with any clinician unless you build and send a report yourself.</p>
    </div>`;
  if (obStep === 5) body = `<h2>You're set${s.profile.name ? ", " + esc(s.profile.name) : ""}.</h2><p class="muted" style="margin-top:6px">Your dashboard is built from what you entered. No scans or scores are shown until you create them.</p>
    <div class="grid g2" style="margin-top:20px">
      <button class="card raised" data-a="obFinish" data-page="skin" data-tab="scan" style="text-align:left;cursor:pointer"><div class="label">Skin Lab</div><h3 style="margin-top:6px">Take a first face photo</h3><p class="muted small" style="margin-top:6px">Guided capture with lighting and focus checks.</p></button>
      <button class="card raised" data-a="obFinish" data-page="hair" data-tab="porosity" style="text-align:left;cursor:pointer"><div class="label">Hair Lab</div><h3 style="margin-top:6px">Check your porosity tendency</h3><p class="muted small" style="margin-top:6px">A short questionnaire, saved to your Hair ID.</p></button>
    </div>
    <div class="spread" style="margin-top:28px"><button class="btn ghost" data-a="obBack">Back</button><button class="btn primary" data-a="obFinish" data-page="home">Go to my dashboard</button></div>`;
  return `<div class="ob"><div class="brand" style="padding:0"><span class="brand-mark">${CONFIG.brand.mark}</span><b>${esc(CONFIG.brand.name)}</b></div>${steps}${body}${obStep < 5 ? nav(obStep === 4 ? "Save choices" : "Continue", obStep !== 4) : ""}</div>`;
}
Object.assign(ACTIONS, {
  obStart: () => { obStep = 1; render(); },
  obNext: () => { if (obStep === 4) { const c = S().consent; c.history.unshift({ at: nowISO(), photos: c.photos, ai: c.ai, coachContext: c.coachContext }); Store.save(); } obStep = Math.min(5, obStep + 1); render(); window.scrollTo(0, 0); },
  obBack: () => { obStep = Math.max(0, obStep - 1); render(); },
  obFinish: el => { S().onboarded = true; Store.save(); go(el.dataset.page || "home", el.dataset.tab || null); },
  obExample: () => { loadExample(); go("home"); }
});

function loadExample() {
  const s = freshState(); const t = dayKey();
  Object.assign(s, { onboarded: true, example: true });
  s.profile = { name: "Ama (example)", ageRange: "25–34", country: "Sierra Leone", units: "metric", goals: ["More even-looking tone", "Sun protection habit", "Length retention", "Less breakage"] };
  s.consent = { photos: true, ai: true, coachContext: true, history: [{ at: nowISO(), photos: true, ai: true, coachContext: true }] };
  Object.assign(s.skin, { type: "Combination", sensitivity: "Somewhat sensitive", tendency: "Tends to oiliness", dehydration: "Sometimes feels tight", allergies: "fragrance", concerns: ["Dark spots", "Uneven-looking tone", "Blemishes"], goals: "Fade-looking marks after breakouts; wear sunscreen daily", src: { type: "self", sensitivity: "self" } });
  s.skin.regionNotes = { chin: [{ id: uid(), at: nowISO(), text: "Occasional bumps around the chin before my period", source: "self" }] };
  Object.assign(s.hair, { curl: "Coily", curlDetail: "Tight coils, mixed at the nape", porosity: "High", density: "Medium", thickness: "Fine", elasticity: "Stretches, slow to return", length: "Shoulder length stretched", desiredLength: "Bra-strap length", washFreq: "Weekly", chemical: "None", heat: "Monthly", concerns: ["Breakage", "Dryness", "Length retention"], goals: "Retain length; fewer broken pieces on wash day", src: { porosity: "questionnaire" } });
  s.hair.scalp = { type: "Dry", oiliness: "None", dryness: "Mild", flaking: "Mild", itch: "Mild", sensitivity: "None", buildup: "Moderate", notes: "Itchier in week 2 of braids" };
  const p1 = { id: uid(), name: "Gentle gel cleanser", brand: "Example brand", category: "Cleanser", ingredients: ["water", "glycerin", "cocamidopropyl betaine", "sodium chloride"], status: "In use", createdAt: nowISO(), source: "user" };
  const p2 = { id: uid(), name: "Azelaic acid 10% cream", brand: "Example brand", category: "Treatment", ingredients: ["water", "azelaic acid", "dimethicone", "glycerin"], status: "In use", createdAt: nowISO(), source: "user" };
  const p3 = { id: uid(), name: "Mineral sunscreen SPF 50", brand: "Example brand", category: "Sunscreen", ingredients: ["zinc oxide", "caprylic/capric triglyceride", "glycerin", "parfum"], status: "In use", createdAt: nowISO(), expiresAt: dayKey(new Date(Date.now() + 20 * 864e5)), source: "user" };
  const p4 = { id: uid(), name: "Moisturising leave-in", brand: "Example brand", category: "Leave-in", ingredients: ["water", "glycerin", "behentrimonium chloride", "shea butter", "hydrolyzed keratin"], status: "In use", createdAt: nowISO(), source: "user" };
  s.products = [p1, p2, p3, p4];
  s.routines = [
    { id: uid(), area: "skin", type: "Morning skincare", name: "Morning", days: [], steps: [{ id: uid(), label: "Cleanse", productId: p1.id }, { id: uid(), label: "Sunscreen", productId: p3.id, note: "Reapply if outdoors" }] },
    { id: uid(), area: "skin", type: "Evening skincare", name: "Evening", days: [], steps: [{ id: uid(), label: "Cleanse", productId: p1.id }, { id: uid(), label: "Treatment", productId: p2.id, note: "Pea-sized amount" }, { id: uid(), label: "Moisturiser" }] },
    { id: uid(), area: "hair", type: "Wash day", name: "Sunday wash day", days: [0], steps: [{ id: uid(), label: "Pre-wash oil" }, { id: uid(), label: "Shampoo (scalp only)" }, { id: uid(), label: "Condition and detangle in sections" }, { id: uid(), label: "Leave-in", productId: p4.id }, { id: uid(), label: "Twist out" }] }
  ];
  s.hair.lengths = [{ id: uid(), at: dayKey(new Date(Date.now() - 90 * 864e5)), value: 24, unit: "cm", where: "Crown, stretched" }, { id: uid(), at: dayKey(new Date(Date.now() - 30 * 864e5)), value: 26, unit: "cm", where: "Crown, stretched" }];
  s.questions = [{ id: uid(), at: nowISO(), text: "Is azelaic acid OK to use with my sunscreen every day?", include: true }];
  s.journal = [{ id: uid(), at: nowISO(), category: "skin", text: "Started the azelaic acid cream three nights a week." }];
  s.styles = [{ id: uid(), style: "Knotless braids", installedAt: dayKey(new Date(Date.now() - 40 * 864e5)), removeBy: dayKey(new Date(Date.now() + 4 * 864e5)), comfort: "Some tension", notes: "Edges felt tight for the first two days" }];
  Store.state = s; commit(false);
}

/* ---------- 7. Dashboard ---------- */
function latest(kind) { return S().assessments.filter(a => a.kind === kind && a.saved && a.status === "completed").sort((a, b) => b.at.localeCompare(a.at))[0]; }
function val(v) { return v ? esc(v) : `<span class="muted">Not recorded</span>`; }

PAGES.home = () => {
  const s = S(), hid = s.settings.dashHidden, ls = latest("skin"), lh = latest("hair");
  const hour = new Date().getHours(); const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const sec = (k, html) => hid.includes(k) ? "" : html;
  const todays = todaysRoutines(); const dk = dayKey(); const done = s.completions[dk] || {};
  const totalSteps = todays.reduce((n, r) => n + r.steps.length, 0); const doneSteps = todays.reduce((n, r) => n + r.steps.filter(st => done[r.id + ":" + st.id]).length, 0);
  return `
  <div class="page-h"><div><h1>${greet}${s.profile.name ? ", " + esc(s.profile.name.split(" ")[0]) : ""}.</h1>
    <p class="muted">${totalSteps ? `${doneSteps} of ${totalSteps} care steps done today.` : "No routines scheduled today."} ${s.assessments.filter(a => a.saved).length ? "" : "You haven't saved any photo assessments yet."}</p></div>
    <div class="row"><button class="btn" data-a="customiseDash">Customise</button><button class="btn primary" data-a="go" data-page="skin" data-tab="scan">${ic("camera")} New scan</button></div></div>
  ${sec("clinic", clinicDashCard())}
  <div class="grid g2">
    ${sec("skin", `<section class="card raised"><div class="card-h"><div><div class="label">Skin ID</div><h3 style="margin-top:4px">${s.skin.type ? esc(s.skin.type) + " skin" : "Skin profile"}</h3></div><button class="btn sm" data-a="go" data-page="skin">Open</button></div>
      <dl class="kv"><dt>Sensitivity</dt><dd>${val(s.skin.sensitivity)}</dd><dt>Concerns</dt><dd>${s.skin.concerns.length ? esc(s.skin.concerns.join(", ")) : val("")}</dd><dt>Avoiding</dt><dd>${val(s.skin.allergies)}</dd>
      <dt>Last scan</dt><dd>${ls ? fmtDate(ls.at) : val("")}</dd></dl>
      ${ls ? `<p class="small" style="margin-top:12px">${esc(ls.result.summary)}</p><div class="row" style="margin-top:12px"><button class="btn sm" data-a="go" data-page="skin" data-tab="history" data-id="${ls.id}">View assessment</button></div>`
        : `<div class="notice" style="margin-top:14px">${ic("camera")}<div>No face photos yet. A first photo gives you a baseline to compare against later. <button class="btn sm primary" data-a="go" data-page="skin" data-tab="scan" style="margin-top:8px">Start first scan</button></div></div>`}</section>`)}
    ${sec("hair", `<section class="card raised"><div class="card-h"><div><div class="label">Hair ID</div><h3 style="margin-top:4px">${s.hair.curl ? esc(s.hair.curl) + " hair" : "Hair profile"}</h3></div><button class="btn sm" data-a="go" data-page="hair">Open</button></div>
      <dl class="kv"><dt>Porosity</dt><dd>${val(s.hair.porosity)} ${s.hair.porosity ? srcChip(s.hair.src.porosity) : ""}</dd><dt>Density</dt><dd>${val(s.hair.density)}</dd><dt>Scalp</dt><dd>${val(s.hair.scalp.type)}</dd><dt>Goals</dt><dd>${val(s.hair.goals)}</dd>
      <dt>Last hair photo</dt><dd>${lh ? fmtDate(lh.at) : val("")}</dd></dl>
      <div class="row" style="margin-top:14px"><button class="btn sm" data-a="go" data-page="hair" data-tab="scan">Document hair or scalp</button>${!s.hair.porosity || s.hair.porosity === "Not sure" ? `<button class="btn sm" data-a="go" data-page="hair" data-tab="porosity">Porosity check</button>` : ""}</div></section>`)}
    ${sec("today", `<section class="card"><div class="card-h"><div><div class="label">Today's care</div><h3 style="margin-top:4px">${esc(new Date().toLocaleDateString(undefined, { weekday: "long" }))}</h3></div><button class="btn sm" data-a="go" data-page="studio" data-tab="routines">Routines</button></div>
      ${todays.length ? todays.map(r => `<div class="stack" style="gap:6px;margin-bottom:14px"><div class="spread"><b class="small">${esc(r.name)}</b><span class="chip">${r.steps.filter(st => done[r.id + ":" + st.id]).length}/${r.steps.length}</span></div>
        ${r.steps.map(st => stepRow(r, st, done)).join("")}</div>`).join("")
        : emptyBox("No routines scheduled for today.", `<button class="btn sm" data-a="go" data-page="studio" data-tab="routines">Create a routine</button>`)}
      <div class="row" style="margin-top:6px"><button class="btn sm ghost" data-a="newReaction">${ic("plus")} Log a reaction</button><button class="btn sm ghost" data-a="newJournal">${ic("plus")} Journal note</button></div></section>`)}
    ${sec("progress", `<section class="card"><div class="card-h"><div><div class="label">Recent activity</div><h3 style="margin-top:4px">Progress snapshot</h3></div><button class="btn sm" data-a="go" data-page="progress">Timeline</button></div>
      ${(() => { const items = timelineItems().slice(0, 5); return items.length ? `<div class="tl">${items.map(tlItem).join("")}</div>` : emptyBox("Your timeline fills in as you save scans, products, reactions and notes."); })()}</section>`)}
    ${sec("coach", `<section class="card lav"><div class="label">Skin &amp; Hair Guide</div><h3 style="margin:4px 0 12px">Ask about your skin or hair</h3>
      <div class="row" style="flex-wrap:nowrap"><label class="sr" for="dash-ask">Question for the coach</label><input type="text" id="dash-ask" placeholder="How do I build a simple evening routine?"><button class="btn primary" data-a="dashAsk">Ask</button></div>
      <div class="row" style="margin-top:10px;gap:6px">${["Explain my Hair ID", "What should I bring to a dermatologist?", "Do any of my products overlap?"].map(q => `<button class="chip toggle-chip" data-a="askPreset" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div></section>`)}
    ${sec("reminders", `<section class="card"><div class="label">Coming up</div><h3 style="margin:4px 0 10px">Reminders</h3>
      ${(() => { const n = notifications(); return n.length ? `<div class="list">${n.slice(0, 5).map(x => `<div class="li small"><div class="grow">${esc(x.text)}</div><button class="btn sm" data-a="go" data-page="${x.page}" data-tab="${x.tab}">Open</button></div>`).join("")}</div>` : `<p class="muted small">Nothing due. Add expiry dates to products or a removal date to a protective style to get reminders.</p>`; })()}</section>`)}
  </div>`;
};
function stepRow(r, st, done) {
  const k = r.id + ":" + st.id, p = S().products.find(x => x.id === st.productId);
  return `<label class="step ${done[k] ? "done" : ""}"><input type="checkbox" data-a="tick" data-k="${k}" ${done[k] ? "checked" : ""}><span class="lbl">${esc(st.label)}${p ? ` <span class="muted small">· ${esc(p.name)}</span>` : ""}${st.note ? `<br><span class="muted small">${esc(st.note)}</span>` : ""}</span></label>`;
}
Object.assign(ACTIONS, {
  tick: (el, e) => { const dk = dayKey(); const c = S().completions; c[dk] = c[dk] || {}; if (c[dk][el.dataset.k]) delete c[dk][el.dataset.k]; else c[dk][el.dataset.k] = true; commit(false); rerenderKeep(); },
  dashAsk: () => { const q = $("#dash-ask")?.value.trim(); if (!q) return; go("coach"); sendChat(q); },
  askPreset: el => { go("coach"); sendChat(el.dataset.q); },
  customiseDash: () => {
    const opts = [["clinic", "Appointments & care plan"], ["skin", "Skin ID"], ["hair", "Hair ID"], ["today", "Today's care"], ["progress", "Progress snapshot"], ["coach", "Skin & Hair Guiach"], ["reminders", "Reminders"]];
    openModal(`<h3>Customise dashboard</h3><p class="muted small" style="margin:6px 0 14px">Choose which sections appear on Home.</p>
      <div class="stack">${opts.map(([k, l]) => `<label class="row"><input type="checkbox" data-a="dashToggle" data-k="${k}" ${S().settings.dashHidden.includes(k) ? "" : "checked"} style="width:18px;height:18px;accent-color:var(--accent)"> ${l}</label>`).join("")}</div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" data-a="closeModal">Done</button></div>`);
  },
  dashToggle: el => { const h = S().settings.dashHidden, k = el.dataset.k; const i = h.indexOf(k); i >= 0 ? h.splice(i, 1) : h.push(k); setTimeout(() => { el.checked = i >= 0; }, 0); commit(); }
});

function clinicDashCard() {
  const t = dayKey(), next = myBookings().filter(b => b.status !== "cancelled" && (b.date || "9999") >= t).sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0];
  const plan = myCarePlans()[0], open = plan ? plan.tasks.filter(x => !(S().planDone || {})[plan.id + ":" + x.id]).length : 0;
  return `<section class="card clinic-strip" style="margin-bottom:16px"><div class="grid g2" style="gap:20px">
    <div class="stack" style="gap:6px"><div class="label">Next appointment</div>${next ? `<b>${esc(Clinic.type(next.typeId)?.name || "Appointment")}</b><span class="small">${next.date ? fmtDate(next.date) : "Date to be confirmed"}${next.time ? " · " + esc(next.time) : next.window ? " · " + esc(next.window) : ""} ${bookingChip(next)}</span>` : `<span class="small muted">No upcoming appointment.</span>`}
      <div class="row" style="margin-top:6px"><button class="btn sm primary" data-a="site" data-path="book">${ic("calendar")} Book an appointment</button>${next ? `<button class="btn sm" data-a="go" data-page="pro" data-tab="appts">Details</button>` : ""}</div></div>
    <div class="stack" style="gap:6px"><div class="label">Care plan from your clinician</div>${plan ? `<b>${esc(plan.concern || "Care plan")}</b><span class="small">${open ? `${open} step${open === 1 ? "" : "s"} to follow` : "All steps ticked"} · issued ${fmtDate(plan.at)} by ${esc(plan.clinician)} <span class="chip clin">Clinician-issued</span></span>` : `<span class="small muted">Care plans from the RADIANCE team appear here after your consultation.</span>`}
      ${plan ? `<div class="row" style="margin-top:6px"><button class="btn sm" data-a="go" data-page="pro" data-tab="plans">View care plan</button></div>` : ""}</div></div></section>`;
}
