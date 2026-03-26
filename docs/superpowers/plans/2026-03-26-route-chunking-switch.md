# Route Chunking Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make route chunking a first-class build-time option for app templates, inherited by default and opt-out by route id, while keeping `hydrated`, `shell`, and `custom` runtime behavior unchanged.

**Architecture:** Chunking will be decided at build time and carried through manifest generation into the client route loader surface. The compiler will mark route branches as chunked or eager, the CSR boot code will consume that metadata through the same router interface it already uses, and the showcase / chunked demos will opt into the shared switch so the framework pattern is visible in real apps instead of only in one-off demo wiring.

**Tech Stack:** TypeScript, Bun, Vitest, Biome, `van-stack/compiler`, `van-stack/csr`, demo runtimes, markdown docs.

---

### Task 1: Add chunking metadata to the route manifest

**Files:**
- Modify: `packages/compiler/src/manifest.ts`
- Modify: `packages/compiler/src/index.ts`
- Modify: `tests/compiler/fs-routes.test.ts`

- [ ] **Step 1: Write the failing manifest tests**

Add a test that exercises the manifest writer with an explicit chunking switch and a branch-id exclusion list:

```ts
const manifest = await buildRouteManifest({
  root: app.routesRoot,
  chunkedRoutes: { excludeRouteIds: ["gallery/custom/posts/[slug]"] },
});

const chunkedRoute = manifest.routes.find(
  (route) => route.id === "gallery/hydrated/posts/[slug]",
);
const eagerRoute = manifest.routes.find(
  (route) => route.id === "gallery/custom/posts/[slug]",
);

expect(chunkedRoute?.chunked).toBe(true);
expect(eagerRoute?.chunked).toBe(false);
```

Add a second test that writes the manifest with `chunkedRoutes: true` and asserts the generated code includes the chunked flag or equivalent branch metadata for every route branch.

- [ ] **Step 2: Run the targeted compiler test to confirm it fails**

Run:

```bash
bun test tests/compiler/fs-routes.test.ts
```

Expected: fail because `chunkedRoutes` and route-level chunking metadata do not exist yet.

- [ ] **Step 3: Implement the manifest option and metadata**

Implement a concrete compiler surface on the manifest writer:

```ts
type ChunkedRoutesOption =
  | boolean
  | {
      excludeRouteIds?: string[];
    };

type BuildRouteManifestOptions = {
  root: string;
  chunkedRoutes?: ChunkedRoutesOption;
};
```

Use route ids as the branch selector for exclusions. Emit a `chunked: boolean` field on each route branch in the manifest output so the client loader can decide whether a branch is eager or manifest-loaded without guessing from file paths.

- [ ] **Step 4: Re-run the compiler test**

Run:

```bash
bun test tests/compiler/fs-routes.test.ts
```

Expected: pass, with the chunked and excluded branches reflected in the manifest.

- [ ] **Step 5: Commit the compiler change**

```bash
git add packages/compiler/src/manifest.ts packages/compiler/src/index.ts tests/compiler/fs-routes.test.ts
git commit -m "feat: add route chunking manifest metadata"
```

### Task 2: Make CSR boot honor chunked and eager branches in all client modes

**Files:**
- Modify: `packages/csr/src/router.ts`
- Modify: `packages/csr/src/start-client-app.ts`
- Modify: `packages/csr/src/hydrate-app.ts`
- Modify: `packages/csr/src/route-render.ts`
- Modify: `tests/csr/start-client-app.test.ts`
- Modify: `tests/csr/hydrate-app.test.ts`

- [ ] **Step 1: Write the failing CSR tests**

Add one hydrated test, one shell test, one custom test, and one slot-route test that all use chunked manifest-backed branches. Keep the test names explicit:

```ts
test("hydrateApp waits for the chunked hydrated route before running hydrate.ts", async () => {
  // bootstrap -> route entry -> chunk load -> hydrate hook
});

test("startClientApp loads chunked shell routes through the manifest", async () => {
  // shell -> route entry -> lazy module resolution
});

test("startClientApp loads chunked custom routes while preserving host-owned data resolution", async () => {
  // custom -> route entry -> custom resolver -> lazy route module
});

test("chunked slot routes still resolve their branch modules", async () => {
  // slot root -> active slot route -> lazy module resolution
});
```

Also add a failure-path test for a rejected chunk import so the runtime surfaces the route-load error instead of silently falling back.

- [ ] **Step 2: Run the targeted CSR tests to confirm they fail**

Run:

```bash
bun test tests/csr/start-client-app.test.ts tests/csr/hydrate-app.test.ts
```

Expected: fail because chunked branch resolution is not yet wired through the client boot path.

- [ ] **Step 3: Implement chunk-aware route resolution**

Teach the CSR boot path to read the `chunked` flag from the route manifest and resolve branch modules accordingly:

```ts
if (route.chunked) {
  const module = await route.files.page?.();
  // then continue with the existing router / render / hydrate flow
}
```

Keep the existing runtime semantics:

- `hydrateApp()` still owns the initial `hydrated` handoff.
- `startClientApp({ mode: "shell" | "custom" | "hydrated" })` still chooses the same runtime mode.
- `custom` keeps its host-owned data resolution path; only the route module delivery becomes chunked.
- slot routes use the same branch metadata and lazy loading path as normal page branches.

Surface failures from missing or rejected chunks through the same route-load failure path the router already uses.

- [ ] **Step 4: Re-run the CSR tests**

Run:

```bash
bun test tests/csr/start-client-app.test.ts tests/csr/hydrate-app.test.ts
```

Expected: pass, including the chunked hydrated, shell, custom, slot, and rejection cases.

- [ ] **Step 5: Commit the CSR runtime change**

```bash
git add packages/csr/src/router.ts packages/csr/src/start-client-app.ts packages/csr/src/hydrate-app.ts packages/csr/src/route-render.ts tests/csr/start-client-app.test.ts tests/csr/hydrate-app.test.ts
git commit -m "feat: honor chunked route branches in csr"
```

### Task 3: Wire app templates and demos to the shared chunking switch

**Files:**
- Modify: `demo/showcase/src/runtime/assets.ts`
- Modify: `demo/showcase/src/client/chunked.ts`
- Modify: `demo/showcase/src/client/routes.ts`
- Modify: `demo/chunked-csr/src/runtime/app.ts`
- Modify: `demo/showcase/src/routes/gallery/chunked/*`
- Modify: `demo/showcase/src/routes/gallery/hydrated/*`
- Modify: `tests/showcase/app.test.ts`
- Modify: `tests/chunked-csr.test.ts`

- [ ] **Step 1: Write the failing demo tests**

Add assertions that prove the showcase and chunked-csr demos are using the shared chunking switch instead of hardcoded demo-only wiring:

```ts
expect(hydrated.html).toContain("/assets/showcase-hydrated.js");
expect(shell.html).toContain("/assets/showcase-shell.js");
expect(custom.html).toContain("/assets/showcase-custom.js");
expect(chunked.html).toContain("/assets/showcase-chunked.js");
```

Add a mixed-branch test that proves one route can stay eager while the rest of the template is chunked, using a branch id exclusion list.

- [ ] **Step 2: Run the targeted demo tests to confirm they fail**

Run:

```bash
bun test tests/showcase/app.test.ts tests/chunked-csr.test.ts
```

Expected: fail until the templates consume the new chunking option and the route-id exclusions are wired.

- [ ] **Step 3: Update the app-template wiring**

Use the new chunking option in the showcase and chunked-csr runtime build surfaces:

```ts
await writeRouteManifest({
  root: routesRoot,
  chunkedRoutes: {
    excludeRouteIds: ["gallery/hydrated/posts/[slug]"],
  },
});
```

Keep the following outcomes:

- hydrated demo routes can stay eager where the demo needs to prove default remount behavior
- shell and custom demo routes can also use the chunked path
- chunked routes still render correctly for SSR first paint and client takeover
- the client shell entries continue to mount against the intended root for each demo

If any gallery route modules need to branch between server and client rendering to avoid duplicate chrome, keep that logic in the route helper layer, not in the runtime boot code.

- [ ] **Step 4: Re-run the demo tests**

Run:

```bash
bun test tests/showcase/app.test.ts tests/chunked-csr.test.ts
```

Expected: pass, with chunked hydrated, shell, and custom coverage intact.

- [ ] **Step 5: Commit the demo wiring change**

```bash
git add demo/showcase/src/runtime/assets.ts demo/showcase/src/client/chunked.ts demo/showcase/src/client/routes.ts demo/chunked-csr/src/runtime/app.ts demo/showcase/src/routes/gallery/chunked demo/showcase/src/routes/gallery/hydrated tests/showcase/app.test.ts tests/chunked-csr.test.ts
git commit -m "feat: wire app templates to chunked routes"
```

### Task 4: Update docs and public examples

**Files:**
- Modify: `README.md`
- Modify: `docs/hydration-modes.md`
- Modify: `docs/route-conventions.md`
- Modify: `docs/demos.md`
- Modify: `demo/showcase/README.md`
- Modify: `demo/chunked-csr/README.md`
- Modify: `demo/csr/README.md`
- Modify: `demo/ssr-blog/README.md`
- Modify: `tests/docs-and-demos.test.ts`

- [ ] **Step 1: Write the failing docs tests**

Add assertions that the docs mention all three runtime modes plus the shared chunking switch:

```ts
expect(readme).toContain("hydrated");
expect(readme).toContain("shell");
expect(readme).toContain("custom");
expect(readme).toContain("chunkedRoutes");
```

Also assert that the demo docs describe chunking as a build-time template option, not a runtime mode.

- [ ] **Step 2: Run the docs test to confirm it fails**

Run:

```bash
bun test tests/docs-and-demos.test.ts
```

Expected: fail until the public docs match the new framework story.

- [ ] **Step 3: Update the docs and demo READMEs**

Describe the shared pattern clearly:

- `hydrated` = SSR plus remount takeover
- `shell` = transport-backed client boot
- `custom` = host-owned data resolution
- `chunkedRoutes` = build-time delivery switch that can be used by any of them

Call out that chunking is orthogonal to hydration and data loading. Make the demo docs show that the showcase is just one consumer of the same framework capability.

- [ ] **Step 4: Re-run the docs tests and full verification**

Run:

```bash
bun test tests/docs-and-demos.test.ts
bun run check
bun run test
bun run build
```

Expected: all pass.

- [ ] **Step 5: Commit the docs change**

```bash
git add README.md docs/hydration-modes.md docs/route-conventions.md docs/demos.md demo/showcase/README.md demo/chunked-csr/README.md demo/csr/README.md demo/ssr-blog/README.md tests/docs-and-demos.test.ts
git commit -m "docs: describe chunked route delivery switch"
```

## Coverage Check

- Compiler manifest generation: Task 1
- CSR boot and hydration behavior: Task 2
- Showcase / chunked demo wiring: Task 3
- Docs and public guidance: Task 4

If any task uncovers a mismatch between route-branch ids and slot route ids, fix it inside Task 1 or Task 2 rather than adding a separate configuration surface.
