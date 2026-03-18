import {
  chunkedCanonicalSlug,
  getChunkedRouteData,
} from "../../shared/content";

export default function loader(input: { params: Record<string, string> }) {
  return getChunkedRouteData(
    "custom",
    input.params.slug || chunkedCanonicalSlug,
  );
}
