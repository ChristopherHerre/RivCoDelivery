function cartRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // POST /api/cart
    router.post('/cart', checkRole(0), async (req, res) => {
        const cartItems = req.body.cart;
        const userId = req.session?.user?.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!cartItems || !Array.isArray(cartItems)) {
            return res.status(400).json({ error: 'Cart must be an array' });
        }
        if (!cartItems.length) {
            return res.status(400).json({ error: 'Cart cannot be empty' });
        }

        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            const sanitizedItems = [];
            let restaurantId = null;

            for (const rawItem of cartItems) {
                if (!rawItem || typeof rawItem !== 'object') {
                    throw new Error('Each cart item must be an object');
                }

                const name = typeof rawItem.name === 'string' ? rawItem.name.trim() : '';
                if (!name) {
                    throw new Error('Cart item name is required');
                }

                const priceNumber = Number(rawItem.price);
                if (!Number.isFinite(priceNumber) || priceNumber < 0 || priceNumber > 9999999.99) {
                    throw new Error(`Invalid price value: ${rawItem.price}`);
                }

                const quantity = Number.isInteger(rawItem.quantity) ? rawItem.quantity : parseInt(rawItem.quantity, 10);
                if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100) {
                    throw new Error(`Invalid quantity for cart item "${name}"`);
                }

                const itemRestaurantId = Number(rawItem.restaurant_id);
                if (!Number.isInteger(itemRestaurantId) || itemRestaurantId <= 0) {
                    throw new Error(`Cart item "${name}" is missing a valid restaurant_id`);
                }

                if (restaurantId === null) {
                    restaurantId = itemRestaurantId;
                } else if (restaurantId !== itemRestaurantId) {
                    throw new Error('All cart items must belong to the same restaurant');
                }

                const [[menuItemRow]] = await connection.execute(
                    `SELECT id 
                     FROM menu_items 
                     WHERE restaurant_id = ? AND name = ? 
                     LIMIT 1`,
                    [itemRestaurantId, name]
                );
                if (!menuItemRow) {
                    throw new Error(`Menu item "${name}" is not available for this restaurant`);
                }

                const ingredients = Array.isArray(rawItem.ingredients) ? rawItem.ingredients : [];
                const halfer = Array.isArray(rawItem.halfer) ? rawItem.halfer : [];
                const arrs = Array.isArray(rawItem.arrs) ? rawItem.arrs : [];

                sanitizedItems.push({
                    name,
                    price: priceNumber.toFixed(2),
                    quantity,
                    ingredients,
                    halfer,
                    arrs,
                    size1: typeof rawItem.size1 === 'string' ? rawItem.size1.trim().slice(0, 255) : null,
                    val1: Number.isInteger(rawItem.val1) ? rawItem.val1 : parseInt(rawItem.val1, 10) || 0,
                    size2: typeof rawItem.size2 === 'string' ? rawItem.size2.trim().slice(0, 255) : null,
                    val2: Number.isInteger(rawItem.val2) ? rawItem.val2 : parseInt(rawItem.val2, 10) || 0,
                    size3: typeof rawItem.size3 === 'string' ? rawItem.size3.trim().slice(0, 255) : null,
                    val3: Number.isInteger(rawItem.val3) ? rawItem.val3 : parseInt(rawItem.val3, 10) || 0,
                    size4: typeof rawItem.size4 === 'string' ? rawItem.size4.trim().slice(0, 255) : null,
                    val4: Number.isInteger(rawItem.val4) ? rawItem.val4 : parseInt(rawItem.val4, 10) || 0,
                    restaurant_id: itemRestaurantId,
                });
            }

            await connection.beginTransaction();
            transactionStarted = true;

            await connection.execute(
                'DELETE FROM cart WHERE user_id = ?',
                [userId]
            );
            for (const item of sanitizedItems) {
                await connection.execute(
                    `INSERT INTO cart (
                        name, price, quantity, ingredients, user_id, 
                        size1, val1, size2, val2, size3, val3, size4, val4, 
                        halfer, arrs, restaurant_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.name,
                        item.price,
                        item.quantity,
                        JSON.stringify(item.ingredients),
                        userId,
                        item.size1,
                        item.val1,
                        item.size2,
                        item.val2,
                        item.size3,
                        item.val3,
                        item.size4,
                        item.val4,
                        JSON.stringify(item.halfer),
                        JSON.stringify(item.arrs),
                        item.restaurant_id
                    ]
                );
            }
            await connection.commit();
            res.status(200).json({ message: 'Cart saved successfully' });
        } catch (err) {
            if (transactionStarted) {
                await connection.rollback();
            }
            console.error('Error saving cart:', err);
            res.status(500).json({ error: err.message || 'Failed to save cart' });
        } finally {
            connection.release();
        }
    });

    // DELETE /api/cart
    router.delete('/cart', checkRole(0), async (req, res) => {
        const userId = req.session?.user?.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM cart WHERE user_id = ?',
                [userId]
            );
            res.json({ message: 'Cart cleared', removed: result.affectedRows });
        } catch (err) {
            console.error('Error clearing cart:', err);
            res.status(500).json({ error: err.message || 'Failed to clear cart' });
        } finally {
            connection.release();
        }
    });

    // GET /api/cart
    router.get('/cart', checkRole(0), async (req, res) => {
        const userId = req.session?.user?.sub;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        try {
            const [results] = await pool.execute(
                'SELECT * FROM cart WHERE user_id = ?', [userId]
            );
            const cartItems = results.map(item => {
                try {
                    return {
                        ...item,
                        ingredients: item.ingredients ? JSON.parse(item.ingredients) : [],
                        halfer: item.halfer ? JSON.parse(item.halfer) : [],
                        arrs: item.arrs ? JSON.parse(item.arrs) : []
                    };
                } catch (err) {
                    console.error('Error parsing cart item:', err);
                    return {
                        ...item,
                        ingredients: [],
                        halfer: [],
                        arrs: []
                    };
                }
            });
            res.json(cartItems);
        } catch (err) {
            console.error('Error loading cart:', err);
            res.status(500).json({ error: 'Failed to load cart' });
        }
    });

    return router;
}

module.exports = cartRoutes;

