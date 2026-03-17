import { van } from "van-stack/render";

const { a, code, h1, li, main, p, ul } = van.tags;

export default function page() {
  return main(
    h1("SSG Export Demo"),
    p("Builds a static dist/ tree from filesystem routes."),
    p(
      "The export includes HTML pages, a raw robots.txt route, and copied assets.",
    ),
    ul(
      li(a({ href: "/posts/launch-week" }, "Dynamic post: Launch Week")),
      li(code("/robots.txt")),
      li(code("/assets/site.css")),
    ),
  );
}
