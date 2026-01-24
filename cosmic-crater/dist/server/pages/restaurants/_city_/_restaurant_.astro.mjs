import { c as createAstro, a as createComponent, r as renderComponent, e as renderTemplate, b as renderHead, d as renderScript, f as addAttribute } from '../../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                        */
import { $ as $$BaseHead, a as $$Header, b as $$Footer } from '../../../chunks/Footer_D0LEFTjD.mjs';
import { $ as $$Breadcrumb } from '../../../chunks/Breadcrumb_Di5RKlof.mjs';
import { R as ResponsiveFlexRow } from '../../../chunks/ResponsiveFlexRow_Cgvm_9h1.mjs';
import { $ as $$LikeDisplay } from '../../../chunks/LikeDisplay_B8lWz8ew.mjs';
/* empty css                                              */
export { renderers } from '../../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$restaurant = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$restaurant;
  const { city, restaurant } = Astro2.params;
  const restaurantId = Number((restaurant ?? "").split("-")[0]);
  if (!restaurantId || Number.isNaN(restaurantId)) {
    throw new Error("Invalid restaurant id");
  }
  let r = null;
  let grouped = {};
  const apiBase = Astro2.url.origin;
  const restaurantRes = await fetch(`${apiBase}/api/public/restaurants/${restaurantId}`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (!restaurantRes.ok) {
    throw new Error(`Failed to load restaurant: ${restaurantRes.status}`);
  }
  r = await restaurantRes.json();
  if (r.city_slug && r.city_slug !== city) {
    throw new Error("Restaurant does not belong to this city");
  }
  const menuRes = await fetch(
    `${apiBase}/api/restaurants2/${restaurantId}/menu`,
    {
      method: "GET",
      headers: { accept: "application/json" }
    }
  );
  if (!menuRes.ok) {
    throw new Error(`Failed to load menu items: ${menuRes.status}`);
  }
  const menuItems = await menuRes.json();
  grouped = menuItems.reduce((acc, item) => {
    const key = item.category || "Menu";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  return renderTemplate`<html lang="en" data-astro-cid-r6rvtzwl> <head>${renderComponent($$result, "BaseHead", $$BaseHead, { "title": r ? `${r.name} Delivery in ${r.city_name}, CA | Order ${r.category || "Food"} Online | RivCoDelivery` : `Restaurant Menu | RivCoDelivery`, "description": r ? `Order ${r.category ? r.category.toLowerCase() : "food"} delivery from ${r.name} in ${r.city_name}, California. Browse full menu, customize your order, and get fast delivery. Easy online ordering with RivCoDelivery.` : `Browse restaurant menu and order delivery with RivCoDelivery.`, "data-astro-cid-r6rvtzwl": true })}${r && renderTemplate(_a || (_a = __template(["<script type=\"application/ld+json\">\n				{JSON.stringify({\n					'@context': 'https://schema.org',\n					'@type': 'Restaurant',\n					name: r.name,\n					address: {\n						'@type': 'PostalAddress',\n						streetAddress: r.address,\n						addressLocality: r.city_name || '',\n						addressRegion: r.address.match(/,\\s*([A-Z]{2})\\s*\\d/)?.[1] || '',\n						addressCountry: 'US'\n					},\n					geo: {\n						'@type': 'GeoCoordinates',\n						latitude: r.latitude,\n						longitude: r.longitude\n					},\n					servesCuisine: r.category,\n					url: `${Astro.url.origin}/restaurants/${city}/${restaurant}`,\n					priceRange: '$'\n				})}\n			<\/script>"], ["<script type=\"application/ld+json\">\n				{JSON.stringify({\n					'@context': 'https://schema.org',\n					'@type': 'Restaurant',\n					name: r.name,\n					address: {\n						'@type': 'PostalAddress',\n						streetAddress: r.address,\n						addressLocality: r.city_name || '',\n						addressRegion: r.address.match(/,\\\\s*([A-Z]{2})\\\\s*\\\\d/)?.[1] || '',\n						addressCountry: 'US'\n					},\n					geo: {\n						'@type': 'GeoCoordinates',\n						latitude: r.latitude,\n						longitude: r.longitude\n					},\n					servesCuisine: r.category,\n					url: \\`\\${Astro.url.origin}/restaurants/\\${city}/\\${restaurant}\\`,\n					priceRange: '$'\n				})}\n			<\/script>"])))}${renderHead()}</head> <body data-astro-cid-r6rvtzwl> ${renderComponent($$result, "Header", $$Header, { "data-astro-cid-r6rvtzwl": true })} <!-- SSR content - visible by default for SEO, hidden if user is logged in --> ${r && renderTemplate`<div id="ssr-content" data-astro-cid-r6rvtzwl> <main class="mx-auto" data-astro-cid-r6rvtzwl> ${renderComponent($$result, "Breadcrumb", $$Breadcrumb, { "items": [
    { label: "Home", href: "/" },
    { label: r.city_name || city, href: `/restaurants/${city}` },
    { label: r.name }
  ], "data-astro-cid-r6rvtzwl": true })} ${renderComponent($$result, "ResponsiveFlexRow", null, { "margin": "mb-6", "align": "stretch", "variant": "restaurant", "client:only": "react", "client:component-hydration": "only", "data-astro-cid-r6rvtzwl": true, "client:component-path": "@/components/common/ResponsiveFlexRow.jsx", "client:component-export": "default" }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col" data-astro-cid-r6rvtzwl> <h1 class="mb-2 text-2xl font-semibold text-white" data-astro-cid-r6rvtzwl>${r.name} Menu</h1> <p class="mb-1 text-base" data-astro-cid-r6rvtzwl> <strong class="font-semibold text-white" data-astro-cid-r6rvtzwl>${r.category}</strong> </p> <p class="mb-1 text-base text-white/90" data-astro-cid-r6rvtzwl>${r.address}</p> </div> <div class="flex items-center max-lg:w-full" data-astro-cid-r6rvtzwl> ${renderComponent($$result2, "OrderButtonWithAuth", null, { "restaurantId": r.id, "client:only": "react", "client:component-hydration": "only", "data-astro-cid-r6rvtzwl": true, "client:component-path": "@/components/users/nav/OrderButtonWithAuth.jsx", "client:component-export": "default" })} </div> ` })} ${Object.entries(grouped).map(([category, items]) => {
    const slugify = (name) => {
      if (!name) return "";
      return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    };
    return renderTemplate`<section class="mb-6"${addAttribute(category, "key")} data-astro-cid-r6rvtzwl> <h2 class="text-xl font-semibold mb-3 text-gray-900" data-astro-cid-r6rvtzwl>${category}</h2> <div class="flex flex-wrap -mx-3" data-astro-cid-r6rvtzwl> ${items.map((item) => {
      const itemSlug = slugify(item.name);
      return renderTemplate`<div class="w-full md:w-1/2 px-3 mb-3"${addAttribute(item.id, "key")} data-astro-cid-r6rvtzwl> ${renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "card": true, "vertical": true, "align": "stretch", "variant": "menu", "data-astro-cid-r6rvtzwl": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col" data-astro-cid-r6rvtzwl> <h3 class="text-lg font-semibold mb-2" data-astro-cid-r6rvtzwl> <a${addAttribute(`/restaurants/${city}/${restaurant}/menu/${itemSlug}-${item.id}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors" data-astro-cid-r6rvtzwl> ${item.name} </a> </h3> ${item.category && renderTemplate`<p class="text-sm text-white/80 mb-2" data-astro-cid-r6rvtzwl>${item.category}</p>`} ${item.size_display_name && renderTemplate`<p class="text-sm text-white/80 mb-2" data-astro-cid-r6rvtzwl>${item.size_display_name}</p>`} ${renderComponent($$result2, "ResponsiveFlexRow", ResponsiveFlexRow, { "borderTop": true, "margin": "mt-auto", "variant": "nested", "data-astro-cid-r6rvtzwl": true }, { "default": async ($$result3) => renderTemplate` <span class="font-bold text-lg text-white" data-astro-cid-r6rvtzwl>
$${Number(item.price).toFixed(2)} </span> <div class="flex items-center gap-2" data-astro-cid-r6rvtzwl> <a${addAttribute(`/restaurants/${city}/${restaurant}/menu/${itemSlug}-${item.id}`, "href")} class="inline-block px-5 py-2.5 bg-blue-600 text-white text-base font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer max-lg:w-full max-lg:text-center" data-astro-cid-r6rvtzwl>
View details
</a> ${renderComponent($$result3, "LikeDisplay", $$LikeDisplay, { "itemId": item.id, "itemType": "menu-item", "likes": item.likes || 0, "data-astro-cid-r6rvtzwl": true })} </div> ` })} </div> ` })} </div>`;
    })} </div> </section>`;
  })} </main> </div>`} <!-- SPA container - wrapper checks auth before rendering App --> <div id="spa-container" style="display: none;" data-astro-cid-r6rvtzwl> ${renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-r6rvtzwl": true, "client:component-path": "@/components/SSRAppWrapper.jsx", "client:component-export": "default" })} </div> ${renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-r6rvtzwl": true })} <!-- Client-side auth check --> ${renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant].astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant].astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant].astro";
const $$url = "/restaurants/[city]/[restaurant]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$restaurant,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
