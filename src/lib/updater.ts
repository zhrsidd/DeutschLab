import { useSyncExternalStore } from "react";

/*
 * In-app updates (Tauri updater). The native plugin verifies the minisign
 * signature of every download against the public key in tauri.conf.json; this
 * module never bypasses that. It only decides WHEN to check, WHAT to show and
 * never to restart while the learner is mid-lesson.
 */

export type UpdateErrorKind = "offline" | "signature" | "download" | "unknown";

export type UpdateState =
  | { status: "idle" }
  | { status: "unsupported" }
  | { status: "checking"; manual: boolean }
  | { status: "uptodate"; checkedAt: number }
  | { status: "available"; version: string; notes: string; date: string | null }
  | { status: "downloading"; version: string; downloaded: number; total: number | null }
  | { status: "ready"; version: string }
  | { status: "error"; during: "check" | "install"; kind: UpdateErrorKind; message: string };

export interface DownloadEvent {
  event: "Started" | "Progress" | "Finished";
  data?: { contentLength?: number; chunkLength?: number };
}

export interface UpdateHandle {
  version: string;
  body?: string | null;
  date?: string | null;
  downloadAndInstall(onEvent: (event: DownloadEvent) => void): Promise<void>;
}

export interface UpdaterBackend {
  available(): boolean;
  check(): Promise<UpdateHandle | null>;
  relaunch(): Promise<void>;
}

/** Numeric semver comparison (pre-release suffixes sort before the release). */
export function compareVersions(a: string, b: string): number {
  const parse = (value: string) => {
    const [core, pre] = value.trim().replace(/^v/, "").split("+")[0].split("-");
    const parts = core.split(".").map((part) => Number.parseInt(part, 10) || 0);
    while (parts.length < 3) parts.push(0);
    return { parts, pre: pre ?? "" };
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < 3; i += 1) {
    if (left.parts[i] !== right.parts[i]) return left.parts[i] > right.parts[i] ? 1 : -1;
  }
  if (left.pre === right.pre) return 0;
  if (left.pre === "") return 1;
  if (right.pre === "") return -1;
  return left.pre > right.pre ? 1 : -1;
}

export function isNewerVersion(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0;
}

export function classifyUpdateError(error: unknown, during: "check" | "install"): { kind: UpdateErrorKind; message: string } {
  const text = String(error instanceof Error ? error.message : error ?? "").toLowerCase();
  if (/signature|minisign|verif/.test(text)) {
    return {
      kind: "signature",
      message: "The update could not be verified, so it was not installed. Your app and data are unchanged.",
    };
  }
  if (/network|offline|error sending request|dns|connect|timed out|timeout|unreachable|failed to lookup/.test(text)) {
    return {
      kind: "offline",
      message: "Could not reach the update server. Check your internet connection and try again.",
    };
  }
  if (during === "install") {
    return { kind: "download", message: "The download did not finish. Nothing was changed; try again." };
  }
  // A missing release, 404 or malformed manifest is not the learner's problem.
  return { kind: "unknown", message: "No update information is available right now." };
}

const DISMISSED_KEY = "deutschlab.update.dismissedVersion";

function readDismissed(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function writeDismissed(version: string | null) {
  try {
    if (version) window.localStorage.setItem(DISMISSED_KEY, version);
    else window.localStorage.removeItem(DISMISSED_KEY);
  } catch {
    // Deferral is a convenience; losing it only means the notice shows again.
  }
}

export function createUpdater(backend: UpdaterBackend, currentVersion: string) {
  let state: UpdateState = { status: "idle" };
  let handle: UpdateHandle | null = null;
  let dismissed: string | null = null;
  let busy: () => boolean = () => false;
  const listeners = new Set<() => void>();

  const set = (next: UpdateState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  async function check(manual = false): Promise<void> {
    if (!backend.available()) {
      set({ status: "unsupported" });
      return;
    }
    if (state.status === "checking" || state.status === "downloading") return;
    if (!manual) dismissed = readDismissed();
    set({ status: "checking", manual });
    try {
      const found = await backend.check();
      if (found && isNewerVersion(found.version, currentVersion)) {
        handle = found;
        if (manual) {
          dismissed = null;
          writeDismissed(null);
        }
        set({ status: "available", version: found.version, notes: found.body?.trim() ?? "", date: found.date ?? null });
      } else {
        handle = null;
        set({ status: "uptodate", checkedAt: Date.now() });
      }
    } catch (error) {
      // Background checks fail silently; only a manual check reports problems.
      if (!manual) {
        set({ status: "idle" });
        return;
      }
      set({ status: "error", during: "check", ...classifyUpdateError(error, "check") });
    }
  }

  async function install(): Promise<void> {
    if (!handle || state.status === "downloading") return;
    if (busy()) return;
    const target = handle;
    let total: number | null = null;
    let downloaded = 0;
    set({ status: "downloading", version: target.version, downloaded: 0, total: null });
    try {
      await target.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data?.contentLength ?? null;
        if (event.event === "Progress") downloaded += event.data?.chunkLength ?? 0;
        set({ status: "downloading", version: target.version, downloaded, total });
      });
    } catch (error) {
      set({ status: "error", during: "install", ...classifyUpdateError(error, "install") });
      return;
    }
    // Never restart under a learner who started a lesson while this downloaded.
    if (busy()) {
      set({ status: "ready", version: target.version });
      return;
    }
    await restart(target.version);
  }

  async function restart(version?: string): Promise<void> {
    if (busy()) return;
    try {
      await backend.relaunch();
    } catch {
      set({ status: "ready", version: version ?? (handle?.version ?? currentVersion) });
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setBusyGuard(guard: () => boolean) {
      busy = guard;
    },
    check,
    install,
    restart: () => restart(),
    /** "Later": hide this version's notice until a newer one or a manual check. */
    defer() {
      if (state.status === "available") {
        dismissed = state.version;
        writeDismissed(state.version);
        set({ status: "idle" });
      }
    },
    /** True when the passive notice should be shown. */
    isNoticeVisible(): boolean {
      switch (state.status) {
        case "available":
          return dismissed !== state.version;
        case "downloading":
        case "ready":
          return true;
        case "error":
          return state.during === "install";
        default:
          return false;
      }
    },
    clearError() {
      if (state.status === "error") set(handle ? { status: "available", version: handle.version, notes: handle.body?.trim() ?? "", date: handle.date ?? null } : { status: "idle" });
    },
  };
}

export type Updater = ReturnType<typeof createUpdater>;

const tauriBackend: UpdaterBackend = {
  available: () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window,
  async check() {
    const { check } = await import("@tauri-apps/plugin-updater");
    return (await check()) as UpdateHandle | null;
  },
  async relaunch() {
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  },
};

let singleton: Updater | null = null;

export function getUpdater(currentVersion: string): Updater {
  singleton ??= createUpdater(tauriBackend, currentVersion);
  return singleton;
}

export function useUpdater(updater: Updater) {
  const state = useSyncExternalStore(updater.subscribe, updater.getState);
  return { state, visible: updater.isNoticeVisible() };
}
