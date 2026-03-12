# Custom CSR Optional Resolve Design

## Summary

Relax `van-stack/csr` custom mode so the host resolver is optional. This keeps `custom` as the escape hatch for app-owned data loading while also supporting apps that want VanStack to handle routing only and fetch data inside components.

## Goals

- Preserve `hydrated` and `shell` behavior unchanged.
- Keep `custom` mode free from `loader.ts`.
- Allow `createRouter({ mode: "custom", ... })` without a `resolve` function.
- Return no route-level data when no resolver is provided.
- Update docs and demos so `custom` clearly covers resolver-driven and component-level fetching.

## Design

- Change `CreateCustomRouterOptions.resolve` from required to optional.
- In the CSR router, default missing `resolve` to a no-op async resolver that returns `undefined`.
- Leave history, params, query parsing, and navigation semantics unchanged.
- Keep `loader.ts` guidance restricted to SSR, SSG, `hydrated`, and `shell`.

## Validation

- Add a CSR router test proving `custom` mode works without `resolve`.
- Assert docs mention component-level fetching for `custom`.
