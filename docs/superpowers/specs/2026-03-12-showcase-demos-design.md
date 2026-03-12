# Showcase Demos Design

## Summary

Replace the current thin demo story with a richer evaluator-first showcase that runs from the repo root via `bun run start`. The primary experience should be a new `demo/showcase` workspace that presents one blog app through two separate demo tracks:

- a `Runtime Gallery` for live capability comparison across supported modes
- a `Guided Walkthrough` for annotated explanation of those same runtime paths

Both tracks should use the same blog content, visual language, and shared components so evaluators experience one product demonstrated through multiple runtime strategies.

## Goals

- Make demos runnable from the repo root with `bun run start`.
- Give evaluators one obvious starting point instead of several disconnected demo folders.
- Showcase `hydrated`, `shell`, `custom`, `ssg`, and adaptive navigation behavior against the same blog app.
- Provide a second, more explanatory demo surface without duplicating business content.
- Keep the existing focused demo folders as lower-level references.
- Update README and docs so they point to the new showcase as the default evaluation path.

## Non-Goals

- Remove the existing `demo/csr`, `demo/ssr-blog`, `demo/ssg-site`, or `demo/adaptive-nav` folders.
- Turn the new showcase into a full production app template.
- Add unrelated framework features or refactor package boundaries.

## Experience Design

### Landing Page

`bun run start` should launch a Bun server that serves a landing page with two clear entry points:

- `Runtime Gallery`
- `Guided Walkthrough`

The landing page should explain that both experiences are demonstrating the same blog app and that the difference is whether the evaluator wants live runtime behavior or an annotated conceptual tour.

### Runtime Gallery

The runtime gallery should prioritize fast evaluation of framework capabilities. It should use one shared blog dataset and route shape, then present mode-specific views that prove:

- `hydrated`: SSR HTML plus client continuation
- `shell`: shell boot with transport-backed route loading
- `custom`: app-owned data resolution and component-driven interaction
- `ssg`: statically materialized blog pages
- `adaptive`: replace vs stack presentation from one route tree

The gallery should not feel like five separate apps. It should feel like the same blog app delivered through different runtime tracks.

### Guided Walkthrough

The guided walkthrough should use the same blog content and shared UI components, but organize them as annotated explanation pages. Each walkthrough page should explain:

- what the evaluator is looking at
- which runtime mode or capability is being demonstrated
- which route-module files participate
- where the corresponding live gallery page is

This is a docs-style experience, but it should be generated from the same showcase data and helpers rather than hand-maintained prose fragments detached from the runnable demo.

## Route And Runtime Shape

Recommended top-level showcase routes:

- `/` for the demo landing page
- `/gallery` for the runtime gallery overview
- `/gallery/hydrated/posts/:slug`
- `/gallery/shell/posts/:slug`
- `/gallery/custom/posts/:slug`
- `/gallery/ssg/posts/:slug`
- `/gallery/adaptive/...`
- `/walkthrough` for the walkthrough overview
- one walkthrough page per supported capability, linking to the matching gallery page

The blog app should use one shared content model across both demo tracks:

- posts
- tags
- author metadata
- related post relationships

## File Boundaries

Add a dedicated showcase workspace under `demo/showcase` with focused boundaries:

- `demo/showcase/src/content/`
  - shared blog fixtures and mode labels
- `demo/showcase/src/components/`
  - shared UI primitives for cards, post headers, callouts, and source panels
- `demo/showcase/src/routes/`
  - landing page, gallery pages, walkthrough pages, and blog post routes
- `demo/showcase/src/runtime/`
  - Bun server, SSR helpers, transport handlers, and static materialization helpers
- `demo/showcase/README.md`
  - how the showcase works and how it maps to runtime capabilities

Also update:

- root `package.json` to add `start`
- `README.md`
- `docs/demos.md`
- any other public-facing demo docs that now point to stale demo entrypoints

## Error Handling

- Missing posts should render a blog-style not-found view rather than raw framework errors.
- Unknown showcase routes should fall back to a coherent landing or not-found page.
- Internal showcase runtime failures should render a small diagnostic panel that identifies the failing mode and route so evaluators can recover quickly.

## Validation

- Add tests that require a root `start` script and the new showcase files.
- Extend demo/docs coverage so the showcase becomes the documented default evaluation path.
- Add focused tests for shared showcase data and page generation where appropriate.
- Run the repo’s required verification set:
  - `bun run test`
  - `bun run check`
  - `bun run build`
