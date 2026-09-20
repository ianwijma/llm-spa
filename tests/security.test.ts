import { describe, it, expect } from "vitest";
import { IframeSandbox } from "../src/runtime/iframeSandbox";

describe("BYOK Security & Cross-Origin Sandboxing", () => {
  it("enforces sandbox='allow-scripts allow-forms' without allow-same-origin", () => {
    const container = document.createElement("div");
    const sandbox = new IframeSandbox(container);
    const iframe = sandbox.init();

    const sandboxAttr = iframe.getAttribute("sandbox");
    expect(sandboxAttr).toBeDefined();
    expect(sandboxAttr).toContain("allow-scripts");
    expect(sandboxAttr).toContain("allow-forms");

    // Critical security check: allow-same-origin must NEVER be present
    expect(sandboxAttr).not.toContain("allow-same-origin");
  });

  it("ensures host API keys are shielded from sandboxed execution", () => {
    localStorage.setItem("typesafe_api_key", "secret_ts_key");
    localStorage.setItem("openrouter_api_key", "secret_or_key");

    const container = document.createElement("div");
    const sandbox = new IframeSandbox(container);
    const iframe = sandbox.init();

    // Verify sandbox srcdoc does not interpolate raw API keys
    expect(iframe.srcdoc).not.toContain("secret_ts_key");
    expect(iframe.srcdoc).not.toContain("secret_or_key");
  });
});
