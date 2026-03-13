import { createAuthorMeta } from "../../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createAuthorMeta("hydrated", input.params.slug);
}
