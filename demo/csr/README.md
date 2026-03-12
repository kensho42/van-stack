# CSR Demo

Demonstrates all three CSR runtime modes:

- `hydrated`: start from SSR HTML and continue on the client
- `shell`: boot from a tiny HTML shell and use VanStack transport-backed route loading
- `custom`: boot from a tiny HTML shell and let the app shell provide data resolution

Each route module imports `van` from `van-stack/render`, not `vanjs-core` directly.

In the filesystem-routing path, the demo would typically call `await loadRoutes({ root: "src/routes" })`. Writing `.van-stack/routes.generated.ts` stays available for custom tooling, but it is not the default path.
