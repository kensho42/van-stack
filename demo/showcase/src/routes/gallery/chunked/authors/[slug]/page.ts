import { renderGalleryChunkedPage } from "../../../../../route-helpers/gallery";
import type { GalleryAuthorData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderGalleryChunkedPage(input.data as GalleryAuthorData);
}
