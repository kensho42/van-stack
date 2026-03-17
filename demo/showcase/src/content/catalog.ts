export type ShowcasePublication = {
  name: string;
  tagline: string;
  description: string;
  issue: string;
};

export type ShowcaseAuthorSeed = {
  slug: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  focus: string;
};

export type ShowcaseCategorySeed = {
  slug: string;
  name: string;
  description: string;
  strapline: string;
};

export type ShowcaseTagSeed = {
  slug: string;
  name: string;
  description: string;
};

export type ShowcasePostSeed = {
  slug: string;
  title: string;
  summary: string;
  excerpt: string;
  authorSlug: string;
  categorySlug: string;
  tagSlugs: string[];
  readTimeMinutes: number;
  publishedOn: string;
  publishedAt: string;
  heroNote: string;
  outline: [string, string];
  highlights: [string, string, string];
};

export const showcasePublication = {
  name: "Northstar Journal",
  tagline:
    "A full editorial product used to compare runtime delivery and adaptive navigation.",
  description:
    "Northstar Journal is the evaluator-facing blog app used to compare SSG, SSR, hydrated, islands, shell, custom, and adaptive stack presentation on the same editorial graph.",
  issue: "Spring 2026 Evaluator Edition",
} satisfies ShowcasePublication;

export const showcaseAuthorCatalog = [
  {
    slug: "marta-solis",
    name: "Marta Solis",
    role: "Editor in Chief",
    location: "Barcelona, Spain",
    bio: "Marta shapes the editorial product strategy behind Northstar Journal and keeps every route feeling like part of one publication instead of five disconnected demos.",
    focus:
      "Editorial product strategy, archive design, and evaluator storytelling.",
  },
  {
    slug: "niko-drummond",
    name: "Niko Drummond",
    role: "Platform Editor",
    location: "Glasgow, Scotland",
    bio: "Niko writes from the framework edge, translating route graphs, rendering contracts, and hydration boundaries into articles evaluators can actually inspect.",
    focus: "Rendering pipelines, route composition, and runtime parity.",
  },
  {
    slug: "ivy-chen",
    name: "Ivy Chen",
    role: "Experience Editor",
    location: "Taipei, Taiwan",
    bio: "Ivy covers developer-facing flows, especially where transport-backed routing and app-owned fetching have to stay honest under real navigation.",
    focus: "CSR boot flows, shell routing, and app-owned data patterns.",
  },
  {
    slug: "omar-haddad",
    name: "Omar Haddad",
    role: "Data Desk Lead",
    location: "Amman, Jordan",
    bio: "Omar tracks the signals behind archive pages, tag health, freshness, and the data contracts that make custom routes believable.",
    focus: "Taxonomy health, JSON contracts, and measurement.",
  },
  {
    slug: "sana-malik",
    name: "Sana Malik",
    role: "Design Director",
    location: "Lahore, Pakistan",
    bio: "Sana turns system tokens, archive hierarchy, and reader cues into a newsroom-style interface that still feels modern on mobile and desktop.",
    focus: "Design systems, typography, and content framing.",
  },
  {
    slug: "leo-mercier",
    name: "Leo Mercier",
    role: "Release Strategist",
    location: "Lyon, France",
    bio: "Leo keeps roadmap notes, launch explanations, and evaluator checkpoints aligned so the demo reads like a product, not a checklist.",
    focus: "Roadmaps, release narratives, and demo positioning.",
  },
  {
    slug: "zoe-washington",
    name: "Zoe Washington",
    role: "Audience Editor",
    location: "Chicago, USA",
    bio: "Zoe reports on how readers move through author pages, field reports, and taxonomy views once the chrome and runtime stop being the main story.",
    focus: "Reader journeys, author pages, and field reporting.",
  },
  {
    slug: "pavel-ivanov",
    name: "Pavel Ivanov",
    role: "Performance Correspondent",
    location: "Sofia, Bulgaria",
    bio: "Pavel measures the cost of rendering choices in practical editorial terms so performance discussions stay tied to real reading behavior.",
    focus: "Performance budgets, payload discipline, and perceived speed.",
  },
] satisfies ShowcaseAuthorSeed[];

export const showcaseCategoryCatalog = [
  {
    slug: "engineering",
    name: "Engineering",
    description:
      "Rendering, routing, and the framework mechanics that keep one blog coherent across delivery modes.",
    strapline: "Where the route graph meets the rendered page.",
  },
  {
    slug: "product-strategy",
    name: "Product Strategy",
    description:
      "Why the showcase is shaped the way it is, from canonical routes to evaluator-first defaults.",
    strapline: "The product logic behind the demo surface.",
  },
  {
    slug: "design-systems",
    name: "Design Systems",
    description:
      "Typography, hierarchy, and reusable interface blocks for a blog that needs to look intentional everywhere.",
    strapline: "Visual systems that serve the story.",
  },
  {
    slug: "developer-experience",
    name: "Developer Experience",
    description:
      "Hands-on runtime ergonomics for shell routes, custom routes, and everyday authoring.",
    strapline: "How the framework feels when humans have to use it.",
  },
  {
    slug: "data-platform",
    name: "Data Platform",
    description:
      "Archive signals, transport contracts, freshness, and the JSON surfaces behind believable client apps.",
    strapline: "The data layer under the editorial veneer.",
  },
  {
    slug: "performance",
    name: "Performance",
    description:
      "Payload discipline, server timing, and reader-perceived speed for article-heavy experiences.",
    strapline: "Speed measured the way readers feel it.",
  },
  {
    slug: "editorial-ops",
    name: "Editorial Ops",
    description:
      "The structures that keep a many-post showcase maintainable: calendars, taxonomies, and publishing routines.",
    strapline: "Operations that keep the newsroom credible.",
  },
  {
    slug: "field-notes",
    name: "Field Notes",
    description:
      "Reader journey observations and product notes from treating the demo like a real publication.",
    strapline: "Reporting from the edges of the reading experience.",
  },
] satisfies ShowcaseCategorySeed[];

export const showcaseTagCatalog = [
  {
    slug: "runtime",
    name: "Runtime",
    description:
      "Routes and pages whose core point is comparing delivery behavior.",
  },
  {
    slug: "ssr",
    name: "SSR",
    description:
      "Server-rendered pages and the guarantees they should provide.",
  },
  {
    slug: "csr",
    name: "CSR",
    description: "Client-side routing and what it needs to feel complete.",
  },
  {
    slug: "ssg",
    name: "SSG",
    description:
      "Pre-generated routes and the publishing workflows around them.",
  },
  {
    slug: "hydration",
    name: "Hydration",
    description: "Where SSR content hands off to live client behavior.",
  },
  {
    slug: "shell",
    name: "Shell",
    description: "Lean browser boots that fetch route content after startup.",
  },
  {
    slug: "custom-data",
    name: "Custom Data",
    description: "App-owned data fetching and decoupled JSON contracts.",
  },
  {
    slug: "taxonomy",
    name: "Taxonomy",
    description:
      "Categories and tags that stay meaningful instead of decorative.",
  },
  {
    slug: "analytics",
    name: "Analytics",
    description: "Signals that explain what archive pages are actually doing.",
  },
  {
    slug: "performance",
    name: "Performance",
    description: "Budgeting, payload choices, and reader-perceived speed.",
  },
  {
    slug: "design",
    name: "Design",
    description: "Typography, layout, and reader-facing interface choices.",
  },
  {
    slug: "workflow",
    name: "Workflow",
    description:
      "Editorial systems, authoring routines, and release coordination.",
  },
] satisfies ShowcaseTagSeed[];

export const showcasePostCatalog = [
  {
    slug: "runtime-gallery-tour",
    title: "Runtime Gallery Tour",
    summary:
      "The canonical article for comparing every delivery mode against one believable blog product.",
    excerpt:
      "This is the page evaluators should open first: the same editorial story rendered as SSG, SSR, hydrated CSR, shell CSR, and custom CSR.",
    authorSlug: "niko-drummond",
    categorySlug: "engineering",
    tagSlugs: ["runtime", "ssr", "hydration"],
    readTimeMinutes: 7,
    publishedOn: "2026-03-12",
    publishedAt: "March 12, 2026",
    heroNote:
      "Once the shared layout, taxonomy, and related stories stay constant, the runtime differences become obvious instead of theatrical.",
    outline: ["One product, five delivery contracts", "What to compare first"],
    highlights: [
      "Open the same slug in every mode before exploring the rest of the app.",
      "Notice which modes ship article HTML and which ship only a shell.",
      "Compare author, category, and tag navigation after the first page load.",
    ],
  },
  {
    slug: "ssg-with-a-real-editorial-calendar",
    title: "SSG With A Real Editorial Calendar",
    summary:
      "Static output feels more convincing when it is tied to an actual publishing cadence, not a toy page list.",
    excerpt:
      "Northstar Journal treats SSG as a publishing channel with archive coverage, canonical posts, and pre-generated taxonomy pages.",
    authorSlug: "marta-solis",
    categorySlug: "editorial-ops",
    tagSlugs: ["ssg", "workflow", "taxonomy"],
    readTimeMinutes: 6,
    publishedOn: "2026-03-11",
    publishedAt: "March 11, 2026",
    heroNote:
      "Pre-generation only proves something when the output includes the same archive depth readers expect from the live app.",
    outline: ["Publishing ahead of time", "Why archives matter in SSG"],
    highlights: [
      "Homepage, list pages, and taxonomy pages should all exist in the generated set.",
      "Entries make static generation about editorial coverage rather than a single happy path.",
      "The static mode should still feel like Northstar Journal, not a parallel mini-site.",
    ],
  },
  {
    slug: "shell-routing-with-real-content",
    title: "Shell Routing With Real Content",
    summary:
      "A shell-first demo should still browse like a full product once the data starts loading.",
    excerpt:
      "The shell route boots from a tiny document, then fills in posts, archives, and taxonomy from transport responses.",
    authorSlug: "ivy-chen",
    categorySlug: "developer-experience",
    tagSlugs: ["shell", "csr", "runtime"],
    readTimeMinutes: 5,
    publishedOn: "2026-03-10",
    publishedAt: "March 10, 2026",
    heroNote:
      "The honest version of shell routing shows the empty contract first and then proves that the content graph can refill the UI quickly.",
    outline: ["The shell promise", "What good transport reveals"],
    highlights: [
      "Start with no article body in the HTML document.",
      "Load the same post graph through framework-owned transport endpoints.",
      "Preserve all author and taxonomy routes after boot.",
    ],
  },
  {
    slug: "authorship-pages-that-feel-lived-in",
    title: "Authorship Pages That Feel Lived In",
    summary:
      "Author pages matter once a demo stops being a screenshot and starts being something people actually navigate.",
    excerpt:
      "A credible blog app needs authors with bios, beats, and enough posts to feel like recurring voices.",
    authorSlug: "zoe-washington",
    categorySlug: "field-notes",
    tagSlugs: ["design", "taxonomy", "workflow"],
    readTimeMinutes: 5,
    publishedOn: "2026-03-09",
    publishedAt: "March 9, 2026",
    heroNote:
      "Readers use authors as a shortcut to trust, tone, and subject matter, so those pages cannot be placeholders.",
    outline: ["More than a byline", "Designing for repeat visits"],
    highlights: [
      "Bios and focus areas help author pages scan quickly.",
      "Multiple posts per author keep archives from feeling staged.",
      "Author detail routes should be part of every runtime mode, not a bonus route.",
    ],
  },
  {
    slug: "category-pages-that-earn-the-click",
    title: "Category Pages That Earn The Click",
    summary:
      "Category archives should help the reader decide what kind of reading session they are about to have.",
    excerpt:
      "When categories have real descriptions and post density, they become navigation tools instead of decorative metadata.",
    authorSlug: "sana-malik",
    categorySlug: "design-systems",
    tagSlugs: ["design", "taxonomy", "workflow"],
    readTimeMinutes: 6,
    publishedOn: "2026-03-08",
    publishedAt: "March 8, 2026",
    heroNote:
      "A category page is an editorial promise, so the layout should explain its angle before the first card even loads into view.",
    outline: [
      "Category pages as editorial surfaces",
      "Using hierarchy to build confidence",
    ],
    highlights: [
      "A strapline gives each category a point of view.",
      "Archive cards should make scanning cadence and subject obvious.",
      "Categories are one of the fastest ways to test route coverage across modes.",
    ],
  },
  {
    slug: "tag-archives-with-real-signals",
    title: "Tag Archives With Real Signals",
    summary:
      "Tag pages stop feeling spammy when they collect true themes that cut across categories and authors.",
    excerpt:
      "Runtime, taxonomy, and analytics tags should expose patterns that are hard to see from the homepage alone.",
    authorSlug: "omar-haddad",
    categorySlug: "data-platform",
    tagSlugs: ["analytics", "taxonomy", "runtime"],
    readTimeMinutes: 7,
    publishedOn: "2026-03-07",
    publishedAt: "March 7, 2026",
    heroNote:
      "The strongest tag pages show cross-cutting concerns that justify a separate archive instead of repeating category views.",
    outline: ["What makes a tag page useful", "Finding hidden patterns"],
    highlights: [
      "Tags should connect multiple authors and categories.",
      "The same tag archives need to render in all five gallery modes.",
      "A tag page is a quick way to verify routing depth and content density together.",
    ],
  },
  {
    slug: "shipping-ssr-with-confident-defaults",
    title: "Shipping SSR With Confident Defaults",
    summary:
      "SSR should prove that the app can serve fully readable pages without depending on a client takeover.",
    excerpt:
      "A true SSR pass renders the article body, taxonomy, and related reading before any browser-side routing enters the story.",
    authorSlug: "niko-drummond",
    categorySlug: "engineering",
    tagSlugs: ["ssr", "hydration", "performance"],
    readTimeMinutes: 6,
    publishedOn: "2026-03-06",
    publishedAt: "March 6, 2026",
    heroNote:
      "If the server output already feels publishable, hydration becomes a product choice rather than a rescue plan.",
    outline: [
      "Start with readable HTML",
      "Deciding when takeover is warranted",
    ],
    highlights: [
      "The SSR route should stand on its own without bootstrap markers.",
      "Page chrome, article body, and archives should all arrive together.",
      "Server-first confidence makes later mode comparisons easier to reason about.",
    ],
  },
  {
    slug: "a-custom-csr-story-without-framework-lock-in",
    title: "A Custom CSR Story Without Framework Lock In",
    summary:
      "Custom mode matters when the app needs VanStack routing but wants to own data fetching on its own terms.",
    excerpt:
      "The demo should prove that component-driven or route-driven JSON fetching can live beside the router without special-case hacks.",
    authorSlug: "ivy-chen",
    categorySlug: "developer-experience",
    tagSlugs: ["custom-data", "csr", "runtime"],
    readTimeMinutes: 6,
    publishedOn: "2026-03-05",
    publishedAt: "March 5, 2026",
    heroNote:
      "Custom mode only feels real if it fetches from a believable API surface instead of quietly leaning on framework transport.",
    outline: ["Why custom mode exists", "Keeping the contracts honest"],
    highlights: [
      "The route component should be free to fetch its own JSON payload.",
      "Transport and custom data flows should be visibly different in the network story.",
      "The app still benefits from shared route matching and navigation semantics.",
    ],
  },
  {
    slug: "performance-budgets-for-editorial-apps",
    title: "Performance Budgets For Editorial Apps",
    summary:
      "Payload discipline matters more when each page has rich metadata, cross-links, and long-form reading content.",
    excerpt:
      "Editorial sites pay for every extra script and every oversized bootstrap payload, especially on archive-heavy journeys.",
    authorSlug: "pavel-ivanov",
    categorySlug: "performance",
    tagSlugs: ["performance", "ssr", "runtime"],
    readTimeMinutes: 8,
    publishedOn: "2026-03-04",
    publishedAt: "March 4, 2026",
    heroNote:
      "A showcase stops being persuasive when the routes technically work but feel heavy under ordinary reading patterns.",
    outline: [
      "Performance in a content-rich product",
      "Budgeting beyond first paint",
    ],
    highlights: [
      "Runtime comparisons should stay focused on meaningful payload differences.",
      "Archive pages often reveal bloat earlier than homepage demos do.",
      "Performance is easiest to discuss when the content model is identical across modes.",
    ],
  },
  {
    slug: "designing-a-reading-homepage",
    title: "Designing A Reading Homepage",
    summary:
      "The homepage should frame the publication, not just dump a list of routes or articles.",
    excerpt:
      "A modern editorial homepage can explain the current issue, spotlight posts, and still leave room for runtime comparison cues.",
    authorSlug: "sana-malik",
    categorySlug: "design-systems",
    tagSlugs: ["design", "workflow", "runtime"],
    readTimeMinutes: 6,
    publishedOn: "2026-03-03",
    publishedAt: "March 3, 2026",
    heroNote:
      "The homepage is where the app earns the right to feel like a publication first and a framework demo second.",
    outline: [
      "What the homepage needs to do",
      "Balancing product and evaluation cues",
    ],
    highlights: [
      "Lead with editorial intent, not framework jargon.",
      "Use layout contrast to separate features, archives, and runtime diagnostics.",
      "Make the same chrome work on desktop and mobile without feeling generic.",
    ],
  },
  {
    slug: "editorial-analytics-without-clutter",
    title: "Editorial Analytics Without Clutter",
    summary:
      "Data should inform the interface without turning the whole app into a dashboard.",
    excerpt:
      "Northstar Journal uses metrics to strengthen archive pages, but keeps the reader-facing surface focused on stories.",
    authorSlug: "omar-haddad",
    categorySlug: "data-platform",
    tagSlugs: ["analytics", "performance", "workflow"],
    readTimeMinutes: 7,
    publishedOn: "2026-03-02",
    publishedAt: "March 2, 2026",
    heroNote:
      "The best editorial analytics vanish into better ranking, better labels, and better archive coverage rather than noisy widgets.",
    outline: [
      "Measuring the right things",
      "Using signals without ruining the page",
    ],
    highlights: [
      "Counts and freshness matter most when they change navigation behavior.",
      "Archive pages should quietly reflect the strongest stories in a topic.",
      "The custom JSON API becomes more believable when it returns structured metrics too.",
    ],
  },
  {
    slug: "inside-the-release-room",
    title: "Inside The Release Room",
    summary:
      "A strong showcase release reads like a product launch with deliberate scope, not a pile of unrelated runtime tricks.",
    excerpt:
      "The release story explains why the blog app exists, which routes matter first, and what evaluators should compare.",
    authorSlug: "leo-mercier",
    categorySlug: "product-strategy",
    tagSlugs: ["workflow", "runtime", "custom-data"],
    readTimeMinutes: 5,
    publishedOn: "2026-03-01",
    publishedAt: "March 1, 2026",
    heroNote:
      "Roadmap communication is part of the product surface once the demo becomes the main evaluator entrypoint.",
    outline: [
      "Releasing with a point of view",
      "What deserves front-page status",
    ],
    highlights: [
      "Choose one canonical post for comparison and make it obvious.",
      "Separate the live gallery from the walkthrough so each has a clear job.",
      "Write routes and docs so newcomers can orient themselves in minutes.",
    ],
  },
  {
    slug: "writing-for-modes-not-marketing",
    title: "Writing For Modes, Not Marketing",
    summary:
      "The copy around the demo should describe observable behavior, not pretend the product is something it is not.",
    excerpt:
      "Evaluator-facing writing works best when it names the contract plainly and points people at routes they can inspect themselves.",
    authorSlug: "zoe-washington",
    categorySlug: "field-notes",
    tagSlugs: ["design", "workflow", "runtime"],
    readTimeMinutes: 4,
    publishedOn: "2026-02-28",
    publishedAt: "February 28, 2026",
    heroNote:
      "Clear writing makes the runtime story easier to trust because the interface stops over-claiming and starts demonstrating.",
    outline: [
      "Naming what the page actually proves",
      "Helping evaluators read quickly",
    ],
    highlights: [
      "Labels should point at concrete behavior like hydration or transport loading.",
      "Every walkthrough claim should link back to a live route.",
      "The publication voice can stay warm without becoming vague.",
    ],
  },
  {
    slug: "making-authors-discoverable",
    title: "Making Authors Discoverable",
    summary:
      "Author routes deserve direct navigation, not just tiny bylines tucked under article headlines.",
    excerpt:
      "When authors have focus areas, bios, and archives, the publication gains a second layer of navigation depth.",
    authorSlug: "marta-solis",
    categorySlug: "product-strategy",
    tagSlugs: ["design", "taxonomy", "workflow"],
    readTimeMinutes: 5,
    publishedOn: "2026-02-27",
    publishedAt: "February 27, 2026",
    heroNote:
      "Author discoverability is a fast litmus test for whether a showcase is actually a blog app or just a dressed-up post detail page.",
    outline: ["Why author pages matter", "Navigation beyond the homepage"],
    highlights: [
      "The author index should invite browsing, not just satisfy route coverage.",
      "Bios and focus statements give each archive a reason to exist.",
      "Author pages also stress-test the shared UI in every mode.",
    ],
  },
  {
    slug: "content-models-that-survive-every-renderer",
    title: "Content Models That Survive Every Renderer",
    summary:
      "The content graph has to serve SSG, SSR, hydrated CSR, shell CSR, and custom CSR without forking into parallel schemas.",
    excerpt:
      "One post model, one set of authors, and one taxonomy graph make runtime differences inspectable instead of noisy.",
    authorSlug: "niko-drummond",
    categorySlug: "engineering",
    tagSlugs: ["ssg", "ssr", "csr"],
    readTimeMinutes: 8,
    publishedOn: "2026-02-26",
    publishedAt: "February 26, 2026",
    heroNote:
      "A shared model keeps the framework honest because each mode has to carry the same publication instead of its own simplified variant.",
    outline: ["The shared graph principle", "How to keep renderers aligned"],
    highlights: [
      "Derived helpers should assemble posts, authors, categories, and tags from one source of truth.",
      "Every route family should pull from the same lookup layer.",
      "Runtime-specific behavior belongs at the edge, not in the content model.",
    ],
  },
  {
    slug: "the-case-for-shell-first-navigation",
    title: "The Case For Shell First Navigation",
    summary:
      "Shell mode proves its value when route transitions stay coherent after the tiny initial document gives way to real content.",
    excerpt:
      "A lean entry HTML page is only half the story; the rest is how quickly and clearly the archive fills in afterwards.",
    authorSlug: "ivy-chen",
    categorySlug: "developer-experience",
    tagSlugs: ["shell", "performance", "csr"],
    readTimeMinutes: 6,
    publishedOn: "2026-02-25",
    publishedAt: "February 25, 2026",
    heroNote:
      "Shell routing gets interesting when it stays readable and navigable after the first request, not when it merely boots fast in isolation.",
    outline: [
      "Starting tiny without staying empty",
      "Reader experience after boot",
    ],
    highlights: [
      "A good shell route should immediately show where content will land.",
      "Archive navigation is where shell mode either earns trust or loses it.",
      "The same route tree should still back author, category, and tag pages.",
    ],
  },
  {
    slug: "how-we-pick-canonical-demos",
    title: "How We Pick Canonical Demos",
    summary:
      "Canonical routes help evaluators compare quickly because they remove the guesswork about where to begin.",
    excerpt:
      "A single post slug, shared across every mode, creates a stable point of comparison for performance, markup, and behavior.",
    authorSlug: "leo-mercier",
    categorySlug: "product-strategy",
    tagSlugs: ["workflow", "design", "runtime"],
    readTimeMinutes: 5,
    publishedOn: "2026-02-24",
    publishedAt: "February 24, 2026",
    heroNote:
      "The canonical route is a product decision, not just a test convenience, because it shapes the evaluator journey from the first click.",
    outline: [
      "Choosing a comparison target",
      "Keeping the default path obvious",
    ],
    highlights: [
      "The gallery overview should send every mode to the same post slug.",
      "Sibling-mode links should make mode switching frictionless.",
      "A strong canonical route still has to belong to the wider publication.",
    ],
  },
  {
    slug: "the-hidden-cost-of-empty-tag-pages",
    title: "The Hidden Cost Of Empty Tag Pages",
    summary:
      "Sparse tag pages make a blog app feel fake faster than almost any other route surface.",
    excerpt:
      "Once a reader lands on a thin tag archive, the rest of the product starts to look like scaffolding instead of a publication.",
    authorSlug: "marta-solis",
    categorySlug: "editorial-ops",
    tagSlugs: ["taxonomy", "analytics", "workflow"],
    readTimeMinutes: 5,
    publishedOn: "2026-02-23",
    publishedAt: "February 23, 2026",
    heroNote:
      "Dense tags are operational work, but they pay off immediately when evaluators wander off the happy path.",
    outline: [
      "Why empty tags hurt trust",
      "Operational fixes that actually help",
    ],
    highlights: [
      "A tag should connect several posts before it appears in the UI.",
      "Archive depth is part of demo quality, not just content hygiene.",
      "The runtime story gets stronger when the content graph supports exploration.",
    ],
  },
  {
    slug: "fast-category-landing-pages",
    title: "Fast Category Landing Pages",
    summary:
      "Category pages need to feel deliberate without turning into heavy dashboards.",
    excerpt:
      "A light but expressive archive header, a confident card grid, and careful ordering can make category routes feel premium and fast.",
    authorSlug: "pavel-ivanov",
    categorySlug: "performance",
    tagSlugs: ["performance", "design", "ssg"],
    readTimeMinutes: 7,
    publishedOn: "2026-02-22",
    publishedAt: "February 22, 2026",
    heroNote:
      "Archive performance is often the first place where a beautifully styled demo quietly falls apart on real devices.",
    outline: [
      "Performance on archive-heavy pages",
      "Keeping design intensity cheap",
    ],
    highlights: [
      "Card density is useful only if it still scrolls and paints well.",
      "Static generation can make category pages feel instant when the calendar allows it.",
      "Shared design primitives should not force every route to pay the same cost.",
    ],
  },
  {
    slug: "data-contracts-for-custom-routes",
    title: "Data Contracts For Custom Routes",
    summary:
      "Custom mode needs a believable JSON backend shape so the route component really is decoupled from the framework transport.",
    excerpt:
      "The demo API should return post, author, category, and tag payloads that look like something an app team would actually ship.",
    authorSlug: "omar-haddad",
    categorySlug: "data-platform",
    tagSlugs: ["custom-data", "runtime", "analytics"],
    readTimeMinutes: 7,
    publishedOn: "2026-02-21",
    publishedAt: "February 21, 2026",
    heroNote:
      "If custom mode quietly depends on framework-owned transport, evaluators cannot tell what is really being demonstrated.",
    outline: [
      "Designing a believable API",
      "Decoupling without losing coherence",
    ],
    highlights: [
      "Custom responses should include related stories and taxonomy details, not just the post body.",
      "The JSON shape can mirror the editorial graph without mirroring internal framework types.",
      "A separate API surface clarifies what the component owns.",
    ],
  },
  {
    slug: "design-tokens-for-a-newsroom-ui",
    title: "Design Tokens For A Newsroom UI",
    summary:
      "A good showcase should look like a product with taste, not the first neutral component library theme that happened to compile.",
    excerpt:
      "Strong typography, warm surfaces, and a tight card system give Northstar Journal a clear identity without fighting readability.",
    authorSlug: "sana-malik",
    categorySlug: "design-systems",
    tagSlugs: ["design", "performance", "workflow"],
    readTimeMinutes: 6,
    publishedOn: "2026-02-20",
    publishedAt: "February 20, 2026",
    heroNote:
      "The visual system should make evaluators want to browse the app long enough to discover whether the routes really hold together.",
    outline: [
      "Setting the visual direction",
      "Using tokens to keep pages coherent",
    ],
    highlights: [
      "Color and spacing need to help content hierarchy, not distract from it.",
      "A reusable token set keeps later route additions from drifting stylistically.",
      "Performance still matters, so the UI should avoid expensive ornament for its own sake.",
    ],
  },
  {
    slug: "when-hydration-actually-helps",
    title: "When Hydration Actually Helps",
    summary:
      "Hydration is worth the extra machinery when the page already starts from complete HTML and then gains meaningful interaction.",
    excerpt:
      "The hydrated route should prove a real takeover path instead of merely shipping bootstrap JSON for no visible reason.",
    authorSlug: "niko-drummond",
    categorySlug: "engineering",
    tagSlugs: ["hydration", "csr", "ssr"],
    readTimeMinutes: 6,
    publishedOn: "2026-02-19",
    publishedAt: "February 19, 2026",
    heroNote:
      "A small but visible route-level interaction is enough to show that the app really did continue from the server markup.",
    outline: ["Hydration with a purpose", "Where the handoff earns its keep"],
    highlights: [
      "The page should be readable before the browser entry runs.",
      "The interaction should reuse the existing DOM instead of replacing it blindly.",
      "Hydrated routing should still look like the same publication surface as SSR.",
    ],
  },
  {
    slug: "keeping-shell-and-custom-honest",
    title: "Keeping Shell And Custom Honest",
    summary:
      "Shell and custom modes look similar at first glance, so the demo has to make their data ownership boundaries unmistakable.",
    excerpt:
      "One mode loads through framework transport while the other fetches from a separate JSON API owned by the route or app.",
    authorSlug: "ivy-chen",
    categorySlug: "developer-experience",
    tagSlugs: ["shell", "custom-data", "runtime"],
    readTimeMinutes: 5,
    publishedOn: "2026-02-18",
    publishedAt: "February 18, 2026",
    heroNote:
      "If evaluators cannot tell which layer owns data in each mode, the comparison loses most of its educational value.",
    outline: [
      "Where shell and custom diverge",
      "Showing the difference on screen",
    ],
    highlights: [
      "The runtime panel should say who owns data loading on the current page.",
      "Network endpoints should differ cleanly between the two modes.",
      "The visible UI can stay shared even when the data path changes underneath.",
    ],
  },
  {
    slug: "editorial-workflows-for-thirty-posts",
    title: "Editorial Workflows For Thirty Posts",
    summary:
      "A richer showcase needs enough volume to support archives, not just a few hand-picked routes.",
    excerpt:
      "Thirty posts create the minimum density needed for author pages, categories, tags, related stories, and homepage curation to feel real.",
    authorSlug: "marta-solis",
    categorySlug: "editorial-ops",
    tagSlugs: ["workflow", "analytics", "taxonomy"],
    readTimeMinutes: 6,
    publishedOn: "2026-02-17",
    publishedAt: "February 17, 2026",
    heroNote:
      "Volume changes the design problem because archive navigation starts to matter as much as the hero route.",
    outline: ["Why density changes everything", "Operating the content graph"],
    highlights: [
      "More posts create stronger related-story suggestions automatically.",
      "Archive pages become a meaningful evaluation surface once they have depth.",
      "Density also forces the chrome and layout primitives to scale.",
    ],
  },
  {
    slug: "roadmap-notes-from-the-blog-team",
    title: "Roadmap Notes From The Blog Team",
    summary:
      "The publication roadmap is as much about what not to demo as what to ship.",
    excerpt:
      "A focused evaluator app works because it chooses routes that reinforce each other instead of scattering attention across unrelated tricks.",
    authorSlug: "leo-mercier",
    categorySlug: "product-strategy",
    tagSlugs: ["workflow", "runtime", "analytics"],
    readTimeMinutes: 5,
    publishedOn: "2026-02-16",
    publishedAt: "February 16, 2026",
    heroNote:
      "Product clarity shows up in route structure, copy choices, and what the homepage decides to spotlight.",
    outline: ["Planning the right scope", "What gets cut and why"],
    highlights: [
      "A blog product gives the framework something concrete to prove.",
      "Focused scope makes the five-mode comparison easier to scan.",
      "The walkthrough can explain choices without replacing the live app.",
    ],
  },
  {
    slug: "field-report-on-mobile-reading",
    title: "Field Report On Mobile Reading",
    summary:
      "A newsroom-style interface has to collapse gracefully on narrow screens without feeling like a stripped desktop layout.",
    excerpt:
      "Mobile readers care about hierarchy, rhythm, and payload discipline long before they care which runtime was involved.",
    authorSlug: "zoe-washington",
    categorySlug: "field-notes",
    tagSlugs: ["design", "performance", "shell"],
    readTimeMinutes: 6,
    publishedOn: "2026-02-15",
    publishedAt: "February 15, 2026",
    heroNote:
      "Mobile browsing is where the app either starts to feel like a real publication or reveals itself as a desktop-only mockup.",
    outline: [
      "Reading on small screens",
      "What responsive editorial design has to protect",
    ],
    highlights: [
      "Mode pills and runtime aids should still fit without swallowing the article.",
      "Card grids need to compress into confident single-column stacks.",
      "Shell and custom routes especially benefit from careful mobile pacing.",
    ],
  },
  {
    slug: "measuring-ssg-freshness",
    title: "Measuring SSG Freshness",
    summary:
      "Static routes need a freshness story once the publication starts to look alive and current.",
    excerpt:
      "A startup-built SSG cache can still feel current when the app clearly communicates what was materialized and when.",
    authorSlug: "omar-haddad",
    categorySlug: "data-platform",
    tagSlugs: ["ssg", "analytics", "workflow"],
    readTimeMinutes: 6,
    publishedOn: "2026-02-14",
    publishedAt: "February 14, 2026",
    heroNote:
      "SSG is easier to trust when freshness is explicit instead of implied by lucky timing.",
    outline: [
      "Freshness as product context",
      "How to talk about generated output",
    ],
    highlights: [
      "Generated pages should be discoverable from the same gallery surface.",
      "The walkthrough can explain when static output is materialized.",
      "Freshness cues keep SSG from feeling like a frozen branch of the app.",
    ],
  },
  {
    slug: "the-people-behind-the-taxonomy",
    title: "The People Behind The Taxonomy",
    summary:
      "Taxonomy quality comes from editorial judgment, not just slug counts and auto-generated pages.",
    excerpt:
      "The people choosing category and tag structure shape how navigable the product feels across every route family.",
    authorSlug: "zoe-washington",
    categorySlug: "editorial-ops",
    tagSlugs: ["taxonomy", "design", "workflow"],
    readTimeMinutes: 4,
    publishedOn: "2026-02-13",
    publishedAt: "February 13, 2026",
    heroNote:
      "A believable archive system needs human editorial intent behind it, especially when readers start exploring sideways.",
    outline: ["Taxonomy as editorial craft", "What readers notice immediately"],
    highlights: [
      "Good taxonomy makes related stories feel inevitable rather than random.",
      "Reader trust rises when categories and tags consistently map to useful archives.",
      "The author and taxonomy systems should reinforce each other.",
    ],
  },
  {
    slug: "rendering-trust-through-consistency",
    title: "Rendering Trust Through Consistency",
    summary:
      "Consistency across modes is what makes the runtime differences legible instead of chaotic.",
    excerpt:
      "When the layout, content graph, and navigation stay steady, evaluators can isolate what SSG, SSR, and CSR are actually doing.",
    authorSlug: "niko-drummond",
    categorySlug: "engineering",
    tagSlugs: ["ssr", "ssg", "design"],
    readTimeMinutes: 7,
    publishedOn: "2026-02-12",
    publishedAt: "February 12, 2026",
    heroNote:
      "Consistency is not aesthetic fussiness here; it is the condition that makes the framework story comparable.",
    outline: [
      "Why visual consistency matters technically",
      "Protecting the shared experience",
    ],
    highlights: [
      "A shared design language makes mode switching far easier to read.",
      "Inconsistent content would obscure whether the runtime or the page changed.",
      "The framework is easier to trust when its modes feel like variants of one product.",
    ],
  },
  {
    slug: "why-this-demo-is-a-blog-app",
    title: "Why This Demo Is A Blog App",
    summary:
      "A blog product has enough route depth, metadata, and browsing behavior to make runtime comparisons meaningful fast.",
    excerpt:
      "Posts, authors, categories, and tags create a compact but realistic graph that can stress SSG, SSR, hydrated, shell, and custom delivery honestly.",
    authorSlug: "leo-mercier",
    categorySlug: "field-notes",
    tagSlugs: ["runtime", "custom-data", "workflow"],
    readTimeMinutes: 5,
    publishedOn: "2026-02-11",
    publishedAt: "February 11, 2026",
    heroNote:
      "The blog shape is familiar enough that evaluators can orient immediately and deep enough that routing details matter.",
    outline: [
      "Why a blog is the right proving ground",
      "What the format buys us",
    ],
    highlights: [
      "Every entity family becomes navigable within minutes.",
      "The app can prove both static and dynamic delivery paths without changing domain.",
      "A blog makes documentation and demos reinforce the same mental model.",
    ],
  },
] satisfies ShowcasePostSeed[];
