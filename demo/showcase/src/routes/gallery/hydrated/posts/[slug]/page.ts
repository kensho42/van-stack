import { renderGalleryPage } from "../../../../../route-helpers/gallery";
import type { GalleryPostData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  const data = input.data as GalleryPostData;
  return renderGalleryPage(data);
}
