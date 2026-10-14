import { useCallback, useEffect, useState } from "react";

import { getKeyStatus, nativeAIAvailable } from "../../lib/ai/native";
import { loadAISettings, updateAISettings, type AISettings } from "../../lib/ai/settings";

export interface AIStatus {
  checked: boolean;
  /** Running in the DeutschLab app (the only place AI requests can be made). */
  native: boolean;
  settings: AISettings | null;
  keyStored: boolean;
  /** Enabled, key saved: requests can be attempted (consent may still be asked). */
  ready: boolean;
  refresh: () => void;
  giveConsent: () => Promise<void>;
}

/*
 * Whether AI can be offered on this screen. Outside the native app it
 * resolves at once to "unavailable" without touching the database, so
 * lessons render exactly as before.
 */
export function useAIStatus(): AIStatus {
  const native = nativeAIAvailable();
  const [checked, setChecked] = useState(!native);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [keyStored, setKeyStored] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;

    Promise.all([loadAISettings(), getKeyStatus().catch(() => ({ stored: false, hint: null }))])
      .then(([loaded, key]) => {
        if (cancelled) return;
        setSettings(loaded);
        setKeyStored(key.stored);
      })
      .catch((error) => console.error("Failed to load AI settings:", error))
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [native, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const giveConsent = useCallback(async () => {
    const next = await updateAISettings({ consentedAt: new Date().toISOString() });
    setSettings(next);
  }, []);

  return {
    checked,
    native,
    settings,
    keyStored,
    ready: native && !!settings?.enabled && keyStored,
    refresh,
    giveConsent,
  };
}
