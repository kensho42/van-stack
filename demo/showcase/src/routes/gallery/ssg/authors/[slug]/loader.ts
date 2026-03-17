import { createGalleryAuthorData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryAuthorData("ssg", input.params.slug);
}
