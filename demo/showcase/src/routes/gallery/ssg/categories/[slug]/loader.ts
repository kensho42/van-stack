import { createGalleryCategoryData } from "../../../../../runtime/data";

export default async function loader(input: { params: { slug: string } }) {
  return createGalleryCategoryData("ssg", input.params.slug);
}
