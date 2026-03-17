import { createCategoryMeta } from "../../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createCategoryMeta("custom", input.params.slug, input.data);
}
