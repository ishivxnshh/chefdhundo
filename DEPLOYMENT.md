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
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Use production key (pk_live_...)
   - `CLERK_SECRET_KEY` - Use production key (sk_live_...)
   - `CASHFREE_CLIENT_ID` - Use production ID
   - `CASHFREE_CLIENT_SECRET` - Use production secret
   - `CASHFREE_ENV` - Set to `production`
   - `NEXT_PUBLIC_CASHFREE_ENV` - Set to `production`
   - `NEXT_PUBLIC_APP_URL` - Set to your Vercel URL (e.g., https://your-app.vercel.app)
   - `RAZORPAY_KEY_ID` - Use live key (rzp_live_...)
   - `RAZORPAY_KEY_SECRET` - Use live secret

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

### Update Clerk Settings
1. Go to https://dashboard.clerk.com
2. Switch to production mode or use your production instance
3. Update Authorized Redirect URLs with your Vercel deployment URL
4. Update CORS settings if needed

### Update Cashfree Settings
1. Log in to Cashfree dashboard
2. Get production credentials
3. Add your Vercel domain to allowed domains

### Update RazorPay Settings
1. Log in to RazorPay dashboard
2. Get live API keys
3. Add your Vercel domain to authorized domains

### Update Supabase Settings
1. Go to your Supabase project settings
2. Add your Vercel URL to allowed domains in Authentication settings

## Step 4: Post-Deployment

1. Test all functionalities:
   - User authentication (Clerk)
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
2. Click **Settings** → **Domains**
3. Enter your GoDaddy domain:
   - `chefdhundo.com` (root domain)
   - `www.chefdhundo.com` (www subdomain)
4. Click **Add**

### Step 3: Configure DNS in GoDaddy
Vercel will provide DNS records. Now configure them in GoDaddy:

#### For Root Domain (chefdhundo.com):
1. Log in to GoDaddy → **My Products** → **DNS**
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
- Check status in Vercel dashboard (Settings → Domains)
- Use https://dnschecker.org to verify propagation

### Step 5: Update Environment Variables
Once domain is connected, update in Vercel:
```
NEXT_PUBLIC_APP_URL=https://chefdhundo.com
```

### Step 6: Update Service Configurations

#### Update Clerk
1. Go to Clerk dashboard → Configure → Paths
2. Add authorized domains:
   - `chefdhundo.com`
   - `www.chefdhundo.com`
3. Update redirect URLs

#### Update Cashfree
1. Go to Cashfree dashboard
2. Add `chefdhundo.com` to allowed domains
3. Update webhook URLs if needed

#### Update RazorPay
1. Go to RazorPay dashboard → Settings
2. Add `chefdhundo.com` to authorized domains
3. Update webhook endpoints

#### Update Supabase
1. Go to Supabase dashboard → Authentication → URL Configuration
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
- Settings → Domains → Click domain → Redirect

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
