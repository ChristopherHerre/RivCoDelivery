import { c as createAstro, a as createComponent, e as renderTemplate, d as renderScript, r as renderComponent, f as addAttribute, b as renderHead, u as unescapeHTML } from '../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                     */
import { b as $$Footer, a as $$Header, $ as $$BaseHead } from '../../chunks/Footer_D0LEFTjD.mjs';
import { $ as $$Breadcrumb } from '../../chunks/Breadcrumb_Di5RKlof.mjs';
import { R as ResponsiveFlexRow } from '../../chunks/ResponsiveFlexRow_Cgvm_9h1.mjs';
import { $ as $$Link } from '../../chunks/Link_CacYMVQe.mjs';
import { $ as $$LikeDisplay } from '../../chunks/LikeDisplay_B8lWz8ew.mjs';
/* empty css                                           */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$ingredient = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ingredient;
  const { ingredient } = Astro2.params;
  let menuItems = [];
  let ingredientName = "";
  let restaurantsMap = /* @__PURE__ */ new Map();
  const apiBase = Astro2.url.origin;
  const ingredientsRes = await fetch(`${apiBase}/api/public/ingredients/${ingredient}`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (ingredientsRes.ok) {
    menuItems = await ingredientsRes.json();
    if (menuItems.length > 0) {
      ingredientName = menuItems[0].ingredients_name || ingredient.replace(/-/g, " ");
      menuItems.forEach((item) => {
        if (!restaurantsMap.has(item.restaurant_id)) {
          restaurantsMap.set(item.restaurant_id, {
            restaurant_id: item.restaurant_id,
            restaurant_name: item.restaurant_name,
            city_name: item.city_name,
            city_slug: item.city_slug,
            items: []
          });
        }
        restaurantsMap.get(item.restaurant_id).items.push(item);
      });
    }
  }
  if (menuItems.length === 0) {
    return Astro2.redirect("/404");
  }
  const restaurants = Array.from(restaurantsMap.values());
  const slugify = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };
  const canonicalUrl = `${Astro2.url.origin}/ingredients/${ingredient}`;
  const pageTitle = `Menu Items with ${ingredientName} | Order Online | RivCoDelivery`;
  const pageDescription = `Find menu items featuring ${ingredientName} from restaurants across Riverside County, California. Browse dishes, compare prices, and order delivery online with RivCoDelivery.`;
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
        brand: {
          "@type": "Restaurant",
          name: item.restaurant_name
        },
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
        name: ingredientName,
        item: canonicalUrl
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-yuzmxmkp> <head>', '<link rel="canonical"', '><meta property="og:type" content="website"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:url"', '><meta name="twitter:card" content="summary"><meta name="twitter:title"', '><meta name="twitter:description"', '><script type="application/ld+json">', '<\/script><script type="application/ld+json">', '<\/script><script type="application/ld+json">', "<\/script>", "</head> <body data-astro-cid-yuzmxmkp> ", ' <div id="ssr-content" data-astro-cid-yuzmxmkp> <main class="mx-auto" data-astro-cid-yuzmxmkp> ', " ", " ", ' </main> </div> <div id="spa-container" style="display: none;" data-astro-cid-yuzmxmkp> ', " </div> ", " ", " </body> </html>"])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": pageTitle, "description": pageDescription, "data-astro-cid-yuzmxmkp": true }), addAttribute(canonicalUrl, "href"), addAttribute(pageTitle, "content"), addAttribute(pageDescription, "content"), addAttribute(canonicalUrl, "content"), addAttribute(pageTitle, "content"), addAttribute(pageDescription, "content"), unescapeHTML(JSON.stringify(structuredData)), unescapeHTML(JSON.stringify(itemListData)), unescapeHTML(JSON.stringify(breadcrumbData)), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-yuzmxmkp": true }), renderComponent($$result, "Breadcrumb", $$Breadcrumb, { "items": [
    { label: "Home", href: "/" },
    { label: ingredientName }
  ], "data-astro-cid-yuzmxmkp": true }), renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "margin": "mb-6", "align": "center", "variant": "ingredient", "data-astro-cid-yuzmxmkp": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col w-full" data-astro-cid-yuzmxmkp> <header class="mb-4" data-astro-cid-yuzmxmkp> <h1 class="text-3xl font-bold text-white mb-2" data-astro-cid-yuzmxmkp>Menu Items with ${ingredientName}</h1> <p class="text-lg text-white/90 mb-2" data-astro-cid-yuzmxmkp>
Found ${menuItems.length} menu item${menuItems.length !== 1 ? "s" : ""} from ${restaurants.length} restaurant${restaurants.length !== 1 ? "s" : ""} in the Inland Empire.
</p> </header> </div> <div class="flex items-center max-lg:w-full" data-astro-cid-yuzmxmkp> ${renderComponent($$result2, "SSRGoogleSignIn", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-yuzmxmkp": true, "client:component-path": "@/components/users/nav/SSRGoogleSignIn.jsx", "client:component-export": "default" })} </div> ` }), restaurants.length > 0 ? renderTemplate`<div class="space-y-8" data-astro-cid-yuzmxmkp> ${restaurants.map((restaurant) => {
    const restaurantSlug = slugify(restaurant.restaurant_name);
    return renderTemplate`<section${addAttribute(restaurant.restaurant_id, "key")} class="mb-6" data-astro-cid-yuzmxmkp> <h2 class="text-2xl font-semibold mb-3 text-gray-900" data-astro-cid-yuzmxmkp> ${renderComponent($$result, "Link", $$Link, { "href": `/restaurants/${restaurant.city_slug}/${restaurant.restaurant_id}-${restaurantSlug}`, "variant": "heading", "data-astro-cid-yuzmxmkp": true }, { "default": async ($$result2) => renderTemplate`${restaurant.restaurant_name}${restaurant.city_name && ` in ${restaurant.city_name}`}` })} </h2> <div class="flex flex-wrap -mx-3" data-astro-cid-yuzmxmkp> ${restaurant.items.map((item) => {
      const itemSlug = slugify(item.name);
      return renderTemplate`<div class="w-full md:w-1/2 px-3 mb-3"${addAttribute(item.id, "key")} data-astro-cid-yuzmxmkp> ${renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "card": true, "vertical": true, "align": "stretch", "variant": "menu", "data-astro-cid-yuzmxmkp": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col" data-astro-cid-yuzmxmkp> <h3 class="text-lg font-semibold mb-2" data-astro-cid-yuzmxmkp> <a${addAttribute(`/restaurants/${restaurant.city_slug}/${restaurant.restaurant_id}-${restaurantSlug}/menu/${itemSlug}-${item.id}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors" data-astro-cid-yuzmxmkp> ${item.name} </a> </h3> ${item.category && renderTemplate`<p class="text-sm text-white/80 mb-2" data-astro-cid-yuzmxmkp>${item.category}</p>`} ${renderComponent($$result2, "ResponsiveFlexRow", ResponsiveFlexRow, { "borderTop": true, "margin": "mt-auto", "variant": "nested", "data-astro-cid-yuzmxmkp": true }, { "default": async ($$result3) => renderTemplate` <span class="font-bold text-lg text-white" data-astro-cid-yuzmxmkp>
$${item.price ? Number(item.price).toFixed(2) : "Price varies"} </span> <div class="flex items-center gap-2" data-astro-cid-yuzmxmkp> <a${addAttribute(`/restaurants/${restaurant.city_slug}/${restaurant.restaurant_id}-${restaurantSlug}/menu/${itemSlug}-${item.id}`, "href")} class="inline-block px-5 py-2.5 bg-blue-600 text-white text-base font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer max-lg:w-full max-lg:text-center" data-astro-cid-yuzmxmkp>
View details
</a> ${renderComponent($$result3, "LikeDisplay", $$LikeDisplay, { "itemId": item.id, "itemType": "menu-item", "likes": item.likes || 0, "data-astro-cid-yuzmxmkp": true })} </div> ` })} </div> ` })} </div>`;
    })} </div> <div class="mt-3" data-astro-cid-yuzmxmkp> ${renderComponent($$result, "Link", $$Link, { "href": `/restaurants/${restaurant.city_slug}/${restaurant.restaurant_id}-${restaurantSlug}/ingredients/${ingredient}`, "variant": "text-sm", "data-astro-cid-yuzmxmkp": true }, { "default": async ($$result2) => renderTemplate`
View all items with ${ingredientName} at ${restaurant.restaurant_name}` })} </div> </section>`;
  })} </div>` : renderTemplate`<p class="text-gray-600" data-astro-cid-yuzmxmkp>No menu items found with this ingredient.</p>`, renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-yuzmxmkp": true, "client:component-path": "@/components/SSRAppWrapper.jsx", "client:component-export": "default" }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-yuzmxmkp": true }), renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/ingredients/[ingredient].astro?astro&type=script&index=0&lang.ts"));
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/ingredients/[ingredient].astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/ingredients/[ingredient].astro";
const $$url = "/ingredients/[ingredient]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$ingredient,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
