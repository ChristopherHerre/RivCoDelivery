const { z } = require('zod');

const addRestaurantSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    latitude: z.coerce
        .number({ invalid_type_error: "Latitude must be a number" })
        .refine((val) => val >= -90 && val <= 90, "Invalid latitude"),
    longitude: z.coerce
        .number({ invalid_type_error: "Longitude must be a number" })
        .refine((val) => val >= -180 && val <= 180, "Invalid longitude"),
    category: z.string().optional(),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
  size1: z.string().nullable().optional(),
  size2: z.string().nullable().optional(),
  size3: z.string().nullable().optional(),
  size4: z.string().nullable().optional(),
  price2: z.coerce.number().optional(),
  price3: z.coerce.number().optional(),
  price4: z.coerce.number().optional(),
  category: z.string().optional(),
  sort: z.coerce.number().optional(),
});

const addMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().positive("Price must be positive"),
  size1: z.string().nullable().optional(),
  size2: z.string().nullable().optional(),
  size3: z.string().nullable().optional(),
  size4: z.string().nullable().optional(),
  price2: z.coerce.number().nullable().optional(),
  price3: z.coerce.number().nullable().optional(),
  price4: z.coerce.number().nullable().optional(),
  sort: z.coerce.number().optional().default(2),
});

const changeOrderOpenSchema = z.object({
    orderId: z.coerce.number({
      required_error: "Order ID is required",
      invalid_type_error: "Order ID must be a number",
    }).int().positive("Order ID must be a positive integer"),
});



// Schema for address object in POST /user/address
const userAddressPostSchema = z.object({
    address: z.object({
        streetNumber: z.string().max(50, "Street number must be less than 50 characters").optional(),
        street: z.string().max(200, "Street must be less than 200 characters").optional(),
        city: z.string().max(100, "City must be less than 100 characters").optional(),
        state: z.string().max(50, "State must be less than 50 characters").optional(),
        zip: z.string().max(20, "Zip code must be less than 20 characters").optional(),
    }).optional(),
    latitude: z.coerce
        .number({ invalid_type_error: "Latitude must be a number", required_error: "Latitude is required" })
        .refine((val) => Number.isFinite(val) && val >= -90 && val <= 90, "Latitude must be between -90 and 90"),
    longitude: z.coerce
        .number({ invalid_type_error: "Longitude must be a number", required_error: "Longitude is required" })
        .refine((val) => Number.isFinite(val) && val >= -180 && val <= 180, "Longitude must be between -180 and 180"),
});

// Legacy schema for database operations (keeping for backward compatibility if needed)
const userAddressSchema = z.object({
    address_street_number: z.string().max(50).nullable(),
    address_street: z.string().max(200).nullable(),
    address_city: z.string().max(100).nullable(),
    address_state: z.string().max(50).nullable(),
    address_zip: z.string().max(20).nullable(),
    address_latitude: z.coerce.number().refine((val) => val === null || (val >= -90 && val <= 90), "Invalid latitude").nullable(),
    address_longitude: z.coerce.number().refine((val) => val === null || (val >= -180 && val <= 180), "Invalid longitude").nullable(),
});

// Schema for cart items read from database (used in checkout.js)
const cartItemSchema = z.object({
    id: z.coerce.number(),
    user_id: z.coerce.number(),
    item_id: z.coerce.number().optional(),
    quantity: z.coerce.number(),
    notes: z.string().nullable().optional(),
});

// Schema for cart item input validation (POST /api/cart)
// Addresses vulnerability 1.1: Missing Validation - Array Size Limits in Cart
const cartItemInputSchema = z.object({
    name: z.string()
        .min(1, "Cart item name is required")
        .max(255, "Cart item name cannot exceed 255 characters")
        .transform(str => str.trim())
        .refine(val => val.length > 0, "Cart item name cannot be empty after trimming"),
    price: z.coerce
        .number({
            required_error: "Price is required",
            invalid_type_error: "Price must be a number"
        })
        .nonnegative("Price cannot be negative")
        .max(9999999.99, "Price cannot exceed 9,999,999.99"),
    quantity: z.coerce
        .number({
            required_error: "Quantity is required",
            invalid_type_error: "Quantity must be a number"
        })
        .int("Quantity must be an integer")
        .positive("Quantity must be positive")
        .max(100, "Quantity cannot exceed 100"),
    restaurant_id: z.coerce
        .number({
            required_error: "Restaurant ID is required",
            invalid_type_error: "Restaurant ID must be a number"
        })
        .int("Restaurant ID must be an integer")
        .positive("Restaurant ID must be a positive integer"),
    // Ingredients array: flexible structure - can be boolean, array [boolean, string], or other
    // Max 50 elements to prevent DoS attacks (vulnerability 1.1)
    ingredients: z.array(z.any())
        .max(50, "Maximum 50 ingredients allowed")
        .default([]),
    // Halfer array: flexible structure - can be string, array [string], or other
    // Max 50 elements to prevent DoS attacks (vulnerability 1.1)
    halfer: z.array(z.any())
        .max(50, "Maximum 50 halfer selections allowed")
        .default([]),
    // Arrs array: objects with ingredient metadata (flexible structure)
    // Max 50 elements to prevent DoS attacks (vulnerability 1.1)
    arrs: z.array(z.any())
        .max(50, "Maximum 50 arrs allowed")
        .default([]),
    // Size fields (nullable strings, max 255 chars, trimmed)
    size1: z.preprocess(
        (val) => {
            if (val === undefined || val === null) return null;
            const str = String(val).trim();
            return str.length > 0 ? str.slice(0, 255) : null;
        },
        z.string().max(255, "Size1 cannot exceed 255 characters").nullable()
    ).optional().default(null),
    size2: z.preprocess(
        (val) => {
            if (val === undefined || val === null) return null;
            const str = String(val).trim();
            return str.length > 0 ? str.slice(0, 255) : null;
        },
        z.string().max(255, "Size2 cannot exceed 255 characters").nullable()
    ).optional().default(null),
    size3: z.preprocess(
        (val) => {
            if (val === undefined || val === null) return null;
            const str = String(val).trim();
            return str.length > 0 ? str.slice(0, 255) : null;
        },
        z.string().max(255, "Size3 cannot exceed 255 characters").nullable()
    ).optional().default(null),
    size4: z.preprocess(
        (val) => {
            if (val === undefined || val === null) return null;
            const str = String(val).trim();
            return str.length > 0 ? str.slice(0, 255) : null;
        },
        z.string().max(255, "Size4 cannot exceed 255 characters").nullable()
    ).optional().default(null),
    // Value fields (integers, 0 or 1, default 0)
    val1: z.preprocess(
        (val) => val === undefined || val === null ? 0 : Number(val),
        z.coerce.number().int().min(0).max(1, "Val1 must be 0 or 1")
    ).default(0),
    val2: z.preprocess(
        (val) => val === undefined || val === null ? 0 : Number(val),
        z.coerce.number().int().min(0).max(1, "Val2 must be 0 or 1")
    ).default(0),
    val3: z.preprocess(
        (val) => val === undefined || val === null ? 0 : Number(val),
        z.coerce.number().int().min(0).max(1, "Val3 must be 0 or 1")
    ).default(0),
    val4: z.preprocess(
        (val) => val === undefined || val === null ? 0 : Number(val),
        z.coerce.number().int().min(0).max(1, "Val4 must be 0 or 1")
    ).default(0),
});

const restaurantSchema = z.object({
    id: z.coerce.number(),
    name: z.string(),
    address: z.string(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
});

const ingredientBodySchema = z.object({
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

const paginationQuerySchema = z.object({
    page: z.preprocess(
        (val) => val === undefined || val === null || val === '' ? 1 : Number(val),
        z.number().int().positive().max(1000, "Page number cannot exceed 1000")
    ).default(1),
    limit: z.preprocess(
        (val) => val === undefined || val === null || val === '' ? 10 : Number(val),
        z.number().int().positive().max(100, "Limit cannot exceed 100 items per page")
    ).default(10),
    query: z.preprocess(
        (val) => val === undefined || val === null ? '' : String(val),
        z.string()
            .max(100, "Search query cannot exceed 100 characters")
            .transform((str) => {
                // Escape special LIKE characters: %, _, and backslash
                // This prevents pattern injection attacks in SQL LIKE queries
                return str.replace(/[%_\\]/g, '\\$&');
            })
    ).default(''),
});

const menuItemSearchSchema = z.object({
    menuItemName: z.preprocess(
        (val) => val === undefined || val === null ? '' : String(val),
        z.string()
            .max(100, "Menu item name cannot exceed 100 characters")
            .transform((str) => {
                // Escape special LIKE characters: %, _, and backslash
                // This prevents pattern injection attacks in SQL LIKE queries
                return str.replace(/[%_\\]/g, '\\$&');
            })
    ).default(''),
});

const orderIdQuerySchema = z.object({
    oid: z.coerce.number({
        required_error: "Order ID is required",
        invalid_type_error: "Order ID must be a number",
    }).int().positive("Order ID must be a positive integer"),
});

// Reusable schema for user ID path parameters
const userIdParamSchema = z.object({
    id: z.coerce.number().int().positive("User ID must be a positive integer"),
});

// Reusable schema for restaurant_id in request body
const restaurantIdBodySchema = z.object({
    restaurant_id: z.coerce
        .number()
        .int()
        .positive("Restaurant ID must be a positive integer"),
});

// Reusable schema for required restaurant ID path parameters
// Used in: /api/restaurants2/:restaurantId/menu, /api/restaurants/:restaurant
const restaurantIdParamSchema = z.object({
    restaurantId: z.coerce
        .number({
            required_error: "Restaurant ID is required",
            invalid_type_error: "Restaurant ID must be a number",
        })
        .int("Restaurant ID must be an integer")
        .positive("Restaurant ID must be a positive integer"),
});

// Reusable schema for optional restaurant ID path parameters
// Used in: /api/checkout-data/:selected_restaurant?
const selectedRestaurantParamSchema = z.object({
    selected_restaurant: z.coerce
        .number({
            invalid_type_error: "Restaurant ID must be a number",
        })
        .int("Restaurant ID must be an integer")
        .positive("Restaurant ID must be a positive integer")
        .optional(),
});

// Reusable schema for latitude/longitude path parameters
const latLngParamSchema = z.object({
    latitude: z.coerce
        .number({ invalid_type_error: "Latitude must be a number", required_error: "Latitude is required" })
        .refine((val) => Number.isFinite(val) && val >= -90 && val <= 90, "Latitude must be between -90 and 90"),
    longitude: z.coerce
        .number({ invalid_type_error: "Longitude must be a number", required_error: "Longitude is required" })
        .refine((val) => Number.isFinite(val) && val >= -180 && val <= 180, "Longitude must be between -180 and 180"),
});

// Reusable schema for menu item ID query parameters
const menuItemIdQuerySchema = z.object({
    menuItem: z.coerce
        .number({
            required_error: "Menu item ID is required",
            invalid_type_error: "Menu item ID must be a number",
        })
        .int("Menu item ID must be an integer")
        .positive("Menu item ID must be a positive integer"),
});

// Reusable schema for menu item ID path parameters
const menuItemIdParamSchema = z.object({
    id: z.coerce
        .number({
            required_error: "Menu item ID is required",
            invalid_type_error: "Menu item ID must be a number",
        })
        .int("Menu item ID must be an integer")
        .positive("Menu item ID must be a positive integer"),
});

// Reusable schema for ingredient ID path parameters
const ingredientIdParamSchema = z.object({
    ingredient_id: z.coerce
        .number({
            required_error: "Ingredient ID is required",
            invalid_type_error: "Ingredient ID must be a number",
        })
        .int("Ingredient ID must be an integer")
        .positive("Ingredient ID must be a positive integer"),
});

// Reusable schema for ingredient ID path parameters (when using :id)
const ingredientIdParamSchemaAlt = z.object({
    id: z.coerce
        .number({
            required_error: "Ingredient ID is required",
            invalid_type_error: "Ingredient ID must be a number",
        })
        .int("Ingredient ID must be an integer")
        .positive("Ingredient ID must be a positive integer"),
});

// Schema for checkout user input data array
// Structure: [clientAddress, instructions, businessType, knockType]
const checkoutUserInputSchema = z.tuple([
    z.any(), // clientAddress (ignored, but validated as any type)
    z.preprocess(
        (val) => val === undefined || val === null ? "" : String(val),
        z.string()
            .max(500, "Instructions cannot exceed 500 characters")
            .default("")
    ),
    z.preprocess(
        (val) => val === undefined || val === null ? "" : String(val),
        z.string()
            .max(100, "Business type cannot exceed 100 characters")
            .default("")
    ),
    z.preprocess(
        (val) => val === undefined || val === null ? "" : String(val),
        z.string()
            .max(50, "Knock type cannot exceed 50 characters")
            .default("")
    ),
], {
    required_error: "Checkout user input data is required",
    invalid_type_error: "Checkout user input data must be an array with 4 elements",
});

module.exports = {
    addRestaurantSchema,
    updateMenuItemSchema,
    addMenuItemSchema,
    changeOrderOpenSchema,
    selectedRestaurantParamSchema,
    userAddressSchema,
    userAddressPostSchema,
    cartItemSchema,
    cartItemInputSchema,
    restaurantSchema,
    ingredientBodySchema,
    paginationQuerySchema,
    menuItemSearchSchema,
    orderIdQuerySchema,
    userIdParamSchema,
    restaurantIdBodySchema,
    restaurantIdParamSchema,
    latLngParamSchema,
    menuItemIdQuerySchema,
    menuItemIdParamSchema,
    ingredientIdParamSchema,
    ingredientIdParamSchemaAlt,
    checkoutUserInputSchema
};

