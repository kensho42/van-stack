# Route Conventions

Filesystem routing autoloads from `src/routes` and usually stays in memory via `loadRoutes({ root: "src/routes" })`. If you need an emitted artifact, the compiler can also write `.van-stack/routes.generated.ts`.

Reserved route filenames:

- `page.ts`
- `hydrate.ts`
- `route.ts`
- `layout.ts`
- `loader.ts`
- `action.ts`
- `entries.ts`
- `meta.ts`
- `error.ts`

Bracket params like `[slug]` compile to canonical paths like `:slug`.

Helpers such as `_components` are ignored unless they use a reserved filename.

`meta.ts` is the route-level place for page metadata such as title, description, and canonical URL.

`hydrate.ts` is the client-only route module for real DOM hydration of `app` routes. It receives the existing SSR root plus bootstrap data and should call `van.hydrate(...)` on the DOM nodes that need to become interactive.

`route.ts` is the raw `Request -> Response` escape hatch for non-HTML routes such as `robots.txt`, `sitemap.xml`, feeds, proxy endpoints, or webhooks.

The runtime route manifest is the bridge between route files and the CSR, SSR, or SSG entrypoints. Most apps can keep it in memory; apps that need an explicit build artifact can persist `.van-stack/routes.generated.ts`. Apps that do not want filesystem routing can still skip this and provide routes manually.
