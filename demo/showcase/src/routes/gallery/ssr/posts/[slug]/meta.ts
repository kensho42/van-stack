import { createPostMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createPostMeta("ssr", input.params.slug);
}
