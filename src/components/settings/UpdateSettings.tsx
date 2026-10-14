import { APP_NAME, APP_VERSION } from "../../lib/appInfo";
import { type Updater, useUpdater } from "../../lib/updater";

function statusLine(state: ReturnType<typeof useUpdater>["state"]): { text: string; error: boolean } {
  switch (state.status) {
    case "checking":
      return { text: "Checking for updates…", error: false };
    case "uptodate":
      return { text: "You have the latest version.", error: false };
    case "available":
      return { text: `Version ${state.version} is available.`, error: false };
    case "downloading":
      return { text: `Downloading ${state.version}…`, error: false };
    case "ready":
      return { text: `Version ${state.version} is installed. Restart to use it.`, error: false };
    case "error":
      return { text: state.message, error: true };
    case "unsupported":
      return { text: "Updates are available in the installed Mac app.", error: false };
    default:
      return { text: "Updates are checked each time DeutschLab opens.", error: false };
  }
}

export default function UpdateSettings({ updater }: { updater: Updater }) {
  const { state } = useUpdater(updater);
  const { text, error } = statusLine(state);
  const working = state.status === "checking" || state.status === "downloading";

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-medium">
          {APP_NAME} <span className="tabular">{APP_VERSION}</span>
        </p>
        <p aria-live="polite" className={["mt-1 max-w-reading text-sm leading-6", error ? "text-error" : "text-fg-2"].join(" ")}>
          {text}
        </p>
      </div>
      <button
        type="button"
        disabled={working}
        onClick={() => void (state.status === "available" ? updater.install() : updater.check(true))}
        className="dl-press rounded-md border border-line-strong bg-elevated px-4 py-2.5 text-sm hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state.status === "available" ? "Update now" : "Check for updates"}
      </button>
    </div>
  );
}
