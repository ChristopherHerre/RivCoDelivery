const { addRestaurantSchema, restaurantIdParamSchema } = require('../utils/schemas');
const { extractCityFromAddressString, toCitySlug } = require('../utils/helpers');

function restaurantRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // POST /api/addRestaurant
    router.post('/addRestaurant', checkRole(2), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const parseResult = addRestaurantSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { name, address, latitude, longitude, category } = parseResult.data;
        const cityName = extractCityFromAddressString(address);
        const citySlug = cityName ? toCitySlug(cityName) : null;
        try {
            const [result] = await pool.execute(
            `INSERT INTO restaurants (name, address, latitude, longitude, category, city_name, city_slug)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [name, address, latitude, longitude, category, cityName, citySlug]
            );
            res.status(201).json({ message: "Restaurant added successfully", id: result.insertId });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // POST /api/manageRestaurant
    router.post('/manageRestaurant', checkRole(2), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const parseResult = addRestaurantSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { name, address, latitude, longitude, category } = parseResult.data;
        const cityName = extractCityFromAddressString(address);
        const citySlug = cityName ? toCitySlug(cityName) : null;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [[existingRestaurant]] = await connection.execute(
                `SELECT restaurant_id FROM users WHERE id = ?`, 
                [req.session.user.sub]
            );
            if (existingRestaurant?.restaurant_id) {
                await connection.execute(
                    `UPDATE restaurants 
                     SET name = ?, address = ?, latitude = ?, longitude = ?, category = ?, city_name = ?, city_slug = ?
                     WHERE id = ?`,
                    [name, address, latitude, longitude, category, cityName, citySlug, existingRestaurant.restaurant_id]
                );
                await connection.commit();
                return res.status(200).json({ message: "Restaurant updated successfully" });
            } else {
                const [result] = await connection.execute(
                    `INSERT INTO restaurants (name, address, latitude, longitude, category, city_name, city_slug)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [name, address, latitude, longitude, category, cityName, citySlug]
                );
                await connection.execute(
                    `UPDATE users SET restaurant_id = ? WHERE id = ?`,
                    [result.insertId, req.session.user.sub]
                );
                await connection.commit();
                return res.status(201).json({ message: "Restaurant added successfully", id: result.insertId });
            }
        } catch (error) {
            await connection.rollback();
            console.error("Database error:", error);
            res.status(500).json({ error: "Internal server error" });
        } finally {
            connection.release();
        }
    });

    // GET /api/getUserRestaurant
    router.get('/getUserRestaurant', checkRole(2), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        try {
            const [[restaurant]] = await pool.execute(
                `SELECT r.* FROM restaurants r 
                 JOIN users u ON u.restaurant_id = r.id 
                 WHERE u.id = ?`, [req.session.user.sub]
            );
            res.json({ restaurant: restaurant || null });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // GET /api/restaurants2/:restaurantId/menu
    router.get('/restaurants2/:restaurantId/menu', checkRole(0), async (req, res) => {
        const parseResult = restaurantIdParamSchema.safeParse(req.params);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { restaurantId } = parseResult.data;
        const query = 'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort LIMIT 50';
        try {
            const [results] = await pool.execute(query, [restaurantId]);
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: list distinct restaurant cities for SEO / SSR
    // GET /api/restaurant-cities
    router.get('/restaurant-cities', async (_req, res) => {
        try {
            const [rows] = await pool.execute(
                `SELECT DISTINCT city_name, city_slug
                 FROM restaurants
                 WHERE city_slug IS NOT NULL
                 ORDER BY city_name ASC`
            );
            res.json(rows);
        } catch (err) {
            console.error('Error fetching restaurant cities:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: restaurants by city_slug for SEO / SSR
    // GET /api/restaurants-by-city?city_slug=riverside-ca
    router.get('/restaurants-by-city', async (req, res) => {
        const { city_slug } = req.query;
        if (!city_slug) {
            return res.status(400).json({ error: 'city_slug is required' });
        }
        try {
            const [rows] = await pool.execute(
                `SELECT id, name, address, latitude, longitude, category, city_name, city_slug
                 FROM restaurants
                 WHERE city_slug = ?`,
                [city_slug]
            );
            res.json(rows);
        } catch (err) {
            console.error('Error fetching restaurants by city:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

        // PUBLIC: single restaurant by id for SEO / SSR
    // GET /api/public/restaurants/:id
    router.get('/public/restaurants/:id', async (req, res) => {
        const id = Number(req.params.id);
        if (!id || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid restaurant id' });
        }
        try {
            const [results] = await pool.execute(
                'SELECT id, name, category, address, latitude, longitude, city_name, city_slug FROM restaurants WHERE id = ? LIMIT 1',
                [id]
            );
            if (results.length === 0) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            res.json(results[0]);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // GET /api/restaurants/:restaurant
    router.get('/restaurants/:restaurant', checkRole(0), async (req, res) => {
        // Map :restaurant to restaurantId for validation
        const parseResult = restaurantIdParamSchema.safeParse({ restaurantId: req.params.restaurant });
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const restaurant = parseResult.data.restaurantId;
        const query = 'SELECT * FROM restaurants WHERE id = ? LIMIT 1';
        try {
            const [results] = await pool.execute(query, [restaurant]);
            if (results.length === 0) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            res.json(results[0]);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    return router;
}

module.exports = restaurantRoutes;

