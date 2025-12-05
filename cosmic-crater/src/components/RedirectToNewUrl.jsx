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
						navigate(`${baseUrl}/menu/item${querySuffix}`, { replace: true });
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

