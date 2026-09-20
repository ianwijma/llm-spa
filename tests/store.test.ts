import { describe, it, expect, beforeEach } from "vitest";
import { store } from "../src/state/store";

describe("Reactive Store & History Stack", () => {
  beforeEach(() => {
    localStorage.clear();
    store.setState({
      prompt: "",
      domHistory: [],
      historyIndex: -1,
      currentHtml: "",
      isGenerating: false,
    });
  });

  it("updates state and notifies subscribers", () => {
    let notifiedPrompt = "";
    const unsubscribe = store.subscribe((s) => {
      notifiedPrompt = s.prompt;
    });

    store.setState({ prompt: "Artisanal Bakery" });
    expect(notifiedPrompt).toBe("Artisanal Bakery");
    expect(store.getState().prompt).toBe("Artisanal Bakery");

    unsubscribe();
    store.setState({ prompt: "Different prompt" });
    expect(notifiedPrompt).toBe("Artisanal Bakery"); // Did not receive notification after unsubscribe
  });

  it("handles undo and redo history branch operations", () => {
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);

    store.pushHistory("Initial Generation", "<div>Version 1</div>");
    expect(store.canUndo()).toBe(false); // Only 1 entry, cannot undo
    expect(store.canRedo()).toBe(false);

    store.pushHistory("Patch Cart", "<div>Version 2</div>");
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    store.pushHistory("Patch Filter", "<div>Version 3</div>");
    expect(store.getState().historyIndex).toBe(2);

    // Undo to Version 2
    const prev = store.undo();
    expect(prev?.domSnapshot).toBe("<div>Version 2</div>");
    expect(store.getState().currentHtml).toBe("<div>Version 2</div>");
    expect(store.canRedo()).toBe(true);

    // Undo to Version 1
    const first = store.undo();
    expect(first?.domSnapshot).toBe("<div>Version 1</div>");
    expect(store.canUndo()).toBe(false);

    // Redo back to Version 2
    const forward = store.redo();
    expect(forward?.domSnapshot).toBe("<div>Version 2</div>");
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(true);

    // New mutation branch truncates old forward history
    store.pushHistory("New Branch Patch", "<div>Version 2B</div>");
    expect(store.canRedo()).toBe(false);
    expect(store.getState().domHistory.length).toBe(3);
  });
});
