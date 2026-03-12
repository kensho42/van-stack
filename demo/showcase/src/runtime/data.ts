import {
  getRelatedPosts,
  getShowcasePost,
  showcasePosts,
  type ShowcasePost,
} from "../content/blog";
import {
  getShowcaseMode,
  type ShowcaseMode,
  type ShowcaseModeId,
} from "../content/modes";

export type GalleryPostData = {
  mode: ShowcaseMode;
  post: ShowcasePost;
  related: ShowcasePost[];
};

export function createGalleryPostData(
  modeId: ShowcaseModeId,
  slug: string,
): GalleryPostData {
  const mode = getShowcaseMode(modeId);
  if (!mode) {
    throw new Error(`Unknown showcase mode: ${modeId}`);
  }

  const post = getShowcasePost(slug);
  if (!post) {
    throw new Error(`Unknown showcase post: ${slug}`);
  }

  return {
    mode,
    post,
    related: getRelatedPosts(post),
  };
}

export function createShowcaseEntries() {
  return showcasePosts.map((post) => ({ slug: post.slug }));
}
