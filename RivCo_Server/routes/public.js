const { haversine_dist } = require('../utils/helpers');
const { latLngParamSchema } = require('../utils/schemas');

function publicRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // GET /api/health
    router.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // GET /api/maps-api-key
    router.get('/maps-api-key', checkRole(0), (req, res) => {
        console.log("API Key Request Received");
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey == undefined || apiKey === undefined) {
            return res.status(500).json({ error: "API key not found" });
        }
        res.json({ apiKey });
    });

    // GET /api/restaurants/:latitude/:longitude
    router.get('/restaurants/:latitude/:longitude', checkRole(0), async (req, res) => {
        // Validate path parameters
        const parseResult = latLngParamSchema.safeParse(req.params);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { latitude, longitude } = parseResult.data;
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
                    latitude,
                    longitude,
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

    return router;
}

module.exports = publicRoutes;

