import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

createServer(async (request, response) => {
  const pathname = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const file = normalize(join(root, pathname));

  if (!file.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(file)] || "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(4173, "0.0.0.0", () => {
  console.log("frontend preview listening on :4173");
});
