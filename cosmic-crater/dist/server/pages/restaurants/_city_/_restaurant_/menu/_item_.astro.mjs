import { c as createAstro, a as createComponent, e as renderTemplate, d as renderScript, r as renderComponent, f as addAttribute, b as renderHead, u as unescapeHTML } from '../../../../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                              */
import { b as $$Footer, a as $$Header, $ as $$BaseHead } from '../../../../../chunks/Footer_D0LEFTjD.mjs';
import { $ as $$Breadcrumb } from '../../../../../chunks/Breadcrumb_Di5RKlof.mjs';
import { R as ResponsiveFlexRow } from '../../../../../chunks/ResponsiveFlexRow_Cgvm_9h1.mjs';
/* empty css                                              */
export { renderers } from '../../../../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$item = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$item;
  const { city, restaurant, item } = Astro2.params;
  const restaurantId = Number((restaurant ?? "").split("-")[0]);
  if (!restaurantId || Number.isNaN(restaurantId)) {
    return Astro2.redirect("/404");
  }
  const itemSlugParts = (item ?? "").split("-");
  const menuItemId = Number(itemSlugParts[itemSlugParts.length - 1]);
  if (!menuItemId || Number.isNaN(menuItemId)) {
    return Astro2.redirect("/404");
  }
  let menuItem = null;
  let restaurantData = null;
  let ingredients = [];
  const apiBase = Astro2.url.origin;
  const menuItemRes = await fetch(`${apiBase}/api/public/menu-items/${menuItemId}`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (!menuItemRes.ok || menuItemRes.status === 404) {
    return Astro2.redirect("/404");
  }
  menuItem = await menuItemRes.json();
  if (menuItem.restaurant_id !== restaurantId) {
    return Astro2.redirect("/404");
  }
  restaurantData = {
    id: menuItem.restaurant_id,
    name: menuItem.restaurant_name,
    city_name: menuItem.city_name,
    city_slug: menuItem.city_slug,
    address: menuItem.restaurant_address
  };
  if (restaurantData.city_slug && restaurantData.city_slug !== city) {
    return Astro2.redirect("/404");
  }
  const ingredientsRes = await fetch(`${apiBase}/api/public/menu-items/${menuItemId}/ingredients`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (ingredientsRes.ok) {
    ingredients = await ingredientsRes.json();
  }
  const slugify = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };
  const itemSlug = slugify(menuItem.name);
  const canonicalUrl = `${Astro2.url.origin}/restaurants/${city}/${restaurant}/menu/${itemSlug}-${menuItemId}`;
  const pageTitle = `${menuItem.name} from ${restaurantData.name} in ${restaurantData.city_name}, CA | Order Online | RivCoDelivery`;
  const pageDescription = `Order ${menuItem.name} from ${restaurantData.name} in ${restaurantData.city_name}, California. ${menuItem.price ? `$${Number(menuItem.price).toFixed(2)}` : "Available"} for delivery. Customize your order and get fast delivery with RivCoDelivery.`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: menuItem.name,
    description: pageDescription,
    offers: {
      "@type": "Offer",
      price: menuItem.price ? Number(menuItem.price).toFixed(2) : "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: canonicalUrl
    },
    brand: {
      "@type": "Restaurant",
      name: restaurantData.name
    },
    menuAddOn: ingredients.map((ing) => ({
      "@type": "MenuItem",
      name: ing.ingredients_name
    }))
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: Astro2.url.origin
      },
      {
        "@type": "ListItem",
        position: 2,
        name: restaurantData.city_name,
        item: `${Astro2.url.origin}/restaurants/${city}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: restaurantData.name,
        item: `${Astro2.url.origin}/restaurants/${city}/${restaurant}`
      },
      {
        "@type": "ListItem",
        position: 4,
        name: menuItem.name,
        item: canonicalUrl
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-k3puxlbu> <head>', '<link rel="canonical"', '><meta property="og:type" content="product"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:url"', '><meta property="product:price:amount"', '><meta property="product:price:currency" content="USD"><meta name="twitter:card" content="summary"><meta name="twitter:title"', '><meta name="twitter:description"', '><script type="application/ld+json">', '<\/script><script type="application/ld+json">', "<\/script>", "</head> <body data-astro-cid-k3puxlbu> ", ' <div id="ssr-content" data-astro-cid-k3puxlbu> <main class="mx-auto" data-astro-cid-k3puxlbu> ', " ", ' <section class="mb-6" data-astro-cid-k3puxlbu> <h2 class="text-xl font-semibold mb-3 text-gray-900" data-astro-cid-k3puxlbu>More from ', "</h2> <a", ' class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors no-underline text-center" data-astro-cid-k3puxlbu>\nView Full Menu\n</a> </section> </main> </div> <div id="spa-container" style="display: none;" data-astro-cid-k3puxlbu> ', " </div> ", " ", " </body> </html>"])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": pageTitle, "description": pageDescription, "data-astro-cid-k3puxlbu": true }), addAttribute(canonicalUrl, "href"), addAttribute(pageTitle, "content"), addAttribute(pageDescription, "content"), addAttribute(canonicalUrl, "content"), addAttribute(menuItem.price ? Number(menuItem.price).toFixed(2) : "0.00", "content"), addAttribute(pageTitle, "content"), addAttribute(pageDescription, "content"), unescapeHTML(JSON.stringify(structuredData)), unescapeHTML(JSON.stringify(breadcrumbData)), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-k3puxlbu": true }), renderComponent($$result, "Breadcrumb", $$Breadcrumb, { "items": [
    { label: "Home", href: "/" },
    { label: restaurantData.city_name, href: `/restaurants/${city}` },
    { label: restaurantData.name, href: `/restaurants/${city}/${restaurant}` },
    { label: menuItem.name }
  ], "data-astro-cid-k3puxlbu": true }), renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "margin": "mb-6", "align": "center", "variant": "menuItem", "data-astro-cid-k3puxlbu": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col w-full" data-astro-cid-k3puxlbu> <header class="mb-4" data-astro-cid-k3puxlbu> <h1 class="text-3xl font-bold text-white mb-2" data-astro-cid-k3puxlbu>${menuItem.name}</h1> <p class="text-lg text-white/90 mb-2" data-astro-cid-k3puxlbu>
at <a${addAttribute(`/restaurants/${city}/${restaurant}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors font-semibold" data-astro-cid-k3puxlbu>${restaurantData.name}</a> ${restaurantData.city_name && renderTemplate`<span data-astro-cid-k3puxlbu> in ${restaurantData.city_name}</span>`} </p> <p class="text-sm text-white/70" data-astro-cid-k3puxlbu>${restaurantData.address?.replace(/\bCA\b/g, "California")}</p> </header> <div class="mb-4" data-astro-cid-k3puxlbu> <div class="text-2xl font-bold text-white mb-4" data-astro-cid-k3puxlbu>
$${menuItem.price ? Number(menuItem.price).toFixed(2) : "Price varies"} </div> ${menuItem.category && renderTemplate`<p class="text-sm text-white/80 mb-2" data-astro-cid-k3puxlbu>
Category: <span class="font-semibold text-white" data-astro-cid-k3puxlbu>${menuItem.category}</span> </p>`} </div> ${ingredients.length > 0 && renderTemplate`<section class="mb-4" data-astro-cid-k3puxlbu> <h2 class="text-xl font-semibold mb-3 text-white" data-astro-cid-k3puxlbu>Ingredients</h2> <div class="flex flex-wrap gap-2" data-astro-cid-k3puxlbu> ${ingredients.map((ing) => {
    const ingSlug = ing.ingredients_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return renderTemplate`<a${addAttribute(`/restaurants/${city}/${restaurant}/ingredients/${ingSlug}`, "href")} class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded hover:bg-white/30 transition-colors text-sm no-underline border border-white/30" data-astro-cid-k3puxlbu> ${ing.ingredients_name} </a>`;
  })} </div> </section>`} </div> <div class="flex items-center max-lg:w-full" data-astro-cid-k3puxlbu> ${renderComponent($$result2, "OrderButtonWithAuth", null, { "restaurantId": restaurantData.id, "client:only": "react", "client:component-hydration": "only", "data-astro-cid-k3puxlbu": true, "client:component-path": "@/components/users/nav/OrderButtonWithAuth.jsx", "client:component-export": "default" })} </div> ` }), restaurantData.name, addAttribute(`/restaurants/${city}/${restaurant}`, "href"), renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-k3puxlbu": true, "client:component-path": "@/components/SSRAppWrapper.jsx", "client:component-export": "default" }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-k3puxlbu": true }), renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/menu/[item].astro?astro&type=script&index=0&lang.ts"));
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/menu/[item].astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/menu/[item].astro";
const $$url = "/restaurants/[city]/[restaurant]/menu/[item]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$item,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
