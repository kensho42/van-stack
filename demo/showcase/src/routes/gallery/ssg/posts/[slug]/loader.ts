import { createGalleryPostData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryPostData("ssg", input.params.slug);
}
