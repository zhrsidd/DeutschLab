// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  classifyUpdateError,
  compareVersions,
  createUpdater,
  isNewerVersion,
  type DownloadEvent,
  type UpdateHandle,
  type UpdaterBackend,
} from "./updater";

function handle(version: string, run?: (emit: (event: DownloadEvent) => void) => Promise<void>): UpdateHandle {
  return {
    version,
    body: " Fixes things. ",
    date: null,
    downloadAndInstall: async (emit) => {
      if (run) return run(emit);
      emit({ event: "Started", data: { contentLength: 100 } });
      emit({ event: "Progress", data: { chunkLength: 40 } });
      emit({ event: "Progress", data: { chunkLength: 60 } });
      emit({ event: "Finished" });
    },
  };
}

function backend(over: Partial<UpdaterBackend> = {}): UpdaterBackend & { relaunch: ReturnType<typeof vi.fn> } {
  return {
    available: () => true,
    check: async () => null,
    relaunch: vi.fn(async () => undefined),
    ...over,
  } as UpdaterBackend & { relaunch: ReturnType<typeof vi.fn> };
}

beforeEach(() => window.localStorage.clear());

describe("version comparison", () => {
  it("orders versions numerically, not lexically", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("v1.0.1", "1.0.2")).toBe(-1);
    expect(compareVersions("1.1", "1.0.9")).toBe(1);
    expect(compareVersions("2.0.0-beta.1", "2.0.0")).toBe(-1);
  });

  it("only treats strictly newer versions as updates", () => {
    expect(isNewerVersion("1.0.1", "1.0.0")).toBe(true);
    expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false);
    expect(isNewerVersion("0.9.0", "1.0.0")).toBe(false);
  });
});

describe("update discovery", () => {
  it("reports an available update with trimmed notes", async () => {
    const u = createUpdater(backend({ check: async () => handle("1.1.0") }), "1.0.0");
    await u.check(true);
    expect(u.getState()).toMatchObject({ status: "available", version: "1.1.0", notes: "Fixes things." });
    expect(u.isNoticeVisible()).toBe(true);
  });

  it("is up to date when none exists or the server offers an older/equal version", async () => {
    for (const found of [null, handle("1.0.0"), handle("0.9.0")]) {
      const u = createUpdater(backend({ check: async () => found }), "1.0.0");
      await u.check(true);
      expect(u.getState().status).toBe("uptodate");
    }
  });

  it("does nothing outside the native app", async () => {
    const check = vi.fn();
    const u = createUpdater(backend({ available: () => false, check }), "1.0.0");
    await u.check(false);
    expect(u.getState().status).toBe("unsupported");
    expect(check).not.toHaveBeenCalled();
  });

  it("fails silently in the background but reports a manual check", async () => {
    const failing = backend({ check: async () => { throw new Error("error sending request for url"); } });
    const quiet = createUpdater(failing, "1.0.0");
    await quiet.check(false);
    expect(quiet.getState().status).toBe("idle");
    expect(quiet.isNoticeVisible()).toBe(false);

    const loud = createUpdater(failing, "1.0.0");
    await loud.check(true);
    expect(loud.getState()).toMatchObject({ status: "error", during: "check", kind: "offline" });
    expect(loud.isNoticeVisible()).toBe(false); // shown in Settings, not as a popup
  });
});

describe("error classification", () => {
  it("separates signature, offline, download and unknown failures", () => {
    expect(classifyUpdateError(new Error("signature verification failed"), "install").kind).toBe("signature");
    expect(classifyUpdateError("network is unreachable", "check").kind).toBe("offline");
    expect(classifyUpdateError(new Error("stream closed"), "install").kind).toBe("download");
    expect(classifyUpdateError(new Error("404 not found"), "check").kind).toBe("unknown");
  });
});

describe("deferral", () => {
  it("hides a deferred version in the background but shows it again on a manual check", async () => {
    const be = backend({ check: async () => handle("1.1.0") });
    const first = createUpdater(be, "1.0.0");
    await first.check(false);
    first.defer();
    expect(first.isNoticeVisible()).toBe(false);

    // A later launch (new controller) still honours "Later" for that version…
    const second = createUpdater(be, "1.0.0");
    await second.check(false);
    expect(second.getState().status).toBe("available");
    expect(second.isNoticeVisible()).toBe(false);

    // …but a newer version is announced, and a manual check always surfaces it.
    const newer = createUpdater(backend({ check: async () => handle("1.2.0") }), "1.0.0");
    await newer.check(false);
    expect(newer.isNoticeVisible()).toBe(true);
    await second.check(true);
    expect(second.isNoticeVisible()).toBe(true);
  });
});

describe("install and restart", () => {
  it("reports progress, then relaunches", async () => {
    const be = backend({ check: async () => handle("1.1.0") });
    const u = createUpdater(be, "1.0.0");
    await u.check(true);
    const seen: number[] = [];
    u.subscribe(() => {
      const s = u.getState();
      if (s.status === "downloading") seen.push(s.downloaded);
    });
    await u.install();
    expect(seen).toContain(40);
    expect(seen).toContain(100);
    expect(be.relaunch).toHaveBeenCalledTimes(1);
  });

  it("refuses to install or restart while a lesson is open", async () => {
    const be = backend({ check: async () => handle("1.1.0") });
    const u = createUpdater(be, "1.0.0");
    u.setBusyGuard(() => true);
    await u.check(true);
    await u.install();
    expect(u.getState().status).toBe("available");
    expect(be.relaunch).not.toHaveBeenCalled();
  });

  it("waits for the learner if a lesson starts during the download", async () => {
    let busy = false;
    const be = backend({ check: async () => handle("1.1.0", async () => { busy = true; }) });
    const u = createUpdater(be, "1.0.0");
    u.setBusyGuard(() => busy);
    await u.check(true);
    await u.install();
    expect(u.getState()).toMatchObject({ status: "ready", version: "1.1.0" });
    expect(be.relaunch).not.toHaveBeenCalled();
    busy = false;
    await u.restart();
    expect(be.relaunch).toHaveBeenCalledTimes(1);
  });

  it("surfaces a failed download or bad signature and allows retry without relaunching", async () => {
    let attempts = 0;
    const be = backend({
      check: async () =>
        handle("1.1.0", async () => {
          attempts += 1;
          if (attempts === 1) throw new Error("signature mismatch");
        }),
    });
    const u = createUpdater(be, "1.0.0");
    await u.check(true);
    await u.install();
    expect(u.getState()).toMatchObject({ status: "error", during: "install", kind: "signature" });
    expect(u.isNoticeVisible()).toBe(true);
    expect(be.relaunch).not.toHaveBeenCalled();
    u.clearError();
    expect(u.getState().status).toBe("available");
    await u.install();
    expect(be.relaunch).toHaveBeenCalledTimes(1);
  });

  it("falls back to a manual restart if relaunch fails", async () => {
    const be = backend({ check: async () => handle("1.1.0") });
    be.relaunch.mockRejectedValueOnce(new Error("nope"));
    const u = createUpdater(be, "1.0.0");
    await u.check(true);
    await u.install();
    expect(u.getState()).toMatchObject({ status: "ready", version: "1.1.0" });
  });
});
