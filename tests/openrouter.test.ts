import { describe, it, expect } from "vitest";
import { stripMarkdownFences, POPULAR_MODELS, generateComponentPatch } from "../src/services/openrouter";
import { StreamProcessor } from "../src/runtime/streamProcessor";

describe("OpenRouter SDK Service & Stream Processing", () => {
  it("strips markdown code fences from LLM responses cleanly", () => {
    expect(stripMarkdownFences("```html\n<div>Hello</div>\n```")).toBe("<div>Hello</div>");
    expect(stripMarkdownFences("```\n<header class='p-4'>Header</header>\n```")).toBe("<header class='p-4'>Header</header>");
    expect(stripMarkdownFences("<main>Raw HTML</main>")).toBe("<main>Raw HTML</main>");
  });

  it("maintains popular models catalog", () => {
    expect(POPULAR_MODELS.length).toBeGreaterThanOrEqual(5);
    const claude = POPULAR_MODELS.find((m) => m.id === "anthropic/claude-3.5-sonnet");
    expect(claude).toBeDefined();
    expect(claude?.provider).toBe("Anthropic");
  });

  it("buffers tokens in StreamProcessor and calculates token count", () => {
    let notifiedCount = 0;
    const processor = new StreamProcessor(null, (count) => {
      notifiedCount = count;
    });

    processor.appendToken("```html\n<div class='bg-slate-900'>");
    processor.appendToken("<h1>Welcome</h1>");
    processor.appendToken("</div>\n```");

    expect(processor.getTokenCount()).toBe(3);
    expect(notifiedCount).toBe(3);
    expect(processor.getCleanBuffer()).toBe("<div class='bg-slate-900'><h1>Welcome</h1></div>");

    const finalHtml = processor.finalize();
    expect(finalHtml).toBe("<div class='bg-slate-900'><h1>Welcome</h1></div>");
  });

  it("generates surgical component patch for cart drawer", async () => {
    const patch = await generateComponentPatch({
      model: "anthropic/claude-3.5-sonnet",
      targetSelector: "#cart-drawer",
      actionIntent: "add_item_to_cart",
      existingElementHtml: "<div id='cart-drawer' class='hidden'></div>",
      sessionContext: {
        cartItems: [{ id: "1", name: "Matcha", price: 38, qty: 1 }],
      },
    });

    expect(patch).toContain("id=\"cart-drawer\"");
    expect(patch).toContain("Proceed to Checkout");
    expect(patch.startsWith("```")).toBe(false);
  });
});
