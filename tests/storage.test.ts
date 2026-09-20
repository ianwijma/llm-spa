import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredTypeSafeKey,
  setStoredTypeSafeKey,
  getStoredOpenRouterKey,
  setStoredOpenRouterKey,
  getStoredModel,
  setStoredModel,
  getStoredDemoMode,
  setStoredDemoMode,
  hasConfiguredKeys,
  DEFAULT_MODEL,
} from "../src/state/storage";

describe("Storage Manager (BYOK Vault)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("manages TypeSafe API key lifecycle", () => {
    expect(getStoredTypeSafeKey()).toBe("");
    setStoredTypeSafeKey("ts_test_key_12345");
    expect(getStoredTypeSafeKey()).toBe("ts_test_key_12345");
    setStoredTypeSafeKey("");
    expect(getStoredTypeSafeKey()).toBe("");
  });

  it("manages OpenRouter API key lifecycle", () => {
    expect(getStoredOpenRouterKey()).toBe("");
    setStoredOpenRouterKey("sk-or-test-key-abc");
    expect(getStoredOpenRouterKey()).toBe("sk-or-test-key-abc");
    setStoredOpenRouterKey("");
    expect(getStoredOpenRouterKey()).toBe("");
  });

  it("persists model selection with sensible default", () => {
    expect(getStoredModel()).toBe(DEFAULT_MODEL);
    setStoredModel("google/gemini-2.0-flash-001");
    expect(getStoredModel()).toBe("google/gemini-2.0-flash-001");
  });

  it("handles demo mode flag", () => {
    expect(getStoredDemoMode()).toBe(false);
    setStoredDemoMode(true);
    expect(getStoredDemoMode()).toBe(true);
    setStoredDemoMode(false);
    expect(getStoredDemoMode()).toBe(false);
  });

  it("accurately reports key configuration presence", () => {
    expect(hasConfiguredKeys()).toBe(false);
    setStoredTypeSafeKey("ts_key");
    expect(hasConfiguredKeys()).toBe(false);
    setStoredOpenRouterKey("sk_key");
    expect(hasConfiguredKeys()).toBe(true);
  });
});
