# van-stack MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working `van-stack` MVP with core routing, filesystem compiler, CSR/SSR/SSG adapters, docs, and focused demos.

**Architecture:** Use a Bun/TypeScript workspace with focused packages: core, compiler, CSR, SSR, SSG, and optional Vite adapter. Start with a minimal but real route tree/compiler/runtime path that can render a demo blog route in CSR/SSR/SSG, then layer docs and demos on top.

**Tech Stack:** Bun, TypeScript, Biome, Vitest, VanJS, Mini-Van / van-plate

---

## Chunk 1: Workspace And Tooling

### Task 1: Scaffold repo and baseline tooling

**Files:**
- Create: `package.json`
- Create: `bunfig.toml`
- Create: `tsconfig.json`
- Create: `biome.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `vitest.config.ts`

- [ ] **Step 1: Write the failing workspace smoke test**
- [ ] **Step 2: Run it to verify it fails**
- [ ] **Step 3: Create workspace/tooling files**
- [ ] **Step 4: Run workspace smoke test and tooling checks**

### Task 2: Create package layout

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/compiler/package.json`
- Create: `packages/compiler/src/index.ts`
- Create: `packages/csr/package.json`
- Create: `packages/csr/src/index.ts`
- Create: `packages/ssr/package.json`
- Create: `packages/ssr/src/index.ts`
- Create: `packages/ssg/package.json`
- Create: `packages/ssg/src/index.ts`
- Create: `packages/vite/package.json`
- Create: `packages/vite/src/index.ts`
- Create: `tests/workspace.test.ts`

- [ ] **Step 1: Extend the smoke test to assert package entrypoints exist**
- [ ] **Step 2: Run it to verify it fails**
- [ ] **Step 3: Add package manifests and entry files**
- [ ] **Step 4: Re-run tests**

## Chunk 2: Core Route Model And Compiler

### Task 3: Build normalized route types

**Files:**
- Create: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Create: `tests/core/types.test.ts`

- [ ] **Step 1: Write failing tests for route IDs, hydration policies, and navigator policies**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement minimal core types and exports**
- [ ] **Step 4: Re-run tests**

### Task 4: Build filesystem route compiler

**Files:**
- Create: `packages/compiler/src/fs-routes.ts`
- Modify: `packages/compiler/src/index.ts`
- Create: `tests/compiler/fs-routes.test.ts`

- [ ] **Step 1: Write failing tests for reserved filenames, bracket params, ignored helpers, and route groups**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement minimal compiler that emits normalized route nodes**
- [ ] **Step 4: Re-run tests**

## Chunk 3: Runtime Adapters

### Task 5: Implement CSR router MVP

**Files:**
- Create: `packages/csr/src/router.ts`
- Modify: `packages/csr/src/index.ts`
- Create: `tests/csr/router.test.ts`

- [ ] **Step 1: Write failing tests for canonical-URL navigation, internal data URL derivation, and history updates**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement minimal CSR router**
- [ ] **Step 4: Re-run tests**

### Task 6: Implement SSR and SSG MVP

**Files:**
- Create: `packages/ssr/src/render.ts`
- Modify: `packages/ssr/src/index.ts`
- Create: `packages/ssg/src/build.ts`
- Modify: `packages/ssg/src/index.ts`
- Create: `tests/ssr/render.test.ts`
- Create: `tests/ssg/build.test.ts`

- [ ] **Step 1: Write failing SSR/SSG tests for slug route rendering and bootstrap payload emission**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement minimal SSR and SSG entrypoints**
- [ ] **Step 4: Re-run tests**

## Chunk 4: Docs And Demos

### Task 7: Add focused demos

**Files:**
- Create: `demo/csr/README.md`
- Create: `demo/csr/src/routes/index/page.ts`
- Create: `demo/ssr-blog/README.md`
- Create: `demo/ssr-blog/src/routes/posts/[slug]/page.ts`
- Create: `demo/ssr-blog/src/routes/posts/[slug]/loader.ts`
- Create: `demo/ssg-site/README.md`
- Create: `demo/ssg-site/src/routes/index/page.ts`
- Create: `demo/adaptive-nav/README.md`
- Create: `demo/adaptive-nav/src/routes/index/layout.ts`

- [ ] **Step 1: Write failing demo smoke tests or existence checks**
- [ ] **Step 2: Run them to verify they fail**
- [ ] **Step 3: Create focused demo skeletons**
- [ ] **Step 4: Re-run tests**

### Task 8: Write docs

**Files:**
- Modify: `README.md`
- Create: `docs/getting-started.md`
- Create: `docs/loaders-and-actions.md`
- Create: `docs/hydration-modes.md`
- Create: `docs/shared-components.md`
- Create: `docs/adaptive-navigation.md`
- Create: `docs/vite.md`
- Create: `docs/route-conventions.md`
- Create: `docs/demos.md`

- [ ] **Step 1: Write failing docs index test or docs manifest check**
- [ ] **Step 2: Run it to verify it fails**
- [ ] **Step 3: Add docs with practical-first structure**
- [ ] **Step 4: Re-run tests**

## Chunk 5: Verification

### Task 9: Verify the repo end to end

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add top-level scripts for `test`, `check`, and `build`**
- [ ] **Step 2: Run `bun run test`**
- [ ] **Step 3: Run `bun run check`**
- [ ] **Step 4: Run `bun run build`**
- [ ] **Step 5: Record any remaining scope gaps in the final summary**
