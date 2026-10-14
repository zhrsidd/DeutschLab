// Verifies package.json, tauri.conf.json, Cargo.toml (and Cargo.lock) and
// src/lib/appInfo.ts carry the same version, optionally equal to a tag.
// Usage: node scripts/check-version.mjs [vX.Y.Z]
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const versions = {
  "package.json": JSON.parse(read("package.json")).version,
  "src-tauri/tauri.conf.json": JSON.parse(read("src-tauri/tauri.conf.json")).version,
  "src-tauri/Cargo.toml": read("src-tauri/Cargo.toml").match(/^version = "([^"]+)"/m)?.[1],
  "src-tauri/Cargo.lock": read("src-tauri/Cargo.lock").match(/name = "deutschlab"\nversion = "([^"]+)"/)?.[1],
  "src/lib/appInfo.ts": read("src/lib/appInfo.ts").match(/APP_VERSION = "([^"]+)"/)?.[1],
};
const tag = process.argv[2]?.replace(/^v/, "");
if (tag) versions[`tag v${tag}`] = tag;

const distinct = new Set(Object.values(versions));
if (distinct.size !== 1 || distinct.has(undefined)) {
  console.error("Version mismatch:");
  for (const [file, version] of Object.entries(versions)) console.error(`  ${file}: ${version}`);
  process.exit(1);
}
console.log(`All versions agree: ${[...distinct][0]}`);
