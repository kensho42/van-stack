import van from "vanjs-core";

const { article, code, h1, p } = van.tags;

export default function page(input: {
  data: unknown;
  params: { iccid: string };
  path: string;
  pathname: string;
  query: URLSearchParams;
}) {
  const step = input.query.get("step") ?? "start";

  return article(
    h1(`eSIM ${input.params.iccid}`),
    p("Custom mode route components can read params and query directly."),
    p(`Current step: ${step}`),
    p("Path: ", code(input.path)),
    p("Pathname: ", code(input.pathname)),
  );
}
