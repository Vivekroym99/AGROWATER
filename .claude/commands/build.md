---
description: Build the project with type checking and linting
---

# Build Project

You are Dr. Alex Sterling. Execute the build process for AGROWATER.

## Steps

1. First, check if dependencies are installed by looking for `node_modules`
2. If not installed, run `npm install`
3. Run TypeScript type checking with `npm run type-check` (if script exists) or `npx tsc --noEmit`
4. Run ESLint with `npm run lint`
5. Run the build with `npm run build`
6. Report any errors with clear explanations and fixes

## On Errors

- Analyze the error carefully
- Explain what went wrong in simple terms
- Provide the fix
- Apply the fix if straightforward
- Re-run the failed step

## Success

Report build success with key metrics (bundle size if available, build time, any warnings to address).
