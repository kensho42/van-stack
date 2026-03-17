import { createGalleryCategoryData } from "../../../../runtime/data";

export default function loader(input: { params: Record<string, string> }) {
  return createGalleryCategoryData("ssr", input.params.slug);
}
