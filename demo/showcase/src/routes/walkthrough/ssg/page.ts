import { van } from "van-stack/render";

import { getShowcaseMode } from "../../../content/modes";

const { a, article, h1, h2, p, pre } = van.tags;

export default function page(input: { data: unknown }) {
  const mode = getShowcaseMode("ssg");
  if (!mode) {
    throw new Error("Missing SSG showcase mode.");
  }

  const data = input.data as { sampleHtml: string };

  return article(
    h1("SSG Walkthrough"),
    p(mode.summary),
    p(mode.proves),
    p(a({ href: mode.galleryPath }, "Live runtime page")),
    h2("Generated sample output"),
    pre(data.sampleHtml),
  );
}
