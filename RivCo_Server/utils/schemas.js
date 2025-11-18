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

const restaurantParamSchema = z
  .object({
    selected_restaurant: z
      .string()
      .regex(/^\d+$/, "Restaurant ID must be numeric")
      .optional(),
  })
  .strict();

const userAddressSchema = z.object({
    address_street_number: z.string().nullable(),
    address_street: z.string().nullable(),
    address_city: z.string().nullable(),
    address_state: z.string().nullable(),
    address_zip: z.string().nullable(),
    address_latitude: z.coerce.number().nullable(),
    address_longitude: z.coerce.number().nullable(),
});

const cartItemSchema = z.object({
    id: z.coerce.number(),
    user_id: z.coerce.number(),
    item_id: z.coerce.number().optional(),
    quantity: z.coerce.number(),
    notes: z.string().nullable().optional(),
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

module.exports = {
    addRestaurantSchema,
    updateMenuItemSchema,
    addMenuItemSchema,
    changeOrderOpenSchema,
    restaurantParamSchema,
    userAddressSchema,
    cartItemSchema,
    restaurantSchema,
    ingredientBodySchema
};

