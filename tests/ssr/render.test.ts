import { describe, expect, test } from "vitest";

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
    expect(response.html).toContain("<title>GitHub Down</title>");
    expect(response.html).toContain(
      '<meta name="description" content="Status update for GitHub downtime">',
    );
    expect(response.html).toContain(
      '<link rel="canonical" href="/posts/github-down">',
    );
    expect(response.html).toContain("<article><h1>GitHub Down</h1></article>");
    expect(response.html).toContain('"pathname":"/posts/github-down"');
    expect(response.html).toContain('"hydrationPolicy":"app"');
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
    expect(response.html).toContain("<title>Manifest Route</title>");
    expect(response.html).toContain(
      '<meta name="description" content="Loaded from the generated manifest">',
    );
    expect(response.html).toContain(
      "<article><h1>Manifest Route</h1></article>",
    );
    expect(response.html).toContain('"hydrationPolicy":"app"');
  });
});
