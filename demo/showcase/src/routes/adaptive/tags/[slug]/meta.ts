import { createAdaptiveTagMeta } from "../../../../route-helpers/meta";

export default function meta(input: { params: Record<string, string> }) {
  return createAdaptiveTagMeta(input.params.slug);
}
