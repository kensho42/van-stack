import { renderGalleryChunkedPage } from "../../../../route-helpers/gallery";
import { createGalleryHomeData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryChunkedPage(createGalleryHomeData("chunked"));
}
