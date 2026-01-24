import { c as createAstro, a as createComponent, m as maybeRenderHead, f as addAttribute, d as renderScript, e as renderTemplate } from './astro/server_C3i_pojm.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://rivcodelivery.com");
const $$LikeDisplay = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$LikeDisplay;
  const { itemId, itemType, likes } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="like-display"${addAttribute(itemId, "data-item-id")}${addAttribute(itemType, "data-item-type")}${addAttribute(likes, "data-likes")}> <span class="text-sm text-white/80"> ${likes} ${likes === 1 ? "like" : "likes"} </span> </div> ${renderScript($$result, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/common/LikeDisplay.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/chrisherre/Downloads/RivCoDelivery-RBAC 2/cosmic-crater/src/components/common/LikeDisplay.astro", void 0);

export { $$LikeDisplay as $ };
