-- ============================================================================
-- Aaroham — departmental demonstration dataset
-- ----------------------------------------------------------------------------
-- *** EVERY RECORD IN THIS FILE IS SYNTHETIC DEMONSTRATION DATA. ***
--
-- No person, facility, practitioner, registration number, telephone number or
-- clinical event described here is real. The file exists so that the system
-- can be exercised and demonstrated end to end before the beneficiary dataset
-- is received. Together with client/src/data/mockData.js it is one of only two
-- locations in this repository in which invented data is permitted
-- (CLAUDE.md §9 rule 3). It is never loaded into an environment carrying live
-- records.
--
-- Contents:
--   5 facilities across five districts
--   6 medical practitioners, one at each facility (two at Kozhikode)
--   1 departmental administrator
--   40 beneficiaries, 8 in each of five districts, each with an MHID
--   40 health records, plus consultations, prescriptions, immunisations,
--   mental health screenings, appointments, schemes and audit entries
--
-- Phase 14 (inter-district continuity) depends on this data. Beneficiary
-- KL-EKM-26-000001-8 (Ramesh Prasad Yadav) carries a recorded PENICILLIN
-- allergy, was treated at Ernakulam, and later attends Kozhikode — where the
-- Ernakulam consultation and the allergy must both be visible to the treating
-- practitioner before any prescribing decision.
--
-- Applied by: npm run db:seed   (server/db/seed.js)
-- Safe to re-run: every INSERT carries ON CONFLICT DO NOTHING against a fixed
-- primary key, so a second run inserts nothing and reports the same totals.
-- ============================================================================

-- ---------- Facilities ----------
INSERT INTO hospitals (id, name, district, type, address, contact) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Government General Hospital, Ernakulam', 'Ernakulam', 'Government', 'Hospital Road, Ernakulam North, Kochi 682018', '0484-2361251'),
  ('a0000000-0000-4000-8000-000000000002', 'Government Medical College Hospital, Kozhikode', 'Kozhikode', 'Government', 'Medical College Campus, Kozhikode 673008', '0495-2350216'),
  ('a0000000-0000-4000-8000-000000000003', 'District Hospital, Thrissur', 'Thrissur', 'Government', 'Ollur Road, Thrissur 680001', '0487-2333198'),
  ('a0000000-0000-4000-8000-000000000004', 'Government District Hospital, Kannur', 'Kannur', 'Government', 'Thavakkara, Kannur 670001', '0497-2700194'),
  ('a0000000-0000-4000-8000-000000000005', 'Community Health Centre, Chavara', 'Kollam', 'PHC', 'Chavara South, Kollam 691584', '0476-2680145')
ON CONFLICT (id) DO NOTHING;

-- ---------- Login identities ----------
-- password_hash is a bcrypt hash of the demonstration password 'Demo@1234'.
-- Phase 6 introduces real credential handling; until then these hashes are
-- unused by the application, which does not yet verify anything.
INSERT INTO users (id, role, email, mobile, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'admin', 'health.admin@Aaroham.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000011', 'doctor', 'meera.raghavan@ggh-ekm.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000012', 'doctor', 'anil.nair@mch-kkd.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000013', 'doctor', 'fathima.beevi@mch-kkd.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000014', 'doctor', 'suresh.menon@dh-tsr.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000015', 'doctor', 'lakshmi.priya@dh-knr.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000016', 'doctor', 'joseph.thomas@chc-chavara.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000101', 'worker', NULL, '9946010001', NULL),
  ('b0000000-0000-4000-8000-000000000102', 'worker', NULL, '9946010002', NULL),
  ('b0000000-0000-4000-8000-000000000103', 'worker', NULL, '9946010003', NULL),
  ('b0000000-0000-4000-8000-000000000104', 'worker', NULL, '9946010004', NULL),
  ('b0000000-0000-4000-8000-000000000105', 'worker', NULL, '9946010005', NULL),
  ('b0000000-0000-4000-8000-000000000106', 'worker', NULL, '9946010006', NULL),
  ('b0000000-0000-4000-8000-000000000107', 'worker', NULL, '9946010007', NULL),
  ('b0000000-0000-4000-8000-000000000108', 'worker', NULL, '9946010008', NULL),
  ('b0000000-0000-4000-8000-000000000109', 'worker', NULL, '9946010009', NULL),
  ('b0000000-0000-4000-8000-000000000110', 'worker', NULL, '9946010010', NULL),
  ('b0000000-0000-4000-8000-000000000111', 'worker', NULL, '9946010011', NULL),
  ('b0000000-0000-4000-8000-000000000112', 'worker', NULL, '9946010012', NULL),
  ('b0000000-0000-4000-8000-000000000113', 'worker', NULL, '9946010013', NULL),
  ('b0000000-0000-4000-8000-000000000114', 'worker', NULL, '9946010014', NULL),
  ('b0000000-0000-4000-8000-000000000115', 'worker', NULL, '9946010015', NULL),
  ('b0000000-0000-4000-8000-000000000116', 'worker', NULL, '9946010016', NULL),
  ('b0000000-0000-4000-8000-000000000117', 'worker', NULL, '9946010017', NULL),
  ('b0000000-0000-4000-8000-000000000118', 'worker', NULL, '9946010018', NULL),
  ('b0000000-0000-4000-8000-000000000119', 'worker', NULL, '9946010019', NULL),
  ('b0000000-0000-4000-8000-000000000120', 'worker', NULL, '9946010020', NULL),
  ('b0000000-0000-4000-8000-000000000121', 'worker', NULL, '9946010021', NULL),
  ('b0000000-0000-4000-8000-000000000122', 'worker', NULL, '9946010022', NULL),
  ('b0000000-0000-4000-8000-000000000123', 'worker', NULL, '9946010023', NULL),
  ('b0000000-0000-4000-8000-000000000124', 'worker', NULL, '9946010024', NULL),
  ('b0000000-0000-4000-8000-000000000125', 'worker', NULL, '9946010025', NULL),
  ('b0000000-0000-4000-8000-000000000126', 'worker', NULL, '9946010026', NULL),
  ('b0000000-0000-4000-8000-000000000127', 'worker', NULL, '9946010027', NULL),
  ('b0000000-0000-4000-8000-000000000128', 'worker', NULL, '9946010028', NULL),
  ('b0000000-0000-4000-8000-000000000129', 'worker', NULL, '9946010029', NULL),
  ('b0000000-0000-4000-8000-000000000130', 'worker', NULL, '9946010030', NULL),
  ('b0000000-0000-4000-8000-000000000131', 'worker', NULL, '9946010031', NULL),
  ('b0000000-0000-4000-8000-000000000132', 'worker', NULL, '9946010032', NULL),
  ('b0000000-0000-4000-8000-000000000133', 'worker', NULL, '9946010033', NULL),
  ('b0000000-0000-4000-8000-000000000134', 'worker', NULL, '9946010034', NULL),
  ('b0000000-0000-4000-8000-000000000135', 'worker', NULL, '9946010035', NULL),
  ('b0000000-0000-4000-8000-000000000136', 'worker', NULL, '9946010036', NULL),
  ('b0000000-0000-4000-8000-000000000137', 'worker', NULL, '9946010037', NULL),
  ('b0000000-0000-4000-8000-000000000138', 'worker', NULL, '9946010038', NULL),
  ('b0000000-0000-4000-8000-000000000139', 'worker', NULL, '9946010039', NULL),
  ('b0000000-0000-4000-8000-000000000140', 'worker', NULL, '9946010040', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------- Medical practitioners ----------
-- can_access_mental_health is granted only to the psychiatrist. Every other
-- practitioner is refused the sensitive tier (CLAUDE.md §6).
INSERT INTO doctors (id, user_id, hospital_id, full_name, specialisation, registration_number, can_access_mental_health) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'Dr. Meera Raghavan', 'General Medicine', 'TCMC-2011-04871', false),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'Dr. Anil Kumar Nair', 'General Medicine', 'TCMC-2009-03145', false),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'Dr. Fathima Beevi', 'Psychiatry', 'TCMC-2013-06620', true),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', 'Dr. Suresh Menon', 'Orthopaedics', 'TCMC-2008-02733', false),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000004', 'Dr. Lakshmi Priya', 'General Medicine', 'TCMC-2015-08902', false),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000005', 'Dr. Joseph Thomas', 'Community Medicine', 'TCMC-2012-05418', false)
ON CONFLICT (id) DO NOTHING;

-- ---------- Beneficiaries ----------
-- MHID format KL-<DDD>-<YY>-<NNNNNN>-<C>; check digit by Luhn over the serial.
-- abha_id is NULL throughout: linkage is optional and never blocks registration.
INSERT INTO workers (id, user_id, mhid, full_name, date_of_birth, gender, mobile, native_state, native_district, current_district, current_address, employer, occupation, emergency_contact, preferred_language) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000101', 'KL-EKM-26-000001-8', 'Ramesh Prasad Yadav', '1991-03-14', 'Male', '9946010001', 'Bihar', 'Madhubani', 'Ernakulam', 'Labour Camp, Kalamassery, Ernakulam 683104', 'Meridian Constructions', 'Construction labourer', 'Sunil Yadav, 9946050001', 'hi'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000102', 'KL-KKD-26-000002-6', 'Sabina Khatun', '1996-07-02', 'Female', '9946010002', 'West Bengal', 'Murshidabad', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Rekha Khatun, 9946050002', 'bn'),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000103', 'KL-TSR-26-000003-4', 'Dilip Hansda', '1988-11-23', 'Male', '9946010003', 'Jharkhand', 'Dumka', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Nirman Builders', 'Masonry', 'Amit Hansda, 9946050003', 'hi'),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000104', 'KL-KNR-26-000004-2', 'Anwar Hussain', '1994-01-30', 'Male', '9946010004', 'Assam', 'Barpeta', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Green Valley Estates', 'Plantation worker', 'Parvati Hussain, 9946050004', 'as'),
  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000105', 'KL-KLM-26-000005-9', 'Sunita Devi', '1993-05-19', 'Female', '9946010005', 'Bihar', 'Samastipur', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Meridian Constructions', 'Helper', 'Mahesh Devi, 9946050005', 'hi'),
  ('d0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000106', 'KL-EKM-26-000006-7', 'Bikash Roy', '1990-09-08', 'Male', '9946010006', 'West Bengal', 'Cooch Behar', 'Ernakulam', 'Site Accommodation, Aluva, Ernakulam 683101', 'Kerala Plywood Works', 'Machine operator', 'Anita Roy, 9946050006', 'bn'),
  ('d0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000107', 'KL-KKD-26-000007-5', 'Rakesh Mandal', '1986-12-11', 'Male', '9946010007', 'Bihar', 'Purnia', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Coastal Seafoods Pvt Ltd', 'Loading and unloading', 'Sunil Mandal, 9946050007', 'hi'),
  ('d0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000108', 'KL-TSR-26-000008-3', 'Jyotsna Murmu', '1997-04-27', 'Female', '9946010008', 'Jharkhand', 'Pakur', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Green Valley Estates', 'Plantation worker', 'Rekha Murmu, 9946050008', 'hi'),
  ('d0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000109', 'KL-KNR-26-000009-1', 'Prakash Behera', '1992-08-15', 'Male', '9946010009', 'Odisha', 'Ganjam', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Malabar Tile Works', 'Kiln operator', 'Amit Behera, 9946050009', 'or'),
  ('d0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000110', 'KL-KLM-26-000010-9', 'Manoj Sardar', '1989-02-03', 'Male', '9946010010', 'West Bengal', 'South 24 Parganas', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Nirman Builders', 'Carpentry', 'Parvati Sardar, 9946050010', 'bn'),
  ('d0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000111', 'KL-EKM-26-000011-7', 'Reshma Bibi', '1998-06-21', 'Female', '9946010011', 'West Bengal', 'Malda', 'Ernakulam', 'Workers Quarters, Perumbavoor, Ernakulam 683542', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Mahesh Bibi, 9946050011', 'bn'),
  ('d0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000112', 'KL-KKD-26-000012-5', 'Santosh Oraon', '1985-10-09', 'Male', '9946010012', 'Jharkhand', 'Gumla', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Meridian Constructions', 'Construction labourer', 'Anita Oraon, 9946050012', 'hi'),
  ('d0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000113', 'KL-TSR-26-000013-3', 'Nirmal Das', '1995-03-25', 'Male', '9946010013', 'West Bengal', 'Nadia', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Kerala Plywood Works', 'Press operator', 'Sunil Das, 9946050013', 'bn'),
  ('d0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000114', 'KL-KNR-26-000014-1', 'Kabita Naik', '1994-11-17', 'Female', '9946010014', 'Odisha', 'Kendrapara', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Malabar Tile Works', 'Sorting and packing', 'Rekha Naik, 9946050014', 'or'),
  ('d0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000115', 'KL-KLM-26-000015-8', 'Jahangir Alam', '1987-07-06', 'Male', '9946010015', 'Assam', 'Dhubri', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Green Valley Estates', 'Plantation worker', 'Amit Alam, 9946050015', 'as'),
  ('d0000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000116', 'KL-EKM-26-000016-6', 'Pintu Sheikh', '1999-01-12', 'Male', '9946010016', 'West Bengal', 'Birbhum', 'Ernakulam', 'Labour Camp, Kalamassery, Ernakulam 683104', 'Nirman Builders', 'Helper', 'Parvati Sheikh, 9946050016', 'bn'),
  ('d0000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000117', 'KL-KKD-26-000017-4', 'Arjun Paswan', '1991-09-29', 'Male', '9946010017', 'Bihar', 'Katihar', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Cochin Marine Exports', 'Cold storage', 'Mahesh Paswan, 9946050017', 'hi'),
  ('d0000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000118', 'KL-TSR-26-000018-2', 'Laxmi Tudu', '1996-05-04', 'Female', '9946010018', 'Jharkhand', 'Sahibganj', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Green Valley Estates', 'Plantation worker', 'Anita Tudu, 9946050018', 'hi'),
  ('d0000000-0000-4000-8000-000000000019', 'b0000000-0000-4000-8000-000000000119', 'KL-KNR-26-000019-0', 'Ratan Barman', '1990-12-18', 'Male', '9946010019', 'West Bengal', 'Jalpaiguri', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Kerala Plywood Works', 'Machine operator', 'Sunil Barman, 9946050019', 'bn'),
  ('d0000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000120', 'KL-KLM-26-000020-8', 'Md Rafiqul Islam', '1993-02-22', 'Male', '9946010020', 'Assam', 'Goalpara', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Meridian Constructions', 'Bar bending', 'Rekha Islam, 9946050020', 'as'),
  ('d0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000121', 'KL-EKM-26-000021-6', 'Sujata Pradhan', '1997-08-30', 'Female', '9946010021', 'Odisha', 'Balasore', 'Ernakulam', 'Site Accommodation, Aluva, Ernakulam 683101', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Amit Pradhan, 9946050021', 'or'),
  ('d0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000122', 'KL-KKD-26-000022-4', 'Vikram Sahani', '1988-04-14', 'Male', '9946010022', 'Bihar', 'Darbhanga', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Nirman Builders', 'Plumbing', 'Parvati Sahani, 9946050022', 'hi'),
  ('d0000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000123', 'KL-TSR-26-000023-2', 'Rekha Kumari', '1995-10-07', 'Female', '9946010023', 'Bihar', 'Muzaffarpur', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Malabar Tile Works', 'Sorting and packing', 'Mahesh Kumari, 9946050023', 'hi'),
  ('d0000000-0000-4000-8000-000000000024', 'b0000000-0000-4000-8000-000000000124', 'KL-KNR-26-000024-0', 'Sanjib Ghosh', '1992-06-11', 'Male', '9946010024', 'West Bengal', 'Hooghly', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Cochin Marine Exports', 'Cold storage', 'Anita Ghosh, 9946050024', 'bn'),
  ('d0000000-0000-4000-8000-000000000025', 'b0000000-0000-4000-8000-000000000125', 'KL-KLM-26-000025-7', 'Dhiraj Munda', '1994-03-05', 'Male', '9946010025', 'Jharkhand', 'Khunti', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Green Valley Estates', 'Plantation worker', 'Sunil Munda, 9946050025', 'hi'),
  ('d0000000-0000-4000-8000-000000000026', 'b0000000-0000-4000-8000-000000000126', 'KL-EKM-26-000026-5', 'Nasreen Begum', '1998-09-23', 'Female', '9946010026', 'Assam', 'Nagaon', 'Ernakulam', 'Workers Quarters, Perumbavoor, Ernakulam 683542', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Rekha Begum, 9946050026', 'as'),
  ('d0000000-0000-4000-8000-000000000027', 'b0000000-0000-4000-8000-000000000127', 'KL-KKD-26-000027-3', 'Ajay Kisku', '1986-11-28', 'Male', '9946010027', 'Jharkhand', 'Deoghar', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Meridian Constructions', 'Construction labourer', 'Amit Kisku, 9946050027', 'hi'),
  ('d0000000-0000-4000-8000-000000000028', 'b0000000-0000-4000-8000-000000000128', 'KL-TSR-26-000028-1', 'Pravin Jena', '1991-01-16', 'Male', '9946010028', 'Odisha', 'Cuttack', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Malabar Tile Works', 'Kiln operator', 'Parvati Jena, 9946050028', 'or'),
  ('d0000000-0000-4000-8000-000000000029', 'b0000000-0000-4000-8000-000000000129', 'KL-KNR-26-000029-9', 'Salma Khatun', '1996-12-02', 'Female', '9946010029', 'West Bengal', 'Murshidabad', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Kerala Plywood Works', 'Finishing', 'Mahesh Khatun, 9946050029', 'bn'),
  ('d0000000-0000-4000-8000-000000000030', 'b0000000-0000-4000-8000-000000000130', 'KL-KLM-26-000030-7', 'Ranjan Baske', '1989-05-20', 'Male', '9946010030', 'Jharkhand', 'Dumka', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Nirman Builders', 'Masonry', 'Anita Baske, 9946050030', 'hi'),
  ('d0000000-0000-4000-8000-000000000031', 'b0000000-0000-4000-8000-000000000131', 'KL-EKM-26-000031-5', 'Kailash Ram', '1993-07-13', 'Male', '9946010031', 'Bihar', 'Saran', 'Ernakulam', 'Labour Camp, Kalamassery, Ernakulam 683104', 'Meridian Constructions', 'Painting', 'Sunil Ram, 9946050031', 'hi'),
  ('d0000000-0000-4000-8000-000000000032', 'b0000000-0000-4000-8000-000000000132', 'KL-KKD-26-000032-3', 'Bhagyashree Sahu', '1997-02-26', 'Female', '9946010032', 'Odisha', 'Sambalpur', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Rekha Sahu, 9946050032', 'or'),
  ('d0000000-0000-4000-8000-000000000033', 'b0000000-0000-4000-8000-000000000133', 'KL-TSR-26-000033-1', 'Tapan Mondal', '1990-10-31', 'Male', '9946010033', 'West Bengal', 'Bardhaman', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Cochin Marine Exports', 'Cold storage', 'Amit Mondal, 9946050033', 'bn'),
  ('d0000000-0000-4000-8000-000000000034', 'b0000000-0000-4000-8000-000000000134', 'KL-KNR-26-000034-9', 'Imran Ali', '1994-08-09', 'Male', '9946010034', 'Assam', 'Karimganj', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Green Valley Estates', 'Plantation worker', 'Parvati Ali, 9946050034', 'as'),
  ('d0000000-0000-4000-8000-000000000035', 'b0000000-0000-4000-8000-000000000135', 'KL-KLM-26-000035-6', 'Sarita Devi', '1992-04-03', 'Female', '9946010035', 'Bihar', 'Gaya', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Malabar Tile Works', 'Sorting and packing', 'Mahesh Devi, 9946050035', 'hi'),
  ('d0000000-0000-4000-8000-000000000036', 'b0000000-0000-4000-8000-000000000136', 'KL-EKM-26-000036-4', 'Nitesh Soren', '1987-06-17', 'Male', '9946010036', 'Jharkhand', 'Godda', 'Ernakulam', 'Site Accommodation, Aluva, Ernakulam 683101', 'Nirman Builders', 'Scaffolding', 'Anita Soren, 9946050036', 'hi'),
  ('d0000000-0000-4000-8000-000000000037', 'b0000000-0000-4000-8000-000000000137', 'KL-KKD-26-000037-2', 'Gopal Chandra Roy', '1991-11-24', 'Male', '9946010037', 'West Bengal', 'Dinajpur', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Kerala Plywood Works', 'Machine operator', 'Sunil Roy, 9946050037', 'bn'),
  ('d0000000-0000-4000-8000-000000000038', 'b0000000-0000-4000-8000-000000000138', 'KL-TSR-26-000038-0', 'Ashok Bhoi', '1995-09-01', 'Male', '9946010038', 'Odisha', 'Bolangir', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Meridian Constructions', 'Helper', 'Rekha Bhoi, 9946050038', 'or'),
  ('d0000000-0000-4000-8000-000000000039', 'b0000000-0000-4000-8000-000000000139', 'KL-KNR-26-000039-8', 'Rubina Yasmin', '1999-03-19', 'Female', '9946010039', 'Assam', 'Bongaigaon', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Amit Yasmin, 9946050039', 'as'),
  ('d0000000-0000-4000-8000-000000000040', 'b0000000-0000-4000-8000-000000000140', 'KL-KLM-26-000040-6', 'Deepak Thakur', '1988-01-07', 'Male', '9946010040', 'Bihar', 'Sitamarhi', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Cochin Marine Exports', 'Cold storage', 'Parvati Thakur, 9946050040', 'hi')
ON CONFLICT (id) DO NOTHING;

-- ---------- Health records ----------
-- allergies and chronic_conditions are TEXT[]. These are the values the
-- clinical safety banner surfaces above all other content.
INSERT INTO health_records (id, worker_id, blood_group, allergies, chronic_conditions, current_medications, notes) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'O+', ARRAY['Penicillin','Dust']::TEXT[], '{}', '{}', 'Penicillin allergy confirmed on history. Avoid beta-lactam antibiotics.'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'B+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004', 'AB+', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005', 'O-', '{}', ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000007', 'A-', ARRAY['Sulpha drugs']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000008', 'O+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000009', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000010', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000011', 'O+', ARRAY['Dust']::TEXT[], ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000012', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000013', 'A+', ARRAY['Penicillin']::TEXT[], '{}', '{}', 'Penicillin allergy confirmed on history. Avoid beta-lactam antibiotics.'),
  ('e0000000-0000-4000-8000-000000000014', 'd0000000-0000-4000-8000-000000000014', 'AB+', '{}', ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000015', 'd0000000-0000-4000-8000-000000000015', 'O-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000016', 'd0000000-0000-4000-8000-000000000016', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000017', 'd0000000-0000-4000-8000-000000000017', 'A-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000018', 'd0000000-0000-4000-8000-000000000018', 'O+', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000019', 'd0000000-0000-4000-8000-000000000019', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000020', 'd0000000-0000-4000-8000-000000000020', 'A+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000021', 'd0000000-0000-4000-8000-000000000021', 'O+', '{}', ARRAY['Bronchial Asthma']::TEXT[], '{}', 'Under review for bronchial asthma.'),
  ('e0000000-0000-4000-8000-000000000022', 'd0000000-0000-4000-8000-000000000022', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000023', 'd0000000-0000-4000-8000-000000000023', 'A+', '{}', ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000024', 'd0000000-0000-4000-8000-000000000024', 'AB+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000025', 'd0000000-0000-4000-8000-000000000025', 'O-', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000026', 'd0000000-0000-4000-8000-000000000026', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000027', 'd0000000-0000-4000-8000-000000000027', 'A-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000028', 'd0000000-0000-4000-8000-000000000028', 'O+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000029', 'd0000000-0000-4000-8000-000000000029', 'B+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000030', 'd0000000-0000-4000-8000-000000000030', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000031', 'd0000000-0000-4000-8000-000000000031', 'O+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000032', 'd0000000-0000-4000-8000-000000000032', 'B+', ARRAY['Dust']::TEXT[], ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000033', 'd0000000-0000-4000-8000-000000000033', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000034', 'd0000000-0000-4000-8000-000000000034', 'AB+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000035', 'd0000000-0000-4000-8000-000000000035', 'O-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000036', 'd0000000-0000-4000-8000-000000000036', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000037', 'd0000000-0000-4000-8000-000000000037', 'A-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000038', 'd0000000-0000-4000-8000-000000000038', 'O+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000039', 'd0000000-0000-4000-8000-000000000039', 'B+', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000040', 'd0000000-0000-4000-8000-000000000040', 'A+', '{}', '{}', '{}', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Aaroham — departmental demonstration dataset
-- ----------------------------------------------------------------------------
-- *** EVERY RECORD IN THIS FILE IS SYNTHETIC DEMONSTRATION DATA. ***
--
-- No person, facility, practitioner, registration number, telephone number or
-- clinical event described here is real. The file exists so that the system
-- can be exercised and demonstrated end to end before the beneficiary dataset
-- is received. Together with client/src/data/mockData.js it is one of only two
-- locations in this repository in which invented data is permitted
-- (CLAUDE.md §9 rule 3). It is never loaded into an environment carrying live
-- records.
--
-- Contents:
--   5 facilities across five districts
--   6 medical practitioners, one at each facility (two at Kozhikode)
--   1 departmental administrator
--   40 beneficiaries, 8 in each of five districts, each with an MHID
--   40 health records, plus consultations, prescriptions, immunisations,
--   mental health screenings, appointments, schemes and audit entries
--
-- Phase 14 (inter-district continuity) depends on this data. Beneficiary
-- KL-EKM-26-000001-8 (Ramesh Prasad Yadav) carries a recorded PENICILLIN
-- allergy, was treated at Ernakulam, and later attends Kozhikode — where the
-- Ernakulam consultation and the allergy must both be visible to the treating
-- practitioner before any prescribing decision.
--
-- Applied by: npm run db:seed   (server/db/seed.js)
-- Safe to re-run: every INSERT carries ON CONFLICT DO NOTHING against a fixed
-- primary key, so a second run inserts nothing and reports the same totals.
-- ============================================================================

-- ---------- Facilities ----------
INSERT INTO hospitals (id, name, district, type, address, contact) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Government General Hospital, Ernakulam', 'Ernakulam', 'Government', 'Hospital Road, Ernakulam North, Kochi 682018', '0484-2361251'),
  ('a0000000-0000-4000-8000-000000000002', 'Government Medical College Hospital, Kozhikode', 'Kozhikode', 'Government', 'Medical College Campus, Kozhikode 673008', '0495-2350216'),
  ('a0000000-0000-4000-8000-000000000003', 'District Hospital, Thrissur', 'Thrissur', 'Government', 'Ollur Road, Thrissur 680001', '0487-2333198'),
  ('a0000000-0000-4000-8000-000000000004', 'Government District Hospital, Kannur', 'Kannur', 'Government', 'Thavakkara, Kannur 670001', '0497-2700194'),
  ('a0000000-0000-4000-8000-000000000005', 'Community Health Centre, Chavara', 'Kollam', 'PHC', 'Chavara South, Kollam 691584', '0476-2680145')
ON CONFLICT (id) DO NOTHING;

-- ---------- Login identities ----------
-- password_hash is a bcrypt hash of the demonstration password 'Demo@1234'.
-- Phase 6 introduces real credential handling; until then these hashes are
-- unused by the application, which does not yet verify anything.
INSERT INTO users (id, role, email, mobile, password_hash) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'admin', 'health.admin@Aaroham.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000011', 'doctor', 'meera.raghavan@ggh-ekm.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000012', 'doctor', 'anil.nair@mch-kkd.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000013', 'doctor', 'fathima.beevi@mch-kkd.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000014', 'doctor', 'suresh.menon@dh-tsr.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000015', 'doctor', 'lakshmi.priya@dh-knr.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000016', 'doctor', 'joseph.thomas@chc-chavara.kerala.gov.in', NULL, '$2b$12$Q0Zt3nOa8yZ1pXlKQK7hLuJp0vG9m1sZ8cQKJ2h5rD3wS6xT4yUvC'),
  ('b0000000-0000-4000-8000-000000000101', 'worker', NULL, '9946010001', NULL),
  ('b0000000-0000-4000-8000-000000000102', 'worker', NULL, '9946010002', NULL),
  ('b0000000-0000-4000-8000-000000000103', 'worker', NULL, '9946010003', NULL),
  ('b0000000-0000-4000-8000-000000000104', 'worker', NULL, '9946010004', NULL),
  ('b0000000-0000-4000-8000-000000000105', 'worker', NULL, '9946010005', NULL),
  ('b0000000-0000-4000-8000-000000000106', 'worker', NULL, '9946010006', NULL),
  ('b0000000-0000-4000-8000-000000000107', 'worker', NULL, '9946010007', NULL),
  ('b0000000-0000-4000-8000-000000000108', 'worker', NULL, '9946010008', NULL),
  ('b0000000-0000-4000-8000-000000000109', 'worker', NULL, '9946010009', NULL),
  ('b0000000-0000-4000-8000-000000000110', 'worker', NULL, '9946010010', NULL),
  ('b0000000-0000-4000-8000-000000000111', 'worker', NULL, '9946010011', NULL),
  ('b0000000-0000-4000-8000-000000000112', 'worker', NULL, '9946010012', NULL),
  ('b0000000-0000-4000-8000-000000000113', 'worker', NULL, '9946010013', NULL),
  ('b0000000-0000-4000-8000-000000000114', 'worker', NULL, '9946010014', NULL),
  ('b0000000-0000-4000-8000-000000000115', 'worker', NULL, '9946010015', NULL),
  ('b0000000-0000-4000-8000-000000000116', 'worker', NULL, '9946010016', NULL),
  ('b0000000-0000-4000-8000-000000000117', 'worker', NULL, '9946010017', NULL),
  ('b0000000-0000-4000-8000-000000000118', 'worker', NULL, '9946010018', NULL),
  ('b0000000-0000-4000-8000-000000000119', 'worker', NULL, '9946010019', NULL),
  ('b0000000-0000-4000-8000-000000000120', 'worker', NULL, '9946010020', NULL),
  ('b0000000-0000-4000-8000-000000000121', 'worker', NULL, '9946010021', NULL),
  ('b0000000-0000-4000-8000-000000000122', 'worker', NULL, '9946010022', NULL),
  ('b0000000-0000-4000-8000-000000000123', 'worker', NULL, '9946010023', NULL),
  ('b0000000-0000-4000-8000-000000000124', 'worker', NULL, '9946010024', NULL),
  ('b0000000-0000-4000-8000-000000000125', 'worker', NULL, '9946010025', NULL),
  ('b0000000-0000-4000-8000-000000000126', 'worker', NULL, '9946010026', NULL),
  ('b0000000-0000-4000-8000-000000000127', 'worker', NULL, '9946010027', NULL),
  ('b0000000-0000-4000-8000-000000000128', 'worker', NULL, '9946010028', NULL),
  ('b0000000-0000-4000-8000-000000000129', 'worker', NULL, '9946010029', NULL),
  ('b0000000-0000-4000-8000-000000000130', 'worker', NULL, '9946010030', NULL),
  ('b0000000-0000-4000-8000-000000000131', 'worker', NULL, '9946010031', NULL),
  ('b0000000-0000-4000-8000-000000000132', 'worker', NULL, '9946010032', NULL),
  ('b0000000-0000-4000-8000-000000000133', 'worker', NULL, '9946010033', NULL),
  ('b0000000-0000-4000-8000-000000000134', 'worker', NULL, '9946010034', NULL),
  ('b0000000-0000-4000-8000-000000000135', 'worker', NULL, '9946010035', NULL),
  ('b0000000-0000-4000-8000-000000000136', 'worker', NULL, '9946010036', NULL),
  ('b0000000-0000-4000-8000-000000000137', 'worker', NULL, '9946010037', NULL),
  ('b0000000-0000-4000-8000-000000000138', 'worker', NULL, '9946010038', NULL),
  ('b0000000-0000-4000-8000-000000000139', 'worker', NULL, '9946010039', NULL),
  ('b0000000-0000-4000-8000-000000000140', 'worker', NULL, '9946010040', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------- Medical practitioners ----------
-- can_access_mental_health is granted only to the psychiatrist. Every other
-- practitioner is refused the sensitive tier (CLAUDE.md §6).
INSERT INTO doctors (id, user_id, hospital_id, full_name, specialisation, registration_number, can_access_mental_health) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'Dr. Meera Raghavan', 'General Medicine', 'TCMC-2011-04871', false),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'Dr. Anil Kumar Nair', 'General Medicine', 'TCMC-2009-03145', false),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'Dr. Fathima Beevi', 'Psychiatry', 'TCMC-2013-06620', true),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003', 'Dr. Suresh Menon', 'Orthopaedics', 'TCMC-2008-02733', false),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000004', 'Dr. Lakshmi Priya', 'General Medicine', 'TCMC-2015-08902', false),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000005', 'Dr. Joseph Thomas', 'Community Medicine', 'TCMC-2012-05418', false)
ON CONFLICT (id) DO NOTHING;

-- ---------- Beneficiaries ----------
-- MHID format KL-<DDD>-<YY>-<NNNNNN>-<C>; check digit by Luhn over the serial.
-- abha_id is NULL throughout: linkage is optional and never blocks registration.
INSERT INTO workers (id, user_id, mhid, full_name, date_of_birth, gender, mobile, native_state, native_district, current_district, current_address, employer, occupation, emergency_contact, preferred_language) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000101', 'KL-EKM-26-000001-8', 'Ramesh Prasad Yadav', '1991-03-14', 'Male', '9946010001', 'Bihar', 'Madhubani', 'Ernakulam', 'Labour Camp, Kalamassery, Ernakulam 683104', 'Meridian Constructions', 'Construction labourer', 'Sunil Yadav, 9946050001', 'hi'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000102', 'KL-KKD-26-000002-6', 'Sabina Khatun', '1996-07-02', 'Female', '9946010002', 'West Bengal', 'Murshidabad', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Rekha Khatun, 9946050002', 'bn'),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000103', 'KL-TSR-26-000003-4', 'Dilip Hansda', '1988-11-23', 'Male', '9946010003', 'Jharkhand', 'Dumka', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Nirman Builders', 'Masonry', 'Amit Hansda, 9946050003', 'hi'),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000104', 'KL-KNR-26-000004-2', 'Anwar Hussain', '1994-01-30', 'Male', '9946010004', 'Assam', 'Barpeta', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Green Valley Estates', 'Plantation worker', 'Parvati Hussain, 9946050004', 'as'),
  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000105', 'KL-KLM-26-000005-9', 'Sunita Devi', '1993-05-19', 'Female', '9946010005', 'Bihar', 'Samastipur', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Meridian Constructions', 'Helper', 'Mahesh Devi, 9946050005', 'hi'),
  ('d0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000106', 'KL-EKM-26-000006-7', 'Bikash Roy', '1990-09-08', 'Male', '9946010006', 'West Bengal', 'Cooch Behar', 'Ernakulam', 'Site Accommodation, Aluva, Ernakulam 683101', 'Kerala Plywood Works', 'Machine operator', 'Anita Roy, 9946050006', 'bn'),
  ('d0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000107', 'KL-KKD-26-000007-5', 'Rakesh Mandal', '1986-12-11', 'Male', '9946010007', 'Bihar', 'Purnia', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Coastal Seafoods Pvt Ltd', 'Loading and unloading', 'Sunil Mandal, 9946050007', 'hi'),
  ('d0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000108', 'KL-TSR-26-000008-3', 'Jyotsna Murmu', '1997-04-27', 'Female', '9946010008', 'Jharkhand', 'Pakur', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Green Valley Estates', 'Plantation worker', 'Rekha Murmu, 9946050008', 'hi'),
  ('d0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000109', 'KL-KNR-26-000009-1', 'Prakash Behera', '1992-08-15', 'Male', '9946010009', 'Odisha', 'Ganjam', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Malabar Tile Works', 'Kiln operator', 'Amit Behera, 9946050009', 'or'),
  ('d0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000110', 'KL-KLM-26-000010-9', 'Manoj Sardar', '1989-02-03', 'Male', '9946010010', 'West Bengal', 'South 24 Parganas', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Nirman Builders', 'Carpentry', 'Parvati Sardar, 9946050010', 'bn'),
  ('d0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000111', 'KL-EKM-26-000011-7', 'Reshma Bibi', '1998-06-21', 'Female', '9946010011', 'West Bengal', 'Malda', 'Ernakulam', 'Workers Quarters, Perumbavoor, Ernakulam 683542', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Mahesh Bibi, 9946050011', 'bn'),
  ('d0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000112', 'KL-KKD-26-000012-5', 'Santosh Oraon', '1985-10-09', 'Male', '9946010012', 'Jharkhand', 'Gumla', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Meridian Constructions', 'Construction labourer', 'Anita Oraon, 9946050012', 'hi'),
  ('d0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000113', 'KL-TSR-26-000013-3', 'Nirmal Das', '1995-03-25', 'Male', '9946010013', 'West Bengal', 'Nadia', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Kerala Plywood Works', 'Press operator', 'Sunil Das, 9946050013', 'bn'),
  ('d0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000114', 'KL-KNR-26-000014-1', 'Kabita Naik', '1994-11-17', 'Female', '9946010014', 'Odisha', 'Kendrapara', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Malabar Tile Works', 'Sorting and packing', 'Rekha Naik, 9946050014', 'or'),
  ('d0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000115', 'KL-KLM-26-000015-8', 'Jahangir Alam', '1987-07-06', 'Male', '9946010015', 'Assam', 'Dhubri', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Green Valley Estates', 'Plantation worker', 'Amit Alam, 9946050015', 'as'),
  ('d0000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000116', 'KL-EKM-26-000016-6', 'Pintu Sheikh', '1999-01-12', 'Male', '9946010016', 'West Bengal', 'Birbhum', 'Ernakulam', 'Labour Camp, Kalamassery, Ernakulam 683104', 'Nirman Builders', 'Helper', 'Parvati Sheikh, 9946050016', 'bn'),
  ('d0000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000117', 'KL-KKD-26-000017-4', 'Arjun Paswan', '1991-09-29', 'Male', '9946010017', 'Bihar', 'Katihar', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Cochin Marine Exports', 'Cold storage', 'Mahesh Paswan, 9946050017', 'hi'),
  ('d0000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000118', 'KL-TSR-26-000018-2', 'Laxmi Tudu', '1996-05-04', 'Female', '9946010018', 'Jharkhand', 'Sahibganj', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Green Valley Estates', 'Plantation worker', 'Anita Tudu, 9946050018', 'hi'),
  ('d0000000-0000-4000-8000-000000000019', 'b0000000-0000-4000-8000-000000000119', 'KL-KNR-26-000019-0', 'Ratan Barman', '1990-12-18', 'Male', '9946010019', 'West Bengal', 'Jalpaiguri', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Kerala Plywood Works', 'Machine operator', 'Sunil Barman, 9946050019', 'bn'),
  ('d0000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000120', 'KL-KLM-26-000020-8', 'Md Rafiqul Islam', '1993-02-22', 'Male', '9946010020', 'Assam', 'Goalpara', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Meridian Constructions', 'Bar bending', 'Rekha Islam, 9946050020', 'as'),
  ('d0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000121', 'KL-EKM-26-000021-6', 'Sujata Pradhan', '1997-08-30', 'Female', '9946010021', 'Odisha', 'Balasore', 'Ernakulam', 'Site Accommodation, Aluva, Ernakulam 683101', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Amit Pradhan, 9946050021', 'or'),
  ('d0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000122', 'KL-KKD-26-000022-4', 'Vikram Sahani', '1988-04-14', 'Male', '9946010022', 'Bihar', 'Darbhanga', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Nirman Builders', 'Plumbing', 'Parvati Sahani, 9946050022', 'hi'),
  ('d0000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000123', 'KL-TSR-26-000023-2', 'Rekha Kumari', '1995-10-07', 'Female', '9946010023', 'Bihar', 'Muzaffarpur', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Malabar Tile Works', 'Sorting and packing', 'Mahesh Kumari, 9946050023', 'hi'),
  ('d0000000-0000-4000-8000-000000000024', 'b0000000-0000-4000-8000-000000000124', 'KL-KNR-26-000024-0', 'Sanjib Ghosh', '1992-06-11', 'Male', '9946010024', 'West Bengal', 'Hooghly', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Cochin Marine Exports', 'Cold storage', 'Anita Ghosh, 9946050024', 'bn'),
  ('d0000000-0000-4000-8000-000000000025', 'b0000000-0000-4000-8000-000000000125', 'KL-KLM-26-000025-7', 'Dhiraj Munda', '1994-03-05', 'Male', '9946010025', 'Jharkhand', 'Khunti', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Green Valley Estates', 'Plantation worker', 'Sunil Munda, 9946050025', 'hi'),
  ('d0000000-0000-4000-8000-000000000026', 'b0000000-0000-4000-8000-000000000126', 'KL-EKM-26-000026-5', 'Nasreen Begum', '1998-09-23', 'Female', '9946010026', 'Assam', 'Nagaon', 'Ernakulam', 'Workers Quarters, Perumbavoor, Ernakulam 683542', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Rekha Begum, 9946050026', 'as'),
  ('d0000000-0000-4000-8000-000000000027', 'b0000000-0000-4000-8000-000000000127', 'KL-KKD-26-000027-3', 'Ajay Kisku', '1986-11-28', 'Male', '9946010027', 'Jharkhand', 'Deoghar', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Meridian Constructions', 'Construction labourer', 'Amit Kisku, 9946050027', 'hi'),
  ('d0000000-0000-4000-8000-000000000028', 'b0000000-0000-4000-8000-000000000128', 'KL-TSR-26-000028-1', 'Pravin Jena', '1991-01-16', 'Male', '9946010028', 'Odisha', 'Cuttack', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Malabar Tile Works', 'Kiln operator', 'Parvati Jena, 9946050028', 'or'),
  ('d0000000-0000-4000-8000-000000000029', 'b0000000-0000-4000-8000-000000000129', 'KL-KNR-26-000029-9', 'Salma Khatun', '1996-12-02', 'Female', '9946010029', 'West Bengal', 'Murshidabad', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Kerala Plywood Works', 'Finishing', 'Mahesh Khatun, 9946050029', 'bn'),
  ('d0000000-0000-4000-8000-000000000030', 'b0000000-0000-4000-8000-000000000130', 'KL-KLM-26-000030-7', 'Ranjan Baske', '1989-05-20', 'Male', '9946010030', 'Jharkhand', 'Dumka', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Nirman Builders', 'Masonry', 'Anita Baske, 9946050030', 'hi'),
  ('d0000000-0000-4000-8000-000000000031', 'b0000000-0000-4000-8000-000000000131', 'KL-EKM-26-000031-5', 'Kailash Ram', '1993-07-13', 'Male', '9946010031', 'Bihar', 'Saran', 'Ernakulam', 'Labour Camp, Kalamassery, Ernakulam 683104', 'Meridian Constructions', 'Painting', 'Sunil Ram, 9946050031', 'hi'),
  ('d0000000-0000-4000-8000-000000000032', 'b0000000-0000-4000-8000-000000000132', 'KL-KKD-26-000032-3', 'Bhagyashree Sahu', '1997-02-26', 'Female', '9946010032', 'Odisha', 'Sambalpur', 'Kozhikode', 'Workers Hostel, Ramanattukara, Kozhikode 673633', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Rekha Sahu, 9946050032', 'or'),
  ('d0000000-0000-4000-8000-000000000033', 'b0000000-0000-4000-8000-000000000133', 'KL-TSR-26-000033-1', 'Tapan Mondal', '1990-10-31', 'Male', '9946010033', 'West Bengal', 'Bardhaman', 'Thrissur', 'Labour Camp, Ollur, Thrissur 680306', 'Cochin Marine Exports', 'Cold storage', 'Amit Mondal, 9946050033', 'bn'),
  ('d0000000-0000-4000-8000-000000000034', 'b0000000-0000-4000-8000-000000000134', 'KL-KNR-26-000034-9', 'Imran Ali', '1994-08-09', 'Male', '9946010034', 'Assam', 'Karimganj', 'Kannur', 'Workers Colony, Thalassery, Kannur 670101', 'Green Valley Estates', 'Plantation worker', 'Parvati Ali, 9946050034', 'as'),
  ('d0000000-0000-4000-8000-000000000035', 'b0000000-0000-4000-8000-000000000135', 'KL-KLM-26-000035-6', 'Sarita Devi', '1992-04-03', 'Female', '9946010035', 'Bihar', 'Gaya', 'Kollam', 'Labour Camp, Chavara, Kollam 691584', 'Malabar Tile Works', 'Sorting and packing', 'Mahesh Devi, 9946050035', 'hi'),
  ('d0000000-0000-4000-8000-000000000036', 'b0000000-0000-4000-8000-000000000136', 'KL-EKM-26-000036-4', 'Nitesh Soren', '1987-06-17', 'Male', '9946010036', 'Jharkhand', 'Godda', 'Ernakulam', 'Site Accommodation, Aluva, Ernakulam 683101', 'Nirman Builders', 'Scaffolding', 'Anita Soren, 9946050036', 'hi'),
  ('d0000000-0000-4000-8000-000000000037', 'b0000000-0000-4000-8000-000000000137', 'KL-KKD-26-000037-2', 'Gopal Chandra Roy', '1991-11-24', 'Male', '9946010037', 'West Bengal', 'Dinajpur', 'Kozhikode', 'Labour Colony, Feroke, Kozhikode 673631', 'Kerala Plywood Works', 'Machine operator', 'Sunil Roy, 9946050037', 'bn'),
  ('d0000000-0000-4000-8000-000000000038', 'b0000000-0000-4000-8000-000000000138', 'KL-TSR-26-000038-0', 'Ashok Bhoi', '1995-09-01', 'Male', '9946010038', 'Odisha', 'Bolangir', 'Thrissur', 'Workers Quarters, Chalakudy, Thrissur 680307', 'Meridian Constructions', 'Helper', 'Rekha Bhoi, 9946050038', 'or'),
  ('d0000000-0000-4000-8000-000000000039', 'b0000000-0000-4000-8000-000000000139', 'KL-KNR-26-000039-8', 'Rubina Yasmin', '1999-03-19', 'Female', '9946010039', 'Assam', 'Bongaigaon', 'Kannur', 'Estate Lines, Iritty, Kannur 670703', 'Coastal Seafoods Pvt Ltd', 'Fish processing', 'Amit Yasmin, 9946050039', 'as'),
  ('d0000000-0000-4000-8000-000000000040', 'b0000000-0000-4000-8000-000000000140', 'KL-KLM-26-000040-6', 'Deepak Thakur', '1988-01-07', 'Male', '9946010040', 'Bihar', 'Sitamarhi', 'Kollam', 'Workers Quarters, Karunagappally, Kollam 690518', 'Cochin Marine Exports', 'Cold storage', 'Parvati Thakur, 9946050040', 'hi')
ON CONFLICT (id) DO NOTHING;

-- ---------- Health records ----------
-- allergies and chronic_conditions are TEXT[]. These are the values the
-- clinical safety banner surfaces above all other content.
INSERT INTO health_records (id, worker_id, blood_group, allergies, chronic_conditions, current_medications, notes) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'O+', ARRAY['Penicillin','Dust']::TEXT[], '{}', '{}', 'Penicillin allergy confirmed on history. Avoid beta-lactam antibiotics.'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'B+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004', 'AB+', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005', 'O-', '{}', ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000007', 'A-', ARRAY['Sulpha drugs']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000008', 'O+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000009', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000010', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000011', 'O+', ARRAY['Dust']::TEXT[], ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000012', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000013', 'A+', ARRAY['Penicillin']::TEXT[], '{}', '{}', 'Penicillin allergy confirmed on history. Avoid beta-lactam antibiotics.'),
  ('e0000000-0000-4000-8000-000000000014', 'd0000000-0000-4000-8000-000000000014', 'AB+', '{}', ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000015', 'd0000000-0000-4000-8000-000000000015', 'O-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000016', 'd0000000-0000-4000-8000-000000000016', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000017', 'd0000000-0000-4000-8000-000000000017', 'A-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000018', 'd0000000-0000-4000-8000-000000000018', 'O+', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000019', 'd0000000-0000-4000-8000-000000000019', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000020', 'd0000000-0000-4000-8000-000000000020', 'A+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000021', 'd0000000-0000-4000-8000-000000000021', 'O+', '{}', ARRAY['Bronchial Asthma']::TEXT[], '{}', 'Under review for bronchial asthma.'),
  ('e0000000-0000-4000-8000-000000000022', 'd0000000-0000-4000-8000-000000000022', 'B+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000023', 'd0000000-0000-4000-8000-000000000023', 'A+', '{}', ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000024', 'd0000000-0000-4000-8000-000000000024', 'AB+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000025', 'd0000000-0000-4000-8000-000000000025', 'O-', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000026', 'd0000000-0000-4000-8000-000000000026', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000027', 'd0000000-0000-4000-8000-000000000027', 'A-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000028', 'd0000000-0000-4000-8000-000000000028', 'O+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000029', 'd0000000-0000-4000-8000-000000000029', 'B+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000030', 'd0000000-0000-4000-8000-000000000030', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000031', 'd0000000-0000-4000-8000-000000000031', 'O+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000032', 'd0000000-0000-4000-8000-000000000032', 'B+', ARRAY['Dust']::TEXT[], ARRAY['Hypertension']::TEXT[], ARRAY['Amlodipine 5mg']::TEXT[], 'Under review for hypertension.'),
  ('e0000000-0000-4000-8000-000000000033', 'd0000000-0000-4000-8000-000000000033', 'A+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000034', 'd0000000-0000-4000-8000-000000000034', 'AB+', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000035', 'd0000000-0000-4000-8000-000000000035', 'O-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000036', 'd0000000-0000-4000-8000-000000000036', 'B-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000037', 'd0000000-0000-4000-8000-000000000037', 'A-', '{}', '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000038', 'd0000000-0000-4000-8000-000000000038', 'O+', '{}', ARRAY['Type 2 Diabetes Mellitus']::TEXT[], ARRAY['Metformin 500mg']::TEXT[], 'Under review for type 2 diabetes mellitus.'),
  ('e0000000-0000-4000-8000-000000000039', 'd0000000-0000-4000-8000-000000000039', 'B+', ARRAY['Dust']::TEXT[], '{}', '{}', NULL),
  ('e0000000-0000-4000-8000-000000000040', 'd0000000-0000-4000-8000-000000000040', 'A+', '{}', '{}', '{}', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------- Consultations ----------
-- hospital_id records the facility of origin for every entry, which is what
-- makes inter-district continuity legible (Phase 14).
INSERT INTO consultations (id, worker_id, doctor_id, hospital_id, visit_date, department, symptoms, diagnosis, notes, follow_up_date) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-02-11', 'General Medicine', 'Fever, productive cough for five days', 'Acute bronchitis', 'Penicillin allergy noted. Macrolide selected in preference to amoxicillin.', '2026-02-18'),
  ('f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-02-18', 'General Medicine', 'Cough improving, no fever', 'Acute bronchitis — resolving', 'Course completed. No further review required at this facility.', NULL),
  ('f0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-06-04', 'General Medicine', 'Relocated to Kozhikode for work. Sore throat, fever 38.4C', 'Acute tonsillitis', 'Prior Ernakulam record retrieved on MHID. Penicillin allergy confirmed before prescribing; azithromycin selected.', '2026-06-11'),
  ('f0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-03-02', 'General Medicine', 'Recurrent hand dermatitis', 'Contact dermatitis', 'Occupational exposure in fish processing. Barrier gloves advised.', '2026-03-16'),
  ('f0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', '2026-01-28', 'Orthopaedics', 'Lower back pain after lifting', 'Mechanical low back pain', 'No red flag features. Conservative management.', '2026-02-11'),
  ('f0000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', '2026-04-09', 'General Medicine', 'Routine review, known diabetic', 'Type 2 diabetes mellitus — follow up', 'Glycaemic control acceptable. Continue current regimen.', '2026-07-09'),
  ('f0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-02-25', 'General Medicine', 'Headache, dizziness on exertion', 'Essential hypertension', 'Newly diagnosed. Commenced on antihypertensive therapy.', '2026-03-25'),
  ('f0000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', '2026-05-14', 'General Medicine', 'Burning micturition', 'Lower urinary tract infection', 'Urine culture sent. Empirical therapy commenced.', '2026-05-21'),
  ('f0000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-03-19', 'General Medicine', 'Persistent cough, weight loss', 'Suspected pulmonary tuberculosis — under investigation', 'Sputum sent for CBNAAT. Contact tracing initiated at the workplace.', '2026-03-26'),
  ('f0000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', '2026-04-22', 'Orthopaedics', 'Laceration to left forearm at work', 'Laceration, left forearm', 'Wound cleaned and sutured. Penicillin allergy on record; cephalosporin avoided.', '2026-04-29'),
  ('f0000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', '2026-02-06', 'General Medicine', 'Generalised weakness', 'Iron deficiency anaemia', 'Haemoglobin low. Oral iron commenced, dietary advice given.', '2026-03-06'),
  ('f0000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000018', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', '2026-05-30', 'General Medicine', 'Fever with chills, three days', 'Undifferentiated febrile illness', 'Dengue and malaria screening negative. Symptomatic management.', '2026-06-03'),
  ('f0000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000021', 'c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', '2026-06-12', 'General Medicine', 'Breathlessness on exertion, known asthmatic', 'Bronchial asthma — mild exacerbation', 'Inhaler technique reviewed and corrected.', '2026-07-12'),
  ('f0000000-0000-4000-8000-000000000014', 'd0000000-0000-4000-8000-000000000024', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-03-08', 'General Medicine', 'Pain in right shoulder after fall', 'Soft tissue injury, right shoulder', 'Radiograph shows no fracture.', NULL),
  ('f0000000-0000-4000-8000-000000000015', 'd0000000-0000-4000-8000-000000000026', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-04-17', 'General Medicine', 'Skin rash on trunk', 'Tinea corporis', 'Topical antifungal prescribed. Hygiene advice given in Assamese.', '2026-05-01'),
  ('f0000000-0000-4000-8000-000000000016', 'd0000000-0000-4000-8000-000000000029', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-05-05', 'General Medicine', 'Abdominal pain, loose stools', 'Acute gastroenteritis', 'Oral rehydration. Water source at the accommodation to be inspected.', '2026-05-08'),
  ('f0000000-0000-4000-8000-000000000017', 'd0000000-0000-4000-8000-000000000033', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-06-20', 'General Medicine', 'Follow up, cold storage worker', 'Occupational health review — no abnormality detected', 'Routine periodic examination. Fit for duty.', NULL),
  ('f0000000-0000-4000-8000-000000000018', 'd0000000-0000-4000-8000-000000000036', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', '2026-01-19', 'Orthopaedics', 'Ankle sprain, scaffolding site', 'Grade II ankle sprain, right', 'Immobilised. Physiotherapy referral made.', '2026-02-02')
ON CONFLICT (id) DO NOTHING;

-- ---------- Prescriptions ----------
INSERT INTO prescriptions (id, consultation_id, medicine, dosage, frequency, duration_days, instructions) VALUES
  ('10000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'Azithromycin', '500 mg', 'Once daily', 3, 'After food. Penicillin allergy on record — do not substitute amoxicillin.'),
  ('10000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Paracetamol', '650 mg', 'Three times daily', 5, 'For fever above 38C.'),
  ('10000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000003', 'Azithromycin', '500 mg', 'Once daily', 5, 'Penicillin allergy confirmed at Kozhikode before prescribing.'),
  ('10000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000003', 'Povidone-iodine gargle', '15 ml', 'Twice daily', 5, 'Do not swallow.'),
  ('10000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000004', 'Mometasone cream', '0.1%', 'Twice daily', 14, 'Apply thinly to affected skin.'),
  ('10000000-0000-4000-8000-000000000006', 'f0000000-0000-4000-8000-000000000005', 'Ibuprofen', '400 mg', 'Twice daily', 7, 'After food. Stop if abdominal pain occurs.'),
  ('10000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000006', 'Metformin', '500 mg', 'Twice daily', 90, 'Continue existing regimen. Review in three months.'),
  ('10000000-0000-4000-8000-000000000008', 'f0000000-0000-4000-8000-000000000007', 'Amlodipine', '5 mg', 'Once daily', 30, 'Take in the morning. Blood pressure to be checked fortnightly.'),
  ('10000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-000000000008', 'Nitrofurantoin', '100 mg', 'Twice daily', 5, 'Complete the course. Increase fluid intake.'),
  ('10000000-0000-4000-8000-000000000010', 'f0000000-0000-4000-8000-000000000010', 'Tetanus toxoid', '0.5 ml', 'Single dose', 1, 'Administered at the time of suturing.'),
  ('10000000-0000-4000-8000-000000000011', 'f0000000-0000-4000-8000-000000000010', 'Doxycycline', '100 mg', 'Twice daily', 5, 'Selected in view of documented penicillin allergy.'),
  ('10000000-0000-4000-8000-000000000012', 'f0000000-0000-4000-8000-000000000011', 'Ferrous sulphate', '200 mg', 'Twice daily', 60, 'After food. Stools may darken; this is expected.'),
  ('10000000-0000-4000-8000-000000000013', 'f0000000-0000-4000-8000-000000000013', 'Salbutamol inhaler', '100 mcg', 'Two puffs as required', 30, 'Use a spacer. Review technique at follow up.'),
  ('10000000-0000-4000-8000-000000000014', 'f0000000-0000-4000-8000-000000000015', 'Clotrimazole cream', '1%', 'Twice daily', 21, 'Continue for one week after the rash clears.'),
  ('10000000-0000-4000-8000-000000000015', 'f0000000-0000-4000-8000-000000000016', 'Oral rehydration salts', '1 sachet', 'After each loose stool', 3, 'Dissolve in one litre of clean water.'),
  ('10000000-0000-4000-8000-000000000016', 'f0000000-0000-4000-8000-000000000018', 'Diclofenac gel', '1%', 'Three times daily', 10, 'Topical use only.')
ON CONFLICT (id) DO NOTHING;

-- ---------- Immunisations ----------
INSERT INTO vaccinations (id, worker_id, vaccine_name, dose_number, administered_on, next_due_on, hospital_id) VALUES
  ('20000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000003', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000005', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000006', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000007', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000009', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000009', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000010', 'd0000000-0000-4000-8000-000000000010', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000011', 'd0000000-0000-4000-8000-000000000011', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000012', 'd0000000-0000-4000-8000-000000000012', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000013', 'd0000000-0000-4000-8000-000000000013', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000014', 'd0000000-0000-4000-8000-000000000015', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000015', 'd0000000-0000-4000-8000-000000000015', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000016', 'd0000000-0000-4000-8000-000000000015', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000017', 'd0000000-0000-4000-8000-000000000017', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000018', 'd0000000-0000-4000-8000-000000000018', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000019', 'd0000000-0000-4000-8000-000000000019', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000020', 'd0000000-0000-4000-8000-000000000020', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000021', 'd0000000-0000-4000-8000-000000000021', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000022', 'd0000000-0000-4000-8000-000000000021', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000023', 'd0000000-0000-4000-8000-000000000023', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000024', 'd0000000-0000-4000-8000-000000000024', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000025', 'd0000000-0000-4000-8000-000000000025', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000026', 'd0000000-0000-4000-8000-000000000025', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000027', 'd0000000-0000-4000-8000-000000000027', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000028', 'd0000000-0000-4000-8000-000000000027', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000029', 'd0000000-0000-4000-8000-000000000029', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000030', 'd0000000-0000-4000-8000-000000000030', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000031', 'd0000000-0000-4000-8000-000000000030', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000032', 'd0000000-0000-4000-8000-000000000031', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000033', 'd0000000-0000-4000-8000-000000000033', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000034', 'd0000000-0000-4000-8000-000000000033', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000035', 'd0000000-0000-4000-8000-000000000035', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000036', 'd0000000-0000-4000-8000-000000000035', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000037', 'd0000000-0000-4000-8000-000000000036', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000038', 'd0000000-0000-4000-8000-000000000037', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000039', 'd0000000-0000-4000-8000-000000000039', 'Tetanus and Adult Diphtheria (Td)', 'Booster', '2026-01-20', '2036-01-20', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000040', 'd0000000-0000-4000-8000-000000000039', 'Hepatitis B', 'Dose 1', '2026-02-15', '2026-03-15', 'a0000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000041', 'd0000000-0000-4000-8000-000000000040', 'Typhoid conjugate', 'Single dose', '2026-03-10', '2029-03-10', 'a0000000-0000-4000-8000-000000000005')
ON CONFLICT (id) DO NOTHING;

-- ---------- Mental health screenings (sensitive tier) ----------
-- Access is restricted to practitioners holding can_access_mental_health, and
-- every row records explicit consent. This table is NEVER joined into a
-- general health-record query (CLAUDE.md §6).
INSERT INTO mental_health_screenings (id, worker_id, instrument, score, severity, counsellor_id, notes, consent_given, follow_up_date, screened_on) VALUES
  ('30000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', 'PHQ-9', 6, 'Mild', 'b0000000-0000-4000-8000-000000000013', 'Reports homesickness and disturbed sleep. Supportive counselling offered. Reviewed in Assamese with an interpreter present.', true, '2026-04-05', '2026-03-05'),
  ('30000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'PHQ-9', 13, 'Moderate', 'b0000000-0000-4000-8000-000000000013', 'Low mood following prolonged separation from family. Counselling commenced. No suicidal ideation elicited.', true, '2026-04-04', '2026-03-21'),
  ('30000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000011', 'GAD-7', 11, 'Moderate', 'b0000000-0000-4000-8000-000000000013', 'Anxiety symptoms concurrent with low mood. Managed alongside the depressive presentation.', true, '2026-04-04', '2026-03-21'),
  ('30000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000019', 'GAD-7', 4, 'Minimal', 'b0000000-0000-4000-8000-000000000013', 'Screening within normal limits. No intervention indicated.', true, NULL, '2026-04-12'),
  ('30000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000027', 'PHQ-9', 9, 'Mild', 'b0000000-0000-4000-8000-000000000013', 'Work-related stress. Sleep hygiene advice given and workplace welfare officer informed with consent.', true, '2026-06-08', '2026-05-08'),
  ('30000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000034', 'PHQ-9', 4, 'Minimal', 'b0000000-0000-4000-8000-000000000013', 'Routine screening at periodic health examination. No concern.', true, NULL, '2026-06-02')
ON CONFLICT (id) DO NOTHING;

-- ---------- Appointments ----------
INSERT INTO appointments (id, worker_id, doctor_id, hospital_id, scheduled_at, department, reason, status) VALUES
  ('40000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-08-12 10:00:00+05:30', 'General Medicine', 'Follow up after tonsillitis', 'Scheduled'),
  ('40000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', '2026-08-10 09:30:00+05:30', 'General Medicine', 'Quarterly diabetic review', 'Confirmed'),
  ('40000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-08-14 11:15:00+05:30', 'General Medicine', 'Blood pressure review', 'Scheduled'),
  ('40000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-08-07 08:45:00+05:30', 'General Medicine', 'Sputum result review', 'Completed'),
  ('40000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', '2026-08-19 10:30:00+05:30', 'Orthopaedics', 'Suture removal follow up', 'Scheduled'),
  ('40000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000021', 'c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', '2026-08-11 15:00:00+05:30', 'General Medicine', 'Asthma review', 'Confirmed'),
  ('40000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000026', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '2026-08-06 12:00:00+05:30', 'General Medicine', 'Rash review', 'Cancelled'),
  ('40000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000036', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', '2026-08-20 09:00:00+05:30', 'Orthopaedics', 'Physiotherapy progress review', 'Scheduled')
ON CONFLICT (id) DO NOTHING;

-- ---------- Government schemes ----------
-- eligibility_rules is JSONB and is evaluated by the recommendation engine
-- (CLAUDE.md §2 capability 3). The rule shapes below are the engine's input
-- contract; the engine itself is delivered in a later phase.
INSERT INTO schemes (id, name, authority, benefit, eligibility_rules, apply_url) VALUES
  ('50000000-0000-4000-8000-000000000001', 'Awaz Health Insurance Scheme', 'Government of Kerala', 'Free health insurance cover of Rs 15,000 and accident cover of Rs 2,00,000 for registered inter-state migrant workers.', '{"minAge":18,"maxAge":60,"requiresMigrantRegistration":true}'::jsonb, 'https://dol.kerala.gov.in'),
  ('50000000-0000-4000-8000-000000000002', 'Karunya Arogya Suraksha Padhathi', 'Government of Kerala', 'Cashless secondary and tertiary treatment at empanelled facilities for eligible households.', '{"minAge":0,"maxAge":120,"incomeBelowThreshold":true}'::jsonb, 'https://sha.kerala.gov.in'),
  ('50000000-0000-4000-8000-000000000003', 'Ayushman Bharat — PM-JAY', 'Government of India', 'Cover of up to Rs 5,00,000 per family per year for secondary and tertiary hospitalisation.', '{"minAge":0,"maxAge":120,"incomeBelowThreshold":true}'::jsonb, 'https://pmjay.gov.in'),
  ('50000000-0000-4000-8000-000000000004', 'Apna Ghar Housing Scheme', 'Government of Kerala', 'Subsidised hostel accommodation with sanitation and drinking water for inter-state migrant workers.', '{"minAge":18,"maxAge":60,"requiresMigrantRegistration":true}'::jsonb, 'https://dol.kerala.gov.in'),
  ('50000000-0000-4000-8000-000000000005', 'Kerala Building and Other Construction Workers Welfare Fund', 'Government of Kerala', 'Medical assistance, disability benefit and pension for registered construction workers.', '{"occupations":["Construction labourer","Masonry","Carpentry","Bar bending","Scaffolding","Painting","Plumbing","Helper"]}'::jsonb, 'https://bocwwfb.kerala.gov.in'),
  ('50000000-0000-4000-8000-000000000006', 'Pradhan Mantri Suraksha Bima Yojana', 'Government of India', 'Accidental death and disability cover of Rs 2,00,000 at a nominal annual premium.', '{"minAge":18,"maxAge":70}'::jsonb, 'https://jansuraksha.gov.in')
ON CONFLICT (id) DO NOTHING;

-- ---------- Audit trail ----------
-- Append only. Migration 003 installs triggers that refuse UPDATE and DELETE
-- on this table, so the record of who read a health record cannot be revised.
-- Entries 4 and 5 are the Kozhikode practitioner reading, then adding to, a
-- record originating in Ernakulam — the audit view of Phase 14.
INSERT INTO audit_logs (id, actor_id, actor_role, action, entity, entity_id, ip_address, user_agent) VALUES
  ('60000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000011', 'doctor', 'READ health_record', 'workers', 'd0000000-0000-4000-8000-000000000001', '10.12.4.31', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000011', 'doctor', 'CREATE consultation', 'consultations', 'f0000000-0000-4000-8000-000000000001', '10.12.4.31', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000011', 'doctor', 'CREATE prescription', 'prescriptions', '10000000-0000-4000-8000-000000000001', '10.12.4.31', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000012', 'doctor', 'READ health_record', 'workers', 'd0000000-0000-4000-8000-000000000001', '10.31.7.8', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000012', 'doctor', 'CREATE consultation', 'consultations', 'f0000000-0000-4000-8000-000000000003', '10.31.7.8', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000013', 'doctor', 'CREATE screening', 'mental_health_screenings', '30000000-0000-4000-8000-000000000002', '10.31.7.19', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', 'admin', 'READ analytics_overview', 'analytics', NULL, '10.4.1.2', 'Mozilla/5.0 (demonstration dataset)'),
  ('60000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000101', 'worker', 'READ own_record', 'workers', 'd0000000-0000-4000-8000-000000000001', '49.204.18.77', 'Mozilla/5.0 (demonstration dataset)')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- End of demonstration dataset.
-- ============================================================================
