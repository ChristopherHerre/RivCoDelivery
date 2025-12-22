const { z } = require('zod');
const { updateMenuItemSchema, addMenuItemSchema, menuItemIdQuerySchema, menuItemIdParamSchema, menuItemSearchSchema } = require('../utils/schemas');
const { ROLES } = require('../constants/roles');

function menuItemRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // DELETE /api/menu-items/:id
    router.delete('/menu-items/:id', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const parseResult = menuItemIdParamSchema.safeParse(req.params);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
        }
        const { id } = parseResult.data;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // ✅ ADD: Verify ownership - Get user's restaurant_id
            const [[user]] = await connection.execute(
                'SELECT restaurant_id FROM users WHERE id = ? LIMIT 1',
                [req.session.user.sub]
            );
            if (!user?.restaurant_id) {
                await connection.rollback();
                return res.status(403).json({ error: 'User has no associated restaurant' });
            }
            
            // ✅ ADD: Verify menu item exists and belongs to user's restaurant
            const [[menuItem]] = await connection.execute(
                'SELECT id, restaurant_id FROM menu_items WHERE id = ? LIMIT 1',
                [id]
            );
            if (!menuItem) {
                await connection.rollback();
                return res.status(404).json({ error: 'Menu item not found' });
            }
            if (menuItem.restaurant_id !== user.restaurant_id) {
                await connection.rollback();
                return res.status(403).json({ error: 'Access denied: Menu item does not belong to your restaurant' });
            }
            
            // Proceed with deletion
            const deleteMappings = `DELETE FROM menu_item_ingredients_map WHERE menu_item_id = ?`;
            await connection.query(deleteMappings, [id]);
            const deleteItem = `DELETE FROM menu_items WHERE id = ?`;
            const [result] = await connection.query(deleteItem, [id]);
            if (result.affectedRows === 0) {
                throw new Error("Menu item not found");
            }
            await connection.commit();
            res.status(200).json({ message: "Menu item deleted successfully!" });
        } catch (error) {
            await connection.rollback();
            console.error("Error deleting menu item:", error);
            res.status(500).json({ error: "Failed to delete menu item." });
        } finally {
            connection.release();
        }
    });

    // POST /api/update-menu-item/:id
    router.post('/update-menu-item/:id', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        console.log("---- /api/update-menu-item/:id called ----");
        console.log("Received params:", req.params);
        console.log("Received body:", req.body);
        const paramSchema = z.object({
            id: z.coerce.number().int().positive("id must be a positive integer"),
        });
        const paramParseResult = paramSchema.safeParse(req.params);
        if (!paramParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: paramParseResult.error.flatten().fieldErrors,
            });
        }
        const { id } = paramParseResult.data;
        const parseResult = updateMenuItemSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const updates = parseResult.data;
        console.log("Validated updates:", updates);
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update data provided" });
        }
        const allowedFields = [
            "name", "price", "size1",
            "size2", "size3", "size4", "price2", "price3", "price4",
            "category", "sort"
        ];
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key]) => allowedFields.includes(key))
        );
        if (Object.keys(filteredUpdates).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [[user]] = await connection.execute(
                'SELECT restaurant_id FROM users WHERE id = ?',
                [req.session.user.sub]
            );
            if (!user?.restaurant_id) {
                await connection.rollback();
                return res.status(403).json({ error: "User has no associated restaurant" });
            }
            const [[menuItem]] = await connection.execute(
                'SELECT id, restaurant_id FROM menu_items WHERE id = ?',
                [id]
            );
            if (!menuItem) {
                await connection.rollback();
                return res.status(404).json({ error: "Menu item not found" });
            }
            if (menuItem.restaurant_id !== user.restaurant_id) {
                await connection.rollback();
                return res.status(403).json({ error: "Access denied: Menu item does not belong to your restaurant" });
            }
            const updateFields = Object.keys(filteredUpdates)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(filteredUpdates), id];
            const sql = `UPDATE menu_items SET ${updateFields} WHERE id = ? AND restaurant_id = ?`;
            const [result] = await connection.execute(sql, [...values, user.restaurant_id]);
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: "Menu item not found or access denied" });
            }
            await connection.commit();
            return res.json({ message: 'Menu item updated successfully' });
        } catch (err) {
            await connection.rollback();
            console.error("SQL Error:", err);
            return res.status(500).json({ error: "Database error: " + err.message });
        } finally {
            connection.release();
        }
    });

    // POST /api/menu-items (link ingredient to menu item)
    router.post('/menu-items', checkRole(ROLES.ADMIN), async (req, res) => {
        const { menu_item_id, ingredient_id } = req.body;
        if (!menu_item_id || !ingredient_id) {
            return res.status(400).json({ error: 'Menu item ID and Ingredient ID are required' });
        }
        const menuItemId = Number(menu_item_id);
        const ingredientId = Number(ingredient_id);
        if (!Number.isInteger(menuItemId) || menuItemId <= 0 || !Number.isInteger(ingredientId) || ingredientId <= 0) {
            return res.status(400).json({ error: 'Menu item ID and Ingredient ID must be positive integers' });
        }

        const connection = await pool.getConnection();
        try {
            const [[user]] = await connection.execute(
                'SELECT restaurant_id FROM users WHERE id = ? LIMIT 1',
                [req.session.user.sub]
            );
            if (!user?.restaurant_id) {
                return res.status(403).json({ error: 'User has no associated restaurant' });
            }

            const [[menuItem]] = await connection.execute(
                'SELECT id, restaurant_id FROM menu_items WHERE id = ? LIMIT 1',
                [menuItemId]
            );
            if (!menuItem) {
                return res.status(404).json({ error: 'Menu item not found' });
            }
            if (menuItem.restaurant_id !== user.restaurant_id) {
                return res.status(403).json({ error: 'Cannot modify menu items belonging to another restaurant' });
            }

            const [[ingredientExists]] = await connection.execute(
                'SELECT id FROM menu_item_ingredients WHERE id = ? LIMIT 1',
                [ingredientId]
            );
            if (!ingredientExists) {
                return res.status(404).json({ error: 'Ingredient not found' });
            }

            const [[conflict]] = await connection.execute(
                `SELECT 1
                 FROM menu_item_ingredients_map miim
                 JOIN menu_items mi ON miim.menu_item_id = mi.id
                 WHERE miim.ingredient_id = ? AND mi.restaurant_id <> ?
                 LIMIT 1`,
                [ingredientId, user.restaurant_id]
            );
            if (conflict) {
                return res.status(403).json({ error: 'Ingredient already linked to another restaurant' });
            }

            await connection.execute(
                `INSERT INTO menu_item_ingredients_map (menu_item_id, ingredient_id)
                 VALUES (?, ?)`,
                [menuItemId, ingredientId]
            );

            res.status(201).json({ message: 'Ingredient linked to menu item successfully' });
        } catch (err) {
            console.error('Error inserting new row:', err);
            res.status(500).json({ error: 'Failed to link ingredient to menu item' });
        } finally {
            connection.release();
        }
    });

    // POST /api/add-menu-item
    router.post('/add-menu-item', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const parseResult = addMenuItemSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const {
            name, category, price,
            size1, size2, size3, size4,
            price2, price3, price4, sort
        } = parseResult.data;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [[user]] = await connection.execute(
                'SELECT restaurant_id FROM users WHERE id = ?',
                [req.session.user.sub]
            );
            if (!user?.restaurant_id) {
                throw new Error("User has no associated restaurant");
            }
            const [result] = await connection.execute(
                `INSERT INTO menu_items 
                    (restaurant_id, name, price, size1, size2, size3, size4,
                     price2, price3, price4, category, sort)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.restaurant_id,
                    name,
                    price,
                    size1 || null,
                    size2 || null,
                    size3 || null,
                    size4 || null,
                    price2 ?? null,
                    price3 ?? null,
                    price4 ?? null,
                    category,
                    sort
                ]
            );
            await connection.commit();
            res.status(201).json({
                message: "Menu item added successfully",
                id: result.insertId,
            });
        } catch (error) {
            await connection.rollback();
            console.error("Database error:", error);
            res.status(500).json({ error: error.message || "Internal server error" });
        } finally {
            connection.release();
        }
    });

    // GET /api/menu-items-list
    router.get('/menu-items-list', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'Unauthorized: No user session' });
        }
        console.log("sub: " + req.session?.user?.sub);
        try {
            const query = `
                SELECT menu_items.*
                FROM menu_items
                JOIN users ON users.restaurant_id = menu_items.restaurant_id
                WHERE users.id = ?
                ORDER BY menu_items.sort, menu_items.category, menu_items.name;
            `;
            const [results] = await pool.query(query, [req.session.user.sub]);
            if (results.length === 0) {
                return res.status(403).json({ error: 'Forbidden: No menu items found for this user\'s restaurant' });
            }
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu-item-categories - Get unique categories for autocomplete
    router.get('/menu-item-categories', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'Unauthorized: No user session' });
        }
        const { query: searchQuery } = req.query;
        try {
            const connection = await pool.getConnection();
            try {
                // Get user's restaurant_id
                const [[user]] = await connection.execute(
                    'SELECT restaurant_id FROM users WHERE id = ?',
                    [req.session.user.sub]
                );
                if (!user?.restaurant_id) {
                    return res.status(403).json({ error: 'User has no associated restaurant' });
                }

                // Get unique categories, optionally filtered by search query
                let sqlQuery = `
                    SELECT DISTINCT category
                    FROM menu_items
                    WHERE restaurant_id = ? AND category IS NOT NULL AND category != ''
                `;
                const params = [user.restaurant_id];

                if (searchQuery && searchQuery.trim()) {
                    sqlQuery += ' AND category LIKE ?';
                    params.push(`%${searchQuery.trim()}%`);
                }

                sqlQuery += ' ORDER BY category LIMIT 20';

                const [results] = await connection.execute(sqlQuery, params);
                const categories = results.map(row => row.category);
                res.json(categories);
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu/item/search
    router.get('/menu/item/search', checkRole(ROLES.USER), async (req, res) => {
        const parseResult = menuItemSearchSchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { menuItemName } = parseResult.data;
        try {
            // If menuItemName is empty, return empty results
            if (!menuItemName) {
                return res.json([]);
            }
            const query = 'SELECT * FROM menu_items WHERE name LIKE ? LIMIT 50';
            const queryParam = `%${menuItemName}%`;
            const [results] = await pool.execute(query, [queryParam]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu/item/ingredients
    router.get('/menu/item/ingredients', checkRole(ROLES.USER), async (req, res) => {
        // Validate query parameters
        const parseResult = menuItemIdQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { menuItem } = parseResult.data;
        const query = `
            SELECT *
            FROM menu_item_ingredients i
            JOIN menu_item_ingredients_map m ON i.id = m.ingredient_id
            WHERE m.menu_item_id = ? LIMIT 20`;
        try {
            const [results] = await pool.execute(query, [menuItem]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu/item
    router.get('/menu/item', checkRole(ROLES.USER), async (req, res) => {
        // Validate query parameters
        const parseResult = menuItemIdQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { menuItem } = parseResult.data;
        const query = 'SELECT * FROM menu_items WHERE id = ? LIMIT 1';
        try {
            const [results] = await pool.execute(query, [menuItem]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get menu item ingredients
    // GET /api/public/menu-items/:id/ingredients
    router.get('/public/menu-items/:id/ingredients', async (req, res) => {
        const id = Number(req.params.id);
        if (!id || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid menu item id' });
        }
        try {
            const [results] = await pool.execute(
                `SELECT i.*
                 FROM menu_item_ingredients i
                 JOIN menu_item_ingredients_map m ON i.id = m.ingredient_id
                 WHERE m.menu_item_id = ?
                 ORDER BY i.sort_order, i.ingredients_name`,
                [id]
            );
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu-item-prices - Get unique prices for autocomplete
    router.get('/menu-item-prices', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'Unauthorized: No user session' });
        }
        const { query: searchQuery, field } = req.query;
        try {
            const connection = await pool.getConnection();
            try {
                // Get user's restaurant_id
                const [[user]] = await connection.execute(
                    'SELECT restaurant_id FROM users WHERE id = ?',
                    [req.session.user.sub]
                );
                if (!user?.restaurant_id) {
                    return res.status(403).json({ error: 'User has no associated restaurant' });
                }

                // Determine which price field to query (price, price2, price3, price4)
                const priceField = field || 'price';
                const validFields = ['price', 'price2', 'price3', 'price4'];
                if (!validFields.includes(priceField)) {
                    return res.status(400).json({ error: 'Invalid price field' });
                }

                // Get unique prices from the specified field
                let sqlQuery = `
                    SELECT DISTINCT ${priceField}
                    FROM menu_items
                    WHERE restaurant_id = ? AND ${priceField} IS NOT NULL AND ${priceField} != ''
                `;
                const params = [user.restaurant_id];

                if (searchQuery && searchQuery.trim()) {
                    sqlQuery += ` AND CAST(${priceField} AS CHAR) LIKE ?`;
                    params.push(`%${searchQuery.trim()}%`);
                }

                sqlQuery += ` ORDER BY ${priceField} LIMIT 20`;

                const [results] = await connection.execute(sqlQuery, params);
                const prices = results.map(row => String(row[priceField])).filter(price => price && price.trim());
                res.json(prices);
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Error fetching prices:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu-item-sizes - Get unique sizes for autocomplete
    router.get('/menu-item-sizes', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'Unauthorized: No user session' });
        }
        const { query: searchQuery, field } = req.query;
        try {
            const connection = await pool.getConnection();
            try {
                // Get user's restaurant_id
                const [[user]] = await connection.execute(
                    'SELECT restaurant_id FROM users WHERE id = ?',
                    [req.session.user.sub]
                );
                if (!user?.restaurant_id) {
                    return res.status(403).json({ error: 'User has no associated restaurant' });
                }

                // Determine which size field to query (size1, size2, size3, size4)
                const sizeField = field || 'size1';
                const validFields = ['size1', 'size2', 'size3', 'size4'];
                if (!validFields.includes(sizeField)) {
                    return res.status(400).json({ error: 'Invalid size field' });
                }

                // Get unique sizes from the specified field
                let sqlQuery = `
                    SELECT DISTINCT ${sizeField}
                    FROM menu_items
                    WHERE restaurant_id = ? AND ${sizeField} IS NOT NULL AND ${sizeField} != '' AND TRIM(${sizeField}) != ''
                `;
                const params = [user.restaurant_id];

                if (searchQuery && searchQuery.trim()) {
                    sqlQuery += ` AND LOWER(TRIM(${sizeField})) LIKE LOWER(?)`;
                    params.push(`%${searchQuery.trim()}%`);
                }

                sqlQuery += ` ORDER BY ${sizeField} LIMIT 20`;

                const [results] = await connection.execute(sqlQuery, params);
                const sizes = results.map(row => row[sizeField]).filter(size => size && size.trim());
                res.json(sizes);
            } finally {
                connection.release();
            }
        } catch (err) {
            console.error('Error fetching sizes:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    return router;
}

module.exports = menuItemRoutes;

