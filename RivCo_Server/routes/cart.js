const { cartItemInputSchema } = require('../utils/schemas');

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

            // Validate each cart item using Zod schema (addresses vulnerability 1.1)
            for (let i = 0; i < cartItems.length; i++) {
                const rawItem = cartItems[i];
                const parseResult = cartItemInputSchema.safeParse(rawItem);
                
                if (!parseResult.success) {
                    const errors = parseResult.error.flatten().fieldErrors;
                    const errorMessage = Object.entries(errors)
                        .map(([field, messages]) => `${field}: ${messages?.join(', ') || 'Invalid'}`)
                        .join('; ');
                    throw new Error(`Invalid cart item at index ${i}: ${errorMessage}`);
                }

                const validatedItem = parseResult.data;
                const name = validatedItem.name;
                const priceNumber = validatedItem.price;
                const quantity = validatedItem.quantity;
                const itemRestaurantId = validatedItem.restaurant_id;

                // Ensure all items belong to the same restaurant
                if (restaurantId === null) {
                    restaurantId = itemRestaurantId;
                } else if (restaurantId !== itemRestaurantId) {
                    throw new Error('All cart items must belong to the same restaurant');
                }

                // Verify menu item exists in database
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

                // Prepare sanitized item with validated data
                sanitizedItems.push({
                    name,
                    price: priceNumber.toFixed(2),
                    quantity,
                    ingredients: validatedItem.ingredients,
                    halfer: validatedItem.halfer,
                    arrs: validatedItem.arrs,
                    size1: validatedItem.size1,
                    val1: validatedItem.val1,
                    size2: validatedItem.size2,
                    val2: validatedItem.val2,
                    size3: validatedItem.size3,
                    val3: validatedItem.val3,
                    size4: validatedItem.size4,
                    val4: validatedItem.val4,
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

