import { createGalleryPostData } from "../../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryPostData("islands", input.params.slug);
}
