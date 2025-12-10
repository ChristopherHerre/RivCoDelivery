import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getRestaurantMenuUrl, getRestaurantMenuItemUrl, getRestaurantCartUrl, getRestaurantCheckoutUrl, slugify } from '../utils/restaurantUrls';

/**
 * Component that redirects from old URL format to new format
 * Handles redirects like /:id/menu -> /restaurants/:city/:id-slug
 */
export default function RedirectToNewUrl() {
	const navigate = useNavigate();
	const params = useParams();
	const location = useLocation();
	const restaurantId = params.restaurant ? Number(params.restaurant) : null;

	useEffect(() => {
		if (!restaurantId || Number.isNaN(restaurantId)) {
			navigate('/', { replace: true });
			return;
		}

		// Fetch restaurant data to build the correct URL
		axios.get(`/api/public/restaurants/${restaurantId}`)
			.then(res => {
				const restaurantData = res.data;
				if (restaurantData && restaurantData.city_slug) {
					const restaurantSlug = slugify(restaurantData.name || '');
					const baseUrl = `/restaurants/${restaurantData.city_slug}/${restaurantId}-${restaurantSlug}`;
					
					// Preserve query parameters (like ?item=123 for menu items)
					const searchParams = new URLSearchParams(location.search);
					const queryString = searchParams.toString();
					const querySuffix = queryString ? `?${queryString}` : '';
					
				// Build new URL based on the current path
				if (location.pathname.includes('/menu/item')) {
					// Check if there's an item query parameter to convert to slug format
					const searchParams = new URLSearchParams(location.search);
					const itemId = searchParams.get('item');
					
					if (itemId) {
						// Fetch menu item to get name for slug and convert to new format
						axios.get(`/api/public/menu-items/${itemId}`)
							.then(itemRes => {
								const menuItem = itemRes.data;
								if (menuItem && menuItem.restaurant_id === restaurantId) {
									const itemSlug = slugify(menuItem.name || '');
									navigate(`${baseUrl}/menu/${itemSlug}-${itemId}`, { replace: true });
								} else {
									// Fallback to query param format if restaurant doesn't match
									navigate(`${baseUrl}/menu/item?item=${itemId}`, { replace: true });
								}
							})
							.catch(() => {
								// Fallback to query param format if fetch fails
								navigate(`${baseUrl}/menu/item?item=${itemId}`, { replace: true });
							});
					} else {
						// No item parameter, just redirect to menu
						navigate(baseUrl, { replace: true });
					}
				} else if (location.pathname.includes('/cart')) {
					navigate(`${baseUrl}/cart${querySuffix}`, { replace: true });
				} else if (location.pathname.includes('/checkout')) {
					navigate(`${baseUrl}/checkout${querySuffix}`, { replace: true });
				} else {
					// Default to menu
					navigate(`${baseUrl}${querySuffix}`, { replace: true });
				}
				} else {
					// If we can't get restaurant data, just go home
					navigate('/', { replace: true });
				}
			})
			.catch(err => {
				console.error('Error fetching restaurant data for redirect:', err);
				navigate('/', { replace: true });
			});
	}, [restaurantId, navigate, location.pathname, location.search]);

	return null;
}

