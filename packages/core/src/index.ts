export * from "./match";
export * from "./types";

export const packageName = "van-stack";
export const defaultHydrationPolicy = "app";
export const defaultPresentationMode = "replace";
export const internalDataBasePath = "/_van-stack/data";
export const csrModes = ["hydrated", "shell", "custom"] as const;

export function createRouteId(segments: string[]): string {
  return segments.join("/");
}

export function createInternalDataPath(pathname: string): string {
  const normalizedPath = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
  return normalizedPath
    ? `${internalDataBasePath}/${normalizedPath}`
    : internalDataBasePath;
}
