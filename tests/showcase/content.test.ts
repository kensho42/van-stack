import { describe, expect, test } from "vitest";

import * as showcaseBlog from "../../demo/showcase/src/content/blog";
import * as showcaseModesModule from "../../demo/showcase/src/content/modes";

type SlugRecord = {
  slug: string;
};

type PostLike = {
  slug: string;
  author?: { slug?: string } | string;
  authorSlug?: string;
  category?: { slug?: string } | string;
  categorySlug?: string;
  primaryCategory?: { slug?: string } | string;
  primaryCategorySlug?: string;
  tags?: Array<{ slug?: string } | string>;
  relatedSlugs?: string[];
};

function expectArrayExport<T>(moduleValue: object, exportName: string): T[] {
  const value = (moduleValue as Record<string, unknown>)[exportName];

  expect(
    Array.isArray(value),
    `${exportName} should be an exported array`,
  ).toBe(true);

  return value as T[];
}

function expectStringExport(moduleValue: object, exportName: string): string {
  const value = (moduleValue as Record<string, unknown>)[exportName];

  expect(typeof value, `${exportName} should be an exported string`).toBe(
    "string",
  );

  return value as string;
}

function expectFunctionExport<T extends (...args: never[]) => unknown>(
  moduleValue: object,
  exportName: string,
): T {
  const value = (moduleValue as Record<string, unknown>)[exportName];

  expect(typeof value, `${exportName} should be an exported function`).toBe(
    "function",
  );

  return value as T;
}

function slugFromReference(
  value: string | { slug?: string } | undefined,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return value?.slug;
}

function getPostAuthorSlug(post: PostLike) {
  return post.authorSlug ?? slugFromReference(post.author);
}

function getPostCategorySlug(post: PostLike) {
  return (
    post.primaryCategorySlug ??
    slugFromReference(post.primaryCategory) ??
    post.categorySlug ??
    slugFromReference(post.category)
  );
}

function getPostTagSlugs(post: PostLike) {
  return (post.tags ?? [])
    .map((tag) => slugFromReference(tag))
    .filter((tag): tag is string => Boolean(tag));
}

describe("showcase content", () => {
  test("defines the approved showcase modes and canonical comparison targets", () => {
    const showcaseModes = expectArrayExport<{
      id: string;
      galleryPath: string;
      walkthroughPath: string;
    }>(showcaseModesModule, "showcaseModes");
    const showcaseCanonicalPostSlug = expectStringExport(
      showcaseBlog,
      "showcaseCanonicalPostSlug",
    );

    expect(showcaseModes.map((mode) => mode.id)).toEqual([
      "ssg",
      "ssr",
      "hydrated",
      "islands",
      "shell",
      "custom",
      "chunked",
    ]);

    for (const mode of showcaseModes) {
      expect(mode.galleryPath).toBe(
        `/gallery/${mode.id}/posts/${showcaseCanonicalPostSlug}`,
      );
      expect(mode.walkthroughPath).toBe(`/walkthrough/${mode.id}`);
    }
  });

  test("ships the full showcase editorial graph", () => {
    const showcasePosts = expectArrayExport<PostLike>(
      showcaseBlog,
      "showcasePosts",
    );
    const showcaseAuthors = expectArrayExport<SlugRecord>(
      showcaseBlog,
      "showcaseAuthors",
    );
    const showcaseCategories = expectArrayExport<SlugRecord>(
      showcaseBlog,
      "showcaseCategories",
    );
    const showcaseTags = expectArrayExport<SlugRecord>(
      showcaseBlog,
      "showcaseTags",
    );

    expect(showcasePosts).toHaveLength(30);
    expect(showcaseAuthors).toHaveLength(8);
    expect(showcaseCategories).toHaveLength(8);
    expect(showcaseTags).toHaveLength(12);
  });

  test("keeps post relationships and archive references coherent", () => {
    const showcasePosts = expectArrayExport<PostLike>(
      showcaseBlog,
      "showcasePosts",
    );
    const showcaseAuthors = expectArrayExport<SlugRecord>(
      showcaseBlog,
      "showcaseAuthors",
    );
    const showcaseCategories = expectArrayExport<SlugRecord>(
      showcaseBlog,
      "showcaseCategories",
    );
    const showcaseTags = expectArrayExport<SlugRecord>(
      showcaseBlog,
      "showcaseTags",
    );
    const getAuthorPosts = expectFunctionExport<(slug: string) => PostLike[]>(
      showcaseBlog,
      "getAuthorPosts",
    );
    const getCategoryPosts = expectFunctionExport<(slug: string) => PostLike[]>(
      showcaseBlog,
      "getCategoryPosts",
    );
    const getTagPosts = expectFunctionExport<(slug: string) => PostLike[]>(
      showcaseBlog,
      "getTagPosts",
    );

    const postSlugs = new Set(showcasePosts.map((post) => post.slug));
    const authorSlugs = new Set(showcaseAuthors.map((author) => author.slug));
    const categorySlugs = new Set(
      showcaseCategories.map((category) => category.slug),
    );
    const tagSlugs = new Set(showcaseTags.map((tag) => tag.slug));

    expect(postSlugs.size).toBe(showcasePosts.length);
    expect(authorSlugs.size).toBe(showcaseAuthors.length);
    expect(categorySlugs.size).toBe(showcaseCategories.length);
    expect(tagSlugs.size).toBe(showcaseTags.length);

    for (const post of showcasePosts) {
      const authorSlug = getPostAuthorSlug(post);
      const categorySlug = getPostCategorySlug(post);
      const tagSlugsForPost = getPostTagSlugs(post);

      expect(authorSlug).toBeTruthy();
      expect(categorySlug).toBeTruthy();
      if (!authorSlug || !categorySlug) {
        throw new Error(`Post relationships missing for ${post.slug}.`);
      }
      expect(authorSlugs.has(authorSlug)).toBe(true);
      expect(categorySlugs.has(categorySlug)).toBe(true);
      expect(tagSlugsForPost.length).toBeGreaterThanOrEqual(2);
      expect(post.relatedSlugs?.length ?? 0).toBeGreaterThanOrEqual(2);

      for (const tagSlug of tagSlugsForPost) {
        expect(tagSlugs.has(tagSlug)).toBe(true);
      }

      for (const relatedSlug of post.relatedSlugs ?? []) {
        expect(relatedSlug).not.toBe(post.slug);
        expect(postSlugs.has(relatedSlug)).toBe(true);
      }
    }

    for (const author of showcaseAuthors) {
      const authorPosts = getAuthorPosts(author.slug);

      expect(authorPosts.length).toBeGreaterThan(0);
      for (const post of authorPosts) {
        expect(getPostAuthorSlug(post)).toBe(author.slug);
      }
    }

    for (const category of showcaseCategories) {
      const categoryPosts = getCategoryPosts(category.slug);

      expect(categoryPosts.length).toBeGreaterThan(0);
      for (const post of categoryPosts) {
        expect(getPostCategorySlug(post)).toBe(category.slug);
      }
    }

    for (const tag of showcaseTags) {
      const tagPosts = getTagPosts(tag.slug);

      expect(tagPosts.length).toBeGreaterThan(0);
      for (const post of tagPosts) {
        expect(getPostTagSlugs(post)).toContain(tag.slug);
      }
    }
  });
});
