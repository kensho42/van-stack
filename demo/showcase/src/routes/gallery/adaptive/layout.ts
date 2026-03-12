export const presentation = "stack";

import { van } from "van-stack/render";

const { h1, main, p, section } = van.tags;

export default function layout(input: { children: unknown }) {
  return main(
    h1("Adaptive Gallery"),
    p("This frame is ready to talk about replace and stack presentation."),
    section(input.children),
  );
}
