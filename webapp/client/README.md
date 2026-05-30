
# ChefDhundo Client

See full setup and production guide:

- `webapp/client/MOBILE_OTP_PRODUCTION_GUIDE.md`

## Mobile OTP Local Verification

After starting the app:

```bash
npm run dev
```

Run OTP end-to-end validation for both test numbers:

```bash
npm run test:otp
```

Or pass custom numbers:

```bash
npm run test:otp -- 9360804740 7305250054
```

What this checks:
- OTP request API
- TextBee OTP message history for each recipient
- OTP verify API (session cookie creation)
- Protected route behavior (`/dashboard`, `/admin`)
- Supabase `phone_otps` table availability
