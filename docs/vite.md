# Optional Vite Integration

`van-stack/vite` is optional. It exists to improve filesystem-route DX, route-aware HMR, development-time integration, and third-party Van compatibility in Vite-owned runtimes.

Route discovery itself belongs to the compiler layer, not to Vite. The compiler can discover `src/routes` and either load routes in memory or generate `.van-stack/routes.generated.ts` without any bundler-specific behavior.

Vite only adds:

- dev-time route discovery refresh
- route-aware HMR
- build-time integration around the runtime route manifest
- resolver aliases for imported packages that hard-import `vanjs-core` and `vanjs-ext`

Use the plugin in Vite apps:

```ts
import { defineConfig } from "vite";
import { vanStackVite } from "van-stack/vite";

export default defineConfig({
  plugins: [vanStackVite()],
});
```

Reuse the exact same alias map in Vitest or a custom Vite config:

```ts
import { defineConfig } from "vitest/config";
import { getVanStackCompatAliases } from "van-stack/vite";

export default defineConfig({
  resolve: {
    alias: getVanStackCompatAliases(),
  },
});
```

This compatibility path only works if the aliases are active before the third-party package is evaluated.

The core routing model and route discovery path stay usable without Vite.
