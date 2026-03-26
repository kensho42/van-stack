# Hydration Modes

Hydration policy is about SSR HTML. CSR runtime mode is about how the client app boots.

## Hydration policy

`van-stack` supports three branch-level hydration policies:

- `document-only`: render HTML and stop
- `islands`: render HTML and activate marked shared components
- `app`: render HTML, then hand off to the CSR router

Only `app` mode enables internal route-data fetches for later navigations.

For `app` routes, the recommended client entrypoint is `startClientApp({ mode: "hydrated", routes, ... })` from `van-stack/csr`. That high-level helper uses `hydrateApp({ routes })` internally for the initial SSR handoff.

The default `app` handoff strategy is `remount`:

- if the matched route or named slot declares `hydrate.ts`, VanStack treats that file as a low-level enhance hook and runs it against the existing SSR DOM
- otherwise VanStack resolves the matched `page.ts` and remounts that branch into the app root or slot root

In the managed `hydrated` client path, later navigations use the same render-or-enhance rule. `hydrated` remains the CSR runtime mode name for compatibility; `remount` is the default handoff strategy inside `app` hydration, not a new mode.

## CSR runtime mode

CSR runtime mode applies whenever `van-stack/csr` boots a client router:

- `hydrated`: continue from SSR bootstrap payload
- `shell`: boot from a minimal document and use transport-backed route loading
- `custom`: boot from a minimal document and delegate route data to the host app, or skip route-level data loading entirely

`startClientApp({ routes, ... })` is the high-level CSR entrypoint for all three modes. It accepts either eager routes or lazy manifest routes from `.van-stack/routes.generated.ts`, so the same API can boot a single-bundle CSR app or a route-chunked one.

These choices are related but separate:

- hydration policy decides how SSR output becomes interactive
- CSR runtime mode decides how the browser or webview bootstraps the router
