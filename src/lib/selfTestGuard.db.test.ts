// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetTestDatabase } from "../test/fakeSqlPlugin";

const opened = vi.hoisted(() => [] as string[]);

vi.mock("@tauri-apps/plugin-sql", async () => {
  const fake = await import("../test/fakeSqlPlugin");
  return {
    default: class extends fake.default {
      static async load(path: string) {
        opened.push(path);
        return fake.default.load(path);
      }
    },
  };
});

beforeEach(() => {
  vi.resetModules();
  resetTestDatabase();
  opened.length = 0;
});

describe("native self-test database switch", () => {
  it("normal starts open only the learner database", async () => {
    const db = await import("./db");
    await db.initialiseDatabase();
    expect(opened).toEqual(["sqlite:deutschlab.db"]);
  });

  it("the self-test opens only deutschlab-selftest.db", async () => {
    const db = await import("./db");
    db.useSelfTestDatabase();
    await db.initialiseDatabase();
    expect(opened).toEqual(["sqlite:deutschlab-selftest.db"]);
  });

  it("cannot switch once the learner database is open", async () => {
    const db = await import("./db");
    await db.initialiseDatabase();
    expect(() => db.useSelfTestDatabase()).toThrow(/already open/);
  });
});
