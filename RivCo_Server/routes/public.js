const { haversine_dist } = require('../utils/helpers');

function publicRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // GET /api/health
    router.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // GET /api/sponsors
    router.get('/sponsors', async (req, res) => {
        const query = 'SELECT business_name, phone_number, website_url, description FROM sponsors;';
        try {
            const [results] = await pool.query(query);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/maps-api-key
    router.get('/maps-api-key', (req, res) => {
        console.log("API Key Request Received");
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey == undefined || apiKey === undefined) {
            return res.status(500).json({ error: "API key not found" });
        }
        res.json({ apiKey });
    });

    // GET /api/restaurants/:latitude/:longitude
    router.get('/restaurants/:latitude/:longitude', checkRole(0), async (req, res) => {
        const { latitude, longitude } = req.params;
        const query = `
            SELECT * FROM restaurants 
            WHERE address IS NOT NULL 
            AND longitude IS NOT NULL 
            AND latitude IS NOT NULL
            LIMIT 50`;
        try {
            const [results] = await pool.execute(query);
            const restaurantsWithDistance = results.map((restaurant) => {
                const distance = haversine_dist(
                    parseFloat(latitude),
                    parseFloat(longitude),
                    parseFloat(restaurant.latitude),
                    parseFloat(restaurant.longitude)
                );
                return { ...restaurant, distance };
            }).sort((a, b) => a.distance - b.distance);
            res.json(restaurantsWithDistance);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/menu-ingredients/:menuItem
    router.get('/menu-ingredients/:menuItem', checkRole(2), async (req, res) => {
        const { menuItem } = req.params;
        const query = `SELECT * FROM menu_item_ingredients WHERE id = ?;`;
        try {
            const [results] = await pool.query(query, [menuItem]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    return router;
}

module.exports = publicRoutes;

