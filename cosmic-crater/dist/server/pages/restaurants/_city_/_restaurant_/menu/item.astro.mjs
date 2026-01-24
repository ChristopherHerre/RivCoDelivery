import { c as createAstro, a as createComponent } from '../../../../../chunks/astro/server_C3i_pojm.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../../../../../renderers.mjs';

const $$Astro = createAstro("https://rivcodelivery.com");
const $$Item = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Item;
  const { city, restaurant } = Astro2.params;
  const itemId = Astro2.url.searchParams.get("item");
  if (!itemId) {
    return Astro2.redirect(`/restaurants/${city}/${restaurant}`);
  }
  const menuItemId = Number(itemId);
  if (!menuItemId || Number.isNaN(menuItemId)) {
    return Astro2.redirect(`/restaurants/${city}/${restaurant}`);
  }
  const restaurantId = Number((restaurant ?? "").split("-")[0]);
  if (!restaurantId || Number.isNaN(restaurantId)) {
    return Astro2.redirect("/404");
  }
  const apiBase = Astro2.url.origin;
  const menuItemRes = await fetch(`${apiBase}/api/public/menu-items/${menuItemId}`, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  if (!menuItemRes.ok || menuItemRes.status === 404) {
    return Astro2.redirect(`/restaurants/${city}/${restaurant}`);
  }
  const menuItem = await menuItemRes.json();
  if (menuItem.restaurant_id !== restaurantId) {
    return Astro2.redirect(`/restaurants/${city}/${restaurant}`);
  }
  const slugify = (name) => {
    if (!name) return "";
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };
  const itemSlug = slugify(menuItem.name);
  return Astro2.redirect(`/restaurants/${city}/${restaurant}/menu/${itemSlug}-${menuItemId}`, 301);
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/menu/item.astro", void 0);

const $$file = "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/pages/restaurants/[city]/[restaurant]/menu/item.astro";
const $$url = "/restaurants/[city]/[restaurant]/menu/item";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Item,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
