import { van } from "van-stack/render";

const { article, h1, p } = van.tags;

export default function page() {
  return article(
    h1("Shell CSR Demo"),
    p(
      "Boots from a tiny shell document and loads route data through transport.",
    ),
  );
}
