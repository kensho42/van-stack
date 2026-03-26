# Showcase Demo

The showcase is the evaluator-first demo entrypoint for `van-stack`.

It ships one shared blog app, `Northstar Journal`, and presents it through three evaluator tracks:

- `Runtime Gallery`: live `ssg`, `ssr`, `hydrated`, `islands`, `shell`, `custom`, and `chunked` routes
- `Guided Walkthrough`: annotated evaluator pages for those same seven modes
- `Adaptive Navigation`: a separate `stack` presentation track over the same blog graph

The gallery route surface is:

- `/gallery/<mode>/`
- `/gallery/<mode>/posts`
- `/gallery/<mode>/posts/:slug`
- `/gallery/<mode>/authors`
- `/gallery/<mode>/authors/:slug`
- `/gallery/<mode>/categories`
- `/gallery/<mode>/categories/:slug`
- `/gallery/<mode>/tags`
- `/gallery/<mode>/tags/:slug`

The adaptive route surface mirrors the same blog graph under `/adaptive`:

- `/adaptive`
- `/adaptive/posts`
- `/adaptive/posts/:slug`
- `/adaptive/authors`
- `/adaptive/authors/:slug`
- `/adaptive/categories`
- `/adaptive/categories/:slug`
- `/adaptive/tags`
- `/adaptive/tags/:slug`

On post detail routes, likes and bookmarks are stored on the server for the current session. `hydrated` pre-renders those values into the HTML and then remounts the live route by default; `islands` keeps the document server-owned and uses `hydrate.ts` as the low-level enhance hook for the marked controls. `shell`, `custom`, and `chunked` reuse the same interaction API after client-side rendering. `chunked` keeps the same gallery content but loads route modules from a browser-safe generated manifest so the browser entry can split one chunk per route family.

Run it from the repo root:

```bash
bun run start
```

The older demo folders remain focused references once you want to inspect one runtime area in isolation.
