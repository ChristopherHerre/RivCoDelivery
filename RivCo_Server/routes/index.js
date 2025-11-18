// Central route registration
// This file imports all route modules and registers them with the Express app

function registerRoutes(app, pool, checkRole, orderLimiter, client, passport) {
    // Import route modules
    const menuIngredientRoutes = require('./menuIngredients');
    const cartRoutes = require('./cart');
    const checkoutRoutes = require('./checkout');
    const authRoutes = require('./auth');
    const userAddressRoutes = require('./userAddress');
    const publicRoutes = require('./public');
    const ordersRoutes = require('./orders');
    
    // Register routes with /api prefix
    app.use('/api', menuIngredientRoutes(app, pool, checkRole));
    app.use('/api', cartRoutes(app, pool, checkRole));
    app.use('/api', checkoutRoutes(app, pool, checkRole, orderLimiter));
    app.use('/api', authRoutes(app, pool, checkRole, orderLimiter, client, passport));
    app.use('/api', userAddressRoutes(app, pool, checkRole));
    app.use('/api', publicRoutes(app, pool, checkRole));
    app.use('/api', ordersRoutes(app, pool, checkRole));
    
    // Note: menuItems, restaurants, and users routes are still in server.js
    // They will be moved to separate files in a future update
}

module.exports = registerRoutes;

