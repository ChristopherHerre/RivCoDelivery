const { z } = require('zod');
const { changeOrderOpenSchema, paginationQuerySchema, orderIdQuerySchema } = require('../utils/schemas');
const { ROLES } = require('../constants/roles');

function ordersRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // POST /api/changeOrderOpen
    router.post('/changeOrderOpen', checkRole(ROLES.DRIVER), async (req, res) => {
        try {
            const { orderId } = changeOrderOpenSchema.parse(req.body);
            const query = 'UPDATE orders SET open = 1 WHERE id = ? LIMIT 1';
            const [result] = await pool.execute(query, [orderId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.status(200).json({ message: 'Order status updated successfully' });
        } catch (err) {
            if (err instanceof z.ZodError) {
                return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
            }
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/orders
    router.get('/orders', checkRole(ROLES.DRIVER), async (req, res) => {
        const parseResult = paginationQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { page, limit } = parseResult.data;
        const offset = (page - 1) * limit;
        try {
            // Get total count and results in parallel
            const countQuery = `SELECT COUNT(*) as total FROM orders WHERE open = '0'`;
            const selectQuery = `SELECT 
                o.*,
                u.name as user_name,
                u.email as user_email,
                o.user_id as user_id
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.open = '0' 
            ORDER BY o.date DESC 
            LIMIT ${limit} OFFSET ${offset}`;
            
            const [countResult, selectResult] = await Promise.all([
                pool.execute(countQuery),
                pool.execute(selectQuery)
            ]);
            
            // pool.execute returns [rows, fields]
            // countResult[0] is the rows array from COUNT query
            // countResult[0][0] is the first row: { total: number }
            const countRows = countResult[0];
            const results = selectResult[0];
            const countRow = countRows && countRows.length > 0 ? countRows[0] : null;
            
            // Extract total - try multiple possible property names
            const total = countRow?.total ?? countRow?.['COUNT(*)'] ?? 0;
            const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
            
            // Parse user names to extract firstname and lastname
            const ordersWithUserInfo = results.map(order => {
                let firstname = '';
                let lastname = '';
                
                if (order.user_name) {
                    const nameParts = order.user_name.trim().split(/\s+/);
                    if (nameParts.length > 0) {
                        firstname = nameParts[0];
                        if (nameParts.length > 1) {
                            lastname = nameParts.slice(1).join(' ');
                        }
                    }
                }
                
                return {
                    ...order,
                    firstname: firstname || order.user_name || '',
                    lastname: lastname,
                    email: order.user_email || '',
                    user_id: order.user_id || ''
                };
            });
            
            console.log('Driver orders pagination:', { 
                page, 
                limit, 
                total, 
                totalPages, 
                resultsCount: ordersWithUserInfo.length,
                countRow: countRow,
                countResult: countResult[0]
            });
            
            res.json({
                orders: ordersWithUserInfo,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    });

    // GET /api/order_items
    router.get('/order_items', checkRole(ROLES.USER), async (req, res) => {
        // Validate query parameters
        const parseResult = orderIdQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { oid } = parseResult.data;
        const query = 'SELECT * FROM order_items Where order_id = ? LIMIT 50';
        try {
            const [results] = await pool.execute(query, [oid]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/user/orders
    router.get('/user/orders', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session.user?.sub) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const parseResult = paginationQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            console.error('Validation error:', parseResult.error);
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { page, limit } = parseResult.data;
        const offset = (page - 1) * limit;
        try {
            // Get total count and results in parallel
            const countQuery = `SELECT COUNT(*) as total FROM orders WHERE user_id = ?`;
            const selectQuery = `SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`;
            
            const [countResult, selectResult] = await Promise.all([
                pool.execute(countQuery, [req.session.user.sub]),
                pool.execute(selectQuery, [req.session.user.sub])
            ]);
            
            // pool.execute returns [rows, fields]
            // countResult[0] is the rows array from COUNT query
            // countResult[0][0] is the first row: { total: number }
            const countRows = countResult[0];
            const results = selectResult[0];
            const countRow = countRows && countRows.length > 0 ? countRows[0] : null;
            
            // Extract total - try multiple possible property names
            const total = countRow?.total ?? countRow?.['COUNT(*)'] ?? 0;
            const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
            
            console.log('User orders pagination:', { 
                page, 
                limit, 
                total, 
                totalPages, 
                resultsCount: results.length,
                countRow: countRow,
                countResult: countResult[0],
                userId: req.session.user.sub
            });
            
            res.json({
                orders: results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Failed to fetch orders', message: err.message });
        }
    });

    return router;
}

module.exports = ordersRoutes;

