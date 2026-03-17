import { createGalleryTagData } from "../../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryTagData("custom", input.params.slug);
}
