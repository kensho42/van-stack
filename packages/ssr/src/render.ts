import {
  defaultHydrationPolicy,
  matchPath,
  type RouteHandlerModule,
  type RouteLayoutModule,
  type RouteLoaderModule,
  type RouteMeta,
  type RouteMetaModule,
  type RouteModuleLoader,
  type RoutePageModule,
  type RuntimeRouteDefinition,
  type RuntimeSlotDefinition,
} from "../../core/src/index";
import { bindServerRenderEnv } from "./render-env";

type RenderRequestInput = {
  request: Request;
  routes: RuntimeRouteDefinition[];
};

type RenderablePageOutput = {
  render?: () => string;
};

type ActiveSlotState = {
  data: unknown;
  params: Record<string, string>;
  route: RuntimeSlotDefinition;
};

function getRequestPath(request: Request) {
  const url = new URL(request.url);

  return {
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildHead(meta: RouteMeta | undefined): string {
  if (!meta) return "";

  const tags: string[] = [];

  if (meta.title) {
    tags.push(`<title>${escapeHtml(meta.title)}</title>`);
  }

  if (meta.description) {
    tags.push(
      `<meta name="description" content="${escapeHtml(meta.description)}">`,
    );
  }

  if (meta.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}">`);
  }

  if (meta.openGraph?.title) {
    tags.push(
      `<meta property="og:title" content="${escapeHtml(meta.openGraph.title)}">`,
    );
  }

  if (meta.openGraph?.description) {
    tags.push(
      `<meta property="og:description" content="${escapeHtml(meta.openGraph.description)}">`,
    );
  }

  return tags.join("");
}

async function resolveRouteModule<T>(
  directValue: T | undefined,
  factory: RouteModuleLoader<T> | undefined,
): Promise<T | undefined> {
  if (directValue) return directValue;
  if (!factory) return undefined;

  const module = await factory();
  return module.default;
}

function wrapPageBody(body: string, hydrationPolicy: string | undefined) {
  if (hydrationPolicy === "app") {
    return `<div data-van-stack-app-root="">${body}</div>`;
  }

  return body;
}

function renderPageOutput(output: unknown): string {
  if (
    output &&
    typeof output === "object" &&
    typeof (output as RenderablePageOutput).render === "function"
  ) {
    return (output as RenderablePageOutput).render?.() ?? "";
  }

  return String(output ?? "");
}

function createSlotWrapper(slot: string, body: string) {
  const html = `<div data-van-stack-slot-root="${escapeHtml(slot)}">${body}</div>`;

  return {
    render: () => html,
    toString: () => html,
  };
}

function matchSlotRoute(
  slotRoutes: readonly RuntimeSlotDefinition[],
  path: string,
) {
  const pathname = new URL(path, "https://van-stack.local").pathname;
  let fallback: {
    params: Record<string, string>;
    route: RuntimeSlotDefinition;
  } | null = null;

  for (const route of slotRoutes) {
    const match = matchPath(route.path, pathname);
    if (match) {
      return {
        params: match.params,
        route,
      };
    }

    if (!fallback || route.path.length < fallback.route.path.length) {
      fallback = {
        params: {},
        route,
      };
    }
  }

  return fallback;
}

async function applyLayoutChain(
  body: unknown,
  layoutChain: readonly RouteModuleLoader<RouteLayoutModule>[] | undefined,
  data: unknown,
  params: Record<string, string>,
  path: string,
  slots: Record<string, unknown> = {},
  slotData: Record<string, unknown> = {},
) {
  let output = body;

  for (const layoutLoader of [...(layoutChain ?? [])].reverse()) {
    const module = await layoutLoader();
    output = await module.default({
      children: output,
      data,
      slots,
      slotData,
      params,
      path,
    });
  }

  return renderPageOutput(output);
}

async function resolveActiveSlots(
  route: RuntimeRouteDefinition,
  request: Request,
  path: string,
) {
  const activeSlots: Record<string, ActiveSlotState> = {};

  for (const [slot, slotRoutes] of Object.entries(route.slots ?? {})) {
    const matched = matchSlotRoute(slotRoutes, path);
    if (!matched) {
      continue;
    }

    const loader = await resolveRouteModule<RouteLoaderModule>(
      matched.route.loader,
      matched.route.files?.loader,
    );
    const data = loader
      ? await loader({
          params: matched.params,
          request,
        })
      : null;

    activeSlots[slot] = {
      route: matched.route,
      params: matched.params,
      data,
    };
  }

  return activeSlots;
}

async function renderSlotOutput(
  slot: string,
  state: ActiveSlotState,
  path: string,
) {
  const page = await resolveRouteModule<RoutePageModule>(
    state.route.page,
    state.route.files?.page,
  );

  if (!page) {
    throw new Error(
      `Named slot route "${state.route.id}" is missing a page module.`,
    );
  }

  const pageOutput = await page({ data: state.data });
  const body = await applyLayoutChain(
    pageOutput,
    state.route.layoutChain,
    state.data,
    state.params,
    path,
  );

  return createSlotWrapper(slot, body);
}

async function renderRouteBody(options: {
  data: unknown;
  page: RoutePageModule;
  params: Record<string, string>;
  path: string;
  route: RuntimeRouteDefinition;
  slotData: Record<string, unknown>;
  slotOutputs: Record<string, unknown>;
}) {
  const pageOutput = await options.page({ data: options.data });
  const ownerIndex = options.route.slotOwnerLayoutIndex;

  if (ownerIndex === undefined) {
    return applyLayoutChain(
      pageOutput,
      options.route.layoutChain,
      options.data,
      options.params,
      options.path,
    );
  }

  const childBody = await applyLayoutChain(
    pageOutput,
    options.route.layoutChain?.slice(ownerIndex + 1),
    options.data,
    options.params,
    options.path,
  );
  const ownerLoader = options.route.layoutChain?.at(ownerIndex);
  let composed: unknown = createSlotWrapper("default", childBody);

  if (ownerLoader) {
    const module = await ownerLoader();
    composed = await module.default({
      children: composed,
      data: options.data,
      slots: options.slotOutputs,
      slotData: options.slotData,
      params: options.params,
      path: options.path,
    });
  }

  return applyLayoutChain(
    composed,
    options.route.layoutChain?.slice(0, ownerIndex),
    options.data,
    options.params,
    options.path,
  );
}

export async function renderRequest(input: RenderRequestInput) {
  bindServerRenderEnv();
  const requestPath = getRequestPath(input.request);

  for (const route of input.routes) {
    const match = matchPath(route.path, requestPath.pathname);
    if (!match) continue;

    const routeHandler = await resolveRouteModule<RouteHandlerModule>(
      route.route,
      route.files?.route,
    );
    if (routeHandler) {
      return routeHandler({
        request: input.request,
        params: match.params,
      });
    }

    const loader = await resolveRouteModule<RouteLoaderModule>(
      route.loader,
      route.files?.loader,
    );
    const metaHandler = await resolveRouteModule<RouteMetaModule>(
      route.meta,
      route.files?.meta,
    );
    const page = await resolveRouteModule<RoutePageModule>(
      route.page,
      route.files?.page,
    );

    if (!page) {
      throw new Error(`Route "${route.id}" is missing a page module.`);
    }

    const hydrationPolicy = route.hydrationPolicy ?? defaultHydrationPolicy;
    const data = loader
      ? await loader({ params: match.params, request: input.request })
      : null;
    const activeSlots = await resolveActiveSlots(
      route,
      input.request,
      requestPath.path,
    );
    const slotData = Object.fromEntries(
      Object.entries(activeSlots).map(([slot, state]) => [slot, state.data]),
    );
    const slotOutputs = Object.fromEntries(
      await Promise.all(
        Object.entries(activeSlots).map(async ([slot, state]) => [
          slot,
          await renderSlotOutput(slot, state, requestPath.path),
        ]),
      ),
    );
    const meta = metaHandler
      ? await metaHandler({ params: match.params, data })
      : undefined;
    const body = wrapPageBody(
      await renderRouteBody({
        route,
        page,
        data,
        params: match.params,
        path: requestPath.path,
        slotData,
        slotOutputs,
      }),
      hydrationPolicy,
    );
    const bootstrap =
      hydrationPolicy !== "document-only"
        ? `<script type="application/json" data-van-stack-bootstrap>${JSON.stringify(
            {
              routeId: route.id,
              path: requestPath.path,
              pathname: requestPath.pathname,
              params: match.params,
              hydrationPolicy,
              data,
              slotData,
            },
          )}</script>`
        : "";

    return new Response(
      `<!doctype html><html><head>${buildHead(meta)}</head><body>${body}${bootstrap}</body></html>`,
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  }

  return new Response(
    "<!doctype html><html><head></head><body><h1>Not Found</h1></body></html>",
    {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
