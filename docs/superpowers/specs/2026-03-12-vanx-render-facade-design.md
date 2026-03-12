# VanX Render Facade Design

## Summary

`van-stack/render` should expose `vanX` alongside `van`, so shared application code can import both from one framework-owned facade:

```ts
import { van, vanX } from "van-stack/render";
```

CSR should bind the real `van-x` runtime. SSR and SSG should bind the server-safe `dummyVanX` recommended by the official Van fullstack SSR guidance.

## Problem

The current render facade only exposes `van`. That means any app code that wants VanX would have to import it directly from `van-x`, which breaks the framework-owned abstraction we already established for shared Van code.

It also creates a mismatch with the official fullstack SSR guidance for VanX, which expects a shared environment that binds the client and server runtimes differently.

## Goals

- Keep `van-stack/render` as the only authoring import surface for shared Van code
- Expose `vanX` as a first-class framework facade
- Bind the real client VanX runtime in CSR
- Bind server-safe `dummyVanX` in SSR and SSG
- Keep the client/server runtime split hidden from app code

## Non-Goals

- Redesign the existing `van` facade
- Invent a framework-specific VanX wrapper API
- Expose `registerEnv` or `dummyVanX` directly to application code

## Public API

Recommended public authoring model:

```ts
import { van, vanX } from "van-stack/render";
```

Recommended binding API:

```ts
import { bindRenderEnv, getRenderEnv } from "van-stack/render";
```

`bindRenderEnv(...)` should take a render environment object that contains both runtime surfaces:

```ts
{
  van,
  vanX,
}
```

## Facade Behavior

`van-stack/render` should forward the real bound objects rather than inventing a narrower wrapper API.

That means:

- `van` keeps forwarding the Van runtime methods already supported
- `vanX` forwards the bound VanX runtime object as-is
- using either before binding throws a clear framework error

This keeps the framework from becoming a second VanX API design layer while still providing one stable import surface.

## Runtime Binding

CSR:

- bind `vanjs-core` as `van`
- bind `van-x` as `vanX`

SSR / SSG:

- register the shared Mini-Van environment with `van` plus `dummyVanX`
- bind a render env containing server-side `van` plus `dummyVanX`

This follows the official Van fullstack SSR direction while keeping the concrete runtime packages behind the framework boundary.

## Testing Strategy

Tests should cover:

1. Core facade behavior
   - `vanX` throws before binding
   - `vanX` forwards after binding
2. Runtime binding behavior
   - CSR binds a real `vanX`
   - SSR / SSG bind a server-safe `vanX`
3. Docs / examples
   - shared-component examples use `import { van, vanX } from "van-stack/render"`
   - no app-facing docs require direct `van-x` imports

## Documentation Impact

Update:

- `README.md`
- `docs/shared-components.md`
- `docs/hydration-modes.md` if the hydration examples mention render-facade capabilities
- any demo or doc snippets that describe the render facade surface

The docs should be explicit that:

- VanX is first-class in `van-stack/render`
- CSR gets the real client runtime
- SSR uses the server-safe VanX placeholder under the hood

## Recommendation

Add VanX to the existing render facade now instead of creating a second import path.

That gives the cleanest authoring model:

- one framework-owned render surface
- no client/server runtime leakage into app code
- behavior aligned with the official Van fullstack SSR guidance
