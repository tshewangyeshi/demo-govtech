-- Allows a caregiver to initiate a link request by phone number, without
-- being able to browse arbitrary profiles (the profiles SELECT policy in
-- 0001_init.sql intentionally only allows viewing your own profile).
-- This function returns ONLY the patient's id -- never their display_name,
-- phone, or any other field -- just enough to create a caregiver_links row.
--
-- Known limitation, not solved in this pass: any authenticated caller can
-- probe whether a given phone number is a registered patient (null vs a
-- uuid back). Acceptable for a small trusted pilot among people who
-- already know each other; would need rate-limiting or removal of the
-- null/non-null signal before this scales past that.
create function find_patient_id_by_phone(p_phone text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from profiles where phone = p_phone limit 1;
$$;

-- Patients need to see the caregiver's display_name on a pending request
-- (so they know who's asking), same narrow pattern as
-- get_linked_patient_name but in the other direction.
create function get_requesting_caregiver_name(p_caregiver_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.display_name
  from profiles p
  join caregiver_links cl
    on cl.caregiver_id = p.id
  where p.id = p_caregiver_id
    and cl.patient_id = auth.uid()
  limit 1;
$$;
