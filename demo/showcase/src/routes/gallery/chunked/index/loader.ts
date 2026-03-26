const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../runtime/data";

export default async function loader() {
  if (typeof window === "undefined") {
    const { createGalleryHomeData } = await import(serverDataModulePath);
    return (createGalleryHomeData as (modeId: "chunked") => unknown)("chunked");
  }

  const response = await fetch(`${internalDataBasePath}/gallery/chunked`);
  if (!response.ok) {
    throw new Error(`Chunked home loader failed: ${response.status}`);
  }

  return response.json();
}
