import van from "vanjs-core";
import * as vanX from "vanjs-ext";

const { article, code, h1, li, p, strong, ul } = van.tags;

type ThirdPartyRuntime = "ssr" | "ssg";

export function renderThirdPartyCompatPage(runtime: ThirdPartyRuntime) {
  const details = vanX.reactive({
    source: "vanjs-core + vanjs-ext",
    resolver: "van-stack/compat/node-register",
  });

  return article(
    {
      "data-third-party-card": "",
      "data-third-party-runtime": runtime,
    },
    h1(`Third-party ${runtime.toUpperCase()} compatibility`),
    p(
      "This page comes from a workspace package that imports Van directly instead of using van-stack/render.",
    ),
    p(
      { "data-third-party-reactive": "" },
      `${details.source} through ${details.resolver}`,
    ),
    ul(
      li(strong("Import surface: "), code('import van from "vanjs-core"')),
      li(
        strong("Reactive helpers: "),
        code('import * as vanX from "vanjs-ext"'),
      ),
      li(strong("Expected runtime: "), runtime.toUpperCase()),
    ),
  );
}

export function readThirdPartyCompatSnapshot() {
  return {
    state: van.state(2),
    reactive: vanX.reactive({
      title: "Compat Fixture",
    }),
  };
}
