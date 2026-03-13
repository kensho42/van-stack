import { createAdaptiveCategoryMeta } from "../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createAdaptiveCategoryMeta(input.params.slug);
}
