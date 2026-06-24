# Optional Vite Integration

`van-stack/vite` is optional. It exists for browser CSR apps that want Vite to run filesystem route discovery during dev/build and expose a browser-safe route module.

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

Managed CSR navigation scrolls to the top after successful forward navigations and preserves browser back/forward scroll by default. Override with `scroll` when needed, for example `scroll: { onNavigate: "preserve" }`.

The virtual module is generated as browser-safe JavaScript. It points route modules back to the real `src/routes/*` files, keeps official `vanjs-core` and optional `vanjs-ext` imports on the browser packages, and omits server-only route files such as `loader.ts`, `action.ts`, `entries.ts`, and `route.ts`.

## Compatibility

The Vite integration does not install Van compatibility aliases. Browser CSR code should resolve `vanjs-core` and optional `vanjs-ext` imports to the real browser packages.

Compatibility shims are reserved for Node and Bun SSR/SSG entrypoints where browser-oriented Van imports need to run against the server-safe render environment.

## Node And Build Usage

Use `loadRoutes({ root: "src/routes" })` from `van-stack/compiler` in Node, SSR, SSG, and custom build tooling. If a custom pipeline needs an emitted artifact, `writeRouteManifest({ root: "src/routes" })` can still write `.van-stack/routes.generated.ts`; that path is optional and separate from the default Vite browser CSR route module.

If server or SSG entrypoints run under Bun, pair Vite setup with the Bun runtime guidance in [Bun Runtime](./bun.md).
