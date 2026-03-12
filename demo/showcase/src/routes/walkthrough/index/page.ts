import { van } from "van-stack/render";

const { h1, li, main, p, ul } = van.tags;

export default function page() {
  return main(
    h1("Guided Walkthrough"),
    p("Review annotated capability pages for the same blog app."),
    ul(
      li("Hydrated"),
      li("Shell"),
      li("Custom"),
      li("SSG"),
      li("Adaptive"),
    ),
  );
}
