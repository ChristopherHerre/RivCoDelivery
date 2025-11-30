# Security Audit Report: Server-Side Route Vulnerabilities
## RivCo Delivery API – Active Vulnerabilities

**Date:** Current Analysis  
**Scope:** Express.js API (`RivCo_Server/routes/`)  
**Status:** Active Vulnerabilities Identified

---

## Executive Summary

This audit identifies **11 active security vulnerabilities** across multiple route files. The vulnerabilities span information disclosure, rate limiting, and security configuration.

The active vulnerabilities could allow attackers to:

- Enumerate system resources
- Expose sensitive API keys
- Cause denial of service through resource exhaustion

**Risk Level:** HIGH  
**Priority:** Immediate remediation required for critical and high-severity items

### Vulnerability Distribution by Category

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Information Disclosure** | 0 | 0 | 2 | 0 | 2 |
| **Rate Limiting & Resource Protection** | 0 | 1 | 0 | 0 | 1 |
| **Security Configuration** | 0 | 0 | 0 | 1 | 1 |
| **Infrastructure & Best Practices** | 0 | 0 | 1 | 6 | 7 |
| **TOTAL** | **0** | **1** | **3** | **7** | **11** |

---

## 1. Information Disclosure

**Summary:** Two vulnerabilities where sensitive information is exposed through error messages or to authenticated users.

**Common Pattern:** API keys returned without authentication, or detailed error messages reveal internal system structure.

**CWE:** CWE-200 (Information Exposure), CWE-209 (Information Exposure Through Error Message)  
**OWASP:** A01:2021 - Broken Access Control, A04:2021 - Insecure Design  
**Affected Files:** `routes/public.js`, Multiple files

---

### 🟡 1.1. Information Disclosure: Google Maps API Key Exposed (Partially Mitigated)
**File:** `routes/public.js`  
**Endpoint:** `GET /api/maps-api-key`  
**Lines:** 13-20  
**Severity:** MEDIUM (reduced from HIGH due to authentication requirement)

**Current Status:**
Authentication has been added (`checkRole(0)`), requiring users to be authenticated before accessing the API key. However, the key is still exposed to all authenticated users.

**Current Code:**
```javascript
router.get('/maps-api-key', checkRole(0), (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    res.json({ apiKey });
});
```

**Remaining Risk:**
- **API Key Exposure:** Any authenticated user can extract the key and use it elsewhere
- **Cost Exploitation:** Authenticated users could misuse the key, generating API costs
- **Rate Limit Exhaustion:** Authenticated users could exhaust quota limits
- **Key Reuse:** Extracted keys can be used outside the application

**Recommended Fix:**
Restrict API key usage on Google Cloud Console by HTTP referrer/domain and don't expose it through the API endpoint. Use one of these approaches:
1. **Server-side proxy:** Proxy Google Maps API requests through your server (key never exposed to client)
2. **Client-side with restrictions:** Use the key directly in frontend code but restrict it in Google Cloud Console to your domain only
3. **Environment-based:** Serve the key only to specific environments or with additional domain validation

---

### 🟡 1.2. Error Information Disclosure
**File:** Multiple files  
**Severity:** MEDIUM  

**Vulnerability:**
Several endpoints return detailed error messages that could reveal:
- Database structure (table names, column names)
- Internal implementation details
- Stack traces (if error handling is insufficient)

**Examples:**
- `routes/checkout.js:361`: Returns `err.message` which may contain database errors
- `routes/menuItems.js:118`: Returns `err.message` with SQL error details

**Impact:**
- **Information Disclosure:** Attackers learn database schema
- **Attack Surface:** Detailed errors aid in crafting exploits
- **Professionalism:** Reveals technical details to attackers

**Recommended Fix:**
```javascript
// Production error handler
catch (err) {
    console.error('Error:', err); // Log detailed error server-side
    res.status(500).json({ 
        error: 'An error occurred processing your request' // Generic client message
    });
}
```

---

## 2. Rate Limiting & Resource Protection

**Summary:** One high-severity vulnerability where endpoints lack rate limiting, allowing resource exhaustion attacks.

**Common Pattern:** Endpoints are accessible without rate limiting, allowing attackers to repeatedly query them.

**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)  
**OWASP:** A07:2021 - Identification and Authentication Failures  
**Affected Files:** `routes/auth.js`

---

### 🟠 2.1. Missing Rate Limiting: Session Endpoint
**File:** `routes/auth.js`  
**Endpoint:** `GET /api/session`  
**Lines:** 46-54  
**Severity:** HIGH  

**Vulnerability:**
The session endpoint has no rate limiting, allowing attackers to repeatedly query session status. While `/google-login` has rate limiting, this endpoint does not.

**Current Code:**
```javascript
router.get('/session', (req, res) => {
    // No rate limiting - can be called unlimited times
    if (req.session.user) {
        res.json(req.session.user);
    }
});
```

**Impact:**
- **Resource Exhaustion:** Rapid polling could consume server resources
- **Session Enumeration:** Attackers could test session validity rapidly
- **DoS Potential:** High-volume requests could overwhelm the server

**Recommended Fix:**
```javascript
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many session requests' }
});

router.get('/session', sessionLimiter, (req, res) => {
    // ... rest of handler
});
```

---

## 3. Security Configuration

**Summary:** One low-severity vulnerability where security features are misconfigured.

**Common Pattern:** Security cookies are set to insecure values.

**CWE:** CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)  
**OWASP:** A05:2021 - Security Misconfiguration  
**Affected Files:** `server.js`

---

### 🟢 3.1. Insecure Session Cookies
**File:** `server.js`  
**Lines:** 86-90  
**Severity:** LOW  

**Vulnerability:**
Session cookies have `secure: false`, allowing transmission over HTTP.

**Current Code:**
```javascript
cookie: {
    secure: false,  // Should be true in production!
    httpOnly: true,
    sameSite: 'lax',
}
```

**Impact:**
- **Session Hijacking:** Cookies transmitted over HTTP can be intercepted
- **MITM Attacks:** Man-in-the-middle attackers can steal session cookies

**Recommended Fix:**
```javascript
cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000
}
```

---

---

## 4. Infrastructure & Best Practices

**Summary:** Seven vulnerabilities related to operational security, monitoring, and best practices.

**Common Pattern:** Missing request size limits, verbose logging, lack of infrastructure monitoring, and missing operational security controls.

**CWE:** CWE-400 (Uncontrolled Resource Consumption), CWE-532 (Information Exposure Through Log Files), Various  
**OWASP:** A05:2021 - Security Misconfiguration, A09:2021 - Security Logging and Monitoring Failures  
**Affected Files:** `server.js`, Multiple files, `routes/index.js`

---

### 🟡 4.1. Missing Request Size Limits
**File:** `server.js`  
**Lines:** 50, 58, 131  
**Severity:** MEDIUM  

**Vulnerability:**
Express body parsers (`express.json()`, `express.urlencoded()`) don't specify size limits, allowing potentially enormous payloads.

**Current Code:**
```javascript
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // No limit specified!
```

**Impact:**
- **DoS Attack:** Extremely large JSON payloads could exhaust memory
- **Resource Exhaustion:** No bounds on request body size

**Recommended Fix:**
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

### 🟢 4.2. Verbose Logging in Production
**File:** Multiple files  
**Severity:** LOW  

**Vulnerability:**
Excessive `console.log` statements expose:
- User IDs
- Session data
- Request parameters
- Database query results

**Examples:**
- `routes/menuItems.js:304`: `console.log(menuItemName)`
- `routes/menuItems.js:309`: `console.log(results)`
- `routes/restaurants.js:105`: `console.log("restaurantId: ", restaurantId)`

**Impact:**
- **Information Leakage:** Sensitive data logged to console/logs
- **Compliance:** May violate data protection regulations
- **Performance:** Excessive logging impacts performance

**Recommended Fix:** Replace with structured logging library (Winston, Pino) with log levels. Disable debug logs in production.

---

### 🟢 4.3-4.7. Additional Low-Priority Issues

**4.3. Missing API Versioning** (`routes/index.js`): No version prefix for routes  
**4.4. Missing Request ID Middleware**: No request tracing for debugging  
**4.5. Missing Connection Pool Monitoring**: No visibility into pool health  
**4.6. Missing HTTPS Enforcement**: No redirect from HTTP to HTTPS  
**4.7. Hard-coded CORS Origins**: Should validate from environment variables

---

## Summary Statistics

| Severity | Count | Percentage |
|----------|-------|------------|
| 🔴 Critical | 0 | 0% |
| 🟠 High | 1 | 9.1% |
| 🟡 Medium | 3 | 27.3% |
| 🟢 Low | 7 | 63.6% |
| **Total Active** | **11** | **100%** |

---

## Remediation Priority

### Immediate (Week 1) - Critical & High Priority

1. Add rate limiting to session endpoint (#2.1)

### High Priority (Week 2) - Remaining High & Medium

2. Implement generic error messages (#1.2)

3. Improve Google Maps API key security (#1.1)
   - Implement server-side proxy or domain restrictions

4. Add request size limits (#4.1)

### Medium Priority (Week 3) - Configuration & Best Practices

5. Secure session cookies (#3.1)
6. Replace console.log with structured logging (#4.2)
7. Implement additional best practices (#4.3-4.7)
    - API versioning
    - Request ID middleware
    - Connection pool monitoring
    - HTTPS enforcement
    - CORS validation from environment

---

## Testing Recommendations

### Rate Limiting Testing
- Attempt rapid-fire requests to session endpoint (#2.1)
- Test login endpoint rate limiting
- Verify rate limit responses are appropriate

### Error Handling Testing
- Verify errors don't leak database structure
- Confirm stack traces aren't exposed to clients
- Test error messages are generic in production

---

## Compliance Mapping

### OWASP Top 10 (2021)
- **A04:2021 – Insecure Design** - Information disclosure (Category 1)
- **A05:2021 – Security Misconfiguration** - Insecure cookies, infrastructure issues (Categories 3, 4)
- **A07:2021 – Identification & Authentication Failures** - Missing rate limiting (Category 2)
- **A09:2021 – Security Logging and Monitoring Failures** - Verbose logging, missing monitoring (Category 4)

### CWE Classifications
- **CWE-200**: Information Exposure (Category 1)
- **CWE-209**: Information Exposure Through Error Message (Category 1)
- **CWE-307**: Improper Restriction of Excessive Authentication Attempts (Category 2)
- **CWE-400**: Uncontrolled Resource Consumption (Category 4)
- **CWE-532**: Information Exposure Through Log Files (Category 4)
- **CWE-614**: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute (Category 3)

---

## Conclusion

**11 active security vulnerabilities remain** across 4 categories. The most urgent concerns are:

1. **Rate Limiting & Resource Protection (Category 2):** Missing rate limiting on session endpoint
2. **Information Disclosure (Category 1):** API key exposure to authenticated users and detailed error messages
3. **Infrastructure & Best Practices (Category 4):** Missing request size limits and other operational security controls

Addressing these vulnerabilities systematically by category over the next 3 weeks will significantly improve the security posture of the RivCo Delivery API.

---

**Report Generated:** Current Analysis  
**Next Review:** After remediation implementation  
**Contact:** Security Team
