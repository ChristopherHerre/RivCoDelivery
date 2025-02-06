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

function haversine_dist(lat, lng, lat2, lng2) {
    var R = 3958.8;
    var rlat1 = lat2 * (Math.PI / 180);
    var rlat2 = lat * (Math.PI / 180);
    var difflat = rlat2 - rlat1;
    var difflon = (lng - lng2) * (Math.PI / 180);
    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "build")));

// Serve React's index.html for all other routes (SPA behavior)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
// Set headers to avoid Cross-Origin-Opener-Policy issues
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); // COEP
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');  // COOP
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

// Set up session with MySQLStore
const sessionStore = new MySQLStore({}, pool);

app.use(session({
    secret: process.env.SESSION_SECRET, // Use environment variable for session secret
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Ensure the cookie is sent only over HTTP(S), not client JavaScript
        maxAge: 2 * 60 * 60 * 1000 // 2 hour
    }
}));

// Add logging to session middleware
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    next();
});

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Configure Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Use environment variable for client ID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Use environment variable for client secret
    callbackURL: process.env.GOOGLE_CALLBACK_URL // Use environment variable for callback URL
}, (accessToken, refreshToken, profile, done) => {
    // No need to fetch user's email address here, as it will be done in the token verification route
    done(null, profile);
}));

// Create OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
      try {
        if (!req.session?.user?.sub) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        const [results] = await pool.execute(
          'SELECT role FROM users WHERE id = ? AND active = 1',
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
app.get('/api/health', (req, res) => {
  res.status(200).send('OK'); // Responds with HTTP 200 and a simple message
});
// Route to verify Google token
app.post('/api/google-login', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;
        
        // Check if user exists, if not create them
        const [user] = await pool.execute(
            'INSERT INTO users (id, name, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, email = ?',
            [sub, name, email, name, email]
        );

        req.session.user = { sub, email, name, picture };
        res.json({ sub, email, name, picture });
    } catch (error) {
        console.error('Error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Route to retrieve session information
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
            //displayName: req.user.displayName,
            email: req.user.email // Include the email address in the response
        });
        
    } else {
        console.log("not authenticated");
        res.redirect('/');
    }
});

// Routes
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

// Route to serve the Google Maps API key
app.get('/api/maps-api-key', (req, res) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// Route to fetch all restaurants
app.get('/api/restaurants/:latitude/:longitude', async (req, res) => {
    const { latitude, longitude } = req.params;
    const query = 'SELECT * FROM restaurants LIMIT 50';
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

// Route to fetch menu items for a specific restaurant
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

// Route to search for menu items
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

// Route to fetch menu item ingredients
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

// Route to fetch menu item details
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

// Route to change the 'open' column to value 1
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

// Route to handle dbPost2 method from the client
const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Too many orders, please try again in an hour' }
});
  
app.post('/api/co', orderLimiter, checkRole(1), async (req, res) => {
    const userInputData = req.body[0];
    const cartClone = req.body[1]; 
    // Validate input data
    if (!Array.isArray(userInputData) || userInputData.length !== 12 || !Array.isArray(cartClone)) {
        return res.status(400).json({ error: 'Invalid request format' });
    }
    // Validate numeric values
    const numericFields = ['item_count', 'delivery_fee', 'subtotal', 'distance', 'tax', 'total'];
    const isValidNumeric = userInputData.slice(5).every(val => !isNaN(val) && val >= 0);
    if (!isValidNumeric) {
        return res.status(400).json({ error: 'Invalid numeric values' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Use authenticated user ID from session
        const userId = req.session.user.sub;
        const orderQuery = `
            INSERT INTO orders (
                user_id, address, instructions, business_type, 
                knock_type, item_count, restaurant, restaurant_address, 
                delivery_fee, subtotal, distance, tax, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [orderResult] = await connection.execute(orderQuery, [
            userId, 
            ...userInputData.map(item => item?.toString().slice(0, 255))
        ]);
        const orderId = orderResult.insertId;
        // Validate cart items
        const validCartItems = cartClone.every(item => 
            item && typeof item.name === 'string' && 
            !isNaN(item.price) && !isNaN(item.quantity)
        );
        if (!validCartItems) {
            throw new Error('Invalid cart items');
        }
        const orderItemsQuery = 'INSERT INTO order_items (order_id, name, size, price, quantity, ingredients) VALUES ?';
        const orderItemsValues = cartClone.map(item => [
            orderId,
            item.name?.toString().slice(0, 100),
            item.size?.toString().slice(0, 50),
            parseFloat(item.price),
            parseInt(item.quantity),
            item.ingredients?.toString().slice(0, 1000)
        ]);
        await connection.query(orderItemsQuery, [orderItemsValues]);
        await connection.commit();
        res.status(201).json({ 
            success: true,
            orderId,
            message: 'Order placed successfully'
        });
    } catch (err) {
        await connection.rollback();
        console.error('Order transaction failed:', err);
        res.status(500).json({ 
            error: 'Order processing failed',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal error'
        });
    } finally {
        connection.release();
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
    // Check if user is authenticated via session
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
    // Check if user is authenticated via session

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        const query = 'SELECT * FROM orders WHERE open=1 ORDER BY date DESC LIMIT ? OFFSET ?';
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
    const userId = req.session.user.sub; // Extract user ID from session
    try {
        const query = 'SELECT id, name, email, address FROM users WHERE id = ? LIMIT 1';
        const [results] = await pool.execute(query, [userId]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(results[0]); // Send only the authenticated user's details
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Start the server
app.listen(PORT, IP, () => {
    console.log("Server is running on " + IP + ":" + PORT);
});