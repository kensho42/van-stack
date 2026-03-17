export default function route() {
  return new Response("User-agent: *\nAllow: /\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
