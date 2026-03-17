import { renderClientModeShell } from "../../../../../route-helpers/client-shell";
import type { GalleryPostData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  const data = input.data as GalleryPostData;
  return renderClientModeShell("custom", data.path);
}
