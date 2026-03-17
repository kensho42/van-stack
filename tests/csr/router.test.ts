import { describe, expect, test, vi } from "vitest";

import type { Resolve } from "../../packages/core/src/index";
import { applyRouteHead, createRouter } from "../../packages/csr/src/index";

type HeadNode = {
  attributes: Map<string, string>;
  remove: () => void;
  setAttribute: (name: string, value: string) => void;
  tagName: string;
  textContent: string;
};

function createHeadDocument() {
  const nodes: HeadNode[] = [];

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

    const metaProperty = /^meta\[property="([^"]+)"\]$/.exec(selector);
    if (metaProperty) {
      return (
        node.tagName === "meta" &&
        node.attributes.get("property") === metaProperty[1]
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

  function createNode(tagName: string): HeadNode {
    const node: HeadNode = {
      tagName,
      textContent: "",
      attributes: new Map<string, string>(),
      setAttribute(name, value) {
        node.attributes.set(name, value);
      },
      remove() {
        const index = nodes.indexOf(node);
        if (index >= 0) {
          nodes.splice(index, 1);
        }
      },
    };

    return node;
  }

  const document = {
    title: "",
    createElement(tagName: string) {
      return createNode(tagName);
    },
    head: {
      appendChild(node: HeadNode) {
        nodes.push(node);
        return node;
      },
    },
    querySelector(selector: string) {
      if (
        selector === "title" &&
        document.title &&
        !nodes.some((node) => node.tagName === "title")
      ) {
        const titleNode = createNode("title");
        titleNode.textContent = document.title;
        nodes.push(titleNode);
      }

      return nodes.find((node) => matchesSelector(node, selector)) ?? null;
    },
  };

  return {
    document,
    getAttribute(selector: string, name: string) {
      return document.querySelector(selector)?.attributes.get(name) ?? null;
    },
    getText(selector: string) {
      return document.querySelector(selector)?.textContent ?? null;
    },
  };
}

describe("csr router", () => {
  const routes = [{ id: "posts/[slug]", path: "/posts/:slug" }];

  test("derives the reserved internal data URL from a canonical navigation", () => {
    const router = createRouter({
      mode: "shell",
      routes,
      transport: { load: vi.fn(async () => ({ ok: true })) },
      history: { pushState: vi.fn() },
    });

    expect(router.getInternalDataPath("/posts/github-down")).toBe(
      "/_van-stack/data/posts/github-down",
    );
  });

  test("keeps bootstrap data for hydrated mode and fetches internal data on later navigations", async () => {
    const load = vi.fn(async () => ({ post: { slug: "github-down" } }));
    const pushState = vi.fn();
    const router = createRouter({
      mode: "hydrated",
      routes,
      bootstrap: {
        path: "/posts/agentic-coding-is-the-future?tab=summary",
        pathname: "/posts/agentic-coding-is-the-future",
        data: { post: { slug: "agentic-coding-is-the-future" } },
      },
      transport: { load },
      history: { pushState },
    });

    expect(router.getCurrent()).toEqual(
      expect.objectContaining({
        path: "/posts/agentic-coding-is-the-future?tab=summary",
        data: { post: { slug: "agentic-coding-is-the-future" } },
      }),
    );

    const result = await router.navigate("/posts/github-down");

    expect(load).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/posts/github-down",
        params: { slug: "github-down" },
      }),
      expect.objectContaining({
        pathname: "/posts/github-down",
      }),
    );
    expect(pushState).toHaveBeenCalledWith(
      { path: "/posts/github-down" },
      "",
      "/posts/github-down",
    );
    expect(result).toEqual({
      path: "/posts/github-down",
      data: { post: { slug: "github-down" } },
    });
  });

  test("notifies subscribers with the current entry and later route changes", async () => {
    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug },
    }));
    const router = createRouter({
      mode: "hydrated",
      routes,
      bootstrap: {
        path: "/posts/agentic-coding-is-the-future?tab=summary",
        pathname: "/posts/agentic-coding-is-the-future",
        data: { post: { slug: "agentic-coding-is-the-future" } },
      },
      transport: { load },
      history: { pushState: vi.fn() },
    });
    const listener = vi.fn();

    const unsubscribe = router.subscribe(listener);

    expect(listener).toHaveBeenCalledWith({
      path: "/posts/agentic-coding-is-the-future?tab=summary",
      data: { post: { slug: "agentic-coding-is-the-future" } },
    });

    await router.navigate("/posts/github-down?tab=summary");

    expect(listener).toHaveBeenLastCalledWith({
      path: "/posts/github-down?tab=summary",
      data: { post: { slug: "github-down" } },
    });

    unsubscribe();
    await router.navigate("/posts/hn-posts");

    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("loads the initial route and later navigations through transport in shell mode", async () => {
    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: { slug: match.params.slug },
    }));
    const pushState = vi.fn();
    const router = createRouter({
      mode: "shell",
      routes,
      transport: { load },
      history: { pushState },
    });

    const initial = await router.load("/posts/agentic-coding-is-the-future");
    const next = await router.navigate("/posts/github-down");

    expect(load).toHaveBeenCalledTimes(2);
    expect(initial).toEqual({
      path: "/posts/agentic-coding-is-the-future",
      data: { post: { slug: "agentic-coding-is-the-future" } },
    });
    expect(next).toEqual({
      path: "/posts/github-down",
      data: { post: { slug: "github-down" } },
    });
    expect(pushState).toHaveBeenCalledTimes(1);
  });

  test("delegates data resolution to the host app in custom mode", async () => {
    const resolve = vi.fn<Resolve>(async (match) => ({
      post: { slug: match.params.slug, source: "graphql" },
    }));
    const pushState = vi.fn();
    const router = createRouter({
      mode: "custom",
      routes,
      resolve,
      history: { pushState },
    });

    const result = await router.navigate("/posts/graphql-app?tab=summary");
    const [match, navigation] = resolve.mock.calls[0];

    expect(match).toEqual(
      expect.objectContaining({
        pathname: "/posts/graphql-app",
        params: { slug: "graphql-app" },
        route: expect.objectContaining({ id: "posts/[slug]" }),
      }),
    );
    expect(match.query.toString()).toBe("tab=summary");
    expect(navigation.pathname).toBe("/posts/graphql-app");
    expect(navigation.query.toString()).toBe("tab=summary");
    expect(pushState).toHaveBeenCalledWith(
      { path: "/posts/graphql-app?tab=summary" },
      "",
      "/posts/graphql-app?tab=summary",
    );
    expect(result).toEqual({
      path: "/posts/graphql-app?tab=summary",
      data: { post: { slug: "graphql-app", source: "graphql" } },
    });
  });

  test("allows custom mode without a resolver for component-level fetching", async () => {
    const pushState = vi.fn();
    const router = createRouter({
      mode: "custom",
      routes,
      history: { pushState },
    });

    const initial = await router.load("/posts/component-owned");
    const next = await router.navigate("/posts/component-owned?tab=comments");

    expect(initial).toEqual({
      path: "/posts/component-owned",
      data: undefined,
    });
    expect(next).toEqual({
      path: "/posts/component-owned?tab=comments",
      data: undefined,
    });
    expect(pushState).toHaveBeenCalledWith(
      { path: "/posts/component-owned?tab=comments" },
      "",
      "/posts/component-owned?tab=comments",
    );
  });

  test("applies route metadata to the document head for transport-backed navigations", async () => {
    const head = createHeadDocument();
    const load = vi.fn(async (match: { params: Record<string, string> }) => ({
      post: {
        slug: match.params.slug,
        title: match.params.slug === "github-down" ? "GitHub Down" : "HN Posts",
      },
    }));
    const router = createRouter({
      mode: "shell",
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async meta() {
              return {
                default({
                  data,
                  params,
                }: {
                  data: unknown;
                  params: Record<string, string>;
                }) {
                  const typedData = data as {
                    post: { title: string };
                  };

                  return {
                    title: `${typedData.post.title} · Northstar Journal`,
                    description: `Story for ${params.slug}`,
                    canonical: `/posts/${params.slug}`,
                    openGraph: {
                      title: typedData.post.title,
                      description: `OpenGraph for ${params.slug}`,
                    },
                  };
                },
              };
            },
          },
        },
      ],
      transport: { load },
      history: { pushState: vi.fn() },
      document: head.document as never,
    });

    await router.load("/posts/github-down");

    expect(head.document.title).toBe("GitHub Down · Northstar Journal");
    expect(head.getAttribute('meta[name="description"]', "content")).toBe(
      "Story for github-down",
    );
    expect(head.getAttribute('link[rel="canonical"]', "href")).toBe(
      "/posts/github-down",
    );
    expect(head.getAttribute('meta[property="og:title"]', "content")).toBe(
      "GitHub Down",
    );

    await router.navigate("/posts/hn-posts");

    expect(head.document.title).toBe("HN Posts · Northstar Journal");
    expect(head.getAttribute('meta[name="description"]', "content")).toBe(
      "Story for hn-posts",
    );
    expect(head.getAttribute('link[rel="canonical"]', "href")).toBe(
      "/posts/hn-posts",
    );
    expect(
      head.getAttribute('meta[property="og:description"]', "content"),
    ).toBe("OpenGraph for hn-posts");
  });

  test("lets custom-mode apps apply route metadata after app-owned data resolution", async () => {
    const head = createHeadDocument();

    await applyRouteHead({
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async meta() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as {
                    post: { title: string };
                  };

                  return {
                    title: `${typedData.post.title} · Custom`,
                    description: "Custom mode updated the head after fetching.",
                    canonical: "/posts/runtime-gallery-tour",
                  };
                },
              };
            },
          },
        },
      ],
      document: head.document as never,
      path: "/posts/runtime-gallery-tour",
      data: {
        post: {
          title: "Runtime Gallery Tour",
        },
      },
    });

    expect(head.document.title).toBe("Runtime Gallery Tour · Custom");
    expect(head.getAttribute('meta[name="description"]', "content")).toBe(
      "Custom mode updated the head after fetching.",
    );
    expect(head.getAttribute('link[rel="canonical"]', "href")).toBe(
      "/posts/runtime-gallery-tour",
    );
  });
});
