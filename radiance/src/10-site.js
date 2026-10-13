
/* ============================================================
   PUBLIC CLINIC WEBSITE (layout follows the clinic's approved reference design)
   Routes: #/ · about · services · services/<id> · hair-scalp · aesthetics · ai-analysis · gallery · results ·
           specialists · learn · learn/<id> · contact · book · privacy · ai-limits · terms · accessibility
   ============================================================ */
const SR = { path: "", menu: false, svcCat: "all", learnCat: "All", staffPage: "overview", gTreat: "", gConcern: "", gQ: "" };
function nav(path = "") {
  if (path === "portal") { closeModal(); SURFACE = "app"; setHash("app/" + R.page); render(); window.scrollTo(0, 0); return; }
  if (path === "staff") { closeModal(); SURFACE = "staff"; setHash("staff/" + SR.staffPage); render(); window.scrollTo(0, 0); return; }
  SURFACE = "site"; SR.path = path; SR.menu = false; closeModal(); setHash("/" + path); render(); window.scrollTo(0, 0);
  const m = $("#main"); if (m) m.focus({ preventScroll: true });
}
Object.assign(ACTIONS, {
  site: el => nav(el.dataset.path || ""),
  portal: el => { if (el.dataset.page) R = { page: el.dataset.page, tab: el.dataset.tab || null, id: null }; nav("portal"); },
  menu: () => { SR.menu = !SR.menu; render(); },
  svcCat: el => { SR.svcCat = el.dataset.c; render(); },
  sLearnCat: el => { SR.learnCat = el.dataset.c; render(); },
  cookies: () => openModal(`<div class="spread"><h3>Cookies and storage</h3><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    <p style="margin-top:10px">This website doesn't use advertising or tracking cookies. It stores only what it needs to work in your browser: your theme, any booking you make, and, if you use the patient app on this device, your own records.</p>
    <p class="muted small" style="margin-top:10px">There's nothing to switch off. To remove everything stored by this site, clear this site's data in your browser settings.</p>`),
  sTheme: () => { const o = ["system", "light", "dark"]; const s = S().settings; s.theme = o[(o.indexOf(s.theme) + 1) % 3]; Store.save(); toast("Theme: " + s.theme); render(); }
});
document.addEventListener("change", e => {
  if (e.target.id === "g-treat") { SR.gTreat = e.target.value; render(); }
  if (e.target.id === "g-concern") { SR.gConcern = e.target.value; render(); }
});
document.addEventListener("input", e => { if (e.target.id === "g-q") { SR.gQ = e.target.value; const pos = e.target.selectionStart; render(); const n = $("#g-q"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });

const NAV_SITE = [["", "Home"], ["about", "About"], ["services", "Services"], ["ai-analysis", "AI Analysis"], ["gallery", "Gallery"], ["learn", "Blog"], ["contact", "Contact"]];
const NAV_GROUP = { "hair-scalp": "services", aesthetics: "services", results: "gallery", specialists: "about" };
const pubServices = (cat) => Clinic.c.services.filter(s => s.published && (!cat || cat === "all" || s.cat === cat));
const contactStrip = () => { const i = Clinic.c.info; return `<div class="contact-strip"><div><b>Location</b>${esc(i.address.split(",")[0])}</div><div><b>Email</b>${esc(i.email)}</div><div><b>Contact</b>${esc(i.phone)}</div></div>`; };
/* Photo slot: licensed stock or a clinic upload; falls back to the logo on a teal ground if it can't load. */
const phImg = (key, alt = "", w = 900, eager = false) => { const src = Clinic.photo(key, w); return src ? `<img class="ph-img" src="${src}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} onerror="this.onerror=null;this.src=LOGO_ICON;this.classList.add('broken')">` : `<img class="ph-img broken" src="${LOGO_ICON}" alt="">`; };
const svcPhoto = s => Clinic.c.photos["svc-" + s.id] || CLINIC_DEFAULTS.photos["svc-" + s.id] ? "svc-" + s.id : s.cat === "hair" ? "heroHair" : s.cat === "aesthetic" ? "heroAesthetic" : "heroServices";
const artPhoto = a => Clinic.c.photos["art-" + a.id] ? "art-" + a.id : /hair|alopecia|scalp|porosity|density/i.test(a.cat + a.title) ? "art-hair" : /sun/i.test(a.cat) ? "art-sun" : /spot|acne|tone/i.test(a.cat) ? "art-acne" : /skin/i.test(a.cat) ? "art-skin" : "art-general";
const readMins = a => Math.max(2, Math.round(a.body.join(" ").split(/\s+/).length / 200));

function renderSite() {
  applyTheme();
  const app = $("#app"); app.className = "site";
  const route = SR.path.split("/")[0], arg = SR.path.split("/")[1];
  const page = (SITE[route] || SITE.__404)(arg);
  document.title = (page.title ? page.title + " · " : "") + "RADIANCE Dermatology & Aesthetics Clinic";
  const a = Clinic.c.announcement, cur = NAV_GROUP[route] ?? route;
  const header = `<header class="s-head on-dark"><div class="wrap">
    <button class="brand-btn" style="padding:0" data-a="site" data-path="" aria-label="RADIANCE home">${brandLockup()}</button>
    <nav class="s-nav" aria-label="Main">${NAV_SITE.map(([p, l]) => `<button data-a="site" data-path="${p}" ${cur === p ? 'aria-current="page"' : ""}>${l}</button>`).join("")}</nav>
    <div class="s-cta"><button class="portal-link hide-m" data-a="portal">${ic("users")} Patient portal</button><button class="btn sm green" data-a="site" data-path="book">Book Appointment</button>
      <button class="icon-btn burger" data-a="menu" aria-label="Open menu" aria-expanded="${SR.menu}">${ic("menu")}</button></div>
  </div></header>`;
  const html = page.html.includes("<!--HDR-->") ? page.html.replace("<!--HDR-->", header) : header.replace('class="s-head on-dark"', 'class="s-head on-dark solid"') + page.html;
  app.innerHTML = `
  <a class="sr" href="#main">Skip to content</a>
  ${a.on && a.text ? `<div class="ann"><div class="wrap"><span>${esc(a.text)}</span>${a.link ? `<button data-a="site" data-path="${esc(a.link)}">${esc(a.linkLabel || "Learn more")}</button>` : ""}</div></div>` : ""}
  <main class="s-main" id="main" tabindex="-1">${html}</main>
  ${siteFooter()}
  ${SR.menu ? `<div class="m-menu" role="dialog" aria-label="Menu"><div class="spread">${brandLockup()}<button class="icon-btn" data-a="menu" aria-label="Close menu">${ic("x")}</button></div>
    <nav>${NAV_SITE.map(([p, l]) => `<button data-a="site" data-path="${p}">${l}</button>`).join("")}<button data-a="site" data-path="hair-scalp">Hair &amp; Scalp</button><button data-a="site" data-path="aesthetics">Aesthetics</button><button data-a="site" data-path="specialists">Specialists</button><button data-a="portal">Patient portal</button></nav>
    <div class="stack" style="margin-top:18px"><button class="btn green lg" data-a="site" data-path="book">Book Appointment</button><p class="small muted">${esc(Clinic.c.info.phone)} · ${esc(Clinic.c.info.email)}</p></div></div>` : ""}`;
  afterRender.forEach(f => f()); afterRender.length = 0;
}

function siteFooter() {
  const i = Clinic.c.info;
  return `<footer class="s-foot on-dark"><div class="wrap">
    <div class="stack" style="gap:14px">${brandLockup()}
      <p class="small">${esc(i.address)}<br>${esc(i.phone)} · ${esc(i.email)}</p>
      <p class="small">${i.hours.length ? i.hours.map(h => `${esc(h.days)}: ${esc(h.time)}`).join("<br>") : "Opening hours: please call to confirm."}</p></div>
    <div><h4>Services</h4><button data-a="site" data-path="services">Medical dermatology</button><button data-a="site" data-path="aesthetics">Aesthetic treatments</button><button data-a="site" data-path="hair-scalp">Hair &amp; scalp care</button><button data-a="site" data-path="ai-analysis">AI skin &amp; hair analysis</button><button data-a="site" data-path="gallery">Gallery</button></div>
    <div><h4>Patients</h4><button data-a="site" data-path="book">Book an appointment</button><button data-a="portal">Patient portal</button><button data-a="site" data-path="learn">Blog &amp; education</button><button data-a="site" data-path="specialists">Our specialists</button><button data-a="site" data-path="contact">Contact</button></div>
    <div><h4>Information</h4><button data-a="site" data-path="privacy">Privacy notice</button><button data-a="site" data-path="ai-limits">AI limitations</button><button data-a="site" data-path="terms">Terms of use</button><button data-a="site" data-path="accessibility">Accessibility</button><button data-a="cookies">Cookie preferences</button><button data-a="sTheme">Theme: ${esc(S().settings.theme)}</button><button data-a="site" data-path="staff">Staff sign-in</button></div>
  </div><div class="wrap legal"><span>© ${new Date().getFullYear()} RADIANCE Dermatology &amp; Aesthetics Clinic. All rights reserved. Not for emergencies.</span>
    <span class="socials"><a href="https://instagram.com/${esc(i.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${IG_ICON}</a><a href="https://wa.me/${esc(i.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic("whatsapp")}</a><a href="mailto:${esc(i.email)}" aria-label="Email">${ic("mail")}</a></span></div></footer>`;
}
const IG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>`;

/* ---------- building blocks ---------- */
const svcCard = s => `<button class="pcard reveal" data-a="site" data-path="services/${s.id}"><div class="im">${phImg(svcPhoto(s), "", 600)}</div><div class="bd"><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="more">Learn More</span></div></button>`;
const artCard = a => `<button class="art" data-a="site" data-path="learn/${a.id}"><div class="im">${phImg(artPhoto(a), "", 600)}</div><div class="bd"><span class="cat">${esc(a.cat)}</span><h3>${esc(a.title)}</h3><p class="muted small">${esc(a.summary)}</p></div></button>`;
const campCard = c => `<article class="camp"><span class="tagc">${esc(c.cat || "Campaign")}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.link ? `<button class="btn white sm" style="align-self:flex-start" data-a="site" data-path="${esc(c.link)}">${esc(c.cta || "Learn more")}</button>` : ""}${contactStrip()}</article>`;
const pageHero = (crumb, title, text, photo = "heroServices") => `<section class="p-hero"><div class="bg">${phImg(photo, "", 1600, true)}</div><!--HDR--><div class="wrap hero-in"><h1>${title}</h1>${text ? `<p class="sub">${text}</p>` : ""}
  <div class="crumbs"><button data-a="site" data-path="">Home</button>${crumb.map(([p, l]) => ` / ${p === null ? `<span>${esc(l)}</span>` : `<button data-a="site" data-path="${p}">${esc(l)}</button>`}`).join("")}</div></div></section>`;
const ctaPhoto = (title, sub, photo, label = "Book Appointment", path = "book") => `<section class="sec tight"><div class="wrap"><div class="cta-photo"><div class="im">${phImg(photo, "", 900)}</div><div class="tx"><h2>${title}</h2><p>${sub}</p><button class="btn green" data-a="site" data-path="${path}">${label}</button></div></div></div></section>`;
const ctaStrip = (title, sub, label = "Book Appointment", path = "book") => `<section class="sec tight"><div class="wrap"><div class="cta-strip"><div><h3>${title}</h3><p>${sub}</p></div><button class="btn green" data-a="site" data-path="${path}">${label}</button></div></div></section>`;
const bookBand = (title = "Ready to talk to the team?", sub = "Book a consultation and the clinic will confirm your appointment.") => ctaStrip(title, sub);
const teamNotice = () => `<div class="card" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center"><span style="width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:var(--sage-soft);color:var(--accent)">${ic("users")}</span><div><h3>Clinical team profiles are being prepared</h3><p class="muted small" style="margin-top:6px">Profiles appear here once the clinic has verified each clinician's name, qualifications and registration. Until then, the clinic will tell you who you'll be seeing when your appointment is confirmed.</p></div></div>`;
const svcSection = (cat, title) => pubServices(cat).length ? `<div><div class="sec-h" style="margin-bottom:14px"><h2>${title}</h2></div><div class="pc-grid">${pubServices(cat).map(svcCard).join("")}</div></div>` : "";
const baCard = g => `<article class="ba"><div class="pair"><img src="${g.before}" alt="Before: ${esc(g.title)}" loading="lazy"><img src="${g.after}" alt="After: ${esc(g.title)}" loading="lazy"></div><div class="bd"><div><b>${esc(g.title)}</b><br><span class="muted">${esc(g.treatment || "Before & after")}</span></div><span class="muted">${esc(g.duration || "")}</span></div></article>`;
const baEmpty = () => `<div class="ba-empty"><span class="ic">${ic("shield")}</span><div><h3>Patient results are added with consent</h3><p class="muted small" style="margin-top:6px">RADIANCE only shows real patients' before-and-after photos, and only with each patient's written permission. Results vary from person to person, and photos don't promise an outcome. Ask to see examples at your consultation.</p></div></div>`;
const galleryItems = () => Clinic.c.gallery.filter(g => g.published && g.consent && g.before && g.after);

const SITE = {
  "": () => {
    const h = Clinic.c.hero, camps = Clinic.liveCampaigns();
    const featured = ["general", "aesthetic", "pigmentation", "hair-loss"].map(id => Clinic.svc(id)).filter(s => s && s.published);
    const label = { general: "Medical Dermatology", aesthetic: "Aesthetic Treatments", pigmentation: "Skin Rejuvenation", "hair-loss": "Hair & Scalp Care" };
    return { title: "", html: `
    <section class="p-hero home-hero"><div class="bg">${h.image ? `<img class="ph-img" src="${h.image}" alt="">` : phImg("heroHome", "", 1800, true)}</div><!--HDR-->
      <div class="wrap hero-in"><div>
        <div class="big-logo"><span class="mark"><img src="${LOGO_ICON}" alt=""></span><b>RADIANCE</b><small>Dermatology &amp; Aesthetic Clinic</small></div>
        <h1>${esc(h.title)}</h1><p class="sub">${esc(h.text)}</p>
        <div class="row"><button class="btn green lg" data-a="site" data-path="book">Book Appointment</button><button class="btn outline-w lg" data-a="site" data-path="services">Explore Services</button></div>
        <p style="margin-top:14px"><button class="link-more" style="color:#fff" data-a="site" data-path="ai-analysis">Try AI skin &amp; hair analysis ${ic("arrow")}</button></p></div><div></div></div></section>
    <section class="sec tight" style="border-bottom:1px solid var(--line)"><div class="wrap"><div class="hl-row">${Clinic.c.highlights.map(x => `<div><span class="ic">${ic(x.icon)}</span><b>${esc(x.title)}</b><span>${esc(x.text)}</span></div>`).join("")}</div></div></section>
    <section class="sec"><div class="wrap"><div class="sec-h"><h2>Our Featured Services</h2><button class="link-more" data-a="site" data-path="services">View All Services ${ic("arrow")}</button></div>
      <div class="pc-grid">${featured.map(s => svcCard({ ...s, name: label[s.id] || s.name })).join("")}</div></div></section>
    ${ctaPhoto("Your Skin Deserves<br>The Best Care", "Book your consultation today and take the first step towards healthier, brighter skin.", "ctaHome")}
    <section class="sec tint"><div class="wrap">
      <div class="sec-h"><div><div class="eyebrow">AI-assisted skin &amp; hair analysis</div><h2>Understand your skin and hair between visits</h2><p>Explore the tools freely. Saving assessments and building your history needs the patient app.</p></div></div>
      <div class="ai-split">
        <div class="ai-panel skin"><span class="scan-line" aria-hidden="true"></span><div class="eyebrow">Skin analysis</div><h3>Guided face photos and visible-skin observations</h3>
          <ul><li>Lighting and focus checked on your phone before anything is analysed</li><li>Observations of visible features, never a diagnosis</li><li>Track changes over time and share chosen photos with your clinician</li></ul>
          <button class="btn white" style="align-self:flex-start;margin-top:auto" data-a="portal" data-page="skin" data-tab="scan">Analyse My Skin</button></div>
        <div class="ai-panel hair"><span class="scan-line" aria-hidden="true"></span><div class="eyebrow">Hair &amp; scalp</div><h3>Hairline, parting and scalp documentation</h3>
          <ul><li>Record porosity, density, strand thickness and pattern, with where each answer came from</li><li>Guided photos of hairline, temples, crown and scalp</li><li>A history to bring to a hair loss assessment</li></ul>
          <button class="btn white" style="align-self:flex-start;margin-top:auto" data-a="portal" data-page="hair" data-tab="id">Explore My Hair Profile</button></div></div>
      <p class="ai-note">${ic("info")} AI observations are informational. They can be wrong, they can't confirm a medical diagnosis, and they never replace an examination by a RADIANCE clinician. <button class="link-more" data-a="site" data-path="ai-limits">What the AI can't do</button></p>
    </div></section>
    ${camps.length ? `<section class="sec"><div class="wrap"><div class="sec-h"><h2>Awareness &amp; Campaigns</h2></div><div class="camp-grid">${camps.map(campCard).join("")}</div></div></section>` : ""}
    <section class="sec ${camps.length ? "tint" : ""}"><div class="wrap"><div class="sec-h"><h2>Health &amp; Skin Education</h2><button class="link-more" data-a="site" data-path="learn">Browse All Articles ${ic("arrow")}</button></div>
      <div class="art-grid">${ARTICLES.slice(0, 3).map(artCard).join("")}</div></div></section>` };
  },
  about: () => {
    const ab = Clinic.c.about;
    return { title: "About", html: pageHero([[null, "About"]], "About Us", "Dedicated to your skin health &amp; beauty", "heroAbout") + `
    <section class="sec"><div class="wrap story"><div><h2>Our Story</h2>${ab.story.split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join("")}<button class="btn primary" data-a="site" data-path="specialists">Meet Our Team</button></div>
      <div class="im">${phImg("aboutStory", "RADIANCE clinic", 900)}</div></div></section>
    <section class="sec tight"><div class="wrap"><div class="sec-h" style="margin-bottom:24px"><h2>Our Values</h2></div><div class="values">${ab.values.map(v => `<div><span class="ic">${ic(v.icon)}</span><b>${esc(v.title)}</b><span>${esc(v.text)}</span></div>`).join("")}</div></div></section>
    <section class="sec"><div class="wrap"><div class="quote-band"><div class="bg">${phImg("aboutQuote", "", 1400)}</div><div>${ic("leaf")}<q>${esc(ab.quote)}</q><p>${esc(ab.quoteSub)}</p></div></div></div></section>` };
  },
  services: (id) => {
    if (id) { const s = Clinic.svc(id); if (!s || !s.published) return SITE.__404(); return serviceDetail(s); }
    return { title: "Our services", html: pageHero([[null, "Services"]], "Our Services", "Comprehensive dermatology and aesthetic treatments tailored to your unique needs.", "heroServices") + `
      <section class="sec"><div class="wrap stack" style="gap:40px">${svcSection("medical", "Medical Dermatology")}${svcSection("aesthetic", "Aesthetic Treatments")}${svcSection("hair", "Hair &amp; Scalp Care")}
      <p class="muted small">Every treatment starts with a consultation. Suitability, risks and alternatives are discussed before anything is done, and results vary from person to person.</p></div></section>
      ${ctaStrip("Not sure which treatment is right for you?", "Book a consultation with our team and get personalised recommendations.")}` };
  },
  "hair-scalp": () => ({ title: "Hair & scalp", html: pageHero([["services", "Services"], [null, "Hair & Scalp"]], "Hair &amp; Scalp Care", "Hair loss isn't one thing. Thinning, shedding, breakage and scalp problems have different causes, and each needs a different plan.", "heroHair") + `
    <section class="sec"><div class="wrap"><div class="pc-grid">${pubServices("hair").map(svcCard).join("")}</div></div></section>
    <section class="sec tint"><div class="wrap two-col"><div class="prose"><div class="eyebrow">Before your appointment</div><h2>What helps your clinician</h2>
      <ul><li>When you first noticed the change, and whether it was sudden or gradual</li><li>Where it's happening: hairline, temples, crown, patches, all over</li><li>Recent styles: braids, weaves, wigs, relaxers, colour, heat</li><li>Any itch, pain, tenderness, flaking or bumps on the scalp</li><li>Recent illness, childbirth, new medicines or major stress, if you're comfortable sharing</li></ul>
      <p>Sudden or patchy hair loss, or hair loss with pain, redness or scarring, should be seen soon.</p></div>
      <aside class="ai-panel hair"><div class="eyebrow">In the patient app</div><h3>Build your hair profile</h3><p>Record porosity, density, strand thickness, pattern and scalp concerns, take consistent hairline and parting photos, and keep a styling history you can share at your visit.</p><p class="small">A phone photo can't count follicles, measure growth, establish porosity or find the cause of hair loss. It can help you and your clinician see change over time.</p><div class="row"><button class="btn white" data-a="portal" data-page="hair" data-tab="id">Open my hair profile</button><button class="btn outline-w" data-a="site" data-path="book" data-svc="hair-loss" data-type="hair">Book an assessment</button></div></aside></div></section>${ctaStrip("Get your hair and scalp checked", "The sooner it's checked, the better the outcome.")}` }),
  aesthetics: () => ({ title: "Aesthetic treatments", html: pageHero([["services", "Services"], [null, "Aesthetics"]], "Aesthetic Treatments", "Elective treatments start with a medical assessment, an honest conversation about benefits and risks, and time to decide.", "heroAesthetic") + `
    <section class="sec"><div class="wrap"><div class="pc-grid">${pubServices("aesthetic").map(svcCard).join("")}</div></div></section>
    <section class="sec tint"><div class="wrap"><div class="card"><h3>Our commitments</h3><ul class="small" style="margin:10px 0 0;padding-left:18px;display:grid;gap:6px"><li>A qualified professional assesses your skin and health first.</li><li>Risks, recovery and alternatives are explained before you decide.</li><li>No guaranteed results and no pressure to book on the day.</li><li>Before-and-after photos are only ever shown with the patient's written permission.</li></ul></div></div></section>${ctaStrip("Talk through your options", "Book an aesthetic consultation.")}` }),
  "ai-analysis": () => ({ title: "AI skin & hair analysis", html: pageHero([[null, "AI Analysis"]], "AI Skin &amp; Hair Analysis", "Guided photos, honest observations and a history you control. A tool that supports your care at RADIANCE, not a substitute for it.", "heroAI") + `
    <section class="sec"><div class="wrap"><div class="ai-split">
      <div class="card raised stack"><div class="eyebrow">What it can do</div><ul style="margin:0;padding-left:18px;display:grid;gap:8px"><li>Check your photo's lighting, focus and glare before anything is analysed</li><li>Describe visible features such as blemishes, dark marks, uneven-looking tone, visible flaking, shine and scalp coverage in the photographed area</li><li>Say "unable to assess" when the photo or the feature isn't suitable</li><li>Keep a dated history so you can compare similar photos over time</li><li>Let you attach chosen assessments to a booking for your clinician to review</li></ul></div>
      <div class="card raised stack"><div class="eyebrow" style="color:var(--red)">What it can't do</div><ul style="margin:0;padding-left:18px;display:grid;gap:8px"><li>Diagnose any condition, including skin cancer, infections or types of alopecia</li><li>Measure hydration, oil production, melanin, porosity, follicle counts, growth rate or strand diameter</li><li>Tell you a mark or mole is harmless, or that your skin is "healthy"</li><li>Prescribe or change treatment</li><li>Replace an examination by a clinician</li></ul></div></div>
      <div class="hl-row" style="margin-top:30px"><div><span class="ic">${ic("shield")}</span><b>Consent first</b><span>Photos are never used to train AI models</span></div><div><span class="ic">${ic("camera")}</span><b>Guided capture</b><span>Face, hairline, crown and scalp views</span></div><div><span class="ic">${ic("progress")}</span><b>Your history</b><span>Review, compare, delete or share</span></div><div><span class="ic">${ic("users")}</span><b>Clinician review</b><span>Only what you choose to share</span></div></div>
      <div class="row" style="margin-top:26px;justify-content:center"><button class="btn primary lg" data-a="portal" data-page="skin" data-tab="scan">Analyse my skin</button><button class="btn lg" data-a="portal" data-page="hair" data-tab="scan">Document hair &amp; scalp</button></div>
      <p class="muted small" style="margin-top:14px;text-align:center">${esc(Clinic.c.ai.modelNote)} Results may be less reliable in poor lighting, with filters or makeup. Not for emergencies.</p></div></section>` }),
  gallery: () => {
    const items = galleryItems();
    const tiles = [["tileFacial", "Facial Treatments", "aesthetics"], ["tileLaser", "Laser Treatments", "services/laser"], ["tileHair", "Hair Treatments", "hair-scalp"], ["tileProducts", "Skincare Products", "learn"]];
    return { title: "Gallery", html: pageHero([[null, "Gallery"]], "Our Gallery", "Real results. Real people.", "heroGallery") + `
    <section class="sec"><div class="wrap"><div class="sec-h"><h2>Before &amp; After</h2>${items.length ? `<button class="link-more" data-a="site" data-path="results">View All ${ic("arrow")}</button>` : ""}</div>
      ${items.length ? `<div class="ba-grid">${items.slice(0, 6).map(baCard).join("")}</div>` : baEmpty()}</div></section>
    <section class="sec tight"><div class="wrap"><div class="sec-h"><h2>Treatment Gallery</h2></div><div class="tiles">${tiles.map(([k, l, p]) => `<button class="tile" data-a="site" data-path="${p}"><div class="im">${phImg(k, l, 600)}</div><span>${l} ${ic("arrow")}</span></button>`).join("")}</div>
      <p class="muted small" style="margin-top:10px">Treatment photos are illustrative and show models, not RADIANCE patients.</p></div></section>
    ${ctaPhoto("Real People. Real Transformations.", "Talk to our team about what's realistic for your skin, and see examples at your consultation.", "galleryCta", "Book Your Consultation")}` };
  },
  results: () => {
    const all = galleryItems(), q = SR.gQ.toLowerCase();
    const list = all.filter(g => (!SR.gTreat || g.treatment === SR.gTreat) && (!SR.gConcern || g.concern === SR.gConcern) && (!q || (g.title + " " + g.treatment + " " + g.concern).toLowerCase().includes(q)));
    const opts = k => [...new Set(all.map(g => g[k]).filter(Boolean))];
    return { title: "Before & After", html: pageHero([["gallery", "Gallery"], [null, "Results"]], "Before &amp; After", "Real results. Real confidence.", "heroResults") + `
    <section class="sec"><div class="wrap"><div class="filters">
      <label class="field" for="g-treat"><span class="sr">Treatment</span><select id="g-treat"><option value="">All Treatments</option>${opts("treatment").map(o => `<option ${SR.gTreat === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>
      <label class="field" for="g-concern"><span class="sr">Concern</span><select id="g-concern"><option value="">All Concerns</option>${opts("concern").map(o => `<option ${SR.gConcern === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>
      <label class="field" for="g-q"><span class="sr">Search results</span><input type="search" id="g-q" placeholder="Search results…" value="${esc(SR.gQ)}"></label></div>
      ${all.length ? (list.length ? `<div class="ba-grid">${list.map(baCard).join("")}</div>` : `<p class="muted">No results match these filters.</p>`) : baEmpty()}</div></section>
    ${ctaStrip("Your Journey to Healthier Skin", "Book a consultation and start your transformation today.")}` };
  },
  specialists: () => { const t = Clinic.c.team.filter(x => x.verified && x.published); return { title: "Our specialists", html: pageHero([["about", "About"], [null, "Specialists"]], "Our Specialists", "The clinicians and team members you'll meet at RADIANCE.", "heroTeam") + `<section class="sec"><div class="wrap">${t.length ? `<div class="team-grid">${t.map(personCard).join("")}</div>` : teamNotice()}</div></section>${bookBand()}` }; },
  learn: (id) => {
    if (id) { const a = ARTICLES.find(x => x.id === id); if (!a) return SITE.__404(); return articlePage(a); }
    const cats = [...new Set(ARTICLES.map(a => a.cat))], list = ARTICLES.filter(a => SR.learnCat === "All" || a.cat === SR.learnCat);
    const catIcon = c => /hair|scalp|porosity|density/i.test(c) ? "hair" : /sun/i.test(c) ? "sparkle" : /ingredient/i.test(c) ? "studio" : /care|seek/i.test(c) ? "pro" : "face";
    return { title: "Health & skin education", html: pageHero([[null, "Blog"]], "Health &amp; Skin Education", "Expert advice for healthier skin and hair.", "heroBlog") + `
      <section class="sec"><div class="wrap blog"><aside class="cats" aria-label="Categories"><h3>Categories</h3>
        <button aria-pressed="${SR.learnCat === "All"}" data-a="sLearnCat" data-c="All">${ic("learn")} All articles <em>${ARTICLES.length}</em></button>
        ${cats.map(c => `<button aria-pressed="${SR.learnCat === c}" data-a="sLearnCat" data-c="${esc(c)}">${ic(catIcon(c))} ${esc(c)} <em>${ARTICLES.filter(a => a.cat === c).length}</em></button>`).join("")}</aside>
      <div class="stack"><label class="sr" for="s-learn-q">Search articles</label><input type="search" id="s-learn-q" data-filter="sart" placeholder="Search articles…">
        ${list.map(a => `<button class="post" data-a="site" data-path="learn/${a.id}" data-filter-item="sart" data-text="${esc((a.title + " " + a.summary + " " + a.body.join(" ")).toLowerCase())}"><div class="im">${phImg(artPhoto(a), "", 300)}</div><div><h3>${esc(a.title)}</h3><p class="meta">${fmtDate(a.written, { month: "long", day: "numeric", year: "numeric" })} · ${readMins(a)} min read${a.reviewer ? " · Clinically reviewed" : ""}</p></div>${ic("arrow")}</button>`).join("")}</div></div></section>
      <section class="sec tight"><div class="wrap"><div class="cta-photo"><div class="im">${phImg("knowledge", "", 900)}</div><div class="tx"><h2>Knowledge Builds Confidence</h2><p>Explore our educational resources and take control of your skin and hair health.</p><button class="btn green" data-a="sLearnCat" data-c="All">Browse All Articles</button></div></div></div></section>` };
  },
  contact: () => contactPage(),
  book: () => bookingPage(),
  privacy: () => policy("Privacy notice", [
    ["What we collect", "On the website: what you type into the booking and contact forms (name, phone, email, reason for visit). In the patient app: the profile, photos and records you choose to add."],
    ["Why", "To arrange appointments, answer enquiries and support your care. Photos and assessments are used only for your records and, if you choose, for your clinician to review."],
    ["AI processing", "If you turn on AI photo analysis, the photo you choose is sent to an external AI service (Anthropic's Claude) to describe visible features. It is not used to train AI models. You can turn this off at any time."],
    ["Where it's stored", Backend.configured ? "In the clinic's secure database, with access limited to you and authorised staff." : "In this version, patient-app records stay on your own device. Booking and contact messages are delivered to the clinic's inbox."],
    ["Who can see it", "You. Clinicians see only what you attach to a booking or what is recorded during your care. Administrators manage bookings but don't have automatic access to clinical details."],
    ["Before-and-after photos", "Patient photos appear in our gallery only with that patient's written consent, which can be withdrawn at any time."],
    ["Your rights", "You can view, correct, export or delete your patient-app records from Profile & privacy. Some clinical records may need to be kept for a period by law; the clinic will explain if a deletion request can't be completed straight away."],
    ["Contact", `Questions about your data: ${Clinic.c.info.email}.`]], "Draft for the clinic's review before launch. Applicable Sierra Leonean law should be checked by the clinic's legal adviser."),
  "ai-limits": () => policy("AI limitations & safety", [
    ["Informational only", "AI observations describe what is visible in one photograph. They are not a diagnosis and can be wrong."],
    ["What affects results", "Lighting, camera quality, angle, distance, makeup, filters, hairstyle and image processing can all change what the AI sees. Two photos can look different without any real change in your skin or hair."],
    ["Skin tone and hair texture", "The tools are designed to treat every skin tone and hair texture as normal, and to say when lighting or tone limits what can be seen. Performance has not been formally validated across all populations."],
    ["Not for emergencies", "If you have a rapidly spreading painful rash with fever, widespread blistering or peeling, or swelling of the face, lips or tongue, seek emergency care. Don't wait for an app or a message reply."],
    ["Clinician oversight", "The AI never diagnoses, prescribes or changes your clinician's instructions. Only a clinician can confirm a finding."],
    ["Model", Clinic.c.ai.modelNote]], "This tool has not been clinically validated or approved as a medical device."),
  terms: () => policy("Terms of use", [["Using this website", "Information on this site is general education about skin, hair and scalp health. It isn't personal medical advice."], ["Appointments", "A booking request isn't confirmed until the clinic confirms it. The clinic may contact you to arrange a suitable time."], ["Patient app", "The app helps you keep records and follow care plans. It isn't a medical device and doesn't replace an examination."], ["Photos", "Treatment photos on this site show models unless stated. Before-and-after results show real patients, published with consent; individual results vary."], ["Content", "Text, logo and artwork belong to RADIANCE Dermatology & Aesthetics Clinic."]], "Draft for the clinic's review before launch."),
  accessibility: () => policy("Accessibility", [["Our aim", "This website and app should work for everyone, including people using screen readers, keyboards, larger text or reduced motion."], ["What we've done", "Readable contrast, visible focus, labelled forms, keyboard-operable menus and dialogs, larger text options in the app, and animations that respect reduced-motion settings."], ["Tell us", `If something doesn't work for you, contact ${Clinic.c.info.email} or call ${Clinic.c.info.phone}.`]]),
  __404: () => ({ title: "Page not found", html: pageHero([[null, "Not found"]], "Page not found", "That page doesn't exist or has moved.") + `<section class="sec"><div class="wrap"><button class="btn primary" data-a="site" data-path="">Go to the homepage</button></div></section>` })
};
function personCard(p) {
  return `<article class="person"><div class="ph">${p.photo ? `<img src="${p.photo}" alt="${esc(p.name)}">` : ic("users")}</div><div class="bd"><b>${esc(p.name)}</b><span class="small">${esc(p.title)}</span>${p.qualifications ? `<span class="muted small">${esc(p.qualifications)}</span>` : ""}${p.specialties ? `<span class="small">${esc(p.specialties)}</span>` : ""}${p.languages ? `<span class="muted small">Languages: ${esc(p.languages)}</span>` : ""}<button class="btn sm" style="margin-top:8px;justify-self:start" data-a="site" data-path="book" data-clin="${p.id}">Book with ${esc(p.name.split(" ").slice(0, 2).join(" "))}</button></div></article>`;
}
function serviceDetail(s) {
  const rel = ARTICLES.filter(a => a.service === s.id), parent = s.cat === "hair" ? ["hair-scalp", "Hair & Scalp"] : s.cat === "aesthetic" ? ["aesthetics", "Aesthetics"] : ["services", "Services"];
  return { title: s.name, html: pageHero([parent, [null, s.name]], esc(s.name), esc(s.short), svcPhoto(s)) + `
  <section class="sec"><div class="wrap two-col"><div class="prose">
    <h2>Overview</h2><p>${esc(s.overview)}</p>
    ${s.concerns.length ? `<h2>Concerns it may address</h2><ul>${s.concerns.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    <h2>What the consultation involves</h2><p>${esc(s.involves)}</p>
    <h2>When to be seen in person</h2><p>${esc(s.inPerson)}</p>
    ${s.faq.length ? `<h2>Questions</h2>${s.faq.map(([q, a]) => `<details class="card" style="margin-bottom:8px"><summary style="cursor:pointer;font-weight:700">${esc(q)}</summary><p style="margin:8px 0 0">${esc(a)}</p></details>`).join("")}` : ""}
    ${rel.length ? `<h2>Related reading</h2><div class="art-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">${rel.map(artCard).join("")}</div>` : ""}
  </div><aside class="card raised side-card stack"><div class="eyebrow">Book</div><h3>${esc(Clinic.type(s.typeId)?.name || "Consultation")}</h3>
    <p class="small muted">${Clinic.type(s.typeId)?.duration ? `About ${Clinic.type(s.typeId).duration} minutes. ` : ""}${Clinic.type(s.typeId)?.fee ? `Fee: ${esc(Clinic.type(s.typeId).fee)}.` : "Ask the clinic about fees."}</p>
    <button class="btn green" data-a="site" data-path="book" data-svc="${s.id}" data-type="${s.typeId}">Book this consultation</button>
    ${s.cat === "hair" ? `<button class="btn" data-a="portal" data-page="hair" data-tab="id">Prepare my hair profile</button>` : s.cat === "medical" ? `<button class="btn" data-a="portal" data-page="skin" data-tab="scan">Document my skin first</button>` : ""}
    <p class="small muted">Not for emergencies. If symptoms are severe or spreading fast, seek urgent care.</p></aside></div></section>` };
}
function articlePage(a) {
  const svc = a.service && Clinic.svc(a.service);
  return { title: a.title, html: pageHero([["learn", "Blog"], [null, a.cat]], esc(a.title), esc(a.summary), artPhoto(a)) + `
  <section class="sec"><div class="wrap two-col"><article class="prose"><p class="muted small">${fmtDate(a.written, { month: "long", day: "numeric", year: "numeric" })} · ${readMins(a)} min read</p>${a.body.map(p => `<p>${esc(p)}</p>`).join("")}
    <div class="row small" style="margin-top:20px">${a.reviewer ? `<span class="chip clin">Clinically reviewed by ${esc(a.reviewer)}${a.reviewedOn ? ", " + fmtDate(a.reviewedOn) : ""}</span>` : `<span class="chip warn">Awaiting review by a RADIANCE clinician</span>`}</div>
    <p class="muted small" style="margin-top:10px">General education, not personal medical advice. If you're worried about a symptom, book an appointment.</p></article>
  <aside class="stack side-card">${svc && svc.published ? `<div class="card raised stack"><div class="eyebrow">Related service</div><h3>${esc(svc.name)}</h3><p class="small muted">${esc(svc.short)}</p><button class="btn green" data-a="site" data-path="book" data-svc="${svc.id}" data-type="${svc.typeId}">Book a consultation</button></div>` : `<div class="card raised stack"><h3>Need advice for you?</h3><button class="btn green" data-a="site" data-path="book">Book an appointment</button></div>`}
    <div class="card stack"><h3>More to read</h3>${ARTICLES.filter(x => x.id !== a.id && (x.cat === a.cat || x.service === a.service)).concat(ARTICLES.filter(x => x.id !== a.id)).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 3).map(x => `<button class="btn ghost" style="justify-content:flex-start;text-align:left" data-a="site" data-path="learn/${x.id}">${esc(x.title)}</button>`).join("")}</div></aside></div></section>` };
}
function policy(title, items, note = "") {
  return { title, html: pageHero([[null, title]], esc(title), "", "heroContact") + `<section class="sec"><div class="wrap prose">${items.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join("")}${note ? `<p class="notice warn small" style="margin-top:20px">${ic("info")}<span>${esc(note)}</span></p>` : ""}</div></section>` };
}

/* ---------- Contact ---------- */
const CF = { sent: null, errors: {} };
function contactPage() {
  const i = Clinic.c.info, e = CF.errors;
  const fld = (id, label, type = "text", req = false, ph = "") => `<label class="field" for="${id}"><span>${label}${req ? " *" : ""}</span><input type="${type}" id="${id}" ${e[id] ? 'aria-invalid="true"' : ""} placeholder="${ph}" autocomplete="${{ "cf-name": "name", "cf-email": "email", "cf-phone": "tel" }[id] || "off"}">${e[id] ? `<span class="err-text">${e[id]}</span>` : ""}</label>`;
  return { title: "Contact", html: pageHero([[null, "Contact"]], "Contact Us", "We're here to help.", "heroContact") + `
  <section class="sec"><div class="wrap"><div class="contact-grid"><div><h2 style="font-size:1.3rem;margin-bottom:8px">Get in Touch</h2>
    <div class="ci"><span class="ic">${ic("pin")}</span><div><b>Visit Us</b><p>${esc(i.address)}</p></div></div>
    <div class="ci"><span class="ic">${ic("phone")}</span><div><b>Call Us</b><p>${esc(i.phone)}</p><p class="row" style="margin-top:6px;gap:8px"><a class="btn sm" href="tel:${esc(i.phone.replace(/\s/g, ""))}">Call</a><a class="btn sm" href="https://wa.me/${esc(i.whatsapp)}" target="_blank" rel="noopener">${ic("whatsapp")} WhatsApp</a></p></div></div>
    <div class="ci"><span class="ic">${ic("mail")}</span><div><b>Email Us</b><p>${esc(i.email)} <button class="btn sm ghost" data-a="copyTxt" data-t="${esc(i.email)}" aria-label="Copy email address">${ic("copy")}</button></p></div></div>
    <div class="ci"><span class="ic">${ic("clock")}</span><div><b>Opening Hours</b><p>${i.hours.length ? i.hours.map(h => `${esc(h.days)}: ${esc(h.time)}`).join("<br>") : "Please call to confirm opening hours."}</p></div></div></div>
  <div class="card raised">
    ${CF.sent ? `<div class="stack" style="align-items:flex-start"><span class="chip ok">${ic("check")} ${esc(CF.sent.title)}</span><h2>${esc(CF.sent.head)}</h2><p>${CF.sent.body}</p><p class="muted small">Reference ${esc(CF.sent.ref)}</p><button class="btn" data-a="cfNew">Send another message</button></div>` : `
    <h2 style="font-size:1.3rem">Send a Message</h2><p class="muted small" style="margin:6px 0 16px">For general questions. Please don't send photos or detailed medical history here: use the patient portal, or bring them to your appointment.</p>
    <form id="cf" class="stack" novalidate>
      ${fld("cf-name", "Full Name", "text", true, "Your name")}${fld("cf-email", "Email Address", "email", true, "you@example.com")}
      <div class="grid g2">${fld("cf-phone", "Phone (optional)", "tel", false, "+232 …")}<label class="field" for="cf-cat"><span>Subject</span><select id="cf-cat"><option>General enquiry</option><option>Appointments</option><option>Services and treatments</option><option>Patient app</option><option>Privacy and my data</option><option>Feedback</option></select></label></div>
      <label class="field" for="cf-msg"><span>Message *</span><textarea id="cf-msg" ${e["cf-msg"] ? 'aria-invalid="true"' : ""} placeholder="How can we help you?"></textarea>${e["cf-msg"] ? `<span class="err-text">${e["cf-msg"]}</span>` : ""}</label>
      <label class="row small" style="align-items:flex-start;flex-wrap:nowrap"><input type="checkbox" id="cf-consent" style="width:18px;height:18px;accent-color:var(--accent);flex:none;margin-top:2px"><span>I agree that RADIANCE may use these details to reply to me. ${e["cf-consent"] ? `<span class="err-text">${e["cf-consent"]}</span>` : ""}</span></label>
      <button class="btn green" type="submit" id="cf-submit" style="width:100%">Send Message</button></form>`}
  </div></div>
  <div class="map-row"><div class="map"><iframe title="Map showing RADIANCE clinic location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(i.mapsQuery)}&output=embed"></iframe></div>
    <div class="card stack" style="align-content:center"><h3>Our Location</h3><p class="small muted">${esc(i.address)}</p><a class="btn" style="align-self:flex-start" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.mapsQuery)}" target="_blank" rel="noopener">${ic("pin")} Get Directions</a><p class="small muted">Instagram: @${esc(i.instagram)}</p></div></div></div></section>` };
}
Object.assign(ACTIONS, {
  cfNew: () => { CF.sent = null; CF.errors = {}; render(); },
  copyTxt: el => copyText(el.dataset.t)
});
document.addEventListener("submit", async e => {
  if (e.target.id !== "cf") return; e.preventDefault();
  const v = id => $("#" + id)?.value.trim() || "", err = {};
  if (!v("cf-name")) err["cf-name"] = "Enter your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("cf-email"))) err["cf-email"] = "Enter a valid email address so we can reply.";
  if (v("cf-msg").length < 5) err["cf-msg"] = "Write a short message.";
  if (!$("#cf-consent").checked) err["cf-consent"] = "Please tick to agree.";
  if (Object.keys(err).length) { const keep = { n: v("cf-name"), e: v("cf-email"), p: v("cf-phone"), m: v("cf-msg"), c: $("#cf-cat").value }; CF.errors = err; render(); restoreCF(keep); $("[aria-invalid=true]")?.focus(); return; }
  const btn = $("#cf-submit"); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Sending…`;
  const rec = { id: uid(), ref: "E-" + Math.random().toString(36).slice(2, 7).toUpperCase(), at: nowISO(), name: v("cf-name"), email: v("cf-email"), phone: v("cf-phone"), category: $("#cf-cat").value, message: v("cf-msg"), status: "new" };
  let delivered = false, failed = false;
  try { if (Backend.sb) { await Ops.add("enquiries", rec); delivered = true; } else if (Forms.available) { await Forms.send("contact-enquiry", rec); delivered = true; } }
  catch (x) { failed = true; }
  if (!Backend.sb) { rec.delivery = delivered ? "sent" : "device"; Clinic.ops.enquiries.unshift(rec); Clinic.saveOps(); }
  CF.errors = {};
  CF.sent = delivered ? { title: "Message sent", head: "Thank you. The clinic has your message.", body: `We'll reply to <b>${esc(rec.email)}</b>${rec.phone ? " or call you" : ""}.`, ref: rec.ref }
    : { title: failed ? "Not sent" : "Preview mode", head: failed ? "We couldn't send your message." : "Message saved on this device only", body: `${failed ? "Check your connection and try again, or" : "This copy of the site isn't connected to the clinic's inbox yet. Please"} email <b>${esc(Clinic.c.info.email)}</b> or call <b>${esc(Clinic.c.info.phone)}</b>.`, ref: rec.ref };
  render();
});
function restoreCF(k) { const set = (id, val) => { const el = $("#" + id); if (el) el.value = val; }; set("cf-name", k.n); set("cf-email", k.e); set("cf-phone", k.p); set("cf-msg", k.m); set("cf-cat", k.c); }
