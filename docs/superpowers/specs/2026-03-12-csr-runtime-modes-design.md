# CSR Runtime Modes Design

## Summary

`van-stack` needs three distinct CSR runtime modes:

- `hydrated`: resume from SSR HTML and continue as a client router
- `shell`: boot from a minimal HTML shell with no SSR payload, while still using `van-stack` route modules
- `custom`: boot from a minimal HTML shell and let the host app own all data resolution

The routing core remains shared across all three modes. What changes by mode is only how route data is obtained and how the initial app state is established.

## Problem

The current CSR router is tightly coupled to the SSR handoff path. It always derives an internal data URL from a canonical path and fetches data through `/_van-stack/data/...`.

That works for SSR-to-CSR continuation, but it does not cleanly support:

- a Tauri or PWA app that boots from a tiny shell and still wants to use `loader.ts`
- a general-purpose CSR app that wants full freedom to use GraphQL, REST, RPC, SQLite, or native Tauri commands

These are separate use cases and should not be forced through one transport model.

## Goals

- Preserve the existing SSR handoff story for browser-first apps
- Support shell-first CSR apps that reuse the same route modules as SSR apps
- Support custom CSR apps that use `van-stack` for routing only
- Keep `page.ts`, `layout.ts`, route matching, params, query parsing, metadata, and presentation behavior consistent across modes
- Make the mode choice explicit in the public CSR API

## Non-Goals

- Replace the SSR, SSG, or hydration policy design
- Force every CSR app to use `loader.ts`
- Hide the distinction between SSR-coupled and host-owned data loading

## Architecture

`van-stack` keeps one shared routing core and one CSR router surface, but the CSR runtime is configured with an explicit mode:

```ts
createRouter({
  mode: "hydrated" | "shell" | "custom",
  routes,
  history,
  bootstrap,
  transport,
  resolve,
});
```

Shared responsibilities across all modes:

- route tree and route matching
- params and query parsing
- canonical URL navigation and history updates
- page and layout rendering
- metadata derivation through `meta.ts`
- presentation behavior like `replace` and `stack`

Mode-specific responsibilities:

- `hydrated`: consumes SSR bootstrap data, then uses a transport adapter for later navigations
- `shell`: boots from the current location with no SSR payload and uses a transport adapter for the first route and later navigations
- `custom`: boots from the current location with no SSR payload and uses host-provided resolvers instead of `loader.ts`

## CSR Modes

### `hydrated`

This is the browser-first SSR continuation path.

- first render starts from SSR HTML and bootstrap payload
- same route modules as SSR: `page.ts`, `layout.ts`, `loader.ts`, `action.ts`, `meta.ts`
- later navigations use `van-stack` data transport
- canonical URLs stay visible in the address bar

### `shell`

This is the shell-first CSR path for PWAs and Tauri apps.

- app boots from a tiny HTML shell
- there is no SSR payload to resume
- same route modules as `hydrated`
- first route and later navigations both use a transport adapter
- default transport exists, but the host app may override it

This mode is for apps that want the same route-module conventions as SSR apps, but without SSR itself.

### `custom`

This is the routing-only CSR path.

- app boots from a tiny HTML shell
- no SSR bootstrap
- no `loader.ts` execution
- host app provides data through a resolver API
- `page.ts`, `layout.ts`, `meta.ts`, route matching, and navigation still come from `van-stack`

This mode is for apps that already have a backend integration style and do not want to adopt `van-stack` loader conventions.

## Route And Data Contract

The route tree stays shared across all modes. The difference is only how `data` is resolved before rendering the page.

Recommended CSR surface:

```ts
type CreateRouterOptions =
  | {
      mode: "hydrated";
      routes: RouteDefinition[];
      history: HistoryLike;
      bootstrap: BootstrapPayload;
      transport?: Transport;
    }
  | {
      mode: "shell";
      routes: RouteDefinition[];
      history: HistoryLike;
      transport?: Transport;
    }
  | {
      mode: "custom";
      routes: RouteDefinition[];
      history: HistoryLike;
      resolve: Resolve;
    };
```

Recommended resolver contracts:

```ts
type Navigation = {
  pathname: string;
  query: URLSearchParams;
  signal: AbortSignal;
};

type RouteMatch = {
  route: {
    id: string;
    path: string;
  };
  pathname: string;
  params: Record<string, string>;
  query: URLSearchParams;
};

type Transport = {
  load(match: RouteMatch, navigation: Navigation): Promise<unknown>;
};

type Resolve = (
  match: RouteMatch,
  navigation: Navigation,
) => Promise<unknown>;
```

Why use `RouteMatch` rather than a raw path string:

- avoids fragile string-switch logic
- keeps route ID, params, and query available in one place
- leaves room for cancellation, caching, prefetching, and optimistic updates later

## Metadata

`meta.ts` remains route-scoped in all modes.

- `hydrated`: first metadata comes from SSR, later updates come from client navigation
- `shell`: metadata is derived after the first client-side route resolution and updated on later navigations
- `custom`: metadata is still derived from resolved `data`, even though `loader.ts` is not involved

This preserves one metadata model across all runtimes.

## Error Handling

The page boundary should see one consistent result model:

- resolved `data`
- redirect
- error result

Mode-specific sources of failure:

- `hydrated`: initial errors come from SSR, later errors come from the transport layer
- `shell`: initial route load and later navigations can fail through the transport layer
- `custom`: resolver failures are treated as route data failures

`error.ts` remains the route-level rendering mechanism for these failures in every mode.

If a client transition cannot be fulfilled safely, the router may still fall back to a hard navigation to the canonical URL.

## Migration

The current CSR runtime maps directly to the future `hydrated` mode.

Migration path:

1. Keep the existing internal `/_van-stack/data/...` transport as the default `Transport`
2. Rename or reshape the current CSR router API so SSR-coupled navigation is explicitly `hydrated`
3. Add `shell` mode using the same route-module contract but without SSR bootstrap
4. Add `custom` mode with app-owned resolution and no `loader.ts`

This avoids breaking the current SSR handoff model while opening the two missing CSR use cases.

## Testing Strategy

The tests should verify behavior by mode rather than by implementation detail.

- shared route matching and history updates work the same across all three modes
- `hydrated` consumes bootstrap payload and uses transport-backed navigation after startup
- `shell` resolves the initial route without bootstrap and continues through transport-backed navigation
- `custom` resolves route data only through the host resolver
- pages receive the same `params`, `query`, and `data` shape regardless of mode
- `meta.ts` derives head state correctly across all three modes
- transport cancellation prevents stale navigation results from winning

## Recommendation

Adopt the three-mode CSR runtime model:

- `hydrated`
- `shell`
- `custom`

Keep one shared route tree and one shared rendering model, but make data ownership explicit at router creation time. This preserves the SSR reuse story for browser and Tauri/PWA apps while giving general-purpose CSR apps a clean backend-agnostic integration path.
