import { createGalleryAuthorData } from "../../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryAuthorData("islands", input.params.slug);
}
