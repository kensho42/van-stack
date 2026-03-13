import { renderGalleryPage } from "../../../../route-helpers/gallery";
import { createAuthorsIndexData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryPage(createAuthorsIndexData("islands"));
}
