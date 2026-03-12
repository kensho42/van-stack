# Demos

The MVP ships focused examples instead of one large showcase.

- `demo/csr`: `hydrated`, `shell`, and `custom` CSR boot patterns from `.van-stack/routes.generated.ts`
- `demo/ssr-blog`: `hydrated` SSR blog route with slug loader, bootstrap payload, and generated route manifest
- `demo/ssg-site`: static generation example consuming the same filesystem route manifest
- `demo/adaptive-nav`: replace-vs-stack presentation example with filesystem route discovery

All demo route modules import `van` from `van-stack/render`.
