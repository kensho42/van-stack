import {
  chunkedCanonicalSlug,
  getChunkedRouteData,
} from "../../shared/content";

export default function loader(input: { params: Record<string, string> }) {
  return getChunkedRouteData(
    "shell",
    input.params.slug || chunkedCanonicalSlug,
  );
}
