-- JDWNRH buildable-now slice: wait-time transparency, bilingual UI support,
-- family/caregiver accounts. See docs/designs/jdwnrh-hospital-booking.md.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Departments (multi-department, per design review Pass 1A)
-- ---------------------------------------------------------------------
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_dz text, -- Dzongkha name, nullable until translator dependency resolves
  phone_number text, -- for the "call this department" action (Pass 3B)
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Wait-time reports (public/anonymous submission allowed; tied to an
-- account when the submitter is logged in, per design review Pass 6/7)
-- ---------------------------------------------------------------------
create table wait_reports (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  wait_minutes integer not null check (wait_minutes >= 0 and wait_minutes <= 1440),
  reporter_id uuid references auth.users(id) on delete set null, -- null = anonymous
  created_at timestamptz not null default now()
);

create index wait_reports_department_recent_idx
  on wait_reports (department_id, created_at desc);

-- Per-device/session rate limit is enforced at the application layer
-- (device fingerprint or session token, not a DB column) -- see
-- lib/wait-time/rate-limit.ts. Not enforceable purely in SQL without a
-- stable per-device identity, which anonymous submissions don't have.

-- ---------------------------------------------------------------------
-- Patient and caregiver profiles (both get phone-OTP accounts --
-- design review Pass 3A: patients need their own account to approve
-- caregiver-link requests, not just be linked by a caregiver's claim)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Caregiver-patient links: many-to-many (Pass 7A), with a time-boxed
-- grace-linking fallback for patients who cannot self-approve
-- (Pass 3A -- the critical gap this table resolves).
--
-- Only 3 states are stored. 'provisional' is deliberately NOT a stored
-- state -- it's derived at read time from (status = 'pending' AND
-- grace_expires_at has passed). See lib/caregiver/grace-linking.ts for
-- why: a stored transition would need to be written by something other
-- than the patient, which would either require a service-role cron job
-- or weakening the RLS policy below to let the caregiver write their own
-- status -- both worse than computing it on read.
-- ---------------------------------------------------------------------
create type caregiver_link_status as enum (
  'pending',   -- request sent, patient hasn't responded yet (may be
               -- effectively 'provisional' by now -- check grace_expires_at)
  'approved',  -- patient explicitly approved
  'revoked'    -- patient revoked (from pending or approved)
);

create table caregiver_links (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references profiles(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  status caregiver_link_status not null default 'pending',
  requested_at timestamptz not null default now(),
  -- Grace window: if the patient hasn't responded by this time, the link
  -- becomes 'provisional' (see lib/caregiver/grace-linking.ts).
  grace_expires_at timestamptz not null default (now() + interval '24 hours'),
  responded_at timestamptz, -- when patient approved or revoked
  unique (caregiver_id, patient_id)
);

create index caregiver_links_patient_idx on caregiver_links (patient_id);
create index caregiver_links_caregiver_idx on caregiver_links (caregiver_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table departments enable row level security;
alter table wait_reports enable row level security;
alter table profiles enable row level security;
alter table caregiver_links enable row level security;

-- Departments: public read, no public write (seeded by admin/migration)
create policy "departments are publicly readable"
  on departments for select
  using (true);

-- Wait reports: public read (the whole point is public transparency),
-- public insert (anonymous submission is a deliberate product decision),
-- no update/delete from clients -- reports are immutable once submitted.
create policy "wait reports are publicly readable"
  on wait_reports for select
  using (true);

create policy "anyone can submit a wait report"
  on wait_reports for insert
  with check (
    -- If a reporter_id is supplied, it must match the authenticated user
    -- (can't submit a report claiming to be someone else's account).
    reporter_id is null or reporter_id = auth.uid()
  );

-- Profiles: a user can read/update only their own profile. Caregivers
-- need to see a linked patient's display_name for the UI, handled via a
-- security-definer function below rather than a broad SELECT policy.
create policy "users can view their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Caregiver links: a caregiver can see links where they are the
-- caregiver; a patient can see links where they are the patient. This
-- is the enforcement point for "least-privilege" (design doc Pass 1B
-- finding) -- a caregiver can never query another patient's links.
create policy "caregivers see their own link requests"
  on caregiver_links for select
  using (caregiver_id = auth.uid());

create policy "patients see link requests made about them"
  on caregiver_links for select
  using (patient_id = auth.uid());

create policy "a caregiver can create a link request for themselves"
  on caregiver_links for insert
  with check (caregiver_id = auth.uid());

-- Only the patient can approve/revoke; a caregiver cannot self-approve
-- their own pending request (this is the actual enforcement of the
-- approval-gate the eng review added).
create policy "only the patient can update link status"
  on caregiver_links for update
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

-- ---------------------------------------------------------------------
-- Security-definer function: a caregiver needs to see the display_name
-- of a patient they have an active link with, but the profiles SELECT
-- policy above only allows viewing your own profile. This function
-- narrowly bypasses that, scoped to only patients with an approved or
-- provisional (grace-expired) link to the calling caregiver -- never an
-- arbitrary profile lookup.
-- ---------------------------------------------------------------------
create function get_linked_patient_name(p_patient_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.display_name
  from profiles p
  join caregiver_links cl
    on cl.patient_id = p.id
  where p.id = p_patient_id
    and cl.caregiver_id = auth.uid()
    and cl.status <> 'revoked'
    and (cl.status = 'approved' or cl.grace_expires_at < now())
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- Seed data: starting department list (matches lib/wait-time/repository.ts
-- mock data, so the switch from mock to live Supabase is a like-for-like
-- comparison). Phone numbers are placeholders -- replace with real JDWNRH
-- department numbers before this goes live for real users.
-- ---------------------------------------------------------------------
insert into departments (name, phone_number) values
  ('General Medicine', '+975 2 322496'),
  ('Pediatrics', '+975 2 322497'),
  ('ENT', '+975 2 322498');
