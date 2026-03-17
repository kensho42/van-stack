# SSG Site Demo Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `demo/ssg-site` into a runnable static-export reference with a real `build.ts` that writes a `dist/` tree.

**Architecture:** Keep the demo on the recommended filesystem-routing path: `loadRoutes({ root })` plus `exportStaticSite({ routes, outDir, assets })`. The demo should prove three concrete export surfaces together: HTML pages, a raw `route.ts` output, and copied asset files/directories.

**Tech Stack:** Bun, TypeScript, Vitest, `van-stack/compiler`, `van-stack/ssg`, `van-stack/render`

---

### Task 1: Define the runnable demo contract

**Files:**
- Modify: `tests/docs-and-demos.test.ts`
- Create or Modify: `tests/ssg/demo-export.test.ts`

- [ ] **Step 1: Write failing docs/demo assertions**
- [ ] **Step 2: Write a failing runtime test that executes `demo/ssg-site/build.ts` with a temporary output directory**
- [ ] **Step 3: Run the targeted tests and verify they fail**

Run: `bun test tests/docs-and-demos.test.ts tests/ssg/demo-export.test.ts`

Expected: FAIL because the runnable build entry and demo content do not exist yet.

### Task 2: Build the demo

**Files:**
- Create: `demo/ssg-site/build.ts`
- Create: `demo/ssg-site/public/site.css`
- Create: `demo/ssg-site/public/images/pattern.txt`
- Create: `demo/ssg-site/src/routes/posts/[slug]/entries.ts`
- Create: `demo/ssg-site/src/routes/posts/[slug]/loader.ts`
- Create: `demo/ssg-site/src/routes/posts/[slug]/page.ts`
- Create: `demo/ssg-site/src/routes/robots.txt/route.ts`
- Modify: `demo/ssg-site/src/routes/index/page.ts`

- [ ] **Step 1: Implement `build.ts` with a default `dist/` output and an override for tests**
- [ ] **Step 2: Add dynamic HTML and raw route demo files**
- [ ] **Step 3: Add copied asset demo files**
- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `bun test tests/docs-and-demos.test.ts tests/ssg/demo-export.test.ts`

Expected: PASS

### Task 3: Document the exact demo command

**Files:**
- Modify: `demo/ssg-site/README.md`
- Modify: `README.md`
- Modify: `docs/demos.md`
- Modify: `docs/bun.md`

- [ ] **Step 1: Document the exact `bun ./demo/ssg-site/build.ts` command**
- [ ] **Step 2: Document the expected `dist/` contents and output purpose**
- [ ] **Step 3: Re-run the targeted docs tests**

Run: `bun test tests/docs-and-demos.test.ts`

Expected: PASS

### Task 4: Full verification

**Files:**
- Verify existing modified files only

- [ ] **Step 1: Run full tests**

Run: `bun run test`

- [ ] **Step 2: Run formatter/lint checks**

Run: `bun run check`

- [ ] **Step 3: Run type checks**

Run: `bun run build`
