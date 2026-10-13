
/* ---------- 8. Photo pipeline: capture → quality check → (optional) analysis ---------- */
let cap = null;          // current capture session (kept in memory only)
let selRegion = null;    // selected face region
const FACE_REGIONS = { forehead: "Forehead", right_cheek: "Right cheek", left_cheek: "Left cheek", nose: "Nose", under_eyes: "Under-eye area", chin: "Chin", jawline: "Jawline" };
const SKIN_FEATURES = ["blemishes", "redness", "dark_spots", "texture", "pores", "dryness_flaking", "shine", "under_eye", "other"];
const HAIR_REGIONS = { hairline: "Front hairline", temples: "Temples", crown: "Crown", parting: "Parting", scalp: "Scalp", lengths: "Lengths", ends: "Ends", nape: "Back / nape" };
const HAIR_FEATURES = ["coverage", "scalp_visibility", "flakes", "breakage", "hairline", "texture", "redness", "buildup", "length", "other"];
const HAIR_MODES = {
  general: ["General hair photo", "Front or side view of your whole head of hair, in daylight.", "env"],
  scalp: ["Scalp observation", "Part the hair and photograph the scalp close up. Someone else holding the phone helps.", "env"],
  hairline: ["Hairline documentation", "Hair pulled back gently, face the camera, forehead and temples in frame.", "user"],
  parting: ["Parting and visible density", "A straight centre part from above, same spot each time for fair comparison.", "env"],
  breakage: ["Breakage documentation", "Ends or shed/broken pieces on a plain, contrasting background.", "env"],
  length: ["Length tracking", "Same pose and stretch each time, back or side view. Log the measured length too.", "env"],
  texture: ["Texture documentation", "A clean, product-light section of hair against a plain background.", "env"],
  reaction: ["Product reaction or scalp concern", "Photograph the affected area. Log the product in the reaction diary as well.", "env"]
};

async function handleImageFile(file) {
  if (!cap) return;
  if (!/^image\/(jpeg|png|webp|heic|heif|gif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) { cap.err = "That file type isn't supported. Use a JPEG, PNG or WebP photo."; render(); return; }
  if (file.size > 25 * 1024 * 1024) { cap.err = "That image is larger than 25 MB. Try a smaller photo."; render(); return; }
  cap.err = null; cap.stage = "loading"; render();
  try {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) { bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); }); }
    const w = bmp.width, h = bmp.height;
    const draw = (max, q, asBlob) => { const sc = Math.min(1, max / Math.max(w, h)); const c = document.createElement("canvas"); c.width = Math.round(w * sc); c.height = Math.round(h * sc); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); return asBlob ? new Promise(r => c.toBlob(r, "image/jpeg", q)) : c.toDataURL("image/jpeg", q); };
    cap.blob = await draw(1600, 0.88, true);
    cap.thumb = draw(560, 0.74, false);
    cap.w = w; cap.h = h; cap.q = qualityCheck(bmp, w, h, cap.kind); cap.stage = "review";
  } catch (e) { cap.stage = "guide"; cap.err = "We couldn't open that image. Try another photo, or a JPEG instead of HEIC."; }
  render();
}

function qualityCheck(bmp, w, h, kind) {
  const sc = 256 / Math.max(w, h), cw = Math.max(8, Math.round(w * sc)), ch = Math.max(8, Math.round(h * sc));
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(bmp, 0, 0, cw, ch);
  const d = x.getImageData(0, 0, cw, ch).data, g = new Float32Array(cw * ch);
  let sum = 0, glare = 0;
  for (let i = 0; i < g.length; i++) { const v = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; g[i] = v; sum += v; if (v > 248) glare++; }
  const mean = sum / g.length, glareP = glare / g.length;
  let ls = 0, ls2 = 0, n = 0; // Laplacian variance = focus measure
  for (let yy = 1; yy < ch - 1; yy++) for (let xx = 1; xx < cw - 1; xx++) { const i = yy * cw + xx; const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - cw] - g[i + cw]; ls += l; ls2 += l * l; n++; }
  const lap = ls2 / n - (ls / n) ** 2;
  const checks = [];
  const minSide = Math.min(w, h);
  checks.push({ k: "Resolution", s: minSide < 400 ? "fail" : minSide < 700 ? "warn" : "ok", m: `${w}×${h}px` + (minSide < 400 ? ", too small to judge detail" : minSide < 700 ? ", detail may be limited" : "") });
  checks.push({ k: "Lighting", s: mean < 50 ? "fail" : mean < 80 ? "warn" : mean > 228 ? "fail" : mean > 205 ? "warn" : "ok", m: mean < 50 ? "Too dark" : mean < 80 ? "On the dark side" : mean > 228 ? "Overexposed" : mean > 205 ? "Very bright" : "Even enough" });
  checks.push({ k: "Focus", s: lap < 14 ? "fail" : lap < 40 ? "warn" : "ok", m: lap < 14 ? "Blurry" : lap < 40 ? "Slightly soft" : "Sharp enough" });
  checks.push({ k: "Glare", s: glareP > 0.22 ? "fail" : glareP > 0.07 ? "warn" : "ok", m: glareP > 0.07 ? `${Math.round(glareP * 100)}% of the image is blown out` : "No strong glare" });
  const verdict = checks.some(c => c.s === "fail") ? "fail" : checks.some(c => c.s === "warn") ? "warn" : "ok";
  return { checks, verdict, metrics: { mean: Math.round(mean), focus: Math.round(lap), glare: +glareP.toFixed(3) } };
}

const SKIN_PROMPT = s => `You are the photo-description step of a personal skin-care documentation app. Look at the attached facial photograph and describe only VISIBLE, cosmetic-level features in plain language.
Rules:
- You are not diagnosing. Never name diseases, conditions or causes (no acne vulgaris, rosacea, melasma, eczema, dermatitis, infection, cancer, hormonal, etc.). Say what is visible: "a few small raised red spots on the chin", "some areas look shinier".
- Do not estimate age, ethnicity, attractiveness or identity. Judge all skin tones with equal care; if lighting, makeup, filters, camera processing or skin tone make a feature hard to judge, say so rather than guessing.
- First decide whether the photo is usable: a face clearly visible and mostly in frame, reasonably lit, in focus, no heavy beauty filter.
- "left_cheek"/"right_cheek" mean the person's own left/right.
- "confidence" means how clearly the feature can be seen in THIS photo, not medical certainty.
- Set suggest_professional to true only if something visible would reasonably warrant an in-person look (e.g. an irregular-looking or very dark mole, an open sore, a widespread rash, significant swelling), describing it neutrally.
Reply with only JSON in this shape:
{"usable":true,"quality_issues":["string"],"summary":"2-3 plain sentences","regions":[{"region":"forehead|right_cheek|left_cheek|nose|under_eyes|chin|jawline","observations":[{"feature":"${SKIN_FEATURES.join("|")}","description":"one short sentence","confidence":"low|medium|high"}]}],"not_assessable":["feature and why"],"limitations":["string"],"suggest_professional":false,"professional_reason":""}
Include only regions you can actually see. If usable is false, leave regions empty and explain in quality_issues.
What the person recorded about themselves (self-reported, may be inaccurate, do not repeat back as findings): skin type ${s.type || "not recorded"}; concerns ${s.concerns.join(", ") || "none recorded"}.`;

const HAIR_PROMPT = (h, mode) => `You are the photo-description step of a personal hair and scalp documentation app. The user chose the mode "${HAIR_MODES[mode][0]}". Describe only VISIBLE features in the attached photo, in plain language.
Rules:
- You are not diagnosing. Never name conditions or causes (no alopecia, dandruff, seborrhoeic dermatitis, fungal infection, traction alopecia, etc.) and never guess why hair looks the way it does.
- You cannot determine from a phone photo: follicle counts, growth rate, porosity, strand diameter, or causes of hair loss. Never state these; list them in not_assessable if relevant.
- Treat every hair texture, curl pattern, protective style and skin tone with equal care. Coily and tightly textured hair naturally shows more scalp at some angles and shrinks substantially; do not describe that as thinning unless clearly so, and note the uncertainty.
- First decide whether the photo is usable for this mode (relevant area visible, lit, in focus).
- "confidence" means how clearly the feature can be seen in THIS photo.
- Set suggest_professional to true only if something visible would reasonably warrant a professional look (e.g. a distinct bald patch, broken skin, marked redness or scaling, pustules), described neutrally.
Reply with only JSON in this shape:
{"usable":true,"quality_issues":["string"],"summary":"2-3 plain sentences","regions":[{"region":"${Object.keys(HAIR_REGIONS).join("|")}","observations":[{"feature":"${HAIR_FEATURES.join("|")}","description":"one short sentence","confidence":"low|medium|high"}]}],"not_assessable":["feature and why"],"limitations":["string"],"suggest_professional":false,"professional_reason":""}
Include only regions visible in the photo. If usable is false, leave regions empty.
Self-reported context (may be inaccurate, do not repeat as findings): curl pattern ${h.curl || "not recorded"}; currently in a protective style: ${S().styles.some(s => !s.removedAt) ? "yes" : "no/unknown"}; concerns ${h.concerns.join(", ") || "none recorded"}.`;

function validateResult(r, kind) {
  if (!r || typeof r !== "object" || typeof r.usable !== "boolean" || typeof r.summary !== "string") { const e = new Error("invalid_response"); e.code = "invalid_response"; throw e; }
  const regionsAllowed = kind === "skin" ? FACE_REGIONS : HAIR_REGIONS, feats = kind === "skin" ? SKIN_FEATURES : HAIR_FEATURES;
  const arr = v => Array.isArray(v) ? v.filter(x => typeof x === "string" && x.trim()).map(x => x.slice(0, 400)) : [];
  const regions = (Array.isArray(r.regions) ? r.regions : []).filter(g => g && regionsAllowed[g.region]).map(g => ({
    region: g.region,
    observations: (Array.isArray(g.observations) ? g.observations : []).filter(o => o && typeof o.description === "string" && o.description.trim())
      .map(o => ({ feature: feats.includes(o.feature) ? o.feature : "other", description: o.description.slice(0, 400), confidence: ["low", "medium", "high"].includes(o.confidence) ? o.confidence : "unstated" }))
  })).filter(g => g.observations.length);
  return { usable: r.usable, quality_issues: arr(r.quality_issues), summary: r.summary.slice(0, 800), regions: r.usable ? regions : [], not_assessable: arr(r.not_assessable), limitations: arr(r.limitations), suggest_professional: !!r.suggest_professional, professional_reason: typeof r.professional_reason === "string" ? r.professional_reason.slice(0, 400) : "" };
}

async function persistCapturePhoto(a) {
  const pid = uid(); a.photoIds = [pid]; Store.photoCache[pid] = cap.thumb;
  a.photoStored = false;
  if (S().consent.photos) { try { await Store.putPhoto(pid, cap.thumb, a.at); a.photoStored = true; } catch (e) { toast(e.message || "Photo couldn't be stored."); } }
}

Object.assign(ACTIONS, {
  capStart: el => { cap = { kind: el.dataset.kind, mode: el.dataset.mode || (el.dataset.kind === "skin" ? "face" : null), stage: "guide" }; render(); },
  capMode: el => { cap = { kind: "hair", mode: el.dataset.mode, stage: "guide" }; render(); },
  capCamera: el => { $(el.dataset.env ? "#cam-input-env" : "#cam-input").click(); },
  capUpload: () => $("#file-input").click(),
  capRetake: () => { cap.rejected = null; cap.stage = "guide"; cap.thumb = null; cap.blob = null; cap.q = null; cap.err = null; render(); },
  capCancel: () => { cap?.ctl?.abort(); cap = null; render(); },
  capDocument: async () => { // save photo without AI analysis
    const a = { id: uid(), kind: cap.kind, mode: cap.mode, at: nowISO(), status: "documented", saved: false, provider: "None (photo only)", input: { width: cap.w, height: cap.h }, quality: cap.q, notes: "", result: null };
    await persistCapturePhoto(a); S().assessments.unshift(a); Store.save(); cap = null; R.tab = "history"; R.id = a.id; render();
  },
  capAnalyse: async () => {
    if (!Clinic.c.ai[cap.kind]) { cap.err = AI_ERR.disabled; render(); return; }
    if (!S().consent.ai) {
      return confirmBox("Allow AI photo analysis?", "Your photo will be sent to Claude (Anthropic) through claude.ai to describe visible features. Results are cosmetic observations, not diagnoses. You can turn this off in Settings.", "Allow and analyse", () => {
        const c = S().consent; c.ai = true; c.history.unshift({ at: nowISO(), photos: c.photos, ai: true, coachContext: c.coachContext }); Store.save(); ACTIONS.capAnalyse(); }, false);
    }
    if (Cap.sample === undefined) { toast("Still connecting to the AI service. Try again in a moment."); return; }
    if (!Cap.sample || !Cap.imgOK) { cap.err = AI_ERR[!Cap.sample ? "unavailable" : "images_unavailable"]; render(); return; }
    const a = { id: uid(), kind: cap.kind, mode: cap.mode, at: nowISO(), status: "processing", saved: false, provider: "Claude (Anthropic) via claude.ai", model: "", input: { width: cap.w, height: cap.h }, quality: cap.q, notes: "", result: null };
    cap.stage = "processing"; cap.ctl = new AbortController(); cap.aid = a.id; render();
    try {
      const prompt = a.kind === "skin" ? SKIN_PROMPT(S().skin) : HAIR_PROMPT(S().hair, a.mode);
      const raw = await Cap.sample.json(prompt, { images: [cap.blob], modelTier: "default", signal: cap.ctl.signal });
      a.result = validateResult(raw, a.kind); a.status = a.result.usable ? "completed" : "rejected"; a.model = "Model tier: default";
    } catch (e) {
      if (e?.code === "cancelled") { cap.stage = "review"; render(); return; }
      a.status = "failed"; a.error = e?.code || e?.message || "error";
      if (a.status === "failed") { cap.stage = "review"; cap.err = aiErr(e); render(); return; } // nothing recorded on failure
    }
    if (a.status === "rejected") { cap.stage = "review"; cap.rejected = a.result; render(); return; }
    await persistCapturePhoto(a); S().assessments.unshift(a); Store.save(); cap = null; R.tab = "history"; R.id = a.id; render();
  },
  saveAssessment: el => { const a = S().assessments.find(x => x.id === el.dataset.id); a.saved = true; commit(); toast("Saved to your history"); },
  discardAssessment: el => { const a = S().assessments.find(x => x.id === el.dataset.id); (a.photoIds || []).forEach(p => Store.deletePhoto(p)); S().assessments = S().assessments.filter(x => x !== a); R.id = null; R.tab = "scan"; commit(); },
  deleteAssessment: el => confirmBox("Delete this assessment?", "The photo and its observations will be permanently removed.", "Delete", () => {
    const a = S().assessments.find(x => x.id === el.dataset.id); (a.photoIds || []).forEach(p => Store.deletePhoto(p)); S().assessments = S().assessments.filter(x => x !== a); R.id = null; commit(); toast("Deleted"); }),
  selRegion: el => { selRegion = selRegion === el.dataset.r ? null : el.dataset.r; rerenderKeep(); },
  toggleReport: el => { const a = S().assessments.find(x => x.id === el.dataset.id); a.includeInReport = !a.includeInReport; commit(false); rerenderKeep(); },
  addRegionNote: () => { const t = $("#region-note")?.value.trim(); if (!t || !selRegion) return; const rn = S().skin.regionNotes; (rn[selRegion] = rn[selRegion] || []).unshift({ id: uid(), at: nowISO(), text: t, source: "self" }); commit(false); rerenderKeep(); },
  delRegionNote: el => { const rn = S().skin.regionNotes; rn[el.dataset.r] = rn[el.dataset.r].filter(n => n.id !== el.dataset.id); commit(false); rerenderKeep(); },
  reportAI: el => openModal(`<h3>Report a problem with this analysis</h3><p class="muted small" style="margin:6px 0 14px">Feedback is stored with your records. Your photo is never used for training.</p>
    <div class="stack"><label class="field" for="fb-kind"><span>What went wrong?</span><select id="fb-kind"><option>Incorrect observation</option><option>Missed something visible</option><option>Confusing wording</option><option>Didn't account for my skin tone or hair texture</option><option>Image-analysis problem</option><option>Other</option></select></label>
    <label class="field" for="fb-note"><span>Details (optional)</span><textarea id="fb-note"></textarea></label></div>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="submitAIFeedback" data-id="${el.dataset.id}">Send</button></div>`),
  submitAIFeedback: el => { S().aiFeedback.unshift({ id: uid(), at: nowISO(), target: el.dataset.id, kind: $("#fb-kind").value, note: $("#fb-note").value }); closeModal(); commit(false); toast("Thanks. Feedback recorded."); },
  askAboutAssessment: el => { const a = S().assessments.find(x => x.id === el.dataset.id); go("coach"); sendChat(`Can you explain my ${a.kind === "skin" ? "skin" : "hair"} photo assessment from ${fmtDate(a.at)} in plain terms, and what I could document next time?`); }
});

/* hydrate <img data-photo> after each render */
function hydratePhotos() { document.querySelectorAll("img[data-photo]").forEach(async img => { const d = await Store.getPhoto(img.dataset.photo); if (d) img.src = d; else img.replaceWith(Object.assign(document.createElement("div"), { className: "thumb", title: "Photo not stored", innerHTML: "" })); }); }

function captureView(kind) {
  if (kind === "hair" && (!cap || cap.kind !== "hair")) {
    return `<p class="muted" style="margin-bottom:14px">Choose what you're documenting. Each mode asks for a different view so photos stay comparable over time.</p>
    <div class="grid g2">${Object.entries(HAIR_MODES).map(([k, [t, d]]) => `<button class="card" style="text-align:left;cursor:pointer" data-a="capMode" data-mode="${k}"><b>${t}</b><p class="muted small" style="margin-top:4px">${d}</p></button>`).join("")}</div>
    <div class="notice" style="margin-top:16px">${ic("info")}<div>Some characteristics can't be judged from a photo: porosity, strand diameter, growth rate and the cause of any hair change. Use the <button class="btn sm" data-a="tab" data-tab="porosity">porosity questionnaire</button> and the length log for those.</div></div>`;
  }
  if (!cap || cap.kind !== kind) cap = { kind, mode: kind === "skin" ? "face" : null, stage: "guide" };
  const c = cap, mode = kind === "hair" ? HAIR_MODES[c.mode] : null;
  const guide = kind === "skin"
    ? ["Face a window or soft, even light. Avoid overhead spotlights and coloured light.", "Hold the camera at arm's length, level with your face.", "Remove heavy makeup if you can; turn off beauty filters and portrait effects.", "Hair back, glasses off. Neutral expression.", "Use the same spot and time of day for future photos."]
    : [mode[1], "Daylight or bright, even light. No flash glare on the scalp.", "Keep the camera still; tap to focus before taking the photo.", "Same angle and distance each time so comparisons are fair."];
  const status = c.stage === "processing" ? `<div class="notice">${ic("info")}<div class="row" style="gap:10px"><span class="spinner"></span> Sending to Claude for a description of visible features… <button class="btn sm" data-a="capCancel">Cancel</button></div></div>` : "";
  return `
  ${kind === "hair" ? `<div class="spread" style="margin-bottom:14px"><div><div class="label">Mode</div><b>${mode[0]}</b></div><button class="btn sm" data-a="capCancel">Change mode</button></div>` : ""}
  <div class="capture">
    <div class="stack">
      <div class="viewport">${c.thumb ? `<img src="${c.thumb}" alt="Photo preview">` : `${kind === "skin" ? '<div class="guide-oval"></div>' : ""}<div class="stack" style="align-items:center;text-align:center;padding:20px;gap:10px;position:relative"><span class="muted">${ic("camera", "")}</span><span class="muted small">${c.stage === "loading" ? "Reading photo…" : "No photo yet"}</span></div>`}</div>
      ${c.stage === "guide" || c.stage === "loading" ? `<div class="row"><button class="btn primary" data-a="capCamera" ${mode && mode[2] === "env" ? 'data-env="1"' : ""}>${ic("camera")} Take photo</button>${kind === "hair" ? `<button class="btn" data-a="capCamera" ${mode[2] === "env" ? "" : 'data-env="1"'}>Use other camera</button>` : ""}<button class="btn" data-a="capUpload">${ic("upload")} Upload</button></div>
        <p class="muted small">On phones, "Take photo" opens your camera app. On a computer it opens a file picker; use a recent photo or a webcam capture.</p>` : ""}
    </div>
    <div class="stack">
      ${c.err ? `<div class="notice err">${ic("warn")}<div>${esc(c.err)}</div></div>` : ""}
      ${status}
      ${c.stage === "review" ? reviewPanel(c) : `<div class="card"><div class="label">Scan quality coach</div><ol class="small" style="margin:10px 0 0;padding-left:18px;display:grid;gap:6px">${guide.map(g => `<li>${esc(g)}</li>`).join("")}</ol></div>
        <div class="notice">${ic("info")}<div class="small">Photos are checked on your device for size, light, focus and glare. Analysis only starts when you press <b>Analyse</b>. ${S().consent.photos ? "Saved photos are kept with your records." : "Photo storage is off, so photos are only kept for this session."}</div></div>`}
    </div>
  </div>`;
}
function reviewPanel(c) {
  const q = c.q, mark = s => s === "ok" ? `<span class="chip ok">OK</span>` : s === "warn" ? `<span class="chip warn">Check</span>` : `<span class="chip err">Retake</span>`;
  const blocked = q.verdict === "fail";
  return `<div class="card"><div class="spread"><div class="label">Image check</div>${q.verdict === "ok" ? `<span class="chip ok">Ready</span>` : q.verdict === "warn" ? `<span class="chip warn">Usable with limits</span>` : `<span class="chip err">Not usable</span>`}</div>
    <div class="checks" style="margin-top:12px">${q.checks.map(k => `<div class="check">${mark(k.s)}<div><b>${k.k}</b><br><span class="muted small">${esc(k.m)}</span></div></div>`).join("")}</div>
    ${c.rejected ? `<div class="notice warn" style="margin-top:12px">${ic("warn")}<div><b>The analysis couldn't use this photo.</b> ${esc(c.rejected.quality_issues.join(" ") || c.rejected.summary)} Nothing was saved.</div></div>` : ""}
    ${blocked ? `<p class="small" style="margin-top:12px">This photo is too ${q.checks.filter(k => k.s === "fail").map(k => k.m.toLowerCase()).join(" and ")} for a reliable description. Please retake it.</p>` : ""}
    <div class="row" style="margin-top:16px"><button class="btn" data-a="capRetake">Retake</button>
      ${blocked ? "" : `<button class="btn primary" data-a="capAnalyse" ${c.stage === "processing" ? "disabled" : ""}>Analyse with AI</button><button class="btn" data-a="capDocument">Save photo only</button>`}</div>
    <p class="muted small" style="margin-top:10px">Basic on-device checks (brightness ${q.metrics.mean}/255, focus ${q.metrics.focus}). Framing is checked during analysis.</p></div>`;
}

function faceMap(highlights = {}) {
  const rg = (k, shape) => `<g role="button" tabindex="0" aria-label="${FACE_REGIONS[k]}${highlights[k] ? `, ${highlights[k]} entries` : ""}" data-a="selRegion" data-r="${k}">${shape.replace(/class="rg"/g, `class="rg ${highlights[k] ? "has" : ""} ${selRegion === k ? "sel" : ""}"`)}<title>${FACE_REGIONS[k]}</title></g>`;
  return `<svg class="facemap" viewBox="0 0 200 260" role="group" aria-label="Face regions (your left is on the right of the drawing)">
    <ellipse class="outline" cx="100" cy="132" rx="80" ry="108"/>
    ${rg("forehead", '<path class="rg" d="M40 82 Q100 18 160 82 L154 98 Q100 84 46 98 Z"/>')}
    ${rg("under_eyes", '<ellipse class="rg" cx="70" cy="126" rx="18" ry="7"/><ellipse class="rg" cx="130" cy="126" rx="18" ry="7"/>')}
    ${rg("nose", '<path class="rg" d="M92 108 L108 108 L116 164 Q100 172 84 164 Z"/>')}
    ${rg("right_cheek", '<ellipse class="rg" cx="57" cy="160" rx="24" ry="22"/>')}
    ${rg("left_cheek", '<ellipse class="rg" cx="143" cy="160" rx="24" ry="22"/>')}
    ${rg("jawline", '<path class="rg" d="M30 172 Q42 226 100 240 Q158 226 170 172 L160 176 Q148 218 100 229 Q52 218 40 176 Z"/>')}
    ${rg("chin", '<ellipse class="rg" cx="100" cy="212" rx="24" ry="12"/>')}
    <path d="M58 112 Q70 106 82 112 M118 112 Q130 106 142 112" stroke="var(--muted)" stroke-width="1.4" fill="none"/>
    <path d="M86 190 Q100 197 114 190" stroke="var(--muted)" stroke-width="1.4" fill="none"/>
    <text x="22" y="252" style="font-size:9px">your right</text><text x="148" y="252" style="font-size:9px">your left</text>
  </svg>`;
}

function obsList(obs) {
  return obs.map(o => `<div class="li"><div class="grow"><div class="row" style="gap:6px"><span class="chip ai">${pretty(o.feature)}</span><span class="chip">Visibility: ${o.confidence}</span>${o.date ? `<span class="muted small">${fmtDate(o.date)}</span>` : ""}</div><p class="small" style="margin-top:6px">${esc(o.description)}</p></div></div>`).join("");
}

function assessmentView(a) {
  const isSkin = a.kind === "skin", r = a.result, idx = S().assessments.indexOf(a);
  const regionsMap = isSkin ? FACE_REGIONS : HAIR_REGIONS;
  const hi = {}; (r?.regions || []).forEach(g => hi[g.region] = g.observations.length);
  const shown = r ? (isSkin && selRegion ? r.regions.filter(g => g.region === selRegion) : r.regions) : [];
  return `
  <div class="spread" style="margin-bottom:16px"><button class="btn sm ghost" data-a="tab" data-tab="history">← All assessments</button>
    <div class="row">${a.saved ? `<span class="chip ok">Saved</span>` : `<span class="chip warn">Not saved yet</span>`}<span class="chip">${a.status === "documented" ? "Photo only" : "AI-assisted"}</span></div></div>
  <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:20px" id="assess-grid">
    <div class="stack">
      <div class="viewport">${(a.photoIds || [])[0] ? `<img data-photo="${a.photoIds[0]}" alt="Photo from ${fmtDate(a.at)}">` : ""}</div>
      ${a.photoStored === false ? `<p class="muted small">Photo storage is off, so this photo is only available until you close the app.</p>` : ""}
      ${isSkin && r ? `<div class="card"><div class="label" style="margin-bottom:8px">Areas assessed · tap to filter</div>${faceMap(hi)}</div>` : ""}
      <div class="card"><div class="label" style="margin-bottom:8px">Provenance</div><dl class="kv small">
        <dt>Captured</dt><dd>${fmtDate(a.at)} ${fmtTime(a.at)}</dd><dt>Type</dt><dd>${isSkin ? "Face" : esc(HAIR_MODES[a.mode]?.[0] || a.mode)}</dd>
        <dt>Analysis</dt><dd>${esc(a.provider)}</dd>${a.model ? `<dt>Model</dt><dd>${esc(a.model)}</dd>` : ""}
        <dt>Input</dt><dd>${a.input?.width}×${a.input?.height}px, sent downscaled</dd>
        <dt>On-device check</dt><dd>${(a.quality?.checks || []).map(c => `${c.k}: ${c.s}`).join(" · ")}</dd>
        <dt>Consent</dt><dd>${a.status === "documented" ? "Photo only, not sent" : "AI analysis consented"}</dd></dl></div>
    </div>
    <div class="stack">
      ${r ? `<div class="card raised"><div class="label">Summary</div><p style="margin-top:8px;font-size:1.02rem">${esc(r.summary)}</p>
        <p class="muted small" style="margin-top:10px">These are descriptions of what's visible in one photo, not a diagnosis. Lighting and camera processing affect what can be seen.</p></div>
        ${r.suggest_professional ? `<div class="notice warn">${ic("warn")}<div><b>Worth showing a professional.</b> ${esc(r.professional_reason)} A photo can't tell what this is. A dermatologist or doctor can examine it properly. <button class="btn sm" data-a="go" data-page="pro" data-tab="prep" style="margin-top:8px">Prepare a report</button></div></div>` : ""}
        <div class="card"><div class="spread"><div class="label">Observations ${isSkin && selRegion ? "· " + FACE_REGIONS[selRegion] : ""}</div>${isSkin && selRegion ? `<button class="btn sm ghost" data-a="selRegion" data-r="${selRegion}">Show all</button>` : ""}</div>
          ${shown.length ? shown.map(g => `<div style="margin-top:12px"><b class="small">${regionsMap[g.region]}</b><div class="list">${obsList(g.observations)}</div></div>`).join("") : `<p class="muted small" style="margin-top:10px">No visible observations recorded${isSkin && selRegion ? " for this area" : ""}.</p>`}</div>
        ${r.not_assessable.length || r.limitations.length || r.quality_issues.length ? `<div class="card"><div class="label">Limits of this photo</div><ul class="small" style="margin:8px 0 0;padding-left:18px;display:grid;gap:4px">${[...r.quality_issues, ...r.limitations, ...r.not_assessable.map(x => "Not assessable: " + x)].map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}`
      : `<div class="card"><div class="label">Photo record</div><p style="margin-top:8px">This photo was saved for documentation without AI analysis. Add your own notes below, or compare it with other dates.</p></div>`}
      ${!isSkin ? `<div class="card tint"><div class="label">Your Hair ID (self-reported)</div><dl class="kv small" style="margin-top:8px"><dt>Pattern</dt><dd>${val(S().hair.curl)}</dd><dt>Porosity</dt><dd>${val(S().hair.porosity)}</dd><dt>Density</dt><dd>${val(S().hair.density)}</dd><dt>Scalp</dt><dd>${val(S().hair.scalp.type)}</dd></dl></div>` : ""}
      <div class="card"><label class="field" for="a-notes"><span>Your notes</span><textarea id="a-notes" data-bind="assessments.${idx}.notes" placeholder="Products used this week, how your skin or scalp felt, anything the photo doesn't show">${esc(a.notes)}</textarea></label>
        <label class="row small" style="margin-top:10px"><input type="checkbox" data-a="toggleReport" data-id="${a.id}" ${a.includeInReport ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> Include in my next consultation report</label></div>
      <div class="row">
        ${a.saved ? "" : `<button class="btn primary" data-a="saveAssessment" data-id="${a.id}">${ic("save")} Save to history</button><button class="btn" data-a="discardAssessment" data-id="${a.id}">Discard</button>`}
        ${a.saved ? `<button class="btn" data-a="go" data-page="${a.kind}" data-tab="compare" data-id="${a.id}">Compare</button>` : ""}
        ${r ? `<button class="btn" data-a="askAboutAssessment" data-id="${a.id}">Ask the coach</button><button class="btn ghost" data-a="reportAI" data-id="${a.id}">Report a problem</button>` : ""}
        ${a.saved ? `<button class="btn danger" data-a="deleteAssessment" data-id="${a.id}">${ic("trash")} Delete</button>` : ""}
      </div>
    </div>
  </div>`;
}

function historyView(kind) {
  if (R.id) { const a = S().assessments.find(x => x.id === R.id); if (a) return assessmentView(a); }
  const list = S().assessments.filter(a => a.kind === kind && a.saved).sort((a, b) => b.at.localeCompare(a.at));
  if (!list.length) return emptyBox(`No saved ${kind === "skin" ? "face" : "hair or scalp"} assessments yet.`, `<button class="btn primary" data-a="tab" data-tab="scan">${ic("camera")} Take a photo</button>`);
  return `<div class="card"><div class="list">${list.map(a => `<div class="li"><img class="thumb" data-photo="${a.photoIds?.[0] || ""}" alt=""><div class="grow"><div class="row" style="gap:6px"><b>${fmtDate(a.at)}</b><span class="muted small">${fmtTime(a.at)}</span>${a.status === "documented" ? `<span class="chip">Photo only</span>` : `<span class="chip ai">AI-assisted</span>`}${kind === "hair" ? `<span class="chip">${esc(HAIR_MODES[a.mode]?.[0] || "")}</span>` : ""}</div>
    <p class="small muted" style="margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.result?.summary || a.notes || "No notes")}</p></div><button class="btn sm" data-a="go" data-page="${kind}" data-tab="history" data-id="${a.id}">Open</button></div>`).join("")}</div></div>`;
}

let cmpSel = { skin: [null, null], hair: [null, null] };
function compareView(kind) {
  const list = S().assessments.filter(a => a.kind === kind && a.saved && a.photoIds?.length).sort((a, b) => a.at.localeCompare(b.at));
  if (list.length < 2) return emptyBox("You need at least two saved photos to compare. Take photos in similar light and position a few weeks apart.", `<button class="btn primary" data-a="tab" data-tab="scan">Take a photo</button>`);
  const cs = cmpSel[kind];
  if (R.id && !cs.includes(R.id)) { cs[1] = R.id; }
  if (!cs[0] || !list.find(a => a.id === cs[0])) cs[0] = list[0].id;
  if (!cs[1] || !list.find(a => a.id === cs[1]) || cs[1] === cs[0]) cs[1] = list.at(-1).id === cs[0] ? list[0].id : list.at(-1).id;
  const A = list.find(a => a.id === cs[0]), B = list.find(a => a.id === cs[1]);
  const opt = (sel) => list.map(a => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${fmtDate(a.at)}${kind === "hair" ? " · " + (HAIR_MODES[a.mode]?.[0] || "") : ""}</option>`).join("");
  const side = (a, l) => `<div class="card"><div class="label">${l} · ${fmtDate(a.at)}</div><p class="small" style="margin-top:6px">${esc(a.result?.summary || "Photo only, no AI description.")}</p>${a.notes ? `<p class="small muted" style="margin-top:6px">Your note: ${esc(a.notes)}</p>` : ""}</div>`;
  return `<div class="notice" style="margin-bottom:16px">${ic("info")}<div class="small">Differences between photos can come from light, angle, distance and camera processing. A comparison shows change over time; it can't show what caused it.${kind === "hair" && A.mode !== B.mode ? " <b>These photos use different modes, so the views may not match.</b>" : ""}</div></div>
  <div class="grid g2" style="margin-bottom:16px"><label class="field" for="cmp-a"><span>Before</span><select id="cmp-a" data-a2="cmp" data-i="0" data-kind="${kind}">${opt(cs[0])}</select></label><label class="field" for="cmp-b"><span>After</span><select id="cmp-b" data-a2="cmp" data-i="1" data-kind="${kind}">${opt(cs[1])}</select></label></div>
  <div class="grid" style="grid-template-columns:minmax(0,460px) minmax(0,1fr);gap:20px" id="cmp-grid">
    <div class="cmp" id="cmp-box"><img data-photo="${A.photoIds[0]}" alt="Before, ${fmtDate(A.at)}"><img class="after" id="cmp-after" data-photo="${B.photoIds[0]}" alt="After, ${fmtDate(B.at)}"><div class="handle" id="cmp-handle"></div>
      <span class="tag" style="left:10px">${fmtDate(A.at, { day: "numeric", month: "short" })}</span><span class="tag" style="right:10px">${fmtDate(B.at, { day: "numeric", month: "short" })}</span>
      <label class="sr" for="cmp-range">Comparison slider</label><input type="range" id="cmp-range" min="0" max="100" value="50" data-cmp="1"></div>
    <div class="stack">${side(A, "Before")}${side(B, "After")}<p class="muted small">${daysBetween(A.at, B.at)} days apart. Both photos are shown at the same size and crop.</p>
      <div class="row"><button class="btn" data-a="exportCompare" data-kind="${kind}">Export comparison</button></div></div>
  </div>`;
}
document.addEventListener("input", e => { if (e.target.dataset.cmp) { const v = e.target.value; $("#cmp-after").style.clipPath = `inset(0 0 0 ${v}%)`; $("#cmp-handle").style.left = v + "%"; } });
document.addEventListener("change", e => { if (e.target.dataset.a2 === "cmp") { cmpSel[e.target.dataset.kind][+e.target.dataset.i] = e.target.value; R.id = null; rerenderKeep(); } });
ACTIONS.exportCompare = async el => {
  const kind = el.dataset.kind, [ia, ib] = cmpSel[kind]; const A = S().assessments.find(a => a.id === ia), B = S().assessments.find(a => a.id === ib);
  const [pa, pb] = await Promise.all([Store.getPhoto(A.photoIds[0]), Store.getPhoto(B.photoIds[0])]);
  const block = (a, p, l) => `<section><h2>${l}: ${fmtDate(a.at)}</h2>${p ? `<img src="${p}" style="max-width:100%;width:360px;border-radius:12px">` : "<p>(photo not stored)</p>"}<p>${esc(a.result?.summary || "Photo only.")}</p>${a.notes ? `<p><i>Note: ${esc(a.notes)}</i></p>` : ""}</section>`;
  saveFile(`radiance-comparison-${dayKey()}.html`, docWrap(`${kind === "skin" ? "Skin" : "Hair"} photo comparison`, block(A, pa, "Before") + block(B, pb, "After") + `<p class="note">Photo differences can reflect lighting and positioning. AI descriptions are visible observations, not diagnoses.</p>`));
};

/* ---------- 9. Skin Lab ---------- */
PAGES.skin = () => {
  const t = R.tab || "id";
  return pageHead("Skin Lab", "Your skin, documented", "Your Skin ID, guided face photos, and a dated history you can compare.") +
    tabs([["id", "Skin ID"], ["scan", "New scan"], ["history", "History"], ["compare", "Compare"]], t) +
    (t === "id" ? skinIdView() : t === "scan" ? captureView("skin") : t === "history" ? historyView("skin") : compareView("skin"));
};
function regionData(k) {
  const notes = (S().skin.regionNotes[k] || []).map(n => ({ ...n, kind: "note" }));
  const obs = []; S().assessments.filter(a => a.kind === "skin" && a.saved && a.result).forEach(a => a.result.regions.filter(g => g.region === k).forEach(g => g.observations.forEach(o => obs.push({ ...o, date: a.at, aid: a.id }))));
  return { notes, obs };
}
function skinIdView() {
  const s = S().skin, hi = {};
  Object.keys(FACE_REGIONS).forEach(k => { const d = regionData(k); const n = d.notes.length + d.obs.length; if (n) hi[k] = n; });
  const rd = selRegion ? regionData(selRegion) : null;
  return `<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:20px" id="skinid-grid">
  <div class="stack">
    <div class="idcard"><div class="spread"><span class="label">Skin ID</span><span class="code">SKN · ${esc((Store.uid || "local").slice(0, 6).toUpperCase())}</span></div>
      <dl class="kv" style="margin-top:14px">
        <dt>Skin type</dt><dd>${val(s.type)} ${s.type ? srcChip(s.src.type) : ""}</dd>
        <dt>Sensitivity</dt><dd>${val(s.sensitivity)} ${s.sensitivity ? srcChip(s.src.sensitivity) : ""}</dd>
        <dt>Dry / oily tendency</dt><dd>${val(s.tendency)}</dd>
        <dt>Feels tight (dehydration)</dt><dd>${val(s.dehydration)}</dd>
        <dt>Allergies & sensitivities</dt><dd>${val(s.allergies)}</dd>
        <dt>Concerns</dt><dd>${s.concerns.length ? s.concerns.map(c => `<span class="chip self">${esc(c)}</span>`).join("") : val("")}</dd>
        <dt>Goals</dt><dd>${val(s.goals)}</dd></dl>
      <p class="muted small" style="margin-top:12px">Skin type, sensitivity, dehydration and allergies are recorded separately on purpose: they're different things.</p></div>
    <details class="card" open><summary style="cursor:pointer;font-weight:600">Edit Skin ID</summary>
      <div class="stack" style="margin-top:14px;gap:16px">
        <div class="grid g2">${sel("skin.type", OPT.skinType, "Skin type")}${sel("skin.sensitivity", OPT.sensitivity, "Sensitivity")}${sel("skin.tendency", OPT.tendency, "Dryness or oiliness tendency")}${sel("skin.dehydration", OPT.dehydration, "Does it feel tight or dehydrated?")}</div>
        <div class="field"><span>Visible concerns you want to track</span>${chipsPick("skin.concerns", OPT.skinConcerns)}</div>
        ${txt("skin.allergies", "Known allergies or product sensitivities", "Comma separated. The product checker flags these.")}
        ${txt("skin.goals", "Personal skin goals")}${txt("skin.preferred", "Products or ingredients you like")}
        ${txt("skin.notes", "Notes", "", "", true)}
      </div></details>
    <details class="card"><summary style="cursor:pointer;font-weight:600">Change history (${s.history.length})</summary>
      ${s.history.length ? `<div class="list" style="margin-top:10px">${s.history.slice(0, 25).map(h => `<div class="li small"><span class="mono muted">${fmtDate(h.at)}</span><div class="grow"><b>${pretty(h.field)}</b>: ${esc(h.from || "—")} → ${esc(h.to || "—")}</div></div>`).join("")}</div>` : `<p class="muted small" style="margin-top:8px">Edits to your Skin ID are logged here.</p>`}</details>
  </div>
  <div class="stack">
    <div class="card"><div class="label" style="margin-bottom:6px">Face map</div><p class="muted small" style="margin-bottom:10px">Tap an area to see notes and photo observations for it.</p>${faceMap(hi)}</div>
    ${rd ? `<div class="card raised"><div class="spread"><h3>${FACE_REGIONS[selRegion]}</h3><button class="btn sm ghost" data-a="selRegion" data-r="${selRegion}">Close</button></div>
      <div class="row" style="margin-top:12px;flex-wrap:nowrap"><label class="sr" for="region-note">Add a note</label><input type="text" id="region-note" placeholder="Add a note about this area"><button class="btn sm primary" data-a="addRegionNote">Add</button></div>
      <div class="list" style="margin-top:8px">${rd.notes.map(n => `<div class="li"><div class="grow"><div class="row" style="gap:6px">${srcChip(n.source)}<span class="muted small">${fmtDate(n.at)}</span></div><p class="small" style="margin-top:4px">${esc(n.text)}</p></div><button class="icon-btn" aria-label="Delete note" data-a="delRegionNote" data-r="${selRegion}" data-id="${n.id}">${ic("trash")}</button></div>`).join("")}
      ${obsList(rd.obs)}</div>
      ${!rd.notes.length && !rd.obs.length ? `<p class="muted small" style="margin-top:8px">Nothing recorded for this area yet.</p>` : ""}</div>`
      : `<div class="notice">${ic("info")}<div class="small">Areas tinted lavender have notes or photo observations.</div></div>`}
  </div></div>`;
}

/* ---------- 10. Hair Lab ---------- */
PAGES.hair = () => {
  const t = R.tab || "id";
  return pageHead("Hair Lab", "Hair and scalp, over time", "Your Hair ID, guided photos for hairline, parting and scalp, a porosity questionnaire and a length log.") +
    tabs([["id", "Hair ID"], ["scan", "Document"], ["porosity", "Porosity check"], ["length", "Length log"], ["history", "History"], ["compare", "Compare"]], t) +
    (t === "id" ? hairIdView() : t === "scan" ? captureView("hair") : t === "porosity" ? porosityView() : t === "length" ? lengthView() : t === "history" ? historyView("hair") : compareView("hair"));
};
const lvlScale = (v, opts) => { const i = opts.indexOf(v); return i >= 0 && i < 3 ? `<div class="scale" aria-hidden="true">${[0, 1, 2].map(n => `<i class="${n <= i ? "on" : ""}"></i>`).join("")}</div>` : ""; };
function hairIdView() {
  const h = S().hair;
  const cell = (l, v, opts, src, note) => `<div class="card" style="padding:16px"><div class="label">${l}</div><div class="row" style="margin-top:6px;gap:6px"><b style="font-size:1.05rem">${val(v)}</b>${v ? srcChip(src) : ""}</div>${opts ? lvlScale(v, opts) : ""}${note ? `<p class="muted small" style="margin-top:8px">${note}</p>` : ""}</div>`;
  return `<div class="grid g3" style="margin-bottom:16px">
    ${cell("Curl pattern", h.curl, null, h.src.curl, h.curlDetail ? esc(h.curlDetail) : "Descriptive only, not a medical category.")}
    ${cell("Porosity", h.porosity, ["Low", "Medium", "High"], h.src.porosity, "Can't be read from a photo. Use the questionnaire.")}
    ${cell("Density", h.density, ["Low", "Medium", "High"], h.src.density, "How much hair you have overall.")}
    ${cell("Strand thickness", h.thickness, ["Fine", "Medium", "Coarse"], h.src.thickness, "Width of one strand, not the amount of hair.")}
    ${cell("Elasticity", h.elasticity, null, h.src.elasticity, "Home stretch tests vary with moisture and treatments.")}
    ${cell("Scalp", h.scalp.type, null, h.src["scalp.type"], h.scalp.flaking && h.scalp.flaking !== "None" ? "Flaking: " + esc(h.scalp.flaking) : "")}
  </div>
  <div class="grid g2">
    <details class="card" open><summary style="cursor:pointer;font-weight:600">Hair structure</summary><div class="stack" style="margin-top:14px">
      <div class="grid g2">${sel("hair.curl", OPT.curl, "Curl pattern")}${txt("hair.curlDetail", "Curl detail (optional)", "e.g. 4C crown, 4A nape")}${sel("hair.porosity", OPT.porosity, "Porosity")}${sel("hair.density", OPT.density, "Density")}${sel("hair.thickness", OPT.thickness, "Strand thickness")}${sel("hair.elasticity", OPT.elasticity, "Elasticity observation")}</div>
      <div class="grid g2">${txt("hair.length", "Current length", "", "e.g. shoulder length stretched")}${txt("hair.desiredLength", "Desired length")}</div>${txt("hair.shrinkage", "Shrinkage observations")}
    </div></details>
    <details class="card" open><summary style="cursor:pointer;font-weight:600">Scalp profile</summary><div class="stack" style="margin-top:14px">
      <div class="grid g2">${sel("hair.scalp.type", OPT.scalp, "Scalp type")}${sel("hair.scalp.oiliness", OPT.level, "Oiliness")}${sel("hair.scalp.dryness", OPT.level, "Dryness")}${sel("hair.scalp.flaking", OPT.level, "Flaking")}${sel("hair.scalp.itch", OPT.level, "Itchiness")}${sel("hair.scalp.sensitivity", OPT.level, "Sensitivity or discomfort")}${sel("hair.scalp.buildup", OPT.level, "Product buildup")}</div>
      ${txt("hair.scalp.notes", "Scalp notes", "Self-observed redness, tenderness, when it changes")}
      <p class="muted small">Recording flaking or itch doesn't diagnose anything. If symptoms are persistent, painful or spreading, see a dermatologist.</p>
    </div></details>
    <details class="card"><summary style="cursor:pointer;font-weight:600">History and habits</summary><div class="stack" style="margin-top:14px">
      <div class="grid g2">${sel("hair.chemical", OPT.chemical, "Chemical treatments")}${txt("hair.colour", "Colouring")}${sel("hair.heat", OPT.heat, "Heat styling")}${sel("hair.washFreq", OPT.washFreq, "Wash frequency")}${txt("hair.protective", "Protective styles you wear")}${txt("hair.detangling", "Detangling method")}</div>
      <div class="field"><span>Concerns</span>${chipsPick("hair.concerns", OPT.hairConcerns)}</div>${txt("hair.goals", "Hair goals")}${txt("hair.notes", "Notes", "", "", true)}
    </div></details>
    <details class="card"><summary style="cursor:pointer;font-weight:600">Change history (${h.history.length})</summary>
      ${h.history.length ? `<div class="list" style="margin-top:10px">${h.history.slice(0, 25).map(x => `<div class="li small"><span class="mono muted">${fmtDate(x.at)}</span><div class="grow"><b>${pretty(x.field)}</b>: ${esc(x.from || "—")} → ${esc(x.to || "—")}</div></div>`).join("")}</div>` : `<p class="muted small" style="margin-top:8px">Edits to your Hair ID are logged here.</p>`}</details>
  </div>
  ${(h.concerns.includes("Shedding") || h.concerns.includes("Thinning-looking hairline")) ? `<div class="notice warn" style="margin-top:16px">${ic("warn")}<div class="small">If shedding or thinning is sudden, patchy, or getting worse quickly, or comes with pain or scalp changes, a dermatologist can look for the cause. An app can track it but can't explain it.</div></div>` : ""}`;
}

const POROSITY_Q = [
  ["When you wet your hair, how quickly does it feel fully soaked?", [["Almost instantly", "H"], ["Within a minute or so", "M"], ["Water beads up; it takes a long time", "L"]]],
  ["How long does it take to air-dry?", [["Fast, often under an hour or two", "H"], ["A few hours", "M"], ["Very long, sometimes most of a day", "L"]]],
  ["What happens with leave-ins and creams?", [["They seem to disappear; I need more soon", "H"], ["They absorb reasonably", "M"], ["They sit on top or build up", "L"]]],
  ["Chemical or heat history?", [["Frequent bleach, relaxer or high heat", "H"], ["Occasional", "M"], ["Rarely or never", "L"]]],
  ["Does your hair feel dry again soon after moisturising?", [["Often, within a day", "H"], ["Sometimes", "M"], ["Rarely; moisture lasts", "L"]]]
];
let poroAns = {};
function porosityView() {
  const n = Object.keys(poroAns).length, tally = { H: 0, M: 0, L: 0 }; Object.values(poroAns).forEach(v => tally[v]++);
  const top = n === POROSITY_Q.length ? Object.entries(tally).sort((a, b) => b[1] - a[1]) : null;
  const res = top ? (top[0][1] === top[1][1] ? "Mixed / unclear" : { H: "High", M: "Medium", L: "Low" }[top[0][0]]) : null;
  return `<div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:20px" id="poro-grid"><div class="stack">
    ${POROSITY_Q.map(([q, as], i) => `<div class="card"><b>${i + 1}. ${q}</b><div class="choice-grid" style="margin-top:10px">${as.map(([l, v]) => `<button class="choice" aria-pressed="${poroAns[i] === v}" data-a="poro" data-i="${i}" data-v="${v}">${l}</button>`).join("")}</div></div>`).join("")}</div>
  <div class="stack"><div class="card raised" style="position:sticky;top:20px"><div class="label">Result</div>
    ${res ? `<h2 style="margin:8px 0">${res === "Mixed / unclear" ? "Mixed signals" : res + " porosity tendency"}</h2><p class="muted small">Answers: ${tally.H} high, ${tally.M} medium, ${tally.L} low. This is a self-assessment, not a measurement. Porosity can differ between your roots and ends.</p>
      ${res !== "Mixed / unclear" ? `<button class="btn primary" data-a="poroSave" data-v="${res}" style="margin-top:14px">Save to Hair ID as questionnaire result</button>` : `<p class="small" style="margin-top:10px">Try keeping notes on how products behave over a few wash days, then retake it.</p>`}`
      : `<p class="muted" style="margin-top:8px">${n}/${POROSITY_Q.length} answered.</p><div class="bar" style="margin-top:10px"><i style="width:${n / POROSITY_Q.length * 100}%"></i></div>`}
    <p class="muted small" style="margin-top:14px">Why not the float test? A strand floating or sinking in a glass is affected by oils, product residue and surface tension, so on its own it isn't a reliable measure.</p></div></div></div>`;
}
Object.assign(ACTIONS, {
  poro: el => { poroAns[el.dataset.i] = el.dataset.v; rerenderKeep(); },
  poroSave: el => { const h = S().hair, prev = h.porosity; h.porosity = el.dataset.v; trackChange("hair.porosity", prev, h.porosity); h.src.porosity = "questionnaire"; h.porosityMethod = { method: "questionnaire", at: nowISO(), answers: { ...poroAns } }; commit(); toast("Porosity saved to your Hair ID"); }
});

function lengthView() {
  const L = [...S().hair.lengths].sort((a, b) => a.at.localeCompare(b.at));
  return `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:20px" id="len-grid">
  <div class="card"><h3>Log a measurement</h3><div class="stack" style="margin-top:12px">
    <div class="grid g2"><label class="field" for="len-date"><span>Date</span><input type="date" id="len-date" value="${dayKey()}"></label>
    <label class="field" for="len-val"><span>Length</span><div class="row" style="flex-wrap:nowrap"><input type="number" id="len-val" min="0" step="0.5" placeholder="26"><select id="len-unit" style="width:80px"><option ${S().profile.units !== "imperial" ? "selected" : ""}>cm</option><option ${S().profile.units === "imperial" ? "selected" : ""}>in</option></select></div></label></div>
    <label class="field" for="len-where"><span>Where and how measured</span><input type="text" id="len-where" placeholder="Crown, stretched, to the ends"></label>
    <button class="btn primary" data-a="addLength">Add measurement</button>
    <p class="muted small">Measure the same section the same way each time. Growth and retention vary a lot between people; the app won't predict a rate.</p></div></div>
  <div class="stack"><div class="card chart"><div class="label" style="margin-bottom:10px">Measured length</div>${L.length >= 2 ? lineChart(L.map(x => ({ x: x.at, y: x.unit === "in" ? x.value * 2.54 : x.value })), "cm") : `<p class="muted small">Add at least two measurements to see a chart.</p>`}</div>
    ${L.length ? `<div class="card"><div class="list">${[...L].reverse().map(x => `<div class="li small"><span class="mono">${fmtDate(x.at)}</span><div class="grow"><b>${x.value} ${x.unit}</b> <span class="muted">${esc(x.where || "")}</span></div><button class="icon-btn" aria-label="Delete measurement" data-a="delLength" data-id="${x.id}">${ic("trash")}</button></div>`).join("")}</div></div>` : ""}</div></div>`;
}
Object.assign(ACTIONS, {
  addLength: () => { const v = parseFloat($("#len-val").value); if (!(v > 0)) { toast("Enter a length greater than zero."); return; } S().hair.lengths.push({ id: uid(), at: $("#len-date").value || dayKey(), value: v, unit: $("#len-unit").value, where: $("#len-where").value.trim() }); commit(); toast("Measurement added"); },
  delLength: el => { S().hair.lengths = S().hair.lengths.filter(x => x.id !== el.dataset.id); commit(); }
});
