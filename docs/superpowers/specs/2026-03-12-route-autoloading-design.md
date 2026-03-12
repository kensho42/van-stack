# Route Autoloading Design

## Summary

`van-stack` should autoload filesystem routes without making that capability dependent on Vite. Route discovery belongs to the compiler layer, while Vite remains an optional adapter for dev-server DX, HMR, and build orchestration.

The default artifact should be a generated JavaScript manifest, not JSON. That keeps route-module loading simple for SSR, SSG, `hydrated`, and `shell` runtimes while still allowing manual route definitions for `custom` mode or advanced users.

## Problem

The current codebase understands the `/src/routes` convention, but it does not actually discover routes on disk. The compiler only normalizes file paths that are handed to it manually, and the Vite package is still a placeholder.

That leaves `van-stack` in an awkward state:

- filesystem routing is part of the design
- `/src/routes` is the implied convention
- apps still have to specify routes manually
- Vite is the obvious place to hide discovery, but that would make filesystem routing feel Vite-only

## Goals

- Autoload routes from `src/routes` by default
- Keep route discovery independent from Vite
- Generate one JS manifest that CSR, SSR, and SSG can all consume
- Preserve manual route definitions as a supported alternative
- Keep `custom` CSR mode free to skip filesystem routing entirely

## Non-Goals

- Require Vite to use filesystem routing
- Introduce a JSON manifest in v1
- Remove support for manually defined route arrays

## Architecture

The route-loading pipeline should be split into three distinct concerns:

1. **Discovery**
   - scan `src/routes`
   - collect candidate route files
   - ignore helper files and folders that are not reserved route modules

2. **Normalization**
   - use the existing compiler logic to turn discovered paths into normalized route records
   - compute route IDs, URL paths, params, layout chains, and module slots

3. **Manifest generation**
   - emit a JavaScript manifest that imports or lazily loads route modules
   - make that manifest consumable by CSR, SSR, and SSG runtimes

This keeps the compiler responsible for filesystem routing, while adapters are responsible only for integration and DX.

## Proposed Compiler Surface

Recommended API:

```ts
discoverRoutes({ root: "src/routes" }): Promise<string[]>
compileRoutesFromPaths(filePaths: string[]): NormalizedRoute[]
buildRouteManifest({ root: "src/routes" }): Promise<RouteManifest>
writeRouteManifest({
  root: "src/routes",
  outFile: ".van-stack/routes.generated.ts",
}): Promise<void>
```

Responsibilities:

- `discoverRoutes`: filesystem scan only
- `compileRoutesFromPaths`: path normalization only
- `buildRouteManifest`: in-memory manifest generation
- `writeRouteManifest`: emit the generated JS file for app/runtime consumption

## Why JS Manifest

The route system is module-driven, not just path-table driven. A route is made of code modules such as `page.ts`, `layout.ts`, `loader.ts`, `action.ts`, and `meta.ts`.

Using JSON for v1 would force a second resolution layer that maps plain data back to modules. That adds unnecessary indirection for no real benefit in the current architecture.

A JS manifest works better because it can express:

- direct module references
- lazy imports for code-splitting
- route-module slots without extra loaders
- a shared artifact that SSR, SSG, `hydrated`, and `shell` can consume directly

The normalized route shape inside the compiler can remain data-oriented. The generated artifact should still be JS.

## Manifest Shape

Recommended v1 output:

```ts
export const routes = [
  {
    id: "posts/[slug]",
    path: "/posts/:slug",
    files: {
      page: () => import("../src/routes/posts/[slug]/page.ts"),
      loader: () => import("../src/routes/posts/[slug]/loader.ts"),
      meta: () => import("../src/routes/posts/[slug]/meta.ts"),
    },
    layoutChain: [() => import("../src/routes/posts/layout.ts")],
  },
];
```

Important properties:

- route IDs and normalized URL patterns come from the compiler
- module slots stay explicit
- lazy imports are the default output for v1
- runtimes consume this manifest directly rather than reconstructing module paths later

## Integration Boundaries

### Compiler

Owns:

- walking `src/routes`
- reserved-filename filtering
- path normalization
- JS manifest generation

Does not own:

- dev-server watching
- HMR orchestration
- bundler-specific transforms

### Vite Adapter

Owns:

- watching route files in dev
- regenerating or virtualizing the JS manifest
- route-aware HMR
- build-time integration

Does not own:

- core route discovery rules
- normalized route semantics

### Runtime

Consumes:

- generated route manifest

Does not care:

- whether the manifest came from a Vite plugin
- whether it came from a CLI step
- whether the app still uses manual route arrays

## Manifest Location

Recommended default output path:

```text
.van-stack/routes.generated.ts
```

Reasons:

- keeps generated files out of `src`
- makes the artifact easy to cache or ignore
- avoids pretending generated code is handwritten app code
- works for CSR, SSR, and SSG entrypoints alike

## Compatibility With CSR Modes

- `hydrated`: can import the generated manifest and resume from SSR bootstrap
- `shell`: can import the same manifest and boot from a minimal document
- `custom`: may ignore the generated manifest and provide manual routes instead

That keeps filesystem routing as a strong default without forcing it on routing-only CSR apps.

## Testing Strategy

The test plan should cover four layers:

1. **Discovery**
   - scans `src/routes`
   - ignores `_components` and non-reserved files

2. **Manifest generation**
   - emits stable route IDs, URL paths, and module slots
   - includes layout chains correctly

3. **Adapter integration**
   - optional Vite layer updates the manifest when route files change

4. **Runtime consumption**
   - CSR, SSR, and SSG can all import and use the same generated manifest

## Migration

This should be additive:

- existing manual route arrays continue to work
- filesystem apps opt into generated manifests
- Vite users get a smoother DX path, but Vite is never required

That keeps the project honest about its architecture:

- filesystem routing is a `van-stack` feature
- Vite is an optional convenience layer

## Recommendation

Adopt compiler-owned route discovery and JS manifest generation as the default filesystem-routing path.

The compiler should discover `src/routes`, normalize it, and write `.van-stack/routes.generated.ts`. The Vite adapter should consume that same model for HMR and dev/build DX, not define it.
