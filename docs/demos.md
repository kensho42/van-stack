# Demos

The MVP ships focused examples instead of one large showcase.

- `demo/csr`: `hydrated`, `shell`, and `custom` CSR boot patterns, including `hydrateApp({ routes })`, resolver-driven custom flows, and component-level custom fetching
- `demo/ssr-blog`: `hydrated` SSR blog route with slug loader, route-level `hydrate.ts`, bootstrap payload, compiler-loaded routes, and automatic `app` handoff through `hydrateApp({ routes })`
- `demo/ssg-site`: static generation example consuming the same filesystem route manifest
- `demo/adaptive-nav`: replace-vs-stack presentation example with filesystem route discovery

All demo route modules import `van` from `van-stack/render`.
