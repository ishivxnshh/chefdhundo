# Chefdhundo Mobile OTP Auth - Production Setup and QA Guide

## What This Migration Does

Chefdhundo now uses mobile OTP authentication backed by:

- TextBee for SMS delivery through the Android gateway device.
- Supabase for OTP storage, user records, roles, resumes, and payments.
- A first-party `chef_auth` HttpOnly cookie for app sessions.

The existing `users.clerk_user_id` database column is intentionally retained for one safe release as a compatibility identity column. New mobile identities are stored as `phone:+91XXXXXXXXXX`.

## Required Environment Variables

Set these only in local or deployment secrets. Do not commit them.

```env
SUPABASE_PROJECT_URL=
SUPABASE_PUBLIC_ANON_KEY=
SUPABASE_SERVICE_ROLE=
TEXTBEE_API_KEY=
TEXTBEE_DEVICE_ID=
OTP_SECRET=
AUTH_SECRET=
WHATSAPP_INGEST_SECRET=
NEXT_PUBLIC_APP_URL=
```

Rotate all secrets that were shared in chat before production release.

## Supabase Setup

Apply the migration in `webapp/server/src/models/migrations/20260604_mobile_auth_security.sql`.

It does the following:

- Makes legacy `users.email` and `resumes.email` nullable for rollback-safe staged removal.
- Adds hashed claim-token fields and claim timestamps to `resumes`.
- Adds TextBee provider status and rate-limit metadata to `phone_otps`.
- Enables RLS on `users`, `resumes`, and `phone_otps`.

After applying, verify:

```sql
select column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('users', 'resumes', 'phone_otps')
order by table_name, ordinal_position;
```

## TextBee Mobile Setup

1. Install and open the TextBee Android app on the gateway phone.
2. Sign in to the same TextBee account used for the API key.
3. Confirm the configured device ID is online in TextBee.
4. Allow SMS permission on Android.
5. Disable battery optimization for TextBee.
6. Keep SIM signal stable and the phone powered on.
7. Send a direct test SMS from TextBee before app testing.
8. Check TextBee message history for `queued`, `sent`, `delivered`, or `failed` status.

A successful API response means TextBee accepted the message for the Android device. It does not guarantee the recipient handset has already received it.

## OTP Delay Diagnosis

If OTP arrives after 2-3 hours, that is usually outside the application code path once TextBee accepts the request. Likely causes:

- Android gateway phone offline, sleeping, or battery optimized.
- Missing Android SMS permission.
- Weak SIM signal or carrier throttling/filtering.
- Recipient phone/carrier filtering or delayed SMS routing.
- TextBee message remaining in `sent` rather than `delivered`.

The app now records provider status metadata so support can distinguish app request failure from gateway/carrier delivery delay.

## Auth QA Checklist

Run these after every deployment:

```bash
npm run lint
npm test
npm run build
```

Manual browser checks:

- Login with a valid Indian mobile number.
- Open `/dashboard` after login.
- Refresh `/dashboard` at least 10-20 times.
- Confirm the navbar never shows `Login` while the session is valid.
- Click the account avatar/logo and confirm it only opens the menu.
- Confirm no `/api/auth/logout` request is sent until the explicit Logout button is clicked.
- Click Logout and confirm `/dashboard` redirects to `/sign-in`.

## Resume Security QA Checklist

- Logged-out `/api/resumes` returns 401.
- Logged-out `/api/resumes/search` returns 401.
- `/api/resumes/check` without `WHATSAPP_INGEST_SECRET` returns 401.
- Basic users do not receive `claim_token`, `claim_token_hash`, raw `resume_file`, passport, email, or internal user IDs.
- Resume download URLs are generated only through `/api/resumes/download` after auth/role checks.
- Claiming a resume requires the signed-in mobile number to match the resume phone number.

## Current Validation Snapshot

Latest local validation on the `mobile-auth` branch:

- `npm run lint` passed.
- `npm test` passed: 3 files, 16 tests.
- `npm run build` passed on Next.js 15.5.18.
- Browser dashboard session test passed with 10 refreshes.
- Avatar click sent zero `/api/auth/logout` requests.
- Explicit logout sent one `/api/auth/logout` request and redirected dashboard to sign-in.
- Unauthenticated resume APIs returned 401.
- WhatsApp resume check without trusted secret returned 401.

## Known Follow-Up

`npm audit --audit-level=moderate` reports a moderate PostCSS advisory through Next.js. The suggested `npm audit fix --force` would downgrade Next to 9.3.3, so do not run it blindly. Upgrade Next when a patched compatible release is available and rerun audit.
