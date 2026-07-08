import { expectTypeOf, test } from "vitest";

import type {
  RouteDataContext,
  RouteNavigation,
  Router,
  RouterBackOptions,
  RouterBackResult,
  RuntimeRouteDefinition,
} from "../../packages/core/src/index";
import type {
  HydrateAppOptions,
  NavigationScrollOptions,
  StartClientAppOptions,
} from "../../packages/csr/src/index";
import { stackPresentation } from "../../packages/csr/src/stack";

test("startClientApp accepts eager and lazy route records", () => {
  const eagerOptions: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "eager",
        path: "/eager",
        page() {
          return "eager";
        },
      },
    ],
  };
  const lazyOptions: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "lazy",
        path: "/lazy",
        files: {
          async page() {
            return {
              default() {
                return "lazy";
              },
            };
          },
        },
      },
    ],
  };

  expectTypeOf(eagerOptions.routes[0]).toMatchTypeOf<
    StartClientAppOptions["routes"][number]
  >();
  expectTypeOf(lazyOptions.routes[0]).toMatchTypeOf<
    StartClientAppOptions["routes"][number]
  >();
});

test("startClientApp accepts readonly generated route arrays", () => {
  const generatedRoutes = [
    {
      id: "generated",
      path: "/generated",
      files: {
        async page() {
          return {
            default() {
              return "generated";
            },
          };
        },
      },
      layoutChain: [],
    },
  ] as const;

  const options: StartClientAppOptions = {
    mode: "custom",
    history: {
      pushState() {},
    },
    routes: generatedRoutes,
  };

  expectTypeOf(generatedRoutes).toMatchTypeOf<
    readonly RuntimeRouteDefinition[]
  >();
  expectTypeOf(options.routes).toMatchTypeOf<
    readonly RuntimeRouteDefinition[]
  >();
});

test("startClientApp accepts navigation scroll options", () => {
  const scroll: NavigationScrollOptions = {
    onNavigate: "top",
    onPopState: "preserve",
    behavior: "instant",
  };
  const options: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "home",
        path: "/",
        page() {
          return "home";
        },
      },
    ],
    scroll,
  };

  expectTypeOf(options.scroll).toMatchTypeOf<
    NavigationScrollOptions | undefined
  >();
});

test("startClientApp accepts stack presentation for shell and custom modes only", () => {
  const shellOptions: StartClientAppOptions = {
    mode: "shell",
    history: {
      pushState() {},
    },
    routes: [
      {
        id: "home",
        path: "/",
        page() {
          return "home";
        },
      },
    ],
    presentation: stackPresentation(),
  };
  const customOptions: StartClientAppOptions = {
    mode: "custom",
    history: {
      pushState() {},
    },
    routes: shellOptions.routes,
    presentation: stackPresentation({
      duration: 240,
      platform: "auto",
      retention: "previous",
      swipeBack: {
        activeArea: 30,
        commitRatio: 0.5,
        enabled: "auto",
        fastSwipeDistance: 10,
        fastSwipeMs: 300,
        opacity: true,
        shadow: true,
        threshold: 0,
      },
      transition: "platform",
    }),
  };

  expectTypeOf(shellOptions.presentation).toMatchTypeOf<object | undefined>();
  expectTypeOf(customOptions.presentation).toMatchTypeOf<object | undefined>();

  const hydratedOptions = {
    mode: "hydrated",
    history: {
      pushState() {},
    },
    routes: shellOptions.routes,
    bootstrap: {
      pathname: "/",
      hydrationPolicy: "app",
      data: undefined,
    },
    presentation: stackPresentation(),
  };

  expectTypeOf(hydratedOptions).not.toMatchTypeOf<StartClientAppOptions>();
});

test("routes accept navigation policy modules", () => {
  const navigation: RouteNavigation = {
    animate: true,
    enter: "push",
    retention: "previous",
    swipeBack: true,
    transition: "ios-slide",
    up: "/posts",
  };
  const route = {
    id: "posts/[slug]",
    path: "/posts/:slug",
    navigation,
    files: {
      async navigation() {
        return { default: navigation };
      },
    },
  } satisfies RuntimeRouteDefinition;

  expectTypeOf(route).toMatchTypeOf<RuntimeRouteDefinition>();
});

test("hydrateApp accepts navigation scroll options", () => {
  const options: HydrateAppOptions = {
    routes: [
      {
        id: "home",
        path: "/",
      },
    ],
    scroll: {
      onNavigate: "preserve",
      onPopState: "top",
      behavior: "smooth",
    },
  };

  expectTypeOf(options.scroll).toMatchTypeOf<
    NavigationScrollOptions | undefined
  >();
});

test("client routers expose managed back navigation", () => {
  const options: RouterBackOptions = {
    fallback: "/posts",
  };

  expectTypeOf(options).toMatchTypeOf<Parameters<Router["back"]>[0]>();
  expectTypeOf<ReturnType<Router["back"]>>().toEqualTypeOf<
    Promise<RouterBackResult>
  >();
  expectTypeOf<ReturnType<Router["canGoBack"]>>().toEqualTypeOf<boolean>();
});

test("route pages can read matched URL context", () => {
  const route = {
    id: "new-esim/[iccid]",
    path: "/new-esim/:iccid",
    page(input) {
      expectTypeOf(input).toMatchTypeOf<RouteDataContext>();

      return [
        input.params.iccid,
        input.query.get("step"),
        input.path,
        input.pathname,
        input.data,
      ].join(":");
    },
  } satisfies RuntimeRouteDefinition;

  expectTypeOf(route).toMatchTypeOf<RuntimeRouteDefinition>();
});
