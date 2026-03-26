# Demos

Start with the runnable showcase from the repo root:

```bash
bun run start
```

The older demo folders remain focused references once you want to inspect one runtime area in isolation.

- `demo/showcase`: evaluator-first entrypoint for the shared blog app
  - `Runtime Gallery`: live mode comparisons for `ssg`, `ssr`, `hydrated`, `islands`, `shell`, `custom`, and `chunked`
  - Post detail routes prove server-backed likes and bookmarks, with default remount handoff on `hydrated` and low-level enhance hooks on `islands`
  - `Guided Walkthrough`: annotated capability pages that link back to the matching live routes for those same seven modes
  - `Adaptive Navigation`: a separate `stack` presentation track over the same blog graph
- `demo/csr`: focused reference for `hydrated`, `shell`, and `custom` CSR boot patterns, including `hydrateApp({ routes })`, resolver-driven custom flows, and component-level custom fetching
- `demo/chunked-csr`: focused reference for route-level browser chunking through `.van-stack/routes.generated.ts`, `startClientApp({ routes, ... })`, split Bun browser assets, default remount handoff for the hydrated detail route, served secondary chunks, and a `/shell-workbench/overview` slot-route control plane with a pathless `@sidebar`
- `demo/ssr-blog`: focused reference for a `hydrated` SSR blog route with slug loader, route-level `hydrate.ts` as the low-level enhance hook, bootstrap payload rendering, compiler-loaded filesystem routes, and automatic `app` handoff through `hydrateApp({ routes })`
- `demo/ssg-site`: focused reference for static generation from route entries discovered under `src/routes`, then exported as static files for generic web servers; run `bun ./demo/ssg-site/build.ts` to write `demo/ssg-site/dist/`
- `demo/adaptive-nav`: focused reference for replace-vs-stack presentation with filesystem route discovery
- `demo/third-party-compat`: focused reference for a workspace library that imports `vanjs-core` and `vanjs-ext` directly, then renders through `van-stack/vite` in CSR, `van-stack/compat/node-register` in Node SSR and SSG, and `compat/bun-tsconfig.json` in Bun SSR and SSG

Most first-party demo route modules import `van` from `van-stack/render`. The compatibility demo is the exception on purpose: its route files import `third-party-lib`, and that workspace package imports `vanjs-core` and `vanjs-ext` directly so the resolver-owned compatibility layer is exercised end to end.
