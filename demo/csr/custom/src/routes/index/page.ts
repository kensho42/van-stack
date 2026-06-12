import van from "vanjs-core";

const { a, article, button, h1, p } = van.tags;

export default function page() {
  const taps = van.state(0);

  return article(
    h1("Custom CSR Demo"),
    p(
      "Lets the app shell own GraphQL, REST, RPC, or native data access, or keep data fetching inside components.",
    ),
    p(a({ href: "/new-esim/890123?step=scan" }, "Open dynamic custom route")),
    button(
      {
        onclick: () => {
          taps.val += 1;
        },
      },
      "Tap custom mode",
    ),
    p(() => `Resolver taps: ${taps.val}`),
  );
}
