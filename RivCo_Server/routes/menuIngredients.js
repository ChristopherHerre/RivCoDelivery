const { z } = require('zod');
const { ingredientBodySchema } = require('../utils/schemas');

function menuIngredientRoutes(app, pool, checkRole) {
    const router = require('express').Router();

    // DELETE /api/menu-item-ingredients/:ingredient_id
    router.delete('/menu-item-ingredients/:ingredient_id', checkRole(2), async (req, res) => {
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
            const [[user]] = await connection.execute(
                'SELECT restaurant_id FROM users WHERE id = ?',
                [req.session.user.sub]
            );
            if (!user?.restaurant_id) {
                await connection.rollback();
                return res.status(403).json({ error: "User has no associated restaurant" });
            }
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
            const query1 = `
                DELETE miim FROM menu_item_ingredients_map miim
                INNER JOIN menu_items mi ON miim.menu_item_id = mi.id
                WHERE miim.ingredient_id = ? AND mi.restaurant_id = ?
            `;
            await connection.execute(query1, [ingredient_id, user.restaurant_id]);
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

    // POST /api/menu-item-ingredients
    router.post('/menu-item-ingredients', checkRole(2), async (req, res) => {
        const parseResult = ingredientBodySchema.safeParse(req.body);
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

    // PUT /api/menu-ingredients/:id
    router.put('/menu-ingredients/:id', checkRole(2), async (req, res) => {
        if (!req.session?.user?.sub) {
            return res.status(401).json({ message: 'Authentication required' });
        }
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
        const parseResult = ingredientBodySchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: "Validation failed",
                details: parseResult.error.flatten().fieldErrors,
            });
        }
        const updatedData = parseResult.data;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [[user]] = await connection.execute(
                'SELECT restaurant_id FROM users WHERE id = ?',
                [req.session.user.sub]
            );
            if (!user?.restaurant_id) {
                await connection.rollback();
                return res.status(403).json({ error: "User has no associated restaurant" });
            }
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

    return router;
}

module.exports = menuIngredientRoutes;

