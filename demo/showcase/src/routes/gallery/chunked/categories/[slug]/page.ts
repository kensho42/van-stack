import { renderGalleryPage } from "../../../../../route-helpers/gallery";
import type { GalleryCategoryData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderGalleryPage(input.data as GalleryCategoryData);
}
