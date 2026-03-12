import { van } from "van-stack/render";

const { article, button, h1, p } = van.tags;

export default function page() {
  const taps = van.state(0);

  return article(
    h1("Custom CSR Demo"),
    p(
      "Lets the app shell own GraphQL, REST, RPC, or native data access, or keep data fetching inside components.",
    ),
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
