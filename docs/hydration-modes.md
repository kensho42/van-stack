# Hydration Modes

Hydration policy is about SSR HTML. CSR runtime mode is about how the client app boots.

## Hydration policy

`van-stack` supports three branch-level hydration policies:

- `document-only`: render HTML and stop
- `islands`: render HTML and activate marked shared components
- `app`: render HTML, then hand off to the CSR router

Only `app` mode enables internal route-data fetches for later navigations.

For `app` routes, the normal client entrypoint is `hydrateApp({ routes })` from `van-stack/csr`. That helper reads the bootstrap payload emitted by SSR, finds the framework app root, lazy-loads the matched route `hydrate.ts`, and exposes `app.ready` so app code can wait for route-level DOM hydration to finish before assuming the initial SSR DOM is live.

If the matched route has no `hydrate.ts`, `hydrateApp(...)` still continues with router takeover, but the initial SSR DOM remains static until later client-rendered navigations.

## CSR runtime mode

CSR runtime mode applies whenever `van-stack/csr` boots a client router:

- `hydrated`: continue from SSR bootstrap payload
- `shell`: boot from a minimal document and use transport-backed route loading
- `custom`: boot from a minimal document and delegate route data to the host app, or skip route-level data loading entirely

These choices are related but separate:

- hydration policy decides how SSR output becomes interactive
- CSR runtime mode decides how the browser or webview bootstraps the router
