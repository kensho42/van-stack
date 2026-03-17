import { randomUUID } from "node:crypto";

import {
  getShowcaseInitialLikeCount,
  requireShowcasePost,
} from "../content/blog";

export const showcaseSessionCookieName = "showcase-session";

export type ShowcaseInteractionState = {
  bookmarked: boolean;
  likes: number;
};

const interactionStore = new Map<
  string,
  Map<string, ShowcaseInteractionState>
>();

function parseCookieHeader(header: string | null) {
  const values = new Map<string, string>();

  if (!header) {
    return values;
  }

  for (const entry of header.split(";")) {
    const [rawName, ...rawValue] = entry.trim().split("=");
    if (!rawName) {
      continue;
    }

    values.set(rawName, rawValue.join("="));
  }

  return values;
}

export function readShowcaseSessionId(request: Request) {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  return cookies.get(showcaseSessionCookieName) ?? null;
}

function getSessionMap(sessionId: string) {
  const existing = interactionStore.get(sessionId);
  if (existing) {
    return existing;
  }

  const created = new Map<string, ShowcaseInteractionState>();
  interactionStore.set(sessionId, created);
  return created;
}

function createInitialState(slug: string): ShowcaseInteractionState {
  const post = requireShowcasePost(slug);

  return {
    likes: getShowcaseInitialLikeCount(post),
    bookmarked: false,
  };
}

function getInteractionState(sessionId: string, slug: string) {
  const session = getSessionMap(sessionId);
  const existing = session.get(slug);
  if (existing) {
    return existing;
  }

  const created = createInitialState(slug);
  session.set(slug, created);
  return created;
}

export function resolveShowcaseSession(request: Request) {
  const existing = readShowcaseSessionId(request);

  if (existing) {
    return {
      sessionId: existing,
      setCookie: null,
    };
  }

  const sessionId = randomUUID();

  return {
    sessionId,
    setCookie: `${showcaseSessionCookieName}=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
  };
}

export function readShowcaseInteractionState(sessionId: string, slug: string) {
  const state = getInteractionState(sessionId, slug);

  return {
    likes: state.likes,
    bookmarked: state.bookmarked,
  };
}

export function likeShowcasePost(sessionId: string, slug: string) {
  const state = getInteractionState(sessionId, slug);
  state.likes += 1;

  return {
    likes: state.likes,
    bookmarked: state.bookmarked,
  };
}

export function toggleShowcaseBookmark(sessionId: string, slug: string) {
  const state = getInteractionState(sessionId, slug);
  state.bookmarked = !state.bookmarked;

  return {
    likes: state.likes,
    bookmarked: state.bookmarked,
  };
}
