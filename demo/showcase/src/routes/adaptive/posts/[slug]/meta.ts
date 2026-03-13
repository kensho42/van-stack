import { createAdaptivePostMeta } from "../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createAdaptivePostMeta(input.params.slug);
}
