const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../../runtime/data";

export default async function loader(input: {
  params: Record<string, string>;
}) {
  const slug = input.params.slug;
  if (typeof window === "undefined") {
    const { createGalleryAuthorData } = await import(serverDataModulePath);
    return createGalleryAuthorData("chunked", slug);
  }

  const response = await fetch(
    `${internalDataBasePath}/gallery/chunked/authors/${encodeURIComponent(slug)}`,
  );
  if (!response.ok) {
    throw new Error(`Chunked author loader failed: ${response.status}`);
  }

  return response.json();
}
