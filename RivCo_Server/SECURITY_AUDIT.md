# Security Audit Snapshot
## RivCo Delivery Server – Outstanding Vulnerabilities Only

**Generated:** Current review session  
**Scope:** Express.js API (`RivCo_Server`)  

---

## Executive Summary

Critical and high-risk weaknesses remain across role-protected routes, authentication flows, and global middleware. The most urgent problems involve missing input validation and disabled platform protections (CSRF, security headers, secure cookies). Addressing these items restores defense-in-depth across the RBAC-driven delivery platform.

---

## 🔴 Critical Vulnerabilities (Fix Immediately)

1. **(reserved for next critical finding)**  

---

## 🟠 High Vulnerabilities (Fix Soon)

**Platform security**
- `server.js`: CSRF middleware is disabled; session cookies use `secure: false`; custom security headers are commented out. Enable CSRF for mutating verbs, set cookies to `secure: process.env.NODE_ENV === 'production'`, and reinstate CSP/XFO/XCTO/HSTS/Referrer-Policy headers (or adopt Helmet presets).

**Unvalidated input & gaps**
- `routes/menuItems.js`: search inputs lack length validation and LIKE character sanitization.  
- `routes/restaurants.js`: params (`restaurantId`, `restaurant`) are not coerced to integers.  
- `routes/public.js`: Google Maps API key returned to any caller.  
- `routes/auth.js`: `/session` endpoint has no rate limiting.  
- `routes/cart.js`: nested arrays (`ingredients`, `halfer`, `arrs`) only superficially validated.

**Why it matters:** Attackers can brute force authentication, enumerate resources, or craft oversized payloads that stress the DB.

---

## 🟡 Medium Vulnerabilities (Plan After High)

- `routes/checkout.js`: `instructions`, `businessType`, `knockType` accept unbounded strings → XSS/DoS risk.  
- `routes/restaurants.js`, `routes/menuItems.js`: schemas lack max lengths and geo range checks.  
- Generic error responses leak DB internals; transaction rollback paths don't consistently log/handle failures.  
- `server.js`: CORS origin list hard-coded rather than validated from env; no request-size limits.

---

## 🟢 Low / Best-Practice Gaps

- Verbose `console.log` statements in production code.  
- Missing Helmet.js, request ID middleware, and pool monitoring.  
- HTTPS not enforced; API versioning absent; page/limit validation not ubiquitous.

---

## Recommended Mitigation Order

1. **Week 1 (Critical):** Identify and address remaining critical gaps.  
2. **Week 2 (High):** Re-enable CSRF and headers, secure cookies, lock down remaining ID parameters (restaurants), add rate limiting, restrict Google Maps key exposure.  
3. **Week 3 (Medium/Low):** Add length/range controls everywhere, sanitize errors, improve transaction rollback handling, enforce request-size limits, add Helmet/request IDs, plan HTTPS enforcement & API versioning.

---

## Testing Focus After Fixes

1. Authorization regression tests for every route touched by `checkRole`.  
2. Negative input tests for all new Zod schemas (oversized strings, invalid coordinates, malformed IDs).  
3. CSRF validation on high-value POST/PUT/DELETE routes.  
4. Rate-limiter abuse tests on `/session`.  
5. Pen tests covering remaining validation and authorization gaps.

---

## Compliance Mapping

- **OWASP A01 (Broken Access Control):** All IDOR vulnerabilities have been fixed. See [FIXED_VULNERABILITIES.md](./FIXED_VULNERABILITIES.md).  
- **OWASP A03 (Injection):** Unvalidated IDs and strings feeding SQL queries in menu/restaurant routes.  
- **OWASP A05 (Security Misconfiguration):** Disabled CSRF, headers, insecure cookies.  
- **OWASP A07 (Identification & Authentication Failures):** Missing rate limiting on auth flows.

---

**Next Steps:** Track each remaining issue in the checklist, link fixes to commits, and re-run this audit after remediation to confirm closure.

