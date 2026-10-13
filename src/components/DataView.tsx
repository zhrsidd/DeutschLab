import { useState } from "react";

import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Database, Download, FolderOpen } from "lucide-react";

import { APP_VERSION } from "../lib/appInfo";
import {
  canSnapshot,
  createSnapshot,
  exportBackup,
  type SavedBackup,
} from "../lib/backup";

import { ErrorMessage } from "./lesson/LessonParts";

type Busy = "export" | "snapshot" | null;

/*
 * "Your data": local backups. Exporting only reads the database. There is no
 * in-app restore in v1.0; the steps for restoring a snapshot by hand are
 * shown instead (see docs/V1_RELEASE_REPORT.md).
 */
export default function DataView() {
  const [busy, setBusy] = useState<Busy>(null);
  const [exported, setExported] = useState<SavedBackup | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const native = canSnapshot();

  const run = async (kind: Exclude<Busy, null>) => {
    setError(null);
    setBusy(kind);

    try {
      if (kind === "export") setExported(await exportBackup());
      else setSnapshot(await createSnapshot());
    } catch (runError) {
      console.error("Backup failed:", runError);
      setError(
        kind === "export"
          ? "The backup could not be written. Your learning data is unchanged."
          : "The snapshot could not be written. Your learning data is unchanged.",
      );
    } finally {
      setBusy(null);
    }
  };

  const reveal = (path: string) => {
    void revealItemInDir(path).catch((revealError: unknown) => {
      console.error("Could not show the file:", revealError);
    });
  };

  return (
    <div className="dl-enter px-5 py-6 md:px-10 md:py-9">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-neutral-400">Local backup</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Your data</h1>
          <p className="mt-2 max-w-xl text-neutral-500">
            Your progress, reviews, mistakes, checkpoint attempts, writing drafts
            and settings stay on this Mac. Make a backup before big changes, or
            from time to time.
          </p>
        </header>

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <div className="grid gap-4">
          <section aria-label="Export" className="rounded-2xl border border-black/5 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                <Download size={19} strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold tracking-tight">Export learning data</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  A readable, versioned JSON file with everything DeutschLab has
                  stored for you. Exporting never changes your data.
                </p>

                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void run("export")}
                  className="mt-4 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors enabled:hover:bg-neutral-800 disabled:opacity-40"
                >
                  {busy === "export" ? "Exporting…" : "Export backup"}
                </button>

                {exported ? (
                  <div role="status" className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    {exported.kind === "file" ? (
                      <>
                        <p>Saved to</p>
                        <p className="mt-1 break-all font-mono text-xs">{exported.path}</p>
                        <button
                          type="button"
                          onClick={() => reveal(exported.path)}
                          className="mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                        >
                          <FolderOpen size={15} />
                          Show in Finder
                        </button>
                      </>
                    ) : (
                      <p>Downloaded {exported.fileName}.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-label="Snapshot" className="rounded-2xl border border-black/5 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                <Database size={19} strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold tracking-tight">Database snapshot</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  An exact copy of your database file, the safest thing to keep
                  for a full restore. Snapshots are never overwritten.
                </p>

                <button
                  type="button"
                  disabled={busy !== null || !native}
                  onClick={() => void run("snapshot")}
                  className="mt-4 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors enabled:hover:bg-neutral-50 disabled:opacity-40"
                >
                  {busy === "snapshot" ? "Saving…" : "Save snapshot"}
                </button>

                {!native ? (
                  <p className="mt-2 text-xs text-neutral-400">
                    Available in the DeutschLab app, not in a browser preview.
                  </p>
                ) : null}

                {snapshot ? (
                  <div role="status" className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    <p>Saved to</p>
                    <p className="mt-1 break-all font-mono text-xs">{snapshot}</p>
                    <button
                      type="button"
                      onClick={() => reveal(snapshot)}
                      className="mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    >
                      <FolderOpen size={15} />
                      Show in Finder
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-label="Restoring" className="rounded-2xl border border-black/5 bg-neutral-50 p-6">
            <h2 className="font-semibold tracking-tight">Restoring</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              DeutschLab {APP_VERSION} cannot restore inside the app yet, so
              nothing can be overwritten by accident. To restore a snapshot by
              hand:
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-neutral-600">
              <li>Quit DeutschLab.</li>
              <li>
                In the app's data folder, move <code>deutschlab.db</code>,{" "}
                <code>deutschlab.db-wal</code> and <code>deutschlab.db-shm</code>{" "}
                somewhere safe.
              </li>
              <li>
                Copy the snapshot from <code>backups</code> into the folder and
                rename it <code>deutschlab.db</code>.
              </li>
              <li>Open DeutschLab again.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
