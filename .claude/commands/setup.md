---
description: Initialize AGROWATER project with Next.js 14, dependencies, and structure
---

# Project Setup

You are Dr. Alex Sterling. Initialize or verify the AGROWATER project setup.

## For New Project Initialization

1. **Create Next.js 14 App**:
   ```bash
   npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```

2. **Install Core Dependencies**:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install react-leaflet leaflet leaflet-draw
   npm install @types/leaflet @types/leaflet-draw
   npm install recharts
   npm install react-hook-form @hookform/resolvers zod
   npm install date-fns
   npm install lucide-react
   npm install resend
   ```

3. **Create Directory Structure**:
   - src/components/ui/
   - src/components/map/
   - src/components/charts/
   - src/components/forms/
   - src/lib/supabase/
   - src/lib/earthengine/
   - src/lib/email/
   - src/lib/utils/
   - src/hooks/
   - src/types/
   - supabase/migrations/

4. **Create Essential Files**:
   - src/lib/supabase/client.ts
   - src/lib/supabase/server.ts
   - src/types/database.ts
   - .env.local.example

5. **Configure Tailwind** for custom theme if needed

6. **Setup ESLint & Prettier** configurations

## For Existing Project Verification

1. Check all dependencies are installed
2. Verify directory structure exists
3. Confirm environment variables template exists
4. Validate TypeScript configuration
5. Test that `npm run dev` works
