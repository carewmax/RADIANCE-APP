# RADIANCE Dermatology & Aesthetics Clinic: digital platform

One codebase, three connected experiences, built around the clinic's own logo and blue-and-green campaign style:

| Experience | Open it at | Who it's for |
|---|---|---|
| **Clinic website** | `/` (Home, About, Dermatology, Hair & Scalp, Aesthetics, AI Analysis, Specialists, Learn, Contact, Book) | Everyone |
| **Patient app** | `/#app` or "Patient portal" | Patients: skin & hair profiles, guided photos, care plans, appointments |
| **Staff console** | `/#staff` or "Staff sign-in" in the footer | Clinicians, administrators, support staff |

All three share one data model: a booking made on the website appears in the staff console; a care plan a clinician issues appears in the patient's app; content an administrator edits appears on the website.

## Design

The public website follows the clinic's approved reference design: deep-teal photo banners with the header over the photo, white circle logo, mint-green "Book Appointment" buttons, photo service cards, a teal footer, and the reference's page set (Home, About, Services, AI Analysis, Gallery, Before & After, Blog, Contact, Book).

**Photos** are free-licence Unsplash images loaded from Unsplash's image server. They show models, not patients. Replace any of them with the clinic's own photos in Staff console → Photos. If a photo can't load, a teal panel with the logo shows instead. **Before & after** results are empty until staff upload real patient photos with written consent recorded (Staff console → Before & after).

## Quick start

```bash
npm run build        # src/ → dist/index.html (+ logo, robots, sitemap, content.json)
npm test             # Playwright smoke test of all three experiences, desktop + phone
```

**Deploy:** connect this repo to Netlify (the included `netlify.toml` builds `dist/` and deploys the AI function), or drag the `dist/` folder into Netlify for a static-only launch.

## Three levels of "live"

The platform works at every level and always tells the user honestly which level it's on.

| Level | What you do | What works |
|---|---|---|
| **1. Static on Netlify** | Deploy `dist/` | Full website. **Bookings and contact messages are delivered to the clinic** through Netlify Forms (Site → Forms; turn on email notifications). Patient app works with records on the patient's own device. Staff console runs as a labelled demo. |
| **2. + AI** | Add `ANTHROPIC_API_KEY` in Netlify environment variables | AI photo observations and the Skin & Hair Guide switch on automatically through `netlify/functions/ai.mjs`. The key stays on the server. |
| **3. + Supabase** | Run `supabase/migrations/0001_radiance.sql`, put the URL and anon key in `CONFIG.supabase` (`src/2-core.js`), add staff to `staff_roles` | Real patient accounts (sign-up, email verification, password reset), records synced across devices, shared booking system with live availability and conflict checks, staff sign-in with roles, care plans delivered to patients' apps, published website edits for everyone, audit log in the database. |

## Editing the website without code

Staff console → **Website & contact / Services / Clinical team / Articles / Campaigns / Scheduling / AI settings**.

- On level 3, changes publish for everyone immediately.
- On levels 1–2, changes show on the editor's device. Click **Export content.json**, replace `content.json` in this repo, and redeploy.

## Before launch: the clinic must confirm

Nothing was invented. These are deliberately empty or flagged until the clinic supplies them:

- **Opening hours**: empty, so the site says "call to confirm".
- **Clinical team**: no profiles. Add them in the console; they show publicly only after "verified" is ticked.
- **Services**: 16 services. The reference design names specific procedures (Botox & fillers, chemical peels, microneedling, laser, PRP, hair restoration, skin cancer screening): they are on the site because the design shows them, but the clinic must confirm it offers each one. All are drafted from the reference and the clinic's own posts (hair loss, alopecia, intertrigo, acne & dark marks, etc). Each is marked "Check" until a clinician confirms the wording. No named procedures, prices or outcomes.
- **Articles**: 12 plain-language articles, each labelled "Awaiting review by a RADIANCE clinician" until a reviewer is added.
- **Address, phone, email**: taken from the clinic's campaign graphics (59 Upper Big Waterloo Street, +232 74 898964, info@radiancederm.org). Confirm before launch.
- **Logo**: extracted from the clinic's artwork. Replace `public/logo-*.png` and `src/2a-assets.js` with the original vector file when available.
- **Photos**: none of patients or the clinic are used. Upload a licensed hero photo in the console. Never use patient photos without written consent.
- **Privacy notice and terms**: drafts. Have them reviewed against Sierra Leonean law.

## Project layout

```
src/1-head.html          Design tokens (brand colours, fonts), all CSS, Netlify form registration
src/2-core.js            CONFIG (Supabase keys, AI endpoint), utilities, icons
src/2a-assets.js         Embedded logo images
src/2b-clinic.js         Website content, shared data layer, Supabase backend, Netlify Forms, AI bridge, routing
src/3-9 *.js             Patient app: store, shell, onboarding/dashboard, Skin & Hair Labs, Care Studio, Progress, Guide, Learn, Appointments & care, settings
src/10-site.js           Public website pages
src/11-booking.js        Booking wizard (slots from published availability, or request mode)
src/12-staff.js          Clinician + admin + support console
src/13-boot.js           Patient sign-in (Supabase) and startup
netlify/functions/ai.mjs Server-side Claude bridge
supabase/migrations/     Database schema with row-level security
tests/smoke.test.mjs     End-to-end test
docs/STATUS.md           Real vs demo, services needing configuration, AI limits, launch checklist
```

## Phone app layout

On phones (and inside the Android app) the site switches to an app layout based on the clinic's mobile mockup: splash screen, slim header, photo banners with a rounded white sheet, and a bottom tab bar (Home · Services · Book · Gallery · Account). Extra phone screens: AI Skin Analysis, Hair & Scalp Analysis, My Account, Sign in, Appointments, Notifications, Shop, Shopping Bag, Checkout, Order Confirmation, Order History. Desktop keeps the full website. Code: `src/10b-mobile.js` (+ "Phone app layout" CSS in `src/1-head.html`).

**Shop:** hidden until staff publish at least one product with a real price (Staff console → Shop). Checkout sends an *order request* through Netlify Forms (`shop-order`): nothing is paid in the app, and the clinic confirms stock, total and payment.

**Notifications** come only from real events: your bookings, orders, clinician care plans and the clinic's live campaigns.

## Making it an Android app (APK via GitHub)

`.github/workflows/android-apk.yml` (at the **repository root**, next to the `radiance/` folder) builds the APK with Capacitor on GitHub. The app icon, splash and status bar colour come from `android-res/`.

1. Deploy the site on Netlify (Base directory: `radiance`) and copy its URL.
2. GitHub → **Settings → Secrets and variables → Actions → Variables**: add `SITE_URL` = your Netlify URL. The app loads the live site, so bookings, forms and AI work, and **design updates reach the app as soon as Netlify redeploys**. You only rebuild the APK to change the icon, name or permissions.
3. **Actions → Build Android APK → Run workflow**, then download **radiance-apk** from the run's Artifacts and install `app-debug.apk`.

That's a debug-signed APK for testing and direct sharing. Google Play needs a signed release build and a Play developer account. Push notifications need Firebase Cloud Messaging.
