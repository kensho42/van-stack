# Render Facade Design

## Summary

`van-stack` should provide a framework-level Van render abstraction instead of forcing apps or demos to import `vanjs-core` or `mini-van-plate` directly.

The public authoring surface should be `van-stack/render`, which exposes a shared `van` object and binding helpers. CSR, SSR, and SSG runtimes bind the concrete Van implementation behind that facade. Route modules and demos import only the framework facade.

## Problem

The current repo claims that `van-stack` provides a shared render contract, but that contract does not exist yet. The docs talk about a framework-owned rendering model, while the demo files still return raw HTML strings and do not use Van tags at all.

If the demos are fixed by importing `vanjs-core` or `mini-van-plate` directly, the examples would leak the client/server runtime split that the framework is supposed to hide.

## Goals

- Provide a real framework-level Van abstraction
- Keep `vanjs-core` and `mini-van-plate` behind the `van-stack` boundary
- Make demos consume the same abstraction that real apps should use
- Support enough Van surface for real components in v1
- Cover all CSR runtime modes with demo examples

## Non-Goals

- Complete the full long-term render architecture in one pass
- Redesign SSR/CSR runtime internals beyond what is needed to bind the facade
- Expose Mini-Van’s exact `registerEnv` API to end users

## Public API

Recommended package surface:

```ts
import { van, bindRenderEnv, getRenderEnv } from "van-stack/render";
```

Exports:

- `van`
- `bindRenderEnv(vanImpl)`
- `getRenderEnv()`

The `van` export should be a framework-owned facade object. It forwards to the currently bound Van implementation.

## Van Surface To Expose

The facade should expose more than `tags`.

Minimum v1 surface:

- `van.tags`
- `van.state`
- `van.derive`
- `van.add`

That is enough for real demo components and a realistic first authoring model. If `van-stack/render` exposes only tags, users will immediately bypass it as soon as they need stateful components.

## Binding Model

The framework should use a register/bind mechanism similar in spirit to Van’s SSR guidance, but without exposing Mini-Van’s API directly.

Behavior:

- before runtime binding, using the facade should throw a clear error
- CSR runtime binds the client Van implementation at startup
- SSR runtime binds the server Van implementation for request rendering
- SSG runtime binds the server Van implementation for static generation

This keeps route modules environment-agnostic:

- route modules import only `van-stack/render`
- runtime/bootstrap code is the only place that knows which concrete Van implementation is active

## Relationship To `registerEnv`

Van’s SSR docs use `registerEnv` to bind an abstract `env.van` for shared components. `van-stack` should follow that pattern conceptually, but not surface it directly.

Recommendation:

- use a `registerEnv`-style mechanism internally if helpful
- expose only `bindRenderEnv(...)` / `getRenderEnv()` / `van` publicly
- keep `mini-van-plate/shared` as an implementation detail

## Package Layout

Recommended additions:

- `packages/core/src/render.ts`
  - framework render facade and binding helpers
- `packages/core/src/index.ts`
  - export `./render` through a new package subpath
- root `package.json`
  - add `./render` export

Runtime integration:

- `packages/csr`
  - bind client Van implementation
- `packages/ssr`
  - bind server Van implementation during rendering
- `packages/ssg`
  - reuse the SSR/server binding path

## Demo Scope

The demos should stop returning handwritten HTML strings and use the framework facade instead.

Recommended demo coverage:

- `demo/csr/hydrated`
- `demo/csr/shell`
- `demo/csr/custom`
- `demo/ssr-blog`
- `demo/ssg-site`
- `demo/adaptive-nav`

The CSR side explicitly needs all three runtime modes represented.

Route modules in those demos should:

- import `van` from `van-stack/render`
- use real Van tags
- avoid direct imports of `vanjs-core` or server-side Van packages

## Testing Strategy

Three layers of tests should exist:

1. **Facade tests**
   - throws before binding
   - forwards `tags`, `state`, and `derive` after binding

2. **Runtime binding tests**
   - CSR binds the client implementation
   - SSR and SSG bind the server implementation

3. **Demo/docs tests**
   - demo route files no longer return raw HTML strings
   - demo route files import `van-stack/render`
   - docs and README examples stop showing string-based demo components

## Recommendation

Implement a minimal framework-owned render facade now and make the demos consume it.

This is the smallest change that keeps the project honest:

- demos use real Van APIs
- app authors see the intended framework surface
- the client/server Van split remains hidden behind `van-stack`
