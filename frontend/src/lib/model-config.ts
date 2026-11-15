/**
 * The desktop shell's model config (epic 39 T2, BYOK): the caller's own
 * OpenAI-compatible endpoint — base URL, model name, API key. Stored
 * LOCALLY (lazy-write, the four UI keys' convention); deliberately NOT in
 * the Settings reset list — the key is user data, not a UI preference.
 * Never sent anywhere except the AI mutations' `provider` input, injected by
 * the apollo link seam (apollo/provider-override-link.ts); on the server it
 * rides only the ≤60s single-use stream ticket for streamed ops.
 *
 * Partial configs are kept as typed (the settings form's draft state) but
 * never ride the wire — getCompleteProviderInput() answers null until all
 * three fields are filled and the base URL is https (the backend remains
 * the validation authority; this is just an honest no-op guard).
 */
import { useCallback, useEffect, useState } from "react";

export const MODEL_CONFIG_KEY = "synapse-ai-config";

/** The change event the hook syncs on (same-tab live application). */
const MODEL_CONFIG_EVENT = "synapse:model-config";

export interface ModelConfig {
  baseUrl: string;
  modelName: string;
  apiKey: string;
}

const EMPTY: ModelConfig = { baseUrl: "", modelName: "", apiKey: "" };

function readConfig(): ModelConfig {
  try {
    const raw = localStorage.getItem(MODEL_CONFIG_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ModelConfig>;
    return {
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
      modelName: typeof parsed.modelName === "string" ? parsed.modelName : "",
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
    };
  } catch {
    return EMPTY; // storage unavailable or corrupt — session-only default
  }
}

export function getModelConfig(): ModelConfig {
  return readConfig();
}

export function setModelConfig(config: ModelConfig): void {
  try {
    // The draft persists even when incomplete (a half-typed form survives a
    // restart); an incomplete config simply never rides the wire.
    localStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // storage refused — the in-session hook state still applies
  }
  window.dispatchEvent(new CustomEvent(MODEL_CONFIG_EVENT));
}

/** Whether a config would ride the wire (all three fields + https base). */
export function isCompleteProviderConfig(config: ModelConfig): boolean {
  return (
    config.baseUrl.startsWith("https://") &&
    config.baseUrl.trim().length > "https://".length &&
    config.modelName.trim() !== "" &&
    config.apiKey.trim() !== ""
  );
}

function isComplete(config: ModelConfig): boolean {
  return isCompleteProviderConfig(config);
}

/** The wire shape (the ProviderOverrideInput fields), or null when the
 * config is incomplete — the link seam only injects complete configs. */
export function getCompleteProviderInput():
  | { baseUrl: string; model: string; apiKey: string }
  | null {
  const config = readConfig();
  return isComplete(config)
    ? { baseUrl: config.baseUrl.trim(), model: config.modelName.trim(), apiKey: config.apiKey.trim() }
    : null;
}

/** The settings surface: current config + a setter that persists and syncs. */
export function useModelConfig(): [ModelConfig, (config: ModelConfig) => void] {
  const [config, setConfig] = useState<ModelConfig>(() => readConfig());
  useEffect(() => {
    const sync = () => setConfig(readConfig());
    window.addEventListener(MODEL_CONFIG_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MODEL_CONFIG_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((next: ModelConfig) => {
    setModelConfig(next);
    setConfig(next);
  }, []);
  return [config, update];
}
