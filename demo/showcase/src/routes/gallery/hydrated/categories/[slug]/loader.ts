import { createGalleryCategoryData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryCategoryData("hydrated", input.params.slug);
}
