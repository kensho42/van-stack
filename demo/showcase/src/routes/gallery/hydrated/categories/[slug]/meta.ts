import { createCategoryMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createCategoryMeta("hydrated", input.params.slug);
}
