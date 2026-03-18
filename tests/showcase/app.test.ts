import { readFileSync } from "node:fs";
import { createServer } from "node:http";

import { describe, expect, test } from "vitest";

import { handleShowcaseRequest } from "../../demo/showcase/src/runtime/app";
import {
  startShowcaseServer,
  startShowcaseServerWithFallback,
} from "../../demo/showcase/src/runtime/server";

const modeIds = [
  "ssg",
  "ssr",
  "hydrated",
  "islands",
  "shell",
  "custom",
  "chunked",
] as const;
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

  test("renders the landing page with all evaluator demo tracks", async () => {
    const { response, html } = await requestShowcase("/");

    expect(response.status).toBe(200);
    expect(html).toContain("Runtime Gallery");
    expect(html).toContain("Guided Walkthrough");
    expect(html).toContain("Adaptive Navigation");
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
    expect(html).toContain("/gallery/islands/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/shell/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/custom/posts/runtime-gallery-tour");
    expect(html).toContain("/gallery/chunked/posts/runtime-gallery-tour");
    expect(html).not.toContain("/gallery/adaptive");
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

  test("adaptive navigation exposes the shared blog graph under stack presentation", async () => {
    const homepage = await requestShowcase("/adaptive");
    expect(homepage.response.status).toBe(200);
    expect(homepage.html).toContain('data-presentation="stack"');

    for (const family of contentFamilies) {
      const listPage = await requestShowcase(`/adaptive/${family.collection}`);
      expect(
        listPage.response.status,
        `adaptive list route missing: /adaptive/${family.collection}`,
      ).toBe(200);

      const detailPage = await requestShowcase(
        `/adaptive/${family.collection}/${family.slug}`,
      );
      expect(
        detailPage.response.status,
        `adaptive detail route missing: /adaptive/${family.collection}/${family.slug}`,
      ).toBe(200);
      expect(detailPage.html).toContain('data-presentation="stack"');
    }
  });

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

  test("renders islands post pages with SSR content and island hydration markers", async () => {
    const { response, html } = await requestShowcase(
      "/gallery/islands/posts/runtime-gallery-tour",
    );

    expect(response.status).toBe(200);
    expect(html).toContain("Runtime Gallery Tour");
    expect(html).toContain("Like this post");
    expect(html).toContain("Save for later");
    expect(html).not.toContain('data-van-stack-app-root=""');
    expect(html).toContain("data-van-stack-bootstrap");
    expect(html).toContain("showcase-islands");
    expect(html).toContain("/assets/showcase-islands.js");
  });

  test("pre-renders hydrated and islands interaction state from the server session", async () => {
    const initial = await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
      ),
    );
    const cookie = initial.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) {
      throw new Error("Interaction endpoint did not return a session cookie.");
    }

    await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
        {
          method: "POST",
          headers: {
            cookie,
            "content-type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({ action: "like" }),
        },
      ),
    );
    await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
        {
          method: "POST",
          headers: {
            cookie,
            "content-type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({ action: "bookmark" }),
        },
      ),
    );

    const hydrated = await handleShowcaseRequest(
      new Request(
        "https://example.com/gallery/hydrated/posts/runtime-gallery-tour",
        {
          headers: {
            cookie,
          },
        },
      ),
    );
    const islands = await handleShowcaseRequest(
      new Request(
        "https://example.com/gallery/islands/posts/runtime-gallery-tour",
        {
          headers: {
            cookie,
          },
        },
      ),
    );

    expect(hydrated.status).toBe(200);
    expect(islands.status).toBe(200);

    const hydratedHtml = await hydrated.text();
    const islandsHtml = await islands.text();

    expect(hydratedHtml).toContain('data-like-count="">10');
    expect(hydratedHtml).toContain("Saved for this session");
    expect(hydratedHtml).toContain("Remove bookmark");
    expect(islandsHtml).toContain('data-like-count="">10');
    expect(islandsHtml).toContain("Saved for this session");
    expect(islandsHtml).toContain("Remove bookmark");
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
    expect(shell.html).not.toContain("<h1>Runtime Gallery Tour</h1>");
    expect(custom.html).not.toContain("<h1>Runtime Gallery Tour</h1>");
    expect(shell.html).not.toContain("Related posts");
    expect(custom.html).not.toContain("Related posts");
    expect(custom.html).not.toContain("/_van-stack/data/");
  });

  test("renders chunked post pages with the chunked client entry", async () => {
    const chunked = await requestShowcase(
      "/gallery/chunked/posts/runtime-gallery-tour",
    );

    expect(chunked.response.status).toBe(200);
    expect(chunked.html).toContain("Runtime Gallery Tour");
    expect(chunked.html).toContain("<article");
    expect(chunked.html).toContain("showcase-chunked");
    expect(chunked.html).toContain('data-showcase-client-root=""');
    expect(chunked.html).toContain("<script");
    expect(chunked.html).toContain("/assets/showcase-chunked.js");
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

  test("serves bundled client entry assets for hydrated, islands, shell, custom, and chunked modes", async () => {
    const hydratedAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-hydrated.js"),
    );
    const islandsAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-islands.js"),
    );
    const shellAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-shell.js"),
    );
    const customAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-custom.js"),
    );
    const chunkedAsset = await handleShowcaseRequest(
      new Request("https://example.com/assets/showcase-chunked.js"),
    );

    expect(hydratedAsset.status).toBe(200);
    expect(islandsAsset.status).toBe(200);
    expect(shellAsset.status).toBe(200);
    expect(customAsset.status).toBe(200);
    expect(chunkedAsset.status).toBe(200);
    expect(hydratedAsset.headers.get("content-type")).toContain("javascript");
    expect(islandsAsset.headers.get("content-type")).toContain("javascript");
    expect(shellAsset.headers.get("content-type")).toContain("javascript");
    expect(customAsset.headers.get("content-type")).toContain("javascript");
    expect(chunkedAsset.headers.get("content-type")).toContain("javascript");
    const hydratedSource = await hydratedAsset.text();
    const islandsSource = await islandsAsset.text();
    const shellSource = await shellAsset.text();
    const customSource = await customAsset.text();
    const chunkedSource = await chunkedAsset.text();

    expect(hydratedSource).toContain("hydrateApp");
    expect(islandsSource).toContain("hydrateIslands");
    expect(shellSource).toContain("createRouter");
    expect(customSource).toContain("createRouter");
    expect(chunkedSource).toContain("startClientApp");
    expect(chunkedSource).toContain("chunk-");

    // Client entrypoints should not bundle the full showcase editorial catalog.
    expect(hydratedSource).not.toContain("showcasePostCatalog");
    expect(islandsSource).not.toContain("showcasePostCatalog");
    expect(shellSource).not.toContain("showcasePostCatalog");
    expect(customSource).not.toContain("showcasePostCatalog");
    expect(chunkedSource).not.toContain("showcasePostCatalog");

    expect(hydratedSource.length).toBeLessThan(300_000);
    expect(islandsSource.length).toBeLessThan(300_000);
    expect(shellSource.length).toBeLessThan(300_000);
    expect(customSource.length).toBeLessThan(300_000);
    expect(chunkedSource.length).toBeLessThan(300_000);

    const chunkImport = /chunk-[^"'`]+\.js/.exec(chunkedSource)?.[0];
    expect(chunkImport).toBeTruthy();
    if (!chunkImport) {
      throw new Error("Chunked asset build did not emit a secondary chunk.");
    }

    const secondaryChunk = await handleShowcaseRequest(
      new Request(`https://example.com/assets/${chunkImport}`),
    );
    expect(secondaryChunk.status).toBe(200);
    expect(secondaryChunk.headers.get("content-type")).toContain("javascript");
  });

  test("serves route metadata from meta.ts for interactive routes", async () => {
    const shell = await requestShowcase(
      "/gallery/shell/posts/runtime-gallery-tour",
    );
    const islands = await requestShowcase(
      "/gallery/islands/posts/runtime-gallery-tour",
    );
    const walkthrough = await requestShowcase("/walkthrough/islands");

    expect(shell.html).toContain(
      "<title>Runtime Gallery Tour · Shell · Northstar Journal</title>",
    );
    expect(shell.html).toContain(
      '<link rel="canonical" href="/gallery/shell/posts/runtime-gallery-tour">',
    );
    expect(islands.html).toContain(
      "<title>Runtime Gallery Tour · Hydrated Islands · Northstar Journal</title>",
    );
    const chunked = await requestShowcase(
      "/gallery/chunked/posts/runtime-gallery-tour",
    );
    expect(chunked.html).toContain(
      "<title>Runtime Gallery Tour · Chunked · Northstar Journal</title>",
    );
    expect(walkthrough.html).toContain(
      "<title>Hydrated Islands Walkthrough · Northstar Journal</title>",
    );
  });

  test("demonstrates raw content routes for robots and sitemap", async () => {
    const robots = await handleShowcaseRequest(
      new Request("https://example.com/robots.txt"),
    );
    const sitemap = await handleShowcaseRequest(
      new Request("https://example.com/sitemap.xml"),
    );

    expect(robots.status).toBe(200);
    expect(sitemap.status).toBe(200);
    expect(robots.headers.get("content-type")).toContain("text/plain");
    expect(sitemap.headers.get("content-type")).toContain("application/xml");
    expect(await robots.text()).toContain(
      "Sitemap: https://example.com/sitemap.xml",
    );
    expect(await sitemap.text()).toContain(
      "<loc>https://example.com/gallery/islands/posts/runtime-gallery-tour</loc>",
    );
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

  test("persists likes and bookmarks on the server for the current session", async () => {
    const initial = await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
      ),
    );

    expect(initial.status).toBe(200);
    expect(initial.headers.get("content-type")).toContain("application/json");
    expect(initial.headers.get("set-cookie")).toContain("showcase-session=");
    await expect(initial.json()).resolves.toMatchObject({
      likes: expect.any(Number),
      bookmarked: false,
    });

    const cookie = initial.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) {
      throw new Error("Interaction endpoint did not return a session cookie.");
    }

    const liked = await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
        {
          method: "POST",
          headers: {
            cookie,
            "content-type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({ action: "like" }),
        },
      ),
    );
    const bookmarked = await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
        {
          method: "POST",
          headers: {
            cookie,
            "content-type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({ action: "bookmark" }),
        },
      ),
    );
    const persisted = await handleShowcaseRequest(
      new Request(
        "https://example.com/api/showcase/posts/runtime-gallery-tour/interactions",
        {
          headers: {
            cookie,
          },
        },
      ),
    );

    await expect(liked.json()).resolves.toMatchObject({
      likes: expect.any(Number),
      bookmarked: false,
    });
    await expect(bookmarked.json()).resolves.toMatchObject({
      likes: expect.any(Number),
      bookmarked: true,
    });
    await expect(persisted.json()).resolves.toMatchObject({
      likes: expect.any(Number),
      bookmarked: true,
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
      const interaction = await fetch(
        `http://127.0.0.1:${address.port}/api/showcase/posts/runtime-gallery-tour/interactions`,
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Runtime Gallery");
      expect(interaction.status).toBe(200);
      expect(interaction.headers.get("set-cookie")).toContain(
        "showcase-session=",
      );
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
