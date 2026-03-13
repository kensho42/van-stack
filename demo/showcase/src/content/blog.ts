import {
  type ShowcaseAuthorSeed,
  type ShowcaseCategorySeed,
  type ShowcasePostSeed,
  type ShowcaseTagSeed,
  showcaseAuthorCatalog,
  showcaseCategoryCatalog,
  showcasePostCatalog,
  showcasePublication,
  showcaseTagCatalog,
} from "./catalog";

export { showcasePublication };

export const showcaseCanonicalPostSlug = "runtime-gallery-tour";

export type ShowcaseAuthor = ShowcaseAuthorSeed;

export type ShowcaseCategory = ShowcaseCategorySeed;

export type ShowcaseTag = ShowcaseTagSeed;

export type ShowcaseArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type ShowcasePost = Omit<
  ShowcasePostSeed,
  "authorSlug" | "categorySlug" | "tagSlugs"
> & {
  authorSlug: string;
  author: ShowcaseAuthor;
  primaryCategorySlug: string;
  primaryCategory: ShowcaseCategory;
  category: string;
  categorySlug: string;
  tagSlugs: string[];
  tags: ShowcaseTag[];
  sections: ShowcaseArticleSection[];
  relatedSlugs: string[];
};

export type ShowcaseEntityKind = "post" | "author" | "category" | "tag";

export class ShowcaseNotFoundError extends Error {
  readonly status = 404;

  constructor(
    readonly kind: ShowcaseEntityKind,
    readonly slug: string,
  ) {
    super(`Unknown showcase ${kind}: ${slug}`);
  }
}

const authorBySlug = new Map(
  showcaseAuthorCatalog.map((author) => [author.slug, author]),
);
const categoryBySlug = new Map(
  showcaseCategoryCatalog.map((category) => [category.slug, category]),
);
const tagBySlug = new Map(showcaseTagCatalog.map((tag) => [tag.slug, tag]));
const postSeedBySlug = new Map(
  showcasePostCatalog.map((post) => [post.slug, post]),
);

function buildPostSections(
  seed: ShowcasePostSeed,
  author: ShowcaseAuthor,
  category: ShowcaseCategory,
  tags: ShowcaseTag[],
): ShowcaseArticleSection[] {
  const [firstHeading, secondHeading] = seed.outline;
  const [leadTag, supportTag] = tags;

  return [
    {
      heading: firstHeading,
      paragraphs: [seed.summary, seed.excerpt],
    },
    {
      heading: secondHeading,
      paragraphs: [
        seed.heroNote,
        `${author.name} frames this story through ${category.name.toLowerCase()} with ${leadTag?.name.toLowerCase() ?? "shared"} and ${supportTag?.name.toLowerCase() ?? "editorial"} signals so the same article keeps its meaning on homepage, archive, and comparison routes.`,
      ],
    },
  ];
}

function getRelatedCandidates(seed: ShowcasePostSeed) {
  return showcasePostCatalog
    .filter((candidate) => candidate.slug !== seed.slug)
    .map((candidate) => {
      const sharedTags = candidate.tagSlugs.filter((tag) =>
        seed.tagSlugs.includes(tag),
      ).length;
      const sharedCategory =
        candidate.categorySlug === seed.categorySlug ? 2 : 0;
      const sharedAuthor = candidate.authorSlug === seed.authorSlug ? 1 : 0;
      const score = sharedTags * 3 + sharedCategory + sharedAuthor;

      return {
        candidate,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.candidate.publishedOn.localeCompare(
        left.candidate.publishedOn,
      );
    })
    .slice(0, 3)
    .map((entry) => entry.candidate.slug);
}

function buildShowcasePost(seed: ShowcasePostSeed): ShowcasePost {
  const author = authorBySlug.get(seed.authorSlug);
  const category = categoryBySlug.get(seed.categorySlug);
  const tags = seed.tagSlugs
    .map((slug) => tagBySlug.get(slug))
    .filter((tag): tag is ShowcaseTag => tag !== undefined);

  if (!author) {
    throw new Error(`Missing showcase author: ${seed.authorSlug}`);
  }
  if (!category) {
    throw new Error(`Missing showcase category: ${seed.categorySlug}`);
  }
  if (tags.length !== seed.tagSlugs.length) {
    throw new Error(`Missing showcase tag for post: ${seed.slug}`);
  }

  return {
    ...seed,
    author,
    primaryCategory: category,
    primaryCategorySlug: category.slug,
    category: category.name,
    categorySlug: category.slug,
    tags,
    sections: buildPostSections(seed, author, category, tags),
    relatedSlugs: getRelatedCandidates(seed),
  };
}

export const showcaseAuthors = [...showcaseAuthorCatalog];
export const showcaseCategories = [...showcaseCategoryCatalog];
export const showcaseTags = [...showcaseTagCatalog];
export const showcasePosts = showcasePostCatalog.map(buildShowcasePost);

const postBySlug = new Map(showcasePosts.map((post) => [post.slug, post]));

export function createShowcaseNotFoundError(
  kind: ShowcaseEntityKind,
  slug: string,
) {
  return new ShowcaseNotFoundError(kind, slug);
}

export function isShowcaseNotFoundError(
  error: unknown,
): error is ShowcaseNotFoundError {
  return error instanceof ShowcaseNotFoundError;
}

export function getShowcasePost(slug: string) {
  return postBySlug.get(slug);
}

export function requireShowcasePost(slug: string) {
  return (
    getShowcasePost(slug) ??
    (() => {
      throw createShowcaseNotFoundError("post", slug);
    })()
  );
}

export function getShowcaseAuthor(slug: string) {
  return authorBySlug.get(slug);
}

export function requireShowcaseAuthor(slug: string) {
  return (
    getShowcaseAuthor(slug) ??
    (() => {
      throw createShowcaseNotFoundError("author", slug);
    })()
  );
}

export function getShowcaseCategory(slug: string) {
  return categoryBySlug.get(slug);
}

export function requireShowcaseCategory(slug: string) {
  return (
    getShowcaseCategory(slug) ??
    (() => {
      throw createShowcaseNotFoundError("category", slug);
    })()
  );
}

export function getShowcaseTag(slug: string) {
  return tagBySlug.get(slug);
}

export function requireShowcaseTag(slug: string) {
  return (
    getShowcaseTag(slug) ??
    (() => {
      throw createShowcaseNotFoundError("tag", slug);
    })()
  );
}

export function getAuthorPosts(slug: string) {
  return showcasePosts.filter((post) => post.authorSlug === slug);
}

export function getCategoryPosts(slug: string) {
  return showcasePosts.filter((post) => post.primaryCategorySlug === slug);
}

export function getTagPosts(slug: string) {
  return showcasePosts.filter((post) => post.tagSlugs.includes(slug));
}

export function getRelatedPosts(post: ShowcasePost, limit = 3): ShowcasePost[] {
  return post.relatedSlugs
    .map((slug) => getShowcasePost(slug))
    .filter((candidate): candidate is ShowcasePost => candidate !== undefined)
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, limit);
}

export function getRecentPosts(limit = showcasePosts.length) {
  return showcasePosts.slice(0, limit);
}

export function getFeaturedPosts(limit = 4) {
  return [
    requireShowcasePost(showcaseCanonicalPostSlug),
    ...showcasePosts.filter((post) => post.slug !== showcaseCanonicalPostSlug),
  ].slice(0, limit);
}

export function getHomepageCollections() {
  return {
    featuredPosts: getFeaturedPosts(4),
    recentPosts: getRecentPosts(6),
    featuredAuthors: showcaseAuthors.slice(0, 4),
    featuredCategories: showcaseCategories.slice(0, 4),
    featuredTags: showcaseTags.slice(0, 6),
  };
}

export function getShowcasePostSeed(slug: string) {
  return postSeedBySlug.get(slug);
}
