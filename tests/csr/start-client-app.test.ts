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
  replaceChildren: (...children: unknown[]) => void;
};

function createRootNode(): RootNode {
  return {
    children: [],
    innerHTML: "",
    replaceChildren(...children: unknown[]) {
      this.children = [...children];
      this.innerHTML = children.map((child) => String(child)).join("");
    },
  };
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
