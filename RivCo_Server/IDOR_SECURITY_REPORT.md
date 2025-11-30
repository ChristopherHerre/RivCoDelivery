# In-Depth Security Report: IDOR and Input Validation Vulnerabilities in `routes/users.js`

**Date:** Current analysis  
**File:** `RivCo_Server/routes/users.js`  
**Severity:** HIGH (IDOR) / MEDIUM (Input Validation)  
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-20 (Improper Input Validation)

---

## Executive Summary

The `routes/users.js` file contains **three critical IDOR (Insecure Direct Object Reference) vulnerabilities** and **one input validation gap**. These vulnerabilities allow authenticated users to read and modify other users' data by manipulating URL parameters, bypassing intended authorization controls. Additionally, one endpoint lacks proper path parameter validation, creating potential for application errors and edge-case exploitation.

---

## Vulnerability Analysis

### 1. IDOR: Unauthorized Modification of User's Selected Restaurant (CRITICAL)

**Endpoint:** `PUT /api/users/:id/selected_restaurant`  
**Location:** Lines 117-149  
**Severity:** CRITICAL  
**CWE:** CWE-639

#### Current Implementation

```javascript
router.put('/users/:id/selected_restaurant', checkRole(0), async (req, res) => {
    const paramsSchema = z.object({
        id: z.coerce.number().int().positive("User ID must be a positive number"),
    });
    const bodySchema = z.object({
        restaurant_id: z.coerce.number().int().positive("restaurant_id must be a positive number"),
    });
    try {
        const { id } = paramsSchema.parse(req.params);
        const { restaurant_id } = bodySchema.parse(req.body);
        const query = "UPDATE users SET selected_restaurant = ? WHERE id = ?";
        const [result] = await pool.execute(query, [restaurant_id, id]);
        // ... rest of handler
    }
});
```

#### Vulnerability Details

**Problem:** The endpoint uses `checkRole(0)`, which only verifies that the user is authenticated (role >= 0). However, it does **not verify that the `id` parameter matches `req.session.user.sub`**. 

**Attack Scenario:**
1. Attacker (user ID: 100) authenticates successfully
2. Attacker sends: `PUT /api/users/200/selected_restaurant` with `{ "restaurant_id": 5 }`
3. The request passes `checkRole(0)` because attacker is authenticated
4. The database query executes: `UPDATE users SET selected_restaurant = 5 WHERE id = 200`
5. **Result:** Attacker successfully modifies user 200's selected restaurant preference

**Impact:**
- **Data Integrity:** Users can maliciously or accidentally change other users' restaurant preferences
- **User Experience:** Victims may see incorrect restaurant selections, leading to confusion
- **Business Logic:** If selected_restaurant affects order routing or pricing, this could cause financial or operational issues
- **Privacy:** Reveals that user IDs exist in the system (enumeration)

**Exploitability:** 
- **Difficulty:** Trivial (any authenticated user)
- **Prerequisites:** Valid session token
- **Detection:** Low (changes may go unnoticed by victims)

#### Recommended Fix

```javascript
router.put('/users/:id/selected_restaurant', checkRole(0), async (req, res) => {
    const paramsSchema = z.object({
        id: z.coerce.number().int().positive("User ID must be a positive number"),
    });
    const bodySchema = z.object({
        restaurant_id: z.coerce.number().int().positive("restaurant_id must be a positive number"),
    });
    try {
        const { id } = paramsSchema.parse(req.params);
        
        // ✅ ADD: Verify ownership
        if (id !== req.session.user.sub) {
            return res.status(403).json({ 
                error: 'Forbidden: You can only modify your own selected restaurant' 
            });
        }
        
        const { restaurant_id } = bodySchema.parse(req.body);
        const query = "UPDATE users SET selected_restaurant = ? WHERE id = ?";
        const [result] = await pool.execute(query, [restaurant_id, id]);
        // ... rest of handler
    }
});
```

**Alternative Approach:** Remove the `:id` parameter entirely and use `req.session.user.sub` directly:

```javascript
router.put('/user/selected_restaurant', checkRole(0), async (req, res) => {
    const userId = req.session.user.sub;
    // ... rest of handler uses userId directly
});
```

---

### 2. IDOR: Unauthorized Reading of User's Selected Restaurant (CRITICAL)

**Endpoint:** `GET /api/users/:id/selected_restaurant`  
**Location:** Lines 185-198  
**Severity:** CRITICAL  
**CWE:** CWE-639

#### Current Implementation

```javascript
router.get('/users/:id/selected_restaurant', checkRole(0), async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT selected_restaurant FROM users WHERE id = ?';
    try {
        const [results] = await pool.execute(query, [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ selected_restaurant: results[0].selected_restaurant });
    } catch (err) {
        // ... error handling
    }
});
```

#### Vulnerability Details

**Problem:** Similar to the PUT endpoint, this GET endpoint does not verify that the requesting user owns the resource being accessed.

**Attack Scenario:**
1. Attacker (user ID: 100) authenticates
2. Attacker sends: `GET /api/users/200/selected_restaurant`
3. Request passes `checkRole(0)`
4. Database returns user 200's selected restaurant
5. **Result:** Attacker learns user 200's restaurant preference

**Impact:**
- **Privacy Violation:** Users can discover other users' restaurant preferences
- **Information Disclosure:** Reveals user IDs exist (enumeration)
- **Potential for Further Attacks:** Knowledge of preferences could be used in social engineering or targeted attacks

**Exploitability:**
- **Difficulty:** Trivial
- **Prerequisites:** Valid session token
- **Detection:** Very low (read-only operation, no visible side effects)

#### Recommended Fix

```javascript
router.get('/users/:id/selected_restaurant', checkRole(0), async (req, res) => {
    const { id } = req.params;
    
    // ✅ ADD: Validate ID is integer and verify ownership
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (idNum !== req.session.user.sub) {
        return res.status(403).json({ 
            error: 'Forbidden: You can only view your own selected restaurant' 
        });
    }
    
    const query = 'SELECT selected_restaurant FROM users WHERE id = ?';
    // ... rest of handler
});
```

**Alternative Approach:** Use session-based endpoint:

```javascript
router.get('/user/selected_restaurant', checkRole(0), async (req, res) => {
    const userId = req.session.user.sub;
    const query = 'SELECT selected_restaurant FROM users WHERE id = ?';
    // ... rest of handler
});
```

---

### 3. IDOR: Unvalidated Path Parameter in Restaurant Assignment (HIGH)

**Endpoint:** `PUT /api/users/:id/restaurant`  
**Location:** Lines 100-114  
**Severity:** HIGH  
**CWE:** CWE-639, CWE-20

#### Current Implementation

```javascript
router.put('/users/:id/restaurant', checkRole(2), async (req, res) => {
    const { id } = req.params;
    const { restaurant_id } = req.body;
    const query = 'UPDATE users SET restaurant_id = ? WHERE id = ?';
    try {
        const [result] = await pool.execute(query, [restaurant_id, id]);
        // ... rest of handler
    }
});
```

#### Vulnerability Details

**Problem 1: Missing Path Parameter Validation**
- The `id` parameter is extracted directly from `req.params` without validation
- No type checking (could be non-numeric string)
- No bounds checking (could be negative, zero, or extremely large)
- While SQL injection is prevented by parameterized queries, invalid IDs could cause:
  - Application errors if database expects integer
  - Type coercion issues
  - Potential for edge-case bugs

**Problem 2: Missing Body Parameter Validation**
- `restaurant_id` from request body is not validated
- Could be `null`, `undefined`, negative, or non-integer
- No verification that the restaurant_id exists in the database

**Problem 3: Authorization Scope**
- While `checkRole(2)` ensures only admins can access this endpoint, there's no additional business logic validation
- Admin could accidentally assign invalid restaurant IDs
- No check if user already has a restaurant assignment (could overwrite existing data)

**Impact:**
- **Data Integrity:** Invalid restaurant_id assignments could break application logic
- **Application Errors:** Invalid IDs could cause database constraint violations or application crashes
- **Operational Issues:** Users assigned to non-existent restaurants would have broken functionality

**Exploitability:**
- **Difficulty:** Low (requires admin access, but admin could make mistakes)
- **Prerequisites:** Admin role (role = 2)
- **Detection:** Medium (errors would be visible in logs)

#### Recommended Fix

```javascript
router.put('/users/:id/restaurant', checkRole(2), async (req, res) => {
    // ✅ ADD: Validate path parameter
    const paramsSchema = z.object({
        id: z.coerce.number().int().positive("User ID must be a positive integer"),
    });
    
    // ✅ ADD: Validate body parameter
    const bodySchema = z.object({
        restaurant_id: z.coerce
            .number()
            .int()
            .positive("Restaurant ID must be a positive integer")
            .nullable()
            .optional(),
    });
    
    const paramParseResult = paramsSchema.safeParse(req.params);
    if (!paramParseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: paramParseResult.error.flatten().fieldErrors,
        });
    }
    
    const bodyParseResult = bodySchema.safeParse(req.body);
    if (!bodyParseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: bodyParseResult.error.flatten().fieldErrors,
        });
    }
    
    const { id } = paramParseResult.data;
    const { restaurant_id } = bodyParseResult.data;
    
    // ✅ ADD: Verify user exists
    const [[user]] = await pool.execute(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [id]
    );
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // ✅ ADD: If restaurant_id provided, verify it exists
    if (restaurant_id !== null && restaurant_id !== undefined) {
        const [[restaurant]] = await pool.execute(
            'SELECT id FROM restaurants WHERE id = ? LIMIT 1',
            [restaurant_id]
        );
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
    }
    
    const query = 'UPDATE users SET restaurant_id = ? WHERE id = ?';
    // ... rest of handler
});
```

---

### 4. Search Query Length Validation (MEDIUM - Already Partially Fixed)

**Endpoint:** `GET /api/users`  
**Location:** Lines 152-183  
**Severity:** MEDIUM (Note: Actually limited to 100 chars via schema)  
**CWE:** CWE-20

#### Current Implementation

```javascript
router.get('/users', checkRole(2), async (req, res) => {
    const parseResult = paginationQuerySchema.safeParse(req.query);
    // ... validation ...
    const { page, limit, query: searchQuery } = parseResult.data;
    
    if (searchQuery) {
        sqlQuery += ' WHERE name LIKE ? OR email LIKE ?';
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }
});
```

#### Analysis

**Status:** ✅ **PARTIALLY SECURED**

The search query is validated through `paginationQuerySchema`, which includes:
- Maximum length of 100 characters (line 140 in `utils/schemas.js`)
- String type coercion and sanitization

**Remaining Concerns:**
1. **No SQL Injection Risk:** Parameterized queries prevent SQL injection ✅
2. **Length Limit Exists:** 100 character limit prevents DoS via extremely long queries ✅
3. **Pattern Matching Performance:** `LIKE %query%` patterns can be slow on large tables, but this is a performance concern, not a security issue
4. **Special Character Handling:** The query is passed directly to LIKE without escaping special LIKE characters (`%`, `_`), but this is intentional for search functionality

**Recommendation:** Current implementation is acceptable. If performance becomes an issue, consider:
- Adding full-text search indexes
- Implementing search result caching
- Adding rate limiting to the search endpoint

---

## Attack Scenarios

### Scenario 1: Mass Enumeration and Preference Harvesting

**Attacker Goal:** Collect restaurant preferences for all users in the system

**Steps:**
1. Attacker creates account and authenticates
2. Attacker writes script to iterate through user IDs (1, 2, 3, ...)
3. For each ID, attacker calls:
   - `GET /api/users/{id}/selected_restaurant`
4. Attacker builds database of user preferences
5. Attacker uses data for targeted marketing, social engineering, or competitive intelligence

**Impact:** Privacy violation, potential for targeted attacks

**Detection:** High request volume to sequential user IDs would be suspicious

---

### Scenario 2: Sabotage via Preference Manipulation

**Attacker Goal:** Disrupt other users' experience by changing their restaurant preferences

**Steps:**
1. Attacker identifies target user IDs (through enumeration or other means)
2. Attacker calls `PUT /api/users/{target_id}/selected_restaurant` with malicious restaurant_id
3. Target users experience incorrect restaurant selections
4. If preferences affect order routing, orders could be misrouted

**Impact:** User experience degradation, potential operational issues

**Detection:** Users reporting incorrect preferences, unusual preference change patterns

---

### Scenario 3: Admin Error Leading to Data Corruption

**Attacker/Admin Goal:** Admin accidentally assigns invalid restaurant_id

**Steps:**
1. Admin attempts to assign restaurant_id = 99999 (non-existent)
2. Endpoint accepts request without validation
3. Database update succeeds (or fails with constraint error)
4. User's restaurant_id is corrupted or set to invalid value
5. User's restaurant-related functionality breaks

**Impact:** Application errors, broken functionality for affected users

**Detection:** Error logs, user reports of broken features

---

## Compliance and Standards Mapping

### OWASP Top 10 (2021)

- **A01:2021 – Broken Access Control**
  - All three IDOR vulnerabilities fall under this category
  - Users can access/modify resources they shouldn't have access to

- **A03:2021 – Injection**
  - Partially mitigated (parameterized queries prevent SQL injection)
  - Input validation gaps could lead to application errors

### CWE Classifications

- **CWE-639: Authorization Bypass Through User-Controlled Key**
  - Primary classification for all IDOR issues
  - User-controlled `id` parameter bypasses authorization checks

- **CWE-20: Improper Input Validation**
  - Missing validation on path parameters and body fields
  - Could lead to application errors or edge-case exploitation

### PCI DSS (if applicable)

- **Requirement 6.5.8:** "Improper access control"
- **Requirement 7.2.1:** "Restrict access to cardholder data by business need-to-know"

---

## Remediation Priority

### Immediate (Week 1)

1. **Fix IDOR in `PUT /api/users/:id/selected_restaurant`**
   - Add ownership verification: `if (id !== req.session.user.sub)`
   - **OR** refactor to remove `:id` parameter and use session user directly
   - **Estimated Effort:** 30 minutes

2. **Fix IDOR in `GET /api/users/:id/selected_restaurant`**
   - Add ownership verification
   - **OR** refactor to session-based endpoint
   - **Estimated Effort:** 30 minutes

### High Priority (Week 2)

3. **Add validation to `PUT /api/users/:id/restaurant`**
   - Validate path parameter (id) with Zod schema
   - Validate body parameter (restaurant_id) with Zod schema
   - Add existence checks for both user and restaurant
   - **Estimated Effort:** 1-2 hours

### Medium Priority (Week 3)

4. **Review and optimize search query handling**
   - Current implementation is acceptable
   - Consider performance improvements if needed
   - **Estimated Effort:** 2-4 hours (if optimization needed)

---

## Testing Recommendations

### Manual Testing

1. **IDOR Testing:**
   - Authenticate as user A (ID: 100)
   - Attempt to read user B's selected_restaurant: `GET /api/users/200/selected_restaurant`
   - Attempt to modify user B's selected_restaurant: `PUT /api/users/200/selected_restaurant`
   - Verify both requests are rejected with 403 Forbidden

2. **Input Validation Testing:**
   - Send invalid user IDs: negative numbers, zero, non-integers, extremely large numbers
   - Send invalid restaurant_ids: null, negative, non-existent IDs
   - Verify all invalid inputs return 400 Bad Request with clear error messages

3. **Authorization Testing:**
   - Test with different user roles (0, 1, 2)
   - Verify role-based access controls work correctly
   - Verify users can only access their own resources

### Automated Testing

```javascript
// Example test cases
describe('PUT /api/users/:id/selected_restaurant', () => {
    it('should reject requests where id !== session user', async () => {
        const response = await request(app)
            .put('/api/users/999/selected_restaurant')
            .set('Cookie', sessionCookieForUser100)
            .send({ restaurant_id: 5 });
        
        expect(response.status).toBe(403);
        expect(response.body.error).toContain('Forbidden');
    });
    
    it('should allow users to modify their own selected_restaurant', async () => {
        const response = await request(app)
            .put('/api/users/100/selected_restaurant')
            .set('Cookie', sessionCookieForUser100)
            .send({ restaurant_id: 5 });
        
        expect(response.status).toBe(200);
    });
});
```

---

## Additional Security Considerations

### Defense in Depth

Even after fixing these vulnerabilities, consider:

1. **Rate Limiting:** Add rate limiting to prevent enumeration attacks
2. **Audit Logging:** Log all access attempts to user resources for security monitoring
3. **Request ID Tracking:** Add request IDs to trace suspicious activity patterns
4. **Input Sanitization:** While Zod validation is good, consider additional sanitization for display purposes
5. **Resource Hiding:** Consider using opaque tokens instead of sequential user IDs to prevent enumeration

### Monitoring and Detection

1. **Anomaly Detection:** Monitor for:
   - Unusual patterns of requests to `/users/:id/*` endpoints
   - Requests accessing many different user IDs in short time
   - Failed authorization attempts (403 responses)

2. **Alerting:** Set up alerts for:
   - Multiple 403 responses from same IP/user
   - Rapid enumeration patterns (sequential ID requests)
   - Unusual modification patterns

---

## Conclusion

The `routes/users.js` file contains **three critical IDOR vulnerabilities** that allow authenticated users to read and modify other users' data. These issues stem from missing ownership verification checks, despite proper role-based authentication. Additionally, one endpoint lacks comprehensive input validation, creating potential for data corruption and application errors.

**Risk Level:** HIGH  
**Recommended Action:** Immediate remediation of IDOR vulnerabilities (estimated 1-2 hours total)

All vulnerabilities are straightforward to fix and should be addressed before production deployment or as part of the next security sprint.

---

**Report Generated:** Current analysis  
**Next Review:** After remediation implementation

