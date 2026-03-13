import { createGalleryAuthorData } from "../../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryAuthorData("custom", input.params.slug);
}
