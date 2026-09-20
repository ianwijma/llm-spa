import { describe, it, expect } from "vitest";
import { runJevPreflight, runJevReflex, type InteractionPayload, type SiteContext } from "../src/services/typesafe";

describe("TypeSafe Jev (System One) Reflex Engine", () => {
  it("evaluates preflight prompt and extracts archetype, theme, and complexity", async () => {
    const result = await runJevPreflight("Minimalist Japanese tea house store with ceremonial matcha");
    expect(result.isConstructive).toBe(true);
    expect(result.archetype).toBe("ecommerce");
    expect(result.theme).toBe("zen_organic");
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("routes 'add to cart' action to partial_dom_patch", async () => {
    const event: InteractionPayload = {
      eventType: "click",
      tagName: "BUTTON",
      id: "btn-order",
      className: "px-4 py-2",
      text: "Add to Cart - $38",
      action: "add_item_to_cart",
      target: "#cart-drawer",
      href: null,
      formData: null,
      contextSnippet: "<div>Uji Matcha</div>",
    };

    const context: SiteContext = {
      originalGoal: "Matcha Store",
      activePage: "homepage",
      totalItemsInCart: 0,
    };

    const reflex = await runJevReflex(event, context);
    expect(reflex.actionPathway).toBe("partial_dom_patch");
    expect(reflex.targetSelector).toBe("#cart-drawer");
    expect(reflex.mutationIntent).toBe("add_item_to_cart");
    expect(reflex.latencyMs).toBeLessThan(150); // Sub-150ms requirement
  });

  it("routes modal dismiss to local_toggle", async () => {
    const event: InteractionPayload = {
      eventType: "click",
      tagName: "BUTTON",
      id: "btn-close",
      className: "p-2",
      text: "✕",
      action: "dismiss_overlay",
      target: "#modal",
      href: null,
      formData: null,
      contextSnippet: "",
    };

    const context: SiteContext = {
      originalGoal: "SaaS Dashboard",
      activePage: "homepage",
      totalItemsInCart: 0,
    };

    const reflex = await runJevReflex(event, context);
    expect(reflex.actionPathway).toBe("local_toggle");
    expect(reflex.mutationIntent).toBe("dismiss_overlay");
  });

  it("routes checkout navigation to full_page_transition", async () => {
    const event: InteractionPayload = {
      eventType: "click",
      tagName: "BUTTON",
      id: "btn-checkout",
      className: "w-full",
      text: "Proceed to Checkout",
      action: "checkout",
      target: "#app-root",
      href: null,
      formData: null,
      contextSnippet: "",
    };

    const context: SiteContext = {
      originalGoal: "Tea Store",
      activePage: "homepage",
      totalItemsInCart: 2,
    };

    const reflex = await runJevReflex(event, context);
    expect(reflex.actionPathway).toBe("full_page_transition");
    expect(reflex.mutationIntent).toBe("navigate_checkout");
  });
});
