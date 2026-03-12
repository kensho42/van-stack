function createHtml(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

function renderLandingPage() {
  return createHtml(
    "van-stack Showcase",
    `
      <main>
        <h1>van-stack Showcase</h1>
        <p>Evaluate the same blog app through two demo tracks.</p>
        <nav>
          <a href="/gallery">Runtime Gallery</a>
          <a href="/walkthrough">Guided Walkthrough</a>
        </nav>
      </main>
    `,
  );
}

function renderPostNotFound() {
  return createHtml(
    "Post not found",
    `
      <main>
        <h1>Post not found</h1>
        <p>The showcase could not find that blog post.</p>
      </main>
    `,
    404,
  );
}

function renderRouteNotFound() {
  return createHtml(
    "Showcase page not found",
    `
      <main>
        <h1>Showcase page not found</h1>
        <p>Return to the landing page to choose a valid demo track.</p>
      </main>
    `,
    404,
  );
}

export async function handleShowcaseRequest(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname === "/") {
    return renderLandingPage();
  }

  if (pathname.startsWith("/gallery/") && pathname.includes("/posts/")) {
    return renderPostNotFound();
  }

  return renderRouteNotFound();
}
