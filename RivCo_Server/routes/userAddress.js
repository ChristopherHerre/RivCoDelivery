function userAddressRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // POST /api/user/address
    router.post('/user/address', checkRole(0), async (req, res) => {
        if (!req.session.user?.sub) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { address, latitude, longitude } = req.body;
        const userId = req.session.user.sub;
        try {
            await pool.execute(
                `UPDATE users SET
                    address_street_number = ?, 
                    address_street = ?, 
                    address_city = ?, 
                    address_state = ?, 
                    address_zip = ?, 
                    address_latitude = ?, 
                    address_longitude = ?
                WHERE id = ?`,
                [address.streetNumber, address.street, address.city, address.state, address.zip, latitude, longitude, userId]
            );
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating address:', err);
            res.status(500).json({ error: 'Failed to update address' });
        }
    });

    // PUT /api/user/address
    router.put('/user/address', async (req, res) => {
        if (!req.session.user?.sub) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userId = req.session.user.sub;
        try {
            await pool.execute(
                `UPDATE users SET
                    address_street_number = NULL,
                    address_street = NULL,
                    address_city = NULL,
                    address_state = NULL,
                    address_zip = NULL,
                    address_latitude = NULL,
                    address_longitude = NULL
                WHERE id = ?`, [userId]
            );
            res.json({ success: true });
        } catch (err) {
            console.error('Error updating address:', err);
            res.status(500).json({ error: 'Failed to update address' });
        }
    });

    // GET /api/user/address
    router.get('/user/address', checkRole(0), async (req, res) => {
        if (!req.session.user?.sub) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        try {
            const [results] = await pool.execute(
                `SELECT
                    address_street_number,
                    address_street,
                    address_city,
                    address_state,
                    address_zip,
                    address_latitude,
                    address_longitude
                FROM users 
                WHERE id = ?`, [req.session.user.sub]
            );
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const address = {
                streetNumber: results[0].address_street_number,
                street: results[0].address_street,
                city: results[0].address_city,
                state: results[0].address_state,
                zip: results[0].address_zip
            };
            res.json({
                address,
                latitude: results[0].address_latitude,
                longitude: results[0].address_longitude
            });
        } catch (err) {
            console.error('Error fetching address:', err);
            res.status(500).json({ error: 'Failed to fetch address' });
        }
    });

    // GET /api/user/full-address
    router.get('/user/full-address', async (req, res) => {
        if (!req.session.user?.sub) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        try {
            const [results] = await pool.execute(
                `SELECT address_street_number, address_street, address_city, address_state, address_zip
                FROM users 
                WHERE id = ?`, [req.session.user.sub]
            );
            if (results.length === 0) {
                return res.status(404).json({ error: 'Address not found' });
            }
            const address = {
                streetNumber: results[0].address_street_number,
                street: results[0].address_street,
                city: results[0].address_city,
                state: results[0].address_state,
                zip: results[0].address_zip
            };
            res.json({ address });
        } catch (err) {
            console.error('Error fetching address:', err);
            res.status(500).json({ error: 'Failed to fetch address' });
        }
    });

    return router;
}

module.exports = userAddressRoutes;

