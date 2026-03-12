import { createServer } from "node:http";

import { handleShowcaseRequest } from "./app";

function getPort() {
  const value = Number(process.env.PORT ?? "3000");
  return Number.isFinite(value) ? value : 3000;
}

export function startShowcaseServer(port = getPort()) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
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

  server.listen(port);
  return server;
}

if (import.meta.main) {
  const port = getPort();
  startShowcaseServer(port);
  console.log(`van-stack showcase running at http://127.0.0.1:${port}`);
}
