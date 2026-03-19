import { relative, resolve, sep } from "node:path";

import {
  createRouteId,
  type NormalizedRoute,
  type NormalizedSlotRoute,
  type RouteFileKind,
  type SlotRouteFileKind,
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
const supportedSlotFileKinds = new Set<SlotRouteFileKind>([
  "page",
  "hydrate",
  "layout",
  "loader",
  "error",
]);

export function isRouteFileKind(value: string): value is RouteFileKind {
  return reservedFileNames.has(value);
}

function isSlotRouteFileKind(value: string): value is SlotRouteFileKind {
  return supportedSlotFileKinds.has(value as SlotRouteFileKind);
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

function isSlotSegment(segment: string): boolean {
  return segment.startsWith("@") && segment.length > 1;
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

function toLayoutChain(segments: string[], startIndex = 0): string[] {
  const result: string[] = [];
  const current = segments.slice(0, startIndex);

  for (const segment of segments.slice(startIndex)) {
    current.push(segment);
    if (!isRouteGroup(segment) && segment !== "index") {
      result.push(current.join("/"));
    }
  }

  return result;
}

function toRoutePath(segments: string[]): string {
  const pathSegments = segments
    .map(toPathSegment)
    .filter((segment): segment is string => segment !== null);

  return pathSegments.length === 0 ? "/" : `/${pathSegments.join("/")}`;
}

function toParams(segments: string[]): string[] {
  return segments
    .filter(isParamSegment)
    .map((segment) =>
      segment.replace(/^\[\[?\.{0,3}/, "").replace(/\]{1,2}$/, ""),
    );
}

function resolveLayoutChain(
  root: string,
  candidateDirectories: string[],
  layoutDirectories: Set<string>,
) {
  return candidateDirectories.filter((directory) =>
    layoutDirectories.has(
      normalizePath(resolve(root, ...directory.split("/"), "layout.ts")),
    ),
  );
}

function sortByPath<T extends { path: string }>(routes: T[]) {
  return [...routes].sort((a, b) => a.path.localeCompare(b.path));
}

function createSlotRouteId(
  ownerId: string,
  slot: string,
  relativeSegments: string[],
) {
  const relativeId = createRouteId(relativeSegments);
  return relativeId
    ? `${ownerId}::${slot}/${relativeId}`
    : `${ownerId}::${slot}`;
}

export function compileRoutesFromPaths(
  filePaths: string[],
  options: { root: string } = { root: "/src/routes" },
): NormalizedRoute[] {
  const routes = new Map<string, NormalizedRoute>();
  const layoutFiles = new Set(
    filePaths
      .filter(
        (filePath) => stripBasePath(filePath, options.root).at(-1) === "layout",
      )
      .map((filePath) => normalizePath(resolve(filePath))),
  );
  const slotRoutesByOwner = new Map<
    string,
    Map<string, NormalizedSlotRoute[]>
  >();

  for (const filePath of filePaths) {
    const parts = stripBasePath(filePath, options.root);
    const fileName = parts.at(-1);
    if (!fileName || !isRouteFileKind(fileName)) continue;
    if (parts.some((part) => part.startsWith("_"))) continue;

    const directorySegments = parts.slice(0, -1);
    const slotSegmentIndexes = directorySegments.reduce<number[]>(
      (indexes, segment, index) => {
        if (isSlotSegment(segment)) {
          indexes.push(index);
        }
        return indexes;
      },
      [],
    );

    if (slotSegmentIndexes.length > 1) {
      const nestedSlot = directorySegments[slotSegmentIndexes[1]];
      throw new Error(
        `Nested slot directory "${nestedSlot}" is not supported.`,
      );
    }

    const slotIndex = slotSegmentIndexes[0];
    if (slotIndex !== undefined) {
      const slotSegment = directorySegments[slotIndex];
      const slot = slotSegment.slice(1);
      const ownerSegments = directorySegments.slice(0, slotIndex);

      if (
        !layoutFiles.has(
          normalizePath(resolve(options.root, ...ownerSegments, "layout.ts")),
        )
      ) {
        throw new Error(
          `Slot directory "${slotSegment}" requires an owning layout.ts.`,
        );
      }

      if (!isSlotRouteFileKind(fileName)) {
        throw new Error(`Named slot "${slot}" cannot define "${fileName}.ts".`);
      }

      if (fileName === "layout") {
        continue;
      }

      const relativeSegments = directorySegments.slice(slotIndex + 1);
      const visibleSegments = [...ownerSegments, ...relativeSegments];
      const ownerId = createRouteId(ownerSegments);
      const slotRoute: NormalizedSlotRoute = {
        id: createSlotRouteId(ownerId, slot, relativeSegments),
        slot,
        path: toRoutePath(visibleSegments),
        directorySegments,
        files: {
          [fileName]: filePath,
        },
        layoutChain: resolveLayoutChain(
          options.root,
          toLayoutChain(directorySegments, slotIndex),
          layoutFiles,
        ),
        params: toParams(visibleSegments),
      };

      const ownerSlots =
        slotRoutesByOwner.get(ownerId) ??
        (() => {
          const created = new Map<string, NormalizedSlotRoute[]>();
          slotRoutesByOwner.set(ownerId, created);
          return created;
        })();
      const slotRoutes = ownerSlots.get(slot) ?? [];
      const existing = slotRoutes.find(
        (candidate) => candidate.id === slotRoute.id,
      );
      if (existing) {
        existing.files[fileName] = filePath;
      } else {
        slotRoutes.push(slotRoute);
      }
      ownerSlots.set(slot, slotRoutes);
      continue;
    }

    if (fileName === "layout") continue;

    const id = createRouteId(directorySegments);
    const params = toParams(directorySegments);

    const existing = routes.get(id) ?? {
      id,
      path: toRoutePath(directorySegments),
      directorySegments,
      files: {},
      layoutChain: resolveLayoutChain(
        options.root,
        toLayoutChain(directorySegments),
        layoutFiles,
      ),
      params,
    };

    existing.files[fileName] = filePath;
    routes.set(id, existing);
  }

  const normalizedRoutes = sortByPath([...routes.values()]);

  for (const route of normalizedRoutes) {
    const applicableOwners = [...slotRoutesByOwner.keys()].filter((ownerId) => {
      const ownerSegments = ownerId.split("/").filter(Boolean);
      if (
        ownerSegments.length === 0 ||
        ownerSegments.length > route.directorySegments.length
      ) {
        return false;
      }

      return ownerSegments.every(
        (segment, index) => route.directorySegments[index] === segment,
      );
    });

    if (applicableOwners.length === 0) {
      continue;
    }

    if (applicableOwners.length > 1) {
      throw new Error("Nested slot owners are not supported.");
    }

    const ownerId = applicableOwners[0];
    const ownerSlots = slotRoutesByOwner.get(ownerId);
    if (!ownerSlots) {
      continue;
    }

    route.slotOwnerLayout = ownerId;
    route.slots = Object.fromEntries(
      [...ownerSlots.entries()].map(([slot, slotRoutes]) => [
        slot,
        sortByPath(slotRoutes),
      ]),
    );
  }

  return normalizedRoutes;
}
