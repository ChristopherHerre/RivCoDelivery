import { a as createComponent, r as renderComponent, b as renderHead, d as renderScript, e as renderTemplate } from '../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
/* empty css                                  */
import { $ as $$BaseHead, a as $$Header, b as $$Footer } from '../chunks/Footer_D0LEFTjD.mjs';
import { S as SITE_TITLE } from '../chunks/consts_BJWxdR8O.mjs';
export { renderers } from '../renderers.mjs';

const $$Admin = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en"> <head>${renderComponent($$result, "BaseHead", $$BaseHead, { "title": `Admin Panel | ${SITE_TITLE}`, "description": `Admin panel for managing restaurants and menu items on ${SITE_TITLE}` })}${renderHead()}</head> <body> ${renderComponent($$result, "Header", $$Header, {})} <!-- SSR content - visible by default for SEO, hidden if user is logged in --> <div id="ssr-content"> <main class="mx-auto p-4"> <header class="mb-6"> <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1> <p class="text-lg text-gray-700 mb-2">
Please sign in to access the admin panel.
</p> </header> </main> </div> <!-- SPA container - wrapper checks auth before rendering App --> <div id="spa-container" style="display: none;"> ${renderComponent($$result, "SSRAppWrapper", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/SSRAppWrapper.jsx", "client:component-export": "default" })} </div> ${renderComponent($$result, "Footer", $$Footer, {})} <!-- Client-side auth check --> ${renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/admin.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/admin.astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/admin.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Admin,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
