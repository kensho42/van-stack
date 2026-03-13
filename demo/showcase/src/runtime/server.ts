import { createServer } from "node:http";

import { handleShowcaseRequest } from "./app";
import { warmShowcaseAssets } from "./assets";
import { warmShowcaseSsgCache } from "./ssg-cache";

function getPort() {
  const value = Number(process.env.PORT ?? "3000");
  return Number.isFinite(value) ? value : 3000;
}

function createShowcaseServer() {
  return createServer(async (req, res) => {
    const url = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? "localhost"}`,
    );
    const response = await handleShowcaseRequest(
      new Request(url, {
        method: req.method,
      }),
    );

    res.writeHead(response.status, {
      "content-type":
        response.headers.get("content-type") ?? "text/html; charset=utf-8",
    });
    res.end(await response.text());
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
