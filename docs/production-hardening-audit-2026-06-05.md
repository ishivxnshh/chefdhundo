# Production Hardening Audit - 2026-06-05

## Scope

This pass reviewed the Chefdhundo webapp and the separate `supabase-mcp-server` helper package for authentication, authorization, secret exposure, dependency health, runtime behavior, and production readiness.

## Commands Run

```bash
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
npm audit --audit-level=moderate # in supabase-mcp-server
npm run build # in supabase-mcp-server
```

Runtime/browser validation was also performed on the built Next.js app with a signed mobile session cookie.
Additional signed-session HTTP validation was performed against the local dev server at `http://localhost:3000`.

## Findings Fixed In This Pass

### High: unauthenticated Supabase MCP query endpoint

`supabase-mcp-server` exposed `POST /query` with caller-controlled `table` and `query`, permissive CORS, and no authentication. If deployed, it could expose or enumerate Supabase data depending on anon-key policies.

Fix:

- Added mandatory `MCP_API_KEY` startup requirement.
- Added `x-mcp-api-key` / Bearer token auth middleware.
- Restricted CORS to `MCP_ALLOWED_ORIGIN`.
- Restricted tables to an allowlist.
- Validated select expressions and capped response limits.
- Added body size limit.
- Fixed TypeScript build include so only `src/**/*.ts` is built.
- Rebuilt tracked `dist/index.js`.

### Medium: stale production docs still referenced Clerk

Root docs and deployment docs still instructed production setup for Clerk after the migration to mobile OTP.

Fix:

- Updated `readme.md` to describe mobile OTP auth.
- Updated `DEPLOYMENT.md` production env and post-deployment checklist.
- Updated `.env.example` with `WHATSAPP_INGEST_SECRET` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

### High: dashboard could flash a false missing-user state after refresh

The signed-session harness reproduced a dashboard refresh where `/api/auth/me` accepted the valid mobile cookie, but the server-rendered dashboard HTML still contained `Mobile account not found in database`. Root cause: the client dashboard read the Zustand Supabase profile store before that store had hydrated from the server-provided user or completed the fallback fetch.

Fix:

- Added an explicit `waitingForMobileProfile` loading state.
- Dashboard now waits for the mobile profile store to finish before showing the missing-user message.
- Navbar now renders a retry/session-check control on auth errors instead of incorrectly showing `Login`.
- `useAuth()` exposes the existing `reload()` method so the retry control does not create another independent auth state.

### Medium: Next/PostCSS advisory

`npm audit --audit-level=moderate` reported GHSA-qx2v-qp2m-jg93 because stable Next.js bundled `postcss@8.4.31`. `npm audit fix --force` suggested an unsafe framework downgrade.

Fix:

- Added an npm override for Next's nested PostCSS dependency: `next -> postcss@8.5.10`.
- Regenerated `webapp/client/package-lock.json`.
- Confirmed `npm ls next postcss --depth=3` resolves Next's nested PostCSS as `8.5.10 overridden`.
- Confirmed `npm audit --audit-level=moderate` now reports `0 vulnerabilities`.

Future cleanup:

- Remove the override after stable Next.js bundles `postcss >= 8.5.10`.

### Low: stale Clerk/email artifacts outside active app

The active Next.js app no longer had email login wiring, but an old server-side Clerk/email sync function and sample email SQL comments remained in `webapp/server`.

Fix:

- Removed `webapp/server/src/models/edgeFunction/handleuserSybc.ts`.
- Replaced sample email users in SQL comments with mobile identity examples.
- Removed historical `.old` SQL files and `oldSupabaseDB.txt` that still documented email/Clerk-era setup.
- Updated the production-safe Supabase schema so legacy email columns are nullable in fresh and existing deployments.

Remaining email references:

- Generated Supabase TypeScript types still include nullable `email` fields because the columns are intentionally retained for one rollback-safe release.
- Resume response sanitization still lists `email` as a private field to strip from API responses.
- TextBee setup documentation mentions email only for TextBee account verification, not ChefDhundo user login.

## Findings Still Open / Deferred

### Critical operational risk: leaked/shared secrets must be rotated

No committed live secrets were found outside ignored `.env.local`, but secrets were shared in chat and visible in local files.

Required before production:

- Rotate Supabase service secret / PAT.
- Rotate TextBee API key.
- Rotate `OTP_SECRET`.
- Rotate `AUTH_SECRET` to invalidate existing sessions.
- Rotate `WHATSAPP_INGEST_SECRET` if already shared.

### Medium: live OTP delivery cannot be fully proven without sending SMS

The code path can be tested without live SMS, but actual delivery depends on the TextBee Android gateway phone, Android permissions, battery optimization, SIM signal, carrier routing, and recipient filtering.

Required production smoke:

- Send a TextBee direct test message.
- Run one app OTP login against each agreed production test number.
- Confirm TextBee message status reaches delivered or diagnose gateway/carrier delay.

## Verification Results

### Passed

- `webapp/client`: `npm run lint`
- `webapp/client`: `npm test` - 3 files, 16 tests
- `webapp/client`: `npm run build`
- `webapp/client`: `npm audit --audit-level=moderate` - 0 vulnerabilities after PostCSS override
- `supabase-mcp-server`: `npm audit --audit-level=moderate` - 0 vulnerabilities
- `supabase-mcp-server`: `npm run build`
- Signed mobile session harness: 20 dashboard refreshes returned `200`; logged-out dashboard redirected; logged-out resume API returned `401`; basic admin API returned `403`; signed resume responses did not include checked private fields.
- Secret scan: no live secrets found in tracked files outside expected templates/docs

## Production TODO Plan

1. Rotate all shared secrets and update deployment environment variables.
2. Deploy the `mobile-auth` branch to a preview environment.
3. Apply Supabase migrations and verify schema/RLS.
4. Run the mobile OTP smoke test with real TextBee gateway status checks.
5. Run dashboard refresh/avatar/logout browser checks on the production HTTPS domain.
6. Run resume authorization checks with seeded basic/pro/admin users.
7. Track stable Next.js releases and remove the PostCSS override once Next bundles the patched version.
8. Merge `mobile-auth` to `main` only after the above passes.
