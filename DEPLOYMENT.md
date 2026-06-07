# Deployment Guide for ChefDhundo

## Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- All environment variables ready for production

## Step 1: Prepare Your Code

1. Make sure all your code is committed to Git
2. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Root Directory**: `webapp/client`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (auto-detected)

5. Add Environment Variables:
   Click "Environment Variables" and add all variables from your `.env.local`:
   
   **IMPORTANT**: For production, update these values:
   - `TEXTBEE_API_KEY` - Use a rotated production TextBee API key
   - `TEXTBEE_DEVICE_ID` - Use the production Android gateway device ID
   - `OTP_SECRET` - Use a long random production secret
   - `AUTH_SECRET` - Use a long random production secret
   - `WHATSAPP_INGEST_SECRET` - Use a long random shared secret for trusted WhatsApp/server ingestion
   - `SUPABASE_PROJECT_URL` - Use the production Supabase project URL
   - `SUPABASE_PUBLIC_ANON_KEY` - Use the production publishable/anon key
   - `SUPABASE_SERVICE_ROLE` - Use the production service-role key server-side only
   - `CASHFREE_CLIENT_ID` - Use production ID
   - `CASHFREE_CLIENT_SECRET` - Use production secret
   - `CASHFREE_ENV` - Set to `production`
   - `NEXT_PUBLIC_CASHFREE_ENV` - Set to `production`
   - `NEXT_PUBLIC_APP_URL` - Set to your Vercel URL (for example, https://your-app.vercel.app)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Use live public Razorpay key
   - `RAZORPAY_KEY_SECRET` - Use live secret server-side only

6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your client directory:
   ```bash
   cd webapp/client
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts and add environment variables when asked

## Step 3: Configure Production Environment

### Update Mobile OTP Settings
1. Rotate every secret that has ever been shared in chat or local screenshots.
2. Confirm the TextBee Android gateway phone is online, has SMS permission, and battery optimization is disabled.
3. Confirm `NEXT_PUBLIC_APP_URL` matches the production HTTPS domain.
4. Confirm `AUTH_SECRET`, `OTP_SECRET`, and `WHATSAPP_INGEST_SECRET` exist only in server-side deployment secrets.

### Update Cashfree Settings
1. Log in to Cashfree dashboard
2. Get production credentials
3. Add your Vercel domain to allowed domains

### Update RazorPay Settings
1. Log in to RazorPay dashboard
2. Get live API keys
3. Add your Vercel domain to authorized domains

### Update Supabase Settings
1. Apply the checked-in SQL migrations before production traffic.
2. Confirm RLS is enabled on public tables exposed through Supabase Data API.
3. Confirm service-role keys are only used server-side.

## Step 4: Post-Deployment

1. Test all functionalities:
   - Mobile OTP authentication and dashboard session persistence
   - Payment processing (Cashfree/RazorPay)
   - Database operations (Supabase)
   - Resume uploads and downloads

2. Set up custom domain with GoDaddy:
   - In Vercel dashboard, go to Settings > Domains
   - Add your GoDaddy domain (e.g., chefdhundo.com)
   - Vercel will show DNS records to add
   - Go to GoDaddy DNS Management and add the records (see detailed steps below)

3. Enable Analytics:
   - Vercel Analytics is already integrated via `@vercel/analytics`
   - View analytics in Vercel dashboard

## Monitoring

- Check deployment logs in Vercel dashboard
- Monitor function execution and errors
- Set up error tracking (consider Sentry integration)

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify environment variables are set correctly
- Review build logs in Vercel dashboard

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify API keys are production keys, not test keys
- Ensure CORS is configured correctly for all services

### Database Connection Issues
- Verify Supabase URL and keys
- Check if IP restrictions are set in Supabase

## Connecting GoDaddy Domain to Vercel

### Step 1: Deploy to Vercel First
Complete the deployment steps above to get your Vercel project URL (e.g., `your-project.vercel.app`)

### Step 2: Add Domain in Vercel
1. Go to your Vercel project dashboard
2. Click **Settings** â†’ **Domains**
3. Enter your GoDaddy domain:
   - `chefdhundo.com` (root domain)
   - `www.chefdhundo.com` (www subdomain)
4. Click **Add**

### Step 3: Configure DNS in GoDaddy
Vercel will provide DNS records. Now configure them in GoDaddy:

#### For Root Domain (chefdhundo.com):
1. Log in to GoDaddy â†’ **My Products** â†’ **DNS**
2. Find your domain and click **Manage DNS**
3. Add/Update these records:

**Option A: Using A Records (Recommended)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds
```

**Option B: Using CNAME (Alternative)**
- Note: GoDaddy doesn't support CNAME for root domains easily
- Use A record method above instead

#### For WWW Subdomain (www.chefdhundo.com):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

### Step 4: Wait for DNS Propagation
- DNS changes take 5 minutes to 48 hours to propagate
- Usually propagates within 1-2 hours
- Check status in Vercel dashboard (Settings â†’ Domains)
- Use https://dnschecker.org to verify propagation

### Step 5: Update Environment Variables
Once domain is connected, update in Vercel:
```
NEXT_PUBLIC_APP_URL=https://chefdhundo.com
```

### Step 6: Update Service Configurations

#### Update Mobile OTP
1. Confirm TextBee delivery from the production gateway phone.
2. Confirm OTP login, refresh persistence, and logout on the production domain.
3. Confirm rotated secrets are active and old sessions were invalidated.

#### Update RazorPay
1. Go to RazorPay dashboard â†’ Settings
2. Add `chefdhundo.com` to authorized domains
3. Update webhook endpoints

#### Update Supabase
1. Go to Supabase dashboard â†’ Authentication â†’ URL Configuration
2. Add site URL: `https://chefdhundo.com`
3. Add redirect URLs:
   - `https://chefdhundo.com/**`
   - `https://www.chefdhundo.com/**`

### Troubleshooting GoDaddy + Vercel

**Domain not verifying:**
- Wait 24 hours for DNS propagation
- Clear browser cache
- Check DNS records are exactly as Vercel specified
- Remove any conflicting records (old A records pointing elsewhere)

**SSL Certificate issues:**
- Vercel automatically provisions SSL (Let's Encrypt)
- Can take up to 24 hours after DNS propagation
- Ensure both www and root domain are added in Vercel

**Redirect issues:**
- In Vercel, configure www to redirect to root or vice versa
- Settings â†’ Domains â†’ Click domain â†’ Redirect

## Alternative Hosting Options

### Netlify
- Similar to Vercel, great Next.js support
- Root directory: `webapp/client`
- Build command: `npm run build`

### Railway
- Good for full-stack apps with databases
- Supports both Next.js frontend and database hosting

### AWS Amplify
- AWS-based hosting
- Good if you're already using AWS services

### DigitalOcean App Platform
- Simple deployment
- Fixed pricing model

## Notes

- Your app uses Next.js 15.5.7 with App Router
- Ensure Node.js version is compatible (check package.json engines if specified)
- The app includes server-side API routes which will run as serverless functions
- Static assets will be served from CDN automatically
