import { renderClientModeShell } from "../../../../../route-helpers/client-shell";
import type { GalleryCategoryData } from "../../../../../runtime/data";

export default function page(input: { data: unknown }) {
  return renderClientModeShell(
    "shell",
    (input.data as GalleryCategoryData).path,
  );
}
