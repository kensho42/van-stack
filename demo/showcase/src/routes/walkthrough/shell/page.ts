import { van } from "van-stack/render";

import { getShowcaseMode } from "../../../content/modes";

const { a, article, h1, h2, li, p, ul } = van.tags;

export default function page() {
  const mode = getShowcaseMode("shell");
  if (!mode) {
    throw new Error("Missing shell showcase mode.");
  }

  return article(
    h1("Shell Walkthrough"),
    p(mode.summary),
    p(mode.proves),
    p(a({ href: mode.galleryPath }, "Live runtime page")),
    h2("What to look for"),
    ul(
      li("The app can boot from a smaller shell."),
      li("The router can fetch route data through transport."),
      li("The blog content stays comparable to the hydrated path."),
    ),
  );
}
