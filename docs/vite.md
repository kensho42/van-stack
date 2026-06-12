# Optional Vite Integration

`van-stack/vite` is optional. It exists for browser CSR apps that want Vite to run filesystem route discovery during dev/build, expose a browser-safe route module, and, when opted in, resolve third-party Van packages through the active `van-stack/render` environment.

Route discovery still belongs to `van-stack/compiler`. The Vite plugin calls that compiler layer at dev/build time; browser code should not import `van-stack/compiler` directly.

## Browser CSR Routes

Configure Vite with the filesystem route root:

```ts
import { defineConfig } from "vite";
import { vanStackVite } from "van-stack/vite";

export default defineConfig({
  plugins: [vanStackVite({ routes: { root: "src/routes" } })],
});
```

Then import the official virtual route module in the browser entry:

```ts
/// <reference types="van-stack/vite/client" />
import routes from "virtual:van-stack/routes";
import { startClientApp } from "van-stack/csr";

const app = startClientApp({
  mode: "custom",
  routes,
  history: window.history,
});

await app.ready;
```

The virtual module is generated as browser-safe JavaScript. It points route modules back to the real `src/routes/*` files, imports `van-stack/csr` before route modules so `van-stack/render` is bound, and omits server-only route files such as `loader.ts`, `action.ts`, `entries.ts`, and `route.ts`.

## Compatibility

First-party route modules should import Van through `van-stack/render`. Imported packages that hard-import `vanjs-core` or `vanjs-ext` can still work in Vite browser apps when the app opts in:

```ts
import { defineConfig } from "vite";
import { vanStackVite } from "van-stack/vite";

export default defineConfig({
  plugins: [
    vanStackVite({
      routes: { root: "src/routes" },
      compatVanImports: true,
    }),
  ],
});
```

With `compatVanImports: true`, the plugin uses a guarded resolver instead of global aliases:

- app and third-party imports of `vanjs-core` and `vanjs-ext` resolve to VanStack compatibility modules
- VanStack internals and Van's own runtime packages resolve to the real `actual-vanjs-core` and `actual-vanjs-ext`

`getVanStackCompatAliases()` remains available for legacy Vitest or custom resolver setups that specifically need an alias array, but it is not the recommended Vite browser-app setup.

## Node And Build Usage

Use `loadRoutes({ root: "src/routes" })` from `van-stack/compiler` in Node, SSR, SSG, and custom build tooling. If a custom pipeline needs an emitted artifact, `writeRouteManifest({ root: "src/routes" })` can still write `.van-stack/routes.generated.ts`; that path is optional and separate from the default Vite browser CSR route module.

If server or SSG entrypoints run under Bun, pair Vite setup with the Bun runtime guidance in [Bun Runtime](./bun.md).
