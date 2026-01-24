import { c as createAstro, a as createComponent, m as maybeRenderHead, f as addAttribute, e as renderTemplate } from './astro/server_C3i_pojm.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://rivcodelivery.com");
const $$FormattedDate = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$FormattedDate;
  const { date } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<time${addAttribute(date.toISOString(), "datetime")}> ${date.toLocaleDateString("en-us", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })} </time>`;
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/FormattedDate.astro", void 0);

export { $$FormattedDate as $ };
