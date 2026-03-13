import { createAdaptivePostMeta } from "../../../../route-helpers/meta";

export default function meta(input: {
  data: unknown;
  params: Record<string, string>;
}) {
  return createAdaptivePostMeta(input.params.slug, input.data);
}
