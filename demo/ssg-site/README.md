# SSG Demo

Demonstrates static generation from route entries discovered under `src/routes`, loaded through the compiler at runtime, and rendered through `van-stack/render`.

Use `buildStaticRoutes({ routes })` when you want in-memory HTML or raw route artifacts for previews and cache warm-up. Use `exportStaticSite({ routes, outDir, assets })` when you want a real static output tree with:

- HTML documents
- raw `route.ts` outputs such as `robots.txt` or `feed.xml`
- copied asset files and directories

That export tree can be served by any generic web server.

Run the demo export from the repo root:

```bash
bun ./demo/ssg-site/build.ts
```

That writes `demo/ssg-site/dist/` with:

- `index.html`
- `posts/launch-week/index.html`
- `posts/cdn-cutover/index.html`
- `robots.txt`
- `assets/site.css`
- `assets/images/pattern.txt`

For the quickest evaluator flow, start with `bun run start` and `demo/showcase`. This folder stays as the focused reference for the SSG path after the six-mode showcase.
