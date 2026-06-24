# CSR Demo

For the fastest repo tour, start with `bun run start` and the evaluator-first `demo/showcase`.

Demonstrates all three CSR runtime modes:

- `hydrated`: start from SSR HTML and continue on the client with `startClientApp({ mode: "hydrated", routes })`, which uses `hydrateApp({ routes })` for the initial handoff
- `shell`: boot from a tiny HTML shell and use VanStack transport-backed route loading
- `custom`: boot from a tiny HTML shell and let the app shell provide data resolution, or keep data fetching inside components. The dynamic `/new-esim/:iccid` custom route reads `params`, `query`, `path`, and `pathname` directly from its `page.ts` input without a router resolver.

Managed CSR navigation uses `scroll: { onNavigate: "top", onPopState: "preserve", behavior: "auto" }` by default. Pass `scroll` to `startClientApp(...)` or `hydrateApp(...)` when a demo shell should preserve forward-navigation scroll or force top scroll on browser back/forward.

Each route module imports `van` from `vanjs-core` directly. Browser CSR resolves that to the real browser package.

In Node, SSR, SSG, or build tooling, filesystem routes are typically loaded with `await loadRoutes({ root: "src/routes" })`. In a Vite browser CSR app, configure `vanStackVite({ routes: { root: "src/routes" } })` and import `virtual:van-stack/routes` instead. Writing `.van-stack/routes.generated.ts` stays available for custom tooling, but it is not the default Vite browser path.

For the opt-in chunked manifest path, use `demo/chunked-csr`. That demo writes `.van-stack/routes.generated.ts` with `chunkedRoutes: true`, imports it into `startClientApp({ routes, ... })`, and serves the emitted secondary JS chunks.

This folder stays as a focused reference for the CSR-specific pieces after the six-mode showcase demo.
