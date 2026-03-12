# Showcase Demos Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a runnable evaluator-first showcase under `demo/showcase` and make `bun run start` launch it as the default demo entrypoint.

**Architecture:** Build one shared blog showcase app with two demo tracks: a live `Runtime Gallery` and an annotated `Guided Walkthrough`. Use filesystem route modules under `demo/showcase/src/routes`, shared content/helpers under `demo/showcase/src/content` and `demo/showcase/src/components`, and a repo-root start command that runs a small HTTP server to serve the showcase plus any generated SSG output.

**Tech Stack:** Bun, TypeScript, Biome, Vitest, `van-stack/compiler`, `van-stack/csr`, `van-stack/ssr`, `van-stack/ssg`, `van-stack/render`

---

## File Structure

- Modify: `package.json`
  - add the root `start` script
- Modify: `tests/docs-and-demos.test.ts`
  - require the new showcase files, start script, and updated documentation
- Create: `tests/showcase/content.test.ts`
  - verify shared blog fixtures and lookup helpers
- Create: `tests/showcase/app.test.ts`
  - verify showcase page generation and server routing behavior
- Create: `demo/showcase/package.json`
  - workspace metadata for the new demo
- Create: `demo/showcase/README.md`
  - explain the two showcase tracks and how to run them
- Create: `demo/showcase/src/content/blog.ts`
  - shared blog fixtures, lookups, and related-post helpers
- Create: `demo/showcase/src/content/modes.ts`
  - evaluator-facing capability copy and route metadata for gallery and walkthrough pages
- Create: `demo/showcase/src/components/chrome.ts`
  - shared shell, nav, callout, and mode-summary helpers
- Create: `demo/showcase/src/components/blog.ts`
  - shared blog cards, post header, author block, and related-post sections
- Create: `demo/showcase/src/runtime/app.ts`
  - pure request-to-response showcase handler
- Create: `demo/showcase/src/runtime/server.ts`
  - start/stop server wrapper used by the root `start` script
- Create: `demo/showcase/src/runtime/client-manifest.ts`
  - bundle names and HTML helpers for any browser-side showcase scripts
- Create: `demo/showcase/src/runtime/ssg-cache.ts`
  - startup helper that materializes SSG pages from the shared route tree
- Create: `demo/showcase/src/runtime/data.ts`
  - JSON endpoints and mode-specific data loading helpers for gallery pages
- Create: `demo/showcase/src/routes/index/page.ts`
  - landing page for the showcase
- Create: `demo/showcase/src/routes/gallery/index/page.ts`
  - overview page for the live runtime gallery
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/page.ts`
  - hydrated blog post page
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/loader.ts`
  - hydrated route data loader
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/hydrate.ts`
  - route-level DOM hydration example
- Create: `demo/showcase/src/routes/gallery/shell/posts/[slug]/page.ts`
  - shell-mode blog post page
- Create: `demo/showcase/src/routes/gallery/shell/posts/[slug]/loader.ts`
  - shell-mode route data loader
- Create: `demo/showcase/src/routes/gallery/custom/posts/[slug]/page.ts`
  - custom-mode blog post page
- Create: `demo/showcase/src/routes/gallery/custom/posts/[slug]/loader.ts`
  - custom-mode server-side initial data helper
- Create: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/page.ts`
  - SSG blog post page
- Create: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/loader.ts`
  - SSG loader using the shared fixtures
- Create: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/entries.ts`
  - static entries for SSG output
- Create: `demo/showcase/src/routes/gallery/adaptive/layout.ts`
  - adaptive navigation layout wrapper
- Create: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/page.ts`
  - adaptive blog post page
- Create: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/loader.ts`
  - adaptive route data loader
- Create: `demo/showcase/src/routes/walkthrough/index/page.ts`
  - overview page for the explanatory walkthrough
- Create: `demo/showcase/src/routes/walkthrough/hydrated/page.ts`
  - annotated hydrated explanation page
- Create: `demo/showcase/src/routes/walkthrough/shell/page.ts`
  - annotated shell explanation page
- Create: `demo/showcase/src/routes/walkthrough/custom/page.ts`
  - annotated custom explanation page
- Create: `demo/showcase/src/routes/walkthrough/ssg/page.ts`
  - annotated SSG explanation page
- Create: `demo/showcase/src/routes/walkthrough/adaptive/page.ts`
  - annotated adaptive explanation page
- Modify: `README.md`
  - point evaluators to `bun run start` and the showcase demo
- Modify: `docs/demos.md`
  - document `demo/showcase` as the default path and reframe the older demos as lower-level references
- Modify: `demo/csr/README.md`
- Modify: `demo/ssr-blog/README.md`
- Modify: `demo/ssg-site/README.md`
- Modify: `demo/adaptive-nav/README.md`
  - point readers to the showcase while keeping the focused demo purpose clear

## Chunk 1: Scaffold The Showcase Entry Point

### Task 1: Add failing coverage for the runnable showcase

**Files:**
- Modify: `package.json`
- Modify: `tests/docs-and-demos.test.ts`
- Create: `tests/showcase/app.test.ts`

- [ ] **Step 1: Write the failing tests**
  - Extend `tests/docs-and-demos.test.ts` to require:
    - a root `start` script
    - `demo/showcase/README.md`
    - the new showcase route entry files
  - Add `tests/showcase/app.test.ts` with coverage that expects a request handler to return:
    - a landing page with `Runtime Gallery` and `Guided Walkthrough`
    - a blog-style not-found response for unknown posts
    - a coherent 404 for unknown showcase routes
- [ ] **Step 2: Run the focused tests to verify they fail**
  - Run: `bun run test tests/docs-and-demos.test.ts tests/showcase/app.test.ts`
  - Expected: FAIL because the `start` script, showcase files, and handler do not exist yet.
- [ ] **Step 3: Add the minimal scaffold**
  - Create `demo/showcase/package.json`.
  - Add the root `start` script in `package.json`.
  - Create `demo/showcase/README.md`.
  - Add `demo/showcase/src/runtime/app.ts` with a minimal request handler that can render the landing page and 404s.
- [ ] **Step 4: Re-run the focused tests**
  - Run: `bun run test tests/docs-and-demos.test.ts tests/showcase/app.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add package.json tests/docs-and-demos.test.ts tests/showcase/app.test.ts demo/showcase
git commit -m "feat: scaffold showcase demo"
```

## Chunk 2: Shared Blog Domain And Components

### Task 2: Build the shared blog content model

**Files:**
- Create: `tests/showcase/content.test.ts`
- Create: `demo/showcase/src/content/blog.ts`
- Create: `demo/showcase/src/content/modes.ts`
- Create: `demo/showcase/src/components/chrome.ts`
- Create: `demo/showcase/src/components/blog.ts`

- [ ] **Step 1: Write the failing content tests**
  - Add tests for:
    - post lookup by slug
    - related-post resolution
    - mode metadata presence for `hydrated`, `shell`, `custom`, `ssg`, and `adaptive`
    - shared component helpers producing the evaluator-facing labels used by both demo tracks
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/showcase/content.test.ts`
  - Expected: FAIL because the content and helper modules do not exist yet.
- [ ] **Step 3: Implement the shared blog modules**
  - Add a small but rich blog fixture set with author, tags, summaries, and related posts.
  - Add shared mode metadata with “what this proves” copy.
  - Add component helpers for showcase nav, callouts, post cards, and post detail sections.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/showcase/content.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add tests/showcase/content.test.ts demo/showcase/src/content demo/showcase/src/components
git commit -m "feat: add showcase blog content"
```

## Chunk 3: Runtime Gallery Routes

### Task 3: Add the live runtime gallery pages

**Files:**
- Modify: `tests/showcase/app.test.ts`
- Create: `demo/showcase/src/runtime/data.ts`
- Create: `demo/showcase/src/runtime/client-manifest.ts`
- Create: `demo/showcase/src/routes/gallery/index/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/hydrated/posts/[slug]/hydrate.ts`
- Create: `demo/showcase/src/routes/gallery/shell/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/shell/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/custom/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/custom/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/loader.ts`
- Create: `demo/showcase/src/routes/gallery/ssg/posts/[slug]/entries.ts`
- Create: `demo/showcase/src/routes/gallery/adaptive/layout.ts`
- Create: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/page.ts`
- Create: `demo/showcase/src/routes/gallery/adaptive/posts/[slug]/loader.ts`

- [ ] **Step 1: Write the failing gallery tests**
  - Expand `tests/showcase/app.test.ts` to require:
    - the gallery overview page to list all supported modes
    - hydrated pages to include the app bootstrap markers
    - shell/custom pages to surface mode-specific capability panels
    - the SSG route to be recognized as static-capable
    - the adaptive route to include replace/stack framing
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: FAIL because the gallery routes and helpers are still missing.
- [ ] **Step 3: Implement the gallery route modules and handler wiring**
  - Add route files under `demo/showcase/src/routes/gallery/...`.
  - Teach `demo/showcase/src/runtime/app.ts` to load routes from `demo/showcase/src/routes` with `loadRoutes({ root: "src/routes" })`.
  - Add any JSON/data helpers needed for shell and custom mode pages.
  - Keep missing-post handling inside the shared showcase flow.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add tests/showcase/app.test.ts demo/showcase/src/runtime demo/showcase/src/routes/gallery
git commit -m "feat: add showcase runtime gallery"
```

## Chunk 4: Guided Walkthrough And Server Wiring

### Task 4: Add the walkthrough pages and runnable server

**Files:**
- Modify: `tests/showcase/app.test.ts`
- Create: `demo/showcase/src/runtime/ssg-cache.ts`
- Create: `demo/showcase/src/runtime/server.ts`
- Create: `demo/showcase/src/routes/index/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/index/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/hydrated/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/shell/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/custom/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/ssg/page.ts`
- Create: `demo/showcase/src/routes/walkthrough/adaptive/page.ts`

- [ ] **Step 1: Write the failing walkthrough/server tests**
  - Expand `tests/showcase/app.test.ts` so it expects:
    - a landing page that links to both demo tracks
    - walkthrough pages with mode annotations and links back to live gallery pages
    - SSG walkthrough pages to use generated output from shared helpers instead of handwritten placeholder strings
    - a startable server wrapper that can serve requests using the showcase handler
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: FAIL because the walkthrough pages and server wrapper do not exist yet.
- [ ] **Step 3: Implement walkthrough routes and the server**
  - Add the landing route and walkthrough routes.
  - Add the SSG cache builder using `buildStaticRoutes`.
  - Add `demo/showcase/src/runtime/server.ts` with a small HTTP server wrapper used by the root `start` script.
  - Ensure startup preloads shared routes and any static output needed by the walkthrough.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/showcase/app.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add tests/showcase/app.test.ts demo/showcase/src/runtime demo/showcase/src/routes/index demo/showcase/src/routes/walkthrough
git commit -m "feat: add showcase walkthrough"
```

## Chunk 5: Docs And Demo Positioning

### Task 5: Update README and demo docs to point at the showcase

**Files:**
- Modify: `README.md`
- Modify: `docs/demos.md`
- Modify: `demo/showcase/README.md`
- Modify: `demo/csr/README.md`
- Modify: `demo/ssr-blog/README.md`
- Modify: `demo/ssg-site/README.md`
- Modify: `demo/adaptive-nav/README.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing docs test**
  - Extend `tests/docs-and-demos.test.ts` so it requires:
    - `bun run start`
    - `demo/showcase`
    - `Runtime Gallery`
    - `Guided Walkthrough`
    - language that reframes the older demos as focused references
- [ ] **Step 2: Run the focused docs test to verify it fails**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: FAIL because the docs still point to the older entrypoints.
- [ ] **Step 3: Update the public-facing docs**
  - Make `README.md` and `docs/demos.md` send evaluators to `bun run start`.
  - Update the demo READMEs so they mention the showcase as the quickest way to evaluate the repo.
- [ ] **Step 4: Re-run the focused docs test**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add README.md docs/demos.md demo/showcase/README.md demo/csr/README.md demo/ssr-blog/README.md demo/ssg-site/README.md demo/adaptive-nav/README.md tests/docs-and-demos.test.ts
git commit -m "docs: point demos to showcase"
```

## Chunk 6: Final Verification

### Task 6: Verify the repo end to end

**Files:**
- No new files expected unless verification exposes a gap

- [ ] **Step 1: Run the full test suite**
  - Run: `bun run test`
  - Expected: PASS.
- [ ] **Step 2: Run formatting and lint checks**
  - Run: `bun run check`
  - Expected: PASS.
- [ ] **Step 3: Run the build**
  - Run: `bun run build`
  - Expected: PASS.
- [ ] **Step 4: Review the final worktree**
  - Run: `git status --short`
  - Expected: only the planned showcase, docs, and test changes are present.
- [ ] **Step 5: Commit**

```bash
git add package.json tests/showcase demo/showcase README.md docs/demos.md demo/csr/README.md demo/ssr-blog/README.md demo/ssg-site/README.md demo/adaptive-nav/README.md tests/docs-and-demos.test.ts
git commit -m "feat: add runnable showcase demos"
```
