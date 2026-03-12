import { renderRequest } from "../../ssr/src/render";
import { bindStaticRenderEnv } from "./render-env";

type ModuleLoader<T> = () => Promise<{ default: T }>;

type StaticRouteDefinition = {
  id: string;
  path: string;
  hydrationPolicy?: string;
  entries?: () => Promise<Record<string, string>[]> | Record<string, string>[];
  loader?: (input: {
    params: Record<string, string>;
  }) => Promise<unknown> | unknown;
  page?: (input: { data: unknown }) => Promise<string> | string;
  files?: {
    entries?: ModuleLoader<
      () => Promise<Record<string, string>[]> | Record<string, string>[]
    >;
    loader?: ModuleLoader<
      (input: { params: Record<string, string> }) => Promise<unknown> | unknown
    >;
    page?: ModuleLoader<(input: { data: unknown }) => Promise<string> | string>;
  };
};

type BuildStaticRoutesInput = {
  routes: StaticRouteDefinition[];
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

export async function buildStaticRoutes(input: BuildStaticRoutesInput) {
  bindStaticRenderEnv();

  const output: { path: string; html: string }[] = [];

  for (const route of input.routes) {
    const entriesFactory = await resolveRouteModule(
      route.entries,
      route.files?.entries,
    );
    if (!entriesFactory) {
      throw new Error(`Route "${route.id}" is missing an entries module.`);
    }

    const entries = await entriesFactory();

    for (const entry of entries) {
      let path = route.path;
      for (const [key, value] of Object.entries(entry)) {
        path = path.replace(`:${key}`, value);
      }

      const response = await renderRequest({
        request: new Request(`https://van-stack.local${path}`),
        routes: [route],
      });
      const html = await response.text();

      output.push({
        path,
        html,
      });
    }
  }

  return output;
}
