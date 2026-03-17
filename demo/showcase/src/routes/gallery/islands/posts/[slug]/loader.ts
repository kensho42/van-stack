import { createGalleryPostData } from "../../../../../runtime/data";

export default function loader(input: {
  params: Record<string, string>;
  request: Request;
}) {
  return createGalleryPostData("islands", input.params.slug, {
    request: input.request,
  });
}
