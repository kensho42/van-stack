import { renderClientModeShell } from "../../../../../route-helpers/client-shell";
import type { GalleryTagData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderClientModeShell("shell", (input.data as GalleryTagData).path);
}
