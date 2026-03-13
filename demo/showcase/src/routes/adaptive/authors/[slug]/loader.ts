import { createGalleryAuthorData } from "../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryAuthorData("ssr", input.params.slug);
}
