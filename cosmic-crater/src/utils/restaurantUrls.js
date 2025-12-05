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

