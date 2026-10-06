import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const versionFile = process.env.VITE_RELEASE_VERSION || "development";

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const index = await readFile(resolve(root, "src/index.html"), "utf8");
const renderedIndex = index.replaceAll("__RELEASE_VERSION__", versionFile.trim());

await writeFile(resolve(dist, "index.html"), renderedIndex);
await cp(resolve(root, "src/app.js"), resolve(dist, "app.js"));
await cp(resolve(root, "src/styles.css"), resolve(dist, "styles.css"));
