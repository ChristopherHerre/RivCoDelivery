import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
	const baseUrl = site?.toString() || 'https://rivcodelivery.com';
	
	// Fetch all menu items and ingredients from API
	// Note: In production, you might want to cache this or generate it periodically
	const apiBase = baseUrl;
	
	let menuItemUrls: string[] = [];
	let ingredientUrls: string[] = [];
	let restaurantIngredientUrls: string[] = [];
	let categoryUrls: string[] = [];
	
	try {
		// Fetch all restaurants to get their menu items
		const citiesRes = await fetch(`${apiBase}/api/restaurant-cities`);
		if (citiesRes.ok) {
			const cities = await citiesRes.json();
			
			for (const city of cities) {
				// Fetch restaurants in this city
				const restaurantsRes = await fetch(`${apiBase}/api/restaurants-by-city?city_slug=${encodeURIComponent(city.city_slug)}`);
				if (restaurantsRes.ok) {
					const restaurants = await restaurantsRes.json();
					
					// Track unique categories for this city
					const cityCategories = new Set<string>();
					
					for (const restaurant of restaurants) {
						const restaurantSlug = `${restaurant.id}-${restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
						
						// Track category for sitemap
						if (restaurant.category) {
							cityCategories.add(restaurant.category);
						}
						
						// Fetch menu items for this restaurant
						const menuRes = await fetch(`${apiBase}/api/restaurants2/${restaurant.id}/menu`);
						if (menuRes.ok) {
							const menuItems = await menuRes.json();
							
							for (const item of menuItems) {
								const itemSlug = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${item.id}`;
								menuItemUrls.push(`${baseUrl}/restaurants/${city.city_slug}/${restaurantSlug}/menu/${itemSlug}`);
								
								// Fetch ingredients for this menu item
								const ingredientsRes = await fetch(`${apiBase}/api/public/menu-items/${item.id}/ingredients`);
								if (ingredientsRes.ok) {
									const ingredients = await ingredientsRes.json();
									
									for (const ing of ingredients) {
										const ingSlug = ing.ingredients_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
										const restaurantIngredientUrl = `${baseUrl}/restaurants/${city.city_slug}/${restaurantSlug}/ingredients/${ingSlug}`;
										
										// Avoid duplicates
										if (!restaurantIngredientUrls.includes(restaurantIngredientUrl)) {
											restaurantIngredientUrls.push(restaurantIngredientUrl);
										}
										
										// Global ingredient URL
										const globalIngredientUrl = `${baseUrl}/ingredients/${ingSlug}`;
										if (!ingredientUrls.includes(globalIngredientUrl)) {
											ingredientUrls.push(globalIngredientUrl);
										}
									}
								}
							}
						}
					}
					
					// Add category URLs for this city
					for (const category of cityCategories) {
						const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
						categoryUrls.push(`${baseUrl}/restaurants/${city.city_slug}/categories/${categorySlug}`);
					}
				}
			}
		}
	} catch (error) {
		console.error('Error generating sitemap:', error);
		// Return empty sitemap on error rather than failing
	}
	
	// Generate XML sitemap
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${menuItemUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
${ingredientUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${restaurantIngredientUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${categoryUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
		}
	});
};

