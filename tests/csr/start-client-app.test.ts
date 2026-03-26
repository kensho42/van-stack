import { describe, expect, test, vi } from "vitest";

import { bindRenderEnv } from "../../packages/core/src/render";
import { startClientApp } from "../../packages/csr/src/index";

type HeadNode = {
  attributes: Map<string, string>;
  getAttribute: (name: string) => string | null;
  remove: () => void;
  setAttribute: (name: string, value: string) => void;
  tagName: string;
  textContent: string;
};

type RootNode = {
  children: unknown[];
  innerHTML: string;
  querySelector?: (selector: string) => unknown;
  replaceChildren: (...children: unknown[]) => void;
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

function createTag(tagName: string) {
  return (...args: unknown[]) => {
    const [first, ...rest] = args;
    const hasAttributes =
      first &&
      typeof first === "object" &&
      !Array.isArray(first) &&
      !("tagName" in (first as Record<string, unknown>));
    const attributes = hasAttributes
      ? Object.fromEntries(
          Object.entries(first as Record<string, unknown>).map(
            ([name, value]) => [name, String(value)],
          ),
        )
      : {};
    const children = hasAttributes
      ? (rest as ViewChild[])
      : (args as ViewChild[]);

    return createViewNode(tagName, attributes, children);
  };
}

function createRootNode(): RootNode {
  const root: RootNode = {
    children: [],
    innerHTML: "",
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
    replaceChildren(...children: unknown[]) {
      this.children = [...children];
      this.innerHTML = children.map((child) => renderViewChild(child)).join("");
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
  test("renders a shell route from lazy manifest-style route modules", async () => {
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate() {},
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
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate: vi.fn(),
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
    });
    expect(env.root.innerHTML).toBe("<article><h1>Server HTML</h1></article>");

    await app.router.navigate("/posts/github-down");

    expect(env.root.innerHTML).toBe("<article><h1>GitHub Down</h1></article>");
    expect(hydrateRoute).toHaveBeenLastCalledWith({
      root: env.root,
      data: { post: { slug: "github-down", title: "GitHub Down" } },
      params: { slug: "github-down" },
      path: "/posts/github-down",
    });
    expect(hydrateRoute).toHaveBeenCalledTimes(2);
  });

  test("remounts the initial hydrated route through hydrateApp when no hydrate.ts is present", async () => {
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate: vi.fn(),
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
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.children = [child];
          root.innerHTML = "";
        },
        hydrate() {},
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
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate() {},
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
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.children = [child];
          root.innerHTML = "";
        },
        hydrate() {},
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

  test("loads chunked slot routes through lazy slot page modules", async () => {
    bindRenderEnv({
      van: {
        tags: {
          aside: createTag("aside"),
          div: createTag("div"),
          main: createTag("main"),
        },
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate() {},
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
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate() {},
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

  test("rerenders only changed slot roots for slot-aware shell routes", async () => {
    bindRenderEnv({
      van: {
        tags: {
          aside: createTag("aside"),
          div: createTag("div"),
          main: createTag("main"),
        },
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate() {},
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

    expect(sidebarPage).toHaveBeenCalledTimes(1);
    expect(workspacePage).toHaveBeenCalledTimes(2);
    expect(
      env.root.querySelector?.('[data-van-stack-slot-root="sidebar"]'),
    ).toBe(sidebarRoot);
    expect(defaultRoot?.innerHTML).toContain("Grace Hopper");
  });

  test("rejects shell startup when the matched route page import fails", async () => {
    bindRenderEnv({
      van: {
        tags: {},
        state(value: unknown) {
          return { val: value };
        },
        derive(fn: () => unknown) {
          return fn();
        },
        add(root: RootNode, child: unknown) {
          root.replaceChildren(child);
        },
        hydrate() {},
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
