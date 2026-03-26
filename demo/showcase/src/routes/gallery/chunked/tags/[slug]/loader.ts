const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../../runtime/data";

export default async function loader(input: {
  params: Record<string, string>;
}) {
  const slug = input.params.slug;
  if (typeof window === "undefined") {
    const { createGalleryTagData } = await import(serverDataModulePath);
    return createGalleryTagData("chunked", slug);
  }

  const response = await fetch(
    `${internalDataBasePath}/gallery/chunked/tags/${encodeURIComponent(slug)}`,
  );
  if (!response.ok) {
    throw new Error(`Chunked tag loader failed: ${response.status}`);
  }

  return response.json();
}
