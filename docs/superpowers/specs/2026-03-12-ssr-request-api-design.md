# SSR Request API Design

## Summary

Change the public SSR entrypoint so `renderRequest` accepts a real `Request` instead of a manually extracted pathname string. The routes remain the match set, but the incoming request becomes the source of the target URL.

## Goals

- Make the primary SSR API request-based.
- Stop requiring app code to peel out `pathname` manually before rendering.
- Keep route matching behavior unchanged.
- Preserve SSG by letting it construct an internal `Request`.

## Non-Goals

- Rework route matching semantics.
- Add full request-method-aware SSR actions in this change.
- Redesign SSG inputs.

## Design

- `renderRequest` takes:
  - `request: Request`
  - `routes: RouteDefinition[]`
- SSR derives:
  - `pathname` from `new URL(request.url).pathname`
  - `path` from `pathname + search`
- Route matching continues to use the pathname.
- Bootstrap payload should keep:
  - `pathname`
  - full `path`
- `buildStaticRoutes` constructs a synthetic `Request` for each generated path and reuses `renderRequest`.

## Validation

- Update SSR tests to call `renderRequest({ request: new Request(...), routes })`.
- Update README to show the request-based API.
- Run full repo verification.
