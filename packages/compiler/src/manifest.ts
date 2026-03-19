import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import type {
  NormalizedRoute,
  NormalizedSlotRoute,
  RouteFileKind,
  RouteLayoutModule,
  RouteModuleLoader,
  RuntimeRouteDefinition,
  RuntimeSlotDefinition,
  SlotRouteFileKind,
} from "../../core/src/index";

import { discoverRoutes } from "./discover-routes";
import { compileRoutesFromPaths } from "./fs-routes";

const routeFileOrder: Exclude<RouteFileKind, "layout">[] = [
  "page",
  "hydrate",
  "route",
  "loader",
  "action",
  "entries",
  "meta",
  "error",
];

const slotRouteFileOrder: Exclude<SlotRouteFileKind, "layout">[] = [
  "page",
  "hydrate",
  "loader",
  "error",
];

type BuildRouteManifestOptions = {
  root: string;
  outFile?: string;
  filePaths?: string[];
};

type LoadRoutesOptions = {
  root: string;
  filePaths?: string[];
};

export type RouteManifest = {
  routes: NormalizedRoute[];
  code: string;
  outFile: string;
};

export type LoadedRoute = Pick<
  RuntimeRouteDefinition,
  | "id"
  | "path"
  | "files"
  | "layoutChain"
  | "slotOwnerLayout"
  | "slotOwnerLayoutIndex"
  | "slots"
>;

function normalizePath(path: string): string {
  return path.split(sep).join("/");
}

function inferProjectRoot(routesRoot: string): string {
  const normalizedRoot = resolve(routesRoot);
  const parts = normalizedRoot.split(sep);

  if (parts.at(-1) === "routes" && parts.at(-2) === "src") {
    return dirname(dirname(normalizedRoot));
  }

  return dirname(normalizedRoot);
}

function inferOutFile(routesRoot: string, outFile?: string): string {
  if (outFile) return resolve(outFile);

  return join(
    inferProjectRoot(routesRoot),
    ".van-stack",
    "routes.generated.ts",
  );
}

function toImportPath(fromFile: string, toFile: string): string {
  const relativePath = normalizePath(
    relative(dirname(fromFile), resolve(toFile)),
  );
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

function toGeneratedImportPath(fromFile: string, toFile: string): string {
  return toImportPath(fromFile, toFile).replace(/\.[cm]?[jt]sx?$/, ".js");
}

function renderImportFactory(targetFile: string, outFile: string): string {
  return `() => import("${toGeneratedImportPath(outFile, targetFile)}")`;
}

function renderImportPropertyLines(
  indent: string,
  key: string,
  targetFile: string,
  outFile: string,
): string[] {
  const importPath = toGeneratedImportPath(outFile, targetFile);
  const singleLine = `${indent}${key}: () => import("${importPath}"),`;

  if (singleLine.length <= 80) {
    return [singleLine];
  }

  return [`${indent}${key}: () =>`, `${indent}  import("${importPath}"),`];
}

function createModuleLoader<T = unknown>(
  targetFile: string,
): RouteModuleLoader<T> {
  const href = pathToFileURL(resolve(targetFile)).href;

  return () => import(/* @vite-ignore */ href);
}

function createLayoutLoader(
  directory: string,
  routesRoot: string,
): RouteModuleLoader<RouteLayoutModule> {
  return createModuleLoader(
    join(routesRoot, ...directory.split("/"), "layout.ts"),
  );
}

function buildLoadedSlotRoute(
  route: NormalizedSlotRoute,
  routesRoot: string,
): RuntimeSlotDefinition {
  const files = {} as NonNullable<RuntimeSlotDefinition["files"]>;

  for (const key of slotRouteFileOrder) {
    const filePath = route.files[key];
    if (!filePath) continue;

    switch (key) {
      case "page":
        files.page = createModuleLoader(filePath);
        break;
      case "hydrate":
        files.hydrate = createModuleLoader(filePath);
        break;
      case "loader":
        files.loader = createModuleLoader(filePath);
        break;
      case "error":
        files.error = createModuleLoader(filePath);
        break;
    }
  }

  return {
    id: route.id,
    slot: route.slot,
    path: route.path,
    files,
    layoutChain: route.layoutChain.map((segment) =>
      createLayoutLoader(segment, routesRoot),
    ),
  };
}

function buildLoadedRoute(
  route: NormalizedRoute,
  routesRoot: string,
): LoadedRoute {
  const files: Partial<
    Record<Exclude<RouteFileKind, "layout">, RouteModuleLoader>
  > = {};

  for (const key of routeFileOrder) {
    const filePath = route.files[key];
    if (!filePath) continue;

    files[key] = createModuleLoader(filePath);
  }

  const layoutChain = route.layoutChain.map((segment) =>
    createLayoutLoader(segment, routesRoot),
  );

  return {
    id: route.id,
    path: route.path,
    files: files as LoadedRoute["files"],
    layoutChain,
    slotOwnerLayout: route.slotOwnerLayout,
    slotOwnerLayoutIndex: route.slotOwnerLayout
      ? route.layoutChain.indexOf(route.slotOwnerLayout)
      : undefined,
    slots: route.slots
      ? Object.fromEntries(
          Object.entries(route.slots).map(([slot, slotRoutes]) => [
            slot,
            slotRoutes.map((slotRoute) =>
              buildLoadedSlotRoute(slotRoute, routesRoot),
            ),
          ]),
        )
      : undefined,
  };
}

function renderFiles(route: NormalizedRoute, outFile: string): string[] {
  const keys = routeFileOrder.filter((key) => route.files[key]);

  if (keys.length === 0) return ["    files: {},"]; // defensive

  return [
    "    files: {",
    ...keys.flatMap((key) =>
      renderImportPropertyLines(
        "      ",
        key,
        route.files[key] as string,
        outFile,
      ),
    ),
    "    },",
  ];
}

function renderLayoutChain(
  route: NormalizedRoute,
  routesRoot: string,
  outFile: string,
): string {
  if (route.layoutChain.length === 0) {
    return "    layoutChain: [],";
  }

  const items = route.layoutChain.map((segment) =>
    renderImportFactory(
      join(routesRoot, ...segment.split("/"), "layout.ts"),
      outFile,
    ),
  );

  return `    layoutChain: [${items.join(", ")}],`;
}

function renderSlotRoute(
  route: NormalizedSlotRoute,
  routesRoot: string,
  outFile: string,
): string[] {
  const fileLines = slotRouteFileOrder
    .filter((key) => route.files[key])
    .flatMap((key) =>
      renderImportPropertyLines(
        "            ",
        key,
        route.files[key] as string,
        outFile,
      ),
    );

  const layoutItems = route.layoutChain.map((segment) =>
    renderImportFactory(
      join(routesRoot, ...segment.split("/"), "layout.ts"),
      outFile,
    ),
  );

  return [
    "        {",
    `          id: "${route.id}",`,
    `          slot: "${route.slot}",`,
    `          path: "${route.path}",`,
    fileLines.length === 0 ? "          files: {}," : "          files: {",
    ...fileLines,
    ...(fileLines.length === 0 ? [] : ["          },"]),
    `          layoutChain: [${layoutItems.join(", ")}],`,
    "        },",
  ];
}

function renderSlots(
  route: NormalizedRoute,
  routesRoot: string,
  outFile: string,
): string[] {
  if (!route.slots || Object.keys(route.slots).length === 0) {
    return ["    slots: undefined,"];
  }

  const lines = ["    slots: {"];

  for (const [slot, slotRoutes] of Object.entries(route.slots)) {
    lines.push(`      ${slot}: [`);
    for (const slotRoute of slotRoutes) {
      lines.push(...renderSlotRoute(slotRoute, routesRoot, outFile));
    }
    lines.push("      ],");
  }

  lines.push("    },");
  return lines;
}

function renderManifestCode(
  routes: NormalizedRoute[],
  routesRoot: string,
  outFile: string,
): string {
  const lines = [
    "// Generated by van-stack/compiler. Do not edit by hand.",
    "",
    "export const routes = [",
  ];

  for (const route of routes) {
    lines.push("  {");
    lines.push(`    id: "${route.id}",`);
    lines.push(`    path: "${route.path}",`);
    lines.push(...renderFiles(route, outFile));
    lines.push(renderLayoutChain(route, routesRoot, outFile));
    lines.push(
      route.slotOwnerLayout
        ? `    slotOwnerLayout: "${route.slotOwnerLayout}",`
        : "    slotOwnerLayout: undefined,",
    );
    lines.push(
      route.slotOwnerLayout
        ? `    slotOwnerLayoutIndex: ${route.layoutChain.indexOf(route.slotOwnerLayout)},`
        : "    slotOwnerLayoutIndex: undefined,",
    );
    lines.push(...renderSlots(route, routesRoot, outFile));
    lines.push("  },");
  }

  lines.push("] as const;");
  lines.push("");
  lines.push("export default routes;");

  return `${lines.join("\n")}\n`;
}

export async function buildRouteManifest(
  options: BuildRouteManifestOptions,
): Promise<RouteManifest> {
  const routesRoot = resolve(options.root);
  const outFile = inferOutFile(routesRoot, options.outFile);
  const filePaths =
    options.filePaths ?? (await discoverRoutes({ root: routesRoot }));
  const routes = compileRoutesFromPaths(filePaths, { root: routesRoot });
  const code = renderManifestCode(routes, routesRoot, outFile);

  return {
    routes,
    code,
    outFile,
  };
}

export async function loadRoutes(
  options: LoadRoutesOptions,
): Promise<LoadedRoute[]> {
  const routesRoot = resolve(options.root);
  const filePaths =
    options.filePaths ?? (await discoverRoutes({ root: routesRoot }));
  const routes = compileRoutesFromPaths(filePaths, { root: routesRoot });

  return routes.map((route) => buildLoadedRoute(route, routesRoot));
}

export async function writeRouteManifest(
  options: BuildRouteManifestOptions,
): Promise<string> {
  const manifest = await buildRouteManifest(options);

  await mkdir(dirname(manifest.outFile), { recursive: true });
  await writeFile(manifest.outFile, manifest.code, "utf8");

  return manifest.outFile;
}
