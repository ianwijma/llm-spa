import { describe, it, expect } from "vitest";
import {
  extractDesignSystemFromHtml,
  generateTransitionMockHtml,
} from "../src/services/openrouter";

describe("Design System Lock & Persistent Shell", () => {
  const mockHomeHtml = `
<div class="min-h-screen bg-stone-50 text-stone-900 font-serif">
  <header class="border-b border-stone-200 p-6 flex justify-between items-center">
    <div class="flex items-center space-x-2">
      <span class="text-xl">🍵</span>
      <span class="font-bold text-xl">Komorebi Botanical</span>
    </div>
    <nav class="flex space-x-4">
      <a href="#harvest">Harvest 2026</a>
      <a href="#ceremony">Ceremony</a>
    </nav>
  </header>
  <main id="page-content" class="p-8">
    <h1>Stillness poured into every cup</h1>
    <button data-action="add_item_to_cart" class="px-6 py-3 bg-emerald-900 text-white rounded-full">Order Matcha ($38)</button>
  </main>
</div>
  `.trim();

  it("extracts design system tokens, header, and styling from generated site", () => {
    const ds = extractDesignSystemFromHtml(mockHomeHtml, "Kyoto Matcha", {
      isConstructive: true,
      constructiveScore: 1,
      archetype: "ecommerce",
      theme: "zen_organic",
      complexity: "moderate",
      latencyMs: 90,
      confidence: 0.95,
    });

    expect(ds.brandName).toBe("Komorebi Botanical");
    expect(ds.brandIcon).toBe("🍵");
    expect(ds.headerHtml).toContain("Komorebi Botanical");
    expect(ds.headerHtml).toContain("Harvest 2026");
    expect(ds.wrapperClasses).toContain("bg-stone-50");
    expect(ds.colorScheme.primaryButtonClass).toContain("bg-emerald-900");
    expect(ds.colorScheme.fontFamilyClass).toBe("font-serif");
  });

  it("generates checkout subpage reusing the exact brand name, header, and button styles", () => {
    const ds = extractDesignSystemFromHtml(mockHomeHtml, "Kyoto Matcha", {
      isConstructive: true,
      constructiveScore: 1,
      archetype: "ecommerce",
      theme: "zen_organic",
      complexity: "moderate",
      latencyMs: 90,
      confidence: 0.95,
    });

    const checkoutPage = generateTransitionMockHtml(ds, "navigate_checkout", {
      cartItems: [{ id: "1", name: "Kyoto Asahi Matcha", price: 38, qty: 1 }],
    });

    // Header preserved verbatim
    expect(checkoutPage).toContain("Komorebi Botanical");
    expect(checkoutPage).toContain("<header");
    expect(checkoutPage).toContain("🍵");

    // Styling preserved
    expect(checkoutPage).toContain("bg-emerald-900");
    expect(checkoutPage).toContain("font-serif");
    expect(checkoutPage).toContain("bg-stone-50");

    // Subpage content present
    expect(checkoutPage).toContain("Secure Checkout");
    expect(checkoutPage).toContain("Order Summary");
    expect(checkoutPage).toContain("Kyoto Asahi Matcha");
  });

  it("generates informational subpage reusing design system and shell", () => {
    const ds = extractDesignSystemFromHtml(mockHomeHtml, "Kyoto Matcha");
    const subpage = generateTransitionMockHtml(ds, "harvest_2026");

    expect(subpage).toContain("Komorebi Botanical");
    expect(subpage).toContain("bg-emerald-900");
    expect(subpage).toContain("font-serif");
    expect(subpage).toContain("Harvest 2026");
  });
});
