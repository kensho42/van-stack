import { relative, resolve } from "node:path";

import { normalizePath, type Plugin } from "vite";

import { discoverRoutes } from "../../compiler/src/discover-routes";
import { compileRoutesFromPaths } from "../../compiler/src/fs-routes";
import type {
  NormalizedRoute,
  NormalizedSlotRoute,
  RouteFileKind,
  SlotRouteFileKind,
} from "../../core/src/index";

export const vitePackageName = "van-stack/vite";

export type VanStackViteOptions = {
  routes?: {
    root: string;
  };
};

const virtualRoutesId = "virtual:van-stack/routes";
const resolvedVirtualRoutesId = `\0${virtualRoutesId}`;

const csrRouteFileOrder = [
  "page",
  "hydrate",
  "meta",
  "error",
] as const satisfies readonly RouteFileKind[];

const csrSlotRouteFileOrder = [
  "page",
  "hydrate",
  "error",
] as const satisfies readonly SlotRouteFileKind[];

type CsrRouteFileKind = (typeof csrRouteFileOrder)[number];
type CsrSlotRouteFileKind = (typeof csrSlotRouteFileOrder)[number];

function toViteFileSpecifier(filePath: string) {
  const normalized = normalizePath(resolve(filePath));

  return normalized.startsWith("/")
    ? `/@fs${normalized}`
    : `/@fs/${normalized}`;
}

function toRouteFileInfo(filePath: string, routesRoot: string) {
  const relativePath = normalizePath(relative(routesRoot, resolve(filePath)));
  const routePath = relativePath.replace(/\.(ts|tsx)$/, "");
  const parts = routePath.split("/").filter(Boolean);
  const kind = parts.at(-1);

  if (!kind) {
    return null;
  }

  return {
    directory: parts.slice(0, -1).join("/"),
    kind,
  };
}

function getLayoutPaths(filePaths: string[], routesRoot: string) {
  const layoutPaths = new Map<string, string>();

  for (const filePath of filePaths) {
    const info = toRouteFileInfo(filePath, routesRoot);
    if (info?.kind === "layout") {
      layoutPaths.set(info.directory, filePath);
    }
  }

  return layoutPaths;
}

function createVirtualRouteRenderer(routesRoot: string, filePaths: string[]) {
  const imports: string[] = [];
  const bindingsByFile = new Map<string, string>();
  const layoutPaths = getLayoutPaths(filePaths, routesRoot);

  function getModuleBinding(filePath: string) {
    const resolvedPath = resolve(filePath);
    const existing = bindingsByFile.get(resolvedPath);
    if (existing) {
      return existing;
    }

    const binding = `routeModule${bindingsByFile.size}`;
    bindingsByFile.set(resolvedPath, binding);
    imports.push(
      `import * as ${binding} from ${JSON.stringify(toViteFileSpecifier(resolvedPath))};`,
    );
    return binding;
  }

  function renderModuleLoader(filePath: string) {
    return `() => Promise.resolve(${getModuleBinding(filePath)})`;
  }

  function renderLayoutChain(
    segments: readonly string[],
    indent: string,
  ): string {
    if (segments.length === 0) {
      return `${indent}layoutChain: [],`;
    }

    const loaders = segments.map((segment) => {
      const layoutPath =
        layoutPaths.get(segment) ??
        resolve(routesRoot, ...segment.split("/"), "layout.ts");

      return renderModuleLoader(layoutPath);
    });

    return `${indent}layoutChain: [${loaders.join(", ")}],`;
  }

  function renderRouteFiles(
    files: Partial<Record<RouteFileKind, string>>,
    indent: string,
  ) {
    const fileLines = csrRouteFileOrder
      .filter((key) => files[key])
      .map(
        (key) =>
          `${indent}  ${key}: ${renderModuleLoader(files[key] as string)},`,
      );

    if (fileLines.length === 0) {
      return [`${indent}files: {},`];
    }

    return [`${indent}files: {`, ...fileLines, `${indent}},`];
  }

  function renderSlotRouteFiles(
    files: Partial<Record<SlotRouteFileKind, string>>,
    indent: string,
  ) {
    const fileLines = csrSlotRouteFileOrder
      .filter((key) => files[key])
      .map(
        (key) =>
          `${indent}  ${key}: ${renderModuleLoader(files[key] as string)},`,
      );

    if (fileLines.length === 0) {
      return [`${indent}files: {},`];
    }

    return [`${indent}files: {`, ...fileLines, `${indent}},`];
  }

  function renderSlotRoute(route: NormalizedSlotRoute, indent: string) {
    return [
      `${indent}{`,
      `${indent}  id: ${JSON.stringify(route.id)},`,
      `${indent}  slot: ${JSON.stringify(route.slot)},`,
      `${indent}  path: ${JSON.stringify(route.path)},`,
      ...renderSlotRouteFiles(
        route.files as Partial<Record<CsrSlotRouteFileKind, string>>,
        `${indent}  `,
      ),
      renderLayoutChain(route.layoutChain, `${indent}  `),
      `${indent}},`,
    ];
  }

  function renderSlots(route: NormalizedRoute, indent: string) {
    if (!route.slots || Object.keys(route.slots).length === 0) {
      return [`${indent}slots: undefined,`];
    }

    const lines = [`${indent}slots: {`];
    for (const [slot, slotRoutes] of Object.entries(route.slots)) {
      lines.push(`${indent}  ${JSON.stringify(slot)}: [`);
      for (const slotRoute of slotRoutes) {
        lines.push(...renderSlotRoute(slotRoute, `${indent}    `));
      }
      lines.push(`${indent}  ],`);
    }
    lines.push(`${indent}},`);

    return lines;
  }

  function renderRoute(route: NormalizedRoute) {
    const slotOwnerLayoutIndex = route.slotOwnerLayout
      ? route.layoutChain.indexOf(route.slotOwnerLayout)
      : undefined;

    return [
      "  {",
      `    id: ${JSON.stringify(route.id)},`,
      `    path: ${JSON.stringify(route.path)},`,
      ...renderRouteFiles(
        route.files as Partial<Record<CsrRouteFileKind, string>>,
        "    ",
      ),
      renderLayoutChain(route.layoutChain, "    "),
      route.slotOwnerLayout
        ? `    slotOwnerLayout: ${JSON.stringify(route.slotOwnerLayout)},`
        : "    slotOwnerLayout: undefined,",
      slotOwnerLayoutIndex === undefined
        ? "    slotOwnerLayoutIndex: undefined,"
        : `    slotOwnerLayoutIndex: ${slotOwnerLayoutIndex},`,
      ...renderSlots(route, "    "),
      "  },",
    ];
  }

  return {
    render(routes: NormalizedRoute[]) {
      const routeLines = routes.flatMap((route) => renderRoute(route));
      return [
        ...imports,
        "",
        "export const routes = [",
        ...routeLines,
        "];",
        "",
        "export default routes;",
        "",
      ].join("\n");
    },
  };
}

async function renderVirtualRoutesModule(routesRoot: string) {
  const filePaths = await discoverRoutes({ root: routesRoot });
  const routes = compileRoutesFromPaths(filePaths, { root: routesRoot });
  const renderer = createVirtualRouteRenderer(routesRoot, filePaths);

  return renderer.render(routes);
}

function resolveRoutesRoot(
  configRoot: string | undefined,
  options: VanStackViteOptions,
) {
  if (!options.routes) {
    return null;
  }

  return resolve(configRoot ?? process.cwd(), options.routes.root);
}

function isRouteFile(filePath: string, routesRoot: string | null) {
  if (!routesRoot) {
    return false;
  }

  const normalizedFilePath = normalizePath(resolve(filePath));
  const normalizedRoot = normalizePath(resolve(routesRoot));

  return (
    normalizedFilePath.startsWith(`${normalizedRoot}/`) &&
    /\.(ts|tsx)$/.test(normalizedFilePath)
  );
}

export function vanStackVite(options: VanStackViteOptions = {}): Plugin {
  let routesRoot = resolveRoutesRoot(undefined, options);

  return {
    name: "van-stack:vite",
    enforce: "pre",
    configResolved(config) {
      routesRoot = resolveRoutesRoot(config.root, options);
    },
    async resolveId(source) {
      if (source === virtualRoutesId) {
        return resolvedVirtualRoutesId;
      }

      return null;
    },
    async load(id) {
      if (id !== resolvedVirtualRoutesId) {
        return null;
      }

      if (!routesRoot) {
        throw new Error(
          'Importing "virtual:van-stack/routes" requires vanStackVite({ routes: { root: "src/routes" } }).',
        );
      }

      return renderVirtualRoutesModule(routesRoot);
    },
    handleHotUpdate(ctx) {
      if (!isRouteFile(ctx.file, routesRoot)) {
        return;
      }

      const module = ctx.server.moduleGraph.getModuleById(
        resolvedVirtualRoutesId,
      );
      if (!module) {
        return;
      }

      ctx.server.moduleGraph.invalidateModule(module);
      return [module];
    },
  };
}
