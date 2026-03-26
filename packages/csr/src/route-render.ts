import {
  matchPath,
  type RouteHydrateModule,
  type RouteLayoutModule,
  type RouteModuleLoader,
  type RoutePageModule,
  type RouterEntry,
  type RuntimeRouteDefinition,
  type RuntimeSlotDefinition,
} from "../../core/src/index";
import { van } from "../../core/src/render";

export type AppRootLike = {
  innerHTML?: string;
  querySelector?: (selector: string) => unknown;
  replaceChildren?: (...children: unknown[]) => void;
};

type ActiveSlotState = {
  data: unknown;
  key: string;
  params: Record<string, string>;
  route: RuntimeSlotDefinition;
};

type MountedSlotState = {
  defaultKey: string;
  defaultRoot: AppRootLike;
  ownerId: string;
  ownerIndex: number;
  slotKeys: Record<string, string>;
  slotNames: string[];
  slotRoots: Record<string, AppRootLike>;
};

export type RenderedEntry = {
  match: {
    params: Record<string, string>;
    route: RuntimeRouteDefinition;
  };
  mountedSlots: MountedSlotState | null;
  updatedDefault: boolean;
  updatedSlots: string[];
};

function serializeBranchValue(value: unknown) {
  try {
    return JSON.stringify(value) ?? "null";
  } catch {
    return String(value ?? "");
  }
}

function buildBranchKey(
  routeId: string,
  params: Record<string, string>,
  data: unknown,
) {
  return `${routeId}|${serializeBranchValue(params)}|${serializeBranchValue(data)}`;
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function resolveRouteModule<T>(
  directValue: T | undefined,
  factory: RouteModuleLoader<T> | undefined,
) {
  if (directValue) return directValue;
  if (!factory) return undefined;

  const module = await factory();
  return module.default;
}

export function findMatchedRoute(
  routes: RuntimeRouteDefinition[],
  path: string,
) {
  const pathname = new URL(path, "https://van-stack.local").pathname;

  for (const route of routes) {
    const match = matchPath(route.path, pathname);
    if (!match) {
      continue;
    }

    return {
      params: match.params,
      route,
    };
  }

  throw new Error(`No route matched path: ${path}`);
}

export function tryFindMatchedRoute(
  routes: RuntimeRouteDefinition[],
  path: string,
) {
  try {
    return findMatchedRoute(routes, path);
  } catch {
    return null;
  }
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

function resolveActiveSlots(
  route: RuntimeRouteDefinition,
  path: string,
  slotData: Record<string, unknown> | undefined,
) {
  const activeSlots: Record<string, ActiveSlotState> = {};

  for (const [slot, slotRoutes] of Object.entries(route.slots ?? {})) {
    const matched = matchSlotRoute(slotRoutes, path);
    if (!matched) {
      continue;
    }

    const data = slotData?.[slot];
    activeSlots[slot] = {
      route: matched.route,
      params: matched.params,
      data,
      key: buildBranchKey(matched.route.id, matched.params, data),
    };
  }

  return activeSlots;
}

async function applyLayouts(
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

  return output;
}

function renderOutputToHtml(output: { render: () => string }) {
  return output.render();
}

function createSlotWrapper(slot: string, output: unknown) {
  const wrapper = van.tags.div as ((...args: unknown[]) => unknown) | undefined;

  if (typeof wrapper === "function") {
    return wrapper({ "data-van-stack-slot-root": slot }, output);
  }

  const body =
    output &&
    typeof output === "object" &&
    "render" in output &&
    typeof output.render === "function"
      ? renderOutputToHtml(output as { render: () => string })
      : String(output ?? "");

  return {
    render: () =>
      `<div data-van-stack-slot-root="${escapeAttribute(slot)}">${body}</div>`,
    toString: () =>
      `<div data-van-stack-slot-root="${escapeAttribute(slot)}">${body}</div>`,
  };
}

function isMountTarget(value: unknown): value is AppRootLike {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof (value as AppRootLike).replaceChildren === "function" ||
    "innerHTML" in (value as AppRootLike)
  );
}

function getMountedSlotRoot(
  appRoot: AppRootLike,
  slot: string,
  candidate: unknown,
) {
  if (isMountTarget(candidate)) {
    return candidate;
  }

  return (
    (appRoot.querySelector?.(
      `[data-van-stack-slot-root="${slot}"]`,
    ) as AppRootLike | null) ?? null
  );
}

export function mountRouteOutput(root: AppRootLike, output: unknown) {
  if (
    output &&
    typeof output === "object" &&
    "render" in output &&
    typeof output.render === "function"
  ) {
    root.innerHTML = renderOutputToHtml(output as { render: () => string });
    return;
  }

  if (typeof output === "string") {
    root.innerHTML = output;
    return;
  }

  root.replaceChildren?.();
  van.add(root as never, output as never);
}

async function renderDefaultBody(
  route: RuntimeRouteDefinition,
  page: RoutePageModule,
  data: unknown,
  params: Record<string, string>,
  path: string,
) {
  const pageOutput = await page({ data });
  const ownerIndex = route.slotOwnerLayoutIndex;

  if (ownerIndex === undefined) {
    return applyLayouts(pageOutput, route.layoutChain, data, params, path);
  }

  return applyLayouts(
    pageOutput,
    route.layoutChain?.slice(ownerIndex + 1),
    data,
    params,
    path,
  );
}

async function renderSlotBody(state: ActiveSlotState, path: string) {
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
  return applyLayouts(
    pageOutput,
    state.route.layoutChain,
    state.data,
    state.params,
    path,
  );
}

async function mountFreshRoute(
  root: AppRootLike,
  match: ReturnType<typeof findMatchedRoute>,
  entry: RouterEntry,
  page: RoutePageModule,
) {
  const ownerId = match.route.slotOwnerLayout;
  const ownerIndex = match.route.slotOwnerLayoutIndex;

  if (ownerId === undefined || ownerIndex === undefined) {
    const output = await renderDefaultBody(
      match.route,
      page,
      entry.data,
      match.params,
      entry.path,
    );
    mountRouteOutput(root, output);
    return {
      mountedSlots: null,
      updatedDefault: true,
      updatedSlots: [],
    };
  }

  const activeSlots = resolveActiveSlots(
    match.route,
    entry.path,
    entry.slotData,
  );
  const defaultBody = await renderDefaultBody(
    match.route,
    page,
    entry.data,
    match.params,
    entry.path,
  );
  const defaultWrapper = createSlotWrapper("default", defaultBody);
  const slotData = entry.slotData ?? {};
  const slotOutputs: Record<string, unknown> = {};

  for (const [slot, state] of Object.entries(activeSlots)) {
    slotOutputs[slot] = createSlotWrapper(
      slot,
      await renderSlotBody(state, entry.path),
    );
  }

  let composed: unknown = defaultWrapper;
  const ownerLoader = match.route.layoutChain?.at(ownerIndex);
  if (ownerLoader) {
    const ownerModule = await ownerLoader();
    composed = await ownerModule.default({
      children: defaultWrapper,
      data: entry.data,
      slots: slotOutputs,
      slotData,
      params: match.params,
      path: entry.path,
    });
  }

  const output = await applyLayouts(
    composed,
    match.route.layoutChain?.slice(0, ownerIndex),
    entry.data,
    match.params,
    entry.path,
  );
  mountRouteOutput(root, output);

  const defaultRoot = getMountedSlotRoot(root, "default", defaultWrapper);
  if (!defaultRoot) {
    return {
      mountedSlots: null,
      updatedDefault: true,
      updatedSlots: [],
    };
  }

  const slotNames = Object.keys(activeSlots).sort();
  const slotRoots = Object.fromEntries(
    slotNames.map((slot) => [
      slot,
      getMountedSlotRoot(root, slot, slotOutputs[slot]),
    ]),
  ) as Record<string, AppRootLike | null>;

  if (Object.values(slotRoots).some((slotRoot) => !slotRoot)) {
    return {
      mountedSlots: null,
      updatedDefault: true,
      updatedSlots: slotNames,
    };
  }

  return {
    mountedSlots: {
      ownerId,
      ownerIndex,
      defaultRoot,
      defaultKey: buildBranchKey(match.route.id, match.params, entry.data),
      slotNames,
      slotKeys: Object.fromEntries(
        Object.entries(activeSlots).map(([slot, state]) => [slot, state.key]),
      ),
      slotRoots: slotRoots as Record<string, AppRootLike>,
    } satisfies MountedSlotState,
    updatedDefault: true,
    updatedSlots: slotNames,
  };
}

export function captureMountedSlotState(
  root: AppRootLike,
  route: RuntimeRouteDefinition,
  params: Record<string, string>,
  entry: RouterEntry,
) {
  const ownerId = route.slotOwnerLayout;
  const ownerIndex = route.slotOwnerLayoutIndex;

  if (ownerId === undefined || ownerIndex === undefined) {
    return null;
  }

  const activeSlots = resolveActiveSlots(route, entry.path, entry.slotData);
  const defaultRoot = getMountedSlotRoot(root, "default", null);
  if (!defaultRoot) {
    return null;
  }

  const slotNames = Object.keys(activeSlots).sort();
  const slotRoots = Object.fromEntries(
    slotNames.map((slot) => [slot, getMountedSlotRoot(root, slot, null)]),
  ) as Record<string, AppRootLike | null>;

  if (Object.values(slotRoots).some((slotRoot) => !slotRoot)) {
    return null;
  }

  return {
    ownerId,
    ownerIndex,
    defaultRoot,
    defaultKey: buildBranchKey(route.id, params, entry.data),
    slotNames,
    slotKeys: Object.fromEntries(
      Object.entries(activeSlots).map(([slot, state]) => [slot, state.key]),
    ),
    slotRoots: slotRoots as Record<string, AppRootLike>,
  } satisfies MountedSlotState;
}

export async function renderEntryToRoot(
  routes: RuntimeRouteDefinition[],
  root: AppRootLike,
  entry: RouterEntry,
  mountedSlots: MountedSlotState | null,
): Promise<RenderedEntry> {
  const match = findMatchedRoute(routes, entry.path);
  const page = await resolveRouteModule<RoutePageModule>(
    match.route.page,
    match.route.files?.page,
  );

  if (!page) {
    throw new Error(`Route "${match.route.id}" is missing a page module.`);
  }

  const ownerId = match.route.slotOwnerLayout;
  const ownerIndex = match.route.slotOwnerLayoutIndex;
  if (!mountedSlots && ownerId !== undefined && ownerIndex !== undefined) {
    mountedSlots = captureMountedSlotState(
      root,
      match.route,
      match.params,
      entry,
    );
  }

  if (
    !mountedSlots ||
    ownerId === undefined ||
    ownerIndex === undefined ||
    mountedSlots.ownerId !== ownerId ||
    mountedSlots.ownerIndex !== ownerIndex
  ) {
    const fresh = await mountFreshRoute(root, match, entry, page);
    return {
      match,
      mountedSlots: fresh.mountedSlots,
      updatedDefault: fresh.updatedDefault,
      updatedSlots: fresh.updatedSlots,
    };
  }

  const activeSlots = resolveActiveSlots(
    match.route,
    entry.path,
    entry.slotData,
  );
  const slotNames = Object.keys(activeSlots).sort();
  if (
    slotNames.length !== mountedSlots.slotNames.length ||
    slotNames.some((slot, index) => slot !== mountedSlots.slotNames[index])
  ) {
    const fresh = await mountFreshRoute(root, match, entry, page);
    return {
      match,
      mountedSlots: fresh.mountedSlots,
      updatedDefault: fresh.updatedDefault,
      updatedSlots: fresh.updatedSlots,
    };
  }

  let updatedDefault = false;
  const updatedSlots: string[] = [];
  const nextDefaultKey = buildBranchKey(
    match.route.id,
    match.params,
    entry.data,
  );
  if (mountedSlots.defaultKey !== nextDefaultKey) {
    const defaultBody = await renderDefaultBody(
      match.route,
      page,
      entry.data,
      match.params,
      entry.path,
    );
    mountRouteOutput(mountedSlots.defaultRoot, defaultBody);
    mountedSlots.defaultKey = nextDefaultKey;
    updatedDefault = true;
  }

  for (const [slot, state] of Object.entries(activeSlots)) {
    if (mountedSlots.slotKeys[slot] === state.key) {
      continue;
    }

    const slotRoot = mountedSlots.slotRoots[slot];
    if (!slotRoot) {
      const fresh = await mountFreshRoute(root, match, entry, page);
      return {
        match,
        mountedSlots: fresh.mountedSlots,
        updatedDefault: fresh.updatedDefault,
        updatedSlots: fresh.updatedSlots,
      };
    }

    mountRouteOutput(slotRoot, await renderSlotBody(state, entry.path));
    mountedSlots.slotKeys[slot] = state.key;
    updatedSlots.push(slot);
  }

  return {
    match,
    mountedSlots,
    updatedDefault,
    updatedSlots,
  };
}

type RunRouteHydrateInput = {
  data: unknown;
  params: Record<string, string>;
  path: string;
  root: AppRootLike;
};

async function runRouteHydrate(
  route: {
    files?: Pick<NonNullable<RuntimeRouteDefinition["files"]>, "hydrate">;
    hydrate?: RouteHydrateModule;
  },
  input: RunRouteHydrateInput,
) {
  const hydrateFactory = route.files?.hydrate;
  const hydrate =
    route.hydrate ??
    (hydrateFactory ? (await hydrateFactory()).default : undefined);
  if (!hydrate) {
    return false;
  }

  await hydrate(input);
  return true;
}

export async function applyInitialRouteStrategy(
  route: RuntimeRouteDefinition,
  entry: RouterEntry,
  params: Record<string, string>,
  root: AppRootLike,
) {
  const defaultRoot =
    route.slotOwnerLayoutIndex === undefined
      ? root
      : (getMountedSlotRoot(root, "default", null) ?? root);

  const defaultEnhanced = await runRouteHydrate(route, {
    root: defaultRoot,
    data: entry.data,
    params,
    path: entry.path,
  });

  if (!defaultEnhanced) {
    const page = await resolveRouteModule<RoutePageModule>(
      route.page,
      route.files?.page,
    );
    if (!page) {
      throw new Error(`Route "${route.id}" is missing a page module.`);
    }

    mountRouteOutput(
      defaultRoot,
      await renderDefaultBody(route, page, entry.data, params, entry.path),
    );
  }

  if (route.slotOwnerLayoutIndex === undefined) {
    return;
  }

  const activeSlots = resolveActiveSlots(route, entry.path, entry.slotData);
  await Promise.all(
    Object.entries(activeSlots).map(async ([slot, state]) => {
      const slotRoot = getMountedSlotRoot(root, slot, null);
      if (!slotRoot) {
        return;
      }

      const slotEnhanced = await runRouteHydrate(state.route, {
        root: slotRoot,
        data: state.data,
        params: state.params,
        path: entry.path,
      });

      if (slotEnhanced) {
        return;
      }

      mountRouteOutput(slotRoot, await renderSlotBody(state, entry.path));
    }),
  );
}

export async function enhanceRenderedEntry(
  root: AppRootLike,
  entry: RouterEntry,
  rendered: RenderedEntry,
) {
  const { match, updatedDefault, updatedSlots } = rendered;
  const route = match.route;

  if (updatedDefault) {
    const defaultRoot =
      route.slotOwnerLayoutIndex === undefined
        ? root
        : (getMountedSlotRoot(root, "default", null) ?? root);

    await runRouteHydrate(route, {
      root: defaultRoot,
      data: entry.data,
      params: match.params,
      path: entry.path,
    });
  }

  if (!updatedSlots.length) {
    return;
  }

  const activeSlots = resolveActiveSlots(route, entry.path, entry.slotData);
  await Promise.all(
    updatedSlots.map(async (slot) => {
      const state = activeSlots[slot];
      if (!state) {
        return;
      }

      const slotRoot = getMountedSlotRoot(root, slot, null);
      if (!slotRoot) {
        return;
      }

      await runRouteHydrate(state.route, {
        root: slotRoot,
        data: state.data,
        params: state.params,
        path: entry.path,
      });
    }),
  );
}

type RenderQueue = ((entry: RouterEntry) => Promise<RenderedEntry>) & {
  prime: (entry: RouterEntry | null) => void;
};

export function createRenderQueue(
  routes: RuntimeRouteDefinition[],
  root: AppRootLike,
  afterRender?: (entry: RouterEntry, rendered: RenderedEntry) => Promise<void>,
) {
  let activeRender = Promise.resolve();
  let mountedSlots: MountedSlotState | null = null;

  const render = (entry: RouterEntry) => {
    const next = activeRender
      .catch(() => undefined)
      .then(async () => {
        const rendered = await renderEntryToRoot(
          routes,
          root,
          entry,
          mountedSlots,
        );
        mountedSlots = rendered.mountedSlots;
        if (afterRender) {
          await afterRender(entry, rendered);
        }
        return rendered;
      });

    activeRender = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  return Object.assign(render, {
    prime(entry: RouterEntry | null) {
      if (!entry) {
        mountedSlots = null;
        return;
      }

      const match = tryFindMatchedRoute(routes, entry.path);
      if (!match) {
        mountedSlots = null;
        return;
      }

      mountedSlots = captureMountedSlotState(
        root,
        match.route,
        match.params,
        entry,
      );
    },
  }) satisfies RenderQueue;
}
