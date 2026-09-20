import { describe, it, expect, beforeEach } from "vitest";
import { store } from "../src/state/store";

describe("Telemetry & Reflex Audit Timeline", () => {
  beforeEach(() => {
    store.clearTelemetry();
  });

  it("records telemetry events with generated IDs and timestamps", () => {
    store.recordTelemetry({
      type: "preflight",
      title: "TypeSafe Jev Pre-Flight",
      latencyMs: 85,
      summary: "Archetype: ecommerce, Theme: zen_organic",
      details: { confidence: 0.95 },
    });

    const events = store.getState().telemetryEvents;
    expect(events.length).toBe(1);
    expect(events[0].id).toBeDefined();
    expect(events[0].type).toBe("preflight");
    expect(events[0].latencyMs).toBe(85);
    expect(events[0].summary).toContain("ecommerce");
    expect(events[0].timestamp).toBeGreaterThan(0);
  });

  it("tracks cumulative token consumption across generation events", () => {
    expect(store.getState().totalTokensUsed).toBe(0);

    store.recordTelemetry({
      type: "generation",
      title: "Full Page Generation",
      tokens: 1200,
      model: "google/gemini-3.8-flash",
      summary: "Generated initial page",
      details: {},
    });

    expect(store.getState().totalTokensUsed).toBe(1200);

    store.recordTelemetry({
      type: "dom_patch",
      title: "Cart Patch",
      tokens: 150,
      summary: "Patched cart drawer",
      details: {},
    });

    expect(store.getState().totalTokensUsed).toBe(1350);
  });

  it("records UI interaction and Jev reflex routing sequence", () => {
    store.recordTelemetry({
      type: "ui_event",
      title: "UI Interaction: CLICK <button>",
      summary: "Clicked Add to Cart",
      details: { text: "Add to Cart", action: "add_item_to_cart" },
    });

    store.recordTelemetry({
      type: "reflex_routing",
      title: "TypeSafe Jev Reflex: partial_dom_patch",
      latencyMs: 32,
      summary: "Routed to #cart-drawer in 32ms",
      details: { pathway: "partial_dom_patch", target: "#cart-drawer" },
    });

    const events = store.getState().telemetryEvents;
    expect(events.length).toBe(2);
    // Most recent event first
    expect(events[0].type).toBe("reflex_routing");
    expect(events[1].type).toBe("ui_event");
  });

  it("clears telemetry history cleanly", () => {
    store.recordTelemetry({
      type: "preflight",
      title: "Test Event",
      summary: "Testing clear",
      details: {},
    });
    expect(store.getState().telemetryEvents.length).toBe(1);

    store.clearTelemetry();
    expect(store.getState().telemetryEvents.length).toBe(0);
    expect(store.getState().totalTokensUsed).toBe(0);
  });
});
