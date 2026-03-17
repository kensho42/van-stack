# Bun Runtime

`van-stack` uses Bun in two different roles:

- package manager and repo task runner
- optional app runtime for servers, SSG builds, and local development

The framework does not require Vite for filesystem routing. Bun-hosted apps should still load routes through `van-stack/compiler`.

## Repo Commands

From the repo root:

```bash
bun run start
bun run test
bun run check
bun run build
```

## Bun App Setup

Use Bun normally for your own app scripts, but keep route discovery and rendering on the standard VanStack APIs:

```ts
import { loadRoutes } from "van-stack/compiler";
import { renderRequest } from "van-stack/ssr";

const routes = await loadRoutes({ root: "src/routes" });

const response = await renderRequest({
  request: new Request("https://app.local/"),
  routes,
});
```

Static generation uses the same route model:

```ts
import { loadRoutes } from "van-stack/compiler";
import { buildStaticRoutes, exportStaticSite } from "van-stack/ssg";

const routes = await loadRoutes({ root: "src/routes" });
const artifacts = await buildStaticRoutes({ routes });

await exportStaticSite({
  routes,
  outDir: "dist",
  assets: [{ from: "public" }],
});
```

Use `buildStaticRoutes(...)` when you want in-memory artifacts for testing, previews, or cache warm-up. Use `exportStaticSite(...)` when you want a real static output tree that any web server can serve.

## Third-Party Van Packages

If imported packages hard-import `vanjs-core` or `vanjs-ext`, Bun needs a `tsconfig` override so those imports resolve through the active `van-stack/render` environment.

Create `tsconfig.bun.json` in the app root:

```json
{
  "extends": "./node_modules/van-stack/compat/bun-tsconfig.json"
}
```

Then call it from Bun scripts:

```json
{
  "scripts": {
    "dev": "bun run --tsconfig-override ./tsconfig.bun.json ./src/server.ts",
    "ssr": "bun run --tsconfig-override ./tsconfig.bun.json ./src/server.ts",
    "ssg": "bun run --tsconfig-override ./tsconfig.bun.json ./src/build.ts"
  }
}
```

This is the supported Bun compatibility path for:

- direct SSR entrypoints
- direct SSG entrypoints
- route loading that evaluates imported third-party Van packages

## Current Limitations

- `van-stack/compat/bun-preload` is intentionally unsupported
- Bun runtime plugins do not intercept bare package imports during `bun run`
- `bunfig.toml` does not currently expose `--tsconfig-override`

That is why the recommended Bun setup is a checked-in `tsconfig.bun.json` plus package script aliases.

## Vite And Bun

If the app is Vite-owned in the browser, use [`van-stack/vite`](./vite.md) for the Vite side and keep the Bun setup only for server or build entrypoints.

If the app runs SSR or SSG under Node instead of Bun, use the Node hook documented in [`Shared Components`](./shared-components.md).
