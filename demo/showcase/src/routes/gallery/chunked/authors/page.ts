import { renderGalleryChunkedPage } from "../../../../route-helpers/gallery";
import { createAuthorsIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryChunkedPage(createAuthorsIndexData("chunked"));
}
