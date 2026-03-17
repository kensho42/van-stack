import { relative, resolve, sep } from "node:path";

import {
  createRouteId,
  type NormalizedRoute,
  type RouteFileKind,
} from "../../core/src/index";

export const reservedRouteFileKinds: RouteFileKind[] = [
  "page",
  "hydrate",
  "route",
  "layout",
  "loader",
  "action",
  "entries",
  "meta",
  "error",
];

const reservedFileNames = new Set<string>(reservedRouteFileKinds);

export function isRouteFileKind(value: string): value is RouteFileKind {
  return reservedFileNames.has(value);
}

function normalizePath(path: string): string {
  return path.split(sep).join("/");
}

function stripBasePath(filePath: string, root: string): string[] {
  return normalizePath(relative(resolve(root), resolve(filePath)))
    .replace(/\.(ts|tsx)$/, "")
    .split("/")
    .filter(Boolean);
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isParamSegment(segment: string): boolean {
  return segment.startsWith("[") && segment.endsWith("]");
}

function toPathSegment(segment: string): string | null {
  if (isRouteGroup(segment)) return null;
  if (segment === "index") return null;
  if (segment.startsWith("[...") && segment.endsWith("]")) {
    return `:${segment.slice(4, -1)}*`;
  }
  if (segment.startsWith("[[...") && segment.endsWith("]]")) {
    return `:${segment.slice(5, -2)}*`;
  }
  if (isParamSegment(segment)) return `:${segment.slice(1, -1)}`;
  return segment;
}

function toLayoutChain(segments: string[]): string[] {
  const result: string[] = [];
  const current: string[] = [];

  for (const segment of segments) {
    current.push(segment);
    if (!isRouteGroup(segment) && segment !== "index") {
      result.push(current.join("/"));
    }
  }

  const lastSegment = segments.at(-1);
  if (lastSegment && !isRouteGroup(lastSegment) && lastSegment !== "index") {
    result.pop();
  }

  return result;
}

function toRoutePath(segments: string[]): string {
  const pathSegments = segments
    .map(toPathSegment)
    .filter((segment): segment is string => segment !== null);

  return pathSegments.length === 0 ? "/" : `/${pathSegments.join("/")}`;
}

export function compileRoutesFromPaths(
  filePaths: string[],
  options: { root: string } = { root: "/src/routes" },
): NormalizedRoute[] {
  const routes = new Map<string, NormalizedRoute>();
  const layoutFiles = new Set(
    filePaths.map((filePath) => normalizePath(resolve(filePath))),
  );

  for (const filePath of filePaths) {
    const parts = stripBasePath(filePath, options.root);
    const fileName = parts.at(-1);
    if (!fileName || !isRouteFileKind(fileName)) continue;
    if (parts.some((part) => part.startsWith("_"))) continue;
    if (fileName === "layout") continue;

    const directorySegments = parts.slice(0, -1);
    const id = createRouteId(directorySegments);
    const params = directorySegments
      .filter(isParamSegment)
      .map((segment) =>
        segment.replace(/^\[\[?\.{0,3}/, "").replace(/\]{1,2}$/, ""),
      );

    const existing = routes.get(id) ?? {
      id,
      path: toRoutePath(directorySegments),
      directorySegments,
      files: {},
      layoutChain: toLayoutChain(directorySegments).filter((segment) =>
        layoutFiles.has(
          normalizePath(
            resolve(options.root, ...segment.split("/"), "layout.ts"),
          ),
        ),
      ),
      params,
    };

    existing.files[fileName] = filePath;
    routes.set(id, existing);
  }

  return [...routes.values()].sort((a, b) => a.path.localeCompare(b.path));
}
