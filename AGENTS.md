# AGENTS.md

## Project Summary

`van-stack` is a router-first framework for VanJS. The repo currently covers:

- `van-stack`: core route matching, runtime types, hydration defaults, and shared render facade exports
- `van-stack/compiler`: filesystem route discovery, normalization, in-memory `loadRoutes({ root })`, and optional `writeRouteManifest({ root })`
- `van-stack/csr`: CSR router with `hydrated`, `shell`, and `custom` modes
- `van-stack/ssr`: SSR HTML rendering and bootstrap handoff
- `van-stack/ssg`: static generation from the same route model
- `van-stack/render`: framework-owned Van facade used by shared route components and demos
- `van-stack/vite`: optional integration layer, not the source of route discovery

## Architecture Rules

- Keep the core routing model runtime-agnostic, but keep the framework Van-specific.
- Filesystem routing belongs to the compiler layer, not to Vite.
- Prefer `loadRoutes({ root: "src/routes" })` as the default filesystem-routing path.
- Treat `writeRouteManifest({ root })` and `.van-stack/routes.generated.ts` as optional emitted-artifact support, not the default app path.
- Shared route components and demos should import `van` from `van-stack/render`, not from `vanjs-core` or `mini-van-plate` directly.
- Preserve the current route-module conventions: `page.ts`, `layout.ts`, `loader.ts`, `action.ts`, `entries.ts`, `meta.ts`, `error.ts`.

## Repository Layout

- `packages/core/src`: route matching, shared types, render facade
- `packages/compiler/src`: route discovery, normalization, manifest loading/writing
- `packages/csr/src`: client router and CSR runtime helpers
- `packages/ssr/src`: SSR rendering and bootstrap generation
- `packages/ssg/src`: static generation
- `packages/vite/src`: optional DX adapter
- `docs/`: public documentation
- `docs/superpowers/specs/`: design specs
- `docs/superpowers/plans/`: implementation plans
- `demo/`: focused demos for CSR, SSR, SSG, and adaptive navigation
- `tests/`: Vitest coverage for compiler, runtime, demos, docs, and workspace layout

## Development Workflow

- Package manager: `bun`
- Formatter and linter: `Biome`
- TypeScript uses `moduleResolution: "Bundler"`
- Prefer small focused edits over broad refactors.
- Do not introduce raw HTML-string examples for Van route components or demos when Van tags should be used.

## Required Verification

Run these commands before claiming a change is complete:

- `bun run test`
- `bun run check`
- `bun run build`

If a change only touches one narrow area, targeted tests are fine during development, but completion still requires the full verification set above.

## Documentation And Demo Rule

Whenever a code change affects public API, behavior, conventions, examples, runtime modes, route loading, rendering, or developer workflow, update the affected public-facing materials in the same change:

- `README.md`
- relevant files under `docs/`
- relevant files under `demo/`

Do not leave README, docs, or demos describing old behavior after the code has changed.

## Public API And Example Guidance

- Favor examples that show the current recommended API, not lower-level escape hatches.
- If filesystem routing examples are needed, default to `loadRoutes({ root: "src/routes" })`.
- If emitted-manifest examples are needed, make it explicit that they are optional.
- Use `meta.ts` for route metadata examples.
- Keep CSR examples aligned with the three runtime modes: `hydrated`, `shell`, and `custom`.

## Codex Notes

These are tool-specific expectations for Codex-based agents working in this repo:

- Prefer `rg` and `rg --files` for search.
- Use `apply_patch` for manual file edits.
- Do not use destructive git commands unless the user explicitly asks.
- Do not assume Vite is required for filesystem routing.
- Before reporting success, verify with the required `bun` commands above and read the output.
