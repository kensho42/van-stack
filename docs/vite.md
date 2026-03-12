# Optional Vite Integration

`van-stack/vite` is optional. It exists to improve filesystem-route DX, route-aware HMR, and development-time integration.

Route discovery itself belongs to the compiler layer, not to Vite. The compiler can discover `src/routes` and either load routes in memory or generate `.van-stack/routes.generated.ts` without any bundler-specific behavior.

Vite only adds:

- dev-time route discovery refresh
- route-aware HMR
- build-time integration around the runtime route manifest

The core routing model and route discovery path stay usable without Vite.
