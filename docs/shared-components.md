# Shared Components

Shared components are written against `van-stack/render` instead of importing `vanjs-core` or the server-side Van runtime directly.

```ts
import { van } from "van-stack/render";

const { article, h1 } = van.tags;

export default function page() {
  const count = van.state(0);

  return article(
    h1("Shared Component"),
    () => `Count: ${count.val}`,
  );
}
```

Runtime/bootstrap code binds the concrete Van implementation through `bindRenderEnv(...)`. Route modules and shared components should not care whether the active runtime is `vanjs-core` or `mini-van-plate`.

Render-time code stays environment-safe. Browser-only behavior belongs in explicit client-only enhancement paths.
