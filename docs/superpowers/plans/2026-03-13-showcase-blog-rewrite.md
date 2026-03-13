# Showcase Blog Rewrite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `demo/showcase` into a runnable `Northstar Journal` blog app that proves `ssg`, `ssr`, `hydrated`, `shell`, and `custom` delivery modes through one shared content graph.

**Architecture:** Rebuild the showcase around a shared editorial domain layer, shared UI primitives, and a runtime host that serves three kinds of output: pre-generated SSG HTML, server-rendered SSR/hydrated pages, and minimal shell documents for shell/custom client apps. Keep mode-specific route files thin by pushing page assembly into shared route-helper modules, and treat any framework defects or missing capabilities exposed by the rewrite as package work with failing tests first. The demos should consume framework features honestly; they should not ship showcase-only shims that paper over missing platform behavior.

**Tech Stack:** Bun, TypeScript, Vitest, Biome, `van-stack/compiler`, `van-stack/csr`, `van-stack/ssr`, `van-stack/ssg`, `van-stack/render`

---

## File Structure

- Modify: `package.json`
  - keep the root `start` script pointed at the showcase runtime and update it only if the runtime startup contract changes
- Modify: `tests/showcase/app.test.ts`
  - replace the thin route assertions with contract coverage for the full route graph, runtime-specific boot behavior, and SSG/static handling
- Modify: `tests/showcase/content.test.ts`
  - require the 30-post dataset, entity counts, canonical comparison targets, and graph integrity
- Modify: `tests/docs-and-demos.test.ts`
  - update showcase expectations to the new five-mode story and remove adaptive-navigation references from showcase docs assertions
- Create: `demo/showcase/src/content/catalog.ts`
  - raw authored fixtures for posts, authors, categories, and tags
- Modify: `demo/showcase/src/content/blog.ts`
  - public types, lookups, archive helpers, related-content helpers, and canonical comparison-target helpers
- Modify: `demo/showcase/src/content/modes.ts`
  - mode metadata for `ssg`, `ssr`, `hydrated`, `shell`, and `custom`, plus default gallery targets and walkthrough links
- Modify: `demo/showcase/src/components/blog.ts`
  - keep or replace the existing post-formatting helpers so any surviving blog-specific presentation utilities align with the rewritten dataset
- Create: `demo/showcase/src/components/editorial.ts`
  - shared publication UI: hero, article layout, archive cards, taxonomy blocks, author sections
- Create: `demo/showcase/src/components/runtime.ts`
  - small evaluator aids: mode pill, powered-by panel, sibling-mode links, walkthrough callouts
- Modify: `demo/showcase/src/components/chrome.ts`
  - top-level site shell, navigation, mode switcher, and showcase landing-track helpers
- Create: `demo/showcase/src/route-helpers/gallery.ts`
  - shared page builders for homepage, list pages, detail pages, and not-found states
- Create: `demo/showcase/src/route-helpers/walkthrough.ts`
  - shared walkthrough page builders that point back into the live gallery
- Modify: `demo/showcase/src/runtime/data.ts`
  - pure page-data resolvers for home, posts, authors, categories, tags, and comparison targets
- Create: `demo/showcase/src/runtime/api.ts`
  - request handlers for `/_van-stack/data/...` transport responses and `/api/showcase/...` JSON responses
- Create: `demo/showcase/src/runtime/assets.ts`
  - Bun-powered client bundle builder and asset responder for hydrated/shell/custom browser entries
- Delete: `demo/showcase/src/runtime/client-manifest.ts`
  - remove the placeholder client manifest once real bundled assets and mode metadata own those responsibilities
- Modify: `demo/showcase/src/runtime/ssg-cache.ts`
  - materialize `/gallery/ssg/*` HTML at startup via `buildStaticRoutes` and serve it as static output
- Modify: `demo/showcase/src/runtime/app.ts`
  - central request router: SSG cache, SSR render path, shell/custom HTML shells, internal data endpoints, custom JSON API, branded 404s
- Modify: `demo/showcase/src/runtime/server.ts`
  - HTTP server wrapper plus startup hooks for asset building and SSG cache warm-up
- Modify: `demo/showcase/src/runtime/start.ts`
  - boot the new server lifecycle and log the live URL
- Create: `demo/showcase/src/client/hydrated.ts`
  - browser entry that calls `hydrateApp({ routes })` for `/gallery/hydrated/*`
- Create: `demo/showcase/src/client/shell.ts`
  - browser entry that creates a `shell` router and renders the shared route surface from transport data
- Create: `demo/showcase/src/client/custom.ts`
  - browser entry that creates a `custom` router and lets route components fetch from the demo JSON API
- Create: `demo/showcase/src/client/routes.ts`
  - shared client-side route definitions used by hydrated, shell, and custom browser entries
- Modify: `demo/showcase/src/routes/index/page.ts`
  - landing page for the rewritten showcase
- Modify: `demo/showcase/src/routes/gallery/index/page.ts`
  - five-mode overview page with canonical comparison links
- Create: `demo/showcase/src/routes/gallery/ssr/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/posts/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/page.ts`
- Modify: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/page.ts`
- Modify: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/loader.ts`
- Modify: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/hydrate.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/index/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/posts/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/posts/loader.ts`
- Modify: `demo/showcase/src/routes/gallery/shell/posts/[slug]/page.ts`
- Modify: `demo/showcase/src/routes/gallery/shell/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/custom/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/posts/page.ts`
- Modify: `demo/showcase/src/routes/gallery/custom/posts/[slug]/page.ts`
- Delete: `demo/showcase/src/routes/gallery/custom/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/custom/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/posts/page.ts`
- Modify: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/page.ts`
- Modify: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/loader.ts`
- Modify: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/[slug]/entries.ts`
- Modify: `demo/showcase/src/routes/walkthrough/index/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/ssr/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/hydrated/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/shell/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/custom/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/ssg/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/ssg/loader.ts`
- Delete: `demo/showcase/src/routes/gallery/adaptive/layout.ts`
- Delete: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/loader.ts`
- Delete: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/page.ts`
- Delete: `demo/showcase/src/routes/walkthrough/adaptive/page.ts`
- Modify: `demo/showcase/README.md`
  - describe the rewritten five-mode app and exact route structure
- Modify: `README.md`
  - update the demo section so showcase compares `ssg`, `ssr`, `hydrated`, `shell`, and `custom`
- Modify: `docs/demos.md`
  - update the showcase description and keep `demo/adaptive-nav` as the separate adaptive reference
- Modify: `demo/csr/README.md`
- Modify: `demo/ssr-blog/README.md`
- Modify: `demo/ssg-site/README.md`
- Modify: `demo/adaptive-nav/README.md`
  - keep the focused demo docs aligned with the rewritten showcase positioning
- Conditional modify: `packages/*/src/*.ts`, matching `tests/**/*.test.ts`
  - when the rewrite exposes framework bugs or missing capabilities needed for honest runnable delivery

## Framework-First Rule

- Do not add demo-only workarounds for framework gaps.
- If the showcase needs a capability that should belong to `van-stack` itself, add it under `packages/*` with package-level tests first.
- Only keep logic in `demo/showcase` when it is truly demo-specific:
  - publication content
  - visual presentation
  - showcase runtime composition
  - demo JSON fixtures and endpoints
- Use the showcase as the reproduction case, but land the durable behavior in the framework.

## Chunk 1: Lock The Contract And Shared Domain

### Task 1: Rewrite the showcase contract tests

**Files:**
- Modify: `tests/showcase/app.test.ts`
- Modify: `tests/showcase/content.test.ts`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Expand the failing showcase tests**
  - Replace adaptive showcase assertions with the approved five-mode set: `ssg`, `ssr`, `hydrated`, `shell`, `custom`.
  - Require `/gallery` to link to the default comparison targets for all five modes.
  - Require the exact gallery route surface for every mode:
    - `/gallery/<mode>/`
    - `/gallery/<mode>/posts`
    - `/gallery/<mode>/posts/:slug`
    - `/gallery/<mode>/authors`
    - `/gallery/<mode>/authors/:slug`
    - `/gallery/<mode>/categories`
    - `/gallery/<mode>/categories/:slug`
    - `/gallery/<mode>/tags`
    - `/gallery/<mode>/tags/:slug`
  - Keep the assertions lightweight by checking one canonical slug for each entity family per mode instead of snapshotting every page body.
  - Assert the boot contract:
    - `ssr` returns full article HTML without app-root takeover markers
    - `hydrated` returns SSR HTML plus bootstrap payload and client boot script
    - `shell` and `custom` return minimal shell HTML plus client boot script, not pre-rendered article bodies
    - `ssg` returns fully rendered static HTML for its routes without client boot markers
  - Tighten docs assertions so showcase copy no longer claims adaptive navigation is part of the gallery.
- [ ] **Step 2: Run the focused contract tests**
  - Run: `bun run test tests/showcase/app.test.ts tests/docs-and-demos.test.ts`
  - Expected: FAIL because the current showcase still exposes adaptive routes, thin content, and non-runnable shell/custom behavior.
- [ ] **Step 3: Rewrite the shared content contract**
  - Update `tests/showcase/content.test.ts` so it requires:
    - `30` posts
    - `8` authors
    - `8` categories
    - `12` tags
    - cross-link integrity for author/category/tag archives
    - a shared exported canonical comparison slug and per-mode target metadata used by `/gallery`
  - Keep the tests focused on selectors and graph invariants, not exact prose copy.
- [ ] **Step 4: Re-run the focused contract tests**
  - Run: `bun run test tests/showcase/app.test.ts tests/showcase/content.test.ts tests/docs-and-demos.test.ts`
  - Expected: FAIL with missing routes/data/helpers, but the new assertions should load and point at the approved contract.
- [ ] **Step 5: Commit the contract rewrite**

```bash
git add tests/showcase/app.test.ts tests/showcase/content.test.ts tests/docs-and-demos.test.ts
git commit -m "test: define showcase rewrite contract"
```

### Task 2: Build the shared editorial domain and display primitives

**Files:**
- Create: `demo/showcase/src/content/catalog.ts`
- Modify: `demo/showcase/src/content/blog.ts`
- Modify: `demo/showcase/src/content/modes.ts`
- Modify: `demo/showcase/src/components/blog.ts`
- Create: `demo/showcase/src/components/editorial.ts`
- Create: `demo/showcase/src/components/runtime.ts`
- Modify: `demo/showcase/src/components/chrome.ts`

- [ ] **Step 1: Author the full dataset**
  - Move raw fixture arrays into `demo/showcase/src/content/catalog.ts`.
  - Add believable editorial fixtures for `30` posts, `8` authors, `8` categories, and `12` tags.
  - Make one post slug the canonical cross-mode comparison target and export it as shared domain data consumed by tests, mode metadata, and `/gallery` links.
- [ ] **Step 2: Implement derived selectors and mode metadata**
  - Rewrite `demo/showcase/src/content/blog.ts` to expose typed lookups, archive resolvers, related-content helpers, branded not-found helpers, and the shared canonical comparison slug/helper exports.
  - Rewrite `demo/showcase/src/content/modes.ts` to expose only `ssg`, `ssr`, `hydrated`, `shell`, and `custom`, with exact gallery and walkthrough targets plus the canonical `/gallery/<mode>/posts/:slug` comparison targets for all five modes.
- [ ] **Step 3: Implement shared UI primitives**
  - Move publication layout, homepage sections, archive cards, article sections, taxonomy chips/links, mode pills, “what powered this page” panels, and sibling-mode links into the shared component/helper modules.
  - Ensure the shared editorial primitives can compose posts, authors, categories, and tags list pages as well as their detail layouts, so later route files stay thin.
  - Make `demo/showcase/src/components/chrome.ts` the clear owner for top-level site chrome and navigation while `editorial.ts` owns reusable publication sections and `runtime.ts` owns evaluator-facing diagnostics.
  - Keep `demo/showcase/src/components/blog.ts` as a tiny formatting helper module only; move all broader presentation responsibilities into `editorial.ts`, `runtime.ts`, and `chrome.ts`.
  - Keep the runtime aids separate from the editorial layout helpers so the pages stay readable and the files stay small.
- [ ] **Step 4: Run the shared-domain tests**
  - Run: `bun run test tests/showcase/content.test.ts`
  - Expected: PASS.
  - `tests/showcase/app.test.ts` and `tests/docs-and-demos.test.ts` are still expected to fail at this point because the route/runtime and walkthrough/doc work lands in later chunks.
- [ ] **Step 5: Commit the shared foundation**

```bash
git add demo/showcase/src/content demo/showcase/src/components tests/showcase/content.test.ts
git commit -m "feat: rebuild showcase editorial domain"
```

## Chunk 2: Runtime Host And Mode Delivery Paths

### Task 3: Build the runtime host, asset pipeline, transport surfaces, and required framework support

**Files:**
- Modify: `package.json`
- Create: `demo/showcase/src/runtime/api.ts`
- Create: `demo/showcase/src/runtime/assets.ts`
- Modify: `demo/showcase/src/runtime/data.ts`
- Modify: `demo/showcase/src/runtime/app.ts`
- Modify: `demo/showcase/src/runtime/server.ts`
- Modify: `demo/showcase/src/runtime/start.ts`
- Modify: `demo/showcase/src/runtime/ssg-cache.ts`
- Delete: `demo/showcase/src/runtime/client-manifest.ts`
- Create: `demo/showcase/src/client/routes.ts`
- Create: `demo/showcase/src/client/hydrated.ts`
- Create: `demo/showcase/src/client/shell.ts`
- Create: `demo/showcase/src/client/custom.ts`
- Conditional modify: `packages/*/src/*.ts`
- Conditional test: `tests/**/*.test.ts`

- [ ] **Step 1: Add the failing runtime-host assertions**
  - Expand `tests/showcase/app.test.ts` to require:
    - the repo-root `package.json` `start` script to delegate to the showcase runtime entry used by `bun run start`
    - bundled client asset URLs for `hydrated`, `shell`, and `custom`
    - hydrated documents to point at the browser entry that performs the `hydrateApp(...)` takeover
    - `/_van-stack/data/...` responses for shell routes
    - `/api/showcase/...` JSON responses for custom-mode entity fetches
    - `/gallery/custom/*` routes to avoid `/_van-stack/data/...` transport
    - startup-built SSG cache entries for homepage, list pages, and entity pages
  - If any failure shows a framework defect or missing capability instead of a missing showcase file, add a targeted failing package test under `tests/*` before writing the fix.
- [ ] **Step 2: Run the focused runtime tests**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: FAIL because the current runtime only serves SSR pages and thin placeholders.
- [ ] **Step 3: Implement the asset and request host**
  - Keep the repo-root `package.json` `start` script pointed at `demo/showcase/src/runtime/start.ts`, updating the script only if the showcase startup contract changes.
  - Add `demo/showcase/src/runtime/assets.ts` to bundle browser entries with `Bun.build` and serve them from the showcase server.
  - Add `demo/showcase/src/runtime/api.ts` to answer:
    - internal VanStack transport requests under `/_van-stack/data/...`
    - custom-mode JSON requests under `/api/showcase/...`
  - Implement `demo/showcase/src/client/hydrated.ts` so it performs the actual `hydrateApp({ routes })` takeover used by `/gallery/hydrated/*`.
  - If the current framework cannot support any of these flows cleanly, add the missing capability in the appropriate `packages/*` module instead of encoding a one-off showcase workaround.
  - Rewrite `demo/showcase/src/runtime/app.ts` so it:
    - short-circuits `/gallery/ssg/*` to pre-generated HTML from `ssg-cache`
    - serves minimal HTML shells for `/gallery/shell/*` and `/gallery/custom/*`
    - serves SSR pages for `/gallery/ssr/*`, `/gallery/hydrated/*`, `/gallery`, `/walkthrough`, and `/`
    - emits true `404` responses for missing entity slugs and unknown routes
  - Rewrite `demo/showcase/src/runtime/ssg-cache.ts` so startup materializes `/gallery/ssg/*` once and walkthrough pages can read the generated HTML excerpts.
  - Delete `demo/showcase/src/runtime/client-manifest.ts` once its placeholder hints are replaced by real asset output and mode metadata.
  - Keep any package change minimal and reusable, then wire the showcase to consume it normally.
- [ ] **Step 4: Re-run the focused runtime tests**
  - Run: `bun run test tests/showcase/app.test.ts tests/csr/router.test.ts tests/csr/hydrate-app.test.ts tests/ssg/build.test.ts`
  - Expected: PASS for the runtime-host assertions and any touched package tests. The only remaining allowed failures at this checkpoint are route-tree assertions intentionally deferred to Tasks 4 and 5.
  - Run: `bun run start`
  - Expected: the repo-root start command boots the evaluator-first showcase app; confirm `/` renders the showcase landing page and `/gallery` introduces the five-mode comparison surface, then stop the server.
- [ ] **Step 5: Commit the runtime host**

```bash
git add package.json demo/showcase/src/runtime demo/showcase/src/client tests/showcase/app.test.ts tests/csr tests/ssr tests/ssg packages/csr packages/ssr packages/ssg
git commit -m "feat: add showcase runtime host"
```

### Task 4: Implement the SSR and hydrated route trees

**Files:**
- Create: `demo/showcase/src/routes/gallery/ssr/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/posts/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssr/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/page.ts`
- Modify: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/page.ts`
- Modify: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/loader.ts`
- Modify: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/hydrate.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/route-helpers/gallery.ts`

- [ ] **Step 1: Add the failing SSR/hydrated route assertions**
  - Extend `tests/showcase/app.test.ts` so it requires:
    - `/gallery/ssr/` and `/gallery/hydrated/` homepages
    - list pages for posts, authors, categories, and tags
    - detail pages for authors, categories, and tags
    - hydrated responses to include bootstrap payload, client asset tags, and the exact `hydrateApp(...)` handoff path
    - SSR responses to omit hydration bootstrap, client asset, and app-takeover markers
- [ ] **Step 2: Run the focused route tests**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: FAIL because the expanded route surface and shared gallery helpers do not exist yet.
- [ ] **Step 3: Implement shared loader-backed pages**
  - Use `demo/showcase/src/route-helpers/gallery.ts` to build one homepage renderer, one archive-page renderer, and one entity-detail renderer reused by SSR and hydrated wrappers.
  - Keep the actual route files thin: loader-backed detail routes next to `page.ts`, page-only list/home routes when shared helpers already assemble the data.
  - Add one meaningful `hydrate.ts` interaction on hydrated post pages so the handoff proves more than link interception.
- [ ] **Step 4: Re-run the focused route tests**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: PASS for SSR and hydrated route assertions.
- [ ] **Step 5: Commit the SSR/hydrated routes**

```bash
git add demo/showcase/src/routes/gallery/ssr demo/showcase/src/routes/gallery/hydrated demo/showcase/src/route-helpers/gallery.ts tests/showcase/app.test.ts
git commit -m "feat: add showcase ssr and hydrated routes"
```

### Task 5: Implement the shell, custom, and SSG route trees

**Files:**
- Create: `demo/showcase/src/routes/gallery/shell/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/index/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/posts/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/posts/loader.ts`
- Modify: `demo/showcase/src/routes/gallery/shell/posts/[slug]/page.ts`
- Modify: `demo/showcase/src/routes/gallery/shell/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/loader.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/custom/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/posts/page.ts`
- Modify: `demo/showcase/src/routes/gallery/custom/posts/[slug]/page.ts`
- Delete: `demo/showcase/src/routes/gallery/custom/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/custom/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/posts/page.ts`
- Modify: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/page.ts`
- Modify: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/loader.ts`
- Modify: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/authors/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/categories/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/tags/[slug]/entries.ts`

- [ ] **Step 1: Add the failing shell/custom/SSG assertions**
  - Extend `tests/showcase/app.test.ts` so it requires:
    - shell and custom list/detail routes for posts, authors, categories, and tags
    - shell internal data responses for list and detail routes
    - custom JSON API responses for list and detail routes
    - SSG startup cache entries for post, author, category, and tag detail pages
  - Require one sample walkthrough excerpt to use generated SSG HTML instead of handwritten copy.
- [ ] **Step 2: Run the focused mode tests**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: FAIL because the full route families, custom-mode loader removal, and SSG entry coverage are still missing or incomplete.
- [ ] **Step 3: Implement the three route families**
  - Add shell route files with loader-backed pages so `/_van-stack/data/...` can resolve the same graph without SSR HTML.
  - Delete the existing custom post `loader.ts`, then add custom route files that render loading states first and fetch data inside the client components from `/api/showcase/...`, with no `/_van-stack/data/...` dependency.
  - Add SSG route files plus `entries.ts` for every dynamic detail route so startup can materialize the full static graph.
- [ ] **Step 4: Re-run the focused mode tests**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: PASS for shell/custom/SSG assertions.
- [ ] **Step 5: Commit the remaining mode routes**

```bash
git add demo/showcase/src/routes/gallery/shell demo/showcase/src/routes/gallery/custom demo/showcase/src/routes/gallery/ssg tests/showcase/app.test.ts
git commit -m "feat: add showcase shell custom and ssg routes"
```

## Chunk 3: Walkthrough, Docs, And Final Hardening

### Task 6: Rewrite the walkthrough and documentation surfaces

**Files:**
- Modify: `demo/showcase/src/routes/index/page.ts`
- Modify: `demo/showcase/src/routes/gallery/index/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/index/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/ssr/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/hydrated/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/shell/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/custom/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/ssg/page.ts`
- Modify: `demo/showcase/src/routes/walkthrough/ssg/loader.ts`
- Create: `demo/showcase/src/route-helpers/walkthrough.ts`
- Delete: `demo/showcase/src/routes/gallery/adaptive/layout.ts`
- Delete: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/loader.ts`
- Delete: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/page.ts`
- Delete: `demo/showcase/src/routes/walkthrough/adaptive/page.ts`
- Modify: `demo/showcase/README.md`
- Modify: `README.md`
- Modify: `docs/demos.md`
- Modify: `demo/csr/README.md`
- Modify: `demo/ssr-blog/README.md`
- Modify: `demo/ssg-site/README.md`
- Modify: `demo/adaptive-nav/README.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Add the failing walkthrough/doc assertions**
  - Require `/walkthrough`, `/walkthrough/ssr`, `/walkthrough/hydrated`, `/walkthrough/shell`, `/walkthrough/custom`, and `/walkthrough/ssg`.
  - Require `/walkthrough` to link back to `/gallery`, and require every mode-specific walkthrough page to link back to its canonical `/gallery/<mode>/posts/:slug` comparison route while naming the runtime files involved.
  - Tighten docs tests to the explicit file list above and require showcase copy to mention only the approved five modes.
  - Assert that adaptive gallery/walkthrough routes are gone from the showcase app while `demo/adaptive-nav` remains documented as the separate focused demo.
- [ ] **Step 2: Run the focused walkthrough/doc tests**
  - Run: `bun run test tests/showcase/app.test.ts tests/docs-and-demos.test.ts`
  - Expected: FAIL because the new walkthrough pages and docs wording do not exist yet.
- [ ] **Step 3: Implement the walkthrough and docs rewrite**
  - Rewrite the landing and gallery overview pages so they introduce the five-mode blog app and point at canonical comparison targets.
  - Use `demo/showcase/src/route-helpers/walkthrough.ts` to keep walkthrough copy shared and thin.
  - Make `/walkthrough` point back to `/gallery`, and make each mode-specific walkthrough page point back to that mode's exact live gallery comparison route at `/gallery/<mode>/posts/:slug`.
  - Make the walkthrough copy and navigation frame the live gallery as the primary demo surface and the walkthrough as explanatory support, not as a parallel entrypoint.
  - Remove adaptive-navigation files from the showcase route tree, but keep `demo/adaptive-nav` positioned as the separate focused reference.
  - Update the explicit docs list so README and demos docs match the rewritten showcase story.
- [ ] **Step 4: Re-run the focused walkthrough/doc tests**
  - Run: `bun run test tests/showcase/app.test.ts tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit the walkthrough/docs rewrite**

```bash
git add demo/showcase/src/routes demo/showcase/src/route-helpers/walkthrough.ts demo/showcase/README.md README.md docs/demos.md demo/csr/README.md demo/ssr-blog/README.md demo/ssg-site/README.md demo/adaptive-nav/README.md tests/docs-and-demos.test.ts
git commit -m "docs: rewrite showcase walkthrough and demo docs"
```

### Task 7: Final verification and cleanup

**Files:**
- Modify if needed: `demo/showcase/src/content/modes.ts`
- Modify if needed: `demo/showcase/src/runtime/app.ts`
- Modify if needed: `demo/showcase/src/runtime/server.ts`
- Modify: `tests/showcase/app.test.ts`
- Modify: `tests/showcase/content.test.ts`
- Modify: `tests/docs-and-demos.test.ts`
- Conditional stage only: `package.json`, `packages/*/src/*.ts`, `tests/**/*.test.ts`
- Inspect: `git status --short`

- [ ] **Step 1: Remove any leftover adaptive showcase references or dead helpers**
  - Delete or rewrite any leftover imports, links, or copy that still mention adaptive routes inside the showcase workspace, README files, and public docs updated by this rewrite.
  - Keep the focused adaptive demo and docs intact.
- [ ] **Step 2: Run the targeted showcase tests**
  - Run: `bun run test tests/showcase/app.test.ts tests/showcase/content.test.ts tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 3: Run the full required verification**
  - Run: `bun run test`
  - Expected: PASS.
  - Run: `bun run check`
  - Expected: PASS.
  - Run: `bun run build`
  - Expected: PASS.
- [ ] **Step 4: Inspect the final diff**
  - Run: `git status --short`
  - Expected: only the planned showcase, docs, tests, and any package feature/bug-fix files are modified.
- [ ] **Step 5: Commit the finished rewrite**

```bash
git add package.json tests/showcase tests/docs-and-demos.test.ts demo/showcase README.md docs/demos.md demo/csr/README.md demo/ssr-blog/README.md demo/ssg-site/README.md demo/adaptive-nav/README.md packages/csr packages/ssr packages/ssg tests/csr tests/ssr tests/ssg
git commit -m "feat: rewrite showcase blog demo"
```
