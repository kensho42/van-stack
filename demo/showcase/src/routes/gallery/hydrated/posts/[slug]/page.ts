import { van } from "van-stack/render";
import { renderShowcaseFrame } from "../../../../../components/chrome";
import { renderArticleLayout } from "../../../../../components/editorial";
import {
  renderRuntimePanel,
  renderSiblingModeLinks,
} from "../../../../../components/runtime";
import type { GalleryPostData } from "../../../../../runtime/data";

const { button, h2, p, section, span } = van.tags;

export default function page(input: { data: unknown }) {
  const data = input.data as GalleryPostData;

  return renderShowcaseFrame({
    currentPath: data.path,
    currentModeId: data.mode.id,
    children: [
      renderRuntimePanel("hydrated"),
      renderArticleLayout(data.post, data.mode.id, data.related),
      section(
        { class: "showcase-section-block" },
        h2("Reader pulse"),
        p(
          "This interaction hydrates from the SSR document instead of replacing it.",
        ),
        button({ "data-like-button": "" }, "Like this post"),
        p(span({ "data-like-count": "" }, "3"), " readers found this helpful"),
      ),
      renderSiblingModeLinks(data.mode.id, {
        collection: "posts",
        slug: data.post.slug,
        label: data.post.title,
      }),
    ],
  });
}
