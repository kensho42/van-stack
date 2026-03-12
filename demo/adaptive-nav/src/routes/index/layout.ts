export const presentation = "stack";

import { van } from "van-stack/render";

const { h1, main, p, section } = van.tags;

export default function layout(input: { children: unknown }) {
  return main(
    { "data-presentation": presentation },
    h1("Adaptive Navigation Demo"),
    p("Demonstrates replace and stack presentation from the same route tree."),
    section(input.children),
  );
}
