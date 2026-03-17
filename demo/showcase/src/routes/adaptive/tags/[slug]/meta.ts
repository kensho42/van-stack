import { createAdaptiveTagMeta } from "../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createAdaptiveTagMeta(input.params.slug, input.data);
}
