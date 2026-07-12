# Swipe-Back Short-View Flicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent a committed swipe-back from briefly exposing the wrong vertical region when the outgoing scroll offset exceeds the retained destination view's height.

**Architecture:** Keep Van Stack's existing retained-view translation, stack-height lock, and history sequencing. Record whether the destination scroll was already settled before requesting restoration; only the synchronous restoration case that changes the offset must wait for an animation-frame observation before gesture styles are cleared.

**Tech Stack:** TypeScript, Van Stack CSR stack presentation, Vitest, Bun, Biome.

## Global Constraints

- Make no public API changes.
- Preserve existing swipe gesture motion, stack retention, scroll restoration, and history ordering.
- Preserve synchronous cleanup when `requestAnimationFrame` or `scrollTo` is unavailable.
- Keep the change focused on the committed swipe-back cleanup boundary.
- Work in the existing checkout; do not create a branch or worktree.

---

### Task 1: Hold Swipe Compensation Across Synchronous Scroll Restoration

**Files:**
- Modify: `tests/csr/start-client-app.test.ts:2477`
- Modify: `packages/csr/src/stack/presentation.ts:219`

**Interfaces:**
- Consumes: `restoreSwipeBackScroll(input, destination, scroll, clearStyles)` and the existing `ClientPresentationWindowLike.requestAnimationFrame` callback.
- Produces: unchanged internal function signatures; gesture cleanup waits for a frame only when `scrollTo` synchronously moves from a non-target offset to the target.

- [ ] **Step 1: Write the failing regression test**

Add this test immediately before the existing `"stack presentation keeps swipe compensation until async scroll restoration settles"` test:

```ts
  test("stack presentation keeps short-view compensation through synchronous scroll restoration", async () => {
    vi.useFakeTimers();
    try {
      const env = createClientDocument();
      const back = vi.fn();
      const frameCallbacks: Array<(time: number) => unknown> = [];
      const scrollTo = vi.fn(({ left, top }: { left: number; top: number }) => {
        testWindow.scrollX = left;
        testWindow.scrollY = top;
      });
      const testWindow = {
        location: {
          origin: "https://example.com",
          pathname: "/posts",
          search: "",
        },
        scrollX: 0,
        scrollY: 180,
        scrollTo,
        requestAnimationFrame(callback: (time: number) => unknown) {
          frameCallbacks.push(callback);
          return frameCallbacks.length;
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const app = startClientApp({
        mode: "shell",
        routes: [
          {
            id: "posts/index",
            path: "/posts",
            page({ path }: { path: string }) {
              return `<article>${path}</article>`;
            },
          },
          {
            id: "posts/[slug]",
            path: "/posts/:slug",
            page({ path }: { path: string }) {
              return `<article>${path}</article>`;
            },
            navigation: { enter: "push", up: "/posts" },
          },
        ],
        history: { back, pushState: vi.fn() } as never,
        transport: { load: vi.fn(async () => ({ ok: true })) },
        presentation: stackPresentation({
          duration: 320,
          swipeBack: { enabled: true },
          styles: false,
        }),
        document: env.document as never,
        rootSelector: '[data-van-stack-app-root=""]',
        window: testWindow as never,
      });

      await app.ready;
      await app.router.navigate("/posts/1");
      scrollTo.mockClear();
      testWindow.scrollY = 520;

      for (const child of env.root.children) {
        if (!child || typeof child !== "object") continue;
        const node = child as {
          attributes?: Map<string, string>;
          getBoundingClientRect?: () => { height: number };
        };
        node.getBoundingClientRect = () => ({
          height:
            node.attributes?.get("data-van-stack-path") === "/posts/1"
              ? 1200
              : 300,
        });
      }

      const previousRoot = env.root.children.find(
        (child) =>
          child &&
          typeof child === "object" &&
          "attributes" in child &&
          (child as { attributes: Map<string, string> }).attributes.get(
            "data-van-stack-path",
          ) === "/posts",
      ) as { style: Record<string, string> } | undefined;

      env.root.dispatchEvent("pointerdown", {
        pageX: 10,
        pageY: 20,
        target: env.root,
      });
      env.root.dispatchEvent("pointermove", {
        pageX: 260,
        pageY: 24,
        target: env.root,
      });
      env.root.dispatchEvent("pointerup", {
        pageX: 260,
        pageY: 24,
        target: env.root,
      });

      await vi.advanceTimersByTimeAsync(320);

      expect(scrollTo).toHaveBeenCalledWith({
        top: 180,
        left: 0,
        behavior: "auto",
      });
      expect(testWindow.scrollY).toBe(180);
      expect(previousRoot?.style.translate).toBe("0 340px");
      expect(env.root.attributes.get("style")).toContain(
        "min-height: 1200px",
      );
      expect(back).not.toHaveBeenCalled();

      for (const callback of frameCallbacks.splice(0)) {
        callback(0);
      }
      await vi.advanceTimersByTimeAsync(0);

      expect(previousRoot?.style.translate).toBeUndefined();
      expect(env.root.attributes.get("style")).toBeUndefined();
      expect(back).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
```

- [ ] **Step 2: Run the regression test and verify RED**

Run:

```bash
bun node_modules/vitest/vitest.mjs run tests/csr/start-client-app.test.ts -t "keeps short-view compensation through synchronous scroll restoration"
```

Expected: FAIL because `previousRoot.style.translate` is already `undefined` and `back` has already been called before an animation-frame callback runs.

- [ ] **Step 3: Implement the minimal cleanup-order fix**

In `restoreSwipeBackScroll`, capture the pre-restoration offset and use it to distinguish an already-settled scroll from one changed synchronously by `scrollTo`:

```ts
async function restoreSwipeBackScroll(
  input: ClientPresentationRenderInput,
  destination: StackItem,
  scroll: { left: number; top: number },
  clearStyles: () => void,
) {
  const current = getWindowScroll(input.window);
  const wasAtTarget =
    Math.abs(current.left - scroll.left) <= 0.5 &&
    Math.abs(current.top - scroll.top) <= 0.5;

  restoreWindowScroll(input.window, scroll, input.scroll.behavior);

  const requestFrame = input.window.requestAnimationFrame?.bind(input.window);
  if (!input.window.scrollTo || !requestFrame || wasAtTarget) {
    clearStyles();
    return;
  }

  await new Promise<void>((resolve) => {
    const update = () => {
      const next = getWindowScroll(input.window);
      if (
        Math.abs(next.left - scroll.left) <= 0.5 &&
        Math.abs(next.top - scroll.top) <= 0.5
      ) {
        clearStyles();
        resolve();
        return;
      }

      if (destination.root) {
        setInlineStyle(
          destination.root,
          "translate",
          `0 ${next.top - scroll.top}px`,
        );
      }
      requestFrame(update);
    };

    requestFrame(update);
  });
}
```

- [ ] **Step 4: Run the focused regression test and verify GREEN**

Run:

```bash
bun node_modules/vitest/vitest.mjs run tests/csr/start-client-app.test.ts -t "keeps short-view compensation through synchronous scroll restoration"
```

Expected: PASS.

- [ ] **Step 5: Run the complete CSR stack presentation test file**

Run:

```bash
bun node_modules/vitest/vitest.mjs run tests/csr/start-client-app.test.ts
```

Expected: all tests in `tests/csr/start-client-app.test.ts` pass with no errors or warnings.

- [ ] **Step 6: Run repository verification**

Run:

```bash
bun run test
bun run check
bun run build
```

Expected: all three commands exit with status 0. `bun run check` reports no Biome diagnostics, and the package build completes successfully.

- [ ] **Step 7: Commit the focused runtime fix**

```bash
git add packages/csr/src/stack/presentation.ts tests/csr/start-client-app.test.ts
git commit -m "fix(csr): prevent short-view swipe-back flicker"
```
