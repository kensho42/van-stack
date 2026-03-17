import { renderAdaptivePage } from "../../../../route-helpers/adaptive";
import type { GalleryPageData } from "../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderAdaptivePage(input.data as GalleryPageData);
}
