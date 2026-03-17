import { createGalleryPostData } from "../../../../../runtime/data";

export default async function loader(input: {
  params: { slug: string };
  request: Request;
}) {
  return createGalleryPostData("hydrated", input.params.slug, {
    request: input.request,
  });
}
