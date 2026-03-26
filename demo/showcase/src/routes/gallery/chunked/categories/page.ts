import { renderGalleryChunkedPage } from "../../../../route-helpers/gallery";
import { createCategoriesIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryChunkedPage(createCategoriesIndexData("chunked"));
}
