import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_Jl5r--_l.mjs';
import { manifest } from './manifest_CajOa4xQ.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/admin.astro.mjs');
const _page3 = () => import('./pages/blog.astro.mjs');
const _page4 = () => import('./pages/blog/_---slug_.astro.mjs');
const _page5 = () => import('./pages/ingredients/_ingredient_.astro.mjs');
const _page6 = () => import('./pages/orders.astro.mjs');
const _page7 = () => import('./pages/places/autocomplete.astro.mjs');
const _page8 = () => import('./pages/places/details.astro.mjs');
const _page9 = () => import('./pages/restaurants/_city_/categories/_category_.astro.mjs');
const _page10 = () => import('./pages/restaurants/_city_/_restaurant_/ingredients/_ingredient_.astro.mjs');
const _page11 = () => import('./pages/restaurants/_city_/_restaurant_/menu/item.astro.mjs');
const _page12 = () => import('./pages/restaurants/_city_/_restaurant_/menu/_item_.astro.mjs');
const _page13 = () => import('./pages/restaurants/_city_/_restaurant_.astro.mjs');
const _page14 = () => import('./pages/restaurants/_city_.astro.mjs');
const _page15 = () => import('./pages/rss.xml.astro.mjs');
const _page16 = () => import('./pages/sitemap-menu-items.xml.astro.mjs');
const _page17 = () => import('./pages/user-orders.astro.mjs');
const _page18 = () => import('./pages/users.astro.mjs');
const _page19 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/node.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/admin.astro", _page2],
    ["src/pages/blog/index.astro", _page3],
    ["src/pages/blog/[...slug].astro", _page4],
    ["src/pages/ingredients/[ingredient].astro", _page5],
    ["src/pages/orders.astro", _page6],
    ["src/pages/places/autocomplete.ts", _page7],
    ["src/pages/places/details.ts", _page8],
    ["src/pages/restaurants/[city]/categories/[category].astro", _page9],
    ["src/pages/restaurants/[city]/[restaurant]/ingredients/[ingredient].astro", _page10],
    ["src/pages/restaurants/[city]/[restaurant]/menu/item.astro", _page11],
    ["src/pages/restaurants/[city]/[restaurant]/menu/[item].astro", _page12],
    ["src/pages/restaurants/[city]/[restaurant].astro", _page13],
    ["src/pages/restaurants/[city].astro", _page14],
    ["src/pages/rss.xml.js", _page15],
    ["src/pages/sitemap-menu-items.xml.ts", _page16],
    ["src/pages/user-orders.astro", _page17],
    ["src/pages/users.astro", _page18],
    ["src/pages/index.astro", _page19]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "mode": "standalone",
    "client": "file:///Users/chrisherre/Downloads/RivCoDelivery-RBAC%202/cosmic-crater/dist/client/",
    "server": "file:///Users/chrisherre/Downloads/RivCoDelivery-RBAC%202/cosmic-crater/dist/server/",
    "host": false,
    "port": 4321,
    "assets": "_astro",
    "experimentalStaticHeaders": false
};
const _exports = createExports(_manifest, _args);
const handler = _exports['handler'];
const startServer = _exports['startServer'];
const options = _exports['options'];
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { handler, options, pageMap, startServer };
