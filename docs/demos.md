# Demos

Start with the runnable showcase from the repo root:

```bash
bun run start
```

The older demo folders remain focused references once you want to inspect one runtime area in isolation.

- `demo/showcase`: evaluator-first entrypoint for the shared blog app
  - `Runtime Gallery`: live mode comparisons for `hydrated`, `shell`, `custom`, `ssg`, and adaptive navigation
  - `Guided Walkthrough`: annotated capability pages that link back to the matching live routes
- `demo/csr`: focused reference for `hydrated`, `shell`, and `custom` CSR boot patterns, including `hydrateApp({ routes })`, resolver-driven custom flows, and component-level custom fetching
- `demo/ssr-blog`: focused reference for a `hydrated` SSR blog route with slug loader, route-level `hydrate.ts`, bootstrap payload rendering, compiler-loaded filesystem routes, and automatic `app` handoff through `hydrateApp({ routes })`
- `demo/ssg-site`: focused reference for static generation from route entries discovered under `src/routes`
- `demo/adaptive-nav`: focused reference for replace-vs-stack presentation with filesystem route discovery

All demo route modules import `van` from `van-stack/render`.
