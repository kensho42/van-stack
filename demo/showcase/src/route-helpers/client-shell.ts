import { van } from "van-stack/render";

type ShowcaseShellMode = "shell" | "custom";

const { div, h1, main, p } = van.tags;

export function renderClientModeShell(mode: ShowcaseShellMode, path: string) {
  const shellId = mode === "shell" ? "showcase-shell" : "showcase-custom";
  const loadingCopy =
    mode === "shell"
      ? "Loading route data through the internal VanStack transport surface."
      : "Loading route data through the showcase JSON API.";

  return div(
    {
      id: shellId,
      "data-showcase-client-root": "",
      "data-showcase-path": path,
      "data-showcase-mode": mode,
    },
    main(h1("Northstar Journal"), p(loadingCopy)),
  );
}
