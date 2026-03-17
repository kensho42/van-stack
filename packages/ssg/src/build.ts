import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import type { RouteMeta } from "../../core/src/index";
import { renderRequest } from "../../ssr/src/render";
import { bindStaticRenderEnv } from "./render-env";

type ModuleLoader<T> = () => Promise<{ default: T }>;
type RouteHandler = (input: {
  request: Request;
  params: Record<string, string>;
}) => Promise<Response> | Response;
type RouteLayout = (input: {
  children: unknown;
  data: unknown;
  params: Record<string, string>;
  path: string;
}) => Promise<string> | string;

type StaticRouteDefinition = {
  id: string;
  path: string;
  hydrationPolicy?: string;
  layoutChain?: ModuleLoader<RouteLayout>[];
  route?: RouteHandler;
  entries?: () => Promise<Record<string, string>[]> | Record<string, string>[];
  loader?: (input: {
    params: Record<string, string>;
    request: Request;
  }) => Promise<unknown> | unknown;
  meta?: (input: {
    params: Record<string, string>;
    data: unknown;
  }) => Promise<RouteMeta> | RouteMeta;
  page?: (input: { data: unknown }) => Promise<string> | string;
  files?: {
    route?: ModuleLoader<RouteHandler>;
    entries?: ModuleLoader<
      () => Promise<Record<string, string>[]> | Record<string, string>[]
    >;
    loader?: ModuleLoader<
      (input: {
        params: Record<string, string>;
        request: Request;
      }) => Promise<unknown> | unknown
    >;
    meta?: ModuleLoader<
      (input: {
        params: Record<string, string>;
        data: unknown;
      }) => Promise<RouteMeta> | RouteMeta
    >;
    page?: ModuleLoader<(input: { data: unknown }) => Promise<string> | string>;
  };
};

export type StaticPageArtifact = {
  kind: "page";
  path: string;
  outputPath: string;
  html: string;
  body?: never;
  status: number;
  headers: Record<string, string>;
};

export type StaticRouteArtifact = {
  kind: "route";
  path: string;
  outputPath: string;
  html?: never;
  body: Uint8Array;
  status: number;
  headers: Record<string, string>;
};

export type StaticArtifact = StaticPageArtifact | StaticRouteArtifact;

export type StaticAssetInput = {
  from: string;
  to?: string;
};

type BuildStaticRoutesInput = {
  routes: StaticRouteDefinition[];
};

type ExportStaticSiteInput = {
  routes: StaticRouteDefinition[];
  outDir: string;
  assets?: StaticAssetInput[];
};

export type StaticSiteExport = {
  artifacts: StaticArtifact[];
  writtenFiles: string[];
};

type PendingAssetCopy = {
  from: string;
  outputPath: string;
};

async function resolveRouteModule<T>(
  directValue: T | undefined,
  factory: ModuleLoader<T> | undefined,
): Promise<T | undefined> {
  if (directValue) return directValue;
  if (!factory) return undefined;

  const module = await factory();
  return module.default;
}

function buildConcretePath(
  routePath: string,
  entry: Record<string, string> | undefined,
) {
  let path = routePath;

  for (const [key, value] of Object.entries(entry ?? {})) {
    path = path.replace(`:${key}`, value);
  }

  return path;
}

function normalizeRoutePath(path: string) {
  return path.split("?")[0]?.replace(/\/+$/, "") || "/";
}

function hasFileExtension(path: string) {
  return basename(path).includes(".");
}

function joinOutputPath(...segments: string[]) {
  return segments.filter(Boolean).join("/");
}

function getArtifactOutputPath(kind: StaticArtifact["kind"], path: string) {
  const normalized = normalizeRoutePath(path).replace(/^\/+/, "");

  if (!normalized) {
    return "index.html";
  }

  if (kind === "route" || hasFileExtension(normalized)) {
    return normalized;
  }

  return joinOutputPath(normalized, "index.html");
}

function headersToRecord(headers: Headers) {
  return Object.fromEntries(headers.entries());
}

function resolveOutputFile(outDir: string, outputPath: string) {
  return join(outDir, ...outputPath.split("/"));
}

async function collectAssetCopies(
  assets: StaticAssetInput[] | undefined,
): Promise<PendingAssetCopy[]> {
  const copies: PendingAssetCopy[] = [];

  for (const asset of assets ?? []) {
    const sourcePath = resolve(asset.from);
    const sourceStats = await stat(sourcePath).catch(() => null);

    if (!sourceStats) {
      throw new Error(
        `Static export asset source "${asset.from}" does not exist.`,
      );
    }

    if (sourceStats.isDirectory()) {
      const destinationRoot = asset.to ?? basename(sourcePath);
      await collectDirectoryCopies({
        copies,
        root: sourcePath,
        current: sourcePath,
        destinationRoot,
      });
      continue;
    }

    if (!sourceStats.isFile()) {
      throw new Error(
        `Static export asset source "${asset.from}" must be a file or directory.`,
      );
    }

    copies.push({
      from: sourcePath,
      outputPath: asset.to ?? basename(sourcePath),
    });
  }

  return copies;
}

async function collectDirectoryCopies(input: {
  copies: PendingAssetCopy[];
  root: string;
  current: string;
  destinationRoot: string;
}) {
  const entries = await readdir(input.current, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(input.current, entry.name);
    const relativePath = relative(input.root, sourcePath).split(sep).join("/");
    const outputPath = joinOutputPath(input.destinationRoot, relativePath);

    if (entry.isDirectory()) {
      await collectDirectoryCopies({
        copies: input.copies,
        root: input.root,
        current: sourcePath,
        destinationRoot: input.destinationRoot,
      });
      continue;
    }

    if (!entry.isFile()) {
      throw new Error(
        `Static export asset source "${sourcePath}" must contain only files and directories.`,
      );
    }

    input.copies.push({
      from: sourcePath,
      outputPath,
    });
  }
}

function assertNoOutputCollisions(outputPaths: string[]) {
  const seen = new Set<string>();

  for (const outputPath of outputPaths) {
    if (seen.has(outputPath)) {
      throw new Error(`Static export collision for "${outputPath}".`);
    }

    seen.add(outputPath);
  }
}

export async function buildStaticRoutes(
  input: BuildStaticRoutesInput,
): Promise<StaticArtifact[]> {
  bindStaticRenderEnv();

  const output: StaticArtifact[] = [];

  for (const route of input.routes) {
    const entriesFactory = await resolveRouteModule(
      route.entries,
      route.files?.entries,
    );
    const entries = entriesFactory
      ? await entriesFactory()
      : route.path.includes(":")
        ? null
        : [{}];

    if (!entries) {
      throw new Error(`Route "${route.id}" is missing an entries module.`);
    }

    for (const entry of entries) {
      const path = buildConcretePath(route.path, entry);
      const request = new Request(`https://van-stack.local${path}`);
      const isRawRoute = Boolean(route.route || route.files?.route);

      if (isRawRoute) {
        const routeHandler = await resolveRouteModule(
          route.route,
          route.files?.route,
        );

        if (!routeHandler) {
          throw new Error(`Route "${route.id}" is missing a route module.`);
        }

        const response = await routeHandler({
          request,
          params: entry,
        });

        output.push({
          kind: "route",
          path,
          outputPath: getArtifactOutputPath("route", path),
          body: new Uint8Array(await response.arrayBuffer()),
          status: response.status,
          headers: headersToRecord(response.headers),
        });
        continue;
      }

      const response = await renderRequest({
        request,
        routes: [route],
      });

      output.push({
        kind: "page",
        path,
        outputPath: getArtifactOutputPath("page", path),
        html: await response.text(),
        status: response.status,
        headers: headersToRecord(response.headers),
      });
    }
  }

  return output;
}

export async function exportStaticSite(
  input: ExportStaticSiteInput,
): Promise<StaticSiteExport> {
  const artifacts = await buildStaticRoutes({ routes: input.routes });
  const assetCopies = await collectAssetCopies(input.assets);

  assertNoOutputCollisions([
    ...artifacts.map((artifact) => artifact.outputPath),
    ...assetCopies.map((copy) => copy.outputPath),
  ]);

  await mkdir(input.outDir, { recursive: true });

  const writtenFiles: string[] = [];

  for (const artifact of artifacts) {
    const outputFile = resolveOutputFile(input.outDir, artifact.outputPath);
    await mkdir(dirname(outputFile), { recursive: true });

    if (artifact.kind === "page") {
      await writeFile(outputFile, artifact.html, "utf8");
    } else {
      await writeFile(outputFile, artifact.body);
    }

    writtenFiles.push(artifact.outputPath);
  }

  for (const copy of assetCopies) {
    const outputFile = resolveOutputFile(input.outDir, copy.outputPath);
    await mkdir(dirname(outputFile), { recursive: true });
    await copyFile(copy.from, outputFile);
    writtenFiles.push(copy.outputPath);
  }

  return {
    artifacts,
    writtenFiles,
  };
}
