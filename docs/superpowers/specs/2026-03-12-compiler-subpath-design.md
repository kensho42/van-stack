# Compiler Subpath Design

## Summary

Move the compiler from the separate package name `@van-stack/compiler` to the root package subpath `van-stack/compiler`. This makes the public package surface consistent with `van-stack/render`, `van-stack/csr`, `van-stack/ssr`, `van-stack/ssg`, and `van-stack/vite`.

## Goals

- Make the compiler available as `van-stack/compiler`.
- Remove the separate compiler package identity from `packages/compiler/package.json`.
- Keep the compiler implementation in `packages/compiler/src`.
- Update public docs and agent guidance to use the root subpath consistently.

## Non-Goals

- Move compiler source files out of `packages/compiler/src`.
- Redesign the compiler APIs themselves.
- Rewrite historical planning documents that refer to the old package layout.

## Design

- Add `"./compiler": "./packages/compiler/src/index.ts"` to the root `package.json` exports.
- Remove `packages/compiler/package.json` so the compiler is no longer modeled as a separately named package.
- Keep `packages/compiler/src/index.ts` as the implementation entrypoint.
- Update README and `AGENTS.md` to document `van-stack/compiler`.
- Update regression tests so they enforce the new subpath and the absence of the separate compiler package manifest.

## Validation

- `tests/workspace.test.ts` should assert the root export exists and `packages/compiler/package.json` is absent.
- `tests/docs-and-demos.test.ts` should assert the README uses `van-stack/compiler` and no longer mentions `@van-stack/compiler`.
- Run full repo verification after the change.
