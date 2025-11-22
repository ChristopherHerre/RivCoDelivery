# Security Vulnerability Checklist
## Quick Reference for Fixes

### 🔴 CRITICAL - Fix Immediately

- [x] **SQL Injection in `/api/users` (GET)** - `routes/users.js:173-175` - ✅ **FIXED** - Implemented Zod validation schema
- [x] **SQL Injection in `/api/orders` (GET)** - `routes/orders.js:38-41` - ✅ **FIXED** - Implemented Zod validation schema
- [x] **SQL Injection in `/api/user/orders` (GET)** - `routes/orders.js:78-81` - ✅ **FIXED** - Implemented Zod validation schema
- [x] **Missing Validation in `/api/user/address` (POST)** - `routes/userAddress.js:5-28` - ✅ **FIXED** - Uses userAddressPostSchema with geo range validation
- [x] **Missing Auth in `/api/user/address` (PUT)** - `routes/userAddress.js:32-54` - ✅ **FIXED** - Has checkRole(0)
- [x] **Missing Auth in `/api/user/full-address` (GET)** - `routes/userAddress.js:96-121` - ✅ **FIXED** - Has checkRole(0)
- [x] **SQL Injection Risk in `/api/order_items`** - `routes/orders.js:45-55` - ✅ **FIXED** - Uses orderIdQuerySchema validation
- [x] **Missing Auth in `/api/checkout-data`** - `routes/checkout.js:368` - ✅ **FIXED** - Has checkRole(0)

### 🟠 HIGH - Fix Soon

- [ ] **CSRF Protection Disabled** - `server.js:94-107` - Enable CSRF protection
- [ ] **Insecure Session Cookies** - `server.js:86-90` - Set secure: true in production
- [ ] **Security Headers Disabled** - `server.js:41-45` - Enable security headers
- [ ] **Missing Input Validation on Search** - `routes/users.js:156-164` - Add length limits
- [ ] **Missing Validation on Menu Search** - `routes/menuItems.js:302-315` - Validate menuItemName
- [ ] **Missing Validation on Menu Item ID** - `routes/menuItems.js:318-335` - Validate as integer
- [ ] **Missing Validation on Restaurant ID** - `routes/restaurants.js:103-117` - Validate as integer
- [x] **Missing Validation on Lat/Lng** - `routes/public.js:34-58` - ✅ **FIXED** - Uses reusable `latLngParamSchema` with range validation (-90 to 90 for latitude, -180 to 180 for longitude) and `Number.isFinite()` checks
- [ ] **IDOR - User ID in URL** - `routes/users.js:99-114` - Add authorization checks
- [ ] **IDOR - User ID in URL** - `routes/users.js:117-149` - Verify user owns resource
- [ ] **IDOR - User ID in URL** - `routes/users.js:182-195` - Verify user owns resource
- [ ] **Missing Rate Limiting on Login** - `routes/auth.js:5-35` - Add rate limiter
- [ ] **Missing Rate Limiting on Session** - `routes/auth.js:38-46` - Add rate limiter
- [ ] **API Key Exposure** - `routes/public.js:23-31` - Consider restrictions
- [ ] **Missing Auth Check** - `routes/menuItems.js:254-278` - Verify restaurant ownership

### 🟡 MEDIUM - Address When Possible

- [ ] **Missing Length Limits on Instructions** - `routes/checkout.js:29-36` - Add max lengths
- [ ] **Missing Length Limits on Restaurant Fields** - `routes/restaurants.js:7-31` - Add to schema
- [ ] **Missing Length Limits on Menu Item Name** - `routes/menuItems.js:193-251` - Add to schema
- [ ] **Error Information Disclosure** - Multiple files - Use generic errors in production
- [ ] **Missing Transaction Error Handling** - Multiple files - Improve error handling
- [ ] **Missing CORS Validation** - `server.js:51-56` - Validate from env vars
- [x] **Missing Address Validation** - `routes/userAddress.js:9-22` - ✅ **FIXED** - Uses userAddressPostSchema with max lengths
- [x] **Missing Lat/Lng Range Validation** - `routes/userAddress.js:9-22` - ✅ **FIXED** - Schema validates latitude (-90 to 90) and longitude (-180 to 180)

### 🟢 LOW - Best Practices

- [ ] **Remove Console.log in Production** - Multiple files - Use proper logging
- [ ] **Add Request Size Limits** - `server.js` - Configure body parser limits
- [ ] **Install Helmet.js** - `server.js` - Add security headers middleware
- [ ] **Add Input Sanitization** - Multiple files - Sanitize HTML/script content
- [ ] **Add API Versioning** - `routes/index.js` - Implement versioning strategy
- [ ] **Add Request ID Middleware** - Multiple files - For request tracing
- [ ] **Add Pool Monitoring** - `server.js:60-68` - Monitor connection pool
- [x] **Add Max Limits for Pagination** - Multiple files - ✅ **DONE** (Issues #1-3 routes have max limits: page=1000, limit=100)
- [ ] **Enforce HTTPS** - `server.js` - Add HTTPS redirect

---

## Priority Order for Fixes

1. **Week 1:** All CRITICAL vulnerabilities
2. **Week 2:** All HIGH vulnerabilities  
3. **Week 3:** MEDIUM vulnerabilities
4. **Ongoing:** LOW priority improvements

---

## Testing After Fixes

- [x] Run SQL injection tests on all fixed routes - ✅ **DONE** (Issues #1-3)
- [ ] Test authorization with different user roles
- [ ] Test rate limiting on protected endpoints
- [x] Test input validation with edge cases - ✅ **DONE** (Pagination routes validated)
- [ ] Test CSRF protection on state-changing operations
- [ ] Perform penetration testing
- [ ] Review error messages for information disclosure

---

## ✅ Completed Fixes

### Issues #1, #2, #3: SQL Injection in Pagination Routes
**Status:** ✅ **RESOLVED**  
**Solution:** Implemented `paginationQuerySchema` using Zod to validate all pagination parameters:
- Validates `page` (1-1000, default: 1)
- Validates `limit` (1-100, default: 10)  
- Validates `query` search string (max 100 chars)
- Uses template literals for LIMIT/OFFSET after validation (required due to MySQL limitation)
- All values are validated as integers before use, preventing SQL injection

### User Address API Security
**Status:** ✅ **RESOLVED**  
**Solution:** All userAddress routes are properly secured:
- POST `/api/user/address`: Uses `userAddressPostSchema` with geo range validation (-90 to 90 for latitude, -180 to 180 for longitude) and max length limits on all address fields
- PUT `/api/user/address`: Has `checkRole(0)` middleware
- GET `/api/user/address`: Has `checkRole(0)` middleware
- GET `/api/user/full-address`: Has `checkRole(0)` middleware
- Removed redundant validation code that duplicated Zod schema checks

### Geographic Coordinates Validation
**Status:** ✅ **RESOLVED**  
**Solution:** Created reusable `latLngParamSchema` in `utils/schemas.js` and applied to `/api/restaurants/:latitude/:longitude`:
- Validates latitude range (-90 to 90) with `Number.isFinite()` check
- Validates longitude range (-180 to 180) with `Number.isFinite()` check
- Returns 400 with error details if validation fails
- Uses validated values instead of `parseFloat()` calls

