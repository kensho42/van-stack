const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../runtime/data";

export default async function loader() {
  if (typeof window === "undefined") {
    const { createCategoriesIndexData } = await import(serverDataModulePath);
    return (createCategoriesIndexData as (modeId: "chunked") => unknown)(
      "chunked",
    );
  }

  const response = await fetch(
    `${internalDataBasePath}/gallery/chunked/categories`,
  );
  if (!response.ok) {
    throw new Error(`Chunked categories loader failed: ${response.status}`);
  }

  return response.json();
}
