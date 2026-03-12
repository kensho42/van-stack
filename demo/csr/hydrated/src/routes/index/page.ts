import { van } from "van-stack/render";

const { article, h1, p } = van.tags;

export default function page() {
  return article(
    h1("Hydrated CSR Demo"),
    p("Starts from SSR HTML, then continues with client-side navigation."),
  );
}
