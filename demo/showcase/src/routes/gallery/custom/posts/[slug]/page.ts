import { van } from "van-stack/render";

import { getPostByline, getPostEyebrow } from "../../../../../components/blog";
import { getModeCallout } from "../../../../../components/chrome";
import type { GalleryPostData } from "../../../../../runtime/data";

const { article, aside, h1, h2, li, p, section, ul } = van.tags;

export default function page(input: { data: unknown }) {
  const data = input.data as GalleryPostData;
  const callout = getModeCallout("custom");

  return article(
    p(getPostEyebrow(data.post)),
    h1(data.post.title),
    p(getPostByline(data.post)),
    p(data.post.summary),
    aside(h2(callout.title), p(callout.body)),
    p(
      "This route highlights app-owned resolution so the app shell keeps control of fetching.",
    ),
    section(
      h2("Related posts"),
      ul(...data.related.map((post) => li(post.title))),
    ),
  );
}
