import { createGalleryPostData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryPostData("hydrated", input.params.slug);
}
