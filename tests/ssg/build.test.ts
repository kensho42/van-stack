import { describe, expect, test } from "vitest";

import { buildStaticRoutes } from "../../packages/ssg/src/index";

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
        path: "/about",
        html: expect.stringContaining("<article><h1>About</h1></article>"),
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
        path: "/posts/github-down",
        html: expect.stringContaining(
          "<article><h1>GitHub Down</h1></article>",
        ),
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
        path: "/posts/manifest-route",
        html: expect.stringContaining(
          "<article><h1>Manifest Route</h1></article>",
        ),
      },
    ]);
    expect(output[0]?.html).not.toContain("data-van-stack-bootstrap");
    expect(output[0]?.html).not.toContain('data-van-stack-app-root=""');
  });
});
