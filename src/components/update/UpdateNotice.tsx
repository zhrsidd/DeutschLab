import { type Updater, useUpdater } from "../../lib/updater";

function megabytes(bytes: number) {
  return (bytes / 1_048_576).toFixed(1);
}

/*
 * Passive update notice (DESIGN.md §7). Crimson = the one action, gold = "now".
 * Never rendered inside a lesson or checkpoint, so it cannot interrupt work.
 */
export default function UpdateNotice({ updater }: { updater: Updater }) {
  const { state, visible } = useUpdater(updater);
  if (!visible) return null;

  const shell =
    "fixed bottom-5 right-5 z-40 w-[min(24rem,calc(100vw-2.5rem))] rounded-lg border border-line-strong bg-elevated p-5";

  if (state.status === "available") {
    return (
      <aside role="region" aria-label="Update available" className={shell}>
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-highlight">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-highlight" />
          Update available
        </p>
        <p className="mt-2 font-semibold">DeutschLab {state.version}</p>
        {state.notes ? (
          <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-line text-sm leading-6 text-fg-2">{state.notes}</p>
        ) : null}
        <p className="mt-2 text-xs text-fg-3">Your progress, reviews and settings stay on this Mac.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void updater.install()}
            className="dl-press rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Update now
          </button>
          <button
            type="button"
            onClick={() => updater.defer()}
            className="dl-press rounded-md border border-line-strong bg-elevated px-4 py-2 text-sm hover:border-accent"
          >
            Later
          </button>
        </div>
      </aside>
    );
  }

  if (state.status === "downloading") {
    const share = state.total ? Math.min(1, state.downloaded / state.total) : null;
    return (
      <aside role="region" aria-label="Downloading update" className={shell}>
        <p className="font-semibold">Downloading {state.version}…</p>
        <div
          role="progressbar"
          aria-label="Update download"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={share === null ? undefined : Math.round(share * 100)}
          className="mt-3 h-1 overflow-hidden rounded-full bg-surface"
        >
          <div className="h-full bg-accent transition-[width]" style={{ width: `${(share ?? 0.1) * 100}%` }} />
        </div>
        <p className="tabular mt-2 text-xs text-fg-3">
          {state.total ? `${megabytes(state.downloaded)} of ${megabytes(state.total)} MB` : `${megabytes(state.downloaded)} MB`}
          {" · DeutschLab restarts when it is done."}
        </p>
      </aside>
    );
  }

  if (state.status === "ready") {
    return (
      <aside role="region" aria-label="Update installed" className={shell}>
        <p className="font-semibold">DeutschLab {state.version} is installed</p>
        <p className="mt-2 text-sm leading-6 text-fg-2">Restart to start using it.</p>
        <button
          type="button"
          onClick={() => void updater.restart()}
          className="dl-press mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          Restart now
        </button>
      </aside>
    );
  }

  if (state.status === "error") {
    return (
      <aside role="alert" className={shell}>
        <p className="font-semibold">Update not installed</p>
        <p className="mt-2 text-sm leading-6 text-fg-2">{state.message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              updater.clearError();
              void updater.install();
            }}
            className="dl-press rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => updater.clearError()}
            className="dl-press rounded-md border border-line-strong bg-elevated px-4 py-2 text-sm hover:border-accent"
          >
            Dismiss
          </button>
        </div>
      </aside>
    );
  }

  return null;
}
