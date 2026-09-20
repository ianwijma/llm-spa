/**
 * BYOK Storage Manager
 * Handles client-side persistence of API keys and preferences in localStorage.
 * Keys never leave the browser and are never exposed to the sandboxed iframe.
 */

const STORAGE_KEYS = {
  TYPESAFE_API_KEY: "typesafe_api_key",
  OPENROUTER_API_KEY: "openrouter_api_key",
  SELECTED_MODEL: "openrouter_selected_model",
  DEMO_MODE: "hypersite_demo_mode",
} as const;

export const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

export function getStoredTypeSafeKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.TYPESAFE_API_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredTypeSafeKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.TYPESAFE_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.TYPESAFE_API_KEY);
    }
  } catch (e) {
    console.error("Failed to persist TypeSafe API key:", e);
  }
}

export function getStoredOpenRouterKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.OPENROUTER_API_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredOpenRouterKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.OPENROUTER_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.OPENROUTER_API_KEY);
    }
  } catch (e) {
    console.error("Failed to persist OpenRouter API key:", e);
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setStoredModel(model: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
  } catch (e) {
    console.error("Failed to persist selected model:", e);
  }
}

export function getStoredDemoMode(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
    return val === "true";
  } catch {
    return false;
  }
}

export function setStoredDemoMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, String(enabled));
  } catch (e) {
    console.error("Failed to persist demo mode setting:", e);
  }
}

export function hasConfiguredKeys(): boolean {
  return Boolean(getStoredTypeSafeKey() && getStoredOpenRouterKey());
}
