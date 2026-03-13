import { renderAdaptivePage } from "../../../route-helpers/adaptive";
import { createAuthorsIndexData } from "../../../runtime/data";

export default function page() {
  return renderAdaptivePage(createAuthorsIndexData("ssr"));
}
