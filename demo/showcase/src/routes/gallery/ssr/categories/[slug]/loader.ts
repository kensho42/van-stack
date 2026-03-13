import { createGalleryCategoryData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryCategoryData("ssr", input.params.slug);
}
