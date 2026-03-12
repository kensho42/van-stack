import { describe, expect, test, vi } from "vitest";

import type { Resolve } from "../../packages/core/src/index";
import { createRouter } from "../../packages/csr/src/index";

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
        pathname: "/posts/agentic-coding-is-the-future",
        data: { post: { slug: "agentic-coding-is-the-future" } },
      },
      transport: { load },
      history: { pushState },
    });

    expect(router.getCurrent()).toEqual(
      expect.objectContaining({
        path: "/posts/agentic-coding-is-the-future",
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
});
