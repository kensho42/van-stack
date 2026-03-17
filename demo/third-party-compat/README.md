# Third-Party Compatibility Demo

Demonstrates imported library code that hard-imports `vanjs-core` and `vanjs-ext` directly, while still rendering through VanStack in CSR, SSR, and SSG.

The route files in this demo import `third-party-lib`, not `van-stack/render`. The workspace package itself uses direct Van imports so the compatibility layer is exercised at the package boundary instead of the route boundary.

Route surface:

- `/csr`
- `/ssr`
- `/ssg`

Resolver support in the current repo state:

- CSR and test runners: `van-stack/vite` or the shared alias map from `getVanStackCompatAliases()`
- SSR and SSG under Node: `van-stack/compat/node-register`

This folder is the focused reference for third-party package compatibility, separate from the evaluator-first `demo/showcase`.
