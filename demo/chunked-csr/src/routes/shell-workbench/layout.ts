import { van } from "van-stack/render";

const { div, main } = van.tags;

export default function layout(input: {
  children: unknown;
  slots: Record<string, unknown>;
}) {
  return div(
    {
      class: "chunked-workbench-shell",
      "data-slot-demo": "shell-workbench",
    },
    input.slots.sidebar,
    main(
      {
        class: "chunked-workbench-workspace",
        "data-shell-slot": "workspace",
      },
      input.children,
    ),
  );
}
