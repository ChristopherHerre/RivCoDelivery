const { z } = require('zod');
const { selectedRestaurantParamSchema, cartItemSchema, userAddressSchema, restaurantSchema, checkoutUserInputSchema } = require('../utils/schemas');
const { 
    haversine_dist, TAX_RATE, BASE_DELIVERY_FEE, MIN_BILLABLE_DISTANCE_MILES,
    toCents, centsToFixed, safeJsonParse, isSelectedIngredient,
    formatIngredientSummary, buildUserAddress
} = require('../utils/helpers');
const { ROLES } = require('../constants/roles');

function checkoutRoutes(app, pool, checkRole, orderLimiter) {
    const router = require('express').Router();

    // POST /api/co - Place order (checkout)
    router.post('/co', checkRole(ROLES.USER), orderLimiter, async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const googleId = req.session.user.sub;
        const payloadArray = Array.isArray(req.body) ? req.body : [];
        const userInputData = payloadArray[0];

        // Validate and sanitize user input data with length limits
        const parseResult = checkoutUserInputSchema.safeParse(userInputData);
        if (!parseResult.success) {
            console.error('Invalid checkout payload received for user:', googleId, userInputData);
            return res.status(400).json({
                error: 'Invalid checkout payload',
                details: parseResult.error.flatten().fieldErrors,
            });
        }

        const [
            clientAddress, // ignored in favor of server-built address
            instructions,
            businessType,
            knockType,
        ] = parseResult.data;

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

    // GET /api/checkout-data/:selected_restaurant?0
    router.get("/checkout-data/:selected_restaurant?", checkRole(ROLES.USER), async (req, res) => {
        const userId = req.session?.user?.sub;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const paramCheck = selectedRestaurantParamSchema.safeParse(req.params);
        if (!paramCheck.success) {
            return res.status(400).json({ error: paramCheck.error.flatten() });
        }
        const { selected_restaurant } = paramCheck.data;
        let connection;
        try {
            connection = await pool.getConnection();
            const [cartRows] = await connection.query(
                "SELECT * FROM cart WHERE user_id = ?",
                [userId]
            );
            const cart = z.array(cartItemSchema).parse(cartRows);
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
            let restaurant = null;
            if (selected_restaurant) {
                const [rows] = await connection.query(
                    "SELECT id, name, address, latitude, longitude FROM restaurants WHERE id = ?",
                    [selected_restaurant]
                );
                restaurant = rows[0] ? restaurantSchema.parse(rows[0]) : null;
            }
            console.log("Checkout data fetched for user:", userId);
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

    return router;
}

module.exports = checkoutRoutes;

