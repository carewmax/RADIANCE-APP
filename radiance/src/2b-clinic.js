
/* ============================================================
   CLINIC CONTENT + SHARED DATA LAYER
   Content (services, articles, campaigns, team, hours…) is editable in the staff console.
   Nothing here invents doctors, prices, opening hours, testimonials or outcomes:
   unknown facts are null and the UI shows a "to be confirmed" state instead.
   ============================================================ */
const CLINIC_DEFAULTS = {
  version: 1, updatedAt: "2026-10-12T00:00:00Z",
  info: {
    name: "RADIANCE Dermatology & Aesthetics Clinic",
    address: "59 Upper Big Waterloo Street, Freetown, Sierra Leone",
    addressNote: "From the clinic's published campaign graphics. Please confirm before launch.",
    phone: "+232 74 898964", whatsapp: "23274898964", email: "info@radiancederm.org",
    instagram: "radi.ancedermatology",
    hours: [], // e.g. [{ days: "Mon–Fri", time: "9:00–17:00" }] — left empty until the clinic confirms
    mapsQuery: "59 Upper Big Waterloo Street, Freetown"
  },
  announcement: { on: true, text: "Hair loss isn't one thing. The sooner it's checked, the better the outcome.", link: "hair-scalp", linkLabel: "Get evaluated" },
  hero: {
    eyebrow: "Dermatology · Hair & scalp · Aesthetics",
    title: "Healthy skin. Confident you.",
    text: "Expert dermatology care, advanced aesthetic treatments and personalised skincare solutions, all in one place.",
    image: "" // staff can upload a licensed clinic photo in the console
  },
  // Photo slots: Unsplash photo IDs (free Unsplash License) or an uploaded data: URL from the staff console.
  // Stock models are never presented as patients or used for before-and-after results.
  photos: {
    heroHome: "1693004927824-f2623bbedc8b", heroAbout: "1629909614456-6b1c5c94cecc", aboutStory: "1764727291644-5dcb0b1a0375", aboutQuote: "1632765866070-3fadf25d3d5b",
    heroServices: "1577746838851-816a43ca8733", heroGallery: "1688588162416-f7a7e726e0bf", heroResults: "1585890483046-9461ebc1dace", heroBlog: "1609535895148-cf9f5c446290",
    heroContact: "1762625570087-6d98fca29531", heroBook: "1713085085470-fba013d67e65", heroAI: "1676312754401-d97fe43c2c4b", heroHair: "1632765854612-9b02b6ec2b15",
    heroAesthetic: "1552693673-1bf958298935", heroTeam: "1706565029539-d09af5896340", ctaHome: "1618509682637-e4790939cf96", needHelp: "1646457417455-77a66a9fcf34",
    knowledge: "1527203561188-dae1bc1a417f", galleryCta: "1693004925174-d9e06209d0ee",
    tileFacial: "1570172619644-dfd03ed5d881", tileLaser: "1761718210089-ba3bb5ccb54f", tileHair: "1527203561188-dae1bc1a417f", tileProducts: "1786937680099-779e1da6f7f7",
    "svc-general": "1706565029539-d09af5896340", "svc-acne": "1693004923522-806dafe5a1a0", "svc-pigmentation": "1693004925174-d9e06209d0ee", "svc-eczema": "1716827173458-8bde30d6c78f",
    "svc-skin-folds": "1544717304-a2db4a7b16ee", "svc-skin-cancer": "1676312754401-d97fe43c2c4b", "svc-hair-loss": "1570554634503-9d0f79c97dd5", "svc-traction": "1527203561188-dae1bc1a417f",
    "svc-scalp": "1613876215075-276fd62c89a4", "svc-breakage": "1632765854612-9b02b6ec2b15", "svc-prp": "1662837775286-7e6258c7c595", "svc-hair-restoration": "1519699047748-de8e457a634e",
    "svc-aesthetic": "1552693673-1bf958298935", "svc-botox-fillers": "1688588162416-f7a7e726e0bf", "svc-chemical-peels": "1713085085470-fba013d67e65", "svc-microneedling": "1761718209852-54ca4210183e",
    "svc-laser": "1761718210089-ba3bb5ccb54f",
    "art-skin": "1693004927824-f2623bbedc8b", "art-hair": "1632765854612-9b02b6ec2b15", "art-acne": "1693004923522-806dafe5a1a0", "art-sun": "1585890483046-9461ebc1dace", "art-general": "1646457417455-77a66a9fcf34"
  },
  highlights: [
    { icon: "users", title: "Expert Dermatologists", text: "Skin, hair and scalp specialists" },
    { icon: "sparkle", title: "Advanced Technology", text: "AI-assisted skin & hair tracking" },
    { icon: "leaf", title: "Personalised Care", text: "Tailored to your unique skin needs" },
    { icon: "home", title: "Modern Facility", text: "Comfortable & relaxing environment" }
  ],
  about: {
    story: "RADIANCE Dermatology & Aesthetics Clinic has a simple mission: to help every individual feel confident in their skin. We combine medical dermatology, hair and scalp care and aesthetic treatments in one welcoming place in Freetown.\n\nWe believe healthy skin starts with understanding it, so education sits alongside treatment: in the clinic, in our awareness campaigns, and in the RADIANCE patient app.",
    values: [{ icon: "leaf", title: "Excellence", text: "Highest standards of care" }, { icon: "shield", title: "Integrity", text: "Honest & transparent advice" }, { icon: "users", title: "Compassion", text: "Your well-being matters" }, { icon: "sparkle", title: "Innovation", text: "Always evolving for better results" }],
    quote: "Radiant skin is a journey, not a destination", quoteSub: "We're here for every step."
  },
  // Before & after results: only real patients, only with written consent recorded by staff.
  gallery: [],
  // Shop: empty until the clinic adds real products and prices (Staff console → Shop).
  products: [],
  shop: { currency: "Le", collect: "Collect at the clinic", deliveryNote: "Delivery in Freetown may be possible. The clinic confirms availability and any delivery cost before you pay." },
  ai: { skin: true, hair: true, coach: true, modelNote: "General-purpose AI model (Claude, Anthropic). Not a validated dermatology device." },
  apptTypes: [
    { id: "initial", name: "Initial dermatology consultation", duration: 30, fee: "", active: true },
    { id: "followup", name: "Follow-up consultation", duration: 20, fee: "", active: true },
    { id: "hair", name: "Hair & scalp assessment", duration: 30, fee: "", active: true },
    { id: "skin", name: "Skin assessment", duration: 30, fee: "", active: true },
    { id: "aesthetic", name: "Aesthetic consultation", duration: 30, fee: "", active: true }
  ],
  // Weekly availability. Empty = the clinic hasn't published hours, so booking takes a preferred
  // day and time of day and the clinic calls to confirm. Format: { 1: ["09:00","17:00"], … } (0 = Sunday)
  availability: { slotMinutes: 30, days: {}, closedDates: [], policy: "" },
  services: [
    { id: "general", cat: "medical", name: "General dermatology", short: "Assessment of skin, hair and nail concerns by the clinical team.", typeId: "initial", published: true, confirmed: false,
      overview: "A first consultation for any skin, hair or nail concern you'd like checked. The clinician takes a history, examines the area and explains what they think is going on and what the options are.",
      concerns: ["Rashes and itchy skin", "Spots, bumps and lumps", "Changes in a mole or mark", "Nail changes", "Anything you're unsure about"],
      involves: "A conversation about when the problem started and what you've tried, an examination, and a plan you agree on together. Some conditions need a test or a follow-up visit before a diagnosis is clear.",
      inPerson: "Most skin conditions are best assessed in person, where the clinician can see the skin in good light and examine it.",
      faq: [["Do I need a referral?", "Ask the clinic when you book. Bring any letters or results you already have."], ["What should I bring?", "Your current skincare and medicines (or photos of the labels), and a short timeline of the problem."]] },
    { id: "acne", cat: "medical", name: "Acne & acne scarring", short: "Care for breakouts and the marks or scars they leave.", typeId: "skin", published: true, confirmed: false,
      overview: "Acne is common at every age and in every skin tone. Treatment depends on the type of spots, how widespread they are and how your skin reacts, and it usually takes weeks to months to judge.",
      concerns: ["Blackheads and whiteheads", "Inflamed spots and cysts", "Dark marks after spots", "Scarring"],
      involves: "Examination of the affected areas, a review of products you use, and a stepwise plan. Prescription treatments are only started after a clinician assesses you.",
      inPerson: "Deep, painful or scarring acne should be seen in person early, because early treatment reduces the risk of permanent scars.",
      faq: [["Will it clear quickly?", "Most acne treatments take 8–12 weeks to show their effect. Your clinician will tell you what to expect for your plan."]] },
    { id: "pigmentation", cat: "medical", name: "Hyperpigmentation & uneven tone", short: "Dark marks, patches and uneven-looking skin tone.", typeId: "skin", published: true, confirmed: false,
      overview: "Darker patches can follow spots, irritation, sun exposure or hormonal changes. Some fade on their own; others need treatment. Working out the cause matters, because the right approach differs.",
      concerns: ["Marks after acne or injury", "Patches on the cheeks or forehead", "Uneven-looking tone", "Darkening after products or procedures"],
      involves: "An examination, a look at your routine and sun habits, and a plan that avoids irritation. Products of unknown origin that promise fast lightening can contain mercury or strong steroids; bring them so the clinician can check.",
      inPerson: "A patch that is changing, raised, bleeding or itchy should be examined in person.",
      faq: [] },
    { id: "eczema", cat: "medical", name: "Eczema & dermatitis", short: "Dry, itchy, inflamed skin and reactions to products.", typeId: "initial", published: true, confirmed: false,
      overview: "Eczema and dermatitis cover several conditions that make skin dry, itchy and inflamed. Triggers can include soaps, fragrances, heat, sweat and specific ingredients.",
      concerns: ["Itchy, dry patches", "Rashes after a new product", "Hand dermatitis", "Flares in children or adults"],
      involves: "A history of flares and triggers, an examination, and a plan for both settling the current flare and preventing the next one.",
      inPerson: "Skin that is weeping, crusting, very painful or spreading quickly should be seen promptly.",
      faq: [] },
    { id: "skin-folds", cat: "medical", name: "Rashes in skin folds (intertrigo)", short: "Red, itchy or burning rashes where skin touches skin.", typeId: "initial", published: true, confirmed: false,
      overview: "Rashes in skin folds, such as under the breasts, in the groin, armpits or between the thighs, are common in warm, humid weather. Friction and moisture irritate the skin, and yeast or bacteria can join in.",
      concerns: ["Redness in skin folds", "Itching or burning", "Darkened or thickened skin in folds", "Rashes that keep coming back"],
      involves: "An examination to tell irritation from infection or another condition, because they look alike and need different care.",
      inPerson: "If the rash has an odour, oozes, spreads or keeps returning, get it checked rather than trying more products.",
      faq: [] },
    { id: "hair-loss", cat: "hair", name: "Hair loss & alopecia assessment", short: "Finding out why hair is thinning, shedding or falling out in patches.", typeId: "hair", published: true, confirmed: false,
      overview: "Hair loss isn't one thing. Alopecia areata, traction alopecia, pattern hair loss and shedding after illness or stress all look different and need different plans. The sooner it's checked, the better the outcome.",
      concerns: ["Patches of hair loss", "Thinning at the hairline or temples", "Widening parting or crown", "Increased shedding", "Hair loss with a sore or itchy scalp"],
      involves: "A history of when it started and your styling, an examination of the scalp and hair, and sometimes tests. You'll leave knowing what's likely going on and what the options are.",
      inPerson: "Sudden or patchy hair loss, or hair loss with pain, redness or scarring, should be assessed in person soon.",
      faq: [["Can a photo tell what kind of hair loss I have?", "No. Photos help track change over time, but the cause needs a clinician's examination and history."]] },
    { id: "traction", cat: "hair", name: "Traction alopecia", short: "Hair loss from tension: braids, weaves, wigs and tight styles.", typeId: "hair", published: true, confirmed: false,
      overview: "Repeated pulling on the same hair, especially at the hairline and temples, can thin it over time. Caught early, it often improves once the tension stops.",
      concerns: ["Thinning edges", "Bumps or soreness after installs", "Styles that feel tight for days"],
      involves: "An examination of the hairline and scalp and practical advice on styling that protects your hair.",
      inPerson: "Long-standing thinning can become permanent, so earlier assessment helps.", faq: [] },
    { id: "scalp", cat: "hair", name: "Scalp health", short: "Flaking, itching, tenderness and scalp rashes.", typeId: "hair", published: true, confirmed: false,
      overview: "Dandruff, dryness, product buildup and several skin conditions can all cause flakes and itch. They look alike, and they need different care.",
      concerns: ["Flakes and dandruff", "Persistent itch", "Tender or sore scalp", "Redness or scaly patches"],
      involves: "An examination of the scalp and a look at your wash routine and products.",
      inPerson: "Painful, weeping or crusted areas, or scalp problems with hair loss, should be examined.", faq: [] },
    { id: "breakage", cat: "hair", name: "Hair breakage & damage", short: "Breakage, dryness and damage from chemicals or heat.", typeId: "hair", published: true, confirmed: false,
      overview: "Breakage along the length is different from hair falling out from the root. Relaxers, colour, heat and handling all play a part, and so can some medical conditions.",
      concerns: ["Short broken pieces", "Thin, fragile ends", "Damage after chemical treatment"],
      involves: "A look at the hair shaft and scalp, your styling history and routine, and a plan to reduce further damage.",
      inPerson: "If you're not sure whether hair is breaking or shedding, an examination can tell.", faq: [] },
    { id: "aesthetic", cat: "aesthetic", name: "Aesthetic consultation", short: "A medical conversation about elective skin treatments.", typeId: "aesthetic", published: true, confirmed: false,
      overview: "An aesthetic consultation is a chance to talk about how you'd like your skin to look and whether a treatment is suitable for you. Suitability depends on your skin, health and expectations, and a qualified professional must assess you first.",
      concerns: ["Uneven-looking texture or tone", "Marks and scars", "Questions about treatments you've heard of"],
      involves: "An assessment of your skin, a frank discussion of benefits, risks, recovery and alternatives, and time to decide. No treatment is pressured on the day.",
      inPerson: "All aesthetic treatments require an in-person assessment.",
      faq: [["Which treatments do you offer?", "Ask the clinic. This website lists specific procedures only once the clinic confirms them."]] }
  ],
  team: [], // { id, name, title, qualifications, specialties, languages, photo, verified:false, published:false }
  campaigns: [
    { id: "hair-not-one-thing", title: "Hair loss isn't one thing", text: "Areata alopecia, traction alopecia, pattern hair loss and more: each needs a different treatment plan. Don't guess. The sooner it's checked, the better the outcome.", cta: "Get evaluated", link: "services/hair-loss", start: "2026-08-21", end: "", published: true, cat: "Hair loss education" },
    { id: "intertrigo", title: "That rash could be intertrigo", text: "Red, itchy or burning skin where skin folds touch? Don't ignore it. Get it checked.", cta: "Get it checked", link: "services/skin-folds", start: "2026-09-20", end: "", published: true, cat: "Skin health" },
    { id: "raise-shine", title: "September is Raise & Shine: Alopecia Awareness Month", text: "Let's raise awareness, show support, and shine together for a world where no one faces alopecia alone.", cta: "Learn about alopecia", link: "learn/alopecia-types", start: "2026-09-01", end: "2026-09-30", published: true, cat: "Alopecia awareness" }
  ],
  articles: [
    { id: "alopecia-types", cat: "Hair loss", title: "Hair loss isn't one thing", summary: "Alopecia areata, traction alopecia and pattern hair loss look different and need different plans.", rel: ["hair", "id", "Open my Hair ID"], service: "hair-loss",
      body: ["\"Alopecia\" simply means hair loss. There are many kinds, and the right plan depends on which one you have.", "Alopecia areata usually causes round, smooth patches of hair loss that can appear quickly. It happens when the immune system targets hair follicles. Hair often regrows, and treatments can help.", "Traction alopecia comes from repeated pulling on the hair, often at the hairline and temples, from tight braids, weaves, wigs, ponytails or extensions. Caught early, it often improves once the tension stops; left for years it can become permanent.", "Pattern hair loss causes gradual thinning, typically at the crown or parting in women and at the temples and crown in men. It tends to run in families and responds best to early treatment.", "Shedding can also increase a few months after illness, childbirth, surgery or major stress, and with some medicines and nutritional problems.", "Because these look alike to the untrained eye, and because some types scar, getting an examination early gives you the best chance of keeping your hair."] },
    { id: "intertrigo", cat: "Skin health", title: "Rashes in skin folds: intertrigo", summary: "Why warm, moist skin folds get irritated, and when to get it checked.", rel: ["skin", "scan", "Document a skin concern"], service: "skin-folds",
      body: ["Intertrigo is inflammation where two areas of skin rub together: under the breasts, in the groin, armpits, between the thighs or in neck folds.", "Heat, sweat and friction break down the skin's surface. The area becomes red, itchy, sore or burning, and in deeper skin tones may look darker or purplish rather than red.", "Yeast or bacteria often take advantage of the damaged skin, which is why some rashes smell, ooze or keep coming back.", "Keeping folds dry, wearing breathable fabrics and avoiding harsh soaps can help. But other conditions look similar, so a rash that doesn't settle, spreads, or keeps returning is worth having examined rather than trying product after product."] },
    { id: "skin-type-vs-sensitivity", cat: "Skin basics", title: "Skin type, sensitivity and dehydration are different things", summary: "Why your skin profile asks about each one separately.", rel: ["skin", "id", "Open my Skin ID"],
      body: ["Skin type describes how much oil your skin tends to produce: oily, dry, combination or balanced. It's fairly stable, though it can shift with age, climate and hormones.", "Sensitivity is about how easily skin reacts with stinging, burning, itching or redness. Oily skin can be sensitive; dry skin can be robust.", "Dehydration describes skin that feels tight or looks dull because it's low in water. Any skin type can feel dehydrated, including oily skin.", "Allergy is different again: an immune reaction to a specific ingredient, such as fragrance or a preservative. A dermatologist can confirm it with patch testing.", "Keeping these separate helps you choose products more precisely and helps your clinician understand your history."] },
    { id: "sun-protection", cat: "Sun protection", title: "Sunscreen for every skin tone", summary: "Deeper skin still benefits from daily protection, especially for dark marks.", rel: ["studio", "routines", "Add sunscreen to a routine"],
      body: ["UV exposure contributes to sun damage and skin cancer in every skin tone, though the risk and how damage shows up differ.", "For people prone to dark marks after breakouts or irritation, UV and visible light can make those marks darker or last longer. Daily sunscreen is one of the most consistently recommended steps.", "Broad-spectrum SPF 30 or higher is a common recommendation. Mineral filters can leave a white cast on deeper skin; tinted formulas are often easier to wear.", "Most people apply too little. About two finger-lengths for the face and neck is a common rule of thumb. Reapply after swimming, sweating or long periods outdoors."] },
    { id: "dark-marks", cat: "Dark spots and uneven tone", title: "Dark marks after spots: what helps", summary: "Marks left after breakouts often fade slowly over months.", rel: ["skin", "scan", "Photograph to track"], service: "pigmentation",
      body: ["Darker marks left after a spot or irritation are very common, particularly in medium and deep skin tones. They usually fade on their own over months.", "The most useful steps are generally preventing new breakouts and irritation, avoiding picking, and daily sun protection.", "Ingredients such as azelaic acid, niacinamide, vitamin C and retinoids appear in products aimed at uneven-looking tone. Harsh scrubs and strong combinations can backfire by causing irritation that leads to more marks.", "If marks are widespread or you aren't sure what they are, a dermatologist can tell you and offer treatments not available over the counter. Avoid products of unknown origin that promise fast lightening; some contain mercury or high-strength steroids."] },
    { id: "porosity", cat: "Hair porosity", title: "Hair porosity, without the myths", summary: "What porosity is, and why a photo or a glass of water can't measure it.", rel: ["hair", "porosity", "Take the porosity questionnaire"],
      body: ["Porosity describes how easily water and products move into and out of the hair shaft. It's influenced by the condition of the cuticle, the outer layer of the hair.", "Chemical treatments, bleach and heat tend to raise porosity, and ends are often more porous than roots because they're older.", "The popular float test isn't reliable on its own: oils, product residue and surface tension change whether a strand floats.", "A better guide is how your hair behaves over time: how quickly it wets and dries, whether products absorb or sit on top, and how long moisture lasts. Treat any result as a tendency, not a fixed label."] },
    { id: "density-vs-thickness", cat: "Hair density", title: "Density vs strand thickness", summary: "How much hair you have is different from how thick each strand is.", rel: ["hair", "id", "Update my Hair ID"],
      body: ["Density is how many strands grow on your scalp: low, medium or high. You can see it by how much scalp shows when hair is parted or pulled back.", "Strand thickness is the width of a single hair: fine, medium or coarse. You can compare one strand to a sewing thread between your fingers.", "It's common to have high density with fine strands, or low density with coarse strands. Both affect which products feel heavy and how styles hold.", "Coily and tightly textured hair can show more scalp at certain angles and shrinks considerably, so photos of density should always be taken the same way each time."] },
    { id: "traction", cat: "Hair breakage", title: "Protective styles without the pull", summary: "Tension is the main thing to watch around the hairline.", rel: ["studio", "styles", "Track a style"], service: "traction",
      body: ["Braids, locs, weaves, wigs and tight ponytails can protect ends and reduce daily handling, but repeated tension on the same follicles, especially at the hairline and temples, can lead to thinning over time.", "Warning signs include pain, tenderness, small bumps at the base of braids, or a style that still feels tight after a few days.", "Lighter, looser installs, varying where tension falls, and breaks between styles all reduce strain. Edges usually benefit from the least tension and heat.", "Early hairline thinning from tension is often reversible if caught early. If you notice it, book an assessment."] },
    { id: "scalp-flaking", cat: "Scalp health", title: "Flakes, itch and buildup", summary: "Several different things look similar on the scalp.", rel: ["hair", "scan", "Document your scalp"], service: "scalp",
      body: ["Flaking can come from dry skin, product buildup, infrequent washing, or common skin conditions that need specific treatment. They can look alike in photos.", "Buildup often improves with a thorough or clarifying wash. Dryness often improves with gentler cleansing.", "Persistent flaking with redness, greasy yellowish scale, itching that disturbs sleep, sores, or patches of hair loss are reasons to see a dermatologist rather than keep trying products."] },
    { id: "patch-test", cat: "Product ingredients", title: "Introducing new products safely", summary: "One at a time, and patch test first.", rel: ["studio", "compat", "Check product overlaps"],
      body: ["Introducing one new product at a time, with a week or two in between, makes it much easier to tell what suits you and what doesn't.", "A simple home patch test: apply a little of the product to a small area, such as behind the ear or the inner arm, once or twice a day for several days and watch for redness, itching or swelling. It doesn't rule out every reaction.", "Strong actives such as retinoids and exfoliating acids are usually started a few times a week, building up slowly.", "If you react, stop the product, write down what happened, and contact the clinic or a pharmacist if it doesn't settle."] },
    { id: "when-to-see", cat: "When to seek care", title: "When to see a dermatologist", summary: "Signs that a skin, hair or nail problem needs a professional look.", rel: ["pro", "prep", "Prepare for an appointment"],
      body: ["Book an appointment if a skin problem hasn't improved after a few weeks of sensible care, keeps coming back, or is affecting your sleep, work or confidence.", "Get seen soon for a mole or mark that is new, changing, bleeding or different from your others; sudden or patchy hair loss; or a rash that is spreading, painful or blistering.", "Seek urgent care for a rapidly spreading painful red area with fever, widespread blistering or peeling skin, or swelling of the face, lips or tongue, especially with difficulty breathing.", "Photos and apps can help you keep a record, but they can't replace an examination."] },
    { id: "consult-prep", cat: "When to seek care", title: "Getting the most from your appointment", summary: "Bring a timeline, products and your questions.", rel: ["pro", "prep", "Prepare a report"],
      body: ["Appointments are short. A clear history helps: when the problem started, how it has changed, what you've tried, and what made it better or worse.", "Bring a list of products with ingredients, or the packaging. Photos taken in similar light over time are useful, particularly for things that come and go.", "Write your questions down beforehand and put the most important first.", "Ask how long before you should expect a change, what side effects to watch for, and when to come back."] }
  ]
};

const svcStub = (id, cat, name, short, overview, involves, inPerson, typeId) => ({ id, cat, name, short, overview, concerns: [], involves, inPerson, faq: [], typeId, published: true, confirmed: false });
CLINIC_DEFAULTS.services.find(s => s.id === "eczema").name = "Eczema & psoriasis";
CLINIC_DEFAULTS.services.find(s => s.id === "skin-folds").name = "Rashes & allergies";
CLINIC_DEFAULTS.services.find(s => s.id === "skin-folds").short = "Red, itchy or burning rashes, including skin-fold rashes (intertrigo) and reactions.";
CLINIC_DEFAULTS.services.find(s => s.id === "hair-loss").name = "Hair loss treatment";
CLINIC_DEFAULTS.services.find(s => s.id === "scalp").name = "Scalp conditions";
CLINIC_DEFAULTS.services.find(s => s.id === "general").name = "Medical dermatology";
CLINIC_DEFAULTS.services.splice(5, 0, svcStub("skin-cancer", "medical", "Skin cancer screening", "Early detection saves lives: checks of moles and changing marks.", "A skin check looks at moles, spots and marks that are new, changing, bleeding or different from the rest. Skin cancer can occur in every skin tone, including on the palms, soles and under the nails, which are commonly affected in darker skin.", "A full or targeted skin examination, and a plan if anything needs watching, testing or removing.", "Any mole or mark that is changing, bleeding, itchy or new should be examined in person. Photos can't rule out skin cancer.", "skin"));
CLINIC_DEFAULTS.services.push(
  svcStub("prp", "hair", "PRP therapy", "A treatment option for some types of hair loss, after assessment.", "Platelet-rich plasma (PRP) uses a concentrate from your own blood, injected into the scalp. It may help some kinds of hair loss and not others, so it's only considered after the cause has been assessed.", "A hair loss assessment first. If PRP is suitable, the clinician explains the number of sessions, what to expect, side effects and alternatives.", "Requires an in-person assessment and treatment in the clinic.", "hair"),
  svcStub("hair-restoration", "hair", "Hair restoration", "Long-term plans to support regrowth and protect existing hair.", "Hair restoration covers the treatments and changes that help regrowth and protect the hair you have. The right plan depends entirely on the type of hair loss.", "Assessment of the cause, then a plan that may combine treatments, styling changes and follow-up photos.", "Requires an in-person assessment.", "hair"),
  svcStub("botox-fillers", "aesthetic", "Botox & fillers", "Injectable treatments to smooth, refresh and enhance.", "Anti-wrinkle injections and dermal fillers are medical treatments. Whether they suit you depends on your health, skin and goals, and on an honest discussion of risks and results.", "A consultation covering suitability, risks, recovery, aftercare and alternatives before any treatment. You can take time to decide.", "Must be assessed and performed in person by a qualified professional.", "aesthetic"),
  svcStub("chemical-peels", "aesthetic", "Chemical peels", "Renewing the skin's surface for tone and texture.", "A chemical peel applies a solution that removes the outer layers of skin. In deeper skin tones, peel choice and strength matter, because the wrong peel can cause dark marks.", "Assessment of your skin and history, a patch or test area if needed, and clear aftercare including sun protection.", "Must be assessed in person.", "aesthetic"),
  svcStub("microneedling", "aesthetic", "Microneedling", "Supporting collagen for texture and scarring.", "Microneedling makes tiny controlled punctures in the skin to stimulate repair. It's used for some acne scars and texture concerns.", "An assessment of suitability, the number of sessions usually needed, downtime and aftercare.", "Must be assessed and performed in person.", "aesthetic"),
  svcStub("laser", "aesthetic", "Laser treatments", "Targeted treatments, chosen for your skin type.", "Lasers can treat some pigmentation, hair and texture concerns. Laser type and settings must suit your skin tone to avoid burns or dark marks.", "An assessment of whether a laser is the right tool for you, a test patch if needed, and aftercare.", "Must be assessed and performed in person.", "aesthetic"));
CLINIC_DEFAULTS.articles.forEach(a => { a.published = true; a.reviewer = ""; a.reviewedOn = ""; a.written = "2026-10-12"; });

const LSK = { content: "radiance:content", ops: "radiance:ops", staff: "radiance:staff-session" };
const lsGet = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const clone = o => JSON.parse(JSON.stringify(o));

/* Clinic = content + operational records (bookings, enquiries, care plans, notes, audit). */
const Clinic = {
  c: clone(CLINIC_DEFAULTS),
  ops: { bookings: [], enquiries: [], orders: [], carePlans: [], notes: [], reviews: [], audit: [], staff: [] },
  localEdits: false,
  load() {
    const c = lsGet(LSK.content); if (c && c.version === 1) { this.c = Object.assign(clone(CLINIC_DEFAULTS), c); this.c.photos = Object.assign(clone(CLINIC_DEFAULTS.photos), c.photos || {}); if (!c.photos) CLINIC_DEFAULTS.services.forEach(d => { if (!this.c.services.some(x => x.id === d.id)) this.c.services.push(clone(d)); }); this.localEdits = true; }
    const o = lsGet(LSK.ops); if (o) this.ops = Object.assign(this.ops, o);
  },
  /* On a real host, content.json (exported from the console) is the published version for everyone. */
  async loadPublished() {
    if (!/^https?:/.test(location.protocol) || window.claude) return;
    try {
      const r = await fetch("content.json", { cache: "no-cache" }); if (!r.ok) return;
      const remote = await r.json();
      if (remote?.version === 1 && (!this.localEdits || remote.updatedAt > this.c.updatedAt)) { Object.assign(this.c, remote); this.syncArticles(); render(); }
    } catch (e) { /* no published content file: defaults stand */ }
  },
  syncArticles() { ARTICLES.splice(0, ARTICLES.length, ...this.c.articles.filter(a => a.published)); },
  saveContent(what) { this.c.updatedAt = nowISO(); this.localEdits = true; lsSet(LSK.content, this.c); this.syncArticles(); if (what) audit(what); if (Backend.sb) Backend.saveContent(this.c); },
  saveOps() { if (!lsSet(LSK.ops, this.ops)) toast("This browser's storage is full. Export and clear older records."); },
  svc: id => Clinic.c.services.find(s => s.id === id),
  type: id => Clinic.c.apptTypes.find(t => t.id === id),
  photo(key, w = 1200) { const v = this.c.photos?.[key] ?? CLINIC_DEFAULTS.photos[key]; if (!v) return ""; return v.startsWith("data:") ? v : `https://images.unsplash.com/photo-${v}?auto=format&fit=crop&w=${w}&q=72`; },
  liveCampaigns() { const t = dayKey(); return this.c.campaigns.filter(c => c.published && (!c.start || c.start <= t) && (!c.end || c.end >= t)); }
};
const ARTICLES = [];

function audit(action, detail = "") {
  const who = Staff.session ? `${Staff.session.name} (${Staff.session.role})` : "system";
  Clinic.ops.audit.unshift({ id: uid(), at: nowISO(), who, action, detail });
  Clinic.ops.audit.length = Math.min(Clinic.ops.audit.length, 500); Clinic.saveOps();
  if (Backend.sb) Backend.insert("audit_events", { action, detail, actor_name: who }).catch(() => {});
}

/* ---------- Backend: Supabase when configured, otherwise this device ---------- */
const Backend = {
  sb: null, user: null, ready: false, error: null,
  get configured() { return !!(CONFIG.supabase.url && CONFIG.supabase.anonKey); },
  async init() {
    if (!this.configured) { this.ready = true; return; }
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
      this.sb = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
      const { data } = await this.sb.auth.getSession(); this.user = data.session?.user || null;
      this.sb.auth.onAuthStateChange((_e, session) => { this.user = session?.user || null; Store.onAuth(); render(); });
      const { data: row } = await this.sb.from("clinic_content").select("json").eq("id", 1).maybeSingle();
      if (row?.json?.version === 1) { Object.assign(Clinic.c, row.json); Clinic.syncArticles(); }
    } catch (e) { this.error = "Couldn't reach the clinic's secure database. Check your connection."; this.sb = null; }
    this.ready = true; render();
  },
  async signIn(email, password) { const { error } = await this.sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
  async signUp(email, password, name) { const { data, error } = await this.sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: location.origin + location.pathname + "#app" } }); if (error) throw error; return data; },
  async reset(email) { const { error } = await this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + "#app" }); if (error) throw error; },
  async signOut() { await this.sb.auth.signOut(); },
  /* patient record documents (same shape as the claude.ai db refs the Store already uses) */
  doc(key) {
    const sb = this.sb, uidv = () => this.user.id;
    return {
      async get() { const { data, error } = await sb.from("patient_docs").select("data").eq("user_id", uidv()).eq("key", key).maybeSingle(); if (error) throw error; return { exists: !!data, data: () => data?.data }; },
      async set(v) { const { error } = await sb.from("patient_docs").upsert({ user_id: uidv(), key, data: v, updated_at: nowISO() }); if (error) throw error; },
      async delete() { const { error } = await sb.from("patient_docs").delete().eq("user_id", uidv()).eq("key", key); if (error) throw error; }
    };
  },
  async insert(table, row) { // id made here so visitors without read access (e.g. guest bookings) can still insert
    row = { id: crypto.randomUUID(), ...row }; const { error } = await this.sb.from(table).insert(row); if (error) throw error; return row; },
  async update(table, id, patch) { const { error } = await this.sb.from(table).update(patch).eq("id", id); if (error) throw error; },
  async saveContent(c) { try { const { error } = await this.sb.from("clinic_content").upsert({ id: 1, json: c, updated_at: nowISO() }); if (error) throw error; toast("Published for everyone"); } catch (e) { toast("Saved here, but publishing failed: " + (e.message || "permission denied")); } },
  async pullOps() { // staff: bookings, enquiries, plans, notes the signed-in role may read (RLS decides)
    const t = async (n) => { const { data } = await this.sb.from(n).select("*").order("created_at", { ascending: false }).limit(500); return (data || []).map(r => r.json ? { ...r.json, id: r.id } : r); };
    const [b, e, p, n, a] = await Promise.all([t("bookings"), t("enquiries"), t("care_plans"), t("clinical_notes"), t("audit_events")]);
    Object.assign(Clinic.ops, { bookings: b, enquiries: e, carePlans: p, notes: n, audit: a.map(x => ({ id: x.id, at: x.created_at, who: x.actor_name, action: x.action, detail: x.detail })) });
  }
};
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("script")); document.head.append(s); }); }

/* Record writes for bookings / enquiries / plans / notes go through here so both modes behave the same. */
const Ops = {
  async add(kind, rec) {
    if (Backend.sb) { const row = await Backend.insert(TABLES[kind], { json: rec, patient_id: rec.patientId || null, status: rec.status || null }); rec.id = row.id; }
    Clinic.ops[kind].unshift(rec); Clinic.saveOps(); return rec;
  },
  async patch(kind, rec, patch, what) {
    Object.assign(rec, patch, { updatedAt: nowISO() });
    if (Backend.sb) await Backend.update(TABLES[kind], rec.id, { json: rec, status: rec.status || null });
    Clinic.saveOps(); if (what) audit(what, rec.ref || rec.id);
  }
};
const TABLES = { bookings: "bookings", enquiries: "enquiries", carePlans: "care_plans", notes: "clinical_notes", reviews: "assessment_reviews" };

/* Netlify Forms: real delivery to the clinic's inbox when the site is hosted on Netlify. */
const Forms = {
  get available() { return /^https?:/.test(location.protocol) && !window.claude && !/localhost|127\.0\.0\.1/.test(location.hostname); },
  async send(name, fields) {
    const body = new URLSearchParams({ "form-name": name, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, String(v ?? "")])) });
    const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!r.ok) throw new Error("form_" + r.status); return true;
  }
};
const waLink = text => `https://wa.me/${Clinic.c.info.whatsapp}?text=${encodeURIComponent(text)}`;

/* Server AI bridge for hosting outside claude.ai. Same call shape as claude.ai's `sample`. */
async function serverAI() {
  if (!/^https?:/.test(location.protocol) || !CONFIG.aiEndpoint) return null;
  try { const r = await fetch(CONFIG.aiEndpoint, { method: "GET" }); if (!r.ok) return null; const j = await r.json(); if (!j.configured) return null; } catch (e) { return null; }
  const toB64 = b => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(",")[1]); f.onerror = rej; f.readAsDataURL(b); });
  const call = async (input, opts = {}) => {
    const images = []; for (const b of opts.images || []) images.push({ media_type: b.type || "image/jpeg", data: await toB64(b) });
    let r;
    try { r = await fetch(CONFIG.aiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, images }), signal: opts.signal }); }
    catch (e) { if (e.name === "AbortError") throw { code: "cancelled" }; throw { code: "network", message: "The AI service couldn't be reached. Check your connection." }; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw { code: j.code || (r.status === 429 ? "rate_limited" : "provider_error"), message: j.message };
    opts.onText?.({ text: j.text, delta: j.text }); return { text: j.text, truncated: !!j.truncated };
  };
  const fn = (input, opts) => call(input, opts);
  fn.json = async (input, opts) => { const { text } = await call(input, opts); try { return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()); } catch (e) { throw { code: "invalid_json" }; } };
  fn.limits = async () => ({ images: true });
  return fn;
}

/* ---------- Routing between the three surfaces ---------- */
let SURFACE = "site";
function setHash(h) { const n = "#" + h; if (location.hash !== n) { try { history.pushState(null, "", n); } catch (e) {} } }
window.addEventListener("popstate", () => { routeFromHash(); render(); });
function routeFromHash() {
  const h = decodeURIComponent((location.hash || "").replace(/^#\/?/, ""));
  if (h === "app" || h.startsWith("app/")) { SURFACE = "app"; const p = h.split("/")[1]; if (p && PAGES[p]) R = { page: p, tab: null, id: null }; }
  else if (h === "staff" || h.startsWith("staff/")) { SURFACE = "staff"; SR.staffPage = h.split("/")[1] || "overview"; }
  else { SURFACE = "site"; SR.path = h; }
}
function render() {
  if (SURFACE === "site") return renderSite();
  if (SURFACE === "staff") return renderStaff();
  if (Backend.configured && !Backend.user) return renderPortalAuth();
  return renderApp();
}

/* ---------- Brand helpers ---------- */
const logoImg = (h = 40) => `<img src="${LOGO_ICON}" alt="" width="${Math.round(h * 0.717)}" height="${h}" style="height:${h}px;width:auto;display:block">`;
const brandLockup = (sub = "") => `<span class="lockup"><span class="mark">${logoImg(30)}</span><span><b>RADIANCE</b><small>${sub ? esc(sub) : "Dermatology &amp; Aesthetic Clinic"}</small></span></span>`;
const portalBanner = () => Backend.sb ? "" : (S().example ? "" : `<div class="notice" style="margin-bottom:16px">${ic("shield")}<div class="grow small"><b>Device mode.</b> Your records are saved on this device only and aren't visible to the clinic unless you attach them to a booking. Secure accounts switch on when the clinic connects its patient database.</div></div>`);
const myBookings = () => Clinic.ops.bookings.filter(b => b.patientId && b.patientId === (Backend.user?.id || S().patientId));
const myCarePlans = () => Clinic.ops.carePlans.filter(p => p.patientId && p.patientId === (Backend.user?.id || S().patientId) && p.status !== "draft");
Clinic.load(); Clinic.syncArticles();
