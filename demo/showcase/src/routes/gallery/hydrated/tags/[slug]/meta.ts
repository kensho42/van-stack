import { createTagMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createTagMeta("hydrated", input.params.slug);
}
