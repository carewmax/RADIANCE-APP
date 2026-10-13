// End-to-end smoke test for the RADIANCE platform: website, booking, contact, patient app, staff console.
// Fails on any script error, horizontal overflow, or a missing honesty state. Run: npm test
import { chromium } from "playwright";
import { resolve } from "node:path";
const url = "file://" + resolve("dist/index.html");
const SITE = ["", "about", "hair-analysis", "account", "signin", "notifications", "appointments", "shop", "bag", "orders", "services", "services/acne", "services/hair-loss", "hair-scalp", "aesthetics", "ai-analysis", "gallery", "results", "specialists", "learn", "learn/alopecia-types", "contact", "book", "privacy", "ai-limits", "terms", "accessibility", "nope"];
const APP = ["home", "skin", "hair", "studio", "progress", "coach", "learn", "pro", "settings"];
const STAFF = { clinician: ["overview", "appointments", "patients"], admin: ["overview", "appointments", "enquiries", "content", "photos", "gallery", "services", "team", "learn", "campaigns", "schedule", "staff", "ai", "reports", "audit"], support: ["overview", "appointments", "enquiries"] };
const fails = [], shots = process.env.SHOTS;
const browser = await chromium.launch();
for (const [w, h, label] of [[1280, 900, "desktop"], [390, 844, "phone"]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", e => fails.push(`${label}: ${e.message}`));
  await p.route("**/*", r => r.request().url().startsWith("file:") ? r.continue() : r.abort());
  const over = async where => { if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) fails.push(`${label}: overflow on ${where}`); };
  await p.goto(url); await p.waitForTimeout(300);
  for (const r of SITE) { await p.evaluate(r => nav(r), r); await p.waitForTimeout(40); await over("site/" + r); if (shots && label === "desktop" && ["", "services/hair-loss", "book", "learn"].includes(r)) await p.screenshot({ path: `${shots}/site-${r.replace("/", "_") || "home"}.png`, fullPage: r === "" }); if (shots && label === "phone" && r === "") await p.screenshot({ path: `${shots}/phone-home.png`, fullPage: true }); }
  // booking flow (file:// → not connected, so the result must say "Not sent yet")
  await p.evaluate(() => nav("book")); await p.click('[data-a="bkNext"]'); if (!(await p.textContent("#bk-body")).includes("Choose an appointment type")) fails.push(label + ": booking validation missing");
  await p.selectOption("#bk-type", "hair"); await p.click('[data-a="bkNext"]');
  await p.fill("#bk-date", new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)); await p.click('[data-a="bkNext"]');
  await p.fill("#bk-name", "Test Patient"); await p.fill("#bk-phone", "+232 76 000000"); await p.click('[data-a="bkNext"]');
  await p.click('[data-a="bkSubmit"]'); await p.waitForTimeout(150);
  const res = await p.textContent("#main"); if (!/Not sent yet/.test(res)) fails.push(label + ": booking result not honest about delivery");
  if (shots && label === "desktop") await p.screenshot({ path: `${shots}/booking-result.png` });
  // contact form
  await p.evaluate(() => nav("contact")); await p.click("#cf-submit"); if (!(await p.$("[aria-invalid=true]"))) fails.push(label + ": contact validation missing");
  await p.fill("#cf-name", "A"); await p.fill("#cf-email", "a@b.co"); await p.fill("#cf-msg", "Hello there"); await p.check("#cf-consent"); await p.click("#cf-submit"); await p.waitForTimeout(100);
  if (!/saved on this device only/i.test(await p.textContent("#main"))) fails.push(label + ": contact result not honest");
  // patient app with example data
  await p.evaluate(() => nav("portal")); await p.click('[data-a="obExample"]'); await p.waitForTimeout(100);
  for (const pg of APP) { await p.evaluate(pg => go(pg), pg); const tabs = await p.$$eval('[data-a="tab"]', t => [...new Set(t.map(x => x.dataset.tab))]);
    for (const t of [null, ...tabs]) { await p.evaluate(([pg, t]) => go(pg, t), [pg, t]); await p.waitForTimeout(30); await over(`app/${pg}/${t}`); } }
  if (shots && label === "desktop") { await p.evaluate(() => go("home")); await p.screenshot({ path: `${shots}/app-home.png` }); }
  // staff console, each demo role
  for (const [role, pages] of Object.entries(STAFF)) {
    await p.evaluate(() => { Staff.session = null; nav("staff"); }); await p.click(`[data-a="stDemo"][data-r="${role}"]`);
    for (const sp of pages) { await p.evaluate(sp => { SR.staffPage = sp; render(); }, sp); await p.waitForTimeout(30); await over(`staff/${role}/${sp}`); if (shots && label === "desktop" && ((role === "admin" && ["content", "schedule"].includes(sp)) || (role === "clinician" && sp === "appointments"))) await p.screenshot({ path: `${shots}/staff-${role}-${sp}.png` }); }
    const hidden = Object.keys(STAFF.admin).length && role === "admin" ? await p.$('[data-p="patients"]') : null; if (hidden) fails.push("admin can see clinical records nav");
  }
  // clinician confirms the booking made above, then patient record + care plan
  await p.evaluate(() => { Staff.session = { id: "d", name: "Dr Demo", role: "clinician", demo: true }; SR.staffPage = "appointments"; render(); });
  await p.click('[data-a="stAppt"]'); await p.click('[data-a="apSet"][data-s="confirmed"]'); if (!(await p.isVisible("#ap-msg"))) fails.push(label + ": confirm without time allowed");
  await p.fill("#ap-t", "10:00"); await p.click('[data-a="apSet"][data-s="confirmed"]'); await p.waitForTimeout(80);
  if (!(await p.evaluate(() => Clinic.ops.bookings.some(b => b.status === "confirmed")))) fails.push(label + ": confirm failed");
  // phone app layout: tab bar, honest shop/order flow, and desktop keeps the full site
  if (label === "phone") {
    await p.evaluate(() => nav(""));
    if (!(await p.$(".mx-tabs"))) fails.push("phone: bottom tab bar missing");
    for (const t of ["services", "book", "gallery", "account", ""]) { await p.click(`.mx-tabs [data-path="${t}"]`); await p.waitForTimeout(40); if (!(await p.$(`.mx-tabs [data-path="${t}"][aria-current=page]`))) fails.push("phone: tab " + t + " not active"); await over("tab/" + t); }
    if (await p.$('[aria-label^="Shopping bag"]')) fails.push("phone: shop shown with no products");
    await p.evaluate(() => { Clinic.c.products = [{ id: "t1", name: "Test", price: 10, published: true }]; nav("shop"); });
    await p.click('[data-a="mxQty"][data-d="1"]'); await p.evaluate(() => nav("checkout")); await p.click('[data-a="mxOrder"]');
    if (!(await p.$("[aria-invalid=true]"))) fails.push("phone: checkout validation missing");
    await p.fill("#co-name", "T"); await p.fill("#co-phone", "+232 76 000000"); await p.click('[data-a="mxOrder"]'); await p.waitForTimeout(100);
    if (!/Not sent yet/.test(await p.textContent("#main"))) fails.push("phone: order result not honest about delivery");
    await p.evaluate(() => { Clinic.c.products = []; localStorage.removeItem("radiance:bag"); Bag.items = []; });
  } else if (await p.$(".mx-tabs")) fails.push("desktop: phone layout shown on desktop");
  await p.close();
}
await browser.close();
if (fails.length) { console.error("FAIL\n" + [...new Set(fails)].join("\n")); process.exit(1); }
console.log("PASS: website, booking, contact, patient app and staff console render and behave correctly at desktop and phone widths");
