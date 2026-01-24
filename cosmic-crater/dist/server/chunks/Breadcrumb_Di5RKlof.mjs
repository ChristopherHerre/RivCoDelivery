import { c as createAstro, a as createComponent, e as renderTemplate, m as maybeRenderHead, f as addAttribute, u as unescapeHTML } from './astro/server_C3i_pojm.mjs';
import 'piccolore';
import 'clsx';

function generateBreadcrumbJsonLd(items, baseUrl = typeof window !== "undefined" ? window.location.origin : "") {
  if (!items || items.length === 0) {
    return {};
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const position = index + 1;
      const itemUrl = item.href ? item.href.startsWith("http") ? item.href : `${baseUrl}${item.href}` : baseUrl;
      return {
        "@type": "ListItem",
        position,
        name: item.label,
        item: itemUrl
      };
    })
  };
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://rivcodelivery.com");
const $$Breadcrumb = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumb;
  const { items, generateJsonLd = false, baseUrl = Astro2.url.origin } = Astro2.props;
  const jsonLd = generateJsonLd && items && items.length > 0 ? generateBreadcrumbJsonLd(items, baseUrl) : null;
  return renderTemplate`${items && items.length > 0 && renderTemplate`${maybeRenderHead()}<nav class="breadcrumb-nav" aria-label="Breadcrumb"><ol class="breadcrumb-list flex flex-wrap items-center gap-2 text-sm">${items.map((item, index) => {
    const isLast = index === items.length - 1;
    const isLink = item.href && !isLast;
    return renderTemplate`<li class="breadcrumb-item flex items-center gap-2">${isLink ? renderTemplate`<button type="button"${addAttribute(`window.location.href='${item.href}'`, "onclick")} class="rounded transition-all duration-200 ease-in-out cursor-pointer font-normal focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 bg-gray-300 text-black border border-gray-400 hover:bg-transparent hover:text-gray-300 hover:border-gray-400 active:scale-95 active:opacity-90 px-2 py-1 text-sm text-center flex items-center gap-2 justify-center whitespace-nowrap max-[320px]:!px-1.5 max-[320px]:!py-0.5 max-[320px]:!text-xs">${item.label}</button>` : renderTemplate`<span class="breadcrumb-current text-white font-semibold" aria-current="page">${item.label}</span>`}${!isLast && renderTemplate`<svg class="breadcrumb-separator text-secondary/50" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0L10.94 8a.75.75 0 0 1 0 1.06l-3.66 3.78a.75.75 0 1 1-1.06-1.06L9.38 8.5 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"></path></svg>`}</li>`;
  })}</ol></nav>`}${jsonLd && renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(jsonLd)))}`;
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/Breadcrumb.astro", void 0);

export { $$Breadcrumb as $ };
