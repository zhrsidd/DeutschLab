// Sets one version everywhere it lives. Usage: node scripts/bump-version.mjs 1.0.1
import { readFileSync, writeFileSync } from "node:fs";

const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next ?? "")) {
  console.error("Usage: node scripts/bump-version.mjs X.Y.Z");
  process.exit(1);
}
const path = (p) => new URL(`../${p}`, import.meta.url);
const edit = (p, fn) => writeFileSync(path(p), fn(readFileSync(path(p), "utf8")));

edit("package.json", (s) => s.replace(/"version": "[^"]+"/, `"version": "${next}"`));
edit("package-lock.json", (s) => s.replace(/("name": "deutschlab",\s*"version": ")[^"]+/, `$1${next}`).replace(/("packages": \{\s*"": \{\s*"name": "deutschlab",\s*"version": ")[^"]+/, `$1${next}`));
edit("src-tauri/tauri.conf.json", (s) => s.replace(/"version": "[^"]+"/, `"version": "${next}"`));
edit("src-tauri/Cargo.toml", (s) => s.replace(/^version = "[^"]+"/m, `version = "${next}"`));
edit("src-tauri/Cargo.lock", (s) => s.replace(/(name = "deutschlab"\nversion = ")[^"]+/, `$1${next}`));
edit("src/lib/appInfo.ts", (s) => s.replace(/APP_VERSION = "[^"]+"/, `APP_VERSION = "${next}"`));
console.log(`Version set to ${next}. Review with git diff, then commit.`);
