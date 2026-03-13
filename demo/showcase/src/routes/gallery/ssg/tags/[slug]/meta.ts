import { createTagMeta } from "../../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createTagMeta("ssg", input.params.slug, input.data);
}
