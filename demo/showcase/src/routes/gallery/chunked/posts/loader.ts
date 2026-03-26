const internalDataBasePath = "/_van-stack/data";
const serverDataModulePath = "../../../../runtime/data";

export default async function loader() {
  if (typeof window === "undefined") {
    const { createPostsIndexData } = await import(serverDataModulePath);
    return (createPostsIndexData as (modeId: "chunked") => unknown)("chunked");
  }

  const response = await fetch(`${internalDataBasePath}/gallery/chunked/posts`);
  if (!response.ok) {
    throw new Error(`Chunked posts loader failed: ${response.status}`);
  }

  return response.json();
}
