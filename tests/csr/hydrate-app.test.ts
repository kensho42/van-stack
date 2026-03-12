import { describe, expect, test, vi } from "vitest";

import { hydrateApp } from "../../packages/csr/src/index";

const routes = [{ id: "posts/[slug]", path: "/posts/:slug" }];

function createBootstrapScript(payload: object) {
  return {
    textContent: JSON.stringify(payload),
  };
}

function createHydrationEnv() {
  let clickHandler: ((event: Record<string, unknown>) => unknown) | undefined;
  let popstateHandler: (() => unknown) | undefined;

  const document = {
    querySelector: vi.fn(),
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
    const bootstrap = {
      routeId: "posts/[slug]",
      path: "/posts/agentic-coding-is-the-future?tab=summary",
      pathname: "/posts/agentic-coding-is-the-future",
      params: { slug: "agentic-coding-is-the-future" },
      hydrationPolicy: "app",
      data: { post: { slug: "agentic-coding-is-the-future" } },
    };
    env.document.querySelector.mockReturnValue(
      createBootstrapScript(bootstrap),
    );

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
    const preventDefault = vi.fn();

    const listener = vi.fn();
    app.router.subscribe(listener);

    expect(app.bootstrap).toEqual(bootstrap);
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
    missingEnv.document.querySelector.mockReturnValue(null);

    expect(() =>
      hydrateApp({
        routes,
        history: missingEnv.history,
        document: missingEnv.document as never,
        window: missingEnv.window as never,
      }),
    ).toThrow("No van-stack bootstrap payload was found in the document.");

    const wrongModeEnv = createHydrationEnv();
    wrongModeEnv.document.querySelector.mockReturnValue(
      createBootstrapScript({
        pathname: "/posts/no-handoff",
        hydrationPolicy: "document-only",
        data: null,
      }),
    );

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
});
