# Chunked CSR Demo

This demo focuses on chunked client-side route loading across the three CSR modes: `hydrated`, `shell`, and `custom`.

The browser entries call `startClientApp({ routes, ... })` and import `demo/chunked-csr/.van-stack/routes.generated.ts` directly. The runtime calls `writeRouteManifest({ root })` before the first client build, so the generated manifest exists before Bun compiles the split client bundle.

It uses a small filesystem route set:

- `/` for the landing page
- `/hydrated/chunked-route`
- `/shell/chunked-route`
- `/shell-workbench/overview`
- `/custom/chunked-route`

Each route module is a real Van page renderer, and the shared route helpers are intentionally reused so Bun emits at least one shared chunk in addition to the top-level entry files.

- `hydrated` uses the normal internal-data path after the initial SSR bootstrap handoff
- `shell` uses the same internal-data path from a shell document
- `custom` resolves data through an app-owned `/api/chunked-csr/*` fetcher while still lazy-loading the route modules
- `/shell-workbench/overview` demonstrates a control-plane branch built from `src/routes/shell-workbench/layout.ts` plus `src/routes/shell-workbench/@sidebar/page.ts`, so `startClientApp({ routes, ... })` only needs to rerender the workspace slot on later shell navigations

Run the demo with:

```bash
bun demo/chunked-csr/src/runtime/start.ts
```
