import { createAuthorMeta } from "../../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createAuthorMeta("ssg", input.params.slug, input.data);
}
