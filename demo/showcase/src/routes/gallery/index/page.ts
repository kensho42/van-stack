import { van } from "van-stack/render";

import { showcaseModes } from "../../../content/modes";

const { a, h1, li, main, p, section, ul } = van.tags;

export default function page() {
  return main(
    h1("Runtime Gallery"),
    p("Compare the supported runtime modes against the same blog app."),
    section(
      ul(
        ...showcaseModes.map((mode) =>
          li(
            a({ href: mode.galleryPath }, mode.title),
            `: ${mode.summary}`,
          ),
        ),
      ),
    ),
  );
}
