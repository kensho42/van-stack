import { createGalleryTagData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryTagData("ssg", input.params.slug);
}
