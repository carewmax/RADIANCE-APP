
/* ============================================================
   APPOINTMENT BOOKING
   Exact slots only when the clinic has published weekly availability in the console.
   Otherwise the patient requests a day and time of day, and the clinic confirms by phone.
   A booking is never shown as confirmed until staff confirm it.
   ============================================================ */
const BK = { step: 0, prefill: null, d: {}, errors: {}, result: null, busy: false };
const BK_STEPS = ["Service", "Clinician", "Date & time", "Your details", "Review"];
const bkReset = () => { BK.step = 0; BK.d = { shareIds: [], sharePhotos: false, contactPref: "Phone call" }; BK.errors = {}; BK.result = null; };
bkReset();
const _siteAction = ACTIONS.site;
ACTIONS.site = el => {
  if (el.dataset.path === "book" && (el.dataset.svc || el.dataset.clin || el.dataset.type)) { bkReset(); Object.assign(BK.d, { svcId: el.dataset.svc || "", typeId: el.dataset.type || "", clin: el.dataset.clin || "" }); if (BK.d.typeId) BK.step = 1; }
  else if (el.dataset.path === "book" && BK.result) bkReset();
  _siteAction(el);
};
const hasHours = () => Object.keys(Clinic.c.availability.days || {}).some(k => (Clinic.c.availability.days[k] || []).length === 2);
const verifiedTeam = () => Clinic.c.team.filter(t => t.verified && t.published);
const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fromMin = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
function slotsFor(date, typeId, clin) {
  const av = Clinic.c.availability, wd = new Date(date + "T12:00:00").getDay(), span = av.days[wd];
  if (!span || av.closedDates.includes(date)) return [];
  const dur = Clinic.type(typeId)?.duration || av.slotMinutes, out = [];
  const now = new Date(), today = dayKey();
  for (let m = toMin(span[0]); m + dur <= toMin(span[1]); m += av.slotMinutes) {
    const t = fromMin(m);
    if (date === today && m <= now.getHours() * 60 + now.getMinutes() + 60) continue;
    out.push({ t, taken: isTaken(date, t, dur, clin) });
  }
  return out;
}
// A slot is taken if it overlaps an active booking for the same clinician (or any booking when the clinic has no named team).
function isTaken(date, t, dur, clin) {
  const s = toMin(t), e = s + dur;
  return Clinic.ops.bookings.some(b => ["requested", "confirmed"].includes(b.status) && b.date === date && b.time && (!clin || !b.clin || b.clin === clin) && (() => { const bs = toMin(b.time), be = bs + (Clinic.type(b.typeId)?.duration || 30); return s < be && bs < e; })());
}
function bookingPage() {
  const d = BK.d, e = BK.errors;
  if (BK.result) return { title: "Booking", html: pageHero([[null, "Book an Appointment"]], "Book an Appointment", "Your skin. Our priority.", "heroBook") + `<section class="sec"><div class="wrap" style="max-width:760px">${bookingResult()}</div></section>` };
  const types = Clinic.c.apptTypes.filter(t => t.active), team = verifiedTeam(), step = BK.step;
  let body = "";
  if (step === 0) body = `<h2 style="font-size:1.15rem">Choose a Service</h2>
    <label class="field" for="bk-type" style="margin-top:14px"><span>Appointment type *</span><select id="bk-type" ${e.type ? 'aria-invalid="true"' : ""}><option value="">Select a service</option>${types.map(t => `<option value="${t.id}" ${d.typeId === t.id ? "selected" : ""}>${esc(t.name)} · about ${t.duration} min${t.fee ? " · " + esc(t.fee) : ""}</option>`).join("")}</select>${e.type ? `<span class="err-text">${e.type}</span>` : ""}</label>
    <label class="field" for="bk-svc" style="margin-top:12px"><span>Main concern (optional)</span><select id="bk-svc"><option value="">Not sure / choose later</option>${Clinic.c.services.filter(s => s.published).map(s => `<option value="${s.id}" ${d.svcId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
    <p class="muted small" style="margin-top:10px">Not sure? Choose an initial dermatology consultation and the clinic will guide you.</p>`;
  if (step === 1) body = `<h2>Who would you like to see?</h2>${team.length ? `<div class="stack" style="margin-top:14px"><button class="choice" aria-pressed="${!d.clin}" data-a="bkClin" data-id=""><b>First available clinician</b></button>${team.map(t => `<button class="choice" aria-pressed="${d.clin === t.id}" data-a="bkClin" data-id="${t.id}"><b>${esc(t.name)}</b><br><span class="muted small">${esc(t.title)}</span></button>`).join("")}</div>` : `<div class="notice" style="margin-top:14px">${ic("users")}<div class="small">The clinic will assign the most suitable clinician for your appointment and tell you when they confirm.</div></div>`}`;
  if (step === 2) {
    if (hasHours()) {
      const days = []; for (let i = 0; i < 14; i++) { const dt = new Date(); dt.setDate(dt.getDate() + i); days.push(dayKey(dt)); }
      const sl = d.date ? slotsFor(d.date, d.typeId, d.clin) : [];
      body = `<h2>Choose a date and time</h2><p class="muted small" style="margin:6px 0 14px">Times shown are the clinic's published availability (Freetown time).</p>
      <div style="overflow-x:auto"><div class="days" style="min-width:420px">${days.map(k => { const dt = new Date(k + "T12:00:00"), open = slotsFor(k, d.typeId, d.clin).some(x => !x.taken); return `<button class="dayb" ${open ? "" : "disabled"} aria-pressed="${d.date === k}" data-a="bkDay" data-d="${k}" aria-label="${dt.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}${open ? "" : ", no times available"}"><span>${dt.toLocaleDateString(undefined, { weekday: "short" })}</span><b>${dt.getDate()}</b><span>${dt.toLocaleDateString(undefined, { month: "short" })}</span></button>`; }).join("")}</div></div>
      ${d.date ? `<h3 style="margin:18px 0 10px">${fmtDate(d.date, { weekday: "long", day: "numeric", month: "long" })}</h3>${sl.length ? `<div class="slot-grid">${sl.map(x => `<button class="slot" ${x.taken ? "disabled aria-label=\"" + x.t + " unavailable\"" : ""} aria-pressed="${d.time === x.t}" data-a="bkTime" data-t="${x.t}">${x.t}</button>`).join("")}</div>` : `<p class="muted small">No times left on this day.</p>`}` : ""}
      ${Clinic.c.availability.policy ? `<p class="small muted" style="margin-top:14px">${esc(Clinic.c.availability.policy)}</p>` : ""}`;
    } else {
      body = `<h2>When would suit you?</h2><div class="notice" style="margin:10px 0 16px">${ic("info")}<div class="small">Online slots aren't published yet. Choose a preferred day and time of day, and the clinic will call you to confirm an exact time.</div></div>
      <div class="grid g2"><label class="field" for="bk-date"><span>Preferred date *</span><input type="date" id="bk-date" min="${dayKey(new Date(Date.now() + 864e5))}" value="${esc(d.date || "")}" ${e.date ? 'aria-invalid="true"' : ""}>${e.date ? `<span class="err-text">${e.date}</span>` : ""}</label>
      <label class="field" for="bk-window"><span>Time of day</span><select id="bk-window">${["Morning", "Afternoon", "Any time"].map(w => `<option ${d.window === w ? "selected" : ""}>${w}</option>`).join("")}</select></label></div>`;
    }
    if (e.time) body += `<p class="err-text" style="margin-top:10px">${e.time}</p>`;
  }
  if (step === 3) {
    const saved = S().onboarded && !S().example ? S().assessments.filter(a => a.saved && a.result) : [];
    const f = (id, k, label, type, req, ac, ph = "") => `<label class="field" for="${id}"><span>${label}${req ? " *" : ""}</span><input type="${type}" id="${id}" value="${esc(d[k] || "")}" autocomplete="${ac}" placeholder="${ph}" ${e[k] ? 'aria-invalid="true"' : ""}>${e[k] ? `<span class="err-text">${e[k]}</span>` : ""}</label>`;
    body = `<h2>Your details</h2><div class="grid g2" style="margin-top:14px">${f("bk-name", "name", "Full name", "text", true, "name")}${f("bk-phone", "phone", "Phone", "tel", true, "tel", "+232 …")}</div>
    <div class="grid g2" style="margin-top:12px">${f("bk-email", "email", "Email (optional)", "email", false, "email")}<label class="field" for="bk-pref"><span>How should the clinic contact you?</span><select id="bk-pref">${["Phone call", "WhatsApp", "Email"].map(o => `<option ${d.contactPref === o ? "selected" : ""}>${o}</option>`).join("")}</select></label></div>
    <label class="field" for="bk-reason" style="margin-top:12px"><span>Reason for your visit (optional)</span><textarea id="bk-reason" placeholder="A short description is enough. You can explain more at your appointment.">${esc(d.reason || "")}</textarea></label>
    ${saved.length ? `<fieldset class="card" style="margin-top:16px;border:1px solid var(--line)"><legend class="label" style="padding:0 6px">Share from your patient app (optional)</legend>
      <p class="small muted">Attach photo assessments for your clinician to review. Only what you tick is shared.</p>
      <div class="stack" style="gap:8px;margin-top:10px">${saved.slice(0, 8).map(a => `<label class="row small" style="flex-wrap:nowrap"><input type="checkbox" data-a="bkShare" data-id="${a.id}" ${d.shareIds.includes(a.id) ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent);flex:none"><span>${a.kind === "skin" ? "Skin" : "Hair & scalp"} · ${fmtDate(a.at)} · ${esc((a.result.summary || "").slice(0, 90))}</span></label>`).join("")}</div>
      ${d.shareIds.length ? `<label class="row small" style="margin-top:10px;flex-wrap:nowrap"><input type="checkbox" id="bk-photos" ${d.sharePhotos ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent);flex:none"><span>Include the photos as well as the written observations</span></label>
      <label class="row small" style="margin-top:8px;flex-wrap:nowrap"><input type="checkbox" id="bk-consent" ${d.consent ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent);flex:none"><span>I agree to share the selected assessments with RADIANCE clinicians for this appointment.</span></label>${e.consent ? `<p class="err-text">${e.consent}</p>` : ""}` : ""}</fieldset>` : ""}`;
  }
  if (step === 4) {
    const t = Clinic.type(d.typeId), c = Clinic.c.team.find(x => x.id === d.clin), s = Clinic.svc(d.svcId);
    body = `<h2>Check your booking</h2><dl class="kv" style="margin-top:16px"><dt>Appointment</dt><dd>${esc(t?.name)}</dd>${s ? `<dt>Concern</dt><dd>${esc(s.name)}</dd>` : ""}<dt>Clinician</dt><dd>${c ? esc(c.name) : "Assigned by the clinic"}</dd>
      <dt>When</dt><dd>${fmtDate(d.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${d.time ? " at " + d.time : " · " + esc(d.window || "Any time") + " (clinic will confirm the time)"}</dd>
      <dt>Name</dt><dd>${esc(d.name)}</dd><dt>Phone</dt><dd>${esc(d.phone)}</dd>${d.email ? `<dt>Email</dt><dd>${esc(d.email)}</dd>` : ""}<dt>Contact by</dt><dd>${esc(d.contactPref)}</dd>
      ${d.reason ? `<dt>Reason</dt><dd>${esc(d.reason)}</dd>` : ""}${d.shareIds.length ? `<dt>Sharing</dt><dd>${d.shareIds.length} assessment${d.shareIds.length === 1 ? "" : "s"}${d.sharePhotos ? " with photos" : ", observations only"}</dd>` : ""}</dl>
      <div class="notice" style="margin-top:16px">${ic("info")}<div class="small">This is a booking request. It's confirmed when the clinic confirms it${t?.fee ? "" : "; ask about fees when they call"}. ${Clinic.c.availability.policy ? esc(Clinic.c.availability.policy) : ""}</div></div>
      ${e.submit ? `<div class="notice err" style="margin-top:12px">${ic("warn")}<div class="small">${e.submit}</div></div>` : ""}`;
  }
  const quick = [["initial", "General Dermatology", "Skin checks, acne, rashes, concerns", "shield"], ["aesthetic", "Aesthetic Consultation", "Treatments, rejuvenation, suitability", "sparkle"], ["hair", "Hair & Scalp Consultation", "Hair loss, scalp, breakage", "hair"]].filter(([id]) => Clinic.type(id)?.active);
  return { title: "Book an appointment", html: pageHero([[null, "Appointments"]], "Book an Appointment", "Your skin. Our priority.", "heroBook") + `
  <section class="sec"><div class="wrap"><div class="book-grid"><div class="card raised">
    <div class="stepper" aria-label="Progress">${BK_STEPS.map((l, i) => `<span class="${i <= step ? "on" : ""}" ${i === step ? 'aria-current="step"' : ""}>${i + 1}. ${l}</span>`).join("")}</div>
    <div id="bk-body">${body}</div>
    <div class="row" style="margin-top:22px;flex-wrap:nowrap">${step ? `<button class="btn" data-a="bkBack">Back</button>` : ""}<button class="btn green" style="flex:1" data-a="${step === 4 ? "bkSubmit" : "bkNext"}" ${BK.busy ? "disabled" : ""}>${BK.busy ? `<span class="spinner"></span> Sending…` : step === 4 ? "Send booking request" : "Next"}</button></div>
  </div><aside class="card stack"><h3>Why Book With Us?</h3>
    <div class="why-list"><div>${ic("check")} Dermatology, hair &amp; aesthetic care in one place</div><div>${ic("check")} Online booking requests, confirmed by the clinic</div><div>${ic("check")} Care for every skin tone and hair type</div><div>${ic("check")} Personalised treatment plans and follow-up</div></div>
    <div class="ci" style="border-top:1px solid var(--line);margin-top:6px;padding-top:14px"><span class="ic">${ic("phone")}</span><div><b>Prefer to call?</b><p>${esc(Clinic.c.info.phone)}<br>${Clinic.c.info.hours.length ? Clinic.c.info.hours.map(h => esc(h.days + ": " + h.time)).join("<br>") : "Call to confirm opening hours."}</p></div></div>
    <button class="btn sm" style="align-self:flex-start" data-a="portal" data-page="pro" data-tab="prep">Prepare a consultation report</button></aside></div>
  ${quick.length && step === 0 ? `<div style="margin-top:36px"><div class="sec-h" style="margin-bottom:14px"><h2>Quick Booking</h2></div><div class="qb">${quick.map(([id, t, d, i]) => `<div class="card"><span class="ic">${ic(i)}</span><h3>${t}</h3><p class="muted small">${d}</p><button class="btn sm green" style="justify-self:start;margin-top:6px" data-a="bkQuick" data-id="${id}">Book Now</button></div>`).join("")}</div></div>` : ""}
  <div class="help-band" style="margin-top:32px"><div class="im">${phImg("needHelp", "", 400)}</div><div><h3>Need help choosing a service?</h3><p>Our team is here to guide you to the best consultation for your needs. Not for emergencies.</p></div><button class="btn white" data-a="site" data-path="contact">Contact Us</button></div>
  </div></section>` };
}
function bkCollect() {
  const d = BK.d, v = id => $("#" + id)?.value;
  if ($("#bk-type")) d.typeId = v("bk-type");
  if ($("#bk-svc")) d.svcId = v("bk-svc");
  if ($("#bk-date")) d.date = v("bk-date");
  if ($("#bk-window")) d.window = v("bk-window");
  ["name", "phone", "email", "reason"].forEach(k => { if ($("#bk-" + k)) d[k] = v("bk-" + k).trim(); });
  if ($("#bk-pref")) d.contactPref = v("bk-pref");
  if ($("#bk-photos")) d.sharePhotos = $("#bk-photos").checked;
  if ($("#bk-consent")) d.consent = $("#bk-consent").checked;
}
function bkValidate() {
  const d = BK.d, e = {};
  if (BK.step === 0 && !d.typeId) e.type = "Choose an appointment type.";
  if (BK.step === 2) {
    if (hasHours()) { if (!d.date || !d.time) e.time = "Choose a date and an available time."; }
    else if (!d.date) e.date = "Choose a preferred date."; else if (d.date <= dayKey()) e.date = "Choose a date from tomorrow onwards.";
  }
  if (BK.step === 3) {
    if (!d.name || d.name.length < 2) e.name = "Enter your full name.";
    if (!/^\+?[\d\s()-]{8,}$/.test(d.phone || "")) e.phone = "Enter a phone number the clinic can call, e.g. +232 76 123456.";
    if (d.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) e.email = "Check the email address.";
    if (d.shareIds.length && !d.consent) e.consent = "Tick to agree, or untick the assessments you don't want to share.";
  }
  BK.errors = e; return !Object.keys(e).length;
}
Object.assign(ACTIONS, {
  bkType: el => { bkCollect(); BK.d.typeId = el.dataset.id; BK.d.time = ""; BK.errors = {}; render(); },
  bkClin: el => { BK.d.clin = el.dataset.id; render(); },
  bkDay: el => { BK.d.date = el.dataset.d; BK.d.time = ""; BK.errors = {}; render(); },
  bkTime: el => { BK.d.time = el.dataset.t; BK.errors = {}; render(); },
  bkShare: el => { bkCollect(); const a = BK.d.shareIds, i = a.indexOf(el.dataset.id); i >= 0 ? a.splice(i, 1) : a.push(el.dataset.id); render(); },
  bkBack: () => { bkCollect(); BK.errors = {}; BK.step = Math.max(0, BK.step - 1 - (BK.step === 2 && !verifiedTeam().length ? 1 : 0)); render(); },
  bkNext: () => { bkCollect(); if (!bkValidate()) { render(); $("[aria-invalid=true]")?.focus(); return; } BK.step += 1; if (BK.step === 1 && !verifiedTeam().length) BK.step = 2; render(); $("#bk-body h2")?.focus?.(); },
  bkSubmit: async () => {
    const d = BK.d; if (BK.busy) return;
    if (d.time && isTaken(d.date, d.time, Clinic.type(d.typeId)?.duration || 30, d.clin)) { BK.errors = { submit: "Sorry, that time was just taken. Go back and choose another." }; render(); return; }
    BK.busy = true; BK.errors = {}; render();
    const shared = [];
    for (const id of d.shareIds) { const a = S().assessments.find(x => x.id === id); if (!a) continue;
      const snap = { id: a.id, kind: a.kind, mode: a.mode, at: a.at, provider: a.provider, summary: a.result?.summary, regions: a.result?.regions || [], limitations: a.result?.limitations || [], quality: a.quality?.verdict || "", notes: a.notes || "" };
      if (d.sharePhotos && a.photoIds?.[0]) snap.photo = await Store.getPhoto(a.photoIds[0]);
      shared.push(snap); }
    const t = Clinic.type(d.typeId);
    const rec = { id: uid(), ref: "R-" + Math.random().toString(36).slice(2, 7).toUpperCase(), at: nowISO(), typeId: d.typeId, svcId: d.svcId || "", clin: d.clin || "", date: d.date, time: d.time || "", window: d.time ? "" : d.window || "Any time",
      name: d.name, phone: d.phone, email: d.email || "", reason: d.reason || "", contactPref: d.contactPref, status: "requested", shared, consentToShare: !!d.consent,
      patientId: Backend.user?.id || (S().onboarded && !S().example ? S().patientId : null), history: [{ at: nowISO(), what: "Requested online" }] };
    let delivery = "device", error = null;
    try {
      if (Backend.sb) { await Ops.add("bookings", rec); delivery = "database"; }
      else if (Forms.available) {
        await Forms.send("booking-request", { ref: rec.ref, action: "NEW REQUEST", service: Clinic.svc(rec.svcId)?.name || "", appointment_type: t?.name, date: rec.date, time: rec.time || rec.window, name: rec.name, phone: rec.phone, email: rec.email, reason: rec.reason, contact_preference: rec.contactPref,
          shared_assessments: shared.map(s => `${s.kind} ${s.at.slice(0, 10)}: ${s.summary}`).join(" | ") || "none (photos are only shared through the secure portal)" });
        delivery = "inbox";
      }
    } catch (x) { error = x; }
    if (error) { BK.busy = false; BK.errors = { submit: "We couldn't send your request. Check your connection and try again, or call " + esc(Clinic.c.info.phone) + "." }; render(); return; }
    if (!Backend.sb) { rec.delivery = delivery; if (delivery === "inbox") rec.shared = rec.shared.map(s => ({ ...s, photo: undefined })); Clinic.ops.bookings.unshift(rec); Clinic.saveOps(); }
    BK.busy = false; BK.result = rec; render(); window.scrollTo(0, 0);
  }
});
function bookingResult() {
  const b = BK.result, t = Clinic.type(b.typeId), when = `${fmtDate(b.date, { weekday: "long", day: "numeric", month: "long" })}${b.time ? " at " + b.time : " (" + (b.window || "any time").toLowerCase() + ")"}`;
  const msg = `Hello RADIANCE, I'd like to book: ${t?.name}. Preferred: ${when}. Name: ${b.name}. Phone: ${b.phone}. Ref ${b.ref}.`;
  const sent = b.delivery !== "device";
  return `<div class="card raised stack" style="align-items:flex-start;gap:14px">
    <span class="chip ${sent ? "warn" : "err"}">${sent ? "Request received · awaiting confirmation" : "Not sent yet"}</span>
    <h2>${sent ? "Thank you. Your request is with the clinic." : "Your request is saved on this device only"}</h2>
    <p>${sent ? `The clinic will contact you by <b>${esc(b.contactPref.toLowerCase())}</b> on <b>${esc(b.phone)}</b> to confirm ${b.time ? "your appointment" : "an exact time"}. It isn't confirmed until they do.` : `This copy of the website isn't connected to the clinic's booking inbox yet, so nothing has been sent. Please send the request by WhatsApp or call <b>${esc(Clinic.c.info.phone)}</b>.`}</p>
    <dl class="kv"><dt>Reference</dt><dd class="mono">${esc(b.ref)}</dd><dt>Appointment</dt><dd>${esc(t?.name)}</dd><dt>Requested</dt><dd>${when}</dd>${b.shared.length ? `<dt>Shared</dt><dd>${b.shared.length} assessment${b.shared.length === 1 ? "" : "s"}${sent && b.delivery === "inbox" ? " (summaries only; bring photos to your visit)" : ""}</dd>` : ""}</dl>
    <div class="row"><a class="btn ${sent ? "" : "primary"}" href="${waLink(msg)}" target="_blank" rel="noopener">${ic("whatsapp")} ${sent ? "Message the clinic on WhatsApp" : "Send by WhatsApp"}</a><a class="btn" href="tel:${esc(Clinic.c.info.phone.replace(/\s/g, ""))}">${ic("phone")} Call ${esc(Clinic.c.info.phone)}</a></div>
    <div class="row">${b.patientId ? `<button class="btn ghost" data-a="portal" data-page="pro" data-tab="appts">See it in my patient app</button>` : `<button class="btn ghost" data-a="portal">Set up the patient app to track this</button>`}<button class="btn ghost" data-a="bkAgain">Make another booking</button></div></div>`;
}
ACTIONS.bkAgain = () => { bkReset(); render(); };
ACTIONS.bkQuick = el => { bkReset(); BK.d.typeId = el.dataset.id; BK.step = verifiedTeam().length ? 1 : 2; render(); $("#bk-body")?.scrollIntoView({ block: "start" }); };
