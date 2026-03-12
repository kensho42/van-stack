import { describe, expect, test } from "vitest";

import { handleShowcaseRequest } from "../../demo/showcase/src/runtime/app";

describe("showcase app", () => {
  test("renders the landing page with both evaluator demo tracks", async () => {
    const response = await handleShowcaseRequest(
      new Request("https://example.com/"),
    );

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("Runtime Gallery");
    expect(html).toContain("Guided Walkthrough");
  });

  test("renders a blog-style missing-post state for unknown post slugs", async () => {
    const response = await handleShowcaseRequest(
      new Request("https://example.com/gallery/hydrated/posts/missing-post"),
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Post not found");
  });

  test("renders a coherent 404 page for unknown showcase routes", async () => {
    const response = await handleShowcaseRequest(
      new Request("https://example.com/not-a-real-showcase-page"),
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Showcase page not found");
  });
});
