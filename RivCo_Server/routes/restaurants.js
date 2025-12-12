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

    // GET /api/restaurants2/:restaurantId/menu (public endpoint for SSR and SPA)
    router.get('/restaurants2/:restaurantId/menu', async (req, res) => {
        const parseResult = restaurantIdParamSchema.safeParse(req.params);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const { restaurantId } = parseResult.data;
        const query = 'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort, category, name';
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

    // PUBLIC: Get menu item by ID with restaurant context
    // GET /api/public/menu-items/:id
    router.get('/public/menu-items/:id', async (req, res) => {
        const id = Number(req.params.id);
        if (!id || Number.isNaN(id)) {
            return res.status(400).json({ error: 'Invalid menu item id' });
        }
        try {
            const [results] = await pool.execute(
                `SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name, r.city_name, r.city_slug, r.address as restaurant_address
                 FROM menu_items mi
                 JOIN restaurants r ON mi.restaurant_id = r.id
                 WHERE mi.id = ? LIMIT 1`,
                [id]
            );
            if (results.length === 0) {
                return res.status(404).json({ error: 'Menu item not found' });
            }
            res.json(results[0]);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get menu item by slug and restaurant
    // GET /api/public/menu-items-by-slug?restaurant_id=37&slug=cinnamon-roll-123
    router.get('/public/menu-items-by-slug', async (req, res) => {
        const { restaurant_id, slug } = req.query;
        if (!restaurant_id || !slug) {
            return res.status(400).json({ error: 'restaurant_id and slug are required' });
        }
        const restaurantId = Number(restaurant_id);
        if (!restaurantId || Number.isNaN(restaurantId)) {
            return res.status(400).json({ error: 'Invalid restaurant_id' });
        }
        try {
            // Extract ID from slug (format: name-id)
            const slugParts = slug.split('-');
            const itemId = Number(slugParts[slugParts.length - 1]);
            
            if (!itemId || Number.isNaN(itemId)) {
                return res.status(400).json({ error: 'Invalid slug format' });
            }

            const [results] = await pool.execute(
                `SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name, r.city_name, r.city_slug, r.address as restaurant_address
                 FROM menu_items mi
                 JOIN restaurants r ON mi.restaurant_id = r.id
                 WHERE mi.id = ? AND mi.restaurant_id = ? LIMIT 1`,
                [itemId, restaurantId]
            );
            if (results.length === 0) {
                return res.status(404).json({ error: 'Menu item not found' });
            }
            res.json(results[0]);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get menu items using an ingredient (global - all restaurants)
    // GET /api/public/ingredients/:slug
    router.get('/public/ingredients/:slug', async (req, res) => {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ error: 'Ingredient slug is required' });
        }
        try {
            // Search for ingredient by name (slugified)
            const ingredientName = slug.replace(/-/g, ' ');
            const [results] = await pool.execute(
                `SELECT DISTINCT 
                    mi.id, mi.name, mi.price, mi.category, mi.restaurant_id,
                    r.name as restaurant_name, r.city_name, r.city_slug,
                    mii.ingredients_name, mii.id as ingredient_id
                 FROM menu_item_ingredients mii
                 JOIN menu_item_ingredients_map miim ON mii.id = miim.ingredient_id
                 JOIN menu_items mi ON miim.menu_item_id = mi.id
                 JOIN restaurants r ON mi.restaurant_id = r.id
                 WHERE LOWER(REPLACE(mii.ingredients_name, ' ', '-')) = LOWER(?)
                    OR LOWER(mii.ingredients_name) LIKE LOWER(?)
                 ORDER BY r.city_name, r.name, mi.name`,
                [slug, `%${ingredientName}%`]
            );
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get menu items using ingredient at specific restaurant
    // GET /api/public/restaurants/:restaurantId/ingredients/:slug
    router.get('/public/restaurants/:restaurantId/ingredients/:slug', async (req, res) => {
        const restaurantId = Number(req.params.restaurantId);
        const { slug } = req.params;
        if (!restaurantId || Number.isNaN(restaurantId)) {
            return res.status(400).json({ error: 'Invalid restaurant id' });
        }
        if (!slug) {
            return res.status(400).json({ error: 'Ingredient slug is required' });
        }
        try {
            const ingredientName = slug.replace(/-/g, ' ');
            const [results] = await pool.execute(
                `SELECT DISTINCT 
                    mi.id, mi.name, mi.price, mi.category,
                    r.name as restaurant_name, r.city_name, r.city_slug,
                    mii.ingredients_name, mii.id as ingredient_id
                 FROM menu_item_ingredients mii
                 JOIN menu_item_ingredients_map miim ON mii.id = miim.ingredient_id
                 JOIN menu_items mi ON miim.menu_item_id = mi.id
                 JOIN restaurants r ON mi.restaurant_id = r.id
                 WHERE mi.restaurant_id = ?
                   AND (LOWER(REPLACE(mii.ingredients_name, ' ', '-')) = LOWER(?)
                    OR LOWER(mii.ingredients_name) LIKE LOWER(?))
                 ORDER BY mi.name`,
                [restaurantId, slug, `%${ingredientName}%`]
            );
            res.json(results);
        } catch (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get restaurants by city and category for SEO / SSR
    // GET /api/public/restaurants-by-city-and-category?city_slug={city}&category={category}
    router.get('/public/restaurants-by-city-and-category', async (req, res) => {
        const { city_slug, category } = req.query;
        if (!city_slug || !category) {
            return res.status(400).json({ error: 'city_slug and category are required' });
        }
        try {
            // The category parameter is the actual category name (e.g., "Pizza")
            // Do exact match (case-insensitive)
            const [results] = await pool.execute(
                `SELECT id, name, address, latitude, longitude, category, city_name, city_slug
                 FROM restaurants
                 WHERE city_slug = ? 
                   AND LOWER(category) = LOWER(?)
                 ORDER BY name`,
                [city_slug, category]
            );
            res.json(results);
        } catch (err) {
            console.error('Error fetching restaurants by city and category:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get all unique categories for SEO / SSR
    // GET /api/public/categories
    router.get('/public/categories', async (req, res) => {
        try {
            const [results] = await pool.execute(
                `SELECT DISTINCT category
                 FROM restaurants
                 WHERE category IS NOT NULL AND category != ''
                 ORDER BY category`
            );
            res.json(results.map(row => row.category));
        } catch (err) {
            console.error('Error fetching categories:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    // PUBLIC: Get categories available in a specific city for SEO / SSR
    // GET /api/public/cities/:city_slug/categories
    router.get('/public/cities/:city_slug/categories', async (req, res) => {
        const { city_slug } = req.params;
        if (!city_slug) {
            return res.status(400).json({ error: 'city_slug is required' });
        }
        try {
            const [results] = await pool.execute(
                `SELECT DISTINCT category
                 FROM restaurants
                 WHERE city_slug = ? 
                   AND category IS NOT NULL AND category != ''
                 ORDER BY category`,
                [city_slug]
            );
            res.json(results.map(row => row.category));
        } catch (err) {
            console.error('Error fetching categories for city:', err);
            res.status(500).json({ error: 'Database query failed' });
        }
    });

    return router;
}

module.exports = restaurantRoutes;

