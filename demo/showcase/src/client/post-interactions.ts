import {
  type CreateShowcasePostInteractionBindingOptions,
  createShowcasePostInteractionBinding,
} from "../post-interactions";
import type { GalleryPageData } from "../runtime/data";

export type MountShowcasePostInteractionsOptions = {
  fetch?: CreateShowcasePostInteractionBindingOptions["fetch"];
};

export async function mountShowcasePostInteractions(
  root: unknown,
  data: GalleryPageData,
  options?: MountShowcasePostInteractionsOptions,
) {
  const binding = createShowcasePostInteractionBinding(data, options);
  if (!binding) {
    return false;
  }

  const { hydrateLikeCounter } = await import("../components/like-counter");
  const { hydrateBookmarkToggle } = await import(
    "../components/bookmark-toggle"
  );
  const likeHydrated = await hydrateLikeCounter(root, binding);
  const bookmarkHydrated = await hydrateBookmarkToggle(root, binding);

  return likeHydrated && bookmarkHydrated;
}
