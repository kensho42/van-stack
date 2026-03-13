import { createTagMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createTagMeta("custom", input.params.slug);
}
