# README Adoption-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` so it leads with a first-run developer path while still covering the package and runtime architecture needed by evaluators.

**Architecture:** Keep the change scoped to the root README unless tests force a tiny related update. Preserve the current public API language and test-sensitive phrases, but reorder the document so install, the recommended `loadRoutes({ root: "src/routes" })` path, and one small route example appear before the deeper runtime and compatibility material.

**Tech Stack:** Markdown, Bun, Vitest, Biome, TypeScript package surface docs

---

### Task 1: Rewrite The Root README

**Files:**
- Modify: `README.md`
- Test: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing test expectation**

Update `tests/docs-and-demos.test.ts` only if the new README structure needs a new assertion. Prefer keeping the existing coverage unchanged by preserving required strings in `README.md`.

```ts
test("positions the showcase as the main evaluator demo from the root readme", () => {
  const readme = readFileSync("README.md", "utf8");

  expect(readme).toContain("demo/showcase");
  expect(readme).toContain("bun run start");
  expect(readme).toContain('mode: "hydrated"');
});
```

- [ ] **Step 2: Run the docs coverage test to establish the baseline**

Run: `bun test tests/docs-and-demos.test.ts`
Expected: PASS before edits, confirming the existing assertions are the guardrail for the rewrite.

- [ ] **Step 3: Rewrite `README.md` with the approved adoption-first structure**

Replace the top-level flow with:

```md
# van-stack

`van-stack` is a router-first framework for VanJS with one shared route model across CSR, SSR, and SSG.

## Install

```bash
bun add van-stack
```

## Start Here

1. Create route modules in `src/routes`.
2. Load them with `loadRoutes({ root: "src/routes" })`.
3. Write shared route components with `van-stack/render`.
4. Pass the same routes into CSR, SSR, or SSG entrypoints.
```

Then continue with:

```md
## Happy-Path Quick Start
## Why van-stack?
## Package Surface
## How It Fits Together
## Runtime Model
## Compatibility And Tooling Notes
## Demos And Docs
```

Keep these README strings intact somewhere in the rewritten file so `tests/docs-and-demos.test.ts` still passes without broad test changes:

```txt
demo/showcase
demo/third-party-compat
demo/adaptive-nav
bun run start
van-stack/vite
compat/bun-tsconfig.json
tsconfig.bun.json
bunfig.toml
docs/bun.md
van-stack/compat/node-register
exportStaticSite
generic web servers
bind the render env before module evaluation
ssg
ssr
hydrated
islands
shell
custom
mode: "hydrated"
low-level enhance hook
remounts that branch by default
@sidebar
```

- [ ] **Step 4: Run the targeted docs coverage test**

Run: `bun test tests/docs-and-demos.test.ts`
Expected: PASS, proving the README still satisfies the documented public-facing guarantees.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/docs-and-demos.test.ts docs/superpowers/specs/2026-03-26-readme-adoption-first-design.md docs/superpowers/plans/2026-03-26-readme-adoption-first.md
git commit -m "docs: rewrite readme for adoption"
```

### Task 2: Full Verification

**Files:**
- Verify: `README.md`
- Verify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Run the full test suite**

Run: `bun run test`
Expected: PASS

- [ ] **Step 2: Run repo checks**

Run: `bun run check`
Expected: PASS

- [ ] **Step 3: Run the build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 4: Inspect outputs before reporting success**

Confirm there are no README-related test regressions and no new build or type-check failures in command output.

- [ ] **Step 5: Commit verification-safe docs work**

```bash
git status --short
```

Expected: only intended README/spec/plan changes remain unstaged or staged, with no accidental file edits introduced during verification.
