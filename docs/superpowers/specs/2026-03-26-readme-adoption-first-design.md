# README Adoption-First Design

## Summary

Rewrite the root `README.md` so it works first as a developer-friendly entrypoint for first-run adoption, then as a compact evaluator guide for package boundaries and runtime architecture.

## Goals

- Lead with a short happy-path setup that matches the recommended workflow.
- Keep the default filesystem-routing path centered on `loadRoutes({ root: "src/routes" })`.
- Show one small route tree and one copyable route module example early.
- Explain how shared route code flows through `van-stack/render` and into CSR, SSR, or SSG.
- Preserve important evaluator-facing topics already covered by the README and tests:
  - `demo/showcase` as the main demo
  - `demo/adaptive-nav` and `demo/third-party-compat`
  - `van-stack/vite`
  - Bun compatibility guidance including `compat/bun-tsconfig.json`, `tsconfig.bun.json`, and `bunfig.toml`
  - chunked CSR via `.van-stack/routes.generated.ts`
  - SSR hydration concepts including `hydrated`, `islands`, `shell`, `custom`, low-level enhance hooks, and the default remount handoff
  - SSG output through `exportStaticSite` for generic web servers

## Non-Goals

- Change any runtime behavior or public API.
- Rewrite the deeper docs under `docs/`.
- Turn the README into a complete reference manual.

## Recommended Structure

1. Project summary
2. Install
3. Start here
4. Happy-path quick start
5. Why `van-stack`
6. Package surface and architecture fit
7. Runtime model
8. Compatibility and chunked CSR notes
9. Demos and docs

## Content Rules

- Keep the opening screen focused on adoption, not exhaustive feature listing.
- Prefer short sections with clear transitions instead of a long uninterrupted API tour.
- Keep deeper edge cases and specialized setup detail lower in the file.
- Retain wording needed by existing docs coverage tests unless there is a matching test update.

## Validation

- Update `README.md` only unless tests force small related changes.
- Run `bun run test`
- Run `bun run check`
- Run `bun run build`
