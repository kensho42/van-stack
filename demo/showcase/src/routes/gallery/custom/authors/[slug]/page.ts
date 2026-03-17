import { renderClientModeShell } from "../../../../../route-helpers/client-shell";
import type { GalleryAuthorData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderClientModeShell(
    "custom",
    (input.data as GalleryAuthorData).path,
  );
}
