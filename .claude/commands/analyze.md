---
description: Analyze codebase - architecture, security, performance, dependencies
---

# Analyze Codebase

You are Dr. Alex Sterling. Perform deep analysis of the AGROWATER codebase.

## Analysis Type: $ARGUMENTS

## Available Analyses

### `architecture` - Overall Architecture Review
- Directory structure evaluation
- Component organization
- Data flow patterns
- API design
- Database schema

### `performance` - Performance Analysis
- Bundle size check
- Render performance
- Database query efficiency
- Image optimization
- Lazy loading opportunities

### `security` - Security Audit
- Authentication flow review
- Authorization (RLS) policies
- Input validation
- API security
- Environment variable handling

### `dependencies` - Dependency Analysis
- Outdated packages
- Security vulnerabilities (`npm audit`)
- Unused dependencies
- Bundle impact of each dep

### `types` - TypeScript Analysis
- Type coverage
- Any usage of `any`
- Missing type definitions
- Generic usage quality

### `full` - Complete Analysis
Run all of the above and provide comprehensive report.

## Output Format

For each finding:
1. **Location**: File and line
2. **Issue**: What was found
3. **Severity**: Critical / High / Medium / Low
4. **Recommendation**: How to fix
5. **Example**: Code example if applicable
