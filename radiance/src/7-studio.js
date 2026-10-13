
/* ---------- 11. Ingredient reference (general education, curated, not personalised) ---------- */
const INGREDIENTS = [
  { key: "retinoid", name: "Retinoids", group: "retinoid", aliases: ["retinol", "retinal", "retinaldehyde", "retinyl palmitate", "retinyl retinoate", "hydroxypinacolone retinoate", "adapalene", "tretinoin"], uses: "Vitamin A derivatives used in products aimed at texture, breakouts and signs of ageing. Tretinoin and (in some countries) adapalene are prescription medicines.", care: "Commonly cause dryness, peeling and irritation when starting. Often introduced slowly. Many sources advise avoiding retinoids during pregnancy; ask a clinician. Sun protection is usually recommended alongside." },
  { key: "aha", name: "Alpha hydroxy acids (AHAs)", group: "exfoliant", aliases: ["glycolic acid", "lactic acid", "mandelic acid", "malic acid", "citric acid", "tartaric acid"], uses: "Chemical exfoliants used for texture and dullness. Citric acid is also used in small amounts just to adjust pH.", care: "Can increase sun sensitivity and irritation, especially combined with other exfoliants or retinoids." },
  { key: "bha", name: "Salicylic acid (BHA)", group: "exfoliant", aliases: ["salicylic acid", "betaine salicylate", "willow bark extract"], uses: "Oil-soluble exfoliant often used in products aimed at blemishes and visible pores; also in some scalp products.", care: "Can be drying. People with aspirin allergy are sometimes advised to check with a clinician." },
  { key: "bpo", name: "Benzoyl peroxide", group: "bpo", aliases: ["benzoyl peroxide"], uses: "Used in many blemish treatments.", care: "Can bleach fabrics and hair, and is commonly drying. Applied at the same time, it can break down some retinoids (notably tretinoin); product instructions often advise separating them." },
  { key: "vitc", name: "Vitamin C", group: "vitc", aliases: ["ascorbic acid", "l-ascorbic acid", "sodium ascorbyl phosphate", "magnesium ascorbyl phosphate", "ascorbyl glucoside", "ethyl ascorbic acid", "tetrahexyldecyl ascorbate", "3-o-ethyl ascorbic acid"], uses: "Antioxidant used in products aimed at dullness and uneven-looking tone.", care: "Pure ascorbic acid is acidic and can sting sensitive skin; derivatives are usually gentler. Layering with strong acids may add to irritation." },
  { key: "niacinamide", name: "Niacinamide", group: "soothing", aliases: ["niacinamide", "nicotinamide"], uses: "Vitamin B3, used in products aimed at oiliness, uneven-looking tone and the skin barrier.", care: "Usually well tolerated; higher concentrations can cause flushing or irritation in some people. The old advice that it can't be combined with vitamin C is not well supported." },
  { key: "azelaic", name: "Azelaic acid", group: "active", aliases: ["azelaic acid", "potassium azeloyl diglycinate"], uses: "Used for blemishes and uneven-looking tone; higher strengths are prescription in many countries.", care: "Tingling or itching is common at first." },
  { key: "fragrance", name: "Fragrance and fragrance allergens", group: "fragrance", aliases: ["fragrance", "parfum", "perfume", "linalool", "limonene", "citronellol", "geraniol", "eugenol", "coumarin", "citral", "cinnamal", "hexyl cinnamal", "benzyl alcohol", "benzyl salicylate", "farnesol"], uses: "Adds scent. Several named compounds are listed because they are common allergens.", care: "One of the most common causes of cosmetic contact allergy. People with fragrance allergy are usually advised to avoid it." },
  { key: "essential-oils", name: "Essential oils", group: "fragrance", aliases: ["tea tree oil", "melaleuca alternifolia leaf oil", "lavender oil", "lavandula angustifolia oil", "peppermint oil", "eucalyptus oil", "rosemary oil", "rosmarinus officinalis leaf oil"], uses: "Plant oils used for scent, or marketed for scalp or blemish care.", care: "Can irritate or sensitise, particularly undiluted or on broken skin." },
  { key: "ha", name: "Hyaluronic acid", group: "hydrator", aliases: ["hyaluronic acid", "sodium hyaluronate", "hydrolyzed hyaluronic acid", "sodium acetylated hyaluronate"], uses: "Humectant that helps skin hold water.", care: "Generally well tolerated." },
  { key: "glycerin", name: "Glycerin", group: "hydrator", aliases: ["glycerin", "glycerol"], uses: "Humectant used in skin and hair products.", care: "Generally well tolerated." },
  { key: "ceramides", name: "Ceramides", group: "barrier", aliases: ["ceramide np", "ceramide ap", "ceramide eop", "ceramide ns", "ceramide eos"], uses: "Lipids found naturally in skin, used in barrier-support moisturisers.", care: "Generally well tolerated." },
  { key: "mineral-filters", name: "Mineral UV filters", group: "sunscreen", aliases: ["zinc oxide", "titanium dioxide"], uses: "Sunscreen filters that reflect and absorb UV.", care: "Generally well tolerated; can leave a white cast, more visible on deeper skin tones. Tinted versions can help." },
  { key: "chemical-filters", name: "Organic UV filters", group: "sunscreen", aliases: ["avobenzone", "octocrylene", "homosalate", "octinoxate", "ethylhexyl methoxycinnamate", "octisalate", "bemotrizinol", "bis-ethylhexyloxyphenol methoxyphenyl triazine", "tinosorb s", "diethylamino hydroxybenzoyl hexyl benzoate", "uvinul a plus", "ethylhexyl triazone"], uses: "Sunscreen filters that absorb UV. Which ones are permitted varies by country.", care: "Occasional irritation or allergy, sometimes stinging around eyes." },
  { key: "sulfates", name: "Sulfate surfactants", group: "surfactant", aliases: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "ammonium laureth sulfate"], uses: "Strong cleansing agents in shampoos and cleansers.", care: "Can feel stripping on dry or textured hair and sensitive skin. Useful for removing heavy buildup." },
  { key: "silicones", name: "Silicones", group: "conditioning", aliases: ["dimethicone", "amodimethicone", "cyclopentasiloxane", "cyclomethicone", "dimethiconol"], uses: "Add slip, shine and smoothness to hair and skin products.", care: "Generally well tolerated. Heavier ones can build up on hair without a clarifying wash." },
  { key: "protein", name: "Hair proteins", group: "protein", aliases: ["hydrolyzed keratin", "hydrolyzed wheat protein", "hydrolyzed silk", "hydrolyzed rice protein", "hydrolyzed collagen", "hydrolyzed soy protein", "keratin"], uses: "Used in hair products to temporarily reinforce the hair surface.", care: "Some people find frequent protein use leaves hair stiff. Wheat protein may matter for people with wheat allergy." },
  { key: "butters-oils", name: "Plant butters and oils", group: "emollient", aliases: ["shea butter", "butyrospermum parkii butter", "coconut oil", "cocos nucifera oil", "argan oil", "jojoba oil", "castor oil", "ricinus communis seed oil", "olive oil", "avocado oil"], uses: "Emollients used to soften and seal moisture in skin and hair products.", care: "Heavier oils can feel greasy or build up on some hair and scalps. Allergies to plant oils are uncommon but possible." },
  { key: "lanolin", name: "Lanolin", group: "emollient", aliases: ["lanolin", "lanolin alcohol", "wool wax"], uses: "Rich emollient derived from wool.", care: "A known contact allergen for a small number of people." },
  { key: "preservatives-it", name: "Isothiazolinone preservatives", group: "preservative", aliases: ["methylisothiazolinone", "methylchloroisothiazolinone"], uses: "Preservatives, mostly in rinse-off products.", care: "A well-documented cause of contact allergy; restricted in leave-on products in some regions." }
];
const findIng = name => { const n = name.toLowerCase().trim(); return INGREDIENTS.find(i => i.aliases.includes(n) || i.name.toLowerCase() === n); };

/* ---------- 12. Care Studio ---------- */
const ROUTINE_TYPES = {
  skin: { "Morning skincare": ["Cleanse", "Moisturiser", "Sunscreen"], "Evening skincare": ["Cleanse", "Treatment", "Moisturiser"], "Weekly skincare": ["Exfoliant or mask"], "Minimal routine": ["Cleanse", "Moisturiser"], "Travel routine": ["Cleanse", "Moisturiser", "Sunscreen"], "Special occasion": [], "Custom": [] },
  hair: { "Wash day": ["Pre-wash", "Shampoo", "Condition and detangle", "Leave-in", "Style"], "Between washes": ["Refresh", "Seal ends"], "Protective-style care": ["Scalp check", "Light moisture on lengths"], "Deep conditioning": ["Apply deep conditioner", "Rinse"], "Night routine": ["Protect hair (bonnet, scarf or satin pillow)"], "Scalp care": ["Scalp cleanse or treatment"], "Custom": [] }
};
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let editRoutine = null;

PAGES.studio = () => {
  const t = R.tab || "routines";
  return pageHead("Care Studio", "Routines and products", "Plan routines, keep an inventory with ingredients, check overlaps and log reactions.") +
    tabs([["routines", "Routines"], ["products", "Products"], ["compat", "Compatibility"], ["reactions", "Reaction diary"], ["styles", "Protective styles"]], t) +
    (t === "routines" ? routinesView() : t === "products" ? productsView() : t === "compat" ? compatView() : t === "reactions" ? reactionsView() : stylesView());
};

function routinesView() {
  const rs = S().routines, dk = dayKey(), done = S().completions[dk] || {};
  const group = area => rs.filter(r => r.area === area && !r.archived);
  const archived = rs.filter(r => r.archived);
  const card = r => {
    if (editRoutine === r.id) return routineEditor(r);
    const scheduledToday = !r.days?.length || r.days.includes(new Date().getDay());
    return `<div class="card"><div class="card-h"><div><div class="label">${esc(r.type)}</div><h3 style="margin-top:4px">${esc(r.name)}</h3></div><div class="row"><span class="chip">${r.days?.length ? r.days.map(d => WD[d]).join(" ") : "Daily"}</span><button class="btn sm" data-a="editRoutine" data-id="${r.id}">Edit</button></div></div>
      ${r.steps.length ? `<div class="stack" style="gap:6px">${scheduledToday ? r.steps.map(st => stepRow(r, st, done)).join("") : r.steps.map(st => `<div class="step"><span class="lbl">${esc(st.label)}</span></div>`).join("")}</div>` : `<p class="muted small">No steps yet.</p>`}
      ${scheduledToday ? "" : `<p class="muted small" style="margin-top:8px">Not scheduled today.</p>`}
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-a="routineNote" data-id="${r.id}">${ic("plus")} ${r.area === "hair" ? "How did hair and scalp feel?" : "Add note"}</button></div></div>`;
  };
  return `<div class="spread" style="margin-bottom:14px"><p class="muted small">Tick steps when you do them, if that helps. Skipping logging is fine; nothing is counted against you.</p><button class="btn primary" data-a="newRoutine">${ic("plus")} New routine</button></div>
  <h3 style="margin:6px 0 12px">Skin</h3>${group("skin").length ? `<div class="grid g2">${group("skin").map(card).join("")}</div>` : emptyBox("No skin routines yet.")}
  <h3 style="margin:24px 0 12px">Hair</h3>${group("hair").length ? `<div class="grid g2">${group("hair").map(card).join("")}</div>` : emptyBox("No hair routines yet. A wash-day plan is a good start.")}
  ${archived.length ? `<details class="card" style="margin-top:20px"><summary style="cursor:pointer;font-weight:600">Archived (${archived.length})</summary><div class="list" style="margin-top:8px">${archived.map(r => `<div class="li"><div class="grow">${esc(r.name)} <span class="muted small">${esc(r.type)}</span></div><button class="btn sm" data-a="archiveRoutine" data-id="${r.id}">Restore</button></div>`).join("")}</div></details>` : ""}
  <div class="notice" style="margin-top:20px">${ic("info")}<div class="small">Daily sunscreen is widely recommended for every skin tone. If you start a new active product, introducing one at a time makes it easier to tell what suits you.</div></div>`;
}
function routineEditor(r) {
  const prods = S().products.filter(p => p.status !== "Finished");
  return `<div class="card raised" style="grid-column:1/-1"><div class="grid g2">
    <label class="field" for="re-name"><span>Name</span><input type="text" id="re-name" value="${esc(r.name)}"></label>
    <div class="field"><span>Days</span><div class="row" style="gap:4px">${WD.map((d, i) => `<button class="chip toggle-chip" aria-pressed="${(r.days || []).includes(i)}" data-a="reDay" data-i="${i}">${d}</button>`).join("")}</div><small>None selected means every day.</small></div></div>
    <div class="stack" style="margin-top:16px;gap:8px">${r.steps.map((st, i) => `<div class="step" style="flex-wrap:wrap"><span class="mono muted">${i + 1}</span>
      <input type="text" aria-label="Step name" data-step="${st.id}" data-f="label" value="${esc(st.label)}" style="flex:2;min-width:140px">
      <select aria-label="Product for this step" data-step="${st.id}" data-f="productId" style="flex:2;min-width:140px"><option value="">No product</option>${prods.map(p => `<option value="${p.id}" ${p.id === st.productId ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
      <input type="text" aria-label="Step note" data-step="${st.id}" data-f="note" value="${esc(st.note || "")}" placeholder="Note" style="flex:2;min-width:120px">
      <div class="row" style="gap:2px"><button class="icon-btn" aria-label="Move up" data-a="reMove" data-i="${i}" data-d="-1">${ic("up")}</button><button class="icon-btn" aria-label="Move down" data-a="reMove" data-i="${i}" data-d="1">${ic("down")}</button><button class="icon-btn" aria-label="Remove step" data-a="reDel" data-i="${i}">${ic("trash")}</button></div></div>`).join("")}
      <button class="btn sm" data-a="reAdd" style="align-self:flex-start">${ic("plus")} Add step</button></div>
    <div class="spread" style="margin-top:18px"><div class="row"><button class="btn danger sm" data-a="deleteRoutine" data-id="${r.id}">Delete</button><button class="btn sm" data-a="archiveRoutine" data-id="${r.id}">Archive</button></div><button class="btn primary" data-a="doneRoutine">Done</button></div></div>`;
}
document.addEventListener("change", e => {
  const el = e.target; if (!el.dataset.step) return;
  const r = S().routines.find(x => x.id === editRoutine); const st = r?.steps.find(s => s.id === el.dataset.step); if (!st) return;
  st[el.dataset.f] = el.value; Store.save();
});
document.addEventListener("change", e => { if (e.target.id === "re-name") { const r = S().routines.find(x => x.id === editRoutine); if (r) { r.name = e.target.value.trim() || r.name; Store.save(); } } });
document.addEventListener("change", e => { if (e.target.id === "nr-area") $("#nr-type").innerHTML = Object.keys(ROUTINE_TYPES[e.target.value]).map(t => `<option>${t}</option>`).join(""); });
const curR = () => S().routines.find(x => x.id === editRoutine);
Object.assign(ACTIONS, {
  newRoutine: () => openModal(`<h3>New routine</h3><div class="stack" style="margin-top:14px">
    <label class="field" for="nr-area"><span>For</span><select id="nr-area"><option value="skin">Skin</option><option value="hair">Hair</option></select></label>
    <label class="field" for="nr-type"><span>Type</span><select id="nr-type">${Object.keys(ROUTINE_TYPES.skin).map(t => `<option>${t}</option>`).join("")}</select></label>
    <label class="field" for="nr-name"><span>Name (optional)</span><input type="text" id="nr-name" placeholder="e.g. Sunday wash day"></label>
    <label class="row small"><input type="checkbox" id="nr-steps" checked style="width:18px;height:18px;accent-color:var(--accent)"> Start with suggested steps (you can remove any)</label></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="createRoutine">Create</button></div>`),
  createRoutine: () => { const area = $("#nr-area").value, type = $("#nr-type").value; const r = { id: uid(), area, type, name: $("#nr-name").value.trim() || type, days: type === "Wash day" ? [0] : [], steps: $("#nr-steps").checked ? (ROUTINE_TYPES[area][type] || []).map(l => ({ id: uid(), label: l })) : [], createdAt: nowISO() };
    S().routines.push(r); S().journal.unshift({ id: uid(), at: nowISO(), category: "routine", text: `Created routine "${r.name}"`, auto: true }); editRoutine = r.id; closeModal(); commit(); },
  editRoutine: el => { editRoutine = el.dataset.id; rerenderKeep(); },
  doneRoutine: () => { editRoutine = null; commit(false); rerenderKeep(); toast("Routine saved"); },
  reDay: el => { const r = curR(), i = +el.dataset.i; r.days = r.days || []; const k = r.days.indexOf(i); k >= 0 ? r.days.splice(k, 1) : r.days.push(i); r.days.sort(); commit(false); rerenderKeep(); },
  reAdd: () => { curR().steps.push({ id: uid(), label: "New step" }); commit(false); rerenderKeep(); },
  reDel: el => { curR().steps.splice(+el.dataset.i, 1); commit(false); rerenderKeep(); },
  reMove: el => { const s = curR().steps, i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; commit(false); rerenderKeep(); },
  archiveRoutine: el => { const r = S().routines.find(x => x.id === el.dataset.id); r.archived = !r.archived; editRoutine = null; commit(false); rerenderKeep(); toast(r.archived ? "Archived" : "Restored"); },
  deleteRoutine: el => confirmBox("Delete routine?", "Its completion history stays in your records.", "Delete", () => { S().routines = S().routines.filter(x => x.id !== el.dataset.id); editRoutine = null; commit(); }),
  routineNote: el => { const r = S().routines.find(x => x.id === el.dataset.id); newJournalModal(r.area, `${r.name}: `); }
});

function productsView() {
  const ps = S().products;
  const allergies = S().skin.allergies.toLowerCase().split(",").map(x => x.trim()).filter(Boolean);
  return `<div class="spread" style="margin-bottom:14px"><div class="row" style="flex:1;min-width:220px"><label class="sr" for="p-filter">Filter products</label><input type="text" id="p-filter" data-filter="prod" placeholder="Search products or ingredients" style="max-width:340px"></div><button class="btn primary" data-a="editProduct">${ic("plus")} Add product</button></div>
  ${!CONFIG.integrations.productCatalogue ? `<div class="notice" style="margin-bottom:14px">${ic("info")}<div class="small">Product details are entered by you and aren't verified against a catalogue. Barcode lookup needs a product database connection (see README).</div></div>` : ""}
  ${ps.length ? `<div class="card"><div class="list">${ps.map(p => { const flagged = p.ingredients.filter(i => allergies.some(a => i.toLowerCase().includes(a) || (findIng(i) && findIng(a) && findIng(i).key === findIng(a).key)));
    const exp = p.expiresAt ? daysBetween(dayKey(), p.expiresAt) : null;
    return `<div class="li" data-filter-item="prod" data-text="${esc((p.name + " " + p.brand + " " + p.category + " " + p.ingredients.join(" ")).toLowerCase())}"><div class="grow"><div class="row" style="gap:6px"><b>${esc(p.name)}</b><span class="muted small">${esc(p.brand || "")}</span></div>
      <div class="row" style="gap:6px;margin-top:6px"><span class="chip">${esc(p.category)}</span><span class="chip ${p.status === "Stopped (reaction)" ? "err" : ""}">${esc(p.status)}</span>${flagged.length ? `<span class="chip err">Contains ${esc(flagged.join(", "))}</span>` : ""}${exp !== null && exp <= 30 ? `<span class="chip warn">${exp < 0 ? "Expired" : "Expires " + fmtDate(p.expiresAt)}</span>` : ""}${!p.ingredients.length ? `<span class="chip">No ingredient list</span>` : ""}</div></div>
      <button class="btn sm" data-a="viewProduct" data-id="${p.id}">Details</button></div>`; }).join("")}</div></div>`
    : emptyBox("No products yet. Add what you use now; ingredient lists make the compatibility checker useful.")}`;
}
function productForm(p) {
  return `<h3>${p.id ? "Edit product" : "Add product"}</h3><div class="stack" style="margin-top:14px">
    <div class="grid g2"><label class="field" for="pf-name"><span>Product name *</span><input type="text" id="pf-name" value="${esc(p.name || "")}" required></label><label class="field" for="pf-brand"><span>Brand</span><input type="text" id="pf-brand" value="${esc(p.brand || "")}"></label>
    <label class="field" for="pf-cat"><span>Category</span><select id="pf-cat">${OPT.productCats.map(c => `<option ${c === p.category ? "selected" : ""}>${c}</option>`).join("")}</select></label><label class="field" for="pf-status"><span>Status</span><select id="pf-status">${OPT.productStatus.map(c => `<option ${c === p.status ? "selected" : ""}>${c}</option>`).join("")}</select></label>
    <label class="field" for="pf-opened"><span>Opened</span><input type="date" id="pf-opened" value="${p.openedAt || ""}"></label><label class="field" for="pf-exp"><span>Expiry or use-by</span><input type="date" id="pf-exp" value="${p.expiresAt || ""}"><small>From the packaging. Leave blank if unknown.</small></label></div>
    <label class="field" for="pf-ing"><span>Ingredients (INCI list)</span><textarea id="pf-ing" placeholder="Paste from the packaging, separated by commas">${esc((p.ingredients || []).join(", "))}</textarea></label>
    <label class="field" for="pf-notes"><span>Notes</span><input type="text" id="pf-notes" value="${esc(p.notes || "")}"></label>
    <p id="pf-err" class="small" style="color:var(--red)" hidden>Enter a product name.</p></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="saveProduct" data-id="${p.id || ""}">Save product</button></div>`;
}
Object.assign(ACTIONS, {
  editProduct: el => openModal(productForm(S().products.find(p => p.id === el.dataset.id) || {}), true),
  saveProduct: el => {
    const name = $("#pf-name").value.trim(); if (!name) { $("#pf-err").hidden = false; $("#pf-name").focus(); return; }
    const data = { name, brand: $("#pf-brand").value.trim(), category: $("#pf-cat").value, status: $("#pf-status").value, openedAt: $("#pf-opened").value, expiresAt: $("#pf-exp").value, ingredients: $("#pf-ing").value.split(/[,\n]/).map(x => x.trim().replace(/\.$/, "")).filter(Boolean), notes: $("#pf-notes").value.trim() };
    let p = S().products.find(x => x.id === el.dataset.id);
    if (p) Object.assign(p, data); else { p = { id: uid(), createdAt: nowISO(), source: "user", ...data }; S().products.unshift(p); }
    closeModal(); commit(); toast("Product saved");
  },
  viewProduct: el => {
    const p = S().products.find(x => x.id === el.dataset.id), reacts = S().reactions.filter(r => r.productIds.includes(p.id));
    const used = S().routines.filter(r => r.steps.some(s => s.productId === p.id));
    openModal(`<div class="spread"><div><div class="label">${esc(p.category)} · ${esc(p.brand || "No brand")}</div><h2 style="margin-top:4px">${esc(p.name)}</h2></div><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
      <div class="row" style="margin:12px 0"><span class="chip self">User-entered, unverified</span><span class="chip">${esc(p.status)}</span>${p.openedAt ? `<span class="chip">Opened ${fmtDate(p.openedAt)}</span>` : ""}${p.expiresAt ? `<span class="chip">Expires ${fmtDate(p.expiresAt)}</span>` : ""}</div>
      <div class="label" style="margin-top:8px">Ingredients</div>
      ${p.ingredients.length ? `<div class="row" style="gap:6px;margin-top:8px">${p.ingredients.map(i => findIng(i) ? `<button class="chip toggle-chip" data-a="viewIng" data-i="${esc(i)}">${esc(i)}</button>` : `<span class="chip" style="opacity:.75">${esc(i)}</span>`).join("")}</div><p class="muted small" style="margin-top:8px">Highlighted ingredients have a reference entry. Tap to read it.</p>` : `<p class="muted small" style="margin-top:6px">No ingredient list recorded, so nothing about this product can be checked.</p>`}
      <dl class="kv small" style="margin-top:16px"><dt>Used in</dt><dd>${used.length ? used.map(r => esc(r.name)).join(", ") : "No routine"}</dd><dt>Reactions logged</dt><dd>${reacts.length || "None"}</dd>${p.notes ? `<dt>Notes</dt><dd>${esc(p.notes)}</dd>` : ""}</dl>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="editProduct" data-id="${p.id}">Edit</button><button class="btn" data-a="newReaction" data-pid="${p.id}">Log a reaction</button><button class="btn danger" data-a="deleteProduct" data-id="${p.id}">Delete</button></div>`, true);
  },
  viewIng: el => { const ing = findIng(el.dataset.i); openModal(ingredientHTML(ing, el.dataset.i)); },
  deleteProduct: el => confirmBox("Delete product?", "It will be removed from routines too. Logged reactions keep their record.", "Delete", () => { const id = el.dataset.id; S().products = S().products.filter(p => p.id !== id); S().routines.forEach(r => r.steps.forEach(s => { if (s.productId === id) s.productId = ""; })); commit(); })
});
function ingredientHTML(ing, asWritten) {
  const mine = S().products.filter(p => p.ingredients.some(i => findIng(i)?.key === ing.key));
  return `<div class="spread"><div><div class="label">Ingredient reference</div><h2 style="margin-top:4px">${esc(ing.name)}</h2></div><button class="icon-btn" data-a="closeModal" aria-label="Close">${ic("x")}</button></div>
    ${asWritten ? `<p class="muted small" style="margin-top:6px">Listed on your product as “${esc(asWritten)}”.</p>` : ""}
    <div class="stack" style="margin-top:14px"><div><b class="small">Common uses</b><p class="small" style="margin-top:4px">${esc(ing.uses)}</p></div><div><b class="small">Things to know</b><p class="small" style="margin-top:4px">${esc(ing.care)}</p></div>
    <div><b class="small">Also listed as</b><p class="small muted" style="margin-top:4px">${esc(ing.aliases.join(", "))}</p></div>
    ${mine.length ? `<div><b class="small">In your products</b><p class="small" style="margin-top:4px">${mine.map(p => esc(p.name)).join(", ")}</p></div>` : ""}
    <p class="muted small">General education, not personalised advice. Commonly used doesn't mean it suits everyone. Written for this app from widely published dermatology guidance; not individually reviewed by a clinician.</p></div>`;
}

let compatPick = [];
function compatView() {
  const ps = S().products.filter(p => p.status !== "Finished");
  if (ps.length < 2) return emptyBox("Add at least two products with ingredient lists to check them together.", `<button class="btn primary" data-a="go" data-page="studio" data-tab="products">Go to products</button>`);
  compatPick = compatPick.filter(id => ps.find(p => p.id === id));
  const findings = compatPick.length >= 2 ? checkCompat(compatPick.map(id => ps.find(p => p.id === id))) : null;
  const lvl = { concern: ["err", "Known concern"], precaution: ["warn", "Precaution"], personal: ["err", "Your recorded sensitivity"], info: ["", "Info"], gap: ["", "Can't check"] };
  return `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:20px" id="coach-grid"><div class="card"><div class="label">Choose products</div>
    <div class="stack" style="margin-top:10px;gap:6px">${ps.map(p => `<label class="step"><input type="checkbox" data-a="compatPick" data-id="${p.id}" ${compatPick.includes(p.id) ? "checked" : ""}><span class="lbl">${esc(p.name)}<br><span class="muted small">${p.ingredients.length ? p.ingredients.length + " ingredients" : "No ingredient list"}</span></span></label>`).join("")}</div>
    <button class="btn sm" data-a="compatRoutine" style="margin-top:12px">Select everything in today's routines</button></div>
  <div class="stack">${findings ? (findings.length ? findings.map(f => `<div class="card" style="padding:16px"><div class="row" style="gap:6px"><span class="chip ${lvl[f.level][0]}">${lvl[f.level][1]}</span><b class="small">${esc(f.title)}</b></div><p class="small" style="margin-top:8px">${esc(f.text)}</p></div>`).join("")
      : `<div class="card"><p>No overlaps or documented interaction concerns found among the listed ingredients.</p><p class="muted small" style="margin-top:6px">That covers only the ingredients entered and the reference list in this app. It isn't a guarantee these products suit you.</p></div>`)
    : `<div class="empty">Pick two or more products to check shared ingredients, overlapping actives and anything matching your recorded sensitivities.</div>`}
    <p class="muted small">Overlap doesn't mean danger. "Known concern" is reserved for interactions widely documented in dermatology guidance; "Precaution" means people often find the combination irritating. Ask a pharmacist or dermatologist when unsure.</p></div></div>`;
}
function checkCompat(list) {
  const out = [], groups = {};
  const allergies = S().skin.allergies.toLowerCase().split(",").map(x => x.trim()).filter(Boolean);
  list.forEach(p => {
    if (!p.ingredients.length) out.push({ level: "gap", title: p.name, text: "No ingredient list recorded, so this product couldn't be checked." });
    p.ingredients.forEach(i => { const ing = findIng(i); if (ing) (groups[ing.group] = groups[ing.group] || new Set()).add(p.name);
      allergies.forEach(a => { if (i.toLowerCase().includes(a) || (findIng(a) && ing && findIng(a).key === ing.key)) out.push({ level: "personal", title: `${p.name} contains ${i}`, text: `You recorded "${a}" as an allergy or sensitivity.` }); }); });
  });
  const has = g => groups[g] && groups[g].size;
  const names = g => [...groups[g]].join(", ");
  if (has("bpo") && has("retinoid")) out.push({ level: "concern", title: "Benzoyl peroxide with a retinoid", text: `Applied together, benzoyl peroxide can break down some retinoids such as tretinoin, and both can be drying. Products: ${names("bpo")}; ${names("retinoid")}. Product guidance often suggests using them at different times of day.` });
  if (groups.retinoid?.size > 1) out.push({ level: "precaution", title: "More than one retinoid", text: `Retinoids appear in ${names("retinoid")}. Layering several usually adds irritation without clear extra benefit.` });
  if (has("retinoid") && has("exfoliant")) out.push({ level: "precaution", title: "Retinoid with exfoliating acids", text: `Using ${names("retinoid")} alongside ${names("exfoliant")} in the same routine commonly increases dryness and irritation. Many people alternate nights.` });
  if (groups.exfoliant?.size > 1) out.push({ level: "precaution", title: "Several exfoliating acids", text: `Exfoliating acids appear in ${names("exfoliant")}. Stacking them can over-exfoliate.` });
  if (has("vitc") && has("exfoliant")) out.push({ level: "precaution", title: "Vitamin C with exfoliating acids", text: "Both are acidic. Some people find this combination stings; others tolerate it." });
  if ((has("exfoliant") || has("retinoid")) && !list.some(p => p.category === "Sunscreen")) out.push({ level: "info", title: "Sun protection", text: "Exfoliants and retinoids can make skin more sun-sensitive. None of the selected products is a sunscreen." });
  const counts = {}; list.forEach(p => new Set(p.ingredients.map(i => i.toLowerCase())).forEach(i => counts[i] = (counts[i] || 0) + 1));
  const shared = Object.entries(counts).filter(([i, n]) => n > 1 && !["water", "aqua", "glycerin"].includes(i)).map(([i]) => i);
  if (shared.length) out.push({ level: "info", title: "Shared ingredients", text: `Found in more than one product: ${shared.slice(0, 12).join(", ")}${shared.length > 12 ? "…" : ""}. Usually harmless; useful to know if you react to one.` });
  return out;
}
Object.assign(ACTIONS, {
  compatPick: el => { const id = el.dataset.id; compatPick.includes(id) ? compatPick = compatPick.filter(x => x !== id) : compatPick.push(id); rerenderKeep(); },
  compatRoutine: () => { compatPick = [...new Set(todaysRoutines().flatMap(r => r.steps.map(s => s.productId)).filter(Boolean))]; if (compatPick.length < 2) toast("Today's routines use fewer than two assigned products."); rerenderKeep(); }
});

function reactionsView() {
  const rs = [...S().reactions].sort((a, b) => b.at.localeCompare(a.at));
  return `<div class="spread" style="margin-bottom:14px"><p class="muted small" style="max-width:60ch">Write down what happened while it's fresh. A reaction after a product doesn't prove the product caused it, but a record makes patterns easier to spot.</p><button class="btn primary" data-a="newReaction">${ic("plus")} Log a reaction</button></div>
  ${rs.length ? `<div class="card"><div class="list">${rs.map(r => `<div class="li" style="align-items:flex-start"><span class="mono muted" style="min-width:90px">${fmtDate(r.at)}</span><div class="grow"><div class="row" style="gap:6px"><b>${esc(r.symptoms)}</b><span class="chip ${r.severity === "Severe" ? "err" : r.severity === "Moderate" ? "warn" : ""}">${esc(r.severity)} (self-rated)</span><span class="chip">${esc(r.area)}</span></div>
    <p class="small muted" style="margin-top:4px">${r.productIds.map(id => S().products.find(p => p.id === id)?.name || "Deleted product").join(", ") || "No product linked"}${r.duration ? " · lasted " + esc(r.duration) : ""}</p>${r.notes ? `<p class="small" style="margin-top:4px">${esc(r.notes)}</p>` : ""}</div><button class="icon-btn" aria-label="Delete entry" data-a="delReaction" data-id="${r.id}">${ic("trash")}</button></div>`).join("")}</div></div>`
    : emptyBox("No reactions logged. Hopefully it stays that way.")}`;
}
Object.assign(ACTIONS, {
  newReaction: el => { const pid = el?.dataset?.pid;
    openModal(`<h3>Log a reaction</h3><div class="notice err" style="margin:12px 0">${ic("warn")}<div class="small">If you have swelling of the face, lips or tongue, difficulty breathing, or a rapidly spreading rash, get emergency care now.</div></div>
    <div class="stack"><div class="grid g2"><label class="field" for="rx-date"><span>When</span><input type="date" id="rx-date" value="${dayKey()}"></label><label class="field" for="rx-area"><span>Area</span><select id="rx-area">${OPT.areas.map(a => `<option>${a}</option>`).join("")}</select></label></div>
    <label class="field" for="rx-sym"><span>What happened? *</span><input type="text" id="rx-sym" placeholder="Stinging and redness on cheeks"></label>
    <div class="grid g2"><label class="field" for="rx-sev"><span>How bad (your rating)</span><select id="rx-sev">${OPT.severity.map(a => `<option>${a}</option>`).join("")}</select></label><label class="field" for="rx-dur"><span>How long it lasted</span><input type="text" id="rx-dur" placeholder="About 2 hours"></label></div>
    <div class="field"><span>Products used around that time</span><div class="stack" style="gap:4px;max-height:180px;overflow:auto">${S().products.map(p => `<label class="row small"><input type="checkbox" class="rx-p" value="${p.id}" ${p.id === pid ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--accent)"> ${esc(p.name)}</label>`).join("") || `<span class="muted small">No products in your inventory.</span>`}</div></div>
    <label class="field" for="rx-notes"><span>Notes</span><textarea id="rx-notes" placeholder="Anything else used that day, new environment, sun exposure"></textarea></label>
    <label class="row small"><input type="checkbox" id="rx-stop" style="width:18px;height:18px;accent-color:var(--accent)"> Mark the linked products as "Stopped (reaction)"</label>
    <p id="rx-err" class="small" style="color:var(--red)" hidden>Describe what happened.</p></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="saveReaction">Save</button></div>`, true); },
  saveReaction: () => {
    const sym = $("#rx-sym").value.trim(); if (!sym) { $("#rx-err").hidden = false; return; }
    const ids = [...document.querySelectorAll(".rx-p:checked")].map(x => x.value), sev = $("#rx-sev").value;
    S().reactions.unshift({ id: uid(), at: $("#rx-date").value || dayKey(), area: $("#rx-area").value, symptoms: sym, severity: sev, duration: $("#rx-dur").value.trim(), notes: $("#rx-notes").value.trim(), productIds: ids, loggedAt: nowISO() });
    if ($("#rx-stop").checked) ids.forEach(id => { const p = S().products.find(x => x.id === id); if (p) p.status = "Stopped (reaction)"; });
    closeModal(); commit();
    if (sev === "Severe") openModal(`<h3>That sounds significant</h3><p style="margin:10px 0">For a severe or worsening reaction, stop using the products involved and contact a doctor or pharmacist. For swelling of the face or throat, or trouble breathing, seek emergency care.</p><div class="row" style="justify-content:flex-end"><button class="btn primary" data-a="closeModal">Understood</button></div>`);
    else toast("Reaction logged");
  },
  delReaction: el => confirmBox("Delete this entry?", "This can't be undone.", "Delete", () => { S().reactions = S().reactions.filter(r => r.id !== el.dataset.id); commit(); })
});

function stylesView() {
  const st = [...S().styles].sort((a, b) => (b.installedAt || "").localeCompare(a.installedAt || ""));
  return `<div class="spread" style="margin-bottom:14px"><p class="muted small" style="max-width:60ch">Track installs, planned removal and how your scalp feels. Pain, tight bumps around the hairline or tenderness that doesn't settle are signs the style is too tight.</p><button class="btn primary" data-a="newStyle">${ic("plus")} Add style</button></div>
  ${st.length ? `<div class="grid g2">${st.map(s => { const left = s.removeBy ? daysBetween(dayKey(), s.removeBy) : null;
    return `<div class="card"><div class="card-h"><div><div class="label">${s.removedAt ? "Removed " + fmtDate(s.removedAt) : "Current"}</div><h3 style="margin-top:4px">${esc(s.style)}</h3></div>${s.comfort === "Painful" ? `<span class="chip err">Painful</span>` : s.comfort === "Some tension" ? `<span class="chip warn">Some tension</span>` : `<span class="chip ok">${esc(s.comfort || "Comfortable")}</span>`}</div>
    <dl class="kv small"><dt>Installed</dt><dd>${fmtDate(s.installedAt)}</dd><dt>Planned removal</dt><dd>${s.removeBy ? fmtDate(s.removeBy) + (left !== null && !s.removedAt ? ` (${left < 0 ? "overdue" : left + " days"})` : "") : "—"}</dd>${s.notes ? `<dt>Notes</dt><dd>${esc(s.notes)}</dd>` : ""}</dl>
    ${s.comfort === "Painful" && !s.removedAt ? `<div class="notice warn" style="margin-top:10px">${ic("warn")}<div class="small">Ongoing pain from a style can damage the hairline. Consider loosening or removing it, and see a professional if pain or bumps persist.</div></div>` : ""}
    <div class="row" style="margin-top:12px">${s.removedAt ? "" : `<button class="btn sm" data-a="removeStyle" data-id="${s.id}">Mark removed</button>`}<button class="btn sm ghost" data-a="delStyle" data-id="${s.id}">Delete</button></div></div>`; }).join("")}</div>`
    : emptyBox("No protective styles tracked.")}`;
}
Object.assign(ACTIONS, {
  newStyle: () => openModal(`<h3>Add protective style</h3><div class="stack" style="margin-top:14px"><label class="field" for="ps-style"><span>Style *</span><input type="text" id="ps-style" placeholder="Knotless braids, wig, twists, cornrows"></label>
    <div class="grid g2"><label class="field" for="ps-in"><span>Installed</span><input type="date" id="ps-in" value="${dayKey()}"></label><label class="field" for="ps-out"><span>Planned removal</span><input type="date" id="ps-out"></label></div>
    <label class="field" for="ps-comfort"><span>Comfort</span><select id="ps-comfort"><option>Comfortable</option><option>Some tension</option><option>Painful</option></select></label>
    <label class="field" for="ps-notes"><span>Notes</span><input type="text" id="ps-notes" placeholder="Products used, scalp observations"></label></div>
    <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="closeModal">Cancel</button><button class="btn primary" data-a="saveStyle">Save</button></div>`),
  saveStyle: () => { const style = $("#ps-style").value.trim(); if (!style) { $("#ps-style").focus(); return; } S().styles.unshift({ id: uid(), style, installedAt: $("#ps-in").value, removeBy: $("#ps-out").value, comfort: $("#ps-comfort").value, notes: $("#ps-notes").value.trim() }); closeModal(); commit(); },
  removeStyle: el => { S().styles.find(s => s.id === el.dataset.id).removedAt = dayKey(); commit(); },
  delStyle: el => confirmBox("Delete this style record?", "", "Delete", () => { S().styles = S().styles.filter(s => s.id !== el.dataset.id); commit(); })
});
