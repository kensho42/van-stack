import { createGalleryTagData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryTagData("hydrated", input.params.slug);
}
