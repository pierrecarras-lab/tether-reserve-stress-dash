import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const docsRoot = join(root, "docs");
const port = Number(process.env.PORT || 5174);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
]);

const sendFile = async (res, filePath) => {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      await sendFile(res, join(filePath, "index.html"));
      return;
    }

    if (!fileStat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": contentTypes.get(extname(filePath)) || "application/octet-stream",
      "cache-control": "no-cache",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(docsRoot, requestedPath));

  if (!filePath.startsWith(docsRoot)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  await sendFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Circle product dashboard running on http://localhost:${port}`);
});
