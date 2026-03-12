import { startShowcaseServerWithFallback } from "./server";

function getPort() {
  const value = Number(process.env.PORT ?? "3000");
  return Number.isFinite(value) ? value : 3000;
}

const preferredPort = getPort();
const server = await startShowcaseServerWithFallback(preferredPort);
const address = server.address();
const actualPort =
  address && typeof address !== "string" ? address.port : preferredPort;

console.log(`van-stack showcase running at http://127.0.0.1:${actualPort}`);
