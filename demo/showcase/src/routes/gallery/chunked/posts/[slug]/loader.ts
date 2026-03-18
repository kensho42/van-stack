import { createGalleryPostData } from "../../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryPostData("chunked", input.params.slug);
}
