import { van } from "van-stack/render";

import { getShowcaseMode } from "../../../content/modes";

const { a, article, h1, h2, li, p, ul } = van.tags;

export default function page() {
  const mode = getShowcaseMode("adaptive");
  if (!mode) {
    throw new Error("Missing adaptive showcase mode.");
  }

  return article(
    h1("Adaptive Walkthrough"),
    p(mode.summary),
    p(mode.proves),
    p(a({ href: mode.galleryPath }, "Live runtime page")),
    h2("What to look for"),
    ul(
      li("replace presentation rewrites the visible context"),
      li("stack presentation preserves a reading trail"),
    ),
  );
}
