import { van } from "van-stack/render";

const { div, p } = van.tags;

export default function layout(input: { children: unknown }) {
  return div(
    { class: "chunked-csr-layout", "data-layout-mode": "hydrated" },
    p("Hydrated layout frame"),
    input.children,
  );
}
