import { van } from "van-stack/render";

import { getPostByline, getPostEyebrow } from "../../../../../components/blog";
import { getModeCallout } from "../../../../../components/chrome";
import type { GalleryPostData } from "../../../../../runtime/data";

const { article, aside, button, h1, h2, li, p, section, span, ul } = van.tags;

export default function page(input: { data: unknown }) {
  const data = input.data as GalleryPostData;
  const callout = getModeCallout("hydrated");

  return article(
    p(getPostEyebrow(data.post)),
    h1(data.post.title),
    p(getPostByline(data.post)),
    p(data.post.summary),
    aside(h2(callout.title), p(callout.body)),
    p("Hydrated Mode"),
    p(
      "This route starts from SSR HTML and keeps the same post alive on the client.",
    ),
    button({ "data-like-button": "" }, "Like this post"),
    p(span({ "data-like-count": "" }, "3"), " readers found this helpful"),
    section(
      h2("Related posts"),
      ul(...data.related.map((post) => li(post.title))),
    ),
  );
}
