function userAddressRoutes(app, pool, checkRole) {
    const router = require('express').Router();
    const { userAddressPostSchema } = require('../utils/schemas');
    const { ROLES } = require('../constants/roles');
    
    // POST /api/user/address
    router.post('/user/address', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session.user?.sub) {
            console.log('[userAddress] POST /user/address - Unauthorized: No session user');
            return res.status(401).json({ error: 'Not authenticated' });
        }
        console.log('[userAddress] POST /user/address - Request received for user:', req.session.user.sub);
        // Validate input
        const parseResult = userAddressPostSchema.safeParse(req.body);
        if (!parseResult.success) {
            console.log('[userAddress] POST /user/address - Validation failed:', parseResult.error.flatten().fieldErrors);
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        console.log('[userAddress] POST /user/address - Validation passed. Latitude:', parseResult.data.latitude, 'Longitude:', parseResult.data.longitude);
        const { address, latitude, longitude } = parseResult.data;
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
                [
                    address?.streetNumber || null, 
                    address?.street || null, 
                    address?.city || null, 
                    address?.state || null, 
                    address?.zip || null, 
                    latitude, 
                    longitude, 
                    userId
                ]
            );
            console.log('[userAddress] POST /user/address - Address successfully updated for user:', userId);
            res.json({ success: true });
        } catch (err) {
            console.error('[userAddress] POST /user/address - Error updating address:', err);
            res.status(500).json({ error: 'Failed to update address' });
        }
    });

    // PUT /api/user/address
    router.put('/user/address', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session.user?.sub) {
            console.log('[userAddress] PUT /user/address - Unauthorized: No session user');
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userId = req.session.user.sub;
        console.log('[userAddress] PUT /user/address - Clearing address for user:', userId);
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
            console.log('[userAddress] PUT /user/address - Address successfully cleared for user:', userId);
            res.json({ success: true });
        } catch (err) {
            console.error('[userAddress] PUT /user/address - Error clearing address:', err);
            res.status(500).json({ error: 'Failed to update address' });
        }
    });

    // GET /api/user/address
    router.get('/user/address', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session.user?.sub) {
            console.log('[userAddress] GET /user/address - Unauthorized: No session user');
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userId = req.session.user.sub;
        console.log('[userAddress] GET /user/address - Fetching address for user:', userId);
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
                WHERE id = ?`, [userId]
            );
            if (results.length === 0) {
                console.log('[userAddress] GET /user/address - User not found:', userId);
                return res.status(404).json({ error: 'User not found' });
            }
            const address = {
                streetNumber: results[0].address_street_number || null,
                street: results[0].address_street || null,
                city: results[0].address_city || null,
                state: results[0].address_state || null,
                zip: results[0].address_zip || null
            };
            console.log('[userAddress] GET /user/address - Address retrieved successfully for user:', userId);
            res.json({
                address,
                latitude: results[0].address_latitude ?? null,
                longitude: results[0].address_longitude ?? null
            });
        } catch (err) {
            console.error('[userAddress] GET /user/address - Error fetching address:', err);
            res.status(500).json({ error: 'Failed to fetch address' });
        }
    });

    // GET /api/user/full-address
    router.get('/user/full-address', checkRole(ROLES.USER), async (req, res) => {
        if (!req.session.user?.sub) {
            console.log('[userAddress] GET /user/full-address - Unauthorized: No session user');
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const userId = req.session.user.sub;
        console.log('[userAddress] GET /user/full-address - Fetching full address for user:', userId);
        try {
            const [results] = await pool.execute(
                `SELECT address_street_number, address_street, address_city, address_state, address_zip
                FROM users 
                WHERE id = ?`, [userId]
            );
            if (results.length === 0) {
                console.log('[userAddress] GET /user/full-address - Address not found for user:', userId);
                return res.status(404).json({ error: 'Address not found' });
            }
            const address = {
                streetNumber: results[0].address_street_number || null,
                street: results[0].address_street || null,
                city: results[0].address_city || null,
                state: results[0].address_state || null,
                zip: results[0].address_zip || null
            };
            console.log('[userAddress] GET /user/full-address - Full address retrieved successfully for user:', userId);
            res.json({ address });
        } catch (err) {
            console.error('[userAddress] GET /user/full-address - Error fetching address:', err);
            res.status(500).json({ error: 'Failed to fetch address' });
        }
    });

    return router;
}

module.exports = userAddressRoutes;

