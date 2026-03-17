import {
  getAuthorPosts,
  getCategoryPosts,
  getFeaturedPosts,
  getHomepageCollections,
  getRelatedPosts,
  getShowcasePost,
  getTagPosts,
  requireShowcaseAuthor,
  requireShowcaseCategory,
  requireShowcaseTag,
  type ShowcaseAuthor,
  type ShowcaseCategory,
  type ShowcasePost,
  type ShowcaseTag,
  showcaseAuthors,
  showcaseCanonicalPostSlug,
  showcaseCategories,
  showcasePosts,
  showcaseTags,
} from "../content/blog";
import {
  getShowcaseMode,
  type ShowcaseLiveModeId,
  type ShowcaseMode,
  showcaseLiveModeIds,
} from "../content/modes";
import {
  readShowcaseInteractionState,
  readShowcaseSessionId,
  type ShowcaseInteractionState,
} from "./interactions";

export type GalleryAuthorSummary = {
  author: ShowcaseAuthor;
  postCount: number;
  latestPost: ShowcasePost | null;
};

export type GalleryCategorySummary = {
  category: ShowcaseCategory;
  postCount: number;
  latestPost: ShowcasePost | null;
};

export type GalleryTagSummary = {
  tag: ShowcaseTag;
  postCount: number;
  latestPost: ShowcasePost | null;
};

type GalleryBaseData = {
  mode: ShowcaseMode;
  path: string;
};

export type GalleryHomeData = GalleryBaseData & {
  pageType: "home";
  heroPost: ShowcasePost;
  featuredPosts: ShowcasePost[];
  recentPosts: ShowcasePost[];
  authors: GalleryAuthorSummary[];
  categories: GalleryCategorySummary[];
  tags: GalleryTagSummary[];
};

export type GalleryPostsIndexData = GalleryBaseData & {
  pageType: "posts-index";
  posts: ShowcasePost[];
  featuredPosts: ShowcasePost[];
};

export type GalleryPostData = GalleryBaseData & {
  pageType: "post-detail";
  post: ShowcasePost;
  related: ShowcasePost[];
  interactions?: ShowcaseInteractionState;
};

export type GalleryAuthorsIndexData = GalleryBaseData & {
  pageType: "authors-index";
  authors: GalleryAuthorSummary[];
};

export type GalleryAuthorData = GalleryBaseData & {
  pageType: "author-detail";
  author: ShowcaseAuthor;
  posts: ShowcasePost[];
};

export type GalleryCategoriesIndexData = GalleryBaseData & {
  pageType: "categories-index";
  categories: GalleryCategorySummary[];
};

export type GalleryCategoryData = GalleryBaseData & {
  pageType: "category-detail";
  category: ShowcaseCategory;
  posts: ShowcasePost[];
};

export type GalleryTagsIndexData = GalleryBaseData & {
  pageType: "tags-index";
  tags: GalleryTagSummary[];
};

export type GalleryTagData = GalleryBaseData & {
  pageType: "tag-detail";
  tag: ShowcaseTag;
  posts: ShowcasePost[];
};

export type GalleryPageData =
  | GalleryHomeData
  | GalleryPostsIndexData
  | GalleryPostData
  | GalleryAuthorsIndexData
  | GalleryAuthorData
  | GalleryCategoriesIndexData
  | GalleryCategoryData
  | GalleryTagsIndexData
  | GalleryTagData;

export type CustomApiPayload =
  | Pick<
      GalleryHomeData,
      | "heroPost"
      | "featuredPosts"
      | "recentPosts"
      | "authors"
      | "categories"
      | "tags"
    >
  | Pick<GalleryPostsIndexData, "posts" | "featuredPosts">
  | Pick<GalleryPostData, "post" | "related">
  | Pick<GalleryAuthorsIndexData, "authors">
  | Pick<GalleryAuthorData, "author" | "posts">
  | Pick<GalleryCategoriesIndexData, "categories">
  | Pick<GalleryCategoryData, "category" | "posts">
  | Pick<GalleryTagsIndexData, "tags">
  | Pick<GalleryTagData, "tag" | "posts">;

export class ShowcaseRouteNotFoundError extends Error {
  readonly status = 404;

  constructor(readonly pathname: string) {
    super(`Unknown showcase route: ${pathname}`);
  }
}

function isShowcaseLiveModeId(value: string): value is ShowcaseLiveModeId {
  return showcaseLiveModeIds.includes(value as ShowcaseLiveModeId);
}

function comparePosts(left: ShowcasePost, right: ShowcasePost) {
  return right.publishedOn.localeCompare(left.publishedOn);
}

function sortPosts(posts: ShowcasePost[]) {
  return [...posts].sort(comparePosts);
}

function createAuthorSummary(author: ShowcaseAuthor): GalleryAuthorSummary {
  const posts = sortPosts(getAuthorPosts(author.slug));

  return {
    author,
    postCount: posts.length,
    latestPost: posts[0] ?? null,
  };
}

function createCategorySummary(
  category: ShowcaseCategory,
): GalleryCategorySummary {
  const posts = sortPosts(getCategoryPosts(category.slug));

  return {
    category,
    postCount: posts.length,
    latestPost: posts[0] ?? null,
  };
}

function createTagSummary(tag: ShowcaseTag): GalleryTagSummary {
  const posts = sortPosts(getTagPosts(tag.slug));

  return {
    tag,
    postCount: posts.length,
    latestPost: posts[0] ?? null,
  };
}

function getMode(modeId: ShowcaseLiveModeId) {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  return mode;
}

function createPath(modeId: ShowcaseLiveModeId, suffix = "") {
  return suffix ? `/gallery/${modeId}/${suffix}` : `/gallery/${modeId}`;
}

function getCanonicalPost() {
  const canonicalPost = getShowcasePost(showcaseCanonicalPostSlug);
  const fallbackPost = showcasePosts[0];

  if (canonicalPost) {
    return canonicalPost;
  }
  if (fallbackPost) {
    return fallbackPost;
  }

  throw new Error("Showcase posts are unavailable.");
}

function getHomePayload() {
  const collections = getHomepageCollections();

  return {
    heroPost: getCanonicalPost(),
    featuredPosts: collections.featuredPosts,
    recentPosts: collections.recentPosts,
    authors: showcaseAuthors.map(createAuthorSummary),
    categories: showcaseCategories.map(createCategorySummary),
    tags: showcaseTags.map(createTagSummary),
  };
}

export function createGalleryHomeData(
  modeId: ShowcaseLiveModeId,
): GalleryHomeData {
  const payload = getHomePayload();

  return {
    pageType: "home",
    mode: getMode(modeId),
    path: createPath(modeId),
    ...payload,
  };
}

export function createPostsIndexData(
  modeId: ShowcaseLiveModeId,
): GalleryPostsIndexData {
  return {
    pageType: "posts-index",
    mode: getMode(modeId),
    path: createPath(modeId, "posts"),
    posts: sortPosts(showcasePosts),
    featuredPosts: getFeaturedPosts(3),
  };
}

export function createGalleryPostData(
  modeId: ShowcaseLiveModeId,
  slug: string,
  options?: {
    request?: Request;
  },
): GalleryPostData {
  const post = getShowcasePost(slug);
  if (!post) {
    throw new ShowcaseRouteNotFoundError(createPath(modeId, `posts/${slug}`));
  }

  const sessionId = options?.request
    ? readShowcaseSessionId(options.request)
    : null;

  return {
    pageType: "post-detail",
    mode: getMode(modeId),
    path: createPath(modeId, `posts/${slug}`),
    post,
    related: getRelatedPosts(post),
    interactions: sessionId
      ? readShowcaseInteractionState(sessionId, slug)
      : undefined,
  };
}

export function createAuthorsIndexData(
  modeId: ShowcaseLiveModeId,
): GalleryAuthorsIndexData {
  return {
    pageType: "authors-index",
    mode: getMode(modeId),
    path: createPath(modeId, "authors"),
    authors: showcaseAuthors.map(createAuthorSummary).sort((left, right) => {
      if (right.postCount !== left.postCount) {
        return right.postCount - left.postCount;
      }

      return left.author.name.localeCompare(right.author.name);
    }),
  };
}

export function createGalleryAuthorData(
  modeId: ShowcaseLiveModeId,
  slug: string,
): GalleryAuthorData {
  return {
    pageType: "author-detail",
    mode: getMode(modeId),
    path: createPath(modeId, `authors/${slug}`),
    author: requireShowcaseAuthor(slug),
    posts: sortPosts(getAuthorPosts(slug)),
  };
}

export function createCategoriesIndexData(
  modeId: ShowcaseLiveModeId,
): GalleryCategoriesIndexData {
  return {
    pageType: "categories-index",
    mode: getMode(modeId),
    path: createPath(modeId, "categories"),
    categories: showcaseCategories
      .map(createCategorySummary)
      .sort((left, right) => right.postCount - left.postCount),
  };
}

export function createGalleryCategoryData(
  modeId: ShowcaseLiveModeId,
  slug: string,
): GalleryCategoryData {
  return {
    pageType: "category-detail",
    mode: getMode(modeId),
    path: createPath(modeId, `categories/${slug}`),
    category: requireShowcaseCategory(slug),
    posts: sortPosts(getCategoryPosts(slug)),
  };
}

export function createTagsIndexData(
  modeId: ShowcaseLiveModeId,
): GalleryTagsIndexData {
  return {
    pageType: "tags-index",
    mode: getMode(modeId),
    path: createPath(modeId, "tags"),
    tags: showcaseTags
      .map(createTagSummary)
      .sort((left, right) => right.postCount - left.postCount),
  };
}

export function createGalleryTagData(
  modeId: ShowcaseLiveModeId,
  slug: string,
): GalleryTagData {
  return {
    pageType: "tag-detail",
    mode: getMode(modeId),
    path: createPath(modeId, `tags/${slug}`),
    tag: requireShowcaseTag(slug),
    posts: sortPosts(getTagPosts(slug)),
  };
}

export function createGalleryPageData(
  modeId: ShowcaseLiveModeId,
  pathname: string,
  options?: {
    request?: Request;
  },
): GalleryPageData {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] !== "gallery" || segments[1] !== modeId) {
    throw new ShowcaseRouteNotFoundError(pathname);
  }

  if (segments.length === 2) {
    return createGalleryHomeData(modeId);
  }

  const collection = segments[2];
  const slug = segments[3];

  switch (collection) {
    case "posts":
      return slug
        ? createGalleryPostData(modeId, slug, options)
        : createPostsIndexData(modeId);
    case "authors":
      return slug
        ? createGalleryAuthorData(modeId, slug)
        : createAuthorsIndexData(modeId);
    case "categories":
      return slug
        ? createGalleryCategoryData(modeId, slug)
        : createCategoriesIndexData(modeId);
    case "tags":
      return slug
        ? createGalleryTagData(modeId, slug)
        : createTagsIndexData(modeId);
    default:
      throw new ShowcaseRouteNotFoundError(pathname);
  }
}

export function createGalleryPageDataFromPath(
  pathname: string,
  options?: {
    request?: Request;
  },
) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);
  const modeId = segments[1];

  if (segments[0] !== "gallery" || !modeId || !isShowcaseLiveModeId(modeId)) {
    throw new ShowcaseRouteNotFoundError(pathname);
  }

  return createGalleryPageData(modeId, pathname, options);
}

export function createShowcaseEntries() {
  return showcasePosts.map((post) => ({ slug: post.slug }));
}

export function createShowcaseAuthorEntries() {
  return showcaseAuthors.map((author) => ({ slug: author.slug }));
}

export function createShowcaseCategoryEntries() {
  return showcaseCategories.map((category) => ({ slug: category.slug }));
}

export function createShowcaseTagEntries() {
  return showcaseTags.map((tag) => ({ slug: tag.slug }));
}

export function resolveCustomApiPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] !== "gallery" || segments[1] !== "custom") {
    throw new ShowcaseRouteNotFoundError(pathname);
  }

  if (segments.length === 2) {
    return "/api/showcase/home";
  }

  const collection = segments[2];
  const slug = segments[3];

  switch (collection) {
    case "posts":
    case "authors":
    case "categories":
    case "tags":
      return slug
        ? `/api/showcase/${collection}/${slug}`
        : `/api/showcase/${collection}`;
    default:
      throw new ShowcaseRouteNotFoundError(pathname);
  }
}

export function createCustomApiPayload(pathname: string): CustomApiPayload {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] !== "api" || segments[1] !== "showcase") {
    throw new ShowcaseRouteNotFoundError(pathname);
  }

  if (
    segments.length === 2 ||
    (segments.length === 3 && segments[2] === "home")
  ) {
    return getHomePayload();
  }

  const collection = segments[2];
  const slug = segments[3];

  switch (collection) {
    case "posts":
      return slug
        ? createGalleryPostData("custom", slug)
        : createPostsIndexData("custom");
    case "authors":
      return slug
        ? createGalleryAuthorData("custom", slug)
        : createAuthorsIndexData("custom");
    case "categories":
      return slug
        ? createGalleryCategoryData("custom", slug)
        : createCategoriesIndexData("custom");
    case "tags":
      return slug
        ? createGalleryTagData("custom", slug)
        : createTagsIndexData("custom");
    default:
      throw new ShowcaseRouteNotFoundError(pathname);
  }
}

export function createCustomGalleryPageData(
  pathname: string,
  payload: CustomApiPayload,
): GalleryPageData {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] !== "gallery" || segments[1] !== "custom") {
    throw new ShowcaseRouteNotFoundError(pathname);
  }

  const mode = getMode("custom");

  if (segments.length === 2) {
    const home = payload as GalleryHomeData;
    return {
      pageType: "home",
      mode,
      path: "/gallery/custom",
      heroPost: home.heroPost,
      featuredPosts: home.featuredPosts,
      recentPosts: home.recentPosts,
      authors: home.authors,
      categories: home.categories,
      tags: home.tags,
    };
  }

  const path = normalized;

  switch (segments[2]) {
    case "posts":
      return segments[3]
        ? {
            pageType: "post-detail",
            mode,
            path,
            post: (payload as GalleryPostData).post,
            related: (payload as GalleryPostData).related,
          }
        : {
            pageType: "posts-index",
            mode,
            path,
            posts: (payload as GalleryPostsIndexData).posts,
            featuredPosts: (payload as GalleryPostsIndexData).featuredPosts,
          };
    case "authors":
      return segments[3]
        ? {
            pageType: "author-detail",
            mode,
            path,
            author: (payload as GalleryAuthorData).author,
            posts: (payload as GalleryAuthorData).posts,
          }
        : {
            pageType: "authors-index",
            mode,
            path,
            authors: (payload as GalleryAuthorsIndexData).authors,
          };
    case "categories":
      return segments[3]
        ? {
            pageType: "category-detail",
            mode,
            path,
            category: (payload as GalleryCategoryData).category,
            posts: (payload as GalleryCategoryData).posts,
          }
        : {
            pageType: "categories-index",
            mode,
            path,
            categories: (payload as GalleryCategoriesIndexData).categories,
          };
    case "tags":
      return segments[3]
        ? {
            pageType: "tag-detail",
            mode,
            path,
            tag: (payload as GalleryTagData).tag,
            posts: (payload as GalleryTagData).posts,
          }
        : {
            pageType: "tags-index",
            mode,
            path,
            tags: (payload as GalleryTagsIndexData).tags,
          };
    default:
      throw new ShowcaseRouteNotFoundError(pathname);
  }
}
