import { renderGalleryChunkedPage } from "../../../../route-helpers/gallery";
import { createPostsIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryChunkedPage(createPostsIndexData("chunked"));
}
