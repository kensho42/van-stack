import { van } from "van-stack/render";

import { showcaseModes } from "../../../content/modes";

const { a, h1, li, main, p, ul } = van.tags;

export default function page() {
  return main(
    h1("Guided Walkthrough"),
    p("Review annotated capability pages for the same blog app."),
    ul(
      ...showcaseModes.map((mode) =>
        li(
          a({ href: mode.walkthroughPath }, mode.title),
          `: ${mode.proves}`,
        ),
      ),
    ),
  );
}
