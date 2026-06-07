# ChefDhundo Mobile OTP Setup Guide (TextBee + Supabase)

Last verified: 2026-05-30

This guide explains how to run ChefDhundo mobile OTP login in local/dev and production.

## 1. What this implementation does

- Replaces the legacy third-party login flow with mobile OTP login.
- Sends OTP using TextBee (Android phone as SMS gateway).
- Verifies OTP in backend and creates secure `chef_auth` cookie.
- Protects `/dashboard` and `/admin` using middleware.
- Assigns admin access to `+91 93608 04740`.

---

## 2. Required accounts and prerequisites

You need:

1. Supabase project
2. TextBee account + Android app installed
3. Android phone with active SIM and SMS capability
4. Node.js + npm installed

---

## 3. Android phone setup (critical)

On the Android device with TextBee installed:

1. Open Android Settings > Apps > TextBee > Permissions.
2. Enable SMS permissions (`Send SMS`, and any SMS permissions requested by the app).
3. Disable battery optimization for TextBee.
4. Allow background activity and unrestricted data.
5. Keep phone online and with network coverage.

If SMS permission is missing, OTP send fails with:

- `PERMISSION_DENIED`
- `SMS permission not granted`

---

## 4. TextBee setup

Confirm in TextBee dashboard:

1. Device ID is correct.
2. API key is correct.
3. Device is active.
4. SMS test messages can be sent.

ChefDhundo uses:

- `TEXTBEE_API_KEY`
- `TEXTBEE_DEVICE_ID`

---

## 5. Project environment setup

Create/edit:

- `webapp/client/.env.local`

Set:

```env
TEXTBEE_API_KEY=...
TEXTBEE_DEVICE_ID=...
OTP_SECRET=...
AUTH_SECRET=...

SUPABASE_PROJECT_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLIC_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...
```

Generate strong random values for:

- `OTP_SECRET`
- `AUTH_SECRET`

---

## 6. Supabase table setup (recommended for production)

Run this SQL in Supabase SQL Editor (or execute `webapp/server/DBcommands/phoneOtps.sql`):

```sql
create extension if not exists pgcrypto;

create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_phone_idx on public.phone_otps(phone);
create index if not exists phone_otps_expires_idx on public.phone_otps(expires_at);
```

Note:

- App has a fallback in-memory OTP store for local continuity if table is missing.
- For production reliability, create the table.

---

## 7. Run and test locally

From:

- `webapp/client`

Install:

```bash
npm install
```

Run app:

```bash
npm run dev
```

Use automated OTP flow test:

```bash
npm run test:otp -- 9360804740 7305250054
```

The script validates:

1. OTP request API
2. TextBee message status
3. OTP verify API
4. Cookie-based auth
5. Route protection behavior

Expected behavior:

- Admin phone `+91 9360804740` can access `/admin`.
- Non-admin phone redirects from `/admin` to `/dashboard`.

---

## 8. Production deployment checklist

1. Set all env variables on hosting platform.
2. Ensure TextBee device remains online.
3. Ensure Supabase `phone_otps` table exists.
4. Run smoke test (`npm run test:otp`) against deployed URL by setting:

```bash
BASE_URL=https://your-domain.com npm run test:otp -- 9360804740 7305250054
```

5. Rotate leaked/old secrets before go-live.

---

## 9. Troubleshooting

### A) OTP API returns success but SMS not received

Check TextBee message logs:

- If `status = failed` and `errorMessage = SMS permission not granted`, fix Android permissions.

### B) `phone_otps` table missing in test output

- Run SQL from section 6.

### C) Next.js workspace root warning

- Ensure there is only one lockfile for client runtime root.
- This repo is configured to run from `webapp/client`.

### D) `npm audit` vulnerabilities

- `npm audit` output is separate from OTP runtime flow.
- Apply safe upgrades first; avoid forced breaking downgrades.

---

## 10. Security notes

1. Keep `TEXTBEE_API_KEY`, `SUPABASE_SERVICE_ROLE`, `AUTH_SECRET`, `OTP_SECRET` private.
2. Never expose secrets with `NEXT_PUBLIC_`.
3. Use HTTPS in production.
4. Keep OTP TTL short and enforce attempt limits.
5. Add IP-based rate limiting if traffic grows.

---

## 11. Current implementation files

- `webapp/client/src/lib/auth/server.ts`
- `webapp/client/src/lib/auth/client.tsx`
- `webapp/client/src/app/api/auth/request-otp/route.ts`
- `webapp/client/src/app/api/auth/verify-otp/route.ts`
- `webapp/client/src/app/api/auth/logout/route.ts`
- `webapp/client/src/app/api/auth/me/route.ts`
- `webapp/client/src/app/sign-in/[[...sign-in]]/page.tsx`
- `webapp/client/src/middleware.ts`
- `webapp/client/scripts/test-otp-flow.mjs`
- `webapp/server/DBcommands/phoneOtps.sql`
