import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { APP_NAME, APP_VERSION } from "./appInfo";

describe("app info", () => {
  it("matches the native app, npm package and Cargo versions", () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "src-tauri/tauri.conf.json"), "utf8"),
    ) as { productName: string; version: string; identifier: string };

    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as { version: string };
    const cargo = readFileSync(resolve(process.cwd(), "src-tauri/Cargo.toml"), "utf8");

    expect(config.version).toBe(APP_VERSION);
    expect(pkg.version).toBe(APP_VERSION);
    expect(cargo).toMatch(new RegExp(`^version = "${APP_VERSION}"`, "m"));
    expect(config.productName).toBe(APP_NAME);
    // The identifier decides where deutschlab.db lives; it must never change.
    expect(config.identifier).toBe("com.deutschlab.app");
  });
});
