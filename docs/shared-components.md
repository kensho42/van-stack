# Shared Components

Shared components are written against `van-stack/render` instead of importing `vanjs-core`, `vanjs-ext`, or the server-side runtimes directly.

```ts
import { van, vanX } from "van-stack/render";

const { article, h1, p } = van.tags;

export default function page() {
  const count = van.state(0);
  const post = vanX.reactive({
    title: "Shared Component",
    likes: 0,
  });

  return article(
    h1(() => post.title),
    () => `Count: ${count.val}`,
    p(() => `Likes: ${post.likes}`),
  );
}
```

Runtime/bootstrap code binds the concrete render implementation through `bindRenderEnv(...)`. Route modules and shared components should not care whether the active runtime is `vanjs-core` plus `vanjs-ext` on the client or `mini-van-plate` plus the server-safe VanX binding on the server.

The facade also exposes `van.hydrate(...)` for route-level `hydrate.ts` modules in `app` SSR handoff flows.

Imported third-party packages are a separate boundary. If a package hard-imports `vanjs-core` or `vanjs-ext`, keep your own app code on `van-stack/render` and enable compatibility at the resolver layer instead:

- `van-stack/vite` or `getVanStackCompatAliases()` for Vite and Vitest
- `van-stack/compat/node-register` for direct Node SSR and SSG entrypoints
- `bun run --tsconfig-override ./node_modules/van-stack/compat/bun-tsconfig.json <entry>` for direct Bun SSR and SSG entrypoints

For Bun apps, keep that override in a checked-in `tsconfig.bun.json` that extends `./node_modules/van-stack/compat/bun-tsconfig.json`, then call it from package scripts. `bunfig.toml` does not currently expose the same setting.

See [Bun Runtime](./bun.md) for the recommended Bun script layout.

Those resolver hooks must run before the imported package is evaluated. If the package reads `van` or `vanX` at module scope before the runtime binds the render env, it will still fail with the usual unbound-render error.

Render-time code stays environment-safe. Browser-only behavior belongs in explicit client-only enhancement paths.
