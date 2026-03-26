const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../runtime/data";

export default async function loader() {
  if (typeof window === "undefined") {
    const { createTagsIndexData } = await import(serverDataModulePath);
    return (createTagsIndexData as (modeId: "chunked") => unknown)("chunked");
  }

  const response = await fetch(`${internalDataBasePath}/gallery/chunked/tags`);
  if (!response.ok) {
    throw new Error(`Chunked tags loader failed: ${response.status}`);
  }

  return response.json();
}
