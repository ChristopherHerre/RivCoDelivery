import { c as createAstro, a as createComponent, e as renderTemplate, d as renderScript, r as renderComponent, f as addAttribute, b as renderHead, u as unescapeHTML } from '../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                     */
import { b as $$Footer, a as $$Header, $ as $$BaseHead } from '../../chunks/Footer_D0LEFTjD.mjs';
import { $ as $$Breadcrumb } from '../../chunks/Breadcrumb_Di5RKlof.mjs';
import { $ as $$Link } from '../../chunks/Link_CacYMVQe.mjs';
import { S as SITE_TITLE } from '../../chunks/consts_BJWxdR8O.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$city = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$city;
  const { city } = Astro2.params;
  let restaurants = [];
  let cityName = "this area";
  const apiBase = Astro2.url.origin;
  const res = await fetch(
    `${apiBase}/api/restaurants-by-city?city_slug=${encodeURIComponent(city)}`,
    {
      method: "GET",
      headers: { accept: "application/json" }
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to load restaurants for city: ${res.status}`);
  }
  restaurants = await res.json();
  cityName = restaurants[0]?.city_name ?? "this area";
  const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const grouped = restaurants.reduce((acc, restaurant) => {
    const category = restaurant.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(restaurant);
    return acc;
  }, {});
  const getCategoryUrl = (categoryName) => {
    if (!categoryName) return null;
    const categorySlug = slugify(categoryName);
    return `/restaurants/${city}/categories/${categorySlug}`;
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: Astro2.url.origin + "/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cityName,
        item: Astro2.url.origin + `/restaurants/${city}`
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-zzrcgkhu> <head>', '<script type="application/ld+json">', "<\/script>", "</head> <body data-astro-cid-zzrcgkhu> ", ' <!-- SSR content - visible by default for SEO, hidden if user is logged in --> <div id="ssr-content" data-astro-cid-zzrcgkhu> <main class="mx-auto px-4" data-astro-cid-zzrcgkhu> <h1 class="mb-3 text-2xl font-semibold text-white" data-astro-cid-zzrcgkhu>Restaurants in ', ', California</h1> <p class="text-base text-base-content/70 mb-6" data-astro-cid-zzrcgkhu> ', " fulfills restaurant delivery orders in ", ' after we receive payment for your order. You can pay for your order through Zelle, Apple Cash, or credit card, and your food will be delivered as soon as possible or at the delivery time you specify.\n</p> <div class="py-4 bg-base-100 rounded-xl mb-6" data-astro-cid-zzrcgkhu> <div class="px-4" data-astro-cid-zzrcgkhu> ', " </div> </div> ", ' </main> </div> <!-- SPA container - wrapper checks auth before rendering App --> <div id="spa-container" style="display: none;" data-astro-cid-zzrcgkhu> ', " </div> ", " <!-- Client-side auth check --> ", " </body> </html>"])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": `Food Delivery in ${cityName}, CA | Order Online | RivCoDelivery`, "description": `Order food delivery from top restaurants in ${cityName}, California. Browse menus, compare prices, and get fast delivery. Easy online ordering with RivCoDelivery.`, "data-astro-cid-zzrcgkhu": true }), unescapeHTML(JSON.stringify(breadcrumbData)), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-zzrcgkhu": true }), cityName, SITE_TITLE, cityName, renderComponent($$result, "Breadcrumb", $$Breadcrumb, { "items": [
    { label: "Home", href: "/" },
    { label: cityName }
  ], "data-astro-cid-zzrcgkhu": true }), restaurants.length === 0 ? renderTemplate`<div class="card bg-base-100 shadow-md" data-astro-cid-zzrcgkhu> <div class="card-body" data-astro-cid-zzrcgkhu> <p class="text-base-content" data-astro-cid-zzrcgkhu>No restaurants found in this city yet.</p> </div> </div>` : Object.keys(grouped).map((category) => {
    const categoryUrl = getCategoryUrl(category);
    return renderTemplate`<div class="mb-6"${addAttribute(category, "key")} data-astro-cid-zzrcgkhu> <div class="py-4 bg-gray-800 rounded-xl" data-astro-cid-zzrcgkhu> ${categoryUrl ? renderTemplate`<h2 class="text-2xl font-bold mb-4 text-primary px-4" data-astro-cid-zzrcgkhu> ${renderComponent($$result, "Link", $$Link, { "href": categoryUrl, "className": "link link-hover text-primary", "data-astro-cid-zzrcgkhu": true }, { "default": async ($$result2) => renderTemplate`${category} delivery in ${cityName}` })} </h2>` : renderTemplate`<h2 class="text-2xl font-bold mb-4 text-primary px-4" data-astro-cid-zzrcgkhu>${category} delivery in ${cityName}</h2>`} ${renderComponent($$result, "SSRRestaurantCarousel", null, { "restaurants": grouped[category], "city": city, "categoryIndex": Object.keys(grouped).indexOf(category), "categoryUrl": categoryUrl, "client:only": "react", "client:component-hydration": "only", "data-astro-cid-zzrcgkhu": true, "client:component-path": "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/restaurants/SSRRestaurantCarousel.jsx", "client:component-export": "default" })} </div> </div>`;
  }), renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-zzrcgkhu": true, "client:component-path": "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/SSRAppWrapper.jsx", "client:component-export": "default" }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-zzrcgkhu": true }), renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city].astro?astro&type=script&index=0&lang.ts"));
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city].astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city].astro";
const $$url = "/restaurants/[city]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$city,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
