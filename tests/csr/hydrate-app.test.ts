import { describe, expect, test, vi } from "vitest";

import { bindRenderEnv, van } from "../../packages/core/src/render";
import { hydrateApp, hydrateIslands } from "../../packages/csr/src/index";

const routes = [{ id: "posts/[slug]", path: "/posts/:slug" }];

function createBootstrapScript(payload: object) {
  return {
    textContent: JSON.stringify(payload),
  };
}

function createHydrationEnv() {
  let clickHandler: ((event: Record<string, unknown>) => unknown) | undefined;
  let popstateHandler: (() => unknown) | undefined;
  const appRoot = {
    querySelector: vi.fn(),
  };
  const createHeadNode = () => ({
    textContent: "",
    setAttribute: vi.fn(),
    remove: vi.fn(),
    getAttribute: vi.fn(() => null),
  });
  let bootstrapScript: { textContent: string | null } | null = null;

  const document = {
    title: "",
    createElement: vi.fn(() => createHeadNode()),
    head: {
      appendChild: vi.fn(),
    },
    querySelector: vi.fn((selector: string) => {
      if (selector === "script[data-van-stack-bootstrap]") {
        return bootstrapScript;
      }
      if (selector === "[data-van-stack-app-root]") {
        return appRoot;
      }
      return null;
    }),
    addEventListener: vi.fn((type: string, handler: typeof clickHandler) => {
      if (type === "click") {
        clickHandler = handler;
      }
    }),
    removeEventListener: vi.fn(),
  };

  const window = {
    location: {
      origin: "https://example.com",
      pathname: "/posts/agentic-coding-is-the-future",
      search: "",
    },
    addEventListener: vi.fn((type: string, handler: typeof popstateHandler) => {
      if (type === "popstate") {
        popstateHandler = handler;
      }
    }),
    removeEventListener: vi.fn(),
  };

  return {
    document,
    window,
    history: {
      pushState: vi.fn(),
    },
    appRoot,
    setBootstrapScript(payload: object | null) {
      bootstrapScript = payload ? createBootstrapScript(payload) : null;
    },
    getClickHandler() {
      return clickHandler;
    },
    getPopstateHandler() {
      return popstateHandler;
    },
  };
}

describe("csr hydrate app", () => {
  test("hydrates from SSR bootstrap and intercepts same-origin navigation", async () => {
    const env = createHydrationEnv();
    const hydrateSpy = vi.fn((dom, bind) => bind(dom));
    const routeHydrate = vi.fn((input: Record<string, unknown>) => {
      van.hydrate(input.root, (dom: unknown) => dom);
    });
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(..._args: unknown[]) {},
        hydrate: hydrateSpy,
      },
      vanX: {
        calc(fn: () => unknown) {
          return fn();
        },
        reactive<T>(value: T) {
          return value;
        },
        noreactive<T>(value: T) {
          return value;
        },
        stateFields<T>(value: T) {
          return value;
        },
        raw<T>(value: T) {
          return value;
        },
        list(..._args: unknown[]) {
          return [];
        },
        replace<T>(_value: T, replacement: T) {
          return replacement;
        },
        compact<T>(value: T) {
          return value;
        },
      },
    });
    const bootstrap = {
      routeId: "posts/[slug]",
      path: "/posts/agentic-coding-is-the-future?tab=summary",
      pathname: "/posts/agentic-coding-is-the-future",
      params: { slug: "agentic-coding-is-the-future" },
      hydrationPolicy: "app",
      data: { post: { slug: "agentic-coding-is-the-future" } },
    };
    env.setBootstrapScript(bootstrap);

    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug },
    }));

    const app = hydrateApp({
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            hydrate: async () => ({ default: routeHydrate }),
          },
        },
      ],
      history: env.history,
      transport: { load },
      document: env.document as never,
      window: env.window as never,
    });
    await app.ready;
    const preventDefault = vi.fn();

    const listener = vi.fn();
    app.router.subscribe(listener);

    expect(app.bootstrap).toEqual(bootstrap);
    expect(routeHydrate).toHaveBeenCalledWith({
      root: env.appRoot,
      data: bootstrap.data,
      params: bootstrap.params,
      path: bootstrap.path,
    });
    expect(hydrateSpy).toHaveBeenCalledWith(env.appRoot, expect.any(Function));
    expect(listener).toHaveBeenCalledWith({
      path: "/posts/agentic-coding-is-the-future?tab=summary",
      data: { post: { slug: "agentic-coding-is-the-future" } },
    });

    const clickHandler = env.getClickHandler();
    expect(clickHandler).toBeTypeOf("function");

    await clickHandler?.({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault,
      target: {
        closest() {
          return {
            href: "https://example.com/posts/github-down?tab=related",
            target: "",
            download: "",
          };
        },
      },
    });

    expect(load).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/posts/github-down",
        params: { slug: "github-down" },
      }),
      expect.objectContaining({
        pathname: "/posts/github-down",
      }),
    );
    expect(env.history.pushState).toHaveBeenCalledWith(
      { path: "/posts/github-down?tab=related" },
      "",
      "/posts/github-down?tab=related",
    );
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({
      path: "/posts/github-down?tab=related",
      data: { post: { slug: "github-down" } },
    });

    env.window.location.pathname = "/posts/back";
    env.window.location.search = "?tab=history";
    const popstateHandler = env.getPopstateHandler();
    expect(popstateHandler).toBeTypeOf("function");

    await popstateHandler?.();

    expect(load).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/posts/back",
        params: { slug: "back" },
      }),
      expect.objectContaining({
        pathname: "/posts/back",
      }),
    );
    expect(listener).toHaveBeenLastCalledWith({
      path: "/posts/back?tab=history",
      data: { post: { slug: "back" } },
    });

    app.dispose();

    expect(env.document.removeEventListener).toHaveBeenCalledWith(
      "click",
      clickHandler,
    );
    expect(env.window.removeEventListener).toHaveBeenCalledWith(
      "popstate",
      popstateHandler,
    );
  });

  test("throws when bootstrap is missing or not app mode", () => {
    const missingEnv = createHydrationEnv();
    missingEnv.setBootstrapScript(null);

    expect(() =>
      hydrateApp({
        routes,
        history: missingEnv.history,
        document: missingEnv.document as never,
        window: missingEnv.window as never,
      }),
    ).toThrow("No van-stack bootstrap payload was found in the document.");

    const wrongModeEnv = createHydrationEnv();
    wrongModeEnv.setBootstrapScript({
      pathname: "/posts/no-handoff",
      hydrationPolicy: "document-only",
      data: null,
    });

    expect(() =>
      hydrateApp({
        routes,
        history: wrongModeEnv.history,
        document: wrongModeEnv.document as never,
        window: wrongModeEnv.window as never,
      }),
    ).toThrow(
      'Cannot hydrate a bootstrap payload unless hydrationPolicy is "app".',
    );
  });

  test("hydrates named slot roots from bootstrap slot data", async () => {
    const env = createHydrationEnv();
    const defaultSlotRoot = { id: "default-slot" };
    const sidebarSlotRoot = { id: "sidebar-slot" };
    const defaultHydrate = vi.fn();
    const sidebarHydrate = vi.fn();

    env.appRoot.querySelector = vi.fn((selector: string) => {
      if (selector === '[data-van-stack-slot-root="default"]') {
        return defaultSlotRoot;
      }
      if (selector === '[data-van-stack-slot-root="sidebar"]') {
        return sidebarSlotRoot;
      }
      return null;
    });

    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(..._args: unknown[]) {},
        hydrate(..._args: unknown[]) {},
      },
      vanX: {
        calc(fn: () => unknown) {
          return fn();
        },
        reactive<T>(value: T) {
          return value;
        },
        noreactive<T>(value: T) {
          return value;
        },
        stateFields<T>(value: T) {
          return value;
        },
        raw<T>(value: T) {
          return value;
        },
        list(..._args: unknown[]) {
          return [];
        },
        replace<T>(_value: T, replacement: T) {
          return replacement;
        },
        compact<T>(value: T) {
          return value;
        },
      },
    });

    env.setBootstrapScript({
      routeId: "app/users/[id]",
      path: "/app/users/ada",
      pathname: "/app/users/ada",
      params: { id: "ada" },
      hydrationPolicy: "app",
      data: {
        user: { name: "Ada Lovelace" },
      },
      slotData: {
        sidebar: {
          navigation: { label: "Workspace" },
        },
      },
    });

    const app = hydrateApp({
      routes: [
        {
          id: "app/users/[id]",
          path: "/app/users/:id",
          files: {
            hydrate: async () => ({ default: defaultHydrate }),
          },
          slotOwnerLayout: "app",
          slotOwnerLayoutIndex: 0,
          slots: {
            sidebar: [
              {
                id: "app::sidebar",
                slot: "sidebar",
                path: "/app",
                files: {
                  hydrate: async () => ({ default: sidebarHydrate }),
                },
                layoutChain: [],
              },
            ],
          },
        },
      ],
      history: env.history,
      document: env.document as never,
      window: env.window as never,
    });

    await app.ready;

    expect(defaultHydrate).toHaveBeenCalledWith({
      root: defaultSlotRoot,
      data: { user: { name: "Ada Lovelace" } },
      params: { id: "ada" },
      path: "/app/users/ada",
    });
    expect(sidebarHydrate).toHaveBeenCalledWith({
      root: sidebarSlotRoot,
      data: {
        navigation: { label: "Workspace" },
      },
      params: {},
      path: "/app/users/ada",
    });
  });

  test("skips unmatched or opted-out links during hydrated navigation", async () => {
    const env = createHydrationEnv();
    env.setBootstrapScript({
      routeId: "posts/[slug]",
      path: "/posts/runtime-gallery-tour",
      pathname: "/posts/runtime-gallery-tour",
      params: { slug: "runtime-gallery-tour" },
      hydrationPolicy: "app",
      data: { post: { slug: "runtime-gallery-tour" } },
    });

    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug },
    }));

    const app = hydrateApp({
      routes,
      history: env.history,
      transport: { load },
      document: env.document as never,
      window: env.window as never,
    });
    await app.ready;

    const clickHandler = env.getClickHandler();
    expect(clickHandler).toBeTypeOf("function");

    const unmatchedPreventDefault = vi.fn();
    await clickHandler?.({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: unmatchedPreventDefault,
      target: {
        closest() {
          return {
            href: "https://example.com/gallery",
            target: "",
            download: "",
            getAttribute() {
              return null;
            },
          };
        },
      },
    });

    expect(unmatchedPreventDefault).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(env.history.pushState).not.toHaveBeenCalled();

    const ignoredPreventDefault = vi.fn();
    await clickHandler?.({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: ignoredPreventDefault,
      target: {
        closest() {
          return {
            href: "https://example.com/posts/when-hydration-actually-helps",
            target: "",
            download: "",
            getAttribute(name: string) {
              return name === "data-van-stack-ignore" ? "" : null;
            },
          };
        },
      },
    });

    expect(ignoredPreventDefault).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(env.history.pushState).not.toHaveBeenCalled();

    app.dispose();
  });

  test("hydrates islands routes without attaching router navigation", async () => {
    const env = createHydrationEnv();
    const routeHydrate = vi.fn();
    env.setBootstrapScript({
      routeId: "posts/[slug]",
      path: "/posts/runtime-gallery-tour",
      pathname: "/posts/runtime-gallery-tour",
      params: { slug: "runtime-gallery-tour" },
      hydrationPolicy: "islands",
      data: { post: { slug: "runtime-gallery-tour" } },
    });

    const hydration = hydrateIslands({
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            hydrate: async () => ({ default: routeHydrate }),
          },
        },
      ],
      document: env.document as never,
    });

    await hydration.ready;

    expect(routeHydrate).toHaveBeenCalledWith({
      root: env.document,
      data: { post: { slug: "runtime-gallery-tour" } },
      params: { slug: "runtime-gallery-tour" },
      path: "/posts/runtime-gallery-tour",
    });
    expect(env.document.addEventListener).not.toHaveBeenCalled();
    expect(env.window.addEventListener).not.toHaveBeenCalled();
  });
});
