import { getShowcaseMode } from "../content/modes";
import type {
  CustomApiPayload,
  GalleryAuthorData,
  GalleryAuthorsIndexData,
  GalleryCategoriesIndexData,
  GalleryCategoryData,
  GalleryHomeData,
  GalleryPageData,
  GalleryPostData,
  GalleryPostsIndexData,
  GalleryTagData,
  GalleryTagsIndexData,
} from "../runtime/data";

function getCustomMode() {
  const mode = getShowcaseMode("custom");
  if (!mode) {
    throw new Error("Unknown showcase mode: custom");
  }

  return mode;
}

export function resolveCustomApiPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] !== "gallery" || segments[1] !== "custom") {
    throw new Error(`Unknown showcase route: ${pathname}`);
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
      throw new Error(`Unknown showcase route: ${pathname}`);
  }
}

export function createCustomGalleryPageData(
  pathname: string,
  payload: CustomApiPayload,
): GalleryPageData {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] !== "gallery" || segments[1] !== "custom") {
    throw new Error(`Unknown showcase route: ${pathname}`);
  }

  const mode = getCustomMode();

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
      throw new Error(`Unknown showcase route: ${pathname}`);
  }
}

export async function fetchCustomPageData(path: string) {
  const response = await fetch(resolveCustomApiPath(path));
  if (!response.ok) {
    throw new Error(
      `Custom showcase API failed for ${path}: ${response.status}`,
    );
  }

  return createCustomGalleryPageData(
    path,
    (await response.json()) as CustomApiPayload,
  );
}
