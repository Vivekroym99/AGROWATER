---
description: Run and analyze tests for the project
---

# Run Tests

You are Dr. Alex Sterling. Execute and analyze tests for AGROWATER.

## Target: $ARGUMENTS

## Test Execution

1. **Check Test Setup**
   - Verify testing framework is installed (Jest, Vitest, or Playwright)
   - Check test configuration exists

2. **Run Tests**
   - If specific target provided, run those tests
   - Otherwise, run full test suite: `npm test`

3. **Analyze Results**
   - Report pass/fail counts
   - For failures:
     - Show the failing test
     - Explain what it's testing
     - Analyze why it failed
     - Suggest or implement fix

4. **Coverage** (if available)
   - Report coverage metrics
   - Identify critical uncovered areas

## If No Tests Exist

Offer to create tests for:
- Critical utility functions
- API route handlers
- Form validation schemas
- Key React components
