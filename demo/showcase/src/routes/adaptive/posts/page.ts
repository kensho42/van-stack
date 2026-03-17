import { renderAdaptivePage } from "../../../route-helpers/adaptive";
import { createPostsIndexData } from "../../../runtime/data";

export default function page() {
  return renderAdaptivePage(createPostsIndexData("ssr"));
}
