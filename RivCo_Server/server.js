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
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
dotenv.config();
const app = express();
const IP = '0.0.0.0';
const PORT = 8080;
const path = require("path");
const { z } = require('zod');

// Import middleware and utilities
const { checkRole: createCheckRole } = require('./middleware/auth');
const { haversine_dist, TAX_RATE, BASE_DELIVERY_FEE, MIN_BILLABLE_DISTANCE_MILES, 
        toCents, centsToFixed, safeJsonParse, isSelectedIngredient, 
        formatIngredientSummary, buildUserAddress } = require('./utils/helpers');
const { ingredientBodySchema, addRestaurantSchema, updateMenuItemSchema, 
        addMenuItemSchema, changeOrderOpenSchema, restaurantParamSchema, 
        userAddressSchema, cartItemSchema, restaurantSchema } = require('./utils/schemas');

app.set('trust proxy', 1);
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Access-Control-Allow-Origin', 'https://rivcodelivery.com', 'https://www.rivcodelivery.com'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header("Access-Control-Allow-Credentials", "true");

    // New security headers
  /*res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted.cdn.com");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer');*/

    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ['https://rivcodelivery.com', 'https://www.rivcodelivery.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
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

// Initialize checkRole middleware with pool
const checkRole = createCheckRole(pool);

app.use(cookieParser());

const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 60 * 1000
}, pool);

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    }
  }));
  
  // CSRF protection
  /*app.use(csrf({
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'none'
    }
  }));
  // Expose CSRF token to clients via a cookie
  app.use((req, res, next) => {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    next();
  });
  */
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
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

app.use(express.json());
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const orderLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 1,
    message: { error: 'Too many orders, please try again in 3 minutes' }
});

// Register modular routes
const registerRoutes = require('./routes/index');
registerRoutes(app, pool, checkRole, orderLimiter, client, passport);

// ============================================================================
// ROUTES - These will be moved to separate route files
// ============================================================================

app.delete('/api/menu-item-ingredients/:ingredient_id', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    const paramSchema = z.object({
        ingredient_id: z.coerce.number().int().positive("ingredient_id must be a positive integer"),
    });
    const parseResult = paramSchema.safeParse(req.params);
    if (!parseResult.success) {
        return res.status(400).json({ 
            error: "Validation failed",
            details: parseResult.error.flatten().fieldErrors 
        });
    }
    const { ingredient_id } = parseResult.data;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // ✅ SECURITY: Verify user has restaurant
        const [[user]] = await connection.execute(
            'SELECT restaurant_id FROM users WHERE id = ?',
            [req.session.user.sub]
        );
        if (!user?.restaurant_id) {
            await connection.rollback();
            return res.status(403).json({ error: "User has no associated restaurant" });
        }
        // ✅ SECURITY: Verify ingredient exists and is linked to menu items from user's restaurant
        const [[ingredientCheck]] = await connection.execute(
            `SELECT mii.id 
             FROM menu_item_ingredients mii
             JOIN menu_item_ingredients_map miim ON mii.id = miim.ingredient_id
             JOIN menu_items mi ON miim.menu_item_id = mi.id
             WHERE mii.id = ? AND mi.restaurant_id = ?
             LIMIT 1`,
            [ingredient_id, user.restaurant_id]
        );
        if (!ingredientCheck) {
            await connection.rollback();
            return res.status(403).json({ error: "Access denied: Ingredient does not belong to your restaurant" });
        }
        // ✅ SECURITY: Delete mappings only for menu items from user's restaurant
        const query1 = `
            DELETE miim FROM menu_item_ingredients_map miim
            INNER JOIN menu_items mi ON miim.menu_item_id = mi.id
            WHERE miim.ingredient_id = ? AND mi.restaurant_id = ?
        `;
        await connection.execute(query1, [ingredient_id, user.restaurant_id]);
        // ✅ SECURITY: Delete ingredient only if it's not linked to any menu items from other restaurants
        const query2 = `
            DELETE FROM menu_item_ingredients 
            WHERE id = ? 
            AND NOT EXISTS (
                SELECT 1 
                FROM menu_item_ingredients_map miim
                JOIN menu_items mi ON miim.menu_item_id = mi.id
                WHERE miim.ingredient_id = menu_item_ingredients.id 
                AND mi.restaurant_id != ?
            )
        `;
        const [result] = await connection.execute(query2, [ingredient_id, user.restaurant_id]);     
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Ingredient not found or access denied" });
        }
        await connection.commit();
        res.status(200).json({ message: "Ingredient deleted successfully!" });
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting ingredient:", error);
        res.status(500).json({ error: "Failed to delete ingredient." });
    } finally {
        connection.release();
    }
});

app.delete('/api/menu-items/:id', checkRole(2), async (req, res) => {
    const paramSchema = z.object({
        id: z.coerce.number().int("id must be an integer"),
    });
    const parseResult = paramSchema.safeParse(req.params);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(', ') });
    }
    const { id } = parseResult.data;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const deleteMappings = `DELETE FROM menu_item_ingredients_map WHERE menu_item_id = ?`;
        await connection.query(deleteMappings, [id]);
        const deleteItem = `DELETE FROM menu_items WHERE id = ?`;
        const [result] = await connection.query(deleteItem, [id]);
        if (result.affectedRows === 0) {
            throw new Error("Menu item not found");
        }
        await connection.commit();
        res.status(200).json({ message: "Menu item deleted successfully!" });
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting menu item:", error);
        res.status(500).json({ error: "Failed to delete menu item." });
    } finally {
        connection.release();
    }
});

const bodySchema = z.object({
    easy_price: z.coerce.number().optional().nullable(),
    extra_price: z.coerce.number().optional().nullable(),
    inputType: z.coerce.number().int().optional().default(0),
    ingredients_name: z.string()
        .min(1, "ingredients_name is required")
        .max(100, "ingredients_name must be less than 100 characters")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "ingredients_name can only contain letters, numbers, spaces, hyphens, and underscores")
        .transform(str => str.trim())
        .refine(
            name => !name.includes('  '), 
            "ingredients_name cannot contain multiple consecutive spaces"
        ),
    customize: z.coerce.number().int().optional().default(0),
    type: z.string()
        .min(1, "type is required")
        .max(50, "type must be less than 50 characters")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "type can only contain letters, numbers, spaces, hyphens, and underscores")
        .transform(str => str.trim()),
    price: z.coerce.number().optional().default(0),
    sort_order: z.coerce.number().int().optional().default(0),
    selected: z.coerce.number().int().optional().default(0),
    halfable: z.coerce.number().int().optional().default(0),
    menu_item_id: z.coerce.number().int().optional().nullable(),
});

app.post('/api/menu-item-ingredients', checkRole(2), async (req, res) => {
    const parseResult = bodySchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: parseResult.error.flatten().fieldErrors,
        });
    }
    const {
        easy_price, extra_price, inputType, ingredients_name,
        customize, type, price, sort_order, selected, halfable, menu_item_id
    } = parseResult.data;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
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
        ];
        const [result] = await connection.execute(query1, values1);
        const ingredient_id = result.insertId;
        if (menu_item_id) {
            const query2 = `
                INSERT INTO menu_item_ingredients_map (menu_item_id, ingredient_id)
                VALUES (?, ?)
            `;
            await connection.execute(query2, [menu_item_id, ingredient_id]);
        }
        await connection.commit();
        res.status(201).json({ 
            message: "Ingredient added successfully!!!",
            ingredient: {
                id: ingredient_id,
                easy_price,
                extra_price,
                inputType,
                ingredients_name,
                customize,
                type,
                price,
                sort_order,
                selected,
                halfable,
                menu_item_id: menu_item_id || null
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error("Error adding ingredient:", error);
        res.status(500).json({ error: "Failed to add ingredient." });
    } finally {
        connection.release();
    }
});

// update menu item's ingredient
app.put('/api/menu-ingredients/:id', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    // ✅ Validate URL parameter
    const paramSchema = z.object({
        id: z.coerce.number().int().positive("id must be a positive integer"),
    });
    const paramParseResult = paramSchema.safeParse(req.params);
    if (!paramParseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: paramParseResult.error.flatten().fieldErrors,
        });
    }
    const { id } = paramParseResult.data;
    // ✅ Validate request body
    const parseResult = bodySchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: parseResult.error.flatten().fieldErrors,
        });
    }
    const updatedData = parseResult.data; // ✅ use validated data only
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // ✅ SECURITY: Verify user has restaurant
        const [[user]] = await connection.execute(
            'SELECT restaurant_id FROM users WHERE id = ?',
            [req.session.user.sub]
        );
        if (!user?.restaurant_id) {
            await connection.rollback();
            return res.status(403).json({ error: "User has no associated restaurant" });
        }
        // ✅ SECURITY: Verify ingredient exists and is linked to menu items from user's restaurant
        const [[ingredientCheck]] = await connection.execute(
            `SELECT mii.id 
             FROM menu_item_ingredients mii
             JOIN menu_item_ingredients_map miim ON mii.id = miim.ingredient_id
             JOIN menu_items mi ON miim.menu_item_id = mi.id
             WHERE mii.id = ? AND mi.restaurant_id = ?
             LIMIT 1`,
            [id, user.restaurant_id]
        );
        if (!ingredientCheck) {
            await connection.rollback();
            return res.status(403).json({ error: "Access denied: Ingredient does not belong to your restaurant" });
        }
        // ✅ SECURITY: Update with restaurant verification in subquery for defense in depth
        const query = `
            UPDATE menu_item_ingredients 
            SET easy_price = ?, extra_price = ?, inputType = ?, ingredients_name = ?, 
                customize = ?, type = ?, price = ?, sort_order = ?, selected = ?, halfable = ? 
            WHERE id = ? AND EXISTS (
                SELECT 1 
                FROM menu_item_ingredients_map miim
                JOIN menu_items mi ON miim.menu_item_id = mi.id
                WHERE miim.ingredient_id = menu_item_ingredients.id 
                AND mi.restaurant_id = ?
            )
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
            id,
            user.restaurant_id
        ];
        const [result] = await connection.execute(query, values);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Ingredient not found or access denied" });
        }
        await connection.commit();
        return res.status(200).json({ message: 'Ingredient updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('Error updating ingredient:', err);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();
    }
});

app.post('/api/addRestaurant', checkRole(2), async (req, res) => {
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

app.post('/api/manageRestaurant', checkRole(2), async (req, res) => {
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

app.post('/api/update-menu-item/:id', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    console.log("---- /api/update-menu-item/:id called ----");
    console.log("Received params:", req.params);
    console.log("Received body:", req.body);
    // ✅ Validate URL parameter
    const paramSchema = z.object({
        id: z.coerce.number().int().positive("id must be a positive integer"),
    });
    const paramParseResult = paramSchema.safeParse(req.params);
    if (!paramParseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: paramParseResult.error.flatten().fieldErrors,
        });
    }
    const { id } = paramParseResult.data;
    // ✅ Validate input body using Zod
    const parseResult = updateMenuItemSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.flatten().fieldErrors,
        });
    }
    const updates = parseResult.data; // ✅ Safe, validated data
    console.log("Validated updates:", updates);
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No update data provided" });
    }
    // ✅ Only allow certain fields to be updated (removed "id" and "restaurant_id" for security)
    const allowedFields = [
        "name", "price", "size1",
        "size2", "size3", "size4", "price2", "price3", "price4",
        "category", "sort"
    ];
    const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );
    if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // ✅ SECURITY: Verify menu item belongs to user's restaurant
        const [[user]] = await connection.execute(
            'SELECT restaurant_id FROM users WHERE id = ?',
            [req.session.user.sub]
        );
        if (!user?.restaurant_id) {
            await connection.rollback();
            return res.status(403).json({ error: "User has no associated restaurant" });
        }
        // ✅ SECURITY: Verify menu item exists and belongs to user's restaurant
        const [[menuItem]] = await connection.execute(
            'SELECT id, restaurant_id FROM menu_items WHERE id = ?',
            [id]
        );
        if (!menuItem) {
            await connection.rollback();
            return res.status(404).json({ error: "Menu item not found" });
        }
        if (menuItem.restaurant_id !== user.restaurant_id) {
            await connection.rollback();
            return res.status(403).json({ error: "Access denied: Menu item does not belong to your restaurant" });
        }
        // Build the query dynamically but safely
        const updateFields = Object.keys(filteredUpdates)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(filteredUpdates), id];
        const sql = `UPDATE menu_items SET ${updateFields} WHERE id = ? AND restaurant_id = ?`;
        // ✅ SECURITY: Add restaurant_id to WHERE clause to prevent authorization bypass
        const [result] = await connection.execute(sql, [...values, user.restaurant_id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Menu item not found or access denied" });
        }
        await connection.commit();
        return res.json({ message: 'Menu item updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error("SQL Error:", err);
        return res.status(500).json({ error: "Database error: " + err.message });
    } finally {
        connection.release();
    }
});

app.post('/api/menu-items', checkRole(2), async (req, res) => {
    const { menu_item_id, ingredient_id } = req.body;
    if (!menu_item_id || !ingredient_id) {
        return res.status(400).json({ error: 'Menu item ID and Ingredient ID are required' });
    }
    const menuItemId = Number(menu_item_id);
    const ingredientId = Number(ingredient_id);
    if (!Number.isInteger(menuItemId) || menuItemId <= 0 || !Number.isInteger(ingredientId) || ingredientId <= 0) {
        return res.status(400).json({ error: 'Menu item ID and Ingredient ID must be positive integers' });
    }

    const connection = await pool.getConnection();
    try {
        const [[user]] = await connection.execute(
            'SELECT restaurant_id FROM users WHERE id = ? LIMIT 1',
            [req.session.user.sub]
        );
        if (!user?.restaurant_id) {
            return res.status(403).json({ error: 'User has no associated restaurant' });
        }

        const [[menuItem]] = await connection.execute(
            'SELECT id, restaurant_id FROM menu_items WHERE id = ? LIMIT 1',
            [menuItemId]
        );
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        if (menuItem.restaurant_id !== user.restaurant_id) {
            return res.status(403).json({ error: 'Cannot modify menu items belonging to another restaurant' });
        }

        const [[ingredientExists]] = await connection.execute(
            'SELECT id FROM menu_item_ingredients WHERE id = ? LIMIT 1',
            [ingredientId]
        );
        if (!ingredientExists) {
            return res.status(404).json({ error: 'Ingredient not found' });
        }

        const [[conflict]] = await connection.execute(
            `SELECT 1
             FROM menu_item_ingredients_map miim
             JOIN menu_items mi ON miim.menu_item_id = mi.id
             WHERE miim.ingredient_id = ? AND mi.restaurant_id <> ?
             LIMIT 1`,
            [ingredientId, user.restaurant_id]
        );
        if (conflict) {
            return res.status(403).json({ error: 'Ingredient already linked to another restaurant' });
        }

        await connection.execute(
            `INSERT INTO menu_item_ingredients_map (menu_item_id, ingredient_id)
             VALUES (?, ?)`,
            [menuItemId, ingredientId]
        );

        res.status(201).json({ message: 'Ingredient linked to menu item successfully' });
    } catch (err) {
        console.error('Error inserting new row:', err);
        res.status(500).json({ error: 'Failed to link ingredient to menu item' });
    } finally {
        connection.release();
    }
});

app.post('/api/add-menu-item', checkRole(2), async (req, res) => {
  if (!req.session?.user?.sub) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  // ✅ Validate request body
  const parseResult = addMenuItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.flatten().fieldErrors,
    });
  }
  const {
    name, category, price,
    size1, size2, size3, size4,
    price2, price3, price4, sort
  } = parseResult.data;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[user]] = await connection.execute(
      'SELECT restaurant_id FROM users WHERE id = ?',
      [req.session.user.sub]
    );
    if (!user?.restaurant_id) {
      throw new Error("User has no associated restaurant");
    }
    const [result] = await connection.execute(
      `INSERT INTO menu_items 
        (restaurant_id, name, price, size1, size2, size3, size4,
         price2, price3, price4, category, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.restaurant_id,
        name,
        price,
        size1 || null,
        size2 || null,
        size3 || null,
        size4 || null,
        price2 ?? null,
        price3 ?? null,
        price4 ?? null,
        category,
        sort
      ]
    );
    await connection.commit();
    res.status(201).json({
      message: "Menu item added successfully",
      id: result.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Database error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  } finally {
    connection.release();
  }
});

app.put('/api/users/:id/role', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    // Validate URL parameter
    const paramSchema = z.object({
        id: z.string().min(1, "User ID is required"),
    });
    const paramParseResult = paramSchema.safeParse(req.params);
    if (!paramParseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: paramParseResult.error.flatten().fieldErrors,
        });
    }
    const { id } = paramParseResult.data;
    console.log("id: " + id);
    // Validate request body - role must be 0, 1, or 2
    const bodySchema = z.object({
        role: z.coerce.number().int().min(0).max(2, "Role must be 0 (Basic), 1 (Driver), or 2 (Restaurant/Admin)"),
    });
    const bodyParseResult = bodySchema.safeParse(req.body);
    if (!bodyParseResult.success) {
        return res.status(400).json({
            error: "Validation failed",
            details: bodyParseResult.error.flatten().fieldErrors,
        });
    }
    const { role } = bodyParseResult.data;
    console.log("role: " + role);
    // Prevent users from changing their own role
    if (id === req.session.user.sub) {
        return res.status(403).json({ error: 'Cannot change your own role' });
    }
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        const [[actingUser]] = await connection.execute(
            'SELECT role FROM users WHERE id = ? LIMIT 1',
            [req.session.user.sub]
        );
        if (!actingUser) {
            return res.status(403).json({ error: 'Current user not found' });
        }
        if (actingUser.role !== 2) {
            return res.status(403).json({ error: 'Only admins can change roles' });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        // Verify target user exists and get current role
        const [[targetUser]] = await connection.execute(
            'SELECT id, role FROM users WHERE id = ? LIMIT 1',
            [id]
        );
        if (!targetUser) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }
        // Prevent lowering role of other admins (role 2)
        if (targetUser.role === 2 && role < 2) {
            await connection.rollback();
            return res.status(403).json({ error: 'Cannot lower role of admin users' });
        }
        // Update role
        const [result] = await connection.execute(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, id]
        );

        let updatedRole = role;
        if (result.affectedRows === 0) {
            const [[refetched]] = await connection.execute(
                'SELECT role FROM users WHERE id = ? LIMIT 1',
                [id]
            );
            if (!refetched) {
                await connection.rollback();
                return res.status(404).json({ error: 'User not found or update failed' });
            }
            updatedRole = refetched.role;
        }

        await connection.commit();
        // Log role change for audit trail (server-side only)
        console.log(`Role updated: User ${req.session.user.sub} changed user ${id} role from ${targetUser.role} to ${updatedRole}`);
        res.json({ message: 'Role updated successfully', role: updatedRole });
    } catch (err) {
        if (transactionStarted) {
            await connection.rollback();
        }
        console.error('Error updating role:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

app.put('/api/users/:id/restaurant', checkRole(2), async (req, res) => {
    const { id } = req.params;
    const { restaurant_id } = req.body;
    const query = 'UPDATE users SET restaurant_id = ? WHERE id = ?';
    try {
        const [result] = await pool.execute(query, [restaurant_id, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'Restaurant ID updated successfully' });
    } catch (err) {
        console.error('Error updating restaurant ID:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/users/:id/selected_restaurant', checkRole(0), async (req, res) => {
    const paramsSchema = z.object({
        id: z.coerce.number().int().positive("User ID must be a positive number"),
      });
      const bodySchema = z.object({
        restaurant_id: z.coerce
          .number()
          .int()
          .positive("restaurant_id must be a positive number"),
    });
    try {
        // Validate params and body
        const { id } = paramsSchema.parse(req.params);
        const { restaurant_id } = bodySchema.parse(req.body);
        const query = "UPDATE users SET selected_restaurant = ? WHERE id = ?";
        const [result] = await pool.execute(query, [restaurant_id, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "Restaurant ID updated successfully" });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: err.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          });
        }
        console.error("Error updating restaurant ID:", err);
        res.status(500).json({ message: "Server error" });
      }
});

app.post('/api/cart', checkRole(0), async (req, res) => {
    const cartItems = req.body.cart;
    const userId = req.session?.user?.sub;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    if (!cartItems || !Array.isArray(cartItems)) {
        return res.status(400).json({ error: 'Cart must be an array' });
    }
    if (!cartItems.length) {
        return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        const sanitizedItems = [];
        let restaurantId = null;

        for (const rawItem of cartItems) {
            if (!rawItem || typeof rawItem !== 'object') {
                throw new Error('Each cart item must be an object');
            }

            const name = typeof rawItem.name === 'string' ? rawItem.name.trim() : '';
            if (!name) {
                throw new Error('Cart item name is required');
            }

            const priceNumber = Number(rawItem.price);
            if (!Number.isFinite(priceNumber) || priceNumber < 0 || priceNumber > 9999999.99) {
                throw new Error(`Invalid price value: ${rawItem.price}`);
            }

            const quantity = Number.isInteger(rawItem.quantity) ? rawItem.quantity : parseInt(rawItem.quantity, 10);
            if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100) {
                throw new Error(`Invalid quantity for cart item "${name}"`);
            }

            const itemRestaurantId = Number(rawItem.restaurant_id);
            if (!Number.isInteger(itemRestaurantId) || itemRestaurantId <= 0) {
                throw new Error(`Cart item "${name}" is missing a valid restaurant_id`);
            }

            if (restaurantId === null) {
                restaurantId = itemRestaurantId;
            } else if (restaurantId !== itemRestaurantId) {
                throw new Error('All cart items must belong to the same restaurant');
            }

            const [[menuItemRow]] = await connection.execute(
                `SELECT id 
                 FROM menu_items 
                 WHERE restaurant_id = ? AND name = ? 
                 LIMIT 1`,
                [itemRestaurantId, name]
            );
            if (!menuItemRow) {
                throw new Error(`Menu item "${name}" is not available for this restaurant`);
            }

            const ingredients = Array.isArray(rawItem.ingredients) ? rawItem.ingredients : [];
            const halfer = Array.isArray(rawItem.halfer) ? rawItem.halfer : [];
            const arrs = Array.isArray(rawItem.arrs) ? rawItem.arrs : [];

            sanitizedItems.push({
                name,
                price: priceNumber.toFixed(2),
                quantity,
                ingredients,
                halfer,
                arrs,
                size1: typeof rawItem.size1 === 'string' ? rawItem.size1.trim().slice(0, 255) : null,
                val1: Number.isInteger(rawItem.val1) ? rawItem.val1 : parseInt(rawItem.val1, 10) || 0,
                size2: typeof rawItem.size2 === 'string' ? rawItem.size2.trim().slice(0, 255) : null,
                val2: Number.isInteger(rawItem.val2) ? rawItem.val2 : parseInt(rawItem.val2, 10) || 0,
                size3: typeof rawItem.size3 === 'string' ? rawItem.size3.trim().slice(0, 255) : null,
                val3: Number.isInteger(rawItem.val3) ? rawItem.val3 : parseInt(rawItem.val3, 10) || 0,
                size4: typeof rawItem.size4 === 'string' ? rawItem.size4.trim().slice(0, 255) : null,
                val4: Number.isInteger(rawItem.val4) ? rawItem.val4 : parseInt(rawItem.val4, 10) || 0,
                restaurant_id: itemRestaurantId,
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        // First clear existing cart items
        await connection.execute(
            'DELETE FROM cart WHERE user_id = ?',
            [userId]
        );
        for (const item of sanitizedItems) {
            await connection.execute(
                `INSERT INTO cart (
                    name, price, quantity, ingredients, user_id, 
                    size1, val1, size2, val2, size3, val3, size4, val4, 
                    halfer, arrs, restaurant_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.name,
                    item.price,
                    item.quantity,
                    JSON.stringify(item.ingredients),
                    userId,
                    item.size1,
                    item.val1,
                    item.size2,
                    item.val2,
                    item.size3,
                    item.val3,
                    item.size4,
                    item.val4,
                    JSON.stringify(item.halfer),
                    JSON.stringify(item.arrs),
                    item.restaurant_id
                ]
            );
        }
        await connection.commit();
        res.status(200).json({ message: 'Cart saved successfully' });
    } catch (err) {
        if (transactionStarted) {
            await connection.rollback();
        }
        console.error('Error saving cart:', err);
        res.status(500).json({ error: err.message || 'Failed to save cart' });
    } finally {
        connection.release();
    }
});

app.delete('/api/cart', checkRole(0), async (req, res) => {
    const userId = req.session?.user?.sub;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(
            'DELETE FROM cart WHERE user_id = ?',
            [userId]
        );
        res.json({ message: 'Cart cleared', removed: result.affectedRows });
    } catch (err) {
        console.error('Error clearing cart:', err);
        res.status(500).json({ error: err.message || 'Failed to clear cart' });
    } finally {
        connection.release();
    }
});

app.post('/api/user/address', checkRole(0), async (req, res) => {
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

app.post('/api/changeOrderOpen', checkRole(1), async (req, res) => {
  try {
    // ✅ Validate and parse request body
    const { orderId } = changeOrderOpenSchema.parse(req.body);
    const query = 'UPDATE orders SET open = 1 WHERE id = ? LIMIT 1';
    const [result] = await pool.execute(query, [orderId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (err) {
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
    }
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Database query failed' });
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
            'SELECT * FROM users WHERE id = ? LIMIT 1', [sub]
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

// Helper functions are imported from utils/helpers.js above

app.post('/api/co', checkRole(0), orderLimiter, async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const googleId = req.session.user.sub;
    const payloadArray = Array.isArray(req.body) ? req.body : [];
    const userInputData = payloadArray[0];

    if (!Array.isArray(userInputData) || userInputData.length < 4) {
        console.error('Invalid checkout payload received for user:', googleId, userInputData);
        return res.status(400).json({ error: 'Invalid checkout payload' });
    }

    const [
        clientAddress, // ignored in favor of server-built address
        instructionsRaw = "",
        businessTypeRaw = "",
        knockTypeRaw = "",
    ] = userInputData;

    const instructions = typeof instructionsRaw === "string" ? instructionsRaw : "";
    const businessType = typeof businessTypeRaw === "string" ? businessTypeRaw : "";
    const knockType = typeof knockTypeRaw === "string" ? knockTypeRaw : "";

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [cartRows] = await connection.query('SELECT * FROM cart WHERE user_id = ?', [googleId]);
        if (!cartRows.length) {
            await connection.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const menuItemCache = new Map();
        const ingredientCache = new Map();

        const cartItems = cartRows.map((row) => ({
            ...row,
            ingredients: safeJsonParse(row.ingredients, []),
            halfer: safeJsonParse(row.halfer, []),
            arrs: safeJsonParse(row.arrs, []),
        }));

        let restaurantId = null;
        const orderItemsPrepared = [];
        let subtotalCents = 0;
        let totalQuantity = 0;

        const getMenuItemById = async (menuItemId) => {
            if (!menuItemCache.has(menuItemId)) {
                const [menuRows] = await connection.query(
                    `SELECT id, restaurant_id, name, price, price2, price3, price4, size1, size2, size3, size4 
                     FROM menu_items 
                     WHERE id = ? 
                     LIMIT 1`,
                    [menuItemId]
                );
                if (!menuRows.length) {
                    throw new Error(`Menu item not found for id ${menuItemId}`);
                }
                menuItemCache.set(menuItemId, menuRows[0]);
            }
            return menuItemCache.get(menuItemId);
        };

        const getMenuItemByName = async (restaurant, name) => {
            const cacheKey = `name:${restaurant}:${name}`;
            if (!menuItemCache.has(cacheKey)) {
                const [menuRows] = await connection.query(
                    `SELECT id, restaurant_id, name, price, price2, price3, price4, size1, size2, size3, size4 
                     FROM menu_items 
                     WHERE restaurant_id = ? AND name = ? 
                     LIMIT 1`,
                    [restaurant, name]
                );
                if (!menuRows.length) {
                    throw new Error(`Menu item not found for restaurant ${restaurant} and name ${name}`);
                }
                menuItemCache.set(cacheKey, menuRows[0]);
            }
            return menuItemCache.get(cacheKey);
        };

        const getIngredientsForMenuItem = async (menuItemId) => {
            if (!ingredientCache.has(menuItemId)) {
                const [ingredientRows] = await connection.query(
                    `SELECT 
                        i.id AS ingredient_id,
                        i.ingredients_name,
                        i.price,
                        i.extra_price,
                        i.easy_price,
                        i.customize,
                        i.halfable,
                        i.sort_order
                     FROM menu_item_ingredients i
                     JOIN menu_item_ingredients_map m ON i.id = m.ingredient_id
                     WHERE m.menu_item_id = ?
                     ORDER BY i.sort_order ASC, i.id ASC`,
                    [menuItemId]
                );
                ingredientCache.set(menuItemId, ingredientRows);
            }
            return ingredientCache.get(menuItemId);
        };

        for (const cartItem of cartItems) {
            const selections = Array.isArray(cartItem.ingredients) ? cartItem.ingredients : [];
            const halfSelections = Array.isArray(cartItem.halfer) ? cartItem.halfer : [];

            let menuItemId = cartItem.menu_item_id || cartItem.item_id || null;
            if (!menuItemId && Array.isArray(cartItem.arrs)) {
                const arrWithId = cartItem.arrs.find((entry) => entry && entry.menu_item_id);
                if (arrWithId?.menu_item_id) {
                    menuItemId = arrWithId.menu_item_id;
                }
            }

            const candidateRestaurantId = cartItem.restaurant_id || restaurantId;

            let menuItem;
            if (menuItemId) {
                menuItem = await getMenuItemById(menuItemId);
            } else {
                if (!candidateRestaurantId) {
                    throw new Error(`Missing restaurant context for cart item "${cartItem.name}"`);
                }
                menuItem = await getMenuItemByName(candidateRestaurantId, cartItem.name);
                menuItemId = menuItem.id;
            }

            if (!menuItem) {
                throw new Error(`Unable to resolve menu item for cart item "${cartItem.name}"`);
            }

            if (cartItem.restaurant_id && cartItem.restaurant_id !== menuItem.restaurant_id) {
                throw new Error(`Cart item restaurant mismatch for "${cartItem.name}"`);
            }

            if (restaurantId === null) {
                restaurantId = menuItem.restaurant_id;
            } else if (restaurantId !== menuItem.restaurant_id) {
                throw new Error('All items in the cart must belong to the same restaurant');
            }

            const valFlags = [cartItem.val1, cartItem.val2, cartItem.val3, cartItem.val4]
                .map((flag) => Number(flag) || 0);
            let selectedIndex = valFlags.findIndex((flag) => flag === 1);
            if (selectedIndex === -1) {
                selectedIndex = 0;
            }
            const sizeOrdinal = selectedIndex + 1;

            const basePriceValue = (() => {
                switch (sizeOrdinal) {
                    case 1:
                        return menuItem.price;
                    case 2:
                        return menuItem.price2 ?? menuItem.price;
                    case 3:
                        return menuItem.price3 ?? menuItem.price;
                    case 4:
                        return menuItem.price4 ?? menuItem.price;
                    default:
                        return menuItem.price;
                }
            })();

            const basePriceCents = toCents(basePriceValue);
            if (basePriceCents < 0) {
                throw new Error(`Invalid base price for menu item "${menuItem.name}"`);
            }

            const ingredientRows = await getIngredientsForMenuItem(menuItemId);
            let addOnCents = 0;

            for (let i = 0; i < ingredientRows.length; i++) {
                const ingredientRow = ingredientRows[i];
                const selection = selections[i];
                if (!isSelectedIngredient(selection)) continue;

                const customChoice = Array.isArray(selection) && typeof selection[1] === "string"
                    ? selection[1]
                    : "Regular";

                let ingredientPrice = ingredientRow.price ?? 0;
                if (customChoice === "Extra" && ingredientRow.extra_price != null) {
                    ingredientPrice = ingredientRow.extra_price;
                } else if (customChoice === "Easy" && ingredientRow.easy_price != null) {
                    ingredientPrice = ingredientRow.easy_price;
                }

                let ingredientCents = toCents(ingredientPrice);
                const halfChoice = Array.isArray(halfSelections[i]) && typeof halfSelections[i][0] === "string"
                    ? halfSelections[i][0]
                    : "";
                const isHalfPortion = ingredientRow.halfable && halfChoice.toLowerCase().includes("half");

                if (isHalfPortion && ingredientCents > 0) {
                    ingredientCents = Math.round(ingredientCents / 2);
                }

                addOnCents += ingredientCents;
            }

            const unitPriceCents = basePriceCents + addOnCents;
            const quantity = Number(cartItem.quantity) || 0;
            if (quantity <= 0) {
                throw new Error(`Invalid quantity for cart item "${cartItem.name}"`);
            }

            const lineTotalCents = unitPriceCents * quantity;
            subtotalCents += lineTotalCents;
            totalQuantity += quantity;

            const ingredientSummary = formatIngredientSummary(ingredientRows, selections, halfSelections);
            const sizeLabel = menuItem[`size${sizeOrdinal}`] || cartItem[`size${sizeOrdinal}`] || "";

            orderItemsPrepared.push({
                name: menuItem.name,
                size: sizeLabel,
                unitPriceCents,
                quantity,
                ingredients: ingredientSummary,
            });
        }

        if (!restaurantId) {
            throw new Error('Restaurant information missing for order');
        }

        const [[restaurantRow]] = await connection.query(
            `SELECT id, name, address, latitude, longitude 
             FROM restaurants 
             WHERE id = ? 
             LIMIT 1`,
            [restaurantId]
        );
        if (!restaurantRow) {
            throw new Error(`Restaurant not found for id ${restaurantId}`);
        }

        const [[userRow]] = await connection.query(
            `SELECT 
                address_street_number,
                address_street,
                address_city,
                address_state,
                address_zip,
                address_latitude,
                address_longitude
             FROM users 
             WHERE id = ? 
             LIMIT 1`,
            [googleId]
        );

        if (!userRow) {
            throw new Error('User record not found');
        }

        const userLat = Number(userRow.address_latitude);
        const userLng = Number(userRow.address_longitude);
        if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
            throw new Error('User address latitude/longitude missing');
        }

        const restaurantLat = Number(restaurantRow.latitude);
        const restaurantLng = Number(restaurantRow.longitude);
        if (!Number.isFinite(restaurantLat) || !Number.isFinite(restaurantLng)) {
            throw new Error('Restaurant latitude/longitude missing');
        }

        const rawDistance = haversine_dist(restaurantLat, restaurantLng, userLat, userLng);
        const billableDistance = Math.max(rawDistance, MIN_BILLABLE_DISTANCE_MILES);
        const deliveryFeeCents = Math.round((BASE_DELIVERY_FEE + billableDistance) * 100);
        const taxCents = Math.round((subtotalCents + deliveryFeeCents) * TAX_RATE);
        const totalCents = subtotalCents + deliveryFeeCents + taxCents;

        const distanceRounded = Number(rawDistance.toFixed(1));
        const subtotal = centsToFixed(subtotalCents);
        const deliveryFee = centsToFixed(deliveryFeeCents);
        const tax = centsToFixed(taxCents);
        const total = centsToFixed(totalCents);

        const addressFromProfile = buildUserAddress(userRow);
        const orderAddress = addressFromProfile || (typeof clientAddress === "string" ? clientAddress : "");

        const orderQuery = `INSERT INTO orders (
                user_id,
                address,
                instructions,
                business_type,
                knock_type,
                item_count,
                restaurant,
                restaurant_address,
                delivery_fee,
                subtotal,
                distance,
                tax,
                total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [orderResult] = await connection.execute(orderQuery, [
            googleId,
            orderAddress,
            instructions,
            businessType,
            knockType,
            totalQuantity,
            restaurantRow.name,
            restaurantRow.address,
            deliveryFee,
            subtotal,
            distanceRounded,
            tax,
            total,
        ]);

        const orderId = orderResult.insertId;

        const orderItemsValues = orderItemsPrepared.map((item) => [
            orderId,
            item.name,
            item.size,
            centsToFixed(item.unitPriceCents),
            item.quantity,
            item.ingredients,
        ]);

        if (!orderItemsValues.length) {
            throw new Error('No order items to insert');
        }

        await connection.query(
            'INSERT INTO order_items (order_id, name, size, price, quantity, ingredients) VALUES ?',
            [orderItemsValues]
        );

        await connection.commit();
        console.log(`Order ${orderId} placed successfully for user ${googleId}`);
        res.status(201).json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        await connection.rollback();
        console.error('Error placing order:', err);
        res.status(500).json({ error: err.message || 'Transaction failed' });
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

// Schemas are imported from utils/schemas.js above

app.get('/api/menu-items-list', checkRole(2), async (req, res) => {
    if (!req.session?.user?.sub) {
        return res.status(401).json({ error: 'Unauthorized: No user session' });
    }
    console.log("sub: " + req.session?.user?.sub);
    try {
        const query = `
            SELECT menu_items.*
            FROM menu_items
            JOIN users ON users.restaurant_id = menu_items.restaurant_id
            LEFT JOIN menu_item_ingredients_map ON menu_items.id = menu_item_ingredients_map.menu_item_id
            WHERE users.id = ?
            GROUP BY menu_items.id
            ORDER BY COUNT(menu_item_ingredients_map.ingredient_id) DESC;
        `;
        const [results] = await pool.query(query, [req.session.user.sub]);
        if (results.length === 0) {
            return res.status(403).json({ error: 'Forbidden: No menu items found for this user\'s restaurant' });
        }
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// ✅ Route handler
app.get("/api/checkout-data/:selected_restaurant?", async (req, res) => {
  // 1️⃣ Validate session
  const userId = req.session?.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // 2️⃣ Validate route params with Zod
  const paramCheck = restaurantParamSchema.safeParse(req.params);
  if (!paramCheck.success) {
    return res.status(400).json({ error: paramCheck.error.flatten() });
  }
  const { selected_restaurant } = paramCheck.data;
  let connection;
  try {
    connection = await pool.getConnection();
    // 3️⃣ Fetch cart items
    const [cartRows] = await connection.query(
      "SELECT * FROM cart WHERE user_id = ?",
      [userId]
    );
    const cart = z.array(cartItemSchema).parse(cartRows);
    // 4️⃣ Fetch user address
    const [userRows] = await connection.query(
      `SELECT address_street_number, address_street, address_city, address_state, address_zip,
              address_latitude, address_longitude
       FROM users WHERE id = ?`,
      [userId]
    );
    const userAddressRaw = userRows[0];
    const userAddress = userAddressRaw
      ? userAddressSchema.parse(userAddressRaw)
      : null;
    // 5️⃣ Fetch restaurant if provided
    let restaurant = null;
    if (selected_restaurant) {
      const [rows] = await connection.query(
        "SELECT id, name, address, latitude, longitude FROM restaurants WHERE id = ?",
        [selected_restaurant]
      );
      restaurant = rows[0] ? restaurantSchema.parse(rows[0]) : null;
    }
    // 6️⃣ Secure logging (no sensitive info)
    console.log("Checkout data fetched for user:", userId);
    // 7️⃣ Send validated response
    res.json({ cart, userAddress, restaurant });
  } catch (err) {
    console.error("Error in /api/checkout-data:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Route to fetch all sponsors
app.get('/api/sponsors', async (req, res) => {
    const query = 'SELECT business_name, phone_number, website_url, description FROM sponsors;';
    try {
      const [results] = await pool.query(query);
      res.json(results);
    } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Database query failed' });
    }
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
             WHERE u.id = ?`, [req.session.user.sub]
        );
        res.json({ restaurant: restaurant || null });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal server error" });
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
    //console.log("Google Maps API Key:", apiKey); 
    if (!apiKey || apiKey == undefined || apiKey === undefined) {
        return res.status(500).json({ error: "API key not found" });
    }
    res.json({ apiKey });
});

app.get('/api/restaurants/:latitude/:longitude', checkRole(0), async (req, res) => {
    const { latitude, longitude } = req.params;
    const query = `
        SELECT * FROM restaurants 
        WHERE address IS NOT NULL 
        AND longitude IS NOT NULL 
        AND latitude IS NOT NULL
        LIMIT 50`
    ;
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

app.get('/api/cart', checkRole(0), async (req, res) => {
    const userId = req.session?.user?.sub;
    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    try {
        const [results] = await pool.execute(
            'SELECT * FROM cart WHERE user_id = ?', [userId]
        );
        const cartItems = results.map(item => {
            try {
                return {
                    ...item,
                    ingredients: item.ingredients ? JSON.parse(item.ingredients) : [],
                    halfer: item.halfer ? JSON.parse(item.halfer) : [],
                    arrs: item.arrs ? JSON.parse(item.arrs) : []
                };
            } catch (err) {
                console.error('Error parsing cart item:', err);
                return {
                    ...item,
                    ingredients: [],
                    halfer: [],
                    arrs: []
                };
            }
        });
        res.json(cartItems);
    } catch (err) {
        console.error('Error loading cart:', err);
        res.status(500).json({ error: 'Failed to load cart' });
    }
});

app.get('/api/restaurants2/:restaurantId/menu', checkRole(0), async (req, res) => {
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

app.get('/api/menu/item/search', checkRole(0), async (req, res) => {
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

app.get('/api/users', checkRole(2), async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.query || '';
    
    try {
        let sqlQuery = 'SELECT * FROM users';
        let params = [];
        
        if (searchQuery) {
            sqlQuery += ' WHERE name LIKE ? OR email LIKE ?';
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }
        
        // Use direct integer values instead of placeholders for LIMIT/OFFSET
        sqlQuery += ` ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`;
        
        console.log('Executing SQL:', sqlQuery);
        console.log('With parameters:', params);
        
        const [results] = await pool.execute(sqlQuery, params);
        console.log('Results count:', results.length);
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.get('/api/menu/item/ingredients', checkRole(0), async (req, res) => {
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

app.get('/api/order_items', checkRole(0), async (req, res) => {
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

app.get('/api/restaurants/:restaurant', checkRole(0), async (req, res) => {
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

app.get('/api/menu/item', checkRole(0), async (req, res) => {
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

app.get('/api/user/address', checkRole(0), async (req, res) => {
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

app.get('/api/user/orders', checkRole(0), async (req, res) => {
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

app.get('/api/user/details', checkRole(0), async (req, res) => {
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

app.get('/api/users/:id/selected_restaurant', checkRole(0), async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT selected_restaurant FROM users WHERE id = ?';
    try {
        const [results] = await pool.execute(query, [id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ selected_restaurant: results[0].selected_restaurant });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
});

// Start the server
app.listen(PORT, IP, () => {
    console.log("Server is running on " + IP + ":" + PORT);
});