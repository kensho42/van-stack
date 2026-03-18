# Getting Started

`van-stack` apps are organized around filesystem routes, hydration policies, and explicit runtime modes.

## MVP setup

1. Define routes under `src/routes`.
2. Use reserved filenames such as `page.ts`, `route.ts`, `layout.ts`, `loader.ts`, and `meta.ts`.
3. Load runtime routes from that tree, usually with `loadRoutes({ root: "src/routes" })`.
4. Choose whether the app runs in CSR, SSR, or SSG mode.
5. If the app has a client router, choose a CSR runtime mode:
   - `hydrated` for SSR handoff in the browser
   - `shell` for Tauri or PWA boot from a minimal HTML shell
   - `custom` for routing-only CSR apps with host-owned or component-level data fetching
6. Pick a hydration policy per SSR route branch when the app serves HTML.

For filesystem apps, the happy path is:

1. author route modules in `src/routes`
2. call `await loadRoutes({ root: "src/routes" })`
3. pass those routes into CSR, SSR, or SSG entrypoints

For a chunked browser CSR app, add one extra step:

1. call `await writeRouteManifest({ root: "src/routes" })`
2. import `.van-stack/routes.generated.ts` in the browser entry
3. pass those lazy routes into `startClientApp({ routes, ... })`

For deployable SSG output, use `exportStaticSite({ routes, outDir })` from `van-stack/ssg`. It writes HTML pages, raw `route.ts` outputs, and copied asset files/directories into a static tree that generic web servers can serve directly.

If you need a file artifact for custom tooling, `writeRouteManifest({ root: "src/routes" })` can still emit `.van-stack/routes.generated.ts`.

## Rule of thumb

- use `hydrated` when the browser receives HTML from `van-stack/ssr`
- use `shell` when the app boots from bundled assets but still wants `loader.ts`
- use `custom` when the app already has its own GraphQL, REST, RPC, native data layer, or component-level query logic
- use manual route arrays only when you intentionally want to bypass filesystem routing

Hydration policy is not the same as CSR runtime mode. A route can use `app` hydration for SSR handoff, while the same codebase can also boot in `shell` mode for Tauri.

For the normal SSR browser handoff path, use `hydrateApp({ routes })` from `van-stack/csr`. It reads the SSR bootstrap payload, creates the hydrated router, and wires browser navigation so the app continues from the server-rendered route instead of starting from scratch.

If the client should also lazy-load route code per navigation, switch the browser entry to `startClientApp({ routes })` and feed it `.van-stack/routes.generated.ts` instead of eager in-memory routes.

See the demos for concrete starting points.
