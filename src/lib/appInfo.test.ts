import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { APP_NAME, APP_VERSION } from "./appInfo";

describe("app info", () => {
  it("matches the native app's name and version", () => {
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "src-tauri/tauri.conf.json"), "utf8"),
    ) as { productName: string; version: string; identifier: string };

    expect(config.version).toBe(APP_VERSION);
    expect(config.productName).toBe(APP_NAME);
    // The identifier decides where deutschlab.db lives; it must never change.
    expect(config.identifier).toBe("com.deutschlab.app");
  });
});
