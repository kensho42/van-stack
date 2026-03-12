import { van } from "van-stack/render";

import { getShowcaseMode } from "../../../content/modes";

const { a, article, h1, h2, li, p, ul } = van.tags;

export default function page() {
  const mode = getShowcaseMode("hydrated");
  if (!mode) {
    throw new Error("Missing hydrated showcase mode.");
  }

  return article(
    h1("Hydrated Walkthrough"),
    p(mode.summary),
    p(mode.proves),
    p(a({ href: mode.galleryPath }, "Live runtime page")),
    h2("Route modules"),
    ul(
      li("loader.ts prepares the blog post data"),
      li("page.ts renders the server HTML"),
      li("hydrate.ts hydrates the interactive like affordance"),
    ),
  );
}
