import { van } from "van-stack/render";

const { h1, li, main, p, ul } = van.tags;

export default function page() {
  return main(
    h1("Runtime Gallery"),
    p("Compare the supported runtime modes against the same blog app."),
    ul(
      li("Hydrated"),
      li("Shell"),
      li("Custom"),
      li("SSG"),
      li("Adaptive"),
    ),
  );
}
