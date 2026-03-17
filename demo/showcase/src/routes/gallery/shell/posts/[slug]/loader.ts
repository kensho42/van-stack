import { createGalleryPostData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryPostData("shell", input.params.slug);
}
