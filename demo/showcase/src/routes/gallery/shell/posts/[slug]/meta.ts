import { createPostMeta } from "../../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createPostMeta("shell", input.params.slug, input.data);
}
