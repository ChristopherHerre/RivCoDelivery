import { c as createAstro, a as createComponent, m as maybeRenderHead, f as addAttribute, g as renderSlot, e as renderTemplate } from './astro/server_C3i_pojm.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://rivcodelivery.com");
const $$Link = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Link;
  const { href, variant = "light", className = "", target, rel, style } = Astro2.props;
  let baseClasses = "";
  let variantClasses = "";
  switch (variant) {
    case "heading":
      variantClasses = "text-gray-900 hover:text-blue-600 transition-colors no-underline bg-transparent border-none p-0 cursor-pointer text-left font-semibold";
      break;
    case "gradient":
      variantClasses = "text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors";
      break;
    case "light":
      variantClasses = "text-blue-600 hover:underline no-underline";
      break;
    case "menu-item":
      variantClasses = "text-white no-underline hover:text-blue-400 text-left bg-transparent border-none p-0 cursor-pointer transition-colors";
      break;
    case "button":
      variantClasses = "inline-block px-5 py-2.5 bg-blue-600 text-white text-base font-normal rounded hover:bg-blue-700 active:bg-blue-800 transition-colors no-underline cursor-pointer max-lg:w-full max-lg:text-center";
      break;
    case "button-sm":
      variantClasses = "inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors no-underline text-center";
      break;
    case "text-sm":
      variantClasses = "text-blue-600 hover:underline text-sm";
      break;
    case "ingredient-tag":
      variantClasses = "inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded hover:bg-white/30 transition-colors text-sm no-underline border border-white/30";
      break;
  }
  const allClasses = `${baseClasses} ${variantClasses} ${className}`.trim();
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")}${addAttribute(allClasses, "class")}${addAttribute(target, "target")}${addAttribute(rel, "rel")}${addAttribute(style, "style")}> ${renderSlot($$result, $$slots["default"])} </a>`;
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/common/Link.astro", void 0);

export { $$Link as $ };
