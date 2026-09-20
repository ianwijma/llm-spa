import { describe, it, expect } from "vitest";
import { IframeSandbox } from "../src/runtime/iframeSandbox";
import { MICRO_PROXY_SOURCE } from "../src/runtime/microProxyScript";

describe("Iframe Sandbox & Standalone Export Generator", () => {
  it("generates standalone portable HTML with Tailwind Play CDN script", () => {
    const sandbox = new IframeSandbox(document.createElement("div"));
    const exported = sandbox.generateExportHtml("<section class='p-10'><h1>Exported App</h1></section>");

    expect(exported).toContain("<!DOCTYPE html>");
    expect(exported).toContain("https://cdn.tailwindcss.com");
    expect(exported).toContain("id=\"app-root\"");
    expect(exported).toContain("<h1>Exported App</h1>");
    expect(exported).toContain("tailwind.config");
  });

  it("includes micro-proxy event delegation script", () => {
    expect(MICRO_PROXY_SOURCE).toContain("serializeEvent");
    expect(MICRO_PROXY_SOURCE).toContain("UI_EVENT");
    expect(MICRO_PROXY_SOURCE).toContain("REPLACE_ROOT_HTML");
    expect(MICRO_PROXY_SOURCE).toContain("PATCH_ELEMENT");
    expect(MICRO_PROXY_SOURCE).toContain("TOGGLE_CLASS");
  });
});
