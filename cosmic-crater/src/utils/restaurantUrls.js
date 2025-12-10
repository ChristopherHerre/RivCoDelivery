/**
 * Utility functions for restaurant URLs
 */

/**
 * Creates a slug from a restaurant name (same as SSR page)
 * @param {string} name - Restaurant name
 * @returns {string} Slugified name
 */
export function slugify(name) {
	if (!name) return '';
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Generates a restaurant menu URL in the format /restaurants/[city]/[id]-[slug]
 * @param {Object} restaurant - Restaurant object with id, name, and city_slug
 * @returns {string} Restaurant menu URL
 */
export function getRestaurantMenuUrl(restaurant) {
	if (!restaurant || !restaurant.id) {
		return '/';
	}
	const restaurantSlug = slugify(restaurant.name || '');
	const citySlug = restaurant.city_slug || 'unknown';
	return `/restaurants/${citySlug}/${restaurant.id}-${restaurantSlug}`;
}

/**
 * Parses restaurant ID from a restaurant slug (e.g., "37-krispy-kream" -> 37)
 * Same logic as SSR page uses
 * @param {string} restaurantSlug - Restaurant slug like "37-krispy-kream"
 * @returns {number|null} Restaurant ID or null if invalid
 */
export function parseRestaurantId(restaurantSlug) {
	if (!restaurantSlug) return null;
	const restaurantId = Number((restaurantSlug ?? '').split('-')[0]);
	if (!restaurantId || Number.isNaN(restaurantId)) {
		return null;
	}
	return restaurantId;
}

/**
 * Gets restaurant menu item URL
 * @param {Object} restaurant - Restaurant object
 * @returns {string} Menu item URL
 */
export function getRestaurantMenuItemUrl(restaurant) {
	if (!restaurant || !restaurant.id) {
		return '/';
	}
	const restaurantSlug = slugify(restaurant.name || '');
	const citySlug = restaurant.city_slug || 'unknown';
	return `/restaurants/${citySlug}/${restaurant.id}-${restaurantSlug}/menu/item`;
}

/**
 * Gets restaurant cart URL
 * @param {Object} restaurant - Restaurant object
 * @returns {string} Cart URL
 */
export function getRestaurantCartUrl(restaurant) {
	if (!restaurant || !restaurant.id) {
		return '/';
	}
	const restaurantSlug = slugify(restaurant.name || '');
	const citySlug = restaurant.city_slug || 'unknown';
	return `/restaurants/${citySlug}/${restaurant.id}-${restaurantSlug}/cart`;
}

/**
 * Gets restaurant checkout URL
 * @param {Object} restaurant - Restaurant object
 * @returns {string} Checkout URL
 */
export function getRestaurantCheckoutUrl(restaurant) {
	if (!restaurant || !restaurant.id) {
		return '/';
	}
	const restaurantSlug = slugify(restaurant.name || '');
	const citySlug = restaurant.city_slug || 'unknown';
	return `/restaurants/${citySlug}/${restaurant.id}-${restaurantSlug}/checkout`;
}

/**
 * Creates a slug from a menu item name
 * @param {string} name - Menu item name
 * @returns {string} Slugified name
 */
export function slugifyMenuItem(name) {
	if (!name) return '';
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Creates a slug from an ingredient name
 * @param {string} name - Ingredient name
 * @returns {string} Slugified name
 */
export function slugifyIngredient(name) {
	if (!name) return '';
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Generates a menu item SSR URL
 * @param {Object} restaurant - Restaurant object with id, name, and city_slug
 * @param {Object} menuItem - Menu item object with id and name
 * @returns {string} Menu item URL
 */
export function getMenuItemUrl(restaurant, menuItem) {
	if (!restaurant || !restaurant.id || !menuItem || !menuItem.id) {
		return '/';
	}
	const restaurantSlug = slugify(restaurant.name || '');
	const citySlug = restaurant.city_slug || 'unknown';
	const itemSlug = slugifyMenuItem(menuItem.name || '');
	return `/restaurants/${citySlug}/${restaurant.id}-${restaurantSlug}/menu/${itemSlug}-${menuItem.id}`;
}

/**
 * Generates a restaurant-specific ingredient URL
 * @param {Object} restaurant - Restaurant object with id, name, and city_slug
 * @param {Object|string} ingredient - Ingredient object with ingredients_name or ingredient name string
 * @returns {string} Ingredient URL
 */
export function getIngredientUrl(restaurant, ingredient) {
	if (!restaurant || !restaurant.id) {
		return '/';
	}
	const restaurantSlug = slugify(restaurant.name || '');
	const citySlug = restaurant.city_slug || 'unknown';
	const ingredientName = typeof ingredient === 'string' ? ingredient : (ingredient?.ingredients_name || '');
	const ingredientSlug = slugifyIngredient(ingredientName);
	return `/restaurants/${citySlug}/${restaurant.id}-${restaurantSlug}/ingredients/${ingredientSlug}`;
}

/**
 * Generates a global ingredient URL
 * @param {Object|string} ingredient - Ingredient object with ingredients_name or ingredient name string
 * @returns {string} Global ingredient URL
 */
export function getGlobalIngredientUrl(ingredient) {
	const ingredientName = typeof ingredient === 'string' ? ingredient : (ingredient?.ingredients_name || '');
	const ingredientSlug = slugifyIngredient(ingredientName);
	return `/ingredients/${ingredientSlug}`;
}

/**
 * Creates a slug from a category name
 * @param {string} categoryName - Category name (e.g., "Chinese Food")
 * @returns {string} Slugified category name (e.g., "chinese-food")
 */
export function slugifyCategory(categoryName) {
	if (!categoryName) return '';
	return categoryName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Generates a restaurant category URL
 * @param {string} citySlug - City slug (e.g., "riverside-ca")
 * @param {string} categoryName - Category name (e.g., "Pizza")
 * @returns {string} Category page URL (e.g., "/restaurants/riverside-ca/categories/pizza")
 */
export function getRestaurantCategoryUrl(citySlug, categoryName) {
	if (!citySlug || !categoryName) {
		return '/';
	}
	const categorySlug = slugifyCategory(categoryName);
	return `/restaurants/${citySlug}/categories/${categorySlug}`;
}

