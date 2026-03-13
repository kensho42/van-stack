import { van } from "van-stack/render";

import { showcasePublication } from "../content/blog";
import { type ShowcaseLiveModeId, showcaseModes } from "../content/modes";
import { getModeCallout, renderModePill } from "./runtime";

export { getModeCallout };

const { a, div, footer, h1, header, main, nav, p, section, small, style } =
  van.tags;

export type ShowcaseTrack = {
  label: string;
  href: string;
  description: string;
};

const showcaseTracks = [
  {
    label: "Runtime Gallery",
    href: "/gallery",
    description:
      "Live mode comparisons for the same blog app across ssg, ssr, hydrated, shell, and custom delivery.",
  },
  {
    label: "Guided Walkthrough",
    href: "/walkthrough",
    description:
      "Narrated evaluator pages that explain each runtime path and link back into the live routes.",
  },
] satisfies ShowcaseTrack[];

const showcaseCss = `
  :root {
    color-scheme: light;
    --paper: #f5efe3;
    --paper-strong: #fffaf0;
    --ink: #132033;
    --muted: #526075;
    --line: rgba(19, 32, 51, 0.14);
    --accent: #b94b2f;
    --accent-soft: rgba(185, 75, 47, 0.12);
    --teal: #136f63;
    --teal-soft: rgba(19, 111, 99, 0.14);
    --shadow: 0 28px 80px rgba(19, 32, 51, 0.12);
    font-family: "Avenir Next", "Segoe UI", sans-serif;
  }

  body {
    margin: 0;
    color: var(--ink);
    background:
      radial-gradient(circle at top left, rgba(185, 75, 47, 0.14), transparent 28%),
      radial-gradient(circle at top right, rgba(19, 111, 99, 0.12), transparent 24%),
      linear-gradient(180deg, #f9f5ed 0%, #f2eadb 100%);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .showcase-app {
    min-height: 100vh;
  }

  .showcase-frame {
    max-width: 1180px;
    margin: 0 auto;
    padding: 24px 18px 72px;
  }

  .showcase-header {
    display: grid;
    gap: 18px;
    padding: 18px 0 26px;
  }

  .showcase-topline {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    align-items: center;
    justify-content: space-between;
  }

  .showcase-branding {
    display: grid;
    gap: 4px;
  }

  .showcase-branding h1,
  .showcase-hero h1,
  .archive-intro h1,
  .article-header h1 {
    margin: 0;
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
    letter-spacing: -0.02em;
    line-height: 0.98;
  }

  .showcase-branding h1 {
    font-size: clamp(2rem, 4vw, 3.6rem);
  }

  .showcase-nav,
  .showcase-mode-nav,
  .taxonomy-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .showcase-nav a,
  .showcase-mode-nav a,
  .taxonomy-chip {
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.72);
    padding: 8px 12px;
    border-radius: 999px;
  }

  .showcase-nav a[data-active="true"],
  .showcase-mode-nav a[data-active="true"] {
    background: var(--accent);
    color: white;
    border-color: transparent;
  }

  .showcase-hero,
  .archive-intro,
  .runtime-panel,
  .editorial-card,
  .article-shell,
  .showcase-section-block {
    background: rgba(255, 252, 245, 0.86);
    border: 1px solid var(--line);
    border-radius: 28px;
    box-shadow: var(--shadow);
  }

  .showcase-hero,
  .archive-intro,
  .article-shell,
  .runtime-panel,
  .showcase-section-block {
    padding: 28px;
  }

  .showcase-eyebrow {
    margin: 0 0 10px;
    color: var(--accent);
    font-size: 0.78rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .showcase-lede {
    margin: 0;
    font-size: 1.12rem;
    line-height: 1.65;
    max-width: 60ch;
  }

  .showcase-subtle {
    margin: 0;
    color: var(--muted);
    line-height: 1.6;
  }

  .showcase-main {
    display: grid;
    gap: 22px;
  }

  .editorial-section {
    display: grid;
    gap: 16px;
  }

  .section-heading {
    display: grid;
    gap: 6px;
  }

  .section-heading h2,
  .article-section h2,
  .runtime-panel h2 {
    margin: 0;
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
    font-size: 1.55rem;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .card-grid--tight {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .editorial-card {
    display: grid;
    gap: 12px;
    padding: 22px;
  }

  .editorial-card h3 {
    margin: 0;
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
    font-size: 1.35rem;
  }

  .editorial-summary,
  .article-shell p,
  .runtime-panel p {
    margin: 0;
    line-height: 1.68;
  }

  .editorial-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .article-shell {
    display: grid;
    gap: 24px;
  }

  .article-header {
    display: grid;
    gap: 14px;
  }

  .article-section {
    display: grid;
    gap: 12px;
  }

  .article-section--highlight {
    padding: 18px;
    border-radius: 22px;
    background: var(--accent-soft);
  }

  .runtime-panel {
    display: grid;
    gap: 10px;
  }

  .runtime-panel__head {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .runtime-panel--comparison ul,
  .article-section ul {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 8px;
  }

  .mode-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 7px 12px;
    background: var(--teal-soft);
    color: var(--teal);
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .showcase-footer {
    margin-top: 20px;
    color: var(--muted);
  }

  @media (max-width: 700px) {
    .showcase-frame {
      padding: 18px 14px 54px;
    }

    .showcase-hero,
    .archive-intro,
    .article-shell,
    .runtime-panel,
    .showcase-section-block {
      padding: 22px 18px;
      border-radius: 24px;
    }

    .showcase-branding h1,
    .showcase-hero h1,
    .archive-intro h1,
    .article-header h1 {
      font-size: clamp(1.9rem, 8vw, 3rem);
    }
  }
`;

function isActiveSection(currentPath: string | undefined, href: string) {
  if (!currentPath) {
    return false;
  }

  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function getShowcaseTracks() {
  return showcaseTracks;
}

export function renderShowcaseFrame(input: {
  currentPath: string;
  title?: string;
  summary?: string;
  currentModeId?: ShowcaseLiveModeId;
  children: unknown[];
}) {
  return div(
    { class: "showcase-app" },
    style(showcaseCss),
    div(
      { class: "showcase-frame" },
      header(
        { class: "showcase-header" },
        div(
          { class: "showcase-topline" },
          div(
            { class: "showcase-branding" },
            p({ class: "showcase-eyebrow" }, showcasePublication.issue),
            h1(showcasePublication.name),
            p({ class: "showcase-subtle" }, showcasePublication.description),
          ),
          input.currentModeId ? renderModePill(input.currentModeId) : null,
        ),
        nav(
          { class: "showcase-nav" },
          a(
            {
              href: "/",
              "data-active": isActiveSection(input.currentPath, "/"),
            },
            "Home",
          ),
          a(
            {
              href: "/gallery",
              "data-active": isActiveSection(input.currentPath, "/gallery"),
            },
            "Runtime Gallery",
          ),
          a(
            {
              href: "/walkthrough",
              "data-active": isActiveSection(input.currentPath, "/walkthrough"),
            },
            "Guided Walkthrough",
          ),
        ),
        input.currentPath.startsWith("/gallery/")
          ? nav(
              { class: "showcase-mode-nav" },
              ...showcaseModes.map((mode) =>
                a(
                  {
                    href: mode.galleryPath,
                    "data-active": input.currentModeId === mode.id,
                  },
                  mode.title,
                ),
              ),
            )
          : null,
      ),
      main(
        { class: "showcase-main" },
        input.title || input.summary
          ? section(
              { class: "showcase-section-block" },
              input.title
                ? p({ class: "showcase-eyebrow" }, "Section overview")
                : null,
              input.title ? h1(input.title) : null,
              input.summary
                ? p({ class: "showcase-lede" }, input.summary)
                : null,
            )
          : null,
        ...input.children,
      ),
      footer(
        { class: "showcase-footer" },
        small(
          "Northstar Journal is the shared blog app used to compare SSG, SSR, hydrated, shell, and custom delivery.",
        ),
      ),
    ),
  );
}
