import { describe, expect, test, vi } from "vitest";

import { startClientApp } from "../../packages/csr/src/index";
import { stackPresentation } from "../../packages/csr/src/stack";

type HeadNode = {
  attributes: Map<string, string>;
  getAttribute: (name: string) => string | null;
  remove: () => void;
  setAttribute: (name: string, value: string) => void;
  tagName: string;
  textContent: string;
};

type RootNode = {
  addEventListener: (
    type: string,
    listener: (event: Record<string, unknown>) => unknown,
  ) => void;
  attributes: Map<string, string>;
  classList: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
  };
  children: unknown[];
  dispatchEvent: (type: string, event: Record<string, unknown>) => void;
  getBoundingClientRect: () => { left: number; width: number };
  innerHTML: string;
  querySelector?: (selector: string) => unknown;
  removeAttribute: (name: string) => void;
  removeEventListener: (
    type: string,
    listener: (event: Record<string, unknown>) => unknown,
  ) => void;
  replaceChildren: (...children: unknown[]) => void;
  setAttribute: (name: string, value: string) => void;
};

type ViewChild = ViewNode | string;

type ViewNode = {
  attributes: Map<string, string>;
  children: ViewChild[];
  innerHTML: string;
  querySelector: (selector: string) => ViewNode | null;
  replaceChildren: (...children: unknown[]) => void;
  tagName: string;
};

function renderViewChild(child: unknown): string {
  if (typeof child === "string") {
    return child;
  }

  if (child && typeof child === "object" && "tagName" in child) {
    const viewNode = child as ViewNode;
    const attributes = [...viewNode.attributes.entries()]
      .map(([name, value]) => ` ${name}="${value}"`)
      .join("");

    return `<${viewNode.tagName}${attributes}>${viewNode.innerHTML}</${viewNode.tagName}>`;
  }

  return String(child ?? "");
}

function matchesViewSelector(node: ViewNode, selector: string) {
  const attributeMatch = /^\[([^=\]]+)="([^"]+)"\]$/.exec(selector);
  if (!attributeMatch) {
    return false;
  }

  return node.attributes.get(attributeMatch[1]) === attributeMatch[2];
}

function createViewNode(
  tagName: string,
  attributes: Record<string, string>,
  children: ViewChild[],
): ViewNode {
  const node: ViewNode = {
    tagName,
    attributes: new Map(Object.entries(attributes)),
    children,
    innerHTML: "",
    querySelector(selector: string) {
      for (const child of node.children) {
        if (!child || typeof child === "string") {
          continue;
        }

        if (matchesViewSelector(child, selector)) {
          return child;
        }

        const nested = child.querySelector(selector);
        if (nested) {
          return nested;
        }
      }

      return null;
    },
    replaceChildren(...nextChildren: unknown[]) {
      node.children = nextChildren as ViewChild[];
      node.innerHTML = node.children
        .map((child) => renderViewChild(child))
        .join("");
    },
  };

  node.replaceChildren(...children);
  return node;
}

function createRootNode(): RootNode {
  const listeners = new Map<
    string,
    Set<(event: Record<string, unknown>) => unknown>
  >();
  const root: RootNode = {
    attributes: new Map<string, string>(),
    children: [],
    classList: {
      add(...names: string[]) {
        const classes = new Set(
          (root.attributes.get("class") ?? "").split(/\s+/).filter(Boolean),
        );
        for (const name of names) classes.add(name);
        root.attributes.set("class", [...classes].join(" "));
      },
      remove(...names: string[]) {
        const classes = new Set(
          (root.attributes.get("class") ?? "").split(/\s+/).filter(Boolean),
        );
        for (const name of names) classes.delete(name);
        if (classes.size) {
          root.attributes.set("class", [...classes].join(" "));
        } else {
          root.attributes.delete("class");
        }
      },
    },
    innerHTML: "",
    addEventListener(type, listener) {
      const registered = listeners.get(type) ?? new Set();
      registered.add(listener);
      listeners.set(type, registered);
    },
    dispatchEvent(type, event) {
      for (const listener of listeners.get(type) ?? []) {
        listener({
          target: root,
          preventDefault() {},
          ...event,
        });
      }
    },
    getBoundingClientRect() {
      return { left: 0, width: 400 };
    },
    querySelector(selector: string) {
      for (const child of root.children) {
        if (
          !child ||
          typeof child === "string" ||
          !("querySelector" in (child as object))
        ) {
          continue;
        }

        const viewChild = child as ViewNode;
        if (matchesViewSelector(viewChild, selector)) {
          return viewChild;
        }

        const nested = viewChild.querySelector(selector);
        if (nested) {
          return nested;
        }
      }

      return null;
    },
    removeAttribute(name) {
      root.attributes.delete(name);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    replaceChildren(...children: unknown[]) {
      this.children = [...children];
      this.innerHTML = children.map((child) => renderViewChild(child)).join("");
    },
    setAttribute(name, value) {
      root.attributes.set(name, value);
    },
  };

  return root;
}

function createClientDocument() {
  const headNodes: HeadNode[] = [];
  const root = createRootNode();
  let bootstrapScript: { textContent: string | null } | null = null;

  function matchesSelector(node: HeadNode, selector: string) {
    if (selector === "title") {
      return node.tagName === "title";
    }

    const metaName = /^meta\[name="([^"]+)"\]$/.exec(selector);
    if (metaName) {
      return (
        node.tagName === "meta" && node.attributes.get("name") === metaName[1]
      );
    }

    const linkRel = /^link\[rel="([^"]+)"\]$/.exec(selector);
    if (linkRel) {
      return (
        node.tagName === "link" && node.attributes.get("rel") === linkRel[1]
      );
    }

    return false;
  }

  function createHeadNode(tagName: string): HeadNode {
    const node: HeadNode = {
      tagName,
      textContent: "",
      attributes: new Map<string, string>(),
      setAttribute(name, value) {
        node.attributes.set(name, value);
      },
      getAttribute(name) {
        return node.attributes.get(name) ?? null;
      },
      remove() {
        const index = headNodes.indexOf(node);
        if (index >= 0) {
          headNodes.splice(index, 1);
        }
      },
    };

    return node;
  }

  const document = {
    title: "",
    addEventListener: vi.fn(),
    createElement(tagName: string) {
      return createHeadNode(tagName);
    },
    head: {
      appendChild(node: HeadNode) {
        headNodes.push(node);
        return node;
      },
    },
    querySelector(selector: string) {
      if (selector === '[data-van-stack-app-root=""]') {
        return root;
      }
      if (selector === "[data-van-stack-app-root]") {
        return root;
      }
      if (selector === "script[data-van-stack-bootstrap]") {
        return bootstrapScript;
      }

      if (
        selector === "title" &&
        document.title &&
        !headNodes.some((node) => node.tagName === "title")
      ) {
        const titleNode = createHeadNode("title");
        titleNode.textContent = document.title;
        headNodes.push(titleNode);
      }

      return headNodes.find((node) => matchesSelector(node, selector)) ?? null;
    },
    removeEventListener: vi.fn(),
  };

  return {
    document,
    root,
    setBootstrapScript(payload: object | null) {
      bootstrapScript = payload
        ? {
            textContent: JSON.stringify(payload),
          }
        : null;
    },
    getText(selector: string) {
      const node = document.querySelector(selector) as {
        textContent?: string | null;
      } | null;
      return node?.textContent ?? null;
    },
    getAttribute(selector: string, name: string) {
      const node = document.querySelector(selector) as {
        getAttribute?: (name: string) => string | null;
      } | null;
      return node?.getAttribute?.(name) ?? null;
    },
  };
}

describe("startClientApp", () => {
  test("scrolls to top after successful shell navigations by default", async () => {
    const env = createClientDocument();
    const events: string[] = [];
    const scrollTo = vi.fn(() => {
      events.push("scroll");
    });
    const page = vi.fn(({ path }: { path: string }) => {
      events.push(`render:${path}`);
      return `<article>${path}</article>`;
    });
    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async page() {
              return { default: page };
            },
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/initial",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        scrollTo,
      } as never,
    });

    await app.ready;

    expect(scrollTo).not.toHaveBeenCalled();

    await app.router.navigate("/posts/next");

    expect(events).toEqual([
      "render:/posts/initial",
      "render:/posts/next",
      "scroll",
    ]);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
    expect(env.root.innerHTML).toContain("<article>/posts/next</article>");
  });

  test("preserves scroll on popstate by default", async () => {
    const env = createClientDocument();
    let popstateHandler: (() => unknown) | undefined;
    const scrollTo = vi.fn();
    const testWindow = {
      location: {
        origin: "https://example.com",
        pathname: "/posts/initial",
        search: "",
      },
      addEventListener: vi.fn((type: string, handler: () => unknown) => {
        if (type === "popstate") {
          popstateHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      scrollTo,
    };
    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          page({ path }: { path: string }) {
            return `<article>${path}</article>`;
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: testWindow as never,
    });

    await app.ready;
    testWindow.location.pathname = "/posts/back";

    await popstateHandler?.();

    expect(env.root.innerHTML).toContain("<article>/posts/back</article>");
    expect(scrollTo).not.toHaveBeenCalled();
  });

  test("honors shell scroll overrides for forward and popstate navigation", async () => {
    const env = createClientDocument();
    let popstateHandler: (() => unknown) | undefined;
    const scrollTo = vi.fn();
    const window = {
      location: {
        origin: "https://example.com",
        pathname: "/posts/initial",
        search: "",
      },
      addEventListener: vi.fn((type: string, handler: () => unknown) => {
        if (type === "popstate") {
          popstateHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      scrollTo,
    };
    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          page({ path }: { path: string }) {
            return `<article>${path}</article>`;
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      scroll: {
        onNavigate: "preserve",
        onPopState: "top",
        behavior: "smooth",
      },
      window: window as never,
    });

    await app.ready;
    await app.router.navigate("/posts/next");

    expect(scrollTo).not.toHaveBeenCalled();

    window.location.pathname = "/posts/back";
    await popstateHandler?.();

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  test("treats missing scrollTo as a no-op", async () => {
    const env = createClientDocument();
    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          page({ path }: { path: string }) {
            return `<article>${path}</article>`;
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/initial",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    await expect(app.router.navigate("/posts/next")).resolves.toEqual(
      expect.objectContaining({
        path: "/posts/next",
      }),
    );
  });

  test("stack presentation treats direct entry as a single leaf view", async () => {
    const env = createClientDocument();

    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          page({ path }: { path: string }) {
            return `<article>${path}</article>`;
          },
          navigation: { enter: "push", up: "/posts" },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      presentation: stackPresentation({ styles: false }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/1",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(env.root.innerHTML).toContain("<article>/posts/1</article>");
    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(1);
    expect(env.root.innerHTML).toContain(
      'data-van-stack-stack-position="current"',
    );
    expect(env.root.innerHTML).not.toContain("<article>/posts</article>");
  });

  test("stack presentation pushes route changes when navigation policy requests push", async () => {
    const env = createClientDocument();
    const pushState = vi.fn();

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
      history: { pushState },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      presentation: stackPresentation({ styles: false }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");

    expect(pushState).toHaveBeenCalledWith(
      { path: "/posts/1" },
      "",
      "/posts/1",
    );
    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(2);
    expect(env.root.innerHTML).toContain(
      'data-van-stack-stack-position="previous"',
    );
    expect(env.root.innerHTML).toContain("<article>/posts</article>");
    expect(env.root.innerHTML).toContain("<article>/posts/1</article>");
  });

  test("stack presentation replaces the active view when navigation policy requests replace", async () => {
    const env = createClientDocument();
    const replaceState = vi.fn();

    const app = startClientApp({
      mode: "custom",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          page({ path }: { path: string }) {
            return `<article>${path}</article>`;
          },
          navigation: { enter: "replace", up: "/posts" },
        },
      ],
      history: { pushState: vi.fn(), replaceState } as never,
      presentation: stackPresentation({ styles: false }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/1",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;
    await app.router.navigate("/posts/2");

    expect(replaceState).toHaveBeenCalledWith(
      { path: "/posts/2" },
      "",
      "/posts/2",
    );
    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(1);
    expect(env.root.innerHTML).not.toContain("<article>/posts/1</article>");
    expect(env.root.innerHTML).toContain("<article>/posts/2</article>");
  });

  test("stack presentation preserves previous views when replacing the active view", async () => {
    const env = createClientDocument();

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
          files: {
            async navigation() {
              return { default: { enter: "replace", up: "/posts" } };
            },
          },
        },
      ],
      history: { pushState: vi.fn(), replaceState: vi.fn() } as never,
      transport: { load: vi.fn(async () => ({ ok: true })) },
      presentation: stackPresentation({
        styles: false,
        action({ from, intent, routeNavigation }) {
          if (intent === "popstate") return "pop";
          if (intent === "load") return "replace";
          if (routeNavigation?.up === "/posts" && from?.pathname === "/posts") {
            return "push";
          }
          return routeNavigation?.enter ?? "replace";
        },
      }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");
    await app.router.navigate("/posts/2");

    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(2);
    expect(env.root.innerHTML).toContain("<article>/posts</article>");
    expect(env.root.innerHTML).not.toContain("<article>/posts/1</article>");
    expect(env.root.innerHTML).toContain("<article>/posts/2</article>");
  });

  test("stack presentation maps popstate to an existing previous view", async () => {
    const env = createClientDocument();
    let popstateHandler: (() => unknown) | undefined;
    const testWindow = {
      location: {
        origin: "https://example.com",
        pathname: "/posts",
        search: "",
      },
      addEventListener: vi.fn((type: string, handler: () => unknown) => {
        if (type === "popstate") {
          popstateHandler = handler;
        }
      }),
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
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      presentation: stackPresentation({ styles: false }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: testWindow as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");
    testWindow.location.pathname = "/posts";

    await popstateHandler?.();

    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(1);
    expect(env.root.innerHTML).toContain("<article>/posts</article>");
    expect(env.root.innerHTML).not.toContain("<article>/posts/1</article>");
  });

  test("stack presentation keeps Framework7-style page positions with previous retention", async () => {
    const env = createClientDocument();

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
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      presentation: stackPresentation({
        animate: false,
        retention: "previous",
        styles: false,
      }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");
    await app.router.navigate("/posts/2");

    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(2);
    expect(env.root.innerHTML).not.toContain("<article>/posts</article>");
    expect(env.root.innerHTML).toContain("<article>/posts/1</article>");
    expect(env.root.innerHTML).toContain("<article>/posts/2</article>");
    expect(env.root.innerHTML).toContain("van-stack-page-previous");
    expect(env.root.innerHTML).toContain("van-stack-page-current");
  });

  test("stack presentation can pop from pruned internal history", async () => {
    const env = createClientDocument();
    let popstateHandler: (() => unknown) | undefined;
    const testWindow = {
      location: {
        origin: "https://example.com",
        pathname: "/posts",
        search: "",
      },
      addEventListener: vi.fn((type: string, handler: () => unknown) => {
        if (type === "popstate") {
          popstateHandler = handler;
        }
      }),
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
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      presentation: stackPresentation({
        animate: false,
        retention: "current",
        styles: false,
      }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: testWindow as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");
    await app.router.navigate("/posts/2");
    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(1);
    expect(env.root.innerHTML).toContain("<article>/posts/2</article>");

    testWindow.location.pathname = "/posts/1";
    await popstateHandler?.();

    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(1);
    expect(env.root.innerHTML).toContain("<article>/posts/1</article>");
    expect(env.root.innerHTML).not.toContain("<article>/posts/2</article>");
  });

  test("stack presentation commits edge swipe-back and suppresses matching popstate replay", async () => {
    const env = createClientDocument();
    const back = vi.fn();
    const renderPostIndex = vi.fn(({ path }: { path: string }) => {
      return `<article>${path}</article>`;
    });
    let popstateHandler: (() => unknown) | undefined;
    const testWindow = {
      location: {
        origin: "https://example.com",
        pathname: "/posts",
        search: "",
      },
      addEventListener: vi.fn((type: string, handler: () => unknown) => {
        if (type === "popstate") {
          popstateHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    };

    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/index",
          path: "/posts",
          page: renderPostIndex,
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
        animate: false,
        swipeBack: { enabled: true },
        styles: false,
      }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: testWindow as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");

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
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(back).toHaveBeenCalledTimes(1);
    expect(env.root.innerHTML).toContain("<article>/posts</article>");
    expect(env.root.innerHTML).not.toContain("<article>/posts/1</article>");

    testWindow.location.pathname = "/posts";
    await popstateHandler?.();

    expect(renderPostIndex).toHaveBeenCalledTimes(1);
    expect(env.root.innerHTML.match(/data-van-stack-view/g)).toHaveLength(1);
    expect(env.root.innerHTML).toContain("<article>/posts</article>");
  });

  test("stack presentation resets short swipe-back gestures and honors opt-out targets", async () => {
    const env = createClientDocument();
    const back = vi.fn();
    const blockedTarget = {
      closest(selector: string) {
        return selector === "[data-van-stack-no-swipe-back]" ? {} : null;
      },
      matches() {
        return false;
      },
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
        animate: false,
        swipeBack: { enabled: true },
        styles: false,
      }),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;
    await app.router.navigate("/posts/1");

    env.root.dispatchEvent("pointerdown", {
      pageX: 10,
      pageY: 20,
      target: env.root,
    });
    env.root.dispatchEvent("pointermove", {
      pageX: 40,
      pageY: 21,
      target: env.root,
    });
    env.root.dispatchEvent("pointerup", {
      pageX: 40,
      pageY: 21,
      target: env.root,
    });

    env.root.dispatchEvent("pointerdown", {
      pageX: 10,
      pageY: 20,
      target: blockedTarget,
    });
    env.root.dispatchEvent("pointermove", {
      pageX: 260,
      pageY: 24,
      target: blockedTarget,
    });
    env.root.dispatchEvent("pointerup", {
      pageX: 260,
      pageY: 24,
      target: blockedTarget,
    });

    expect(back).not.toHaveBeenCalled();
    expect(env.root.innerHTML).toContain("<article>/posts/1</article>");
  });

  test("scrolls hydrated navigations after the managed app rerenders", async () => {
    const env = createClientDocument();
    const events: string[] = [];
    const scrollTo = vi.fn(() => {
      events.push("scroll");
    });
    const page = vi.fn(({ path }: { path: string }) => {
      events.push(`render:${path}`);
      return `<article>${path}</article>`;
    });
    env.setBootstrapScript({
      routeId: "posts/[slug]",
      path: "/posts/server-html",
      pathname: "/posts/server-html",
      params: { slug: "server-html" },
      hydrationPolicy: "app",
      data: { post: { slug: "server-html" } },
    });

    const app = startClientApp({
      mode: "hydrated",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async page() {
              return { default: page };
            },
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/server-html",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        scrollTo,
      } as never,
    });

    await app.ready;

    expect(scrollTo).not.toHaveBeenCalled();

    await app.router.navigate("/posts/next");

    expect(events).toEqual([
      "render:/posts/server-html",
      "render:/posts/next",
      "scroll",
    ]);
    expect(env.root.innerHTML).toContain("<article>/posts/next</article>");
  });

  test("renders a shell route from lazy manifest-style route modules", async () => {
    const env = createClientDocument();
    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug, title: "GitHub Down" },
    }));

    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async page() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as {
                    post: { slug: string; title: string };
                  };

                  return `<article><h1>${typedData.post.title}</h1></article>`;
                },
              };
            },
            async meta() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as {
                    post: { slug: string; title: string };
                  };

                  return {
                    title: typedData.post.title,
                    canonical: `/posts/${typedData.post.slug}`,
                  };
                },
              };
            },
          },
          layoutChain: [
            async () => ({
              default({
                children,
                params,
              }: {
                children: unknown;
                params: Record<string, string>;
              }) {
                return `<section data-layout="${params.slug}">${children}</section>`;
              },
            }),
          ],
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/github-down",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(load).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/posts/github-down",
        params: { slug: "github-down" },
      }),
      expect.objectContaining({
        pathname: "/posts/github-down",
      }),
    );
    expect(env.root.innerHTML).toContain(
      '<section data-layout="github-down"><article><h1>GitHub Down</h1></article></section>',
    );
    expect(env.document.title).toBe("GitHub Down");
    expect(env.getAttribute('link[rel="canonical"]', "href")).toBe(
      "/posts/github-down",
    );
  });

  test("keeps SSR DOM for the initial hydrated route and renders later navigations from page.ts", async () => {
    const env = createClientDocument();
    env.root.innerHTML = "<article><h1>Server HTML</h1></article>";
    const hydrateRoute = vi.fn();
    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug, title: "GitHub Down" },
    }));
    env.setBootstrapScript({
      routeId: "posts/[slug]",
      path: "/posts/server-html",
      pathname: "/posts/server-html",
      params: { slug: "server-html" },
      hydrationPolicy: "app",
      data: { post: { slug: "server-html", title: "Server HTML" } },
    });

    const app = startClientApp({
      mode: "hydrated",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async hydrate() {
              return {
                default: hydrateRoute,
              };
            },
            async page() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as {
                    post: { title: string };
                  };

                  return `<article><h1>${typedData.post.title}</h1></article>`;
                },
              };
            },
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load },
      document: env.document as never,
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/server-html",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(hydrateRoute).toHaveBeenCalledWith({
      root: env.root,
      data: { post: { slug: "server-html", title: "Server HTML" } },
      params: { slug: "server-html" },
      path: "/posts/server-html",
      pathname: "/posts/server-html",
      query: expect.any(URLSearchParams),
    });
    expect(env.root.innerHTML).toBe("<article><h1>Server HTML</h1></article>");

    await app.router.navigate("/posts/github-down");

    expect(env.root.innerHTML).toBe("<article><h1>GitHub Down</h1></article>");
    expect(hydrateRoute).toHaveBeenLastCalledWith({
      root: env.root,
      data: { post: { slug: "github-down", title: "GitHub Down" } },
      params: { slug: "github-down" },
      path: "/posts/github-down",
      pathname: "/posts/github-down",
      query: expect.any(URLSearchParams),
    });
    expect(hydrateRoute).toHaveBeenCalledTimes(2);
  });

  test("remounts the initial hydrated route through hydrateApp when no hydrate.ts is present", async () => {
    const env = createClientDocument();
    env.root.innerHTML = "<article><h1>Server HTML</h1></article>";
    env.setBootstrapScript({
      routeId: "posts/[slug]",
      path: "/posts/server-html",
      pathname: "/posts/server-html",
      params: { slug: "server-html" },
      hydrationPolicy: "app",
      data: { post: { slug: "server-html", title: "Client HTML" } },
    });

    const app = startClientApp({
      mode: "hydrated",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async page() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as {
                    post: { title: string };
                  };

                  return `<article><h1>${typedData.post.title}</h1></article>`;
                },
              };
            },
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: {
        load: vi.fn(async (match: { params: Record<string, string> }) => ({
          post: { slug: match.params.slug, title: "GitHub Down" },
        })),
      },
      document: env.document as never,
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/server-html",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(env.root.innerHTML).toBe("<article><h1>Client HTML</h1></article>");
  });

  test("renders eager custom routes through van.add and app-owned resolve", async () => {
    const env = createClientDocument();
    const app = startClientApp({
      mode: "custom",
      routes: [
        {
          id: "notes/[slug]",
          path: "/notes/:slug",
          meta({ data }) {
            const typedData = data as { note: { slug: string; title: string } };

            return {
              title: typedData.note.title,
              canonical: `/notes/${typedData.note.slug}`,
            };
          },
          page({ data }) {
            const typedData = data as { note: { title: string } };
            return {
              kind: "note-view",
              title: typedData.note.title,
            };
          },
        },
      ],
      history: { pushState: vi.fn() },
      resolve: vi.fn(async (match) => ({
        note: {
          slug: match.params.slug,
          title: "Launch Note",
        },
      })),
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/notes/launch",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(env.root.children).toEqual([
      {
        kind: "note-view",
        title: "Launch Note",
      },
    ]);
    expect(env.document.title).toBe("Launch Note");
    expect(env.getAttribute('link[rel="canonical"]', "href")).toBe(
      "/notes/launch",
    );
  });

  test("loads chunked shell routes through lazy page and meta modules", async () => {
    const env = createClientDocument();
    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug, title: "Lazy Shell" },
    }));
    const eagerPage = vi.fn(() => "<article>eager shell</article>");
    const chunkedPage = vi.fn(({ data }: { data: unknown }) => {
      const typedData = data as { post: { title: string } };
      return `<article>${typedData.post.title}</article>`;
    });
    const eagerMeta = vi.fn(() => ({
      title: "Wrong title",
    }));
    const chunkedMeta = vi.fn(({ data }: { data: unknown }) => {
      const typedData = data as { post: { slug: string; title: string } };
      return {
        title: typedData.post.title,
        canonical: `/posts/${typedData.post.slug}`,
      };
    });

    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          chunked: true,
          page: eagerPage,
          meta: eagerMeta,
          files: {
            async page() {
              return { default: chunkedPage };
            },
            async meta() {
              return { default: chunkedMeta };
            },
          },
        },
      ] as never,
      history: { pushState: vi.fn() },
      transport: { load },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/posts/lazy-shell",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(chunkedPage).toHaveBeenCalledTimes(1);
    expect(chunkedMeta).toHaveBeenCalledTimes(1);
    expect(eagerPage).not.toHaveBeenCalled();
    expect(eagerMeta).not.toHaveBeenCalled();
    expect(env.root.innerHTML).toContain("<article>Lazy Shell</article>");
    expect(env.document.title).toBe("Lazy Shell");
  });

  test("loads chunked custom routes while keeping app-owned resolve", async () => {
    const env = createClientDocument();
    const resolve = vi.fn(async (match) => ({
      note: { slug: match.params.slug, title: "Lazy Custom" },
    }));
    const eagerPage = vi.fn(() => ({ kind: "wrong-view" }));
    const chunkedPage = vi.fn(({ data }: { data: unknown }) => {
      const typedData = data as { note: { title: string } };
      return { kind: "note-view", title: typedData.note.title };
    });

    const app = startClientApp({
      mode: "custom",
      routes: [
        {
          id: "notes/[slug]",
          path: "/notes/:slug",
          chunked: true,
          page: eagerPage,
          files: {
            async page() {
              return { default: chunkedPage };
            },
          },
        },
      ] as never,
      history: { pushState: vi.fn() },
      resolve,
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/notes/lazy-custom",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(chunkedPage).toHaveBeenCalledTimes(1);
    expect(eagerPage).not.toHaveBeenCalled();
    expect(env.root.children).toEqual([
      {
        kind: "note-view",
        title: "Lazy Custom",
      },
    ]);
  });

  test("passes route params and query into resolver-free custom pages", async () => {
    const env = createClientDocument();
    const page = vi.fn((input) => ({
      iccid: input.params.iccid,
      kind: "esim-view",
      path: input.path,
      pathname: input.pathname,
      step: input.query.get("step"),
    }));

    const app = startClientApp({
      mode: "custom",
      routes: [
        {
          id: "new-esim/[iccid]",
          path: "/new-esim/:iccid",
          page,
        },
      ],
      history: { pushState: vi.fn() },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/new-esim/890123",
          search: "?step=scan",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(page).toHaveBeenCalledWith({
      data: undefined,
      params: { iccid: "890123" },
      path: "/new-esim/890123?step=scan",
      pathname: "/new-esim/890123",
      query: expect.any(URLSearchParams),
    });
    expect(env.root.children).toEqual([
      {
        iccid: "890123",
        kind: "esim-view",
        path: "/new-esim/890123?step=scan",
        pathname: "/new-esim/890123",
        step: "scan",
      },
    ]);

    await app.router.navigate("/new-esim/890123?step=confirm");

    expect(page).toHaveBeenCalledTimes(2);
    expect(page).toHaveBeenLastCalledWith({
      data: undefined,
      params: { iccid: "890123" },
      path: "/new-esim/890123?step=confirm",
      pathname: "/new-esim/890123",
      query: expect.any(URLSearchParams),
    });
    expect(env.root.children).toEqual([
      {
        iccid: "890123",
        kind: "esim-view",
        path: "/new-esim/890123?step=confirm",
        pathname: "/new-esim/890123",
        step: "confirm",
      },
    ]);
  });

  test("loads chunked slot routes through lazy slot page modules", async () => {
    const env = createClientDocument();
    const eagerSidebarPage = vi.fn(() =>
      createViewNode("aside", {}, ["Wrong"]),
    );
    const chunkedSidebarPage = vi.fn(() =>
      createViewNode("aside", {}, ["Lazy Sidebar"]),
    );
    const workspacePage = vi.fn(({ data }: { data: unknown }) => {
      const typedData = data as { user: { name: string } };
      return createViewNode("main", {}, [typedData.user.name]);
    });

    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "app/users/[id]",
          path: "/app/users/:id",
          files: {
            async page() {
              return {
                default: workspacePage,
              };
            },
          },
          layoutChain: [
            async () => ({
              default({
                children,
                slots,
              }: {
                children: unknown;
                slots: Record<string, unknown>;
              }) {
                return createViewNode("div", { class: "control-plane" }, [
                  slots.sidebar as ViewNode,
                  children as ViewNode,
                ]);
              },
            }),
          ],
          slotOwnerLayout: "app",
          slotOwnerLayoutIndex: 0,
          slots: {
            sidebar: [
              {
                id: "app::sidebar",
                slot: "sidebar",
                path: "/app",
                chunked: true,
                page: eagerSidebarPage,
                files: {
                  async page() {
                    return {
                      default: chunkedSidebarPage,
                    };
                  },
                },
                layoutChain: [],
              },
            ],
          },
        },
      ] as never,
      history: { pushState: vi.fn() },
      transport: {
        load: vi.fn(async () => ({
          data: { user: { name: "Ada Lovelace" } },
          slotData: { sidebar: { navigation: true } },
        })),
      },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/app/users/ada",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    expect(chunkedSidebarPage).toHaveBeenCalledTimes(1);
    expect(eagerSidebarPage).not.toHaveBeenCalled();
    expect(env.root.innerHTML).toContain("Lazy Sidebar");
    expect(env.root.innerHTML).toContain("Ada Lovelace");
  });

  test("rejects shell startup when a chunked route page import fails", async () => {
    const env = createClientDocument();
    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "broken",
          path: "/broken",
          chunked: true,
          page: () => "<article>wrong</article>",
          files: {
            async page() {
              throw new Error("chunk import failed");
            },
          },
        },
      ] as never,
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/broken",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await expect(app.ready).rejects.toThrow("chunk import failed");
  });

  test("rerenders slot roots when the route context changes", async () => {
    const env = createClientDocument();
    const sidebarPage = vi.fn(() => createViewNode("aside", {}, ["Sidebar"]));
    const workspacePage = vi.fn(({ data }: { data: unknown }) => {
      const typedData = data as { user: { name: string } };

      return createViewNode("main", {}, [typedData.user.name]);
    });

    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "app/users/[id]",
          path: "/app/users/:id",
          files: {
            async page() {
              return {
                default: workspacePage,
              };
            },
          },
          layoutChain: [
            async () => ({
              default({
                children,
                slots,
              }: {
                children: unknown;
                slots: Record<string, unknown>;
              }) {
                return createViewNode("div", { class: "control-plane" }, [
                  slots.sidebar as ViewNode,
                  children as ViewNode,
                ]);
              },
            }),
          ],
          slotOwnerLayout: "app",
          slotOwnerLayoutIndex: 0,
          slots: {
            sidebar: [
              {
                id: "app::sidebar",
                slot: "sidebar",
                path: "/app",
                files: {
                  async page() {
                    return {
                      default: sidebarPage,
                    };
                  },
                },
                layoutChain: [],
              },
            ],
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: {
        load: vi.fn(async (match) => ({
          data: {
            user: {
              name: match.params.id === "ada" ? "Ada Lovelace" : "Grace Hopper",
            },
          },
          slotData: {
            sidebar: {
              navigation: { label: "Workspace" },
            },
          },
        })),
      },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/app/users/ada",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await app.ready;

    const sidebarRoot = env.root.querySelector?.(
      '[data-van-stack-slot-root="sidebar"]',
    ) as ViewNode | null;
    const defaultRoot = env.root.querySelector?.(
      '[data-van-stack-slot-root="default"]',
    ) as ViewNode | null;

    expect(sidebarPage).toHaveBeenCalledTimes(1);
    expect(workspacePage).toHaveBeenCalledTimes(1);
    expect(sidebarRoot?.innerHTML).toContain("Sidebar");
    expect(defaultRoot?.innerHTML).toContain("Ada Lovelace");

    await app.router.navigate("/app/users/grace");

    expect(sidebarPage).toHaveBeenCalledTimes(2);
    expect(workspacePage).toHaveBeenCalledTimes(2);
    expect(
      env.root.querySelector?.('[data-van-stack-slot-root="sidebar"]'),
    ).toBe(sidebarRoot);
    expect(defaultRoot?.innerHTML).toContain("Grace Hopper");
  });

  test("rejects shell startup when the matched route page import fails", async () => {
    const env = createClientDocument();
    const app = startClientApp({
      mode: "shell",
      routes: [
        {
          id: "broken",
          path: "/broken",
          files: {
            async page() {
              throw new Error("chunk import failed");
            },
          },
        },
      ],
      history: { pushState: vi.fn() },
      transport: { load: vi.fn(async () => ({ ok: true })) },
      document: env.document as never,
      rootSelector: '[data-van-stack-app-root=""]',
      window: {
        location: {
          origin: "https://example.com",
          pathname: "/broken",
          search: "",
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as never,
    });

    await expect(app.ready).rejects.toThrow("chunk import failed");
  });
});
