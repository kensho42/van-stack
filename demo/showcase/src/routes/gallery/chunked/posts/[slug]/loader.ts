const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../../runtime/data";

export default async function loader(input: {
  params: Record<string, string>;
}) {
  const slug = input.params.slug;
  if (typeof window === "undefined") {
    const { createGalleryPostData } = await import(serverDataModulePath);
    return createGalleryPostData("chunked", slug);
  }

  const response = await fetch(
    `${internalDataBasePath}/gallery/chunked/posts/${encodeURIComponent(slug)}`,
  );
  if (!response.ok) {
    throw new Error(`Chunked post loader failed: ${response.status}`);
  }

  return response.json();
}
