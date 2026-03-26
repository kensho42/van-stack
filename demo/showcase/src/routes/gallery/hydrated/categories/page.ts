import { renderGalleryPage } from "../../../../route-helpers/gallery";
import type { GalleryPageData } from "../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderGalleryPage(input.data as GalleryPageData);
}
