import { DatabaseSync } from "node:sqlite";

import { test as base, expect } from "@playwright/test";

/*
 * The browser has no Tauri runtime. This fixture replaces ONLY the Tauri IPC
 * boundary: calls to `plugin:sql|*` are forwarded to an in-memory node:sqlite
 * database that lives in the test process, so the app's real SQL runs.
 *
 * NOT covered here (native-only): the real Tauri/sqlx SQLite plugin, the
 * on-disk database file, WKWebView behaviour, and macOS speech voices.
 */

type Bind = null | number | bigint | string;

export const test = base.extend<{ db: DatabaseSync }>({
  db: async ({}, use) => {
    const db = new DatabaseSync(":memory:");
    await use(db);
    db.close();
  },

  page: async ({ page, db }, use) => {
    await page.exposeFunction(
      "__tauriInvoke",
      (command: string, args: { db?: string; query?: string; values?: Bind[] }) => {
        switch (command) {
          case "plugin:sql|load":
            return args.db;
          case "plugin:sql|execute": {
            const result = db.prepare(args.query ?? "").run(...(args.values ?? []));
            return [Number(result.changes), Number(result.lastInsertRowid)];
          }
          case "plugin:sql|select":
            return db
              .prepare(args.query ?? "")
              .all(...(args.values ?? []))
              .map((row) => ({ ...row }));
          case "plugin:sql|close":
            return true;
          default:
            throw new Error(`Unmocked Tauri command: ${command}`);
        }
      },
    );

    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;

      w.__TAURI_INTERNALS__ = {
        invoke: (command: string, args: unknown) =>
          (w.__tauriInvoke as (c: string, a: unknown) => Promise<unknown>)(
            command,
            args,
          ),
        transformCallback: () => 0,
      };
    });

    await use(page);
  },
});

export { expect };
