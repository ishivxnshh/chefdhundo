# TextBee Mobile OTP Setup Guide

Last updated: 2026-06-05

This guide explains how to configure TextBee for ChefDhundo mobile OTP login in simple terms.

## What TextBee Is

TextBee turns an Android phone into an SMS gateway. ChefDhundo asks TextBee to send an OTP, TextBee forwards that request to your Android phone, and your phone sends the SMS using its SIM.

Important:

- The SMS is sent from your Android phone/SIM.
- The phone must stay powered on and connected to the internet.
- The SIM must have outgoing SMS service.
- Delivery speed depends on the phone, TextBee app, SIM/carrier, recipient phone, and SMS filtering.

## Do You Have To Pay?

For small testing, you can usually start with TextBee's free plan.

As of the latest public TextBee pricing page:

- Free plan: 1 active device, 50 messages/day, 300 messages/month.
- Pro plan: paid monthly/yearly, more devices and higher monthly limits.

You may still pay your mobile carrier/SIM provider for SMS depending on your mobile plan. If your SIM has unlimited SMS, TextBee itself is not charging per SMS on the free plan, but you are still using your SIM's SMS allowance.

For production, consider Pro if:

- You expect more than the free monthly limit.
- You need more reliable business support.
- You need more than one gateway device.
- You want room for retries, failed attempts, and customer testing.

## Fresh Setup From Zero

### 1. Prepare The Android Phone

Use a dedicated Android phone if possible.

Checklist:

- Android 6.0 or higher.
- Active SIM card inserted.
- Outgoing SMS works from the normal Messages app.
- Mobile data or Wi-Fi enabled.
- Phone stays charged and online.
- Do not use a phone that will be switched off often.

### 2. Create TextBee Account

1. Open `https://textbee.dev`.
2. Register/sign up.
3. Verify your email address in TextBee.
4. Open the TextBee dashboard.

TextBee account creation can require email. That is only for TextBee dashboard login, not ChefDhundo customer authentication.

### 3. Install TextBee Android App

1. On the Android phone, open `https://textbee.dev/download`.
2. Download the APK.
3. If Android blocks it, allow install from unknown sources for your browser.
4. Install and open the TextBee app.

### 4. Grant Android Permissions

Inside Android settings:

- Allow SMS permission for TextBee.
- Allow notification permission if asked.
- Allow background activity.
- Disable battery optimization for TextBee.
- Set battery mode to Unrestricted/Don't optimize.
- Allow background mobile data/Wi-Fi.

This is critical. If Android blocks SMS permission or background activity, OTPs can be delayed or fail.

### 5. Register The Device

Recommended method:

1. Open TextBee dashboard.
2. Generate API key / get started.
3. Use the QR code if available.
4. Open TextBee app on Android.
5. Scan the QR code.
6. Confirm the dashboard shows the device as Active.

Alternative method:

1. Copy the TextBee API key from the dashboard.
2. Open the TextBee Android app.
3. Paste the API key.
4. Leave device ID blank if the app asks during first registration.
5. Tap Register.
6. Confirm the dashboard shows Active and gives a Device ID.

### 6. Test Direct SMS In TextBee

Before testing ChefDhundo:

1. Go to TextBee dashboard.
2. Use the send SMS/test message feature.
3. Send a message to your own test number.
4. Confirm it arrives within seconds/minutes.
5. Check message status in TextBee.

If direct TextBee SMS is delayed, the issue is not ChefDhundo code. Fix TextBee/device/SIM first.

### 7. Add Values To ChefDhundo

In local development, edit:

```text
webapp/client/.env.local
```

Required values:

```env
TEXTBEE_API_KEY=your-rotated-textbee-api-key
TEXTBEE_DEVICE_ID=your-active-device-id
OTP_SECRET=long-random-secret
AUTH_SECRET=long-random-secret
WHATSAPP_INGEST_SECRET=long-random-secret
```

Never commit `.env.local`.

For production, add the same values in your deployment platform environment variables.

### 8. Restart The App

After changing env values:

```powershell
cd V:\Externals\Projects\Sheryas\chefdhundo\webapp\client
npm run dev
```

Then test:

1. Open `http://localhost:3000/sign-in`.
2. Enter an Indian mobile number.
3. Click send OTP.
4. Check TextBee dashboard status.
5. Enter OTP.
6. Confirm dashboard opens and refresh stays logged in.

## If You Already Configured TextBee

Use this checklist instead of starting over:

1. Open TextBee dashboard.
2. Confirm the device is Active.
3. Confirm Device ID matches `TEXTBEE_DEVICE_ID`.
4. Confirm the API key in `.env.local` is the current active key.
5. Send a direct test SMS from TextBee dashboard.
6. Open the Android TextBee app and confirm it is logged/registered.
7. Confirm Android SMS permission is still enabled.
8. Confirm battery optimization is disabled.
9. Confirm SIM can send SMS manually.
10. Restart ChefDhundo after changing env values.

## Why OTP Can Arrive 2-3 Hours Late

If ChefDhundo returns success quickly but SMS arrives hours later, likely causes are:

- Android blocked TextBee in background.
- Battery saver paused the TextBee app.
- Phone internet was unstable.
- SIM had weak carrier signal.
- SIM/carrier queued outgoing SMS.
- Recipient phone filtered OTP-like SMS as spam.
- TextBee accepted the message but it stayed in pending/sent state.
- Too many OTP attempts hit carrier throttling or spam filtering.

What the app can control:

- Calling TextBee.
- Storing OTP securely.
- Showing API errors.
- Rate-limiting abuse.

What the app cannot fully control:

- Carrier SMS delivery time.
- Android OS background restrictions.
- Recipient phone spam filtering.

## Delay Troubleshooting

Run these in order:

1. Send SMS from the Android phone's normal Messages app.
2. Send SMS from TextBee dashboard.
3. Check TextBee message status.
4. Keep TextBee app open in foreground and send again.
5. Turn off battery saver.
6. Disable battery optimization for TextBee.
7. Use mobile data instead of Wi-Fi, then try Wi-Fi instead of mobile data.
8. Restart the Android phone.
9. Try a different recipient number.
10. Try a different SIM/carrier if delays continue.

If the normal Messages app is delayed too, it is a SIM/carrier issue.

If normal Messages is fast but TextBee is delayed, it is TextBee app/permission/background/device configuration.

If TextBee dashboard direct SMS is fast but ChefDhundo OTP is delayed, then inspect ChefDhundo `/api/auth/request-otp` logs and TextBee API response.

## Production Recommendations

- Use a dedicated Android phone for OTP gateway.
- Keep it plugged in.
- Keep it on stable internet.
- Use a reliable SIM with SMS enabled.
- Disable battery optimization.
- Monitor TextBee dashboard daily.
- Keep monthly OTP usage below your plan limit.
- Rotate API keys before production.
- Do not share OTP/API/session secrets in chat, screenshots, or commits.

## Final Go-Live Checklist

- TextBee direct SMS works.
- ChefDhundo OTP works locally.
- ChefDhundo OTP works on production domain.
- Dashboard stays logged in after refresh.
- Logout works only when clicking Logout.
- TextBee message usage is within plan limits.
- All shared secrets are rotated.
