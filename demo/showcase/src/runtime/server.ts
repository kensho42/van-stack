import { createServer } from "node:http";

import { handleShowcaseRequest } from "./app";
import { warmShowcaseAssets } from "./assets";
import { warmShowcaseSsgCache } from "./ssg-cache";

function getPort() {
  const value = Number(process.env.PORT ?? "3000");
  return Number.isFinite(value) ? value : 3000;
}

async function readRequestBody(request: import("node:http").IncomingMessage) {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    chunks.push(
      typeof chunk === "string" ? Buffer.from(chunk) : new Uint8Array(chunk),
    );
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

function createShowcaseServer() {
  return createServer(async (req, res) => {
    const url = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? "localhost"}`,
    );
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          headers.append(name, entry);
        }
        continue;
      }

      if (typeof value === "string") {
        headers.set(name, value);
      }
    }
    const body =
      req.method && req.method !== "GET" && req.method !== "HEAD"
        ? await readRequestBody(req)
        : undefined;
    const response = await handleShowcaseRequest(
      new Request(url, {
        method: req.method,
        headers,
        body,
      }),
    );

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    if (!("content-type" in responseHeaders)) {
      responseHeaders["content-type"] = "text/html; charset=utf-8";
    }

    res.writeHead(response.status, responseHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}

export function warmShowcaseRuntime() {
  return Promise.all([warmShowcaseAssets(), warmShowcaseSsgCache()]);
}

function listenOnPort(
  server: ReturnType<typeof createShowcaseServer>,
  port: number,
) {
  return new Promise<ReturnType<typeof createShowcaseServer>>(
    (resolve, reject) => {
      const handleError = (error: NodeJS.ErrnoException) => {
        server.off("listening", handleListening);
        reject(error);
      };
      const handleListening = () => {
        server.off("error", handleError);
        resolve(server);
      };

      server.once("error", handleError);
      server.once("listening", handleListening);
      server.listen(port);
    },
  );
}

export function startShowcaseServer(port = getPort()) {
  const server = createShowcaseServer();
  server.listen(port);
  return server;
}

export async function startShowcaseServerWithFallback(
  preferredPort = getPort(),
) {
  const candidatePorts =
    preferredPort === 0
      ? [0]
      : [
          preferredPort,
          preferredPort + 1,
          preferredPort + 2,
          preferredPort + 3,
        ];
  let lastError: unknown = null;

  for (const port of candidatePorts) {
    try {
      return await listenOnPort(createShowcaseServer(), port);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}
