import { renderGalleryChunkedPage } from "../../../../route-helpers/gallery";
import type { GalleryTagsIndexData } from "../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderGalleryChunkedPage(input.data as GalleryTagsIndexData);
}
