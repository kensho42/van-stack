import { readFileSync } from "node:fs";
import { createServer } from "node:http";

import { describe, expect, test } from "vitest";

import { handleShowcaseRequest } from "../../demo/showcase/src/runtime/app";
import {
  startShowcaseServer,
  startShowcaseServerWithFallback,
} from "../../demo/showcase/src/runtime/server";

const modeIds = ["ssg", "ssr", "hydrated", "shell", "custom"] as const;
const contentFamilies = [
  {
    collection: "posts",
    slug: "runtime-gallery-tour",
  },
  {
    collection: "authors",
    slug: "marta-solis",
  },
  {
    collection: "categories",
    slug: "engineering",
  },
  {
    collection: "tags",
    slug: "runtime",
  },
] as const;

async function requestShowcase(path: string) {
  const response = await handleShowcaseRequest(
    new Request(`https://example.com${path}`),
  );

  return {
    response,
    html: await response.text(),
  };
}

describe("showcase app", () => {
  test("roots bun run start in the showcase runtime entry", () => {
    const rootPackage = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ) as {
      scripts?: Record<string, string>;
    };

    expect(rootPackage.scripts?.start).toContain(
      "demo/showcase/src/runtime/start.ts",
    );
  });

  test("renders the landing page with both evaluator demo tracks", async () => {
    const { response, html } = await requestShowcase("/");

    expect(response.status).toBe(200);
    expect(html).toContain("Runtime Gallery");
    expect(html).toContain("Guided Walkthrough");
  });

  test("renders a coherent 404 page for unknown showcase routes", async () => {
    const { response, html } = await requestShowcase(
      "/not-a-real-showcase-page",
    );

    expect(response.status).toBe(404);
    expect(html).toContain("Showcase page not found");
  });

  test("lists only the approved five showcase modes on the gallery overview", async () => {
    const { response, html } = await requestShowcase("/gallery");

    expect(response.status).toBe(200);
    expect(html).toContain("/gallery/ssg/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/ssr/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/hydrated/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/shell/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/custom/posts/runtime-gallery-tour");
    expect(html).not.toContain("Adaptive");
  });

  for (const mode of modeIds) {
    test(`${mode} exposes the full gallery route surface`, async () => {
      const homepage = await requestShowcase(`/gallery/${mode}/`);
      expect(homepage.response.status).toBe(200);

      for (const family of contentFamilies) {
        const listPage = await requestShowcase(
          `/gallery/${mode}/${family.collection}`,
        );
        expect(
          listPage.response.status,
          `${mode} list route missing: /gallery/${mode}/${family.collection}`,
        ).toBe(200);

        const detailPage = await requestShowcase(
          `/gallery/${mode}/${family.collection}/${family.slug}`,
        );
        expect(
          detailPage.response.status,
          `${mode} detail route missing: /gallery/${mode}/${family.collection}/${family.slug}`,
        ).toBe(200);
      }
    });
  }

  test("renders SSR post pages without hydration handoff markers", async () => {
    const { response, html } = await requestShowcase(
      "/gallery/ssr/posts/runtime-gallery-tour",
    );

    expect(response.status).toBe(200);
    expect(html).toContain("Runtime Gallery Tour");
    expect(html).not.toContain('data-van-stack-app-root=""');
    expect(html).not.toContain("data-van-stack-bootstrap");
    expect(html).not.toContain("showcase-hydrated");
  });

  test("renders hydrated post pages with SSR content and explicit client takeover", async () => {
    const { response, html } = await requestShowcase(
      "/gallery/hydrated/posts/runtime-gallery-tour",
    );

    expect(response.status).toBe(200);
    expect(html).toContain("Runtime Gallery Tour");
    expect(html).toContain('data-van-stack-app-root=""');
    expect(html).toContain("data-van-stack-bootstrap");
    expect(html).toContain("showcase-hydrated");
    expect(html).toContain("/assets/showcase-hydrated.js");
  });

  test("renders shell and custom post pages as shell-first documents", async () => {
    const shell = await requestShowcase(
      "/gallery/shell/posts/runtime-gallery-tour",
    );
    const custom = await requestShowcase(
      "/gallery/custom/posts/runtime-gallery-tour",
    );

    expect(shell.response.status).toBe(200);
    expect(custom.response.status).toBe(200);

    expect(shell.html).toContain("showcase-shell");
    expect(custom.html).toContain("showcase-custom");
    expect(shell.html).toContain("<script");
    expect(custom.html).toContain("<script");
    expect(shell.html).toContain("/assets/showcase-shell.js");
    expect(custom.html).toContain("/assets/showcase-custom.js");
    expect(shell.html).not.toContain("<article");
    expect(custom.html).not.toContain("<article");
    expect(shell.html).not.toContain("Runtime Gallery Tour");
    expect(custom.html).not.toContain("Runtime Gallery Tour");
    expect(shell.html).not.toContain("Related posts");
    expect(custom.html).not.toContain("Related posts");
    expect(custom.html).not.toContain("/_van-stack/data/");
  });

  test("renders SSG post pages as fully rendered static HTML", async () => {
    const { response, html } = await requestShowcase(
      "/gallery/ssg/posts/runtime-gallery-tour",
    );

    expect(response.status).toBe(200);
    expect(html).toContain("Runtime Gallery Tour");
    expect(html).not.toContain('data-van-stack-app-root=""');
    expect(html).not.toContain("data-van-stack-bootstrap");
    expect(html).not.toContain("showcase-hydrated");
    expect(html).not.toContain("showcase-shell");
    expect(html).not.toContain("showcase-custom");
  });

  test("serves bundled client entry assets for hydrated, shell, and custom modes", async () => {
    const hydratedAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-hydrated.js"),
    );
    const shellAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-shell.js"),
    );
    const customAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-custom.js"),
    );

    expect(hydratedAsset.status).toBe(200);
    expect(shellAsset.status).toBe(200);
    expect(customAsset.status).toBe(200);
    expect(hydratedAsset.headers.get("content-type")).toContain("javascript");
    expect(shellAsset.headers.get("content-type")).toContain("javascript");
    expect(customAsset.headers.get("content-type")).toContain("javascript");
    expect(await hydratedAsset.text()).toContain("hydrateApp");
    expect(await shellAsset.text()).toContain("createRouter");
    expect(await customAsset.text()).toContain("createRouter");
  });

  test("serves shell transport data from the internal van-stack data surface", async () => {
    const response = await handleShowcaseRequest(
      new Request(
        "https://example.com/_van-stack/data/gallery/shell/posts/runtime-gallery-tour",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toMatchObject({
      mode: { id: "shell" },
      post: { slug: "runtime-gallery-tour" },
      related: expect.any(Array),
    });
  });

  test("serves custom-mode blog entities from the demo JSON API", async () => {
    const postResponse = await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour",
      ),
    );
    const authorResponse = await handleShowcaseRequest(
      new Request("https://example.com/api/showcase/authors/marta-solis"),
    );

    expect(postResponse.status).toBe(200);
    expect(authorResponse.status).toBe(200);
    expect(postResponse.headers.get("content-type")).toContain(
      "application/json",
    );
    expect(authorResponse.headers.get("content-type")).toContain(
      "application/json",
    );
    await expect(postResponse.json()).resolves.toMatchObject({
      post: { slug: "runtime-gallery-tour" },
      related: expect.any(Array),
    });
    await expect(authorResponse.json()).resolves.toMatchObject({
      author: { slug: "marta-solis" },
      posts: expect.any(Array),
    });
  });

  test("starts an HTTP server that serves the showcase handler", async () => {
    const server = startShowcaseServer(0);
    const address = server.address();

    if (!address || typeof address === "string") {
      server.close();
      throw new Error("Showcase server did not expose a numeric port.");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/gallery`);

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Runtime Gallery");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });

  test("falls back to an open port when the preferred port is busy", async () => {
    const blocker = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end("busy");
    });

    await new Promise<void>((resolve) => {
      blocker.listen(0, resolve);
    });

    const blockerAddress = blocker.address();
    if (!blockerAddress || typeof blockerAddress === "string") {
      blocker.close();
      throw new Error("Busy-port blocker did not expose a numeric port.");
    }

    const server = await startShowcaseServerWithFallback(blockerAddress.port);
    const address = server.address();

    if (!address || typeof address === "string") {
      blocker.close();
      server.close();
      throw new Error(
        "Showcase fallback server did not expose a numeric port.",
      );
    }

    try {
      expect(address.port).not.toBe(blockerAddress.port);

      const response = await fetch(`http://127.0.0.1:${address.port}/gallery`);

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Runtime Gallery");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      await new Promise<void>((resolve, reject) => {
        blocker.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});
