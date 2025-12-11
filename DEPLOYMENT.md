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

2. Set up custom domain (optional):
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain (e.g., www.chefdhundo.com)
   - Update DNS records as instructed

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
