# AGENTS Guidance Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-level `AGENTS.md` that documents project architecture, workflow, verification, and the requirement to keep README, docs, and demos in sync with code changes.

**Architecture:** Keep the new file mostly tool-agnostic, then add a short Codex-specific section for operational guidance that is useful in this repository. Enforce the file with a lightweight workspace test so future edits cannot silently remove the core guidance.

**Tech Stack:** Markdown, Vitest, Bun, Biome

---

## Chunk 1: Add enforcement

### Task 1: Add a failing workspace test for AGENTS guidance

**Files:**
- Modify: `tests/workspace.test.ts`
- Test: `tests/workspace.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that requires `AGENTS.md` to exist and contain:
- `loadRoutes`
- `README.md`
- `docs/`
- `demo/`
- `bun run test`
- `bun run check`
- `bun run build`

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test tests/workspace.test.ts`
Expected: FAIL because `AGENTS.md` does not exist yet.

## Chunk 2: Add the repo contract

### Task 2: Create the root AGENTS.md

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write the minimal implementation**

Create `AGENTS.md` with:
- project summary
- architecture rules
- repository layout
- development workflow
- required verification
- rule to update `README.md`, `docs/`, and `demo/`
- public API/example guidance
- short Codex notes

- [ ] **Step 2: Run workspace test to verify it passes**

Run: `bun run test tests/workspace.test.ts`
Expected: PASS

## Chunk 3: Record the design and plan

### Task 3: Save the supporting design and plan docs

**Files:**
- Create: `docs/superpowers/specs/2026-03-12-agents-guidance-design.md`
- Create: `docs/superpowers/plans/2026-03-12-agents-guidance.md`

- [ ] **Step 1: Write the supporting docs**

Save a short design doc and this implementation plan so the agent-guidance change follows the same repo conventions as other planned work.

- [ ] **Step 2: Run full verification**

Run:
- `bun run test`
- `bun run check`
- `bun run build`

Expected:
- all tests pass
- Biome reports no issues
- TypeScript build check succeeds
