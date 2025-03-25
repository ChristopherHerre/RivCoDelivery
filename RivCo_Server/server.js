const fs = require("fs");
const https = require("https");
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');
dotenv.config();
const app = express();
const IP = '0.0.0.0';
const PORT = 8080;
const path = require("path");

/*const { spawn } = require('child_process');

// Start Cloud SQL Proxy
const proxy = spawn('/home/' + process.env.EMAIL + '/cloud_sql_proxy', [
  '-instances=mimetic-surf-124908:us-west2:mysql=tcp:3306'
]);

proxy.stdout.on('data', (data) => {
  console.log(`Cloud SQL Proxy: ${data}`);
});

proxy.stderr.on('data', (data) => {
  console.error(`Cloud SQL Proxy Error: ${data}`);
});

// Ensure Cloud SQL Proxy is stopped when the app exits
process.on('exit', () => {
  proxy.kill();
});*/

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            if (!req.session?.user?.sub) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const [results] = await pool.execute(
                'SELECT role FROM users WHERE id = ?',
                [req.session.user.sub]
            );
            if (!results.length || results[0].role < requiredRole) {
                return res.status(403).json({ message: 'Access denied' });
            }
            next();
        } catch (err) {
            console.error('Role check error:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

function haversine_dist(lat, lng, lat2, lng2) {
    var R = 3958.8;
    var rlat1 = lat2 * (Math.PI / 180);
    var rlat2 = lat * (Math.PI / 180);
    var difflat = rlat2 - rlat1;
    var difflon = (lng - lng2) * (Math.PI / 180);
    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

app.set('trust proxy', 1);
/*
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
*/
// Set headers to avoid Cross-Origin-Opener-Policy issues
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Access-Control-Allow-Origin', 'https://www.rivcodelivery.com'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 60 * 1000
}, pool);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000 
    }
}));

/*app.use((req, res, next) => {
    if (!req.session || !req.session.user) {
        console.warn("Session expired or missing user data.");
        return res.status(401).json({ error: "Session expired, please log in again." });
    }
    next();
});*/

app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL 
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

app.use(express.json());


// Add new ingredient
app.post('/api/menu-item-ingredients', async (req, res) => {
    const connection = await pool.getConnection(); // Get a connection from the pool
    try {
        await connection.beginTransaction(); // Start transaction

        const {
            easy_price, extra_price, inputType, ingredients_name,
            customize, type, price, sort_order, selected, halfable, menu_item_id
        } = req.body;

        // Insert ingredient into the main table
        const query1 = `
            INSERT INTO menu_item_ingredients (
                easy_price, 
                extra_price, 
                inputType, 
                ingredients_name, 
                customize, 
                type, 
                price, 
                sort_order,
                selected,
                halfable
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values1 = [
            easy_price || null,
            extra_price || null,
            inputType || 0,
            ingredients_name,
            customize || 0,
            type,
            price || 0,
            sort_order || 0,
            selected || 0,
            halfable || 0
        ];

        const [result] = await connection.query(query1, values1);
        const ingredient_id = result.insertId; // Get the inserted ingredient's ID

        console.log("Ingredient ID:", ingredient_id);
        console.log("Menu Item ID:", menu_item_id);

        // Insert into mapping table if menu_item_id is provided
        if (menu_item_id) {
            const query2 = `
                INSERT INTO menu_item_ingredients_map (menu_item_id, ingredient_id)
                VALUES (?, ?)
            `;
            await connection.query(query2, [menu_item_id, ingredient_id]);
        }

        await connection.commit(); // Commit transaction
        res.status(201).json({ message: "Ingredient added successfully!" });
    } catch (error) {
        await connection.rollback(); // Rollback transaction on error
        console.error("Error adding ingredient:", error);
        res.status(500).json({ error: "Failed to add ingredient." });
    } finally {
        connection.release(); // Release connection back to the pool
    }
});



app.post('/api/addRestaurant', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const { name, address, latitude, longitude, category } = req.body;
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        const [result] = await pool.execute(
            `INSERT INTO restaurants (name, address, latitude, longitude, category)
             VALUES (?, ?, ?, ?, ?)
            `,
            [name, address, latitude, longitude, category]
        );
        res.status(201).json({ message: "Restaurant added successfully", id: result.insertId });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update menu item
// Update menu item
app.put('/api/update-menu-item/:id', checkRole(2), (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Check if updates are provided
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No update data provided" });
    }

    // Construct the query and values
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];  // Spread operator to combine values

    const sql = `UPDATE menu_items SET ${updateFields} WHERE id = ?`;

    // Log for debugging
    console.log("Executing SQL Query:", sql);
    console.log("With Values:", values);

    pool.query(sql, values, (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ error: "Database error: " + err.message });
        }

        // Check if the update was successful
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Menu item not found" });
        }

        res.json({ message: 'Menu item updated successfully' });
    });
});



app.post('/api/manageRestaurant', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const { name, address, latitude, longitude, category } = req.body;
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: "All fields are required" });
    }
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
                 SET name = ?, address = ?, latitude = ?, longitude = ?, category = ?
                 WHERE id = ?`,
                [name, address, latitude, longitude, category, existingRestaurant.restaurant_id]
            );
            await connection.commit();
            return res.status(200).json({ message: "Restaurant updated successfully" });
        } else {
            const [result] = await connection.execute(
                `INSERT INTO restaurants (name, address, latitude, longitude, category)
                 VALUES (?, ?, ?, ?, ?)`,
                [name, address, latitude, longitude, category]
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

app.post('/api/menu-items', checkRole(2), (req, res) => {
    const { menu_item_id, ingredient_id } = req.body;
    if (!menu_item_id || !ingredient_id) {
      return res.status(400).json({ error: 'Menu item ID and Ingredient ID are required' });
    }
    const insertQuery = `
        INSERT INTO menu_item_ingredients_map (menu_item_id, ingredient_id)
        VALUES (?, ?);
    `;
    pool.query(insertQuery, [menu_item_id, ingredient_id], (err, results) => {
      if (err) {
        console.error('Error inserting new row:', err);
        return res.status(500).json({ error: 'Failed to insert new row' });
      }
      res.status(201).json({ message: 'New row inserted successfully', id: results.insertId });
    });
});

app.get('/api/menu-items-list', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ error: 'Unauthorized: No user session' });
    }
    console.log("sub: " + req.session?.user?.sub);
    try {
        // Define the SQL query with a JOIN to get menu items for the user's restaurant
        const query = `
            SELECT menu_items.*
            FROM menu_items
            JOIN users ON users.restaurant_id = menu_items.restaurant_id
            LEFT JOIN menu_item_ingredients_map ON menu_items.id = menu_item_ingredients_map.menu_item_id
            WHERE users.id = ?
            GROUP BY menu_items.id
            ORDER BY COUNT(menu_item_ingredients_map.ingredient_id) DESC;
        `;
        // Execute the query with the user's Google ID (sub)
        const [results] = await pool.query(query, [req.session.user.sub]);
        if (results.length === 0) {
            // No menu items found, return 403 error
            return res.status(403).json({ error: 'Forbidden: No menu items found for this user\'s restaurant' });
        }
        // Return the results
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.put('/api/users/:id/role', checkRole(2), (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const query = 'UPDATE users SET role = ? WHERE id = ?';
    pool.query(query, [role, id], (err, result) => {
        if (err) {
            console.error('Error updating role:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Role updated successfully' });
    });
});

app.put('/api/users/:id/restaurant', checkRole(2), (req, res) => {
    const { id } = req.params;
    const { restaurant_id } = req.body;
    const query = 'UPDATE users SET restaurant_id = ? WHERE id = ?';

    pool.query(query, [restaurant_id, id], (err, result) => {
        if (err) {
            console.error('Error updating restaurant ID:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Restaurant ID updated successfully' });
    });
});


app.put('/api/menu-ingredients/:id', checkRole(2), (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    console.log(updatedData);

    const query = `
        UPDATE menu_item_ingredients 
        SET easy_price = ?, extra_price = ?, inputType = ?, ingredients_name = ?, 
            customize = ?, type = ?, price = ?, sort_order = ?, selected = ?, halfable = ? 
        WHERE id = ?
    `;
    const values = [
        updatedData.easy_price,
        updatedData.extra_price,
        updatedData.inputType,
        updatedData.ingredients_name,
        updatedData.customize,
        updatedData.type,
        updatedData.price,
        updatedData.sort_order,
        updatedData.selected,
        updatedData.halfable,
        id
    ];

    pool.query(query, values, (err, results) => {
        if (err) {
            console.error('Error updating ingredient:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Ingredient updated successfully' });
    });
});


app.get('/api/menu-ingredients/:menuItem', checkRole(2), async (req, res) => {
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

app.get('/api/menu-items', checkRole(2), async (req, res) => {
    const query = `
        SELECT     
            mi.id AS menu_item_id,     
            mi.name AS menu_item_name, 
            miim.ingredient_id AS iid, 
            mii.ingredients_name
        FROM menu_item_ingredients_map miim
        JOIN menu_items mi ON miim.menu_item_id = mi.id
        ORDER BY mi.sort ASC;
    `;
    try {
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Database query failed' });
    }
});

app.get('/api/getUserRestaurant', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const [[restaurant]] = await pool.execute(
            `SELECT r.* FROM restaurants r 
             JOIN users u ON u.restaurant_id = r.id 
             WHERE u.id = ?`, 
            [req.session.user.sub]
        );
        res.json({ restaurant: restaurant || null });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/api/google-login', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;
        const [userResults] = await pool.execute(
            'SELECT * FROM users WHERE id = ? LIMIT 1',
            [sub]
        );
	    const role = 0;
        if (userResults.length === 0) {
            await pool.execute(
                'INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)',
                [sub, name, email, role]
            );
        } else {
            // If the user exists, you can optionally update their details here
            //await pool.execute(
              //  'UPDATE users SET name = ?, email = ?  WHERE id = ?',
               // [name, email, picture, sub]
            //);
        }
        await pool.execute('DELETE FROM sessions WHERE JSON_EXTRACT(data, "$.user.sub") = ?', [sub]);
        req.session.user = { sub, email, name, picture };
        req.session.save(err => {
            if (err) console.error("Session save error:", err);
            else console.log("Session saved successfully:", req.session);
        });

        res.json({ sub, email, name, picture });
    } catch (error) {
        console.error('Error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
/*app.post('/api/google-login', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // 🛑 DELETE OLD SESSIONS FOR THIS USER
        await pool.execute('DELETE FROM sessions WHERE JSON_EXTRACT(data, "$.user.sub") = ?', [sub]);

        // ✅ Save the new session
        req.session.user = { sub, email, name, picture };
        req.session.save(err => {
            if (err) console.error("Session save error:", err);
            else console.log("Session saved successfully:", req.session);
        });

        res.json({ sub, email, name, picture });
    } catch (error) {
        console.error('Error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});
*/
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/session', (req, res) => {
    console.log('Retrieving session...');
    console.log('Session in /api/session:', req.session);
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.get('/api/profile', (req, res) => {
    console.log("reached " + req.isAuthenticated());
    console.log('Session in /api/profile:', req.session);
    if (req.isAuthenticated()) {
        res.json({
            email: req.user.email
        });
    } else {
        console.log("not authenticated");
        res.redirect('/');
    }
});

app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/', scope: ['profile', 'email'] }),
    (req, res) => {
        res.redirect('/api/profile');
    }
);

app.get('/api/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Session destruction failed' });
            }
            res.status(200).json({ message: 'Logged out successfully' });
        });
    });
});

app.get('/api/maps-api-key', (req, res) => {
    console.log("API Key Request Received");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log("Google Maps API Key:", apiKey); 
    if (!apiKey || apiKey == undefined || apiKey === undefined) {
        return res.status(500).json({ error: "API key not found" });
    }
    res.json({ apiKey });
});

app.get('/api/restaurants/:latitude/:longitude', async (req, res) => {
    const { latitude, longitude } = req.params;
    const query = `
    SELECT * FROM restaurants 
    WHERE address IS NOT NULL 
    AND longitude IS NOT NULL 
    AND latitude IS NOT NULL
    LIMIT 50`;
    try {
        console.log("sub: " + !req.session?.user?.sub)
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

app.get('/api/restaurants2/:restaurantId/menu', async (req, res) => {
    const { restaurantId } = req.params;
    console.log("restaurantId: ", restaurantId);
    if (!restaurantId) {
        return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    const query = 'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort LIMIT 50';
    try {
        const [results] = await pool.execute(query, [restaurantId]);
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.get('/api/menu/item/search', async (req, res) => {
    const menuItemName = req.query.menuItemName;
    console.log(menuItemName);
    const query = 'SELECT * FROM menu_items WHERE name LIKE ? LIMIT 50';
    const queryParam = `%${menuItemName}%`;
    try {
        const [results] = await pool.execute(query, [queryParam]);
        console.log(results);
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.get('/api/menu/item/ingredients', async (req, res) => {
    const { menuItem } = req.query;
    if (!menuItem) {
        return res.status(400).json({ error: 'Menu item ID is required' });
    }
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

app.get('/api/order_items', async (req, res) => {
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

app.get('/api/restaurants/:restaurant', async (req, res) => {
    const { restaurant } = req.params;
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

app.get('/api/menu/item', async (req, res) => {
    const { menuItem } = req.query;
    if (!menuItem) {
        return res.status(400).json({ error: 'Menu item ID is required' });
    }
    const query = 'SELECT * FROM menu_items WHERE id = ? LIMIT 1';
    try {
        const [results] = await pool.execute(query, [menuItem]);
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.post('/api/changeOrderOpen', checkRole(1), async (req, res) => {
    const iid  = req.body[0];
    console.log("id: "+iid);
    if (!iid) {
        return res.status(400).json({ error: 'Order ID is required' });
    }
    const query = 'UPDATE orders SET open = 1 WHERE id = ? LIMIT 1';
    try {
        await pool.execute(query, [iid]);
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Too many orders, please try again in an hour' }
});
  
app.post('/api/co', async (req, res) => {
    console.log("Placing order...");
    console.log(req.body);
    const userInputData = req.body[0];
    const cartClone = req.body[1];
    const googleId = req.headers.authorization 
        ? req.headers.authorization.split(' ')[1] : null;
    console.log('userInputData:', userInputData);
    if (!Array.isArray(userInputData) || userInputData.length !== 12) {
        console.error('Invalid userInputData:', userInputData);
        return res.status(400).json({ error: 'Invalid user input data' });
    }
    if (!googleId) {
        console.error('Google ID not provided');
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        console.log("googleId: " + googleId);
        const orderQuery = 'INSERT INTO orders (user_id, address, instructions, business_type, knock_type, item_count, restaurant, restaurant_address, delivery_fee, subtotal, distance, tax, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [orderResult] = await connection.execute(orderQuery, [googleId, ...userInputData]);
        const orderId = orderResult.insertId;
        const orderItemsQuery = 'INSERT INTO order_items (order_id, name, size, price, quantity, ingredients) VALUES ?';
        const orderItemsValues = cartClone.map(item => [orderId, ...item]);
        await connection.query(orderItemsQuery, [orderItemsValues]);
        await connection.commit();
        console.log("Order placed successfully");
        res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        await connection.rollback();
        console.error('Error executing transaction:', err);
        res.status(500).json({ error: 'Transaction failed' });
    } finally {
        connection.release();
    }
});

app.put('/api/user/address', async (req, res) => {
    if (!req.session.user?.sub) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = req.session.user.sub;
    try {
        await pool.execute(
            'UPDATE users SET address_street_number = NULL, address_street = NULL, address_city = NULL, address_state = NULL, address_zip = NULL, address_latitude = NULL, address_longitude = NULL WHERE id = ?',
            [userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ error: 'Failed to update address' });
    }
});

app.get('/api/users', checkRole(2), async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    try {
        const query = 'SELECT * FROM users ORDER BY name ASC LIMIT ? OFFSET ?';
        const [results] = await pool.execute(query, [
            limit.toString(), 
            offset.toString()
        ]);
        res.json(results);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/user/address', async (req, res) => {
    if (!req.session.user?.sub) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const [results] = await pool.execute(
            'SELECT address_street_number, address_street, address_city, address_state, address_zip, address_latitude, address_longitude FROM users WHERE id = ?',
            [req.session.user.sub]
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

app.post('/api/user/address', async (req, res) => {
    if (!req.session.user?.sub) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const { address, latitude, longitude } = req.body;
    const userId = req.session.user.sub;
    try {
        await pool.execute(
            'UPDATE users SET address_street_number = ?, address_street = ?, address_city = ?, address_state = ?, address_zip = ?, address_latitude = ?, address_longitude = ? WHERE id = ?',
            [address.streetNumber, address.street, address.city, address.state, address.zip, latitude, longitude, userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ error: 'Failed to update address' });
    }
});

app.get('/api/user/orders', async (req, res) => {
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

app.get('/api/orders', checkRole(1), async (req, res) => {
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

app.get('/api/user/full-address', async (req, res) => {
    if (!req.session.user?.sub) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const [results] = await pool.execute(
            'SELECT address_street_number, address_street, address_city, address_state, address_zip FROM users WHERE id = ?',
            [req.session.user.sub]
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

app.get('/api/user/details', async (req, res) => {
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
/*
const options = {
  key: fs.readFileSync("server-key.pem"), // Your server's private key
  cert: fs.readFileSync("server-cert.pem"), // Your server's certificate
  ca: fs.readFileSync("cloudflare-ca.pem"), // Cloudflare's CA certificate
//  requestCert: true, // Require client certificate
  rejectUnauthorized: true, // Reject requests without valid certificate
};
https.createServer(options, app).listen(8080, () => {
  console.log("Secure Node.js API running on port 443");
});
*/
// Start the server
app.listen(PORT, IP, () => {
    console.log("Server is running on " + IP + ":" + PORT);
});
