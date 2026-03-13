import { renderGalleryPage } from "../../../../route-helpers/gallery";
import { createGalleryHomeData } from "../../../../runtime/data";

export default function page() {
  return renderGalleryPage(createGalleryHomeData("ssg"));
}
