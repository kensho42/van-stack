export const presentation = "stack";

import { van } from "van-stack/render";

import { renderShowcaseFrame } from "../../components/chrome";

const { h2, p, section, div } = van.tags;

export default function layout(input: { children: unknown; path: string }) {
  return div(
    { "data-presentation": presentation },
    renderShowcaseFrame({
      currentPath: input.path,
      children: [
        section(
          { class: "runtime-panel" },
          p({ class: "showcase-eyebrow" }, "Adaptive navigation"),
          h2("Stack presentation"),
          p(
            "This track reuses the same blog routes and content graph, but the boundary declares stack presentation instead of a runtime-delivery mode.",
          ),
        ),
        input.children,
      ],
    }),
  );
}
