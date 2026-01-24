import { c as createAstro, a as createComponent, e as renderTemplate, d as renderScript, r as renderComponent, f as addAttribute, b as renderHead, u as unescapeHTML } from '../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                  */
import { b as $$Footer, a as $$Header, $ as $$BaseHead } from '../chunks/Footer_D0LEFTjD.mjs';
import { R as ResponsiveFlexRow } from '../chunks/ResponsiveFlexRow_Cgvm_9h1.mjs';
import { S as SITE_TITLE } from '../chunks/consts_BJWxdR8O.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  let cities = [];
  const apiBase = Astro2.url.origin;
  const res = await fetch(`${apiBase}/api/restaurant-cities`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (!res.ok) {
    throw new Error(`Failed to load restaurant cities: ${res.status}`);
  }
  cities = await res.json();
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": Astro2.url.origin,
    name: SITE_TITLE,
    description: "Food delivery service in Riverside County, California",
    url: Astro2.url.origin,
    address: {
      "@type": "PostalAddress",
      addressRegion: "CA",
      addressCountry: "US"
    },
    areaServed: {
      "@type": "State",
      name: "California"
    },
    sameAs: [
      "https://www.linkedin.com/in/christopher-herre-04a59511a/",
      "https://github.com/ChristopherHerre/RivCoDelivery"
    ]
  };
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_TITLE,
    url: Astro2.url.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${Astro2.url.origin}/restaurants/{search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head>', '<script type="application/ld+json">', '<\/script><script type="application/ld+json">', "<\/script>", "</head> <body> ", ' <!-- SSR content - visible by default for SEO, hidden if user is logged in --> <div id="ssr-content"> <main class="mx-auto"> <header class="mb-6"> <h1 class="text-3xl font-bold text-gray-900 mb-2">Restaurants by City</h1> <p class="text-lg text-gray-700 mb-2">\nChoose a city to see restaurants available for delivery with ', ".\n</p> </header> ", ' </main> </div> <!-- SPA container - wrapper checks auth before rendering App --> <div id="spa-container" style="display: none;"> ', " </div> ", " <!-- Client-side auth check --> ", " </body> </html>"])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": `Food Delivery in Riverside County, CA | Order Online | ${SITE_TITLE}`, "description": `Order food delivery from top restaurants in Riverside County, California. Fast delivery, easy online ordering. Browse menus by city and place your order today with ${SITE_TITLE}.` }), unescapeHTML(JSON.stringify(organizationData)), unescapeHTML(JSON.stringify(websiteData)), renderHead(), renderComponent($$result, "Header", $$Header, {}), SITE_TITLE, cities.length === 0 ? renderTemplate`<p class="text-gray-600">No cities found yet.</p>` : renderTemplate`<div class="row flex flex-wrap -mx-3"> ${cities.map((city) => renderTemplate`<div class="w-full md:w-1/2 px-3 mb-3"${addAttribute(city.city_slug, "key")}> ${renderComponent($$result, "ResponsiveFlexRow", ResponsiveFlexRow, { "card": true, "align": "stretch", "variant": "city" }, { "default": async ($$result2) => renderTemplate` <div class="flex-1 flex flex-col"> <h2 class="text-lg font-semibold mb-2"> <a${addAttribute(`/restaurants/${city.city_slug}`, "href")} class="text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors">
Restaurants in ${city.city_name}, California
</a> </h2> </div> ` })} </div>`)} </div>`, renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/SSRAppWrapper.jsx", "client:component-export": "default" }), renderComponent($$result, "Footer", $$Footer, {}), renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/index.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/index.astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
