import { c as createAstro, a as createComponent, e as renderTemplate, d as renderScript, r as renderComponent, f as addAttribute, b as renderHead, u as unescapeHTML } from '../../../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                           */
import { b as $$Footer, a as $$Header, $ as $$BaseHead } from '../../../../chunks/Footer_D0LEFTjD.mjs';
import { $ as $$Breadcrumb } from '../../../../chunks/Breadcrumb_Di5RKlof.mjs';
import { R as ResponsiveFlexRow } from '../../../../chunks/ResponsiveFlexRow_Cgvm_9h1.mjs';
import { $ as $$LikeDisplay } from '../../../../chunks/LikeDisplay_B8lWz8ew.mjs';
/* empty css                                               */
export { renderers } from '../../../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$category = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$category;
  const { city, category } = Astro2.params;
  let restaurants = [];
  let cityName = "this area";
  let categoryName = category ? category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "";
  let actualCategoryName = "";
  const apiBase = Astro2.url.origin;
  const cityRes = await fetch(
    `${apiBase}/api/restaurants-by-city?city_slug=${encodeURIComponent(city)}`,
    {
      method: "GET",
      headers: { accept: "application/json" }
    }
  );
  if (cityRes.ok) {
    const allRestaurants = await cityRes.json();
    if (allRestaurants.length > 0) {
      cityName = allRestaurants[0].city_name ?? "this area";
      const categorySlug = category.toLowerCase();
      const matchingCategory = allRestaurants.find((r) => {
        if (!r.category) return false;
        const rCategorySlug = r.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return rCategorySlug === categorySlug;
      });
      if (matchingCategory) {
        actualCategoryName = matchingCategory.category;
        const categoryRes = await fetch(
          `${apiBase}/api/public/restaurants-by-city-and-category?city_slug=${encodeURIComponent(city)}&category=${encodeURIComponent(actualCategoryName)}`,
          {
            method: "GET",
            headers: { accept: "application/json" }
          }
        );
        if (categoryRes.ok) {
          restaurants = await categoryRes.json();
        }
      }
    }
  }
  const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const pageTitle = actualCategoryName ? `${actualCategoryName} Delivery in ${cityName}, CA | Order Online | RivCoDelivery` : `Food Delivery in ${cityName}, CA | Order Online | RivCoDelivery`;
  const pageDescription = actualCategoryName ? `Order ${actualCategoryName.toLowerCase()} delivery from top restaurants in ${cityName}, California. Browse ${actualCategoryName.toLowerCase()} menus, compare prices, and get fast delivery. Easy online ordering with RivCoDelivery.` : `Order food delivery from top restaurants in ${cityName}, California. Browse menus, compare prices, and get fast delivery. Easy online ordering with RivCoDelivery.`;
  const canonicalUrl = new URL(Astro2.url.pathname, Astro2.site);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl.toString(),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: restaurants.length,
      itemListElement: restaurants.map((r, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Restaurant",
          name: r.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: r.address,
            addressLocality: r.city_name || "",
            addressCountry: "US"
          },
          servesCuisine: r.category,
          url: `${Astro2.url.origin}/restaurants/${city}/${r.id}-${slugify(r.name)}`
        }
      }))
    }
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: Astro2.site + "/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cityName,
        item: Astro2.site + `/restaurants/${city}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: actualCategoryName || categoryName,
        item: canonicalUrl.toString()
      }
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-i2xfmd2x> <head>', '<link rel="canonical"', '><script type="application/ld+json">', '<\/script><script type="application/ld+json">', "<\/script>", "</head> <body data-astro-cid-i2xfmd2x> ", ' <!-- SSR content - visible by default for SEO, hidden if user is logged in --> <div id="ssr-content" data-astro-cid-i2xfmd2x> <main class="mx-auto" data-astro-cid-i2xfmd2x> ', ' <header class="mb-6" data-astro-cid-i2xfmd2x> <h1 class="text-3xl font-bold text-gray-900 mb-2" data-astro-cid-i2xfmd2x> ', " in ", " </h1> ", " </header> ", ' </main> </div> <!-- SPA container - wrapper checks auth before rendering App --> <div id="spa-container" style="display: none;" data-astro-cid-i2xfmd2x> ', " </div> ", " <!-- Client-side auth check --> ", " </body> </html>"])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": pageTitle, "description": pageDescription, "data-astro-cid-i2xfmd2x": true }), addAttribute(canonicalUrl, "href"), unescapeHTML(JSON.stringify(structuredData)), unescapeHTML(JSON.stringify(breadcrumbData)), renderHead(), renderComponent($$result, "Header", $$Header, { "data-astro-cid-i2xfmd2x": true }), renderComponent($$result, "Breadcrumb", $$Breadcrumb, { "items": [
    { label: "Home", href: "/" },
    { label: cityName, href: `/restaurants/${city}` },
    { label: actualCategoryName || categoryName }
  ], "data-astro-cid-i2xfmd2x": true }), actualCategoryName || categoryName, cityName, restaurants.length > 0 && renderTemplate`<p class="text-lg text-gray-700 mb-2" data-astro-cid-i2xfmd2x>
Found ${restaurants.length} restaurant${restaurants.length !== 1 ? "s" : ""} in this category
</p>`, restaurants.length === 0 ? renderTemplate`<p class="text-gray-600" data-astro-cid-i2xfmd2x>No restaurants found in this category for ${cityName} yet.</p>` : renderTemplate`<div class="row flex flex-wrap -mx-3" data-astro-cid-i2xfmd2x> ${restaurants.map((r) => {
    const slug = slugify(r.name);
    return renderTemplate`<div class="w-full md:w-1/2 px-3 mb-3"${addAttribute(r.id, "key")} data-astro-cid-i2xfmd2x> ${renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "card": true, "align": "stretch", "variant": "restaurant", "data-astro-cid-i2xfmd2x": true }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col" data-astro-cid-i2xfmd2x> <h2 class="text-lg font-semibold mb-2" data-astro-cid-i2xfmd2x> <a${addAttribute(`/restaurants/${city}/${r.id}-${slug}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors" data-astro-cid-i2xfmd2x> ${r.name} </a> </h2> <p class="mb-1 text-base" data-astro-cid-i2xfmd2x> <strong class="font-semibold text-white" data-astro-cid-i2xfmd2x>${r.category}</strong> </p> <p class="mb-2 text-base text-white/80" data-astro-cid-i2xfmd2x>${r.address}</p> </div> <div class="flex items-center gap-2 max-lg:w-full" data-astro-cid-i2xfmd2x> <a${addAttribute(`/restaurants/${city}/${r.id}-${slug}`, "href")} class="inline-block px-5 py-2.5 bg-blue-600 text-white text-base font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline whitespace-nowrap max-lg:w-full max-lg:whitespace-normal max-lg:text-center" data-astro-cid-i2xfmd2x>
View menu
</a> ${renderComponent($$result2, "LikeDisplay", $$LikeDisplay, { "itemId": r.id, "itemType": "restaurant", "likes": r.likes || 0, "data-astro-cid-i2xfmd2x": true })} </div> ` })} </div>`;
  })} </div>`, renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-i2xfmd2x": true, "client:component-path": "@/components/SSRAppWrapper.jsx", "client:component-export": "default" }), renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-i2xfmd2x": true }), renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/categories/[category].astro?astro&type=script&index=0&lang.ts"));
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/categories/[category].astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/categories/[category].astro";
const $$url = "/restaurants/[city]/categories/[category]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$category,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
