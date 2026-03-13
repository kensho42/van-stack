import { describe, expect, test, vi } from "vitest";
import { mountShowcasePostInteractions } from "../../demo/showcase/src/client/post-interactions";
import { createGalleryPostData } from "../../demo/showcase/src/runtime/data";
import { bindRenderEnv } from "../../packages/core/src/render";

type ClickHandler = (event: Record<string, unknown>) => Promise<void>;

function createInteractionRoot() {
  const likeButton = {
    onclick: undefined as
      | ((event?: unknown) => Promise<void> | void)
      | undefined,
    textContent: "Like this post",
  };
  const likeCount = {
    textContent: "3",
  };
  const bookmarkButton = {
    onclick: undefined as ((event?: unknown) => void) | undefined,
    textContent: "Save for later",
  };
  const bookmarkState = {
    textContent: "Not saved",
  };

  return {
    likeButton,
    likeCount,
    bookmarkButton,
    bookmarkState,
    root: {
      querySelector(selector: string) {
        switch (selector) {
          case "[data-like-button]":
            return likeButton;
          case "[data-like-count]":
            return likeCount;
          case "[data-bookmark-button]":
            return bookmarkButton;
          case "[data-bookmark-state]":
            return bookmarkState;
          default:
            return null;
        }
      },
    },
  };
}

describe("showcase client helpers", () => {
  test("syncs post interaction state through the showcase server API", async () => {
    const data = createGalleryPostData("custom", "runtime-gallery-tour");
    let likes = 7;
    let bookmarked = false;
    const fetch = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (
          !url.endsWith("/api/showcase/posts/runtime-gallery-tour/interactions")
        ) {
          throw new Error(`Unexpected interaction request: ${url}`);
        }

        const action =
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as { action?: string }).action
            : undefined;

        if ((init?.method ?? "GET") === "POST" && action === "like") {
          likes += 1;
        }

        if ((init?.method ?? "GET") === "POST" && action === "bookmark") {
          bookmarked = !bookmarked;
        }

        return new Response(
          JSON.stringify({
            likes,
            bookmarked,
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
            },
          },
        );
      },
    );
    const firstMount = createInteractionRoot();

    await mountShowcasePostInteractions(firstMount.root, data, {
      fetch: fetch as never,
    });
    await firstMount.likeButton.onclick?.();
    await firstMount.likeButton.onclick?.();
    await firstMount.bookmarkButton.onclick?.();

    expect(firstMount.likeCount.textContent).toBe("9");
    expect(firstMount.bookmarkState.textContent).toBe("Saved for this session");
    expect(firstMount.bookmarkButton.textContent).toBe("Remove bookmark");

    const secondMount = createInteractionRoot();
    await mountShowcasePostInteractions(secondMount.root, data, {
      fetch: fetch as never,
    });

    expect(secondMount.likeCount.textContent).toBe("9");
    expect(secondMount.bookmarkState.textContent).toBe(
      "Saved for this session",
    );
    expect(secondMount.bookmarkButton.textContent).toBe("Remove bookmark");
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  test("intercepts only current-app links unless a link opts out", async () => {
    bindRenderEnv({
      van: {
        tags: new Proxy(
          {},
          {
            get(_target, key) {
              return (...args: unknown[]) => ({ key, args });
            },
          },
        ) as Record<string, (...args: unknown[]) => unknown>,
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add() {},
        hydrate(_dom: unknown, bind: (dom: unknown) => unknown) {
          return bind(_dom);
        },
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
        list() {
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
    const { customClientRoutes, wireClientNavigation } = await import(
      "../../demo/showcase/src/client/routes"
    );
    let clickHandler: ClickHandler | undefined;
    const router = {
      load: vi.fn(async () => undefined),
      navigate: vi.fn(async () => undefined),
    };
    const document = {
      addEventListener(_type: string, handler: ClickHandler) {
        clickHandler = handler;
      },
      removeEventListener: vi.fn(),
    };
    const window = {
      location: {
        origin: "https://example.com",
        pathname: "/gallery/custom/posts/runtime-gallery-tour",
        search: "",
      },
      history: {
        pushState: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    wireClientNavigation(router, {
      document: document as never,
      window: window as never,
      routes: customClientRoutes,
    });

    if (!clickHandler) {
      throw new Error("Client navigation handler was not registered.");
    }
    const handleClick = clickHandler;

    const otherModePreventDefault = vi.fn();
    await handleClick({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: otherModePreventDefault,
      target: {
        closest() {
          return {
            href: "https://example.com/gallery/hydrated/posts/runtime-gallery-tour",
            target: "",
            download: "",
            getAttribute() {
              return null;
            },
          };
        },
      },
    });

    expect(otherModePreventDefault).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();

    const ignoredPreventDefault = vi.fn();
    await handleClick({
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: ignoredPreventDefault,
      target: {
        closest() {
          return {
            href: "https://example.com/gallery/custom/authors/marta-solis",
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
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
