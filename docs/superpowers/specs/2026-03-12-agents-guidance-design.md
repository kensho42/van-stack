# AGENTS Guidance Design

## Summary

Add a repo-level `AGENTS.md` that gives future coding agents project-specific guidance instead of relying on transient harness instructions. The file should be mostly tool-agnostic, but it should include a short Codex-focused section for concrete workflow details that are useful in this repository.

## Goals

- Document the current `van-stack` package layout and architectural boundaries.
- Capture the preferred filesystem-routing path: `loadRoutes({ root: "src/routes" })`.
- Preserve optional emitted-manifest support without presenting it as the default path.
- Make verification expectations explicit with `bun run test`, `bun run check`, and `bun run build`.
- Require updates to `README.md`, `docs/`, and `demo/` whenever code changes make them stale.

## Non-Goals

- Replace public docs such as `README.md`.
- Add a generic cross-project agent manifesto.
- Encode every harness-specific rule from the live session environment.

## Recommended Structure

- project summary
- architecture rules
- repository layout
- development workflow
- required verification
- documentation and demo update rule
- public API and example guidance
- short Codex notes section

## Validation

- Add a test that requires a root `AGENTS.md`.
- Assert that `AGENTS.md` mentions `loadRoutes`, `README.md`, `docs/`, `demo/`, and the required verification commands.
