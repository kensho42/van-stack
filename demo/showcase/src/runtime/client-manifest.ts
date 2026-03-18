export const showcaseClientManifest = {
  hydrated: {
    hint: "Route-level DOM hydration keeps the initial page interactive.",
  },
  shell: {
    hint: "Transport-backed route loading keeps the shell lean.",
  },
  custom: {
    hint: "App-owned resolution lets the app keep control of fetching.",
  },
  chunked: {
    hint: "Generated route manifests keep browser route modules split per navigation.",
  },
} as const;
