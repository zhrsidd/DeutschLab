/*
 * Test double for @tauri-apps/plugin-sql backed by Node's built-in SQLite.
 * Real SQL runs against an in-memory database, so schema, upserts and
 * queries in src/lib/db.ts are exercised for real; only the Tauri IPC
 * boundary is replaced.
 */

import { DatabaseSync } from "node:sqlite";

type Bind = null | number | bigint | string;

const holder = globalThis as unknown as { __sqliteTestDb?: DatabaseSync };

/** Starts a brand-new empty database for the next test. */
export function resetTestDatabase(): DatabaseSync {
  holder.__sqliteTestDb?.close();
  holder.__sqliteTestDb = new DatabaseSync(":memory:");

  return holder.__sqliteTestDb;
}

/** Uses an on-disk database instead (for WAL and backup tests). */
export function useTestDatabaseFile(path: string): DatabaseSync {
  holder.__sqliteTestDb?.close();
  holder.__sqliteTestDb = new DatabaseSync(path);
  return holder.__sqliteTestDb;
}

export function getTestDatabase(): DatabaseSync {
  return holder.__sqliteTestDb ?? resetTestDatabase();
}

export default class FakeDatabase {
  path: string;

  constructor(path: string) {
    this.path = path;
  }

  static async load(path: string) {
    return new FakeDatabase(path);
  }

  static get(path: string) {
    return new FakeDatabase(path);
  }

  async execute(query: string, values: unknown[] = []) {
    const result = getTestDatabase()
      .prepare(query)
      .run(...(values as Bind[]));

    return {
      rowsAffected: Number(result.changes),
      lastInsertId: Number(result.lastInsertRowid),
    };
  }

  async select<T>(query: string, values: unknown[] = []): Promise<T> {
    const rows = getTestDatabase()
      .prepare(query)
      .all(...(values as Bind[]));

    return rows.map((row) => ({ ...row })) as T;
  }

  async close() {
    return true;
  }
}
