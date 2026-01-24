import { c as createAstro, a as createComponent, e as renderTemplate, d as renderScript, r as renderComponent, f as addAttribute, b as renderHead, u as unescapeHTML } from '../../../../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                              */
import { b as $$Footer, a as $$Header, $ as $$BaseHead } from '../../../../../chunks/Footer_D0LEFTjD.mjs';
import { $ as $$Breadcrumb } from '../../../../../chunks/Breadcrumb_Di5RKlof.mjs';
import { R as ResponsiveFlexRow } from '../../../../../chunks/ResponsiveFlexRow_Cgvm_9h1.mjs';
import { $ as $$LikeDisplay } from '../../../../../chunks/LikeDisplay_B8lWz8ew.mjs';
/* empty css                                                    */
export { renderers } from '../../../../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$ingredient = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ingredient;
  const { city, restaurant, ingredient } = Astro2.params;
  const restaurantId = Number((restaurant ?? "").split("-")[0]);
  if (!restaurantId || Number.isNaN(restaurantId)) {
    return Astro2.redirect("/404");
  }
  let restaurantData = null;
  let menuItems = [];
  let ingredientName = "";
  const apiBase = Astro2.url.origin;
  const restaurantRes = await fetch(`${apiBase}/api/public/restaurants/${restaurantId}`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (!restaurantRes.ok || restaurantRes.status === 404) {
    return Astro2.redirect("/404");
  }
  restaurantData = await restaurantRes.json();
  if (restaurantData.city_slug && restaurantData.city_slug !== city) {
    return Astro2.redirect("/404");
  }
  const ingredientsRes = await fetch(`${apiBase}/api/public/restaurants/${restaurantId}/ingredients/${ingredient}`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (ingredientsRes.ok) {
    menuItems = await ingredientsRes.json();
    if (menuItems.length > 0) {
      ingredientName = menuItems[0].ingredients_name || ingredient.replace(/-/g, " ");
    }
  } else {
    return Astro2.redirect("/404");
  }
  if (menuItems.length === 0) {
    return Astro2.redirect("/404");
  }
  const slugify = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };
  const canonicalUrl = `${Astro2.url.origin}/restaurants/${city}/${restaurant}/ingredients/${ingredient}`;
  const pageTitle = `Menu Items with ${ingredientName} from ${restaurantData.name} in ${restaurantData.city_name}, CA | Order Online | RivCoDelivery`;
  const pageDescription = `Find menu items featuring ${ingredientName} from ${restaurantData.name} in ${restaurantData.city_name}, California. Browse dishes, compare prices, and order delivery online with RivCoDelivery.`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    about: {
      "@type": "Thing",
      name: ingredientName
    }
  };
  const itemListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Menu items with ${ingredientName}`,
    itemListElement: menuItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: item.name,
        offers: {
          "@type": "Offer",
          price: item.price ? Number(item.price).toFixed(2) : "0.00",
          priceCurrency: "USD"
        }
      }
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
        name: ingredientName,
        item: canonicalUrl
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-6xy5mxld> <head>', '<link rel="canonical"', '><meta property="og:type" content="website"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:url"', '><meta name="twitter:card" content="summary"><meta name="twitter:title"', '><meta name="twitter:description"', '><script type="application/ld+json">', '<\/script><script type="application/ld+json">', '<\/script><script type="application/ld+json">', "<\/script>", "</head> <body data-astro-cid-6xy5mxld> ", ' <div id="ssr-content" data-astro-cid-6xy5mxld> <main class="mx-auto" data-astro-cid-6xy5mxld> ', " ", " ", ' <section class="mb-6" data-astro-cid-6xy5mxld> <h2 class="text-xl font-semibold mb-3 text-gray-900" data-astro-cid-6xy5mxld>More from ', "</h2> <a", ' class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors no-underline text-center" data-astro-cid-6xy5mxld>\nView Full Menu\n</a> </section> </main> </div> <div id="spa-container" style="display: none;" data-astro-cid-6xy5mxld> ', " </div> ", " ", " </body> </html>"])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": pageTitle, "description": pageDescription, "data-astro-cid-6xy5mxld": true }), addAttribute(canonicalUrl, "href"), addAttribute(pageTitle, "content"), addAttribute(pageDescription, "content"), addAttribute(canonicalUrl, "content"), addAttribute(pageTitle, "content"), addAttribute(pageDescription, "content"), unescapeHTML(JSON.stringify(structuredData)), unescapeHTML(JSON.stringify(itemListData)), unescapeHTML(JSON.stringify(breadcrumbData)), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-6xy5mxld": true }), renderComponent($$result, "Breadcrumb", $$Breadcrumb, { "items": [
    { label: "Home", href: "/" },
    { label: restaurantData.city_name, href: `/restaurants/${city}` },
    { label: restaurantData.name, href: `/restaurants/${city}/${restaurant}` },
    { label: ingredientName }
  ], "data-astro-cid-6xy5mxld": true }), renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "margin": "mb-6", "align": "center", "variant": "ingredient", "data-astro-cid-6xy5mxld": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col w-full" data-astro-cid-6xy5mxld> <header class="mb-4" data-astro-cid-6xy5mxld> <h1 class="text-3xl font-bold text-white mb-2" data-astro-cid-6xy5mxld>Menu Items with ${ingredientName}</h1> <p class="text-lg text-white/90 mb-2" data-astro-cid-6xy5mxld>
at <a${addAttribute(`/restaurants/${city}/${restaurant}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors font-semibold" data-astro-cid-6xy5mxld>${restaurantData.name}</a> ${restaurantData.city_name && renderTemplate`<span data-astro-cid-6xy5mxld> in ${restaurantData.city_name}</span>`} </p> <p class="text-sm text-white/70 mb-2" data-astro-cid-6xy5mxld>${restaurantData.address?.replace(/\bCA\b/g, "California")}</p> <p class="text-sm text-white/80" data-astro-cid-6xy5mxld> <a${addAttribute(`/ingredients/${ingredient}`, "href")} class="text-white no-underline hover:text-blue-400" data-astro-cid-6xy5mxld>
View all restaurants with ${ingredientName} </a> </p> </header> </div> <div class="flex items-center max-lg:w-full" data-astro-cid-6xy5mxld> ${renderComponent($$result2, "OrderButtonWithAuth", null, { "restaurantId": restaurantData.id, "client:only": "react", "client:component-hydration": "only", "data-astro-cid-6xy5mxld": true, "client:component-path": "@/components/users/nav/OrderButtonWithAuth.jsx", "client:component-export": "default" })} </div> ` }), menuItems.length > 0 ? renderTemplate`<section class="mb-6" data-astro-cid-6xy5mxld> <h2 class="text-xl font-semibold mb-4 text-gray-900" data-astro-cid-6xy5mxld>Menu Items (${menuItems.length})</h2> <div class="flex flex-wrap -mx-3" data-astro-cid-6xy5mxld> ${menuItems.map((item) => {
    const itemSlug = slugify(item.name);
    return renderTemplate`<div class="w-full md:w-1/2 px-3 mb-3"${addAttribute(item.id, "key")} data-astro-cid-6xy5mxld> ${renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "card": true, "vertical": true, "align": "stretch", "variant": "menu", "data-astro-cid-6xy5mxld": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col" data-astro-cid-6xy5mxld> <h3 class="text-lg font-semibold mb-2" data-astro-cid-6xy5mxld> <a${addAttribute(`/restaurants/${city}/${restaurant}/menu/${itemSlug}-${item.id}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors" data-astro-cid-6xy5mxld> ${item.name} </a> </h3> ${item.category && renderTemplate`<p class="text-sm text-white/80 mb-2" data-astro-cid-6xy5mxld>${item.category}</p>`} ${renderComponent($$result2, "ResponsiveFlexRow", ResponsiveFlexRow, { "borderTop": true, "margin": "mt-auto", "variant": "nested", "data-astro-cid-6xy5mxld": true }, { "default": async ($$result3) => renderTemplate` <span class="font-bold text-lg text-white" data-astro-cid-6xy5mxld>
$${item.price ? Number(item.price).toFixed(2) : "Price varies"} </span> <div class="flex items-center gap-2" data-astro-cid-6xy5mxld> <a${addAttribute(`/restaurants/${city}/${restaurant}/menu/${itemSlug}-${item.id}`, "href")} class="inline-block px-5 py-2.5 bg-blue-600 text-white text-base font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer max-lg:w-full max-lg:text-center" data-astro-cid-6xy5mxld>
View details
</a> ${renderComponent($$result3, "LikeDisplay", $$LikeDisplay, { "itemId": item.id, "itemType": "menu-item", "likes": item.likes || 0, "data-astro-cid-6xy5mxld": true })} </div> ` })} </div> ` })} </div>`;
  })} </div> </section>` : renderTemplate`<p class="text-gray-600" data-astro-cid-6xy5mxld>No menu items found with this ingredient.</p>`, restaurantData.name, addAttribute(`/restaurants/${city}/${restaurant}`, "href"), renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-6xy5mxld": true, "client:component-path": "@/components/SSRAppWrapper.jsx", "client:component-export": "default" }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-6xy5mxld": true }), renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/ingredients/[ingredient].astro?astro&type=script&index=0&lang.ts"));
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/ingredients/[ingredient].astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/ingredients/[ingredient].astro";
const $$url = "/restaurants/[city]/[restaurant]/ingredients/[ingredient]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$ingredient,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
