// Central route registration
// This file imports all route modules and registers them with the Express app

function registerRoutes(app, pool, checkRole, orderLimiter, client, passport) {
    // Import route modules
    const menuIngredientRoutes = require('./menuIngredients');
    const menuItemRoutes = require('./menuItems');
    const cartRoutes = require('./cart');
    const checkoutRoutes = require('./checkout');
    const authRoutes = require('./auth');
    const userAddressRoutes = require('./userAddress');
    const userRoutes = require('./users');
    const restaurantRoutes = require('./restaurants');
    const publicRoutes = require('./public');
    const ordersRoutes = require('./orders');
    
    // Register routes with /api prefix
    app.use('/api', menuIngredientRoutes(app, pool, checkRole));
    app.use('/api', menuItemRoutes(app, pool, checkRole));
    app.use('/api', cartRoutes(app, pool, checkRole));
    app.use('/api', checkoutRoutes(app, pool, checkRole, orderLimiter));
    app.use('/api', authRoutes(app, pool, checkRole, orderLimiter, client, passport));
    app.use('/api', userAddressRoutes(app, pool, checkRole));
    app.use('/api', userRoutes(app, pool, checkRole));
    app.use('/api', restaurantRoutes(app, pool, checkRole));
    app.use('/api', publicRoutes(app, pool, checkRole));
    app.use('/api', ordersRoutes(app, pool, checkRole));
}

module.exports = registerRoutes;

