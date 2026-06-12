# Shared Components

Shared components are written against `van-stack/render` instead of importing `vanjs-core` or the server-side runtimes directly.

```ts
import { van } from "van-stack/render";

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

Runtime/bootstrap code binds the concrete render implementation through `bindRenderEnv(...)`. Route modules and shared components should not care whether the active runtime is `vanjs-core` on the client or `mini-van-plate` on the server.

The facade also exposes `van.hydrate(...)` for route-level `hydrate.ts` modules. In `app` SSR handoff flows, that file is the optional low-level enhance hook; in `islands` flows, it is the normal activation path.

Imported third-party packages are a separate boundary. If an SSR or SSG entrypoint imports a package that hard-imports `vanjs-core` or `vanjs-ext`, keep your own app code on `van-stack/render` and enable compatibility at the server/static resolver layer instead:

- `van-stack/compat/node-register` for direct Node SSR and SSG entrypoints
- `bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json <entry>` for direct Bun SSR and SSG entrypoints

For Bun apps, keep that override in a checked-in `tsconfig.bun.json` that extends `./node_modules/van-stack/compat/bun-tsconfig.json`, then call it from package scripts. `bunfig.toml` does not currently expose the same setting.

See [Bun Runtime](./bun.md) for the recommended Bun script layout.

Those resolver hooks must run before the imported package is evaluated. If the package reads Van at module scope before the runtime binds the server/static compatibility environment, it will still fail with the usual unbound-runtime error.

Render-time code stays environment-safe. Browser-only behavior belongs either in remounted client components or in explicit client-only enhancement paths.
