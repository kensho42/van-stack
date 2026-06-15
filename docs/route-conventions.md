# Route Conventions

Filesystem routing autoloads from `src/routes` and usually stays in memory via `loadRoutes({ root: "src/routes" })` for Node, SSR, SSG, and build tooling. Vite browser CSR apps should configure `vanStackVite({ routes: { root: "src/routes" } })` and import `virtual:van-stack/routes`. If you need an emitted artifact, the compiler can also write `.van-stack/routes.generated.ts`.

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

Parenthesized directories are pathless route groups. They organize route files and can own `layout.ts`, but they do not add URL segments:

```text
src/routes/
  (public)/
    layout.ts
    login/
      page.ts
  (private)/
    layout.ts
    dashboard/
      page.ts
```

In that shape, `src/routes/(public)/login/page.ts` matches `/login`, `src/routes/(private)/dashboard/page.ts` matches `/dashboard`, and each branch is wrapped by its group `layout.ts`. Group names stay in route IDs such as `(public)/login`, which keeps manifests, chunk exclusions, and bootstrap route IDs unambiguous. Route groups may be nested.

Duplicate public route patterns are rejected at compile time. For example, `(public)/login/page.ts` and `(private)/login/page.ts` both compile to `/login`, and `(a)/posts/[slug]/page.ts` conflicts with `(b)/posts/[id]/page.ts` because both match the same public pattern.

Pathless `@slot` directories compile as named parallel branches under the nearest owning `layout.ts`:

```text
src/routes/app/
  layout.ts
  page.ts
  @sidebar/
    page.ts
  users/
    [id]/
      page.ts
```

In that shape:

- `src/routes/app/layout.ts` owns the slot boundary
- `src/routes/app/page.ts` or deeper descendants remain the default branch and are passed to `layout.ts` as `children`
- `src/routes/app/@sidebar/page.ts` is passed to `layout.ts` as `slots.sidebar`
- `slotData.sidebar` carries the named slot loader result when a slot branch defines `loader.ts`
- named slots are pathless in URLs, and the slot-root `page.ts` is the fallback when a deeper slot route does not match the current URL

Named slot branches support these route files:

- `page.ts`
- `hydrate.ts`
- `layout.ts`
- `loader.ts`
- `error.ts`

Named slots do not own `meta.ts`, `route.ts`, `entries.ts`, or `action.ts`. Those stay on the default branch.

Helpers such as `_components` are ignored unless they use a reserved filename.

`meta.ts` is the route-level place for page metadata such as title, description, and canonical URL.

`page.ts` receives `{ data, params, query, path, pathname }`. `data` is the resolved route data when the active runtime provides it. `params` comes from bracket segments such as `[slug]`. `query` is a `URLSearchParams` for the current URL. `path` includes the query string, while `pathname` excludes it.

`loader.ts` receives `{ params, request }`, which gives SSR and hydrated routes access to per-request state like cookies or headers without leaving the route module model.

`hydrate.ts` receives `{ root, data, params, query, path, pathname }` and is the client-only low-level enhance hook. On `app` branches it is optional: if present, VanStack preserves the existing SSR DOM for that route or named slot and lets `hydrate.ts` attach behavior with `van.hydrate(...)`; if absent, the matched `page.ts` remounts by default. On `islands` branches, `hydrate.ts` is the normal enhancement hook.

`layout.ts` receives `{ children, data, slots, slotData, params, query, path, pathname }`. `children` is the default branch, while `slots` and `slotData` expose any active named `@slot` branches owned by that layout directory.

`route.ts` is the raw `Request -> Response` escape hatch for non-HTML routes such as `robots.txt`, `sitemap.xml`, feeds, proxy endpoints, or webhooks.

The runtime route manifest is the bridge between route files and the CSR, SSR, or SSG entrypoints. Most server and build entrypoints can keep it in memory, while Vite browser CSR apps can consume the official virtual route module. Apps that need an explicit build artifact can persist `.van-stack/routes.generated.ts` and pass it into `startClientApp({ routes, ... })` for custom browser chunking flows. When chunking should be template-wide instead of ad hoc, the compiler also accepts `chunkedRoutes` so app templates can mark route branches chunked or eager at build time. Apps that do not want filesystem routing can still skip this and provide routes manually.
