const { z } = require('zod');
const { changeOrderOpenSchema } = require('../utils/schemas');

function ordersRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // POST /api/changeOrderOpen
    router.post('/changeOrderOpen', checkRole(1), async (req, res) => {
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
    router.get('/orders', checkRole(1), async (req, res) => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        try {
            const query = `SELECT * FROM orders WHERE open = '0' ORDER BY date DESC LIMIT ? OFFSET ?`;
            const [results] = await pool.execute(query, [
                limit.toString(), 
                offset.toString()
            ]);
            res.json(results);
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    });

    // GET /api/order_items
    router.get('/order_items', checkRole(0), async (req, res) => {
        const query = 'SELECT * FROM order_items Where order_id = ? LIMIT 50';
        const { oid } = req.query;
        try {
            const [results] = await pool.execute(query, [oid]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/user/orders
    router.get('/user/orders', checkRole(0), async (req, res) => {
        if (!req.session.user?.sub) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        try {
            const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?';
            const [results] = await pool.execute(query, [
                req.session.user.sub,
                limit.toString(),
                offset.toString()
            ]);
            res.json(results);
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    });

    return router;
}

module.exports = ordersRoutes;

