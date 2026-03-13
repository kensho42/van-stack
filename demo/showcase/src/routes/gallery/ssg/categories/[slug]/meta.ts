import { createCategoryMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createCategoryMeta("ssg", input.params.slug);
}
