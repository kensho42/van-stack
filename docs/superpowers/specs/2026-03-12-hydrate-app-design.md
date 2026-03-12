# App Hydration Handoff Design

## Summary

Add a `hydrateApp` helper to `van-stack/csr` so SSR routes with `hydrationPolicy: "app"` can automatically hand off to the client router. The helper should read the SSR bootstrap payload, create a hydrated router, wire browser navigation listeners, and expose a small teardown surface.

## Goals

- Make `"app"` hydration practical instead of just descriptive.
- Keep SSR bootstrap as the source of truth for the initial route data.
- Automatically intercept same-origin document navigations and route them through CSR transport.
- Support browser back and forward navigation.
- Keep rendering ownership in app code, but expose router subscription hooks so client mounting can react to route changes.

## Design

- Extend the CSR router with a subscription API:
  - `subscribe(listener)` returns an unsubscribe function.
  - listeners are notified whenever the current route entry changes.
  - listeners receive the current entry immediately when one already exists.
- Add `hydrateApp({ routes, history?, transport?, document?, window?, bootstrapSelector? })` to `van-stack/csr`.
- `hydrateApp`:
  - reads the JSON bootstrap script emitted by SSR
  - requires `hydrationPolicy === "app"`
  - creates a router in `mode: "hydrated"`
  - wires `popstate` to `router.load(currentLocation)`
  - intercepts eligible same-origin anchor clicks and routes them through `router.navigate(...)`
  - returns `{ router, bootstrap, dispose() }`
- Keep the helper fetch-native and DOM-light:
  - injected `document`, `window`, and `history` support testing and non-standard hosts
  - the helper should not mount the UI directly
- Normalize hydrated bootstrap use:
  - CSR should honor the bootstrap `path` when present so query strings survive the handoff
  - bootstrap typing should match the SSR payload shape already emitted today

## Validation

- CSR router tests should prove route subscriptions receive current and future entries.
- New hydration tests should prove:
  - bootstrap is read correctly
  - same-origin anchor clicks route through CSR navigation
  - `popstate` reloads the current canonical URL
  - non-`app` bootstrap payloads are rejected
- README and hydration docs should show `hydrateApp({ routes })` as the normal app-mode handoff entrypoint.
