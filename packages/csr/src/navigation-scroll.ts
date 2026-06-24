export type NavigationScrollTarget = "top" | "preserve";

export type NavigationScrollBehavior = "auto" | "smooth" | "instant";

export type NavigationScrollOptions = {
  onNavigate?: NavigationScrollTarget;
  onPopState?: NavigationScrollTarget;
  behavior?: NavigationScrollBehavior;
};

export type NavigationScrollTransition = "navigate" | "popstate";

type ResolvedNavigationScrollOptions = Required<NavigationScrollOptions>;

type ScrollToOptionsLike = {
  top: number;
  left: number;
  behavior: NavigationScrollBehavior;
};

export type NavigationScrollWindowLike = {
  scrollTo?: (options: ScrollToOptionsLike) => unknown;
};

const defaultNavigationScrollOptions: ResolvedNavigationScrollOptions = {
  onNavigate: "top",
  onPopState: "preserve",
  behavior: "auto",
};

export function resolveNavigationScrollOptions(
  options: NavigationScrollOptions | undefined,
): ResolvedNavigationScrollOptions {
  return {
    ...defaultNavigationScrollOptions,
    ...options,
  };
}

export function applyNavigationScroll(
  window: NavigationScrollWindowLike,
  options: ResolvedNavigationScrollOptions,
  transition: NavigationScrollTransition,
) {
  const target =
    transition === "navigate" ? options.onNavigate : options.onPopState;

  if (target !== "top") {
    return;
  }

  window.scrollTo?.({
    top: 0,
    left: 0,
    behavior: options.behavior,
  });
}
