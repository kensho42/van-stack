import type {
  HistoryLike,
  RouteNavigation,
  RouteNavigationRetention,
  RouteNavigationTransition,
  RouterBackOptions,
  RouterBackResult,
  RouterEntry,
  RuntimeRouteDefinition,
} from "../../../core/src/index";
import type {
  ClientNavigationAction,
  ClientNavigationIntent,
  ClientPresentation,
  ClientPresentationRenderInput,
  ClientPresentationWindowLike,
} from "../presentation";
import { findMatchedRoute, resolveRouteModule } from "../route-render";
import type { StackViewRoot } from "./dom";
import {
  createSwipeBackController,
  type StackSwipeBackOptions,
} from "./gestures";
import {
  createStackItem,
  ensurePositionedRoots,
  ensureViewRoot,
  getRetainedItems,
  pruneUnmountedRoots,
  type StackItem,
  syncRoot,
} from "./state";
import { ensureStackStyles } from "./styles";
import {
  clearTransitionRoot,
  resolveRetention,
  resolveTransition,
  type StackPlatform,
  setTransitionRoot,
  waitForTransition,
} from "./transitions";

export type StackNavigationAction = ClientNavigationAction;
export type StackNavigationIntent = ClientNavigationIntent;

export type StackPresentationOptions = {
  action?: (input: {
    from: RouterEntry | null;
    intent: StackNavigationIntent;
    routeNavigation?: RouteNavigation;
    to: RouterEntry;
  }) => StackNavigationAction | Promise<StackNavigationAction>;
  animate?: boolean;
  duration?: number;
  initial?: "leaf";
  platform?: StackPlatform;
  retention?: RouteNavigationRetention;
  styles?: boolean;
  swipeBack?: StackSwipeBackOptions;
  transition?: RouteNavigationTransition;
};

export type StackPresentation = ClientPresentation & {
  back: (options?: RouterBackOptions) => Promise<RouterBackResult>;
  canGoBack: () => boolean;
};

async function resolveRouteNavigation(
  routes: readonly RuntimeRouteDefinition[],
  entry: RouterEntry,
) {
  const match = findMatchedRoute(routes, entry.path);
  return resolveRouteModule<RouteNavigation>(
    match.route.navigation,
    match.route.files?.navigation,
    match.route,
  );
}

function setHistory(
  history: HistoryLike,
  action: Exclude<StackNavigationAction, "pop">,
  entry: RouterEntry,
) {
  if (action === "push") {
    history.pushState({ path: entry.path }, "", entry.path);
    return;
  }

  if (history.replaceState) {
    history.replaceState({ path: entry.path }, "", entry.path);
    return;
  }

  history.pushState({ path: entry.path }, "", entry.path);
}

function findStackIndex(stack: readonly StackItem[], entry: RouterEntry) {
  return stack.findIndex((item) => item.entry.path === entry.path);
}

function currentItem(stack: readonly StackItem[]) {
  return stack[stack.length - 1] ?? null;
}

function getWindowScroll(window: ClientPresentationWindowLike) {
  return {
    left: window.scrollX ?? window.pageXOffset ?? 0,
    top: window.scrollY ?? window.pageYOffset ?? 0,
  };
}

function saveItemScroll(
  item: StackItem | null,
  window: ClientPresentationWindowLike,
) {
  if (!item) return;
  item.scroll = getWindowScroll(window);
}

function getItemScroll(item: StackItem) {
  return item.scroll ?? { left: 0, top: 0 };
}

function restoreWindowScroll(
  window: ClientPresentationWindowLike,
  scroll: { left: number; top: number },
) {
  window.scrollTo?.({
    top: scroll.top,
    left: scroll.left,
    behavior: "auto",
  });
}

async function syncRetainedRoot(
  input: ClientPresentationRenderInput,
  stack: StackItem[],
  retention: RouteNavigationRetention,
) {
  const retained = getRetainedItems(stack, retention);
  await ensurePositionedRoots(input.routes, retained);
  syncRoot(input.root, retained);
  pruneUnmountedRoots(stack, retained);
}

export function stackPresentation(
  options: StackPresentationOptions = {},
): StackPresentation {
  let stack: StackItem[] = [];
  let latestInput: ClientPresentationRenderInput | null = null;
  let currentNavigation: RouteNavigation | undefined;
  let suppressNextPopPath: string | null = null;
  let queue = Promise.resolve();

  async function resolveAction(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
  ) {
    if (input.action) {
      return input.action;
    }
    if (options.action) {
      return options.action({
        from: input.from,
        intent: input.intent,
        routeNavigation,
        to: input.entry,
      });
    }
    if (input.intent === "popstate") {
      return "pop";
    }
    if (input.intent === "load") {
      return "replace";
    }
    return routeNavigation?.enter ?? "replace";
  }

  async function runTransition(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
    direction: "forward" | "backward",
    before: () => Promise<void> | void,
    during: () => Promise<void> | void,
    after: () => Promise<void> | void,
  ) {
    const transition = resolveTransition(options, routeNavigation);

    await before();
    if (transition.animate) {
      setTransitionRoot(input.root as StackViewRoot, transition, direction);
      (input.root as StackViewRoot).getBoundingClientRect?.();
      await during();
      await waitForTransition(input.root as StackViewRoot, transition);
      clearTransitionRoot(input.root as StackViewRoot, transition, direction);
    }
    await after();
  }

  async function applyPush(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
  ) {
    const previous = currentItem(stack);
    const next = await createStackItem(input.routes, input.entry);
    const nextStack = [...stack, next];
    const retention = resolveRetention(options, routeNavigation);

    if (!previous) {
      stack = nextStack;
      await syncRetainedRoot(input, stack, retention);
      return;
    }

    saveItemScroll(previous, input.window);
    await ensureViewRoot(previous, input.routes);
    await runTransition(
      input,
      routeNavigation,
      "forward",
      async () => {
        syncRoot(input.root, [
          { item: previous, position: "current" },
          { item: next, position: "next" },
        ]);
      },
      async () => {
        syncRoot(input.root, [
          { item: previous, position: "previous" },
          { item: next, position: "current" },
        ]);
      },
      async () => {
        stack = nextStack;
        await syncRetainedRoot(input, stack, retention);
      },
    );
  }

  async function applyReplaceOrReset(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
    action: "replace" | "reset",
  ) {
    const next = await createStackItem(input.routes, input.entry);
    stack =
      action === "replace" && stack.length > 0
        ? [...stack.slice(0, -1), next]
        : [next];
    await syncRetainedRoot(
      input,
      stack,
      resolveRetention(options, routeNavigation),
    );
  }

  async function applyPop(
    input: ClientPresentationRenderInput,
    routeNavigation: RouteNavigation | undefined,
  ) {
    const existingIndex = findStackIndex(stack, input.entry);
    if (existingIndex < 0) {
      stack = [await createStackItem(input.routes, input.entry)];
      await syncRetainedRoot(
        input,
        stack,
        resolveRetention(options, routeNavigation),
      );
      return;
    }

    const previous = stack[existingIndex] as StackItem;
    const outgoing = currentItem(stack);
    const nextStack = stack.slice(0, existingIndex + 1);
    const retention = resolveRetention(options, routeNavigation);

    if (!outgoing || outgoing === previous) {
      stack = nextStack;
      await syncRetainedRoot(input, stack, retention);
      return;
    }

    await ensureViewRoot(previous, input.routes);
    await ensureViewRoot(outgoing, input.routes);
    await runTransition(
      input,
      routeNavigation,
      "backward",
      async () => {
        syncRoot(input.root, [
          { item: previous, position: "previous" },
          { item: outgoing, position: "current" },
        ]);
      },
      async () => {
        syncRoot(input.root, [
          { item: previous, position: "current" },
          { item: outgoing, position: "next" },
        ]);
      },
      async () => {
        stack = nextStack;
        await syncRetainedRoot(input, stack, retention);
      },
    );
  }

  async function applyAction(
    input: ClientPresentationRenderInput,
    action: StackNavigationAction,
    routeNavigation: RouteNavigation | undefined,
  ) {
    if (action === "pop") {
      await applyPop(input, routeNavigation);
      return;
    }

    if (action === "push") {
      await applyPush(input, routeNavigation);
    } else {
      await applyReplaceOrReset(input, routeNavigation, action);
    }

    if (input.intent === "navigate") {
      setHistory(input.history, action, input.entry);
    }
  }

  async function commitSwipeBack() {
    if (!latestInput || stack.length <= 1) return undefined;

    const input = latestInput;
    const previous = stack[stack.length - 2] as StackItem;
    const outgoing = stack[stack.length - 1] as StackItem;
    const nextStack = stack.slice(0, -1);
    const previousScroll = getItemScroll(previous);
    const routeNavigation = await resolveRouteNavigation(
      input.routes,
      previous.entry,
    );
    const retention = resolveRetention(options, routeNavigation);

    await ensureViewRoot(previous, input.routes);
    await ensureViewRoot(outgoing, input.routes);
    syncRoot(input.root, [
      { item: previous, position: "current" },
      { item: outgoing, position: "next" },
    ]);
    suppressNextPopPath = previous.entry.path;

    return {
      async finish() {
        stack = nextStack;
        await syncRetainedRoot(input, stack, retention);
        restoreWindowScroll(input.window, previousScroll);

        if (input.history.back) {
          input.history.back();
        } else {
          await input.navigate(previous.entry.path, "pop");
        }
      },
    };
  }

  const swipeBack = createSwipeBackController({
    canStart() {
      if (stack.length <= 1) return null;
      const previous = stack[stack.length - 2];
      const current = stack[stack.length - 1];
      if (!previous?.root || !current?.root) return null;
      const currentScroll = latestInput
        ? getWindowScroll(latestInput.window)
        : { left: 0, top: 0 };
      const previousScroll = getItemScroll(previous);
      return {
        current: current.root,
        previous: previous.root,
        previousOffsetY: currentScroll.top - previousScroll.top,
      };
    },
    commit: commitSwipeBack,
    getRouteNavigation() {
      return currentNavigation;
    },
    getSettleDuration() {
      const transition = resolveTransition(options, currentNavigation);
      return transition.animate ? transition.duration : 0;
    },
    options: options.swipeBack,
  });

  async function renderQueued(input: ClientPresentationRenderInput) {
    if (options.styles !== false) {
      ensureStackStyles();
    }

    latestInput = input;
    swipeBack?.update(input.root as StackViewRoot);
    currentNavigation = await resolveRouteNavigation(input.routes, input.entry);

    if (
      input.intent === "popstate" &&
      suppressNextPopPath &&
      suppressNextPopPath === input.entry.path
    ) {
      suppressNextPopPath = null;
      return;
    }

    const action = await resolveAction(input, currentNavigation);
    await applyAction(input, action, currentNavigation);
  }

  return {
    async back(options?: RouterBackOptions) {
      if (stack.length > 1 && latestInput?.history.back) {
        latestInput.history.back();
        return "history";
      }

      const fallback = options?.fallback ?? currentNavigation?.up;
      if (fallback && latestInput) {
        await latestInput.navigate(fallback, "replace");
        return "fallback";
      }

      return "none";
    },
    canGoBack() {
      return stack.length > 1 && Boolean(latestInput?.history.back);
    },
    dispose() {
      swipeBack?.dispose();
    },
    render(input) {
      const run = queue.then(() => renderQueued(input));
      queue = run.catch(() => {});
      return run;
    },
  };
}
