import { handleChunkedCsrRequest } from "./app";

const bun = (
  globalThis as {
    Bun?: {
      serve?: (options: {
        fetch: typeof handleChunkedCsrRequest;
        port: number;
      }) => { port: number };
    };
  }
).Bun;

if (!bun?.serve) {
  throw new Error("Bun.serve is unavailable in the current runtime.");
}

const server = bun.serve({
  fetch: handleChunkedCsrRequest,
  port: Number(process.env.PORT ?? 3000),
});

console.log(`Chunked CSR demo is listening on http://127.0.0.1:${server.port}`);
