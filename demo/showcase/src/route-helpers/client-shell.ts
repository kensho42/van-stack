import { van } from "van-stack/render";

type ShowcaseShellMode = "shell" | "custom" | "chunked";

const { div, h1, main, p } = van.tags;

export function renderClientModeShell(mode: ShowcaseShellMode, path: string) {
  const shellId =
    mode === "shell"
      ? "showcase-shell"
      : mode === "custom"
        ? "showcase-custom"
        : "showcase-chunked";
  const loadingCopy =
    mode === "shell"
      ? "Loading route data through the internal VanStack transport surface."
      : mode === "custom"
        ? "Loading route data through the showcase JSON API."
        : "Loading route data and route modules through the generated manifest.";

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
