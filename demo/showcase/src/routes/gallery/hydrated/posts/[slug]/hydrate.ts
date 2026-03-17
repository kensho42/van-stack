import type { RouteHydrateInput } from "van-stack/csr";
import { mountShowcasePostInteractions } from "../../../../../client/post-interactions";
import type { GalleryPageData } from "../../../../../runtime/data";

export default function hydrate(input: RouteHydrateInput) {
  return mountShowcasePostInteractions(
    input.root,
    input.data as GalleryPageData,
  );
}
