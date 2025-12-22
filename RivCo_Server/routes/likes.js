const { z } = require('zod');
const { ROLES } = require('../constants/roles');

function likeRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // POST /api/restaurants/:id/like
    // Toggle like for a restaurant
    router.post('/restaurants/:id/like', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const restaurantId = Number(req.params.id);
        if (!restaurantId || Number.isNaN(restaurantId)) {
            return res.status(400).json({ error: 'Invalid restaurant ID' });
        }

        const userId = req.session.user.sub;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Check if restaurant exists
            const [[restaurant]] = await connection.execute(
                'SELECT id, likes FROM restaurants WHERE id = ? LIMIT 1',
                [restaurantId]
            );

            if (!restaurant) {
                await connection.rollback();
                return res.status(404).json({ error: 'Restaurant not found' });
            }

            // Check if user already liked this restaurant
            const [[existingLike]] = await connection.execute(
                'SELECT id FROM restaurant_likes WHERE user_id = ? AND restaurant_id = ? LIMIT 1',
                [userId, restaurantId]
            );

            if (existingLike) {
                // Unlike: remove the like record and decrement count
                await connection.execute(
                    'DELETE FROM restaurant_likes WHERE user_id = ? AND restaurant_id = ?',
                    [userId, restaurantId]
                );
                await connection.execute(
                    'UPDATE restaurants SET likes = GREATEST(likes - 1, 0) WHERE id = ?',
                    [restaurantId]
                );
                await connection.commit();
                return res.json({ 
                    liked: false, 
                    likes: Math.max(restaurant.likes - 1, 0) 
                });
            } else {
                // Like: add the like record and increment count
                await connection.execute(
                    'INSERT INTO restaurant_likes (user_id, restaurant_id) VALUES (?, ?)',
                    [userId, restaurantId]
                );
                await connection.execute(
                    'UPDATE restaurants SET likes = likes + 1 WHERE id = ?',
                    [restaurantId]
                );
                await connection.commit();
                return res.json({ 
                    liked: true, 
                    likes: restaurant.likes + 1 
                });
            }
        } catch (error) {
            await connection.rollback();
            console.error('Error toggling restaurant like:', error);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            connection.release();
        }
    });

    // POST /api/menu-items/:id/like
    // Toggle like for a menu item
    router.post('/menu-items/:id/like', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const menuItemId = Number(req.params.id);
        if (!menuItemId || Number.isNaN(menuItemId)) {
            return res.status(400).json({ error: 'Invalid menu item ID' });
        }

        const userId = req.session.user.sub;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Check if menu item exists
            const [[menuItem]] = await connection.execute(
                'SELECT id, likes FROM menu_items WHERE id = ? LIMIT 1',
                [menuItemId]
            );

            if (!menuItem) {
                await connection.rollback();
                return res.status(404).json({ error: 'Menu item not found' });
            }

            // Check if user already liked this menu item
            const [[existingLike]] = await connection.execute(
                'SELECT id FROM menu_item_likes WHERE user_id = ? AND menu_item_id = ? LIMIT 1',
                [userId, menuItemId]
            );

            if (existingLike) {
                // Unlike: remove the like record and decrement count
                await connection.execute(
                    'DELETE FROM menu_item_likes WHERE user_id = ? AND menu_item_id = ?',
                    [userId, menuItemId]
                );
                await connection.execute(
                    'UPDATE menu_items SET likes = GREATEST(likes - 1, 0) WHERE id = ?',
                    [menuItemId]
                );
                await connection.commit();
                return res.json({ 
                    liked: false, 
                    likes: Math.max(menuItem.likes - 1, 0) 
                });
            } else {
                // Like: add the like record and increment count
                await connection.execute(
                    'INSERT INTO menu_item_likes (user_id, menu_item_id) VALUES (?, ?)',
                    [userId, menuItemId]
                );
                await connection.execute(
                    'UPDATE menu_items SET likes = likes + 1 WHERE id = ?',
                    [menuItemId]
                );
                await connection.commit();
                return res.json({ 
                    liked: true, 
                    likes: menuItem.likes + 1 
                });
            }
        } catch (error) {
            await connection.rollback();
            console.error('Error toggling menu item like:', error);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            connection.release();
        }
    });

    // GET /api/restaurants/:id/like-status
    // Get like status for current user (optional, for checking if user liked)
    router.get('/restaurants/:id/like-status', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.json({ liked: false });
        }

        const restaurantId = Number(req.params.id);
        if (!restaurantId || Number.isNaN(restaurantId)) {
            return res.status(400).json({ error: 'Invalid restaurant ID' });
        }

        try {
            const [[like]] = await pool.execute(
                'SELECT id FROM restaurant_likes WHERE user_id = ? AND restaurant_id = ? LIMIT 1',
                [req.session.user.sub, restaurantId]
            );

            return res.json({ liked: !!like });
        } catch (error) {
            console.error('Error checking restaurant like status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/menu-items/:id/like-status
    // Get like status for current user (optional, for checking if user liked)
    router.get('/menu-items/:id/like-status', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.json({ liked: false });
        }

        const menuItemId = Number(req.params.id);
        if (!menuItemId || Number.isNaN(menuItemId)) {
            return res.status(400).json({ error: 'Invalid menu item ID' });
        }

        try {
            const [[like]] = await pool.execute(
                'SELECT id FROM menu_item_likes WHERE user_id = ? AND menu_item_id = ? LIMIT 1',
                [req.session.user.sub, menuItemId]
            );

            return res.json({ liked: !!like });
        } catch (error) {
            console.error('Error checking menu item like status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
}

module.exports = likeRoutes;
