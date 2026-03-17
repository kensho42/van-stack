import { renderGalleryPage } from "../../../../route-helpers/gallery";
import { createTagsIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryPage(createTagsIndexData("ssr"));
}
