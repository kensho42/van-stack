# SSG Static Export Design

## Summary

Add a filesystem export path to `van-stack/ssg` so SSG output can be materialized as static files and served by any web server.

The current SSG API, `buildStaticRoutes({ routes })`, only returns in-memory HTML pages. That is useful for demos and caches, but it is not enough for static hosting. The new design keeps that in-memory API and adds an explicit export API that writes:

- HTML document routes
- raw `route.ts` outputs such as `robots.txt`, `feed.xml`, and `sitemap.xml`
- copied asset files and directories

## Goals

- Preserve the existing in-memory SSG path for callers that do not want filesystem output.
- Add a first-class export API in `van-stack/ssg`.
- Support exporting both page routes and raw `route.ts` outputs from the same route graph.
- Support copying explicit static asset files and directories into the export tree.
- Produce an output directory that can be served by any generic static file server.

## Non-Goals

- No hidden `public/` convention in v1.
- No static host config generation for redirects, rewrites, headers, or caching rules.
- No attempt to preserve arbitrary runtime HTTP response headers on plain static hosts.
- No bundler-specific asset pipeline in `van-stack/ssg`.

## API Shape

### Keep `buildStaticRoutes(...)`

`buildStaticRoutes(...)` remains the in-memory primitive, but its output becomes a typed artifact list instead of a page-only list.

Artifact variants:

- HTML document artifact
  - route path
  - emitted file path
  - HTML body
- raw asset artifact
  - route path
  - emitted file path
  - response body bytes
  - response status
  - response headers

This lets the existing demo/runtime cache code keep using the in-memory output while making raw `route.ts` results visible to the caller.

### Add `exportStaticSite(...)`

Add a new writer API:

```ts
await exportStaticSite({
  routes,
  outDir: "dist",
  assets: [
    { from: "public" },
    { from: "static/robots-extra.txt", to: "robots-extra.txt" },
  ],
});
```

Responsibilities:

- call `buildStaticRoutes(...)`
- map route paths to emitted files
- write HTML routes and raw route artifacts into `outDir`
- copy configured files/directories into `outDir`
- return a summary of written files/artifacts

## File Mapping Rules

Route outputs follow static-host-friendly file rules:

- `/` -> `index.html`
- `/about` -> `about/index.html`
- `/posts/github-down` -> `posts/github-down/index.html`
- `/robots.txt` -> `robots.txt`
- `/feed.xml` -> `feed.xml`

Rule:

- HTML document routes emit directory-style `index.html`
- raw `route.ts` outputs emit to the literal request pathname

This avoids guessing extensions for non-HTML content.

## Route Expansion Rules

Route expansion stays aligned with the current SSG contract:

- static paths without params build once without `entries.ts`
- dynamic paths still require `entries.ts`
- this applies to both `page.ts` and `route.ts`

If a dynamic route lacks `entries.ts`, SSG throws the existing missing-entries error.

## Raw Route Export Rules

`route.ts` is now exportable through SSG when it resolves to a concrete path during the build.

Behavior:

- SSG calls the route handler through the existing SSR request path.
- response body is fully read during the build.
- status and headers are returned in the in-memory artifact metadata.
- filesystem export writes the body bytes to disk.

Constraint:

- generic static file hosts only serve bytes from files, so response metadata cannot be enforced by the framework after export. The API can surface headers and status in memory, but the filesystem writer should not claim that those semantics survive on every host.

## Asset Copying

Asset copying is explicit and opt-in:

```ts
assets: [
  { from: "public" },
  { from: "static/favicon.ico" },
  { from: "static/feeds", to: "feeds" },
]
```

Rules:

- `from` may be a file or a directory
- `to` is optional and is relative to `outDir`
- if `to` is omitted, preserve the source basename at the output root
- directories copy recursively
- files overwrite existing files at the destination path

This keeps asset export deterministic without introducing framework-owned directory conventions.

## Error Handling

- throw if a dynamic route is missing `entries.ts`
- throw if an export asset source does not exist
- throw if a raw route returns a body that cannot be read during export
- throw if two emitted artifacts resolve to the same output path

Collision detection matters because `route.ts` and copied assets can otherwise silently overwrite each other.

## Testing

Add coverage for:

- HTML file emission for `/` and nested routes
- raw `route.ts` emission for fixed paths like `/robots.txt`
- dynamic `route.ts` emission through `entries.ts`
- collision detection between route output and copied assets
- copying files and directories through `assets`
- docs coverage for the new export API and static-hosting story

## Documentation

Update:

- `README.md`
- `docs/getting-started.md`
- `docs/demos.md`
- `docs/bun.md`
- `demo/ssg-site/README.md`

The public docs should describe `buildStaticRoutes(...)` as the in-memory primitive and `exportStaticSite(...)` as the deployable static export path.
