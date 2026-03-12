import { van } from "van-stack/render";

import { getShowcaseMode } from "../../../content/modes";

const { a, article, h1, h2, li, p, ul } = van.tags;

export default function page() {
  const mode = getShowcaseMode("custom");
  if (!mode) {
    throw new Error("Missing custom showcase mode.");
  }

  return article(
    h1("Custom Walkthrough"),
    p(mode.summary),
    p(mode.proves),
    p(a({ href: mode.galleryPath }, "Live runtime page")),
    h2("What to look for"),
    ul(
      li("The app shell owns resolution."),
      li("Framework routing is still available."),
      li("The same blog data model still drives the page."),
    ),
  );
}
