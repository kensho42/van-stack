import { renderGalleryPage } from "../../../../route-helpers/gallery";
import { createPostsIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryPage(createPostsIndexData("chunked"));
}
