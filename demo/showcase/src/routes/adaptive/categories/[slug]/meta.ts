import { createAdaptiveCategoryMeta } from "../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createAdaptiveCategoryMeta(input.params.slug, input.data);
}
