import { renderGalleryPage } from "../../../../route-helpers/gallery";
import { createCategoriesIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryPage(createCategoriesIndexData("hydrated"));
}
