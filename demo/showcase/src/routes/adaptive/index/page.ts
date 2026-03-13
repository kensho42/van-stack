import { renderAdaptivePage } from "../../../route-helpers/adaptive";
import { createGalleryHomeData } from "../../../runtime/data";

export default function page() {
  return renderAdaptivePage(createGalleryHomeData("ssr"));
}
