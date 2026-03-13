import { createGalleryAuthorData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryAuthorData("hydrated", input.params.slug);
}
