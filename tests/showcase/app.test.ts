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

  test("lists all supported modes on the gallery overview page", async () => {
    const response = await handleShowcaseRequest(
      new Request("https://example.com/gallery"),
    );

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("Hydrated");
    expect(html).toContain("Shell");
    expect(html).toContain("Custom");
    expect(html).toContain("SSG");
    expect(html).toContain("Adaptive");
  });

  test("renders a hydrated gallery page with app bootstrap markers", async () => {
    const response = await handleShowcaseRequest(
      new Request(
        "https://example.com/gallery/hydrated/posts/runtime-gallery-tour",
      ),
    );

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("Hydrated Mode");
    expect(html).toContain('data-van-stack-app-root=""');
    expect(html).toContain("data-van-stack-bootstrap");
  });

  test("renders shell and custom gallery pages with mode-specific callouts", async () => {
    const shellResponse = await handleShowcaseRequest(
      new Request("https://example.com/gallery/shell/posts/runtime-gallery-tour"),
    );
    const customResponse = await handleShowcaseRequest(
      new Request(
        "https://example.com/gallery/custom/posts/runtime-gallery-tour",
      ),
    );

    expect(await shellResponse.text()).toContain("transport-backed");
    expect(await customResponse.text()).toContain("app-owned resolution");
  });

  test("renders the SSG gallery page as a static-capable route", async () => {
    const response = await handleShowcaseRequest(
      new Request("https://example.com/gallery/ssg/posts/runtime-gallery-tour"),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Static-capable");
  });

  test("renders the adaptive gallery page with replace and stack framing", async () => {
    const response = await handleShowcaseRequest(
      new Request(
        "https://example.com/gallery/adaptive/posts/adaptive-threads-in-practice",
      ),
    );

    expect(response.status).toBe(200);

    const html = await response.text();

    expect(html).toContain("replace");
    expect(html).toContain("stack");
  });
});
