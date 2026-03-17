import { renderAdaptivePage } from "../../../route-helpers/adaptive";
import { createCategoriesIndexData } from "../../../runtime/data";

export default function page() {
  return renderAdaptivePage(createCategoriesIndexData("ssr"));
}
