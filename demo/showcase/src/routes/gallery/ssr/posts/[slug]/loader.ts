import { createGalleryPostData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryPostData("ssr", input.params.slug);
}
