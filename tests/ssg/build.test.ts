import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  buildStaticRoutes,
  exportStaticSite,
} from "../../packages/ssg/src/index";

function decodeText(input: Uint8Array) {
  return new TextDecoder().decode(input);
}

describe("ssg builder", () => {
  test("builds static routes without requiring entries for non-dynamic paths", async () => {
    const output = await buildStaticRoutes({
      routes: [
        {
          id: "about",
          path: "/about",
          hydrationPolicy: "document-only",
          page() {
            return `<article><h1>About</h1></article>`;
          },
        },
      ],
    });

    expect(output).toEqual([
      {
        kind: "page",
        path: "/about",
        outputPath: "about/index.html",
        html: expect.stringContaining("<article><h1>About</h1></article>"),
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    ]);
    expect(output[0]?.html).not.toContain("data-van-stack-bootstrap");
  });

  test("builds concrete HTML pages from entries", async () => {
    const output = await buildStaticRoutes({
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          hydrationPolicy: "document-only",
          async entries() {
            return [{ slug: "github-down" }];
          },
          async loader({ params }) {
            return { post: { slug: params.slug, title: "GitHub Down" } };
          },
          page({ data }) {
            const typedData = data as { post: { title: string } };
            return `<article><h1>${typedData.post.title}</h1></article>`;
          },
        },
      ],
    });

    expect(output).toEqual([
      {
        kind: "page",
        path: "/posts/github-down",
        outputPath: "posts/github-down/index.html",
        html: expect.stringContaining(
          "<article><h1>GitHub Down</h1></article>",
        ),
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    ]);
    expect(output[0]?.html).not.toContain("data-van-stack-bootstrap");
    expect(output[0]?.html).not.toContain('data-van-stack-app-root=""');
  });

  test("builds concrete pages from a manifest-style route definition", async () => {
    const output = await buildStaticRoutes({
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          hydrationPolicy: "document-only",
          files: {
            async entries() {
              return {
                default() {
                  return [{ slug: "manifest-route" }];
                },
              };
            },
            async loader() {
              return {
                default({ params }: { params: Record<string, string> }) {
                  return {
                    post: { slug: params.slug, title: "Manifest Route" },
                  };
                },
              };
            },
            async page() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as { post: { title: string } };
                  return `<article><h1>${typedData.post.title}</h1></article>`;
                },
              };
            },
          },
        },
      ],
    });

    expect(output).toEqual([
      {
        kind: "page",
        path: "/posts/manifest-route",
        outputPath: "posts/manifest-route/index.html",
        html: expect.stringContaining(
          "<article><h1>Manifest Route</h1></article>",
        ),
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    ]);
    expect(output[0]?.html).not.toContain("data-van-stack-bootstrap");
    expect(output[0]?.html).not.toContain('data-van-stack-app-root=""');
  });

  test("builds raw route artifacts through route handlers", async () => {
    const output = await buildStaticRoutes({
      routes: [
        {
          id: "robots.txt",
          path: "/robots.txt",
          files: {
            async route() {
              return {
                default() {
                  return new Response("User-agent: *\nAllow: /\n", {
                    headers: {
                      "content-type": "text/plain; charset=utf-8",
                    },
                  });
                },
              };
            },
          },
        },
      ],
    });

    expect(output).toEqual([
      {
        kind: "route",
        path: "/robots.txt",
        outputPath: "robots.txt",
        body: expect.any(Uint8Array),
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
      },
    ]);
    expect(decodeText(output[0]?.body ?? new Uint8Array())).toBe(
      "User-agent: *\nAllow: /\n",
    );
  });

  test("exports html pages, raw route outputs, and copied assets to a static directory", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "van-stack-ssg-export-"));

    try {
      const assetDir = join(tempRoot, "static");
      const nestedDir = join(assetDir, "images");
      const extraFile = join(tempRoot, "favicon.ico");
      const outDir = join(tempRoot, "dist");

      await mkdir(nestedDir, { recursive: true });
      await writeFile(join(assetDir, "app.css"), "body{color:black;}", "utf8");
      await writeFile(join(nestedDir, "logo.txt"), "northstar", "utf8");
      await writeFile(extraFile, "icon", "utf8");

      const result = await exportStaticSite({
        outDir,
        routes: [
          {
            id: "index",
            path: "/",
            hydrationPolicy: "document-only",
            page() {
              return "<article><h1>Home</h1></article>";
            },
          },
          {
            id: "about",
            path: "/about",
            hydrationPolicy: "document-only",
            page() {
              return "<article><h1>About</h1></article>";
            },
          },
          {
            id: "robots.txt",
            path: "/robots.txt",
            route() {
              return new Response("User-agent: *\nAllow: /\n", {
                headers: {
                  "content-type": "text/plain; charset=utf-8",
                },
              });
            },
          },
          {
            id: "feeds/[slug]",
            path: "/feeds/:slug.xml",
            entries() {
              return [{ slug: "news" }];
            },
            route({ params }) {
              return new Response(`<feed>${params.slug}</feed>`, {
                headers: {
                  "content-type": "application/xml; charset=utf-8",
                },
              });
            },
          },
        ],
        assets: [{ from: assetDir, to: "assets" }, { from: extraFile }],
      });

      expect(result.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "page",
            path: "/",
            outputPath: "index.html",
          }),
          expect.objectContaining({
            kind: "page",
            path: "/about",
            outputPath: "about/index.html",
          }),
          expect.objectContaining({
            kind: "route",
            path: "/robots.txt",
            outputPath: "robots.txt",
          }),
          expect.objectContaining({
            kind: "route",
            path: "/feeds/news.xml",
            outputPath: "feeds/news.xml",
          }),
        ]),
      );
      expect(await readFile(join(outDir, "index.html"), "utf8")).toContain(
        "<article><h1>Home</h1></article>",
      );
      expect(
        await readFile(join(outDir, "about", "index.html"), "utf8"),
      ).toContain("<article><h1>About</h1></article>");
      expect(await readFile(join(outDir, "robots.txt"), "utf8")).toBe(
        "User-agent: *\nAllow: /\n",
      );
      expect(await readFile(join(outDir, "feeds", "news.xml"), "utf8")).toBe(
        "<feed>news</feed>",
      );
      expect(await readFile(join(outDir, "assets", "app.css"), "utf8")).toBe(
        "body{color:black;}",
      );
      expect(
        await readFile(join(outDir, "assets", "images", "logo.txt"), "utf8"),
      ).toBe("northstar");
      expect(await readFile(join(outDir, "favicon.ico"), "utf8")).toBe("icon");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("rejects export collisions between route output and copied assets", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "van-stack-ssg-collision-"));

    try {
      const assetFile = join(tempRoot, "robots.txt");
      const outDir = join(tempRoot, "dist");

      await writeFile(assetFile, "disallow", "utf8");

      await expect(
        exportStaticSite({
          outDir,
          routes: [
            {
              id: "robots.txt",
              path: "/robots.txt",
              route() {
                return new Response("User-agent: *\nAllow: /\n");
              },
            },
          ],
          assets: [{ from: assetFile, to: "robots.txt" }],
        }),
      ).rejects.toThrowError('Static export collision for "robots.txt".');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
