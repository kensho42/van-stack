import { describe, expect, test } from "vitest";
import {
  getPostByline,
  getPostEyebrow,
} from "../../demo/showcase/src/components/blog";
import {
  getModeCallout,
  getShowcaseTracks,
} from "../../demo/showcase/src/components/chrome";
import {
  getRelatedPosts,
  getShowcasePost,
  showcasePosts,
} from "../../demo/showcase/src/content/blog";
import {
  getShowcaseMode,
  showcaseModes,
} from "../../demo/showcase/src/content/modes";

describe("showcase content", () => {
  test("looks up posts by slug", () => {
    expect(getShowcasePost("launch-week-notes")?.title).toBe(
      "Launch Week Notes",
    );
    expect(getShowcasePost("missing-post")).toBeUndefined();
  });

  test("resolves related posts without returning the current post", () => {
    const current = getShowcasePost("runtime-gallery-tour");
    expect(current).toBeDefined();
    if (!current) {
      throw new Error("Expected runtime-gallery-tour to exist.");
    }

    const related = getRelatedPosts(current);

    expect(related).not.toHaveLength(0);
    expect(related.map((post) => post.slug)).not.toContain(current?.slug);
  });

  test("defines all supported showcase modes", () => {
    expect(showcaseModes.map((mode) => mode.id)).toEqual([
      "hydrated",
      "shell",
      "custom",
      "ssg",
      "adaptive",
    ]);
    expect(getShowcaseMode("ssg")?.walkthroughPath).toBe("/walkthrough/ssg");
  });

  test("exposes evaluator-facing showcase track copy", () => {
    expect(showcasePosts.length).toBeGreaterThanOrEqual(4);
    expect(getShowcaseTracks()).toEqual([
      expect.objectContaining({
        label: "Runtime Gallery",
        href: "/gallery",
      }),
      expect.objectContaining({
        label: "Guided Walkthrough",
        href: "/walkthrough",
      }),
    ]);
    expect(getModeCallout("custom").title).toContain("Custom");
  });

  test("builds consistent blog labels from the shared fixtures", () => {
    const post = getShowcasePost("launch-week-notes");
    expect(post).toBeDefined();
    if (!post) {
      throw new Error("Expected launch-week-notes to exist.");
    }

    expect(getPostEyebrow(post)).toContain("Product");
    expect(getPostEyebrow(post)).toContain("6 min read");
    expect(getPostByline(post)).toContain("Marta Solis");
  });
});
