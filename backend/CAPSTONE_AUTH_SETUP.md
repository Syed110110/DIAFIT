# DiaFit Capstone Foundation: Authentication and Roles

The current capstone prototype covers Modules 1–7, with identities, care-team access, dose/glucose records, alerts, shifts, and audit history in PostgreSQL. Existing profile and wellness tracker records remain in MongoDB during the incremental migration and keep their 24-character Mongo ObjectId-compatible user IDs.

## Local Setup

1. Install PostgreSQL and create a database named `diafit`.
2. Copy `.env.example` to `.env` in this directory and set `DATABASE_URL`, `MONGODB_URI`, and a long random `JWT_SECRET`. Never commit `.env`.
3. Install backend dependencies with `npm install`.
4. Apply the versioned schema with `npm run db:migrate`. This creates identities/access grants, dose/glucose/conflict tables, caregiver shifts, alerts, notifications, and audit history.
5. If importing existing accounts, run `npm run db:import-mongo-users` after the migration. Existing IDs and password hashes are preserved; legacy plaintext passwords are hashed during import.
6. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, then run `npm run db:seed-admin` to create the first administrator.
7. To create a reproducible care-team demo, set `SEED_DEMO_PASSWORD` and run `npm run db:seed-demo-family`. The script creates Patient, Caregiver, Family Coordinator, and Doctor accounts, approves their patient-access grants, schedules an active caregiver shift, and adds synthetic dose/glucose examples including one missed-dose alert and one unresolved two-author conflict. It leaves glucose limits unset.
8. Start the API with `npm run dev`.
9. In the repository root, copy `.env.example` to `.env` and run `npm run dev` to start Vite. The frontend API URL then targets the local backend.

The backend now requires both PostgreSQL and MongoDB at startup. PostgreSQL is authoritative for login and role checks. MongoDB continues to own the pre-existing profile, water, nutrition, exercise, and diet-plan documents until those modules are migrated in later steps.
WhatsApp reminders and alert delivery are disabled by default. Alert WhatsApp sending requires `ENABLE_WHATSAPP_ALERTS=true`, valid `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER`, plus the recipient's explicit opt-in and E.164 number in **Alerts**. Enable it only with a verified Twilio sender/recipient; otherwise alerts stay in the in-app inbox. `ENABLE_WHATSAPP_CRON=true` is a separate legacy water-reminder feature.

## Demo Flow

- Sign in as the administrator and open **User Access**. Create users and assign one of the five roles.
- Sign in as a Patient, open **Care Team**, and request access using a provisioned care-team account's email.
- Approve the pending request as the Patient.
- Sign in as that Caregiver, Family Coordinator, or Doctor, open **Care Team**, select the approved Patient, then open an existing tracker. Its API calls carry the selected patient ID and are checked server-side.
- Attempting a patient-data API as Admin returns `403`; Admin has no clinical-data route access.
- Open **Care Logs** as Patient or Caregiver, schedule a demo dose, review it, then confirm a dose log or glucose reading.
- Doctor can configure per-patient dose windows and optional clinician-supplied glucose limits.
- Family Coordinator can select one entry from the seeded conflict and confirm it; both original logs remain visible.
- Open **Alerts** as the caregiver to acknowledge the seeded missed-dose notification; show SOS as an immediate in-app escalation if geolocation is allowed (the API also accepts no location).
- As Patient or Family Coordinator, open **Care Team** and schedule or cancel a non-overlapping caregiver shift. Alerts during that shift route to that caregiver.
- Open **Audit History** as the Family Coordinator to show patient-scoped API read/write records. Payloads and clinical values are not copied into the audit table.
- The minute scheduler marks other overdue pending doses missed and creates routed alerts.

The login, Care Logs, and Alerts pages state that DiaFit does not diagnose or prescribe. Modules 1–7 are implemented in source; Walk Buddy is the remaining original module. The predictive model, voice input, subscription, and final PostgreSQL migration of existing Mongo tracker data also remain future work. Alert delivery is in-app only; no SMS, WhatsApp, or push notification is sent.

## Checks

- Run backend tests with `npm test` from this directory. They cover patient access, dose timing, cross-role conflict detection, glucose alert classification, escalation decisions, and audit request policy.
- Run the production UI check with `npm run build` from the repository root.