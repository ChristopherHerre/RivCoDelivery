# Route Refactoring Guide

This document outlines the refactoring of routes from `server.js` into separate route files.

## Structure

```
RivCo_Server/
├── server.js              # Main server file (setup, middleware, route registration)
├── middleware/
│   └── auth.js            # Authentication middleware (checkRole)
├── utils/
│   ├── helpers.js         # Utility functions (haversine_dist, order calculations, etc.)
│   └── schemas.js         # Zod validation schemas
└── routes/
    ├── index.js           # Route registration hub
    ├── menuIngredients.js # Menu ingredient CRUD routes
    ├── cart.js            # Cart operations
    └── [more route files] # Additional route files to be created
```

## Route Files Created

### ✅ Completed
- `routes/menuIngredients.js` - Menu ingredient routes (DELETE, POST, PUT)
- `routes/cart.js` - Cart routes (POST, DELETE, GET)

### 📋 To Be Created

The following route files should be created following the same pattern:

1. **routes/menuItems.js**
   - DELETE `/api/menu-items/:id`
   - POST `/api/update-menu-item/:id`
   - POST `/api/menu-items` (link ingredient to menu item)
   - POST `/api/add-menu-item`
   - GET `/api/menu-items-list`
   - GET `/api/menu-items`
   - GET `/api/menu/item`
   - GET `/api/menu/item/search`
   - GET `/api/menu/item/ingredients`

2. **routes/restaurants.js**
   - POST `/api/addRestaurant`
   - POST `/api/manageRestaurant`
   - GET `/api/restaurants/:latitude/:longitude`
   - GET `/api/restaurants2/:restaurantId/menu`
   - GET `/api/restaurants/:restaurant`
   - GET `/api/getUserRestaurant`

3. **routes/orders.js**
   - POST `/api/co` (checkout/place order)
   - POST `/api/changeOrderOpen`
   - GET `/api/orders`
   - GET `/api/order_items`
   - GET `/api/user/orders`

4. **routes/users.js**
   - PUT `/api/users/:id/role`
   - PUT `/api/users/:id/restaurant`
   - PUT `/api/users/:id/selected_restaurant`
   - GET `/api/users`
   - GET `/api/users/:id/selected_restaurant`
   - GET `/api/user/details`

5. **routes/auth.js**
   - POST `/api/google-login`
   - GET `/api/auth/google`
   - GET `/api/auth/google/callback`
   - GET `/api/logout`
   - GET `/api/session`
   - GET `/api/profile`

6. **routes/checkout.js**
   - GET `/api/checkout-data/:selected_restaurant?`

7. **routes/userAddress.js**
   - POST `/api/user/address`
   - PUT `/api/user/address`
   - GET `/api/user/address`
   - GET `/api/user/full-address`

8. **routes/public.js**
   - GET `/api/health`
   - GET `/api/sponsors`
   - GET `/api/maps-api-key`
   - GET `/api/menu-ingredients/:menuItem`

## Route File Pattern

Each route file should follow this pattern:

```javascript
function routeNameRoutes(app, pool, checkRole, orderLimiter) {
    const router = require('express').Router();
    
    // Import utilities if needed
    const { helperFunction } = require('../utils/helpers');
    const { schemaName } = require('../utils/schemas');
    
    // Define routes
    router.get('/route-path', checkRole(0), async (req, res) => {
        // Route implementation
    });
    
    router.post('/route-path', checkRole(2), async (req, res) => {
        // Route implementation
    });
    
    return router;
}

module.exports = routeNameRoutes;
```

## Updating routes/index.js

After creating each route file, add it to `routes/index.js`:

```javascript
const routeNameRoutes = require('./routeName');
app.use('/api', routeNameRoutes(app, pool, checkRole, orderLimiter));
```

## Removing Routes from server.js

Once a route file is created and registered:
1. Comment out or remove the route definition from `server.js`
2. Test to ensure functionality is maintained
3. Update this guide to mark the route file as completed

## Dependencies

Routes may need access to:
- `pool` - Database connection pool
- `checkRole` - Role-based access control middleware
- `orderLimiter` - Rate limiter for order routes
- Utility functions from `utils/helpers.js`
- Schemas from `utils/schemas.js`
- `z` (Zod) for additional inline validation if needed

## Testing

After moving routes:
1. Test each endpoint to ensure it works correctly
2. Verify authentication/authorization still works
3. Check that error handling is preserved
4. Ensure database transactions work correctly

