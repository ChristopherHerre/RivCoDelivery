const { z } = require('zod');
const { paginationQuerySchema, userIdParamSchema, restaurantIdBodySchema } = require('../utils/schemas');
const { ROLES, getRoleName } = require('../constants/roles');

function userRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // PUT /api/users/:id/role
    router.put('/users/:id/role', checkRole(ROLES.ADMIN), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const paramSchema = z.object({
            id: z.string().min(1, "User ID is required"),
        });
        const paramParseResult = paramSchema.safeParse(req.params);
        if (!paramParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: paramParseResult.error.flatten().fieldErrors,
            });
        }
        const { id } = paramParseResult.data;
        console.log("id: " + id);
        const bodySchema = z.object({
            role: z.coerce.number().int().min(ROLES.USER).max(ROLES.ADMIN, `Role must be ${ROLES.USER} (${getRoleName(ROLES.USER)}), ${ROLES.DRIVER} (${getRoleName(ROLES.DRIVER)}), or ${ROLES.ADMIN} (${getRoleName(ROLES.ADMIN)})`),
        });
        const bodyParseResult = bodySchema.safeParse(req.body);
        if (!bodyParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: bodyParseResult.error.flatten().fieldErrors,
            });
        }
        const { role } = bodyParseResult.data;
        console.log("role: " + role);
        if (id === req.session.user.sub) {
            return res.status(403).json({ error: 'Cannot change your own role' });
        }
        const connection = await pool.getConnection();
        let transactionStarted = false;
        try {
            const [[actingUser]] = await connection.execute(
                'SELECT role FROM users WHERE id = ? LIMIT 1',
                [req.session.user.sub]
            );
            if (!actingUser) {
                return res.status(403).json({ error: 'Current user not found' });
            }
            if (actingUser.role !== ROLES.ADMIN) {
                return res.status(403).json({ error: 'Only admins can change roles' });
            }

            await connection.beginTransaction();
            transactionStarted = true;

            const [[targetUser]] = await connection.execute(
                'SELECT id, role FROM users WHERE id = ? LIMIT 1',
                [id]
            );
            if (!targetUser) {
                await connection.rollback();
                return res.status(404).json({ error: 'User not found' });
            }
            if (targetUser.role === ROLES.ADMIN && role < ROLES.ADMIN) {
                await connection.rollback();
                return res.status(403).json({ error: 'Cannot lower role of admin users' });
            }
            const [result] = await connection.execute(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, id]
            );

            let updatedRole = role;
            if (result.affectedRows === 0) {
                const [[refetched]] = await connection.execute(
                    'SELECT role FROM users WHERE id = ? LIMIT 1',
                    [id]
                );
                if (!refetched) {
                    await connection.rollback();
                    return res.status(404).json({ error: 'User not found or update failed' });
                }
                updatedRole = refetched.role;
            }

            await connection.commit();
            console.log(`Role updated: User ${req.session.user.sub} changed user ${id} role from ${targetUser.role} to ${updatedRole}`);
            res.json({ message: 'Role updated successfully', role: updatedRole });
        } catch (err) {
            if (transactionStarted) {
                await connection.rollback();
            }
            console.error('Error updating role:', err);
            res.status(500).json({ error: 'Server error' });
        } finally {
            connection.release();
        }
    });

    // PUT /api/users/:id/restaurant
    router.put('/users/:id/restaurant', checkRole(ROLES.ADMIN), async (req, res) => {
        // Validate path parameter
        const paramParseResult = userIdParamSchema.safeParse(req.params);
        if (!paramParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: paramParseResult.error.flatten().fieldErrors,
            });
        }
        
        // Validate body parameter
        const bodyParseResult = restaurantIdBodySchema.safeParse(req.body);
        if (!bodyParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: bodyParseResult.error.flatten().fieldErrors,
            });
        }
        
        const { id } = paramParseResult.data;
        const { restaurant_id } = bodyParseResult.data;
        
        try {
            // Verify restaurant exists if restaurant_id is provided
            if (restaurant_id !== null) {
                const [[restaurant]] = await pool.execute(
                    'SELECT id FROM restaurants WHERE id = ? LIMIT 1',
                    [restaurant_id]
                );
                if (!restaurant) {
                    return res.status(404).json({ error: 'Restaurant not found' });
                }
            }
            
            const query = 'UPDATE users SET restaurant_id = ? WHERE id = ?';
            const [result] = await pool.execute(query, [restaurant_id, id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'Restaurant ID updated successfully' });
        } catch (err) {
            console.error('Error updating restaurant ID:', err);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // PUT /api/users/:id/selected_restaurant
    router.put('/users/:id/selected_restaurant', checkRole(ROLES.USER), async (req, res) => {
        // Validate path parameter
        const paramParseResult = userIdParamSchema.safeParse(req.params);
        if (!paramParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: paramParseResult.error.flatten().fieldErrors,
            });
        }
        
        // Validate body parameter
        const bodyParseResult = restaurantIdBodySchema.safeParse(req.body);
        if (!bodyParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: bodyParseResult.error.flatten().fieldErrors,
            });
        }
        
        const { id } = paramParseResult.data;
        const { restaurant_id } = bodyParseResult.data;
        
        // Verify ownership - users can only modify their own selected_restaurant
        if (id !== req.session.user.sub) {
            return res.status(403).json({ 
                error: 'Forbidden: You can only modify your own selected restaurant' 
            });
        }
        
        const query = "UPDATE users SET selected_restaurant = ? WHERE id = ?";
        try {
            const [result] = await pool.execute(query, [restaurant_id, id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json({ message: "Restaurant ID updated successfully" });
        } catch (err) {
            console.error("Error updating restaurant ID:", err);
            res.status(500).json({ message: "Server error" });
        }
    });

    // GET /api/users
    router.get('/users', checkRole(ROLES.ADMIN), async (req, res) => {
        const parseResult = paginationQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { page, limit, query: searchQuery } = parseResult.data;
        const offset = (page - 1) * limit;
        try {
            let sqlQuery = 'SELECT * FROM users';
            let countQuery = 'SELECT COUNT(*) as total FROM users';
            let countParams = [];
            let selectParams = [];
            
            if (searchQuery) {
                sqlQuery += ' WHERE name LIKE ? OR email LIKE ?';
                countQuery += ' WHERE name LIKE ? OR email LIKE ?';
                // COUNT query needs the params for WHERE clause
                countParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
                // SELECT query also needs the params for WHERE clause
                selectParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
            }
            // ✅ FIXED: Values are validated as safe integers by Zod, so template literal is safe
            // MySQL doesn't support LIMIT/OFFSET as parameters in prepared statements
            sqlQuery += ` ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`;
            
            // Get total count and results in parallel
            // COUNT query uses countParams, SELECT query uses selectParams
            const [countResult, selectResult] = await Promise.all([
                pool.execute(countQuery, countParams),
                pool.execute(sqlQuery, selectParams)
            ]);
            
            // pool.execute returns [rows, fields]
            // countResult[0] is the rows array from COUNT query
            // countResult[0][0] is the first row: { total: number }
            // selectResult[0] is the rows array from SELECT query
            const countRows = countResult[0];
            const results = selectResult[0];
            const countRow = countRows && countRows.length > 0 ? countRows[0] : null;
            
            // Extract total - try multiple possible property names
            const total = countRow?.total ?? countRow?.['COUNT(*)'] ?? 0;
            const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
            
            console.log('Users pagination debug:', { 
                page, 
                limit, 
                total, 
                totalPages, 
                resultsCount: results.length,
                countRow: countRow,
                countRowsLength: countRows?.length,
                countQuery: countQuery,
                countParams: countParams,
                hasSearchQuery: !!searchQuery,
                selectQuery: sqlQuery.substring(0, 100) + '...',
                fullCountResult: JSON.stringify(countResult[0])
            });
            
            res.json({
                users: results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            });
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/users/:id/selected_restaurant
    router.get('/users/:id/selected_restaurant', checkRole(ROLES.USER), async (req, res) => {
        // Validate path parameter
        const paramParseResult = userIdParamSchema.safeParse(req.params);
        if (!paramParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: paramParseResult.error.flatten().fieldErrors,
            });
        }
        
        const { id } = paramParseResult.data;
        
        // Verify ownership - users can only view their own selected_restaurant
        if (id !== req.session.user.sub) {
            return res.status(403).json({ 
                error: 'Forbidden: You can only view your own selected restaurant' 
            });
        }
        
        const query = 'SELECT selected_restaurant FROM users WHERE id = ?';
        try {
            const [results] = await pool.execute(query, [id]);
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ selected_restaurant: results[0].selected_restaurant });
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/user/details
    router.get('/user/details', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session.user || !req.session.user.sub) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const userId = req.session.user.sub;
        try {
            const query = 'SELECT id, name, email, address FROM users WHERE id = ? LIMIT 1';
            const [results] = await pool.execute(query, [userId]);
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(results[0]);
        } catch (err) {
            console.error('Error fetching user details:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // DELETE /api/users/:id/cart (Admin only - clear a specific user's cart)
    router.delete('/users/:id/cart', checkRole(ROLES.ADMIN), async (req, res) => {
        // Validate path parameter
        const paramParseResult = userIdParamSchema.safeParse(req.params);
        if (!paramParseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: paramParseResult.error.flatten().fieldErrors,
            });
        }
        
        const { id } = paramParseResult.data;
        
        try {
            // Verify user exists
            const [userResults] = await pool.execute(
                'SELECT id FROM users WHERE id = ? LIMIT 1',
                [id]
            );
            
            if (userResults.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Clear the user's cart
            const [result] = await pool.execute(
                'DELETE FROM cart WHERE user_id = ?',
                [id]
            );
            
            console.log(`Admin ${req.session.user.sub} cleared cart for user ${id}, removed ${result.affectedRows} items`);
            
            res.json({ 
                message: 'Cart cleared successfully', 
                removed: result.affectedRows,
                userId: id
            });
        } catch (err) {
            console.error('Error clearing user cart:', err);
            res.status(500).json({ error: err.message || 'Failed to clear cart' });
        }
    });

    return router;
}

module.exports = userRoutes;

