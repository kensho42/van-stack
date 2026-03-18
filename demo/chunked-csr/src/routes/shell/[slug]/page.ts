import { renderChunkedDetailPage } from "../../shared/content";

export default function page(input: { data: unknown }) {
  return renderChunkedDetailPage(
    input.data as Parameters<typeof renderChunkedDetailPage>[0],
  );
}
