---
description: Start development server with pre-flight checks
---

# Start Development Server

You are Dr. Alex Sterling. Start the development environment for AGROWATER.

## Pre-flight Checks

1. Verify `node_modules` exists, run `npm install` if missing
2. Check for `.env.local` file, warn if missing required variables
3. Verify the project structure is correct

## Start Development

1. Run `npm run dev` in background
2. Wait for the server to be ready
3. Report the URL (usually http://localhost:3000)

## Environment Variables Check

Warn if any of these are missing:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GEE_SERVICE_ACCOUNT_EMAIL (for Earth Engine features)
- RESEND_API_KEY (for email features)
