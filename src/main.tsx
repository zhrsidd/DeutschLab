import React from "react";
import ReactDOM from "react-dom/client";
import { invoke, isTauri } from "@tauri-apps/api/core";
import App from "./App";
import "./index.css";

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

/*
 * The native self-test runs only when the app was started with
 * DEUTSCHLAB_SELFTEST_OUT (release verification); it never opens the
 * learner database. Every other start renders the app immediately.
 */
async function start() {
  if (isTauri()) {
    try {
      const reportPath = await invoke<string | null>("selftest_report_path");
      if (reportPath) {
        const { runNativeSelfTest } = await import("./lib/nativeSelfTest");
        await runNativeSelfTest(reportPath, renderApp);
        return;
      }
    } catch (error) {
      console.error("Self-test check failed; starting normally:", error);
    }
  }

  renderApp();
}

void start();
