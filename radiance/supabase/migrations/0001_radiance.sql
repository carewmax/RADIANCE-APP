-- RADIANCE platform schema (Supabase / PostgreSQL)
-- Run once in the Supabase SQL editor, then put the project URL and anon key into CONFIG.supabase (src/2-core.js).
-- Every table has row-level security. The browser only ever holds the public anon key.

create extension if not exists "pgcrypto";

-- ───────── Roles ─────────
create table staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name    text not null,
  role    text not null check (role in ('clinician','admin','support')),
  active  boolean not null default true,
  created_at timestamptz not null default now()
);
create or replace function staff_role() returns text language sql stable security definer set search_path = public as $$
  select role from staff_roles where user_id = auth.uid() and active
$$;

-- ───────── Website content (one row, edited in the staff console) ─────────
create table clinic_content (id int primary key check (id = 1), json jsonb not null, updated_at timestamptz not null default now());

-- ───────── Patient records (patient app documents: profile, Skin ID, Hair ID, photos, routines…) ─────────
create table patient_docs (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null,                 -- 'state' or 'photo_<id>'
  data    jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ───────── Operations ─────────
create table bookings (
  id uuid primary key, patient_id uuid references auth.users(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','confirmed','completed','cancelled','no-show')),
  json jsonb not null, created_at timestamptz not null default now()
);
create index on bookings (status, created_at desc);
create table enquiries (id uuid primary key, patient_id uuid, status text default 'new', json jsonb not null, created_at timestamptz not null default now());
create table care_plans (id uuid primary key, patient_id uuid references auth.users(id) on delete set null, status text, json jsonb not null, created_at timestamptz not null default now());
create table clinical_notes (id uuid primary key, patient_id uuid, status text, json jsonb not null, created_at timestamptz not null default now());
create table assessment_reviews (id uuid primary key, patient_id uuid, status text, json jsonb not null, created_at timestamptz not null default now());
create table audit_events (id uuid primary key default gen_random_uuid(), actor_id uuid default auth.uid(), actor_name text, action text not null, detail text, created_at timestamptz not null default now());

-- ───────── Row-level security ─────────
alter table staff_roles enable row level security;
create policy own_role on staff_roles for select using (user_id = auth.uid() or staff_role() = 'admin');
create policy admin_manage on staff_roles for all using (staff_role() = 'admin') with check (staff_role() = 'admin');

alter table clinic_content enable row level security;
create policy anyone_reads on clinic_content for select using (true);
create policy admin_writes on clinic_content for all using (staff_role() = 'admin') with check (staff_role() = 'admin');

alter table patient_docs enable row level security;
create policy owner_only on patient_docs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table bookings enable row level security;
-- anyone (including guests) may request; a signed-in patient can only attach their own id
create policy request on bookings for insert with check (status = 'requested' and (patient_id is null or patient_id = auth.uid()));
create policy patient_reads on bookings for select using (patient_id = auth.uid() or staff_role() is not null);
create policy patient_cancels on bookings for update using (patient_id = auth.uid()) with check (patient_id = auth.uid() and status = 'cancelled');
create policy staff_updates on bookings for update using (staff_role() is not null) with check (staff_role() is not null);
create policy staff_creates on bookings for insert with check (staff_role() is not null);

alter table enquiries enable row level security;
create policy anyone_sends on enquiries for insert with check (status = 'new');
create policy desk_reads on enquiries for select using (staff_role() in ('admin','support'));
create policy desk_updates on enquiries for update using (staff_role() in ('admin','support'));

alter table care_plans enable row level security;
create policy patient_reads_plan on care_plans for select using (patient_id = auth.uid() or staff_role() = 'clinician');
create policy clinician_writes_plan on care_plans for insert with check (staff_role() = 'clinician');
create policy clinician_updates_plan on care_plans for update using (staff_role() = 'clinician');

alter table clinical_notes enable row level security;
create policy clinician_notes on clinical_notes for all using (staff_role() = 'clinician') with check (staff_role() = 'clinician');
-- finalised notes are amended, never overwritten (enforced in the app; add a trigger before go-live if required)

alter table assessment_reviews enable row level security;
create policy clinician_reviews on assessment_reviews for all using (staff_role() = 'clinician') with check (staff_role() = 'clinician');

alter table audit_events enable row level security;
create policy staff_log on audit_events for insert with check (staff_role() is not null);
create policy admin_reads_log on audit_events for select using (staff_role() = 'admin');

-- ───────── First administrator ─────────
-- 1. Create the user in Supabase → Authentication → Users.
-- 2. insert into staff_roles (user_id, name, role) values ('<that user id>', 'Clinic Manager', 'admin');
-- Then add clinicians and support staff the same way.
