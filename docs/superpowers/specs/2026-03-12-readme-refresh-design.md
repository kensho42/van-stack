# README Refresh Design

## Summary

Rewrite the root `README.md` as a broader landing page with a guided API tour. The refreshed README should keep the project overview material, but it should also present copyable, current examples that match the actual compiler, render, CSR, SSR, and SSG surfaces in the repo.

## Goals

- Make the README the main entrypoint for new users.
- Keep examples aligned with the current codebase.
- Explain how `van-stack`, `@van-stack/compiler`, and the runtime subpaths fit together.
- Prefer `loadRoutes({ root: "src/routes" })` over emitted-manifest examples.
- Show realistic examples for:
  - route modules
  - `shell` CSR
  - `custom` CSR with resolver
  - `custom` CSR without resolver
  - SSR rendering
- Keep detailed edge cases in `docs/`, not in the README.

## Non-Goals

- Rewrite every document under `docs/`.
- Change runtime behavior.
- Normalize package naming in code; the README should describe the current package surface accurately.

## Recommended Structure

- short project summary
- install
- why `van-stack`
- package surface
- how it fits together
- quick start
- route module example
- API tour
  - `@van-stack/compiler`
  - `van-stack/render`
  - `van-stack/csr`
  - `van-stack/ssr`
  - `van-stack/ssg`
- runtime model
  - CSR modes
  - hydration policies
  - replace vs stack
- demos and docs index

## Validation

- Expand README assertions in `tests/docs-and-demos.test.ts`.
- Verify the README mentions the current package surfaces and the new section structure.
- Run full repo verification after the rewrite.
