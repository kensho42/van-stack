import { createAdaptiveAuthorMeta } from "../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createAdaptiveAuthorMeta(input.params.slug);
}
