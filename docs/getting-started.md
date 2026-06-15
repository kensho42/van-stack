# Getting Started

`van-stack` apps are organized around filesystem routes, hydration policies, and explicit runtime modes.

## MVP setup

1. Define routes under `src/routes`.
2. Use reserved filenames such as `page.ts`, `route.ts`, `layout.ts`, `loader.ts`, and `meta.ts`.
3. Use pathless route groups such as `(public)` and `(private)` when route concerns need separate layouts without separate URL prefixes.
4. Add pathless `@slot` directories such as `@sidebar` under a parent `layout.ts` when a route branch needs multiple persistent regions.
5. Load runtime routes from that tree with `loadRoutes({ root: "src/routes" })` in Node/build/server code, or with `virtual:van-stack/routes` in Vite browser CSR.
6. Choose whether the app runs in CSR, SSR, or SSG mode.
7. If the app has a client router, choose a CSR runtime mode:
   - `hydrated` for SSR handoff in the browser
   - `shell` for Tauri or PWA boot from a minimal HTML shell
   - `custom` for routing-only CSR apps with host-owned or component-level data fetching
8. Pick a hydration policy per SSR route branch when the app serves HTML.

For filesystem apps, the happy path is:

1. author route modules in `src/routes`
2. call `await loadRoutes({ root: "src/routes" })` from Node, SSR, SSG, or build tooling
3. use `vanStackVite({ routes: { root: "src/routes" } })` plus `virtual:van-stack/routes` for Vite browser CSR
4. pass those routes into CSR, SSR, or SSG entrypoints

For a control-plane style branch with a persistent sidebar, the route tree can look like this:

```text
src/routes/app/
  layout.ts
  @sidebar/
    page.ts
  users/
    [id]/
      page.ts
```

The owning `layout.ts` receives the default branch as `children`, the sidebar branch as `slots.sidebar`, and any named slot loader results as `slotData.sidebar`.

For a public/private split without URL prefixes, route groups can own separate layouts:

```text
src/routes/
  (public)/
    layout.ts
    login/
      page.ts
  (private)/
    layout.ts
    dashboard/
      page.ts
```

`(public)/login/page.ts` matches `/login`, `(private)/dashboard/page.ts` matches `/dashboard`, and the group `layout.ts` files wrap their descendants. Groups are only filesystem and layout boundaries; authorization still belongs in app-owned loaders, middleware, or server code. VanStack rejects duplicate public patterns such as `(public)/login` and `(private)/login`.

For a Vite browser CSR app, configure the plugin and import the virtual route module:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { vanStackVite } from "van-stack/vite";

export default defineConfig({
  plugins: [vanStackVite({ routes: { root: "src/routes" } })],
});
```

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

For an emitted browser CSR artifact, add one extra step:

1. call `await writeRouteManifest({ root: "src/routes", chunkedRoutes: true })`
2. import `.van-stack/routes.generated.ts` in the browser entry
3. pass those lazy routes into `startClientApp({ routes, ... })`

For deployable SSG output, use `exportStaticSite({ routes, outDir })` from `van-stack/ssg`. It writes HTML pages, raw `route.ts` outputs, and copied asset files/directories into a static tree that generic web servers can serve directly.

If you need a file artifact for custom tooling, `writeRouteManifest({ root: "src/routes" })` can still emit `.van-stack/routes.generated.ts`. Add `chunkedRoutes` when the generated manifest should drive browser chunking by default.

## Rule of thumb

- use `hydrated` when the browser receives HTML from `van-stack/ssr`
- use `shell` when the app boots from bundled assets but still wants `loader.ts`
- use `custom` when the app already has its own GraphQL, REST, RPC, native data layer, or component-level query logic
- use `(public)` and `(private)` route groups when different concerns need separate layouts without changing URLs
- use `@sidebar`-style slot directories when one URL should drive a persistent shell plus a changing workspace inside the same router
- use the Vite virtual route module for normal browser CSR
- use a generated route manifest when you want an explicit route artifact or emitted chunk metadata
- use manual route arrays only when you intentionally want to bypass filesystem routing

Hydration policy is not the same as CSR runtime mode. A route can use `app` hydration for SSR handoff, while the same codebase can also boot in `shell` mode for Tauri.

For the normal SSR browser handoff path, use `hydrateApp({ routes })` from `van-stack/csr`. It reads the SSR bootstrap payload, creates the hydrated router, and wires browser navigation so the app continues from the server-rendered route instead of starting from scratch.

If the client should use Vite browser CSR without a generated file, switch the browser entry to `startClientApp({ routes })` and feed it `virtual:van-stack/routes`. Use `.van-stack/routes.generated.ts` only when a custom pipeline needs an emitted route artifact.

See the demos for concrete starting points.
