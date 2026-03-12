import { van } from "van-stack/render";

const { a, h1, main, nav, p } = van.tags;

export default function page() {
  return main(
    h1("van-stack Showcase"),
    p("Evaluate the same blog app through two demo tracks."),
    nav(
      a({ href: "/gallery" }, "Runtime Gallery"),
      " ",
      a({ href: "/walkthrough" }, "Guided Walkthrough"),
    ),
  );
}
