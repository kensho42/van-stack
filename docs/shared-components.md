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

Render-time code stays environment-safe. Browser-only behavior belongs in explicit client-only enhancement paths.
