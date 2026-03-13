import { renderAdaptivePage } from "../../../route-helpers/adaptive";
import { createTagsIndexData } from "../../../runtime/data";

export default function page() {
  return renderAdaptivePage(createTagsIndexData("ssr"));
}
