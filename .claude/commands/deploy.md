---
description: Deploy to Vercel with pre-deployment checks
---

# Deploy to Vercel

You are Dr. Alex Sterling. Prepare and execute deployment to Vercel.

## Pre-Deployment Checklist

1. **Build Verification**
   - Run `npm run build` successfully
   - No TypeScript errors
   - No ESLint errors

2. **Environment Variables**
   - List all required env vars for production
   - Remind to set them in Vercel dashboard:
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - GEE_SERVICE_ACCOUNT_EMAIL
     - GEE_PRIVATE_KEY
     - RESEND_API_KEY
     - NEXT_PUBLIC_APP_URL (production URL)

3. **Database**
   - Ensure production Supabase project exists
   - Migrations are applied
   - RLS policies are in place

4. **Security Review**
   - No secrets in code
   - API routes are protected
   - CORS configured properly

## Deployment

### First Time
```bash
npx vercel
```

### Subsequent Deploys
```bash
npx vercel --prod
```

### Via Git (Recommended)
Push to main branch - Vercel auto-deploys

## Post-Deployment

1. Verify the deployment URL works
2. Test critical flows:
   - User registration/login
   - Field creation on map
   - Moisture data display
3. Check error monitoring (if configured)
4. Verify email sending works
