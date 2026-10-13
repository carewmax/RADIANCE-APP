/* ============================================================
   PHONE APP LAYOUT (the Android app, and any phone-width browser)
   Follows the clinic's mobile mockup: splash screen, slim header over a photo banner,
   white sheet with rounded top, bottom tab bar: Home · Services · Book · Gallery · Account.
   Desktop keeps the full website layout. Same data, same routes, same honesty rules.
   ============================================================ */
const IS_NATIVE = /RadianceApp/i.test(navigator.userAgent) || !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const MQ_PHONE = window.matchMedia ? matchMedia("(max-width: 760px)") : { matches: false };
const appMode = () => IS_NATIVE || MQ_PHONE.matches;
try { MQ_PHONE.addEventListener("change", () => { if (SURFACE === "site") render(); }); } catch (e) {}
if (IS_NATIVE) document.documentElement.classList.add("native");

const MX = { sCat: "medical", gTab: "ba", gCat: "All", tCat: "All", co: { method: "collect" }, coErr: {}, coBusy: false };
const MXK = { bag: "radiance:bag", orders: "radiance:orders", mine: "radiance:my-bookings", seen: "radiance:notif-seen" };
const MX_TABS = [["", "Home", "home"], ["services", "Services", "grid"], ["book", "Book", "calendar"], ["gallery", "Gallery", "image"], ["account", "Account", "user"]];
const MX_TOP = ["", "services", "book", "gallery", "account"];
const MX_TAB_OF = { "hair-scalp": "services", aesthetics: "services", results: "gallery", signin: "account", notifications: "account", orders: "account", order: "account", appointments: "account" };

/* ---------- bag & orders (kept on this phone; orders are requests the clinic confirms) ---------- */
const money = n => `${Clinic.c.shop?.currency || "Le"} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const shopProducts = () => (Clinic.c.products || []).filter(p => p.published && p.name && Number(p.price) > 0);
const shopOn = () => shopProducts().length > 0;
const Bag = {
  items: lsGet(MXK.bag) || [],
  save() { lsSet(MXK.bag, this.items); },
  lines() { return this.items.map(i => ({ ...i, p: shopProducts().find(p => p.id === i.id) })).filter(l => l.p); },
  count() { return this.lines().reduce((n, l) => n + l.qty, 0); },
  total() { return this.lines().reduce((t, l) => t + Number(l.p.price) * l.qty, 0); },
  set(id, q) { const i = this.items.find(x => x.id === id); if (q <= 0) this.items = this.items.filter(x => x.id !== id); else if (i) i.qty = Math.min(q, 20); else this.items.push({ id, qty: Math.min(q, 20) }); this.save(); }
};
const myOrders = () => lsGet(MXK.orders) || [];
const myRefs = () => lsGet(MXK.mine) || [];
const mxBookings = () => Backend.user ? myBookings() : Clinic.ops.bookings.filter(b => myRefs().includes(b.ref) || (b.patientId && b.patientId === S().patientId));

/* ---------- notifications: built only from real events on this account/phone ---------- */
function mxNotifs() {
  const n = [], st = { requested: "Appointment request sent", confirmed: "Appointment confirmed", completed: "Appointment completed", cancelled: "Appointment cancelled", "no-show": "Appointment missed" };
  mxBookings().forEach(b => n.push({ at: (b.history?.at(-1)?.at) || b.at, icon: "calendar", title: st[b.status] || "Appointment update", text: `${Clinic.type(b.typeId)?.name || "Appointment"} · ${b.date ? fmtDate(b.date) : "date to be confirmed"}${b.time ? " at " + b.time : ""}. Ref ${b.ref}.`, path: "appointments" }));
  myOrders().forEach(o => n.push({ at: o.at, icon: "bag", title: o.delivery === "sent" ? "Order request sent" : "Order saved on this phone", text: `Order ${o.ref} · ${o.items.length} item${o.items.length === 1 ? "" : "s"}. The clinic confirms availability and payment.`, path: "order/" + o.ref }));
  (typeof myCarePlans === "function" ? myCarePlans() : []).forEach(p => n.push({ at: p.issuedAt || p.at || p.updatedAt || "", icon: "pro", title: "Care plan from your clinician", text: p.title || "Open it in your patient app.", portal: ["pro", "plans"] }));
  Clinic.liveCampaigns().forEach(c => n.push({ at: c.start ? c.start + "T08:00:00" : "", icon: "sparkle", title: c.title, text: c.text, path: c.link || "" }));
  return n.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
const mxUnread = () => { const seen = lsGet(MXK.seen) || ""; return mxNotifs().filter(x => x.at && x.at > seen && x.icon !== "sparkle").length; };

/* ---------- building blocks ---------- */
const mxHero = (title, sub, photo, extra = "", cls = "") => `<section class="mx-hero ${cls}"><div class="bg">${String(photo).startsWith("data:") ? `<img class="ph-img" src="${photo}" alt="">` : phImg(photo, "", 900, true)}</div><div class="in"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}${extra}</div></section>`;
const mxMark = (h = 26) => `<span class="mx-mark"><img src="${LOGO_ICON}" alt="" style="height:${h}px"></span>`;
const mxRow = (icon, label, sub, attrs, chev = true) => `<button class="mx-row" ${attrs}><span class="ic">${ic(icon)}</span><span class="grow"><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span>${chev ? ic("chev") : ""}</button>`;
const mxSvcCard = s => `<button class="mx-card" data-a="site" data-path="services/${s.id}"><span class="im">${phImg(svcPhoto(s), "", 500)}</span><span class="bd"><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="more">Learn More</span></span></button>`;
const mxSeg = (key, opts) => `<div class="mx-seg" role="group">${opts.map(([v, l]) => `<button data-a="mxSet" data-k="${key}" data-v="${v}" aria-pressed="${MX[key] === v}">${l}</button>`).join("")}</div>`;
const mxChips = (key, opts) => `<div class="mx-chips" role="group">${opts.map(v => `<button data-a="mxSet" data-k="${key}" data-v="${v}" aria-pressed="${MX[key] === v}">${v}</button>`).join("")}</div>`;
const mxAiNote = () => `<p class="ai-note" style="margin-top:16px">${ic("info")} AI observations are informational. They can be wrong, can't confirm a diagnosis, and never replace an examination by a RADIANCE clinician. <button class="link-more" data-a="site" data-path="ai-limits">What the AI can't do</button></p>`;

/* Any website page without its own phone screen: reuse its content under a phone-style banner. */
function mxGeneric(route, arg) {
  const page = (SITE[route] || SITE.__404)(arg);
  let html = page.html, hero = "", head = page.title || "RADIANCE";
  const m = html.match(/<section class="p-hero[^"]*">([\s\S]*?)<\/section>/);
  if (m) {
    const bg = (m[1].match(/<div class="bg">([\s\S]*?)<\/div>/) || [])[1] || "", h1 = (m[1].match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || "", sub = (m[1].match(/<p class="sub">([\s\S]*?)<\/p>/) || [])[1] || "";
    hero = `<section class="mx-hero short"><div class="bg">${bg}</div><div class="in"><h1>${h1}</h1>${sub ? `<p>${sub}</p>` : ""}</div></section>`;
    html = html.slice(0, m.index) + html.slice(m.index + m[0].length);
    if (h1) head = h1.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
  }
  return { title: page.title, head, hero, body: html.replace("<!--HDR-->", "") };
}

/* ---------- phone screens ---------- */
const MXP = {
  "": () => {
    const h = Clinic.c.hero, camps = Clinic.liveCampaigns();
    return { title: "", hero: mxHero(esc(h.title), esc(h.text), h.image || "heroHome", `<button class="btn lime" style="margin-top:16px" data-a="site" data-path="book">Book Appointment</button>`, "home"),
      body: `<div class="mx-h"><h2>Our Services</h2><button data-a="site" data-path="services">See all ${ic("arrow")}</button></div>
      <div class="mx-tiles">
        <button class="mx-tile" data-a="mxSvc" data-c="medical"><span class="ic">${ic("face")}</span><b>Dermatology</b></button>
        <button class="mx-tile" data-a="mxSvc" data-c="aesthetic"><span class="ic">${ic("sparkle")}</span><b>Aesthetics</b></button>
        <button class="mx-tile" data-a="mxSvc" data-c="hair"><span class="ic">${ic("hair")}</span><b>Hair &amp; Scalp</b></button>
        <button class="mx-tile" data-a="site" data-path="ai-analysis"><span class="ic">${ic("camera")}</span><b>Skin Analysis</b></button></div>
      <div class="mx-promo" style="margin-top:20px"><span class="label" style="color:#CDEBEA">AI-assisted analysis</span><h3>Understand your skin and hair between visits</h3><p class="small" style="opacity:.9">Guided photos with quality checks, and observations you can share with your clinician.</p>
        <div class="row" style="margin-top:6px"><button class="btn lime sm" data-a="site" data-path="ai-analysis">Skin analysis</button><button class="btn sm outline-w" data-a="site" data-path="hair-analysis">Hair &amp; scalp</button></div></div>
      ${camps.length ? `<div class="mx-h" style="margin-top:22px"><h2>From the clinic</h2></div><div class="mx-hscroll">${camps.map(c => `<article class="mx-camp"><span class="label">${esc(c.cat || "Campaign")}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.link ? `<button class="btn sm lime" data-a="site" data-path="${esc(c.link)}">${esc(c.cta || "Learn more")}</button>` : ""}</article>`).join("")}</div>` : ""}
      <div class="mx-h" style="margin-top:22px"><h2>Skin &amp; hair education</h2><button data-a="site" data-path="learn">All articles ${ic("arrow")}</button></div>
      <div class="mx-hscroll">${ARTICLES.slice(0, 6).map(a => `<button class="mx-card" data-a="site" data-path="learn/${a.id}"><span class="im">${phImg(artPhoto(a), "", 500)}</span><span class="bd"><span class="label">${esc(a.cat)}</span><h3>${esc(a.title)}</h3></span></button>`).join("")}</div>
      ${shopOn() ? `<button class="mx-row" style="margin-top:20px" data-a="site" data-path="shop"><span class="ic">${ic("bag")}</span><span class="grow"><b>Shop skincare</b><small>Products recommended by RADIANCE</small></span>${ic("chev")}</button>` : ""}
      <div class="mx-help" style="margin-top:20px"><div><b>Need help choosing a service?</b><p>Talk to the team. Not for emergencies.</p></div><div class="row"><a class="btn sm lime" href="tel:${esc(Clinic.c.info.phone.replace(/\s/g, ""))}">${ic("phone")} Call</a><a class="btn sm outline-w" href="https://wa.me/${esc(Clinic.c.info.whatsapp)}" target="_blank" rel="noopener">${ic("whatsapp")} WhatsApp</a></div></div>
      <div class="mx-list" style="margin-top:20px">${mxRow("info", "About RADIANCE", "Our story and values", 'data-a="site" data-path="about"')}${mxRow("pin", "Visit the clinic", esc(Clinic.c.info.address), 'data-a="site" data-path="contact"')}</div>` };
  },
  services: (id) => {
    if (id) return null;
    const list = pubServices(MX.sCat);
    return { title: "Services", head: "Our Services", hero: mxHero("Our Services", "Comprehensive dermatology and aesthetic treatments tailored to your unique needs.", "heroServices"),
      body: mxSeg("sCat", [["medical", "Medical Dermatology"], ["aesthetic", "Aesthetic Treatments"], ["hair", "Hair &amp; Scalp"]]) +
      (list.length ? `<div class="mx-grid">${list.map(mxSvcCard).join("")}</div>` : `<p class="muted">No services published in this area yet.</p>`) +
      `<div class="mx-help" style="margin-top:20px"><div><b>Not sure which service?</b><p>Book a general consultation and the clinic will guide you.</p></div><button class="btn sm lime" data-a="site" data-path="book">Book Appointment</button></div>` };
  },
  "hair-scalp": () => { MX.sCat = "hair"; return MXP.services(); },
  aesthetics: () => { MX.sCat = "aesthetic"; return MXP.services(); },
  gallery: () => {
    const isBA = MX.gTab === "ba";
    let body = mxSeg("gTab", [["ba", "Before &amp; After"], ["treat", "Treatment Gallery"]]);
    if (isBA) {
      const items = galleryItems().filter(g => MX.gCat === "All" || (MX.gCat === "Hair" ? /hair|scalp|alopecia/i.test(g.treatment + g.concern + g.title) : !/hair|scalp|alopecia/i.test(g.treatment + g.concern + g.title)));
      body += mxChips("gCat", ["All", "Skin", "Hair"]) + (items.length ? `<div class="mx-grid">${items.map(g => `<article class="mx-card mx-ba"><span class="pair"><img src="${g.before}" alt="Before: ${esc(g.title)}" loading="lazy"><img src="${g.after}" alt="After: ${esc(g.title)}" loading="lazy"></span><span class="bd"><h3>${esc(g.title)}</h3><p>${esc(g.treatment || "Before & after")}</p></span></article>`).join("")}</div><p class="muted small" style="margin-top:12px">Real patients, shown with written consent. Results vary from person to person.</p>` : baEmpty());
    } else {
      const map = { Face: "aesthetic", Skin: "medical", Hair: "hair" };
      const list = pubServices().filter(s => MX.tCat === "All" || s.cat === map[MX.tCat]);
      body += mxChips("tCat", ["All", "Face", "Skin", "Hair"]) + `<div class="mx-grid">${list.map(s => `<button class="mx-card" data-a="site" data-path="services/${s.id}"><span class="im">${phImg(svcPhoto(s), "", 500)}</span><span class="bd"><h3>${esc(s.name)}</h3><p>Treatment photo</p></span></button>`).join("")}</div><p class="muted small" style="margin-top:12px">Treatment photos show models, not patients.</p>`;
    }
    return { title: "Gallery", head: "Gallery", hero: mxHero("Our Gallery", "Real Results. Real People.", "heroGallery"), body };
  },
  results: () => { MX.gTab = "ba"; const v = MXP.gallery(); v.head = "Before & After"; return v; },
  "ai-analysis": () => {
    const on = Clinic.c.ai.skin;
    return { title: "AI skin analysis", head: "Skin Analysis", hero: mxHero("AI Skin Analysis", "Understand your skin. Get personalised recommendations.", "heroAI"),
      body: `<div class="mx-steps">${[["camera", "Take or upload a photo", "Lighting and focus are checked first"], ["face", "Analyse your skin type", "Built from your answers, not guessed from a photo"], ["search", "Identify concerns", "Visible features only, never a diagnosis"], ["leaf", "Get skincare guidance", "General tips, plus your clinician's care plan"]].map(([i, t, s]) => mxRow(i, t, s, "disabled", false)).join("")}</div>
      ${on ? `<button class="btn lime mx-cta" data-a="portal" data-page="skin" data-tab="scan">Start Analysis</button>` : `<div class="notice">${ic("info")}<div class="small">The clinic has switched skin photo analysis off for now. You can still keep photos and notes in the patient app.</div></div>`}
      <button class="mx-row" style="margin-top:14px" data-a="site" data-path="hair-analysis"><span class="ic">${ic("hair")}</span><span class="grow"><b>Hair &amp; scalp analysis</b><small>Density, texture and scalp condition</small></span>${ic("chev")}</button>${mxAiNote()}` };
  },
  "hair-analysis": () => {
    const on = Clinic.c.ai.hair;
    return { title: "Hair & scalp analysis", head: "Hair & Scalp", hero: mxHero("Hair &amp; Scalp Analysis", "Know your hair. Build a healthier scalp.", "heroHair"),
      body: `<div class="mx-steps">${[["hair", "Assess hair density & texture", "Record what you know and where it came from"], ["eye", "Check scalp condition", "Guided photos of hairline, parting and crown"], ["search", "Identify concerns", "Observations to discuss with your clinician"], ["coach", "Get personalised advice", "General guidance, never a diagnosis"]].map(([i, t, s]) => mxRow(i, t, s, "disabled", false)).join("")}</div>
      ${on ? `<button class="btn lime mx-cta" data-a="portal" data-page="hair" data-tab="scan">Start Assessment</button>` : `<div class="notice">${ic("info")}<div class="small">The clinic has switched hair photo analysis off for now.</div></div>`}
      <button class="mx-row" style="margin-top:14px" data-a="site" data-path="services/hair-loss"><span class="ic">${ic("calendar")}</span><span class="grow"><b>Book a hair loss assessment</b><small>The sooner it's checked, the better</small></span>${ic("chev")}</button>${mxAiNote()}` };
  },
  account: () => {
    const u = Backend.user, name = (u && (u.user_metadata?.name || S().profile.name)) || S().profile.name || "", initial = (name || "R").trim()[0].toUpperCase();
    return { title: "My account", head: "My Account", band: true,
      body: `<div class="mx-profile"><span class="mx-avatar">${name ? esc(initial) : ic("user")}</span><div class="grow"><b>${esc(name || (u ? u.email : "Guest"))}</b><small>${u ? esc(u.email) : Backend.configured ? "Not signed in" : "Your records stay on this phone"}</small></div>${u ? "" : `<button class="btn sm lime" data-a="site" data-path="signin">Sign in</button>`}</div>
      <div class="mx-menu" style="margin-top:16px">
        ${mxRow("user", "Profile information", "", 'data-a="portal" data-page="settings"')}
        ${mxRow("face", "Skin &amp; Hair Profiles", "", 'data-a="portal" data-page="skin"')}
        ${mxRow("calendar", "Appointments", mxBookings().length ? mxBookings().length + " booking" + (mxBookings().length === 1 ? "" : "s") : "", 'data-a="site" data-path="appointments"')}
        ${mxRow("pro", "Care plans", "From your clinician", 'data-a="portal" data-page="pro" data-tab="plans"')}
        ${shopOn() || myOrders().length ? mxRow("bag", "Order history", "", 'data-a="site" data-path="orders"') : ""}
        ${mxRow("bell", "Notifications", "", 'data-a="site" data-path="notifications"')}
        ${mxRow("coach", "Skin &amp; Hair Guide", "Ask questions about your routine", 'data-a="portal" data-page="coach"')}
        ${mxRow("moon", "Theme", esc(cap1(S().settings.theme)), 'data-a="sTheme"')}</div>
      <div class="mx-menu" style="margin-top:14px">
        ${mxRow("phone", "Contact the clinic", esc(Clinic.c.info.phone), 'data-a="site" data-path="contact"')}
        ${mxRow("learn", "Blog &amp; education", "", 'data-a="site" data-path="learn"')}
        ${mxRow("shield", "Privacy notice", "", 'data-a="site" data-path="privacy"')}
        ${mxRow("info", "AI limitations", "", 'data-a="site" data-path="ai-limits"')}
        ${mxRow("lock", "Staff sign-in", "Clinicians and clinic team", 'data-a="site" data-path="staff"')}
        ${u ? mxRow("logout", "Log out", "", 'data-a="signOut"', false) : ""}</div>
      <p class="muted small" style="text-align:center;margin:18px 0 4px">RADIANCE Dermatology &amp; Aesthetic Clinic · Not for emergencies</p>` };
  },
  signin: () => {
    const top = `<div class="mx-signin-logo"><img src="${LOGO_ICON}" alt=""><b>RADIANCE</b><small>Dermatology &amp; Aesthetic Clinic</small></div>`;
    if (Backend.user) return { title: "Signed in", head: "Sign in", band: true, body: top + `<div class="card stack" style="text-align:center"><span class="mx-success">${ic("check")}</span><h2>You're signed in</h2><p class="muted small">${esc(Backend.user.email)}</p><button class="btn lime mx-cta" data-a="site" data-path="account">Go to my account</button></div>` };
    if (!Backend.configured) return { title: "Sign in", head: "Sign in", band: true, body: top + `<div class="card stack"><h2>Welcome</h2>
      <div class="notice">${ic("shield")}<div class="small">Patient accounts switch on once the clinic connects its secure patient database. Until then, the patient app keeps your records <b>on this phone only</b>. Nobody else can see them.</div></div>
      <button class="btn lime mx-cta" data-a="portal" data-page="home">Open my patient app</button><button class="btn" data-a="site" data-path="book">Book an appointment instead</button></div>` };
    const f = (id, l, t, ac, ph) => `<label class="field" for="${id}"><span>${l}</span><input type="${t}" id="${id}" autocomplete="${ac}" placeholder="${ph}" required></label>`;
    return { title: "Sign in", head: "Sign in", band: true, body: top + `<div class="card stack">${!Backend.ready ? `<p class="muted"><span class="spinner" style="display:inline-block"></span> Connecting securely…</p>` : Backend.error ? `<div class="notice err">${ic("warn")}<span class="small">${esc(Backend.error)}</span></div>` : `
      <div><h2>${{ in: "Welcome Back", up: "Create your account", reset: "Reset your password" }[authMode]}</h2><p class="muted small">${{ in: "Sign in to your account", up: "Your records stay private to you", reset: "We'll email you a link" }[authMode]}</p></div>
      <form id="auth-form" class="stack">${authMode === "up" ? f("au-name", "Your name", "text", "name", "Your name") : ""}${f("au-email", "Email address", "email", "email", "Enter your email")}${authMode !== "reset" ? f("au-pass", authMode === "up" ? "Password (at least 8 characters)" : "Password", "password", authMode === "up" ? "new-password" : "current-password", "Enter your password") : ""}
        ${authMode === "in" ? `<button type="button" class="link-more" style="justify-self:end;font-size:.82rem" data-a="authMode" data-m="reset">Forgot password?</button>` : ""}
        ${authMode === "up" ? `<label class="row small" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" id="au-ok" required style="width:18px;height:18px;accent-color:var(--accent);flex:none;margin-top:2px"><span>I've read the privacy notice and understand AI observations aren't a diagnosis.</span></label>` : ""}
        ${authMsg ? `<div class="notice ${authMsg.ok ? "ok" : "err"} small">${esc(authMsg.text)}</div>` : ""}
        <button class="btn lime mx-cta" type="submit">${{ in: "Sign In", up: "Create Account", reset: "Send reset link" }[authMode]}</button></form>
      <p class="small" style="text-align:center">${authMode === "in" ? `Don't have an account? <button class="link-more" data-a="authMode" data-m="up">Sign Up</button>` : `<button class="link-more" data-a="authMode" data-m="in">I already have an account</button>`}</p>`}</div>` };
  },
  appointments: () => {
    const bk = mxBookings(), chip = { requested: "warn", confirmed: "ok", completed: "", cancelled: "err", "no-show": "err" }, t = dayKey();
    return { title: "Appointments", head: "Appointments", band: true, body: `<div class="mx-h"><h2>Your bookings</h2><button data-a="site" data-path="book">${ic("plus")} New</button></div>` +
      (bk.length ? `<div class="mx-list">${bk.map(b => `<div class="card"><div class="spread"><b>${esc(Clinic.type(b.typeId)?.name || "Appointment")}</b><span class="chip ${chip[b.status] || ""}">${esc(cap1(b.status))}</span></div>
        <p class="small muted" style="margin-top:6px">${b.date ? fmtDate(b.date, { weekday: "short", day: "numeric", month: "short" }) : "Date to be confirmed"}${b.time ? " · " + esc(b.time) : b.window ? " · " + esc(b.window) : ""} · Ref ${esc(b.ref)}</p>
        ${b.delivery === "device" ? `<p class="small" style="margin-top:6px;color:var(--amber)">Not sent to the clinic. Call ${esc(Clinic.c.info.phone)} to book.</p>` : ""}
        ${["requested", "confirmed"].includes(b.status) && (b.date || "9999") >= t ? `<button class="btn sm danger" style="margin-top:10px" data-a="patientCancel" data-id="${b.id}">Cancel</button>` : ""}</div>`).join("")}</div>`
      : `<div class="card stack" style="text-align:center"><span class="mx-avatar" style="margin:0 auto">${ic("calendar")}</span><p class="muted small">No bookings on this ${Backend.user ? "account" : "phone"} yet.</p><button class="btn lime" data-a="site" data-path="book">Book Appointment</button></div>`) +
      `<p class="muted small" style="margin-top:14px">${Backend.user ? "Status updates from the clinic appear here." : "Without a patient account, status changes the clinic makes aren't sent to this phone. The clinic will contact you directly."}</p>` };
  },
  notifications: () => {
    const n = mxNotifs(); setTimeout(() => lsSet(MXK.seen, nowISO()), 0);
    return { title: "Notifications", head: "Notifications", band: true, body: n.length ? `<div class="mx-list">${n.map(x => `<button class="mx-note" ${x.portal ? `data-a="portal" data-page="${x.portal[0]}" data-tab="${x.portal[1]}"` : x.path ? `data-a="site" data-path="${esc(x.path)}"` : "disabled"}><span class="ic">${ic(x.icon)}</span><span class="grow"><b>${esc(x.title)}</b><small>${esc(x.text)}</small></span><span class="when">${x.at ? fmtDate(x.at.slice(0, 10), { day: "numeric", month: "short" }) : ""}</span></button>`).join("")}</div>`
      : `<div class="card stack" style="text-align:center"><span class="mx-avatar" style="margin:0 auto">${ic("bell")}</span><p class="muted small">Nothing yet. Updates about your bookings${shopOn() ? ", orders" : ""} and care plans appear here.</p></div>` };
  },
  shop: () => {
    const list = shopProducts();
    return { title: "Shop", head: "Shop", hero: mxHero("Shop", "Skincare chosen by the RADIANCE team.", "tileProducts"),
      body: list.length ? `<div class="mx-grid">${list.map(p => { const q = Bag.items.find(i => i.id === p.id)?.qty || 0; return `<article class="mx-card"><span class="im">${p.image ? `<img src="${p.image}" alt="">` : `<img class="broken" src="${LOGO_ICON}" alt="">`}</span><span class="bd"><h3>${esc(p.name)}</h3>${p.description ? `<p>${esc(p.description)}</p>` : ""}<b class="small">${money(p.price)}</b>
        ${p.inStock === false ? `<span class="chip">Out of stock</span>` : q ? `<span class="mx-qty"><button data-a="mxQty" data-id="${p.id}" data-d="-1" aria-label="One less">${ic("minus")}</button><b>${q}</b><button data-a="mxQty" data-id="${p.id}" data-d="1" aria-label="One more">${ic("plus")}</button></span>` : `<button class="btn sm lime" data-a="mxQty" data-id="${p.id}" data-d="1">Add to bag</button>`}</span></article>`; }).join("")}</div>
        <p class="muted small" style="margin-top:14px">Ask your clinician before starting a new product, and patch test first.</p>`
      : `<div class="card stack" style="text-align:center"><span class="mx-avatar" style="margin:0 auto">${ic("bag")}</span><h3>The shop is coming soon</h3><p class="muted small">Ask about recommended products at your consultation.</p><button class="btn lime" data-a="site" data-path="book">Book Appointment</button></div>` };
  },
  bag: () => {
    const lines = Bag.lines();
    return { title: "Shopping bag", head: "Shopping Bag", band: true, body: lines.length ? `<div class="mx-list">${lines.map(l => `<div class="mx-line"><span class="im">${l.p.image ? `<img src="${l.p.image}" alt="">` : `<img class="broken" src="${LOGO_ICON}" alt="">`}</span><div class="grow"><b>${esc(l.p.name)}</b><small>${money(l.p.price)}</small>
        <span class="mx-qty"><button data-a="mxQty" data-id="${l.id}" data-d="-1" aria-label="One less">${ic("minus")}</button><b>${l.qty}</b><button data-a="mxQty" data-id="${l.id}" data-d="1" aria-label="One more">${ic("plus")}</button></span></div><button class="mx-ib" style="color:var(--muted)" data-a="mxQty" data-id="${l.id}" data-d="-99" aria-label="Remove">${ic("trash")}</button></div>`).join("")}</div>
      <dl class="mx-sum"><dt>Subtotal</dt><dd>${money(Bag.total())}</dd></dl><button class="btn lime mx-cta" data-a="site" data-path="checkout">Proceed to Checkout</button>`
      : `<div class="card stack" style="text-align:center"><span class="mx-avatar" style="margin:0 auto">${ic("bag")}</span><p class="muted small">Your bag is empty.</p>${shopOn() ? `<button class="btn lime" data-a="site" data-path="shop">Browse the shop</button>` : ""}</div>` };
  },
  checkout: () => {
    const lines = Bag.lines(), c = MX.co, e = MX.coErr;
    if (!lines.length) return MXP.bag();
    const f = (id, k, l, t, ac, ph) => `<label class="field" for="co-${id}"><span>${l}</span><input type="${t}" id="co-${id}" value="${esc(c[k] || "")}" autocomplete="${ac}" placeholder="${ph}" ${e[k] ? 'aria-invalid="true"' : ""}>${e[k] ? `<span class="err-text">${e[k]}</span>` : ""}</label>`;
    return { title: "Checkout", head: "Checkout", band: true, body: `
      <div class="mx-steps-bar"><span class="on">1 Contact</span><span class="on">2 Delivery</span><span class="on">3 Review</span></div>
      <h3 class="mx-sub">Contact information</h3><div class="stack">${f("name", "name", "Full name *", "text", "name", "Your name")}${f("phone", "phone", "Phone *", "tel", "tel", "+232 …")}${f("email", "email", "Email (optional)", "email", "email", "you@example.com")}</div>
      <h3 class="mx-sub">Delivery method</h3><div class="mx-list">
        <button class="mx-row" data-a="mxSetCo" data-k="method" data-v="collect" aria-pressed="${c.method === "collect"}"><span class="ic">${ic("pin")}</span><span class="grow"><b>${esc(Clinic.c.shop?.collect || "Collect at the clinic")}</b><small>${esc(Clinic.c.info.address)}</small></span>${c.method === "collect" ? ic("check") : ""}</button>
        <button class="mx-row" data-a="mxSetCo" data-k="method" data-v="deliver" aria-pressed="${c.method === "deliver"}"><span class="ic">${ic("truck")}</span><span class="grow"><b>Delivery request</b><small>${esc(Clinic.c.shop?.deliveryNote || "")}</small></span>${c.method === "deliver" ? ic("check") : ""}</button></div>
      ${c.method === "deliver" ? `<label class="field" for="co-address" style="margin-top:12px"><span>Delivery address *</span><textarea id="co-address" ${e.address ? 'aria-invalid="true"' : ""} placeholder="Street, area, landmark">${esc(c.address || "")}</textarea>${e.address ? `<span class="err-text">${e.address}</span>` : ""}</label>` : ""}
      <label class="field" for="co-notes" style="margin-top:12px"><span>Notes (optional)</span><textarea id="co-notes" placeholder="Anything the clinic should know">${esc(c.notes || "")}</textarea></label>
      <h3 class="mx-sub">Order summary</h3><div class="card"><dl class="mx-sum" style="margin:0">${lines.map(l => `<dt>${esc(l.p.name)} × ${l.qty}</dt><dd>${money(l.p.price * l.qty)}</dd>`).join("")}<dt><b>Subtotal</b></dt><dd><b>${money(Bag.total())}</b></dd><dt>Delivery</dt><dd>${c.method === "deliver" ? "Confirmed by the clinic" : "Free (collection)"}</dd></dl></div>
      <div class="notice" style="margin-top:12px">${ic("info")}<div class="small">This is an order request, not a payment. The clinic will contact you to confirm stock, the final total and how to pay. Nothing is charged in the app.</div></div>
      ${e.submit ? `<div class="notice err" style="margin-top:10px">${ic("warn")}<div class="small">${e.submit}</div></div>` : ""}
      <button class="btn lime mx-cta" style="margin-top:14px" data-a="mxOrder" ${MX.coBusy ? "disabled" : ""}>${MX.coBusy ? `<span class="spinner"></span> Sending…` : "Send order request"}</button>` };
  },
  order: (ref) => {
    const o = myOrders().find(x => x.ref === ref); if (!o) return MXP.orders();
    const sent = o.delivery === "sent";
    return { title: "Order", head: "Order Confirmation", band: true, body: `<div class="card stack" style="text-align:center"><span class="mx-success" style="${sent ? "" : "background:var(--amber)"}">${ic(sent ? "check" : "warn")}</span>
      <h2>${sent ? "Thank you!" : "Not sent yet"}</h2><p class="small muted">${sent ? "Your order request has reached the clinic. RADIANCE will contact you to confirm stock, the total and payment." : `This copy of the app couldn't reach the clinic. Please call <b>${esc(Clinic.c.info.phone)}</b> or WhatsApp the clinic with your order number.`}</p>
      <p class="mono">Order #${esc(o.ref)}</p></div>
      <h3 class="mx-sub">Order summary</h3><div class="card"><dl class="mx-sum" style="margin:0">${o.items.map(i => `<dt>${esc(i.name)} × ${i.qty}</dt><dd>${money(i.price * i.qty)}</dd>`).join("")}<dt><b>Subtotal</b></dt><dd><b>${money(o.subtotal)}</b></dd><dt>${o.method === "deliver" ? "Delivery" : "Collection"}</dt><dd>${o.method === "deliver" ? "Cost confirmed by the clinic" : "At the clinic"}</dd></dl></div>
      ${sent ? "" : `<a class="btn mx-cta" style="margin-top:12px" href="${waLink(`Hello RADIANCE, I'd like to order (ref ${o.ref}): ${o.items.map(i => i.qty + " x " + i.name).join(", ")}`)}" target="_blank" rel="noopener">${ic("whatsapp")} Send on WhatsApp</a>`}
      <button class="btn lime mx-cta" style="margin-top:12px" data-a="site" data-path="orders">View order history</button><button class="btn mx-cta" style="margin-top:8px" data-a="site" data-path="">Back to Home</button>` };
  },
  orders: () => {
    const o = myOrders();
    return { title: "Orders", head: "Order History", band: true, body: o.length ? `<div class="mx-list">${o.map(x => mxRow("bag", "Order #" + esc(x.ref), `${fmtDate(x.at.slice(0, 10))} · ${money(x.subtotal)} · ${x.delivery === "sent" ? "Sent to clinic" : "Not sent"}`, `data-a="site" data-path="order/${esc(x.ref)}"`)).join("")}</div>`
      : `<div class="card stack" style="text-align:center"><p class="muted small">No orders on this phone yet.</p>${shopOn() ? `<button class="btn lime" data-a="site" data-path="shop">Browse the shop</button>` : ""}</div>` };
  }
};
const MX_HEAD = { book: "Book Appointment", contact: "Contact Us", about: "About Us", learn: "Blog", specialists: "Specialists" };

/* ---------- shell ---------- */
let mxScrollBound = false, mxSplashDone = false;
function renderMobile() {
  applyTheme();
  if (BK.result?.ref && !myRefs().includes(BK.result.ref)) lsSet(MXK.mine, [BK.result.ref, ...myRefs()].slice(0, 50));
  const app = $("#app"); app.className = "site mx";
  const parts = SR.path.split("/"), route = parts[0], arg = parts.slice(1).join("/");
  const v = (MXP[route] && MXP[route](arg)) || mxGeneric(route, arg);
  const top = MX_TOP.includes(route) && !arg, tab = MX_TAB_OF[route] ?? (MX_TOP.includes(route) ? route : null);
  const head = MX_HEAD[route] || v.head;
  document.title = (v.title ? v.title + " · " : "") + "RADIANCE";
  const unread = mxUnread(), bagN = Bag.count(), i = Clinic.c.info;
  app.innerHTML = `<a class="sr" href="#main">Skip to content</a>
  <header class="mx-head ${v.hero ? "over" : "solid"}" id="mx-head">
    ${top ? `<button class="mx-ib" data-a="menu" aria-label="Open menu" aria-expanded="${SR.menu}">${ic("menu")}</button>` : `<button class="mx-ib" data-a="mxBack" aria-label="Back">${ic("back")}</button>`}
    ${route === "" ? `<button class="mx-brand" data-a="site" data-path="" aria-label="RADIANCE home">${mxMark()}<span><b>RADIANCE</b><small>Dermatology &amp; Aesthetic Clinic</small></span></button>` : `<span class="mx-title">${mxMark(22)}<b>${esc(head || "RADIANCE")}</b></span>`}
    <span class="mx-acts"><button class="mx-ib" data-a="site" data-path="notifications" aria-label="Notifications${unread ? ", " + unread + " new" : ""}">${ic("bell")}${unread ? `<span class="dot"></span>` : ""}</button>
    ${shopOn() || bagN ? `<button class="mx-ib" data-a="site" data-path="bag" aria-label="Shopping bag, ${bagN} item${bagN === 1 ? "" : "s"}">${ic("bag")}${bagN ? `<span class="badge">${bagN}</span>` : ""}</button>` : ""}</span></header>
  <main class="mx-main" id="main" tabindex="-1">${v.hero || ""}<div class="mx-sheet ${v.hero ? "" : "flat"}">${v.body}</div></main>
  <nav class="mx-tabs" aria-label="App">${MX_TABS.map(([p, l, icn]) => `<button data-a="mxTab" data-path="${p}" ${tab === p ? 'aria-current="page"' : ""}>${ic(icn)}<span>${l}</span></button>`).join("")}</nav>
  ${SR.menu ? `<div class="mx-drawer" role="dialog" aria-modal="true" aria-label="Menu"><button class="mx-scrim" data-a="menu" aria-label="Close menu"></button><div class="mx-panel">
    <div class="spread" style="margin-bottom:14px"><span class="mx-title" style="color:var(--heading)">${mxMark(24)}<b>RADIANCE</b></span><button class="mx-ib" style="color:var(--fg)" data-a="menu" aria-label="Close menu">${ic("x")}</button></div>
    <nav class="mx-dnav">${[["", "Home", "home"], ["about", "About Us", "info"], ["services", "Services", "grid"], ["ai-analysis", "AI Skin Analysis", "camera"], ["hair-analysis", "Hair & Scalp Analysis", "hair"], ["gallery", "Gallery", "image"], ["results", "Before & After", "eye"], ["learn", "Blog", "learn"], ...(shopOn() ? [["shop", "Shop", "bag"]] : []), ["contact", "Contact Us", "phone"], ["book", "Book Appointment", "calendar"]].map(([p, l, icn]) => `<button data-a="site" data-path="${p}">${ic(icn)}${esc(l)}</button>`).join("")}
      <button data-a="portal">${ic("face")}Patient app</button><button data-a="site" data-path="staff">${ic("lock")}Staff sign-in</button></nav>
    <p class="small muted" style="margin-top:16px">${esc(i.address)}<br>${esc(i.phone)} · ${esc(i.email)}</p></div></div>` : ""}`;
  afterRender.forEach(f => f()); afterRender.length = 0;
  if (!mxScrollBound) { mxScrollBound = true; addEventListener("scroll", () => { const h = $("#mx-head"); if (h && h.classList.contains("over")) h.classList.toggle("scrolled", scrollY > 40); }, { passive: true }); }
  mxSplash();
}
function mxSplash() {
  if (mxSplashDone) return; mxSplashDone = true;
  if (!IS_NATIVE) return;
  try { if (sessionStorage.getItem("radiance:splash")) return; sessionStorage.setItem("radiance:splash", "1"); } catch (e) {}
  const d = document.createElement("div"); d.className = "mx-splash"; d.setAttribute("aria-hidden", "true");
  d.innerHTML = `<div class="lg"><img src="${LOGO_ICON}" alt=""><b>RADIANCE</b><small>Dermatology &amp; Aesthetic Clinic</small></div><span class="bar"><i></i></span>`;
  document.body.appendChild(d); setTimeout(() => d.classList.add("out"), 1300); setTimeout(() => d.remove(), 1800);
}

/* Phones get the app layout; desktops keep the full website. */
const _renderSiteDesktop = renderSite;
renderSite = function () { return appMode() ? renderMobile() : _renderSiteDesktop(); };

Object.assign(ACTIONS, {
  mxTab: el => { if (el.dataset.path === "book" && BK.result) bkReset(); nav(el.dataset.path); },
  mxBack: () => { if (history.length > 1) history.back(); else nav(""); },
  mxSet: el => { MX[el.dataset.k] = el.dataset.v; const y = scrollY; render(); scrollTo(0, y); },
  mxSvc: el => { MX.sCat = el.dataset.c; nav("services"); },
  mxQty: el => { const id = el.dataset.id, d = +el.dataset.d, q = (Bag.items.find(i => i.id === id)?.qty || 0) + d; Bag.set(id, d === -99 ? 0 : q); if (d > 0 && q === 1) toast("Added to bag"); const y = scrollY; render(); scrollTo(0, y); },
  mxSetCo: el => { mxCoCollect(); MX.co[el.dataset.k] = el.dataset.v; const y = scrollY; render(); scrollTo(0, y); },
  mxOrder: async () => {
    mxCoCollect(); const c = MX.co, e = {};
    if (!c.name) e.name = "Enter your name."; if (!/^\+?[\d\s()-]{7,}$/.test(c.phone || "")) e.phone = "Enter a phone number the clinic can call.";
    if (c.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) e.email = "Check the email address."; if (c.method === "deliver" && !(c.address || "").trim()) e.address = "Enter where to deliver.";
    MX.coErr = e; if (Object.keys(e).length) { render(); $("[aria-invalid=true]")?.focus(); return; }
    MX.coBusy = true; render();
    const lines = Bag.lines(), o = { id: uid(), ref: "RDC-" + Math.random().toString(36).slice(2, 7).toUpperCase(), at: nowISO(), items: lines.map(l => ({ id: l.id, name: l.p.name, price: Number(l.p.price), qty: l.qty })), subtotal: Bag.total(), currency: Clinic.c.shop?.currency || "Le",
      name: c.name, phone: c.phone, email: c.email || "", method: c.method, address: c.method === "deliver" ? c.address : "", notes: c.notes || "", status: "requested", delivery: "device" };
    try { if (Forms.available) { await Forms.send("shop-order", { ref: o.ref, name: o.name, phone: o.phone, email: o.email, method: o.method === "deliver" ? "Delivery request" : "Collect at clinic", address: o.address, items: o.items.map(i => `${i.qty} x ${i.name} (${money(i.price)})`).join("\n"), subtotal: money(o.subtotal), notes: o.notes }); o.delivery = "sent"; } }
    catch (x) { o.delivery = "device"; }
    lsSet(MXK.orders, [o, ...myOrders()].slice(0, 100)); Clinic.ops.orders = [o, ...(Clinic.ops.orders || [])]; Clinic.saveOps();
    Bag.items = []; Bag.save(); MX.coBusy = false; MX.coErr = {}; nav("order/" + o.ref);
  }
});
function mxCoCollect() { const v = id => $("#co-" + id)?.value; ["name", "phone", "email", "address", "notes"].forEach(k => { const x = v(k); if (x != null) MX.co[k] = x.trim(); }); }
document.addEventListener("input", e => { const t = e.target; if (!t.id?.startsWith("co-") || t.getAttribute("aria-invalid") !== "true") return; t.removeAttribute("aria-invalid"); t.parentElement.querySelector(".err-text")?.remove(); delete MX.coErr[t.id.slice(3)]; });
