# Adaptive Navigation

Navigation presentation is separate from route matching.

The MVP supports:

- `replace`
- `stack`

`stack` is an optional CSR presentation engine:

```ts
import { startClientApp } from "van-stack/csr";
import { stackPresentation } from "van-stack/csr/stack";

startClientApp({
  mode: "shell",
  routes,
  history: window.history,
  presentation: stackPresentation({
    platform: "auto",
    retention: "previous",
    swipeBack: { enabled: "auto" },
    transition: "platform",
  }),
});
```

Routes can declare default transition intent with `navigation.ts`:

```ts
// src/routes/posts/[slug]/navigation.ts
export default {
  enter: "push",
  retention: "previous",
  swipeBack: true,
  transition: "ios-slide",
  up: "/posts",
};
```

Stack presentation uses Framework7-style page positions: previous, current, and next. The default `retention: "previous"` keeps the current view and immediate previous view mounted so transitions and iOS-style edge swipe-back can reveal the page underneath. `retention: "current"` keeps only the active view mounted after transitions, and `retention: "all"` keeps every pushed view mounted.

Routes can opt out of edge swipe-back by setting `swipeBack: false` in `navigation.ts`, and individual controls can opt out with `data-van-stack-no-swipe-back`.

The stack is session navigation state. A direct visit to `/posts/1` renders that route as one active leaf view; it does not fabricate previous `/` or `/posts` views. Browser back maps to stack pop when that previous view exists.

For route-level back links, call `await app.router.back({ fallback: "/posts" })`. Stack presentation pops the in-session stack through browser history when it can, and uses the fallback route when the current page was opened directly.

Stack-aware app chrome should subscribe to router navigation state instead of inferring from route paths:

```ts
const unsubscribe = app.router.subscribeNavigationState((state) => {
  state.canGoBack;
  state.current;
  state.previous;
  state.stackDepth;
  state.transition;
  state.progress;
});
```

The API is the primary contract. Base routers expose final route state only, while stack presentation includes `previous`, full stack depth, and live edge-swipe updates. During an interactive swipe-back, `state.transition.phase` is `"gesture"`, `state.transition.direction` is `"backward"`, and `state.progress` moves from `0` to `1` with the gesture. Apps can use that progress to morph headers or titles in sync with the gesture; DOM attributes may mirror this later, but they are not the source of truth.

Presentation is chosen at startup or at navigator boundaries, not rewritten continuously at runtime. Stack presentation currently supports `shell` and `custom` CSR apps.
