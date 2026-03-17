# Showcase Blog Rewrite Design

## Summary

Replace the current thin `demo/showcase` gallery with a real editorial blog app that demonstrates the same content graph through five delivery modes:

- `ssg`
- `ssr`
- `hydrated`
- `shell`
- `custom`

The showcase must run from the repo root with `bun run start` and feel credible to evaluators immediately. It should present one polished publication, `Northstar Journal`, with a premium editorial theme, a dense content graph, and enough route coverage that people can navigate for a while without falling into repeated stub content.

The gallery remains the primary experience. The walkthrough remains secondary and exists to explain the live app rather than replace it.

## Goals

- Make `bun run start` launch one evaluator-first showcase app from the repo root.
- Replace the current post-detail-only demo story with a full read-only blog app.
- Demonstrate the same information architecture in every runtime mode.
- Make each mode prove a real framework capability rather than a simplified toy route.
- Keep runtime diagnostics visible but subordinate to the editorial UI.
- Give evaluators enough content density to browse the app naturally.
- Update public docs so the rewritten showcase becomes the default demo entrypoint.

## Non-Goals

- Turn the showcase into a production starter kit with auth, search, or form workflows.
- Add framework capabilities that are unrelated to the showcase rewrite.
- Remove the existing lower-level reference demos unless the rewrite makes them obsolete later.
- Introduce runtime-specific route shapes that force evaluators to relearn the app per mode.

## Product Shape

### Publication Identity

The shared app is a publication called `Northstar Journal`.

Visual direction:

- premium editorial look
- dark high-contrast magazine feel
- warm highlight accents
- modern layout without dashboard aesthetics

The visual system should be strong enough that the app feels intentional on desktop and mobile, but the implementation should still favor reusable shared components over one-off art direction per route.

### Shared Information Architecture

Every mode must expose the exact same route surface under its own gallery prefix:

- `/gallery/<mode>/`
- `/gallery/<mode>/posts`
- `/gallery/<mode>/posts/:slug`
- `/gallery/<mode>/authors`
- `/gallery/<mode>/authors/:slug`
- `/gallery/<mode>/categories`
- `/gallery/<mode>/categories/:slug`
- `/gallery/<mode>/tags`
- `/gallery/<mode>/tags/:slug`

The same entity types exist in every mode:

- posts
- authors
- categories
- tags

Homepage expectations:

- featured story hero
- latest posts rail or grid
- category-led discovery section
- author spotlight or contributor section
- compact runtime explanation panel

Post page expectations:

- large article title and metadata
- author attribution
- primary category link
- multiple tag links
- readable body layout
- related posts section
- small runtime badge and delivery explanation

Author page expectations:

- author bio and role
- topical expertise or descriptor
- authored post archive

Category page expectations:

- category description
- category post archive

Tag page expectations:

- tag description
- related post archive

List page expectations:

- posts index
- authors index
- categories index
- tags index

The gallery overview at `/gallery` should explain the five modes and link into the same canonical content path in each mode so evaluators can compare behavior quickly.

## Content Model

The showcase needs enough content density to feel real.

Minimum dataset:

- `30` posts
- several authors
- several categories
- several tags

Implementation target for the non-post entities:

- `8` authors
- `8` categories
- `12` tags

This is intentionally concrete so archive pages do not look sparse.

Content graph rules:

- every post has one author
- every post has one primary category
- every post has multiple tags
- every post links to at least two related posts
- every author has multiple posts
- every category has multiple posts
- every tag appears across multiple posts

The dataset should be authored as shared in-repo fixtures rather than generated randomly at runtime. Believable editorial metadata matters more than synthetic variety.

## Runtime Mapping

### SSG

`/gallery/ssg/*` must be fully pre-generated from the shared content graph.

This mode proves:

- full static materialization of homepage, listing pages, and entity pages
- `entries.ts` support beyond a single slug route
- shared route model between static and server-rendered demos

### SSR

`/gallery/ssr/*` must behave like a traditional server-rendered blog.

This mode proves:

- request-time rendering with no client takeover
- server-side `loader.ts` for real archive and entity pages
- a conventional content site shape built directly on the framework

Routes in this mode should use document-only rendering and avoid hydration affordances beyond passive diagnostics.

### Hydrated

`/gallery/hydrated/*` must share the SSR route tree for first render, then hand off to CSR.

This mode proves:

- SSR HTML first paint
- bootstrap handoff through `hydrateApp(...)`
- same app shape continuing through client navigation

Hydrated mode should show at least one small interaction or navigation signal that is only meaningful after hydration, but the page must still read like a real article or archive page rather than an interaction demo.

### Shell

`/gallery/shell/*` must boot from a tiny shell and use VanStack-owned route loading for the initial route and later navigation.

This mode proves:

- no SSR payload required
- route modules and loaders still drive the content graph
- transport-backed loading for posts, authors, categories, and tags

The shell app should use the same visual components as the SSR-based modes once data arrives.

### Custom

`/gallery/custom/*` must boot from a tiny shell and fetch content from inside route components through a simulated JSON backend.

This mode proves:

- app-owned data loading decoupled from VanStack loaders
- route components can fetch posts, authors, categories, and tags directly
- the framework still owns routing even when the app owns data access

The custom mode must not fake this by proxying everything back through the normal route `loader.ts` flow.

## Walkthrough Surface

The walkthrough remains a separate, secondary demo surface.

Routes:

- `/walkthrough`
- `/walkthrough/ssg`
- `/walkthrough/ssr`
- `/walkthrough/hydrated`
- `/walkthrough/shell`
- `/walkthrough/custom`

Each walkthrough page should:

- link to a live gallery page for that mode
- explain what the mode proves
- point to the route modules or runtime files involved
- stay concise enough that the gallery remains the primary experience

The walkthrough is an evaluator aid, not the product itself.

## Implementation Boundaries

### Shared Content Layer

Create or rewrite shared content fixtures so they define:

- posts
- authors
- categories
- tags
- relationship helpers
- derived archive helpers

This layer should be framework-agnostic data, but still live inside the showcase workspace.

### Shared Presentation Layer

Shared components should own:

- site chrome
- homepage sections
- archive cards and lists
- article header and body layout
- taxonomy chips and links
- author profile sections
- mode badges and compact diagnostics

The goal is one visual system reused by all runtime modes.

### Shared Route-Data Helpers

SSR, hydrated, shell, and SSG should share helper functions for:

- finding entities by slug
- producing archive page data
- generating route entries
- resolving related content

These helpers should keep route modules small and consistent.

### Simulated Backend For Custom Mode

Custom mode needs a small demo API that returns JSON for:

- homepage payload
- posts list
- post detail
- authors list
- author detail
- categories list
- category detail
- tags list
- tag detail

This API can be served by the Bun showcase runtime. It should exist only to demonstrate decoupled fetching in `custom` mode.

### Runtime Host Layer

The showcase runtime should continue to own:

- Bun server startup for `bun run start`
- request handling for gallery and walkthrough pages
- shell/custom demo transport endpoints
- SSG materialization helpers if needed for cached output

Mode-specific behavior belongs here when it is not specific to a single route module.

## Evaluator Experience Rules

`/gallery/*` is the primary product experience.

Every gallery page should include small evaluator aids:

- mode pill
- concise “what powered this page” panel
- sibling-mode links to the same canonical entity page when available

These aids must stay small enough that the page still feels like a real publication page first.

`/walkthrough/*` is explanatory and should not compete visually with the live gallery.

## Error Handling

The rewritten showcase should handle failure coherently:

- unknown routes render a branded not-found page
- unknown entity slugs render entity-specific not-found states
- custom-mode fetch failures render an inline diagnostic tied to the current entity page
- shell transport failures render a route-level loading failure state
- walkthrough links should fail clearly if a referenced live route is unavailable

## Documentation Impact

Update the public-facing docs that mention demos so they describe the rewritten showcase accurately, including:

- root `README.md`
- `docs/demos.md`
- any getting-started or mode docs that point evaluators at the gallery
- `demo/showcase/README.md`

Docs should describe the gallery as a full blog app across five modes, not as a thin runtime sample.

## Verification

Implementation completion still requires:

- `bun run test`
- `bun run check`
- `bun run build`

Add or update tests that cover:

- the rewritten route surface
- shared content helpers
- demo docs or README references that describe the showcase
- any start-script expectations tied to `bun run start`

## Acceptance Criteria

The rewrite is complete when:

- `bun run start` launches the showcase app from the repo root
- `/gallery` clearly introduces the five supported modes
- every mode exposes the full approved route surface
- the dataset contains `30` posts and non-sparse author/category/tag archives
- `ssr` remains server-rendered only
- `hydrated` clearly performs SSR handoff to CSR
- `shell` clearly boots from a shell and loads route data through VanStack-owned transport
- `custom` clearly fetches JSON from inside route components through a simulated backend
- `ssg` clearly demonstrates pre-generated content pages
- walkthrough pages accurately explain and link to the live gallery routes
- the UI feels like one cohesive publication instead of five unrelated demos
