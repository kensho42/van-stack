# Shared Components

Shared route components import the official Van packages directly. VanStack keeps CSR on the real browser packages and maps those imports to server/static-safe compatibility modules for SSR and SSG.

```ts
import van from "vanjs-core";

const { article, h1, p } = van.tags;

export default function page() {
  const count = van.state(0);

  return article(
    h1("Shared Component"),
    () => `Count: ${count.val}`,
    p("Shared route component"),
  );
}
```

VanX helpers use `vanjs-ext` directly:

```ts
import * as vanX from "vanjs-ext";
```

Route modules and shared components should not import server-side Van packages directly. Use `vanjs-core` and `vanjs-ext`; SSR and SSG bind those compatibility modules to `mini-van-plate` and `dummyVanX`.

Route-level `hydrate.ts` modules also import `vanjs-core` directly and can call `van.hydrate(...)`. In `app` SSR handoff flows, that file is the optional low-level enhance hook; in `islands` flows, it is the normal activation path.

First-party route modules and imported third-party packages share the same boundary. If an SSR or SSG entrypoint imports code that uses `vanjs-core` or `vanjs-ext`, ensure compatibility is installed at the server/static resolver layer:

- `loadRoutes({ root })` installs the Node compatibility resolver for the default Node SSR/SSG path
- `van-stack/compat/node-register` for custom direct Node route imports or generated-manifest entrypoints
- `bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json <entry>` for direct Bun SSR and SSG entrypoints

For Bun apps, keep that override in a checked-in `tsconfig.bun.json` that extends `./node_modules/van-stack/compat/bun-tsconfig.json`, then call it from package scripts. `bunfig.toml` does not currently expose the same setting.

See [Bun Runtime](./bun.md) for the recommended Bun script layout.

Those resolver hooks must run before the imported package is evaluated. If the package reads Van at module scope before the runtime binds the server/static compatibility environment, it will still fail with the usual unbound-runtime error.

Render-time code stays environment-safe. Browser-only behavior belongs either in remounted client components or in explicit client-only enhancement paths.

If shared code must branch on browser-only behavior, check for `window`, not `document`. SSR/SSG may provide a minimal server `document` so official Van tags can render safely.
