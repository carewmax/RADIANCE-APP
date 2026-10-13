
/* ---------- Patient sign-in (only when the clinic's Supabase database is connected) ---------- */
let authMode = "in", authMsg = null;
function renderPortalAuth() {
  applyTheme();
  const app = $("#app"); app.className = "site"; document.title = "Patient portal · RADIANCE";
  const f = (id, l, t, ac) => `<label class="field" for="${id}"><span>${l}</span><input type="${t}" id="${id}" autocomplete="${ac}" required></label>`;
  app.innerHTML = `<div class="ob" style="max-width:480px;padding-top:50px"><div class="spread" style="margin-bottom:24px"><button class="brand-btn" style="padding:0" data-a="site" data-path="">${brandLockup("Patient portal")}</button></div>
    <div class="card raised stack">${!Backend.ready ? `<p class="muted"><span class="spinner" style="display:inline-block"></span> Connecting securely…</p>` : Backend.error ? `<div class="notice err">${ic("warn")}<span class="small">${esc(Backend.error)}</span></div>` : `
    <h2>${{ in: "Sign in", up: "Create your account", reset: "Reset your password" }[authMode]}</h2>
    <form id="auth-form" class="stack">${authMode === "up" ? f("au-name", "Your name", "text", "name") : ""}${f("au-email", "Email", "email", "email")}${authMode !== "reset" ? f("au-pass", authMode === "up" ? "Choose a password (at least 8 characters)" : "Password", "password", authMode === "up" ? "new-password" : "current-password") : ""}
      ${authMode === "up" ? `<label class="row small" style="flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" id="au-ok" required style="width:18px;height:18px;accent-color:var(--accent);flex:none;margin-top:2px"><span>I've read the <button type="button" class="btn ghost sm" style="padding:0" data-a="site" data-path="privacy">privacy notice</button> and understand AI observations aren't a diagnosis.</span></label>` : ""}
      ${authMsg ? `<div class="notice ${authMsg.ok ? "ok" : "err"} small">${esc(authMsg.text)}</div>` : ""}
      <button class="btn primary" type="submit">${{ in: "Sign in", up: "Create account", reset: "Send reset link" }[authMode]}</button></form>
    <div class="row small">${authMode !== "in" ? `<button class="btn ghost sm" data-a="authMode" data-m="in">I have an account</button>` : `<button class="btn ghost sm" data-a="authMode" data-m="up">Create an account</button><button class="btn ghost sm" data-a="authMode" data-m="reset">Forgot password?</button>`}</div>`}
    </div><p class="muted small" style="margin-top:14px">Your records are private to your account. Clinicians see only what you share with a booking.</p></div>`;
}
document.addEventListener("submit", async e => {
  if (e.target.id !== "auth-form") return; e.preventDefault();
  const email = $("#au-email").value.trim(), pass = $("#au-pass")?.value || "";
  try {
    if (authMode === "in") { await Backend.signIn(email, pass); authMsg = null; }
    else if (authMode === "up") { if (pass.length < 8) throw new Error("Use at least 8 characters for your password."); const r = await Backend.signUp(email, pass, $("#au-name").value.trim()); authMsg = r.session ? null : { ok: true, text: "Check your email to verify your address, then sign in." }; authMode = r.session ? authMode : "in"; }
    else { await Backend.reset(email); authMsg = { ok: true, text: "If that email has an account, a reset link is on its way." }; }
  } catch (x) { authMsg = { ok: false, text: x.message?.includes("Invalid login") ? "Email or password is incorrect." : x.message || "Something went wrong. Try again." }; }
  render();
});
Object.assign(ACTIONS, {
  authMode: el => { authMode = el.dataset.m; authMsg = null; render(); },
  signOut: async () => { await Backend.signOut(); Store.state = freshState(); Store.mode = "local"; nav(""); }
});

/* ---------- Boot ---------- */
const applyScale = () => { document.documentElement.style.fontSize = (SURFACE === "app" ? (S().settings.textScale || "100") : "100") + "%"; };
const _applyTheme = applyTheme; applyTheme = () => { _applyTheme(); applyScale(); };
(async function boot() {
  Store.loadLocal();
  routeFromHash();
  render(); Cap.init(); Store.connectCloud(); Clinic.loadPublished();
  await Backend.init();
  if (Backend.user) {
    await Store.onAuth();
    try { const { data } = await Backend.sb.from("staff_roles").select("role,name,active").eq("user_id", Backend.user.id).maybeSingle();
      if (data?.active) { Staff.session = { id: Backend.user.id, name: data.name, role: data.role }; await Backend.pullOps(); }
      else { const { data: mine } = await Backend.sb.from("bookings").select("*").order("created_at", { ascending: false }); Clinic.ops.bookings = (mine || []).map(r => ({ ...r.json, id: r.id, status: r.status || r.json.status }));
        const { data: plans } = await Backend.sb.from("care_plans").select("*"); Clinic.ops.carePlans = (plans || []).map(r => ({ ...r.json, id: r.id })); } } catch (e) {}
    render();
  }
})();
