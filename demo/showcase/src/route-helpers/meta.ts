import type { RouteMeta } from "van-stack";

import {
  requireShowcaseAuthor,
  requireShowcaseCategory,
  requireShowcasePost,
  requireShowcaseTag,
} from "../content/blog";
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

export function createPostMeta(modeId: ShowcaseModeId, slug: string) {
  const mode = getMode(modeId);
  const post = requireShowcasePost(slug);

  return createMeta(
    `${post.title} · ${mode.title} · Northstar Journal`,
    post.summary,
    `/gallery/${mode.id}/posts/${post.slug}`,
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

export function createAuthorMeta(modeId: ShowcaseModeId, slug: string) {
  const mode = getMode(modeId);
  const author = requireShowcaseAuthor(slug);

  return createMeta(
    `${author.name} · ${mode.title} · Northstar Journal`,
    author.bio,
    `/gallery/${mode.id}/authors/${author.slug}`,
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

export function createCategoryMeta(modeId: ShowcaseModeId, slug: string) {
  const mode = getMode(modeId);
  const category = requireShowcaseCategory(slug);

  return createMeta(
    `${category.name} · ${mode.title} · Northstar Journal`,
    category.description,
    `/gallery/${mode.id}/categories/${category.slug}`,
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

export function createTagMeta(modeId: ShowcaseModeId, slug: string) {
  const mode = getMode(modeId);
  const tag = requireShowcaseTag(slug);

  return createMeta(
    `${tag.name} · ${mode.title} · Northstar Journal`,
    tag.description,
    `/gallery/${mode.id}/tags/${tag.slug}`,
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

export function createAdaptivePostMeta(slug: string) {
  const post = requireShowcasePost(slug);

  return createMeta(
    `${post.title} · Adaptive Stack · Northstar Journal`,
    post.summary,
    `/adaptive/posts/${post.slug}`,
  );
}

export function createAdaptiveAuthorsIndexMeta() {
  return createMeta(
    "Authors · Adaptive Stack · Northstar Journal",
    "Browse contributor archives through the adaptive stack track.",
    "/adaptive/authors",
  );
}

export function createAdaptiveAuthorMeta(slug: string) {
  const author = requireShowcaseAuthor(slug);

  return createMeta(
    `${author.name} · Adaptive Stack · Northstar Journal`,
    author.bio,
    `/adaptive/authors/${author.slug}`,
  );
}

export function createAdaptiveCategoriesIndexMeta() {
  return createMeta(
    "Categories · Adaptive Stack · Northstar Journal",
    "Browse editorial desks through the adaptive stack track.",
    "/adaptive/categories",
  );
}

export function createAdaptiveCategoryMeta(slug: string) {
  const category = requireShowcaseCategory(slug);

  return createMeta(
    `${category.name} · Adaptive Stack · Northstar Journal`,
    category.description,
    `/adaptive/categories/${category.slug}`,
  );
}

export function createAdaptiveTagsIndexMeta() {
  return createMeta(
    "Tags · Adaptive Stack · Northstar Journal",
    "Browse cross-cutting topic archives through the adaptive stack track.",
    "/adaptive/tags",
  );
}

export function createAdaptiveTagMeta(slug: string) {
  const tag = requireShowcaseTag(slug);

  return createMeta(
    `${tag.name} · Adaptive Stack · Northstar Journal`,
    tag.description,
    `/adaptive/tags/${tag.slug}`,
  );
}
