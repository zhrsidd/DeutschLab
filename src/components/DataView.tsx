import { useState } from "react";

import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FolderOpen } from "lucide-react";

import { APP_VERSION } from "../lib/appInfo";
import {
  canSnapshot,
  createSnapshot,
  exportBackup,
  type SavedBackup,
} from "../lib/backup";

import { ErrorMessage } from "./lesson/LessonParts";
import { ButtonLoader } from "./shell/Loaders";

type Busy = "export" | "snapshot" | null;

/*
 * "Your data" (shown inside Settings): local backups. Exporting only reads the database. There is no
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
    <div>
      <p className="max-w-reading text-sm leading-6 text-fg-2">
        Your progress, reviews, mistakes, checkpoint attempts, writing drafts and settings stay on this
        Mac. Make a backup before big changes, or from time to time.
      </p>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <div className="mt-6 divide-y divide-line border-y border-line">
        <section aria-label="Export" className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <h3 className="font-medium">Export learning data</h3>
            <p className="mt-1 max-w-reading text-sm leading-6 text-fg-2">
              A readable, versioned JSON file with everything DeutschLab has stored for you. Exporting never
              changes your data.
            </p>
          </div>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("export")}
            className="dl-press justify-self-start rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent enabled:hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-2">
              {busy === "export" ? (
                <>
                  Exporting… <ButtonLoader />
                </>
              ) : (
                "Export backup"
              )}
            </span>
          </button>

          {exported ? (
            <div role="status" className="rounded-md bg-surface px-4 py-3 text-sm text-fg-2 md:col-span-2">
              {exported.kind === "file" ? (
                <SavedPath path={exported.path} onReveal={reveal} />
              ) : (
                <p>Downloaded {exported.fileName}.</p>
              )}
            </div>
          ) : null}
        </section>

        <section aria-label="Snapshot" className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <h3 className="font-medium">Database snapshot</h3>
            <p className="mt-1 max-w-reading text-sm leading-6 text-fg-2">
              An exact, consistent copy of your database file, the safest thing to keep for a full restore.
              Snapshots are never overwritten.
            </p>
            {!native ? (
              <p className="mt-1 text-xs text-fg-3">Available in the DeutschLab app, not in a browser preview.</p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={busy !== null || !native}
            onClick={() => void run("snapshot")}
            className="dl-press justify-self-start rounded-md border border-line bg-white px-4 py-2.5 text-sm font-medium enabled:hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-2">
              {busy === "snapshot" ? (
                <>
                  Saving… <ButtonLoader />
                </>
              ) : (
                "Save snapshot"
              )}
            </span>
          </button>

          {snapshot ? (
            <div role="status" className="rounded-md bg-surface px-4 py-3 text-sm text-fg-2 md:col-span-2">
              <SavedPath path={snapshot} onReveal={reveal} />
            </div>
          ) : null}
        </section>

        <section aria-label="Restoring" className="py-5">
          <h3 className="font-medium">Restoring</h3>
          <p className="mt-1 max-w-reading text-sm leading-6 text-fg-2">
            DeutschLab {APP_VERSION} cannot restore inside the app, so nothing can be overwritten by
            accident. To restore a snapshot by hand:
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-fg-2">
            <li>Quit DeutschLab.</li>
            <li>
              In the app's data folder, move <code>deutschlab.db</code>, <code>deutschlab.db-wal</code> and{" "}
              <code>deutschlab.db-shm</code> somewhere safe.
            </li>
            <li>
              Copy the snapshot from <code>backups</code> into the folder and rename it{" "}
              <code>deutschlab.db</code>.
            </li>
            <li>Open DeutschLab again.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}

function SavedPath({ path, onReveal }: { path: string; onReveal: (path: string) => void }) {
  return (
    <>
      <p>Saved to</p>
      <p className="mt-1 break-all font-mono text-xs">{path}</p>
      <button
        type="button"
        onClick={() => onReveal(path)}
        className="dl-press mt-3 flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:border-line-strong"
      >
        <FolderOpen size={15} />
        Show in Finder
      </button>
    </>
  );
}
