import type {
  RouterEntry,
  RuntimeRouteDefinition,
} from "../../../core/src/index";
import type { AppRootLike } from "../route-render";
import { renderEntryToRoot } from "../route-render";
import {
  addClass,
  createViewRoot,
  removeAttribute,
  replaceRootChildren,
  type StackViewRoot,
  setAttribute,
} from "./dom";
import { setPagePosition } from "./transitions";

export type StackPosition = "previous" | "current" | "next";

export type StackItem = {
  entry: RouterEntry;
  root?: StackViewRoot;
  scroll?: {
    left: number;
    top: number;
  };
};

export type PositionedStackItem = {
  item: StackItem;
  position: StackPosition;
};

export async function ensureViewRoot(
  item: StackItem,
  routes: readonly RuntimeRouteDefinition[],
) {
  if (item.root) {
    return item.root;
  }

  const viewRoot = createViewRoot();
  await renderEntryToRoot(routes, viewRoot, item.entry, null);
  item.root = viewRoot;
  return viewRoot;
}

export async function createStackItem(
  routes: readonly RuntimeRouteDefinition[],
  entry: RouterEntry,
): Promise<StackItem> {
  const item: StackItem = { entry };
  await ensureViewRoot(item, routes);
  return item;
}

export async function ensurePositionedRoots(
  routes: readonly RuntimeRouteDefinition[],
  positioned: PositionedStackItem[],
) {
  for (const positionedItem of positioned) {
    await ensureViewRoot(positionedItem.item, routes);
  }
}

export function syncRoot(root: AppRootLike, positioned: PositionedStackItem[]) {
  for (const { item, position } of positioned) {
    if (!item.root) continue;

    setAttribute(item.root, "data-van-stack-view", "");
    setAttribute(item.root, "data-van-stack-stack-position", position);
    setAttribute(item.root, "data-van-stack-path", item.entry.path);
    setPagePosition(item.root, position);

    if (position === "current") {
      removeAttribute(item.root, "aria-hidden");
    } else {
      setAttribute(item.root, "aria-hidden", "true");
    }
  }

  addClass(root as StackViewRoot, "van-stack-root");
  setAttribute(root as StackViewRoot, "data-van-stack-stack-root", "");
  replaceRootChildren(
    root as StackViewRoot,
    positioned
      .map(({ item }) => item.root)
      .filter((viewRoot): viewRoot is StackViewRoot => Boolean(viewRoot)),
  );
}

export function getRetainedItems(
  stack: StackItem[],
  retention: "current" | "previous" | "all",
): PositionedStackItem[] {
  if (stack.length === 0) {
    return [];
  }

  const currentIndex = stack.length - 1;
  if (retention === "all") {
    return stack.map((item, index) => ({
      item,
      position: index === currentIndex ? "current" : "previous",
    }));
  }

  if (retention === "previous" && stack.length > 1) {
    return [
      { item: stack[currentIndex - 1] as StackItem, position: "previous" },
      { item: stack[currentIndex] as StackItem, position: "current" },
    ];
  }

  return [{ item: stack[currentIndex] as StackItem, position: "current" }];
}

export function pruneUnmountedRoots(
  stack: StackItem[],
  positioned: PositionedStackItem[],
) {
  const retained = new Set(positioned.map(({ item }) => item));
  for (const item of stack) {
    if (!retained.has(item)) {
      item.root = undefined;
    }
  }
}
