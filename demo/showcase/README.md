# Showcase Demo

The showcase is the evaluator-first demo entrypoint for `van-stack`.

It ships one shared blog app, `Northstar Journal`, and presents it through three evaluator tracks:

- `Runtime Gallery`: live `ssg`, `ssr`, `hydrated`, `islands`, `shell`, and `custom` routes
- `Guided Walkthrough`: annotated evaluator pages for those same six modes
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

On post detail routes, likes and bookmarks are stored on the server for the current session. `hydrated` and `islands` pre-render those values into the HTML and continue them through component-level hydration; `shell` and `custom` reuse the same interaction API after client-side rendering.

Run it from the repo root:

```bash
bun run start
```

The older demo folders remain focused references once you want to inspect one runtime area in isolation.
