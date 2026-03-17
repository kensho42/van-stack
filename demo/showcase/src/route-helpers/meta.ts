import type { RouteMeta } from "van-stack";

import { getShowcaseMode, type ShowcaseModeId } from "../content/modes";

function getMode(modeId: ShowcaseModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return mode;
}

function createMeta(
  title: string,
  description: string,
  canonical: string,
): RouteMeta {
  return {
    title,
    description,
    canonical,
    openGraph: {
      title,
      description,
    },
  };
}

function slugToLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readPost(data: unknown) {
  const payload = readObject(data);
  if (!payload || readString(payload.pageType) !== "post-detail") {
    return null;
  }

  const post = readObject(payload.post);
  if (!post) {
    return null;
  }

  return {
    slug: readString(post.slug),
    summary: readString(post.summary),
    title: readString(post.title),
  };
}

function readAuthor(data: unknown) {
  const payload = readObject(data);
  if (!payload || readString(payload.pageType) !== "author-detail") {
    return null;
  }

  const author = readObject(payload.author);
  if (!author) {
    return null;
  }

  return {
    bio: readString(author.bio),
    name: readString(author.name),
    slug: readString(author.slug),
  };
}

function readCategory(data: unknown) {
  const payload = readObject(data);
  if (!payload || readString(payload.pageType) !== "category-detail") {
    return null;
  }

  const category = readObject(payload.category);
  if (!category) {
    return null;
  }

  return {
    description: readString(category.description),
    name: readString(category.name),
    slug: readString(category.slug),
  };
}

function readTag(data: unknown) {
  const payload = readObject(data);
  if (!payload || readString(payload.pageType) !== "tag-detail") {
    return null;
  }

  const tag = readObject(payload.tag);
  if (!tag) {
    return null;
  }

  return {
    description: readString(tag.description),
    name: readString(tag.name),
    slug: readString(tag.slug),
  };
}

export function createLandingMeta() {
  return createMeta(
    "Northstar Journal Showcase · van-stack",
    "Evaluator-first showcase for one shared blog app across runtime gallery, guided walkthrough, and adaptive stack tracks.",
    "/",
  );
}

export function createGalleryOverviewMeta() {
  return createMeta(
    "Runtime Gallery · Northstar Journal",
    "Compare the same Northstar Journal publication graph across every supported delivery contract.",
    "/gallery",
  );
}

export function createWalkthroughOverviewMeta() {
  return createMeta(
    "Guided Walkthrough · Northstar Journal",
    "Evaluator walkthrough pages for each Northstar Journal runtime mode.",
    "/walkthrough",
  );
}

export function createAdaptiveOverviewMeta() {
  return createMeta(
    "Adaptive Navigation · Northstar Journal",
    "Inspect the shared Northstar Journal blog graph through a stack-oriented adaptive navigation track.",
    "/adaptive",
  );
}

export function createWalkthroughModeMeta(modeId: ShowcaseModeId) {
  const mode = getMode(modeId);

  return createMeta(
    `${mode.title} Walkthrough · Northstar Journal`,
    mode.proves,
    `/walkthrough/${mode.id}`,
  );
}

export function createGalleryHomeMeta(modeId: ShowcaseModeId) {
  const mode = getMode(modeId);

  return createMeta(
    `${mode.title} Gallery · Northstar Journal`,
    mode.summary,
    `/gallery/${mode.id}`,
  );
}

export function createPostsIndexMeta(modeId: ShowcaseModeId) {
  const mode = getMode(modeId);

  return createMeta(
    `All Posts · ${mode.title} · Northstar Journal`,
    "Browse the full editorial archive for Northstar Journal in one delivery mode.",
    `/gallery/${mode.id}/posts`,
  );
}

export function createPostMeta(
  modeId: ShowcaseModeId,
  slug: string,
  data?: unknown,
) {
  const mode = getMode(modeId);
  const post = readPost(data);
  const resolvedSlug = post?.slug ?? slug;
  const title = post?.title ?? slugToLabel(slug);
  const description =
    post?.summary ?? "Read this Northstar Journal story in the selected mode.";

  return createMeta(
    `${title} · ${mode.title} · Northstar Journal`,
    description,
    `/gallery/${mode.id}/posts/${resolvedSlug}`,
  );
}

export function createAuthorsIndexMeta(modeId: ShowcaseModeId) {
  const mode = getMode(modeId);

  return createMeta(
    `Authors · ${mode.title} · Northstar Journal`,
    "Browse recurring contributors and compare author archives across runtime modes.",
    `/gallery/${mode.id}/authors`,
  );
}

export function createAuthorMeta(
  modeId: ShowcaseModeId,
  slug: string,
  data?: unknown,
) {
  const mode = getMode(modeId);
  const author = readAuthor(data);
  const resolvedSlug = author?.slug ?? slug;
  const title = author?.name ?? slugToLabel(slug);
  const description =
    author?.bio ??
    "Browse this contributor archive in the selected Northstar Journal mode.";

  return createMeta(
    `${title} · ${mode.title} · Northstar Journal`,
    description,
    `/gallery/${mode.id}/authors/${resolvedSlug}`,
  );
}

export function createCategoriesIndexMeta(modeId: ShowcaseModeId) {
  const mode = getMode(modeId);

  return createMeta(
    `Categories · ${mode.title} · Northstar Journal`,
    "Compare category archive behavior across the full showcase route surface.",
    `/gallery/${mode.id}/categories`,
  );
}

export function createCategoryMeta(
  modeId: ShowcaseModeId,
  slug: string,
  data?: unknown,
) {
  const mode = getMode(modeId);
  const category = readCategory(data);
  const resolvedSlug = category?.slug ?? slug;
  const title = category?.name ?? slugToLabel(slug);
  const description =
    category?.description ??
    "Browse this editorial desk archive in the selected Northstar Journal mode.";

  return createMeta(
    `${title} · ${mode.title} · Northstar Journal`,
    description,
    `/gallery/${mode.id}/categories/${resolvedSlug}`,
  );
}

export function createTagsIndexMeta(modeId: ShowcaseModeId) {
  const mode = getMode(modeId);

  return createMeta(
    `Tags · ${mode.title} · Northstar Journal`,
    "Inspect cross-cutting tags and compare archive richness across delivery modes.",
    `/gallery/${mode.id}/tags`,
  );
}

export function createTagMeta(
  modeId: ShowcaseModeId,
  slug: string,
  data?: unknown,
) {
  const mode = getMode(modeId);
  const tag = readTag(data);
  const resolvedSlug = tag?.slug ?? slug;
  const title = tag?.name ?? slugToLabel(slug);
  const description =
    tag?.description ??
    "Browse this cross-cutting topic archive in the selected Northstar Journal mode.";

  return createMeta(
    `${title} · ${mode.title} · Northstar Journal`,
    description,
    `/gallery/${mode.id}/tags/${resolvedSlug}`,
  );
}

export function createAdaptiveHomeMeta() {
  return createMeta(
    "Adaptive Stack · Northstar Journal",
    "Browse the shared Northstar Journal graph through the adaptive stack track.",
    "/adaptive",
  );
}

export function createAdaptivePostsIndexMeta() {
  return createMeta(
    "All Posts · Adaptive Stack · Northstar Journal",
    "Browse the Northstar Journal post archive through the adaptive stack track.",
    "/adaptive/posts",
  );
}

export function createAdaptivePostMeta(slug: string, data?: unknown) {
  const post = readPost(data);
  const resolvedSlug = post?.slug ?? slug;
  const title = post?.title ?? slugToLabel(slug);
  const description =
    post?.summary ??
    "Read this Northstar Journal story in adaptive stack mode.";

  return createMeta(
    `${title} · Adaptive Stack · Northstar Journal`,
    description,
    `/adaptive/posts/${resolvedSlug}`,
  );
}

export function createAdaptiveAuthorsIndexMeta() {
  return createMeta(
    "Authors · Adaptive Stack · Northstar Journal",
    "Browse contributor archives through the adaptive stack track.",
    "/adaptive/authors",
  );
}

export function createAdaptiveAuthorMeta(slug: string, data?: unknown) {
  const author = readAuthor(data);
  const resolvedSlug = author?.slug ?? slug;
  const title = author?.name ?? slugToLabel(slug);
  const description =
    author?.bio ?? "Browse this contributor archive in adaptive stack mode.";

  return createMeta(
    `${title} · Adaptive Stack · Northstar Journal`,
    description,
    `/adaptive/authors/${resolvedSlug}`,
  );
}

export function createAdaptiveCategoriesIndexMeta() {
  return createMeta(
    "Categories · Adaptive Stack · Northstar Journal",
    "Browse editorial desks through the adaptive stack track.",
    "/adaptive/categories",
  );
}

export function createAdaptiveCategoryMeta(slug: string, data?: unknown) {
  const category = readCategory(data);
  const resolvedSlug = category?.slug ?? slug;
  const title = category?.name ?? slugToLabel(slug);
  const description =
    category?.description ??
    "Browse this editorial desk archive in adaptive stack mode.";

  return createMeta(
    `${title} · Adaptive Stack · Northstar Journal`,
    description,
    `/adaptive/categories/${resolvedSlug}`,
  );
}

export function createAdaptiveTagsIndexMeta() {
  return createMeta(
    "Tags · Adaptive Stack · Northstar Journal",
    "Browse cross-cutting topic archives through the adaptive stack track.",
    "/adaptive/tags",
  );
}

export function createAdaptiveTagMeta(slug: string, data?: unknown) {
  const tag = readTag(data);
  const resolvedSlug = tag?.slug ?? slug;
  const title = tag?.name ?? slugToLabel(slug);
  const description =
    tag?.description ?? "Browse this topic archive in adaptive stack mode.";

  return createMeta(
    `${title} · Adaptive Stack · Northstar Journal`,
    description,
    `/adaptive/tags/${resolvedSlug}`,
  );
}
