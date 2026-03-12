import { van } from "van-stack/render";

const { h1, main, p } = van.tags;

export default function page() {
  return main(
    h1("SSG Demo"),
    p("Pre-renders route output from filesystem entries."),
  );
}
