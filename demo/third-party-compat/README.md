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
- SSR and SSG under Bun: `bun run --tsconfig-override ./compat/bun-tsconfig.json <entry>`

Consumer Bun apps should normally check in a local `tsconfig.bun.json` instead of repeating the long CLI path:

```json
{
  "extends": "./node_modules/van-stack/compat/bun-tsconfig.json"
}
```

```json
{
  "scripts": {
    "ssr": "bun run --tsconfig-override ./tsconfig.bun.json ./src/server.ts",
    "ssg": "bun run --tsconfig-override ./tsconfig.bun.json ./src/build.ts"
  }
}
```

`bunfig.toml` does not currently expose `--tsconfig-override`, so package scripts are the repeatable Bun entrypoint.

This folder is the focused reference for third-party package compatibility, separate from the evaluator-first `demo/showcase`.
