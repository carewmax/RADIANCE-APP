# What's real, what's demo, what still needs setting up

## Working now (tested end to end, desktop and phone)

**Website:** all pages from the brief; announcement bar; campaign cards in the clinic's pattern style with start/end dates; service detail pages with FAQs and related reading; education library with search and categories; contact page with validation; footer with policies, AI limitations, accessibility, cookie information and staff sign-in; SEO title, description and MedicalClinic structured data.

**Booking:** 5-step wizard (service → clinician → date & time → details → review). Exact slots appear only when the clinic publishes weekly hours in the console; until then patients request a day and time of day. Overlap checks prevent double-booking. Patients can attach chosen photo assessments with explicit consent. The result screen states exactly what happened: sent to the clinic, or saved on the device only with a WhatsApp fallback.

**Patient app:** onboarding with consent; Skin ID and face map; Hair ID with porosity, density, strand thickness, pattern, scalp and styling history, each showing its source (your answer / questionnaire / AI-assisted / clinician); guided capture for face and 8 hair/scalp views; on-device blur, light and glare checks; scan history, comparison slider, routines, wash day, protective styles, products, reaction diary, timeline, reports; Appointments & care with booking status, clinician care plans the patient can tick off, questions for the clinician and a consultation report builder; Radiance Skin & Hair Guide chat; export and delete.

**Staff console:** role-based (clinician / administrator / support) with least privilege. Administrators cannot open clinical records. Appointments list and week view; confirm, reschedule, assign, complete, no-show and cancel with clash detection; phone bookings. Clinician patient records keep patient-entered, AI-generated and clinician-recorded information visually separate; AI assessment review with the clinician's own findings (never copied from the AI); structured clinical notes with draft → finalised → amendment workflow; care plans issued to the patient's app. Admin: website content, hero image upload, contact details and hours, services (publish / clinic-confirmed), clinical team (verify before publish), articles (clinical reviewer), campaigns, scheduling (availability, closed dates, appointment types, policy), staff roles, AI on/off switches, aggregate reports, audit log, content export/import.

## Demo or device-only until configured

| Feature | Without setup | Needs |
|---|---|---|
| Staff console | Demo role picker, data on that browser only | Supabase (level 3) |
| Patient records | Saved on the patient's own device | Supabase accounts |
| Care plans reaching patients | Only when clinician and patient use the same browser (demo) | Supabase |
| Bookings | Netlify Forms inbox (level 1); the staff console doesn't see them until Supabase is on | Supabase for the shared booking system |
| AI observations and chat | Clearly marked "not switched on" | `ANTHROPIC_API_KEY` on Netlify |

## Not built yet (no fake versions anywhere)

- SMS / WhatsApp / email appointment reminders: needs a messaging provider (e.g. Twilio, Africa's Talking).
- Secure two-way patient–clinic messaging.
- Payments or deposits: needs a provider (Monime, Orange Money, cards) with verified webhooks.
- Teleconsultation video.
- Native push notifications and a published app-store build.
- Multilingual content (structure supports it; translations need clinical review).

## AI: limits and validation

- The model is a general-purpose AI (Claude, Anthropic), not a validated dermatology device. It describes visible features only and is instructed never to diagnose, prescribe, measure porosity / follicles / growth, or reassure that skin is "healthy".
- Unusable photos are rejected before and after analysis; failures save nothing.
- Performance has **not** been evaluated across skin tones, hair textures or lighting conditions. Do that with the clinic's clinicians before relying on it, and record the results.
- Patient photos are never used for training. The clinic can switch each AI feature off in the console.

## Before real patients use it

1. Clinic confirms address, phone, hours, services wording, team profiles and article reviews (see README).
2. Legal review of the privacy notice and terms; confirm data-protection obligations in Sierra Leone and retention rules for clinical records.
3. Supabase project in a suitable region, with backups enabled; create staff accounts; turn on email verification.
4. Security review: test that patients can't read each other's data and that each staff role sees only what it should (the RLS policies are written for this but must be tested on the live project).
5. Clinical review of the AI features with real (consented) photos across skin tones; decide which to keep on.
6. Note: in this version the booking record's reason and shared assessments are readable by any staff role at the database level; the console hides them from admin and support. For stricter separation, move clinical fields into their own clinician-only table.
7. This platform hasn't been certified as a medical device. Check whether local regulation applies before adding any diagnostic feature.
