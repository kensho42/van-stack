const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../../runtime/data";

export default async function loader(input: {
  params: Record<string, string>;
}) {
  const slug = input.params.slug;
  if (typeof window === "undefined") {
    const { createGalleryCategoryData } = await import(serverDataModulePath);
    return createGalleryCategoryData("chunked", slug);
  }

  const response = await fetch(
    `${internalDataBasePath}/gallery/chunked/categories/${encodeURIComponent(slug)}`,
  );
  if (!response.ok) {
    throw new Error(`Chunked category loader failed: ${response.status}`);
  }

  return response.json();
}
