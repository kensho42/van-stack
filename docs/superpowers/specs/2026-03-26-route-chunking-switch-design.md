# Route Chunking Switch Design

## Summary

Add chunked client-route loading as a first-class framework option that app templates can opt into at build time. Chunking should be controlled by template configuration, inherited by default across the whole route set, and available to `hydrated`, `shell`, and `custom` client templates without changing their runtime semantics.

This keeps chunking in the same category as output shape and deployment wiring:

- the app template decides whether route modules are emitted eagerly or lazily
- the client runtime continues to speak the same route interface
- demos can opt in where chunking is the point of the evaluation

## Goals

- Make chunking a first-class framework capability, not a demo-only special case.
- Keep `hydrated`, `shell`, and `custom` as runtime modes, not chunking modes.
- Enable chunking by template configuration, not by per-route boilerplate.
- Support route-level opt-out for explicit eager exceptions.
- Keep SSR handoff behavior separate from route-module loading behavior.

## Non-Goals

- Do not introduce a new runtime mode just for chunking.
- Do not change hydration philosophy or SSR handoff semantics.
- Do not require chunking for every template.
- Do not make chunking affect `ssg` or server rendering rules.
- Do not build a new manifest format unless the existing compiler output is insufficient.

## Proposed Shape

### Configuration Surface

Add chunking to the app template build configuration, not to route modules or runtime modes.

The intended shape is something like:

```ts
createAppTemplate({
  chunkedRoutes: true,
})
```

The exact helper name can follow the repo's existing app-template wiring, but the option should live beside the build-time template config that decides how the client entry is produced.

The option should be inherited by all routes in the template.

If enabled:

- the compiler writes a route manifest for that template
- the client entry loads route modules lazily from the manifest
- the runtime still receives the same route objects and route loader shape

If disabled:

- the template can still use eager route imports
- the route graph continues to work with the same runtime APIs

### Route Override

Allow a route to opt out explicitly when it must remain eager.

Example intent:

- `chunkedRoutes: true` at template level
- individual route declares `chunking: false`

This is meant as an exception path, not a normal per-route configuration surface.

If the route override is implemented, it should only affect client-module delivery. It should not change SSR, SSG, or the route's public URL surface.

### Runtime Behavior

Chunking should be a build-time and loading concern only.

- `hydrateApp()` still performs the `hydrated` initial handoff.
- `startClientApp({ mode: "shell" | "custom" | "hydrated" })` still behaves the same from the app’s point of view.
- the client router still resolves route entries through the same navigation and loader APIs.
- chunked route modules are fetched lazily when the route graph asks for them.

The runtime should not need to know whether the route was eagerly bundled or manifest-loaded, beyond the existing route file loader surface.

## Design

### Compiler

The compiler already knows how to discover filesystem routes and can emit a manifest. This design makes manifest emission the default companion to chunked templates.

The compiler should:

- keep `loadRoutes({ root })` as the source of truth for route discovery
- use `buildRouteManifest(...)` / `writeRouteManifest(...)` when chunking is enabled
- preserve the existing route module conventions
- keep manifest generation optional for non-chunked templates

The route manifest should remain an emitted artifact, not the source of truth for route discovery.

### Client Entries

Chunking should be consumed by the client entry, not by the route components.

- `hydrated` should still use the SSR bootstrap handoff path
- `shell` should still boot from transport-backed loading
- `custom` should still boot from app-owned data resolution

If chunking is enabled for a template, the entry should import route modules through manifest-backed lazy loaders rather than static eager imports.
The entry should not care whether the template is `hydrated`, `shell`, or `custom` beyond choosing the correct boot path for that mode.

### Showcase Usage

The showcase should be able to demonstrate:

- eager `hydrated` route loading
- chunked `shell`
- chunked `custom`

This keeps the demo story aligned with the framework capability:

- the mode explains how data is loaded
- the chunking switch explains how route modules are delivered
- the same chunking switch should be usable by any template that wants the manifest-backed path

## Alternatives

### 1. Template-Level Default With Route Opt-Out

Pros:

- simple to explain
- easy to inherit across all routes in a template
- explicit exception path for eager routes
- works for all client modes

Cons:

- route-level opt-outs add a small amount of configuration surface

### 2. Global App-Level Switch Only

Pros:

- simplest possible mental model

Cons:

- too coarse for mixed workloads
- hard to keep a few eager routes without splitting templates

### 3. Per-Route Opt-In Only

Pros:

- very explicit
- minimal global config

Cons:

- too much boilerplate
- weak framework story for a first-class default

## Recommendation

Use option 1:

- template-level `chunkedRoutes: true`
- inherited by default
- route-level opt-out only for exceptions

This keeps chunking as a first-class framework capability while preserving a stable runtime model across all supported CSR modes.

## Validation

- Compiler tests should prove chunked templates emit manifests and eager templates do not.
- CSR tests should prove lazy route loading still works for hydrated, shell, and custom client entries.
- Showcase tests should cover:
  - eager hydrated route loading
  - chunked shell route loading
  - chunked custom route loading
  - route-level eager opt-out if added
- Docs should distinguish:
  - runtime mode choice
  - hydration strategy choice
  - chunking delivery choice
