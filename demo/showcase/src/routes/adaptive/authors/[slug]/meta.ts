import { createAdaptiveAuthorMeta } from "../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createAdaptiveAuthorMeta(input.params.slug, input.data);
}
