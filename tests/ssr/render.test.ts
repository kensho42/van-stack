import { describe, expect, test } from "vitest";

import { van } from "../../packages/core/src/render";
import { renderRequest } from "../../packages/ssr/src/index";

describe("ssr renderer", () => {
  test("renders a dynamic slug route from a Request and embeds a bootstrap payload", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/posts/github-down"),
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          hydrationPolicy: "app",
          async loader({ params }) {
            return { post: { slug: params.slug, title: "GitHub Down" } };
          },
          meta({ data, params }) {
            const typedData = data as { post: { title: string } };
            return {
              title: typedData.post.title,
              description: "Status update for GitHub downtime",
              canonical: `/posts/${params.slug}`,
            };
          },
          page({ data }) {
            const typedData = data as { post: { title: string } };
            return `<article><h1>${typedData.post.title}</h1></article>`;
          },
        },
      ],
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();

    expect(html).toContain("<title>GitHub Down</title>");
    expect(html).toContain(
      '<meta name="description" content="Status update for GitHub downtime">',
    );
    expect(html).toContain('<link rel="canonical" href="/posts/github-down">');
    expect(html).toContain('<div data-van-stack-app-root="">');
    expect(html).toContain("<article><h1>GitHub Down</h1></article>");
    expect(html).toContain('"pathname":"/posts/github-down"');
    expect(html).toContain('"hydrationPolicy":"app"');
  });

  test("renders a manifest-style route by loading route modules lazily", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/posts/manifest-route"),
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          files: {
            async loader() {
              return {
                default({ params }: { params: Record<string, string> }) {
                  return {
                    post: { slug: params.slug, title: "Manifest Route" },
                  };
                },
              };
            },
            async meta() {
              return {
                default({ data }: { data: unknown }) {
                  const typedData = data as { post: { title: string } };
                  return {
                    title: typedData.post.title,
                    description: "Loaded from the generated manifest",
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

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("<title>Manifest Route</title>");
    expect(html).toContain(
      '<meta name="description" content="Loaded from the generated manifest">',
    );
    expect(html).toContain("<article><h1>Manifest Route</h1></article>");
    expect(html).toContain('"hydrationPolicy":"app"');
  });

  test("serves raw non-HTML content through route.ts handlers", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/robots.txt"),
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

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(await response.text()).toBe("User-agent: *\nAllow: /\n");
  });

  test("renders Van facade page output instead of stringifying it", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/van"),
      routes: [
        {
          id: "van",
          path: "/van",
          page() {
            const { article, h1, p } = van.tags;

            return article(
              h1("Van Rendered"),
              p("SSR should emit real HTML from Van output."),
            );
          },
        },
      ],
    });

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("<article>");
    expect(html).toContain("<h1>Van Rendered</h1>");
    expect(html).not.toContain("[object Object]");
  });

  test("omits bootstrap markup for document-only SSR routes", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/ssr-only"),
      routes: [
        {
          id: "ssr-only",
          path: "/ssr-only",
          hydrationPolicy: "document-only",
          page() {
            return `<article><h1>SSR Only</h1></article>`;
          },
        },
      ],
    });

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("<article><h1>SSR Only</h1></article>");
    expect(html).not.toContain('data-van-stack-app-root=""');
    expect(html).not.toContain("data-van-stack-bootstrap");
  });

  test("keeps bootstrap markup for islands routes without app-root takeover", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/islands"),
      routes: [
        {
          id: "islands",
          path: "/islands",
          hydrationPolicy: "islands",
          page() {
            return `<article><h1>Islands</h1></article>`;
          },
        },
      ],
    });

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("<article><h1>Islands</h1></article>");
    expect(html).not.toContain('data-van-stack-app-root=""');
    expect(html).toContain("data-van-stack-bootstrap");
    expect(html).toContain('"hydrationPolicy":"islands"');
  });

  test("wraps matched pages through the discovered layout chain", async () => {
    const response = await renderRequest({
      request: new Request("https://example.com/posts/runtime-gallery-tour"),
      routes: [
        {
          id: "posts/[slug]",
          path: "/posts/:slug",
          async loader({ params }) {
            return {
              post: {
                slug: params.slug,
                title: "Runtime Gallery Tour",
              },
            };
          },
          layoutChain: [
            async () => ({
              default({
                children,
                data,
              }: {
                children: unknown;
                data: unknown;
              }) {
                const typedData = data as { post: { title: string } };

                return `<section data-presentation="stack"><header>${typedData.post.title}</header>${children}</section>`;
              },
            }),
          ],
          page({ data }) {
            const typedData = data as { post: { title: string } };
            return `<article><h1>${typedData.post.title}</h1></article>`;
          },
        },
      ],
    });

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain('<section data-presentation="stack">');
    expect(html).toContain("<header>Runtime Gallery Tour</header>");
    expect(html).toContain("<article><h1>Runtime Gallery Tour</h1></article>");
  });
});
