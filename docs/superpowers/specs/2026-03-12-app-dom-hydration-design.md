# App DOM Hydration Design

## Summary

Add true DOM hydration for SSR routes that use `hydrationPolicy: "app"`, but do it through an explicit route-level `hydrate.ts` module. SSR should render stable DOM roots and bootstrap route data, while the client should call route-specific hydration logic that uses `van.hydrate(...)` on the existing SSR DOM before the CSR router takes over later navigations.

## Problem

`van-stack` currently uses the word "hydration" to describe SSR-to-CSR router handoff, but it does not actually hydrate the SSR DOM. The current `hydrateApp(...)` helper reads the bootstrap payload, creates a hydrated router, intercepts links, and handles `popstate`, but it does not bind the already-rendered DOM through Van’s DOM hydration primitive.

There is also a concrete API constraint: `van.hydrate(dom, fn)` works against an existing DOM node. Our current `page.ts` contract returns a fresh view for SSR and CSR and does not provide a way to bind existing SSR nodes in place. So real DOM hydration cannot be made honest by silently “replaying `page.ts`” and hoping it lines up.

## Goals

- Make `hydrationPolicy: "app"` perform real Van DOM hydration for the initial SSR route.
- Keep SSR and CSR authored against the same `van-stack/render` facade.
- Reuse the existing `hydrateApp(...)` entrypoint instead of introducing a separate app bootstrap surface.
- Preserve the current CSR router takeover behavior after the initial hydration.
- Establish a primitive that future `islands` mode can reuse without inventing a second hydration system.

## Non-Goals

- Full `islands` implementation in this step.
- Implicit hydration of every SSR-rendered subtree.
- Hydration of `route.ts` raw responses.
- Replacing `page.ts` with a DOM-aware client-only contract.

## Approach Options

### Option 1: Explicit `hydrate.ts` route module. Recommended.

Keep `page.ts` responsible for SSR/shared markup, and add a client-only `hydrate.ts` module for routes that need true DOM hydration. `hydrateApp(...)` finds the matched route’s `hydrate.ts`, passes it the existing SSR root plus bootstrap data, and that module performs `van.hydrate(...)` on the relevant DOM nodes.

Pros:

- honest fit for Van’s hydration API
- keeps `page.ts` simple and SSR-focused
- gives routes explicit control over which DOM nodes are hydrated
- future islands can reuse the same route-level coordinator

Cons:

- one more reserved route file
- interactive routes need stable DOM markers in `page.ts`

### Option 2: Make `page.ts` itself hydration-aware

Widen the page contract so `page.ts` can accept an existing DOM node and return it from a hydration path.

Pros:

- fewer route files

Cons:

- muddies page authoring
- couples SSR markup generation to client-only DOM concerns
- pushes hydration complexity into every interactive route

### Option 3: Keep router handoff only

Continue treating hydration as navigation takeover and leave DOM hydration out of scope.

Pros:

- no implementation work

Cons:

- keeps the framework behavior misleading
- leaves SSR and CSR only loosely connected

## Recommendation

Implement Option 1 now.

`page.ts` should keep producing markup, while a new `hydrate.ts` route module owns client-only in-place DOM hydration for `app` routes. This fits how `van.hydrate(...)` actually works and gives future islands a direct extension path.

## Design

### 1. Shared render facade grows to include `van.hydrate`

`van-stack/render` already hides the client/server runtime split behind a shared `van` object. That facade should also expose `hydrate`, so route hydration modules and runtime code do not need to import `vanjs-core` directly.

That means the framework-owned Van surface becomes:

- `van.tags`
- `van.state`
- `van.derive`
- `van.add`
- `van.hydrate`

On the client, that binds to `vanjs-core`. On the server, the facade may expose the bound server runtime but SSR runtime code should not call `hydrate`.

### 2. Add `hydrate.ts` as a reserved route module

`hydrate.ts` is a client-only route module for DOM activation of already-rendered SSR markup.

Recommended contract:

```ts
export default function hydrate(input: {
  root: HTMLElement;
  data: unknown;
  params: Record<string, string>;
  path: string;
}) {
  // route-specific van.hydrate(...) calls
}
```

Responsibilities:

- find the SSR DOM nodes that need hydration
- create Van state
- call `van.hydrate(...)` for the route root or selected subroots
- attach client-only event handlers and reactive bindings

Non-responsibilities:

- fetching route data
- SSR markup generation
- route matching
- head/meta management

### 3. SSR emits a stable framework-owned app root

When a matched page route uses `hydrationPolicy: "app"`, SSR should wrap the rendered page output in a stable root element owned by the framework, for example a single app root marker attribute.

This root must:

- exist exactly once for the matched branch
- survive the server response unchanged
- be discoverable by `hydrateApp(...)`

The bootstrap payload should continue to include:

- route id
- canonical path
- pathname
- params
- hydration policy
- route data

### 4. `hydrateApp(...)` becomes a hydration orchestrator

`hydrateApp(...)` should evolve from:

- bootstrap reader
- router creator
- navigation wiring helper

into:

- bootstrap reader
- hydration root finder
- matched-route hydrate-module resolver
- route hydrate-module invoker
- router creator
- navigation wiring helper

Required sequence:

1. read bootstrap payload
2. require `hydrationPolicy === "app"`
3. locate the framework app root
4. resolve the matched route’s `hydrate.ts`, if present
5. call route hydration with `{ root, data, params, path }`
6. create or resume the hydrated router
7. wire click interception and `popstate`

If a route has no `hydrate.ts`, `hydrateApp(...)` may still continue with router takeover, but it must not pretend the initial DOM was hydrated.

### 5. `page.ts` and `hydrate.ts` work together

`page.ts` remains the place that defines SSR/shared markup. If a route wants DOM hydration, `page.ts` must emit stable DOM markers that `hydrate.ts` can find again on the client.

Example split:

- `page.ts`: render `<button data-like-button>` and `<span data-like-count>`
- `hydrate.ts`: find those nodes, create `likes = van.state(...)`, and call `van.hydrate(...)` on them

That keeps route rendering and route hydration separate while still sharing the same route data.

### 6. Relationship to future `islands`

This step does not implement islands, but it establishes the primitive islands should reuse later.

For `app` mode:

- one route-level `hydrate.ts`
- one framework app root
- route hydration may hydrate the full root or selected subroots

For future `islands`:

- still one route-level `hydrate.ts` coordinator
- multiple explicitly marked island roots inside the page
- `hydrate.ts` finds those roots and calls `van.hydrate(...)` once per island

So the difference is root granularity, not a different hydration technology.

## File-Level Impact

- `packages/core/src/types.ts`
  - add `"hydrate"` to route file kinds if route-module typing lives there
- `packages/core/src/render.ts`
  - add `van.hydrate` to the shared facade
- `packages/compiler/src/fs-routes.ts`
  - recognize `hydrate.ts` as a reserved route module
- `packages/compiler/src/manifest.ts`
  - include `hydrate.ts` in lazy route-module loading
- `packages/csr/src/hydrate-app.ts`
  - locate the app root, resolve the matched route `hydrate.ts`, and invoke it before router takeover
- `packages/ssr/src/render.ts`
  - emit a stable app hydration root for `app` page routes
- tests
  - prove `hydrate.ts` is discovered and loaded
  - prove `van.hydrate(...)` is exposed and invoked
  - prove SSR emits the app root
  - prove later CSR navigation still works

## Error Handling

`hydrateApp(...)` should fail clearly when:

- the bootstrap payload is missing
- the payload is not `app` mode
- the app root is missing
- the matched route cannot be found
- the route’s hydrate module throws

The framework should not silently downgrade real DOM hydration into a second mount.

## Validation

- render-facade tests should prove `van.hydrate` is exposed through `van-stack/render`
- compiler tests should prove `hydrate.ts` is a reserved route module and appears in loaded route manifests
- SSR tests should prove `app` routes emit a stable app root
- CSR hydration tests should prove `hydrateApp(...)` resolves and calls route `hydrate.ts`
- CSR hydration tests should prove route hydration can call `van.hydrate(...)` on the existing SSR root or subroots
- CSR hydration tests should still prove link interception and `popstate` takeover work after the initial hydration
- docs should clearly state that:
  - `app` mode now supports real DOM hydration through `hydrate.ts`
  - future `islands` can reuse the same route-level `hydrate.ts` coordinator with multiple island roots
