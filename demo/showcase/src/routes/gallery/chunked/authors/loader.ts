const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../runtime/data";

export default async function loader() {
  if (typeof window === "undefined") {
    const { createAuthorsIndexData } = await import(serverDataModulePath);
    return (createAuthorsIndexData as (modeId: "chunked") => unknown)(
      "chunked",
    );
  }

  const response = await fetch(
    `${internalDataBasePath}/gallery/chunked/authors`,
  );
  if (!response.ok) {
    throw new Error(`Chunked authors loader failed: ${response.status}`);
  }

  return response.json();
}
