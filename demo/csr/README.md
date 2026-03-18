# CSR Demo

For the fastest repo tour, start with `bun run start` and the evaluator-first `demo/showcase`.

Demonstrates all three CSR runtime modes:

- `hydrated`: start from SSR HTML and continue on the client with `hydrateApp({ routes })`
- `shell`: boot from a tiny HTML shell and use VanStack transport-backed route loading
- `custom`: boot from a tiny HTML shell and let the app shell provide data resolution, or keep data fetching inside components

Each route module imports `van` from `van-stack/render`, not `vanjs-core` directly.

In the filesystem-routing path, the demo would typically call `await loadRoutes({ root: "src/routes" })`. Writing `.van-stack/routes.generated.ts` stays available for custom tooling, but it is not the default path.

For the opt-in chunked manifest path, use `demo/chunked-csr`. That demo writes `.van-stack/routes.generated.ts`, imports it into `startClientApp({ routes, ... })`, and serves the emitted secondary JS chunks.

This folder stays as a focused reference for the CSR-specific pieces after the six-mode showcase demo.
