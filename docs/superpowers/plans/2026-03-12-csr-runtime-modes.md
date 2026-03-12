# CSR Runtime Modes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the CSR runtime so `van-stack` supports `hydrated`, `shell`, and `custom` client modes without breaking the current SSR handoff path.

**Architecture:** Keep one shared route tree and one CSR router constructor, but make the mode explicit and separate data ownership by mode. `hydrated` and `shell` use a transport adapter, while `custom` uses a host-owned resolver and bypasses `loader.ts`.

**Tech Stack:** Bun, TypeScript, Biome, Vitest

---

## File Structure

- Modify: `packages/core/src/types.ts`
  - Add shared CSR runtime types for route matches, navigation, transport, resolver, and mode-specific options.
- Modify: `packages/core/src/index.ts`
  - Export the new CSR runtime types and keep internal transport helpers.
- Modify: `packages/csr/src/router.ts`
  - Replace the single hardcoded internal-data navigation flow with explicit `hydrated`, `shell`, and `custom` branches.
- Modify: `packages/csr/src/index.ts`
  - Re-export the updated CSR API.
- Modify: `README.md`
  - Document the three CSR modes and show when to use `transport` versus `resolve`.
- Modify: `docs/getting-started.md`
  - Explain which startup path fits SSR apps, Tauri/PWA shell apps, and routing-only CSR apps.
- Modify: `docs/hydration-modes.md`
  - Clarify that hydration policy is distinct from CSR runtime mode.
- Add or Modify: `tests/csr/router.test.ts`
  - Cover all three runtime modes and guard against regressions in canonical URL behavior.
- Add or Modify: `tests/core/core.test.ts`
  - Cover new exported runtime types or helpers if needed.
- Add or Modify: `tests/docs-and-demos.test.ts`
  - Assert the updated docs mention the new modes.

## Chunk 1: Shared CSR Runtime Types

### Task 1: Add mode-aware CSR types to the core package

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `tests/core/core.test.ts`

- [ ] **Step 1: Write the failing core test**
  - Add a test that asserts the exported CSR mode names and a typed internal data base path helper still exist.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: FAIL because the new mode-aware exports do not exist yet.
- [ ] **Step 3: Add shared runtime types**
  - Define `CsrMode`, `HistoryLike`, `RouteMatch`, `Navigation`, `Transport`, `Resolve`, and the discriminated `CreateRouterOptions` union in `packages/core/src/types.ts`.
  - Re-export them from `packages/core/src/index.ts`.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/core/core.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/index.ts tests/core/core.test.ts
git commit -m "feat: add csr runtime mode types"
```

## Chunk 2: CSR Router Refactor

### Task 2: Preserve the current SSR handoff behavior as `hydrated`

**Files:**
- Modify: `packages/csr/src/router.ts`
- Modify: `packages/csr/src/index.ts`
- Modify: `tests/csr/router.test.ts`

- [ ] **Step 1: Write the failing `hydrated` router test**
  - Add a test that creates the router in `hydrated` mode, navigates to `/posts/github-down`, and asserts:
    - the visible navigation target is `/posts/github-down`
    - the transport receives the internal path for that canonical URL
    - the history state stores the canonical path
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/csr/router.test.ts`
  - Expected: FAIL because `mode: "hydrated"` is not supported yet.
- [ ] **Step 3: Implement `hydrated` mode**
  - Update `createRouter` so `hydrated` consumes `bootstrap` and uses a transport adapter for later navigations.
  - Keep the current internal `/_van-stack/data/...` transport as the default when no override is supplied.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/csr/router.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/csr/src/router.ts packages/csr/src/index.ts tests/csr/router.test.ts
git commit -m "feat: preserve hydrated csr mode"
```

### Task 3: Add `shell` mode for shell-first CSR apps

**Files:**
- Modify: `packages/csr/src/router.ts`
- Modify: `tests/csr/router.test.ts`

- [ ] **Step 1: Write the failing `shell` router test**
  - Add a test that creates the router in `shell` mode and asserts the initial route load and a later navigation both go through the transport adapter without requiring bootstrap data.
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/csr/router.test.ts`
  - Expected: FAIL because `shell` mode is not implemented.
- [ ] **Step 3: Implement `shell` mode**
  - Make the router resolve the current location through transport on startup.
  - Reuse the default internal transport unless a host override is supplied.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/csr/router.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/csr/src/router.ts tests/csr/router.test.ts
git commit -m "feat: add shell csr mode"
```

### Task 4: Add `custom` mode for host-owned resolution

**Files:**
- Modify: `packages/csr/src/router.ts`
- Modify: `tests/csr/router.test.ts`

- [ ] **Step 1: Write the failing `custom` router test**
  - Add a test that creates the router in `custom` mode and asserts:
    - the resolver receives the normalized route match
    - no internal transport path is derived
    - history still updates to the canonical path
- [ ] **Step 2: Run the focused test to verify it fails**
  - Run: `bun run test tests/csr/router.test.ts`
  - Expected: FAIL because `custom` mode is not implemented.
- [ ] **Step 3: Implement `custom` mode**
  - Require a `resolve` function for `custom`.
  - Pass a normalized route match and navigation context to the resolver.
  - Keep the router responsible for history and canonical URLs only.
- [ ] **Step 4: Re-run the focused test**
  - Run: `bun run test tests/csr/router.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/csr/src/router.ts tests/csr/router.test.ts
git commit -m "feat: add custom csr mode"
```

## Chunk 3: Docs

### Task 5: Document the three CSR modes

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Modify: `docs/hydration-modes.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing docs test**
  - Add assertions that the docs mention `hydrated`, `shell`, and `custom`, and that they distinguish hydration policy from CSR runtime mode.
- [ ] **Step 2: Run the focused docs test to verify it fails**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: FAIL because the docs do not mention the new runtime model yet.
- [ ] **Step 3: Update the docs**
  - Add practical examples:
    - SSR web app using `hydrated`
    - Tauri or PWA app using `shell`
    - GraphQL-backed CSR app using `custom`
  - Clarify that hydration policy controls SSR-to-CSR behavior, while CSR runtime mode controls how a client app boots and resolves data.
- [ ] **Step 4: Re-run the focused docs test**
  - Run: `bun run test tests/docs-and-demos.test.ts`
  - Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add README.md docs/getting-started.md docs/hydration-modes.md tests/docs-and-demos.test.ts
git commit -m "docs: explain csr runtime modes"
```

## Chunk 4: Verification

### Task 6: Verify the repo end to end

**Files:**
- No additional files expected unless verification exposes gaps

- [ ] **Step 1: Run the full test suite**
  - Run: `bun run test`
  - Expected: PASS.
- [ ] **Step 2: Run formatting and lint checks**
  - Run: `bun run check`
  - Expected: PASS.
- [ ] **Step 3: Run the build**
  - Run: `bun run build`
  - Expected: PASS.
- [ ] **Step 4: Review the final diff**
  - Run: `git diff --stat`
  - Expected: only the planned runtime, test, and docs changes are present.
- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/index.ts packages/csr/src/router.ts packages/csr/src/index.ts README.md docs/getting-started.md docs/hydration-modes.md tests/core/core.test.ts tests/csr/router.test.ts tests/docs-and-demos.test.ts
git commit -m "feat: add explicit csr runtime modes"
```
