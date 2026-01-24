export { renderers } from '../renderers.mjs';

/**
 * Utility functions for restaurant URLs
 */

/**
 * Creates a slug from a restaurant name (same as SSR page)
 * @param {string} name - Restaurant name
 * @returns {string} Slugified name
 */
function slugify(name) {
	if (!name) return '';
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Creates a slug from a menu item name
 * @param {string} name - Menu item name
 * @returns {string} Slugified name
 */
function slugifyMenuItem(name) {
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
function slugifyIngredient(name) {
	if (!name) return '';
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

/**
 * Creates a slug from a category name
 * @param {string} categoryName - Category name (e.g., "Chinese Food")
 * @returns {string} Slugified category name (e.g., "chinese-food")
 */
function slugifyCategory(categoryName) {
	if (!categoryName) return '';
	return categoryName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

const GET = async ({ site }) => {
  const baseUrl = site?.toString() || "https://rivcodelivery.com";
  const apiBase = baseUrl;
  let menuItemUrls = [];
  let ingredientUrls = [];
  let restaurantIngredientUrls = [];
  let categoryUrls = [];
  let cityUrls = [];
  let restaurantUrls = [];
  try {
    const homeUrl2 = `${baseUrl}/`;
    const citiesRes = await fetch(`${apiBase}/api/restaurant-cities`);
    if (citiesRes.ok) {
      const cities = await citiesRes.json();
      for (const city of cities) {
        cityUrls.push(`${baseUrl}/restaurants/${city.city_slug}`);
        const restaurantsRes = await fetch(`${apiBase}/api/restaurants-by-city?city_slug=${encodeURIComponent(city.city_slug)}`);
        if (restaurantsRes.ok) {
          const restaurants = await restaurantsRes.json();
          const cityCategories = /* @__PURE__ */ new Set();
          for (const restaurant of restaurants) {
            const restaurantSlug = `${restaurant.id}-${slugify(restaurant.name || "")}`;
            restaurantUrls.push(`${baseUrl}/restaurants/${city.city_slug}/${restaurantSlug}`);
            if (restaurant.category) {
              cityCategories.add(restaurant.category);
            }
            const menuRes = await fetch(`${apiBase}/api/restaurants2/${restaurant.id}/menu`);
            if (menuRes.ok) {
              const menuItems = await menuRes.json();
              for (const item of menuItems) {
                const itemSlug = `${slugifyMenuItem(item.name || "")}-${item.id}`;
                menuItemUrls.push(`${baseUrl}/restaurants/${city.city_slug}/${restaurantSlug}/menu/${itemSlug}`);
                const ingredientsRes = await fetch(`${apiBase}/api/public/menu-items/${item.id}/ingredients`);
                if (ingredientsRes.ok) {
                  const ingredients = await ingredientsRes.json();
                  for (const ing of ingredients) {
                    const ingSlug = slugifyIngredient(ing.ingredients_name || "");
                    const restaurantIngredientUrl = `${baseUrl}/restaurants/${city.city_slug}/${restaurantSlug}/ingredients/${ingSlug}`;
                    if (!restaurantIngredientUrls.includes(restaurantIngredientUrl)) {
                      restaurantIngredientUrls.push(restaurantIngredientUrl);
                    }
                    const globalIngredientUrl = `${baseUrl}/ingredients/${ingSlug}`;
                    if (!ingredientUrls.includes(globalIngredientUrl)) {
                      ingredientUrls.push(globalIngredientUrl);
                    }
                  }
                }
              }
            }
          }
          for (const category of cityCategories) {
            const categorySlug = slugifyCategory(category);
            categoryUrls.push(`${baseUrl}/restaurants/${city.city_slug}/categories/${categorySlug}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${homeUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${cityUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join("\n")}
${restaurantUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join("\n")}
${categoryUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n")}
${menuItemUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n")}
${ingredientUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
${restaurantIngredientUrls.map((url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
</urlset>`;
  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
      // Cache for 1 hour
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
