import { createCategoryMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createCategoryMeta("custom", input.params.slug);
}
