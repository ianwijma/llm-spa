/**
 * HyperSite Main Application Orchestrator
 * Connects Landing View, Sandboxed Iframe, TypeSafe Jev System One Reflex Engine,
 * and OpenRouter Streaming Generation.
 */

import { store } from "./state/store";
import { LandingView } from "./components/landingView";
import { TopBar } from "./components/topBar";
import { SettingsModal } from "./components/settingsModal";
import { ModelPicker } from "./components/modelPicker";
import { IframeSandbox } from "./runtime/iframeSandbox";
import { StreamProcessor } from "./runtime/streamProcessor";
import { runJevPreflight, runJevReflex, type InteractionPayload, type SiteContext } from "./services/typesafe";
import {
  streamPageGeneration,
  generateComponentPatch,
  fetchOpenRouterModels,
  extractDesignSystemFromHtml,
  streamPageTransition,
} from "./services/openrouter";

class HyperSiteApp {
  private landingContainer!: HTMLElement;
  private runtimeContainer!: HTMLElement;
  private topbarContainer!: HTMLElement;
  private iframeContainer!: HTMLElement;
  private statusOverlay!: HTMLElement;
  private modalContainer!: HTMLElement;
  private modelPickerContainer!: HTMLElement;

  private landingView!: LandingView;
  private topBar!: TopBar;
  private settingsModal!: SettingsModal;
  private modelPicker!: ModelPicker;
  private sandbox!: IframeSandbox;
  private streamProcessor!: StreamProcessor;

  public init(): void {
    this.landingContainer = document.getElementById("landing-container")!;
    this.runtimeContainer = document.getElementById("runtime-container")!;
    this.topbarContainer = document.getElementById("topbar-container")!;
    this.iframeContainer = document.getElementById("iframe-container")!;
    this.statusOverlay = document.getElementById("status-overlay")!;
    this.modalContainer = document.getElementById("modal-container")!;
    this.modelPickerContainer = document.getElementById("model-picker-container")!;

    // Initialize Components
    this.landingView = new LandingView(this.landingContainer, {
      onSubmit: (prompt) => this.handleGenerateSite(prompt),
      onOpenSettings: () => this.openSettings(),
      onOpenModelPicker: () => this.openModelPicker(),
    });

    this.topBar = new TopBar(this.topbarContainer, {
      onGoHome: () => this.switchView("landing"),
      onUndo: () => this.handleUndo(),
      onRedo: () => this.handleRedo(),
      onExport: () => this.handleExport(),
      onOpenSettings: () => this.openSettings(),
      onRegenerate: () => this.handleRegeneratePrompt(),
      onOpenModelPicker: () => this.openModelPicker(),
      onRegenerateWholeSite: () => this.handleRegenerateWholeSite(),
    });

    this.settingsModal = new SettingsModal(this.modalContainer, {
      onClose: () => this.closeSettings(),
    });

    this.modelPicker = new ModelPicker(this.modelPickerContainer, {
      onSelect: (modelId) => this.handleSelectModel(modelId),
      onClose: () => this.closeModelPicker(),
    });

    this.sandbox = new IframeSandbox(this.iframeContainer);
    this.streamProcessor = new StreamProcessor(null, (tokens) => {
      store.setState({ streamedTokenCount: tokens });
      this.updateStatusOverlay(`Streaming HTML... (${tokens} tokens)`);
    });

    // Subscribe to Store updates
    store.subscribe((state) => {
      this.topBar.render();
      if (state.currentView === "landing") {
        this.landingView.updateModelAndMode();
      }
      if (state.settingsOpen) {
        this.settingsModal.render();
      } else {
        this.modalContainer.innerHTML = "";
      }
      if (state.isModelPickerOpen) {
        this.modelPicker.render();
      } else {
        this.modelPickerContainer.innerHTML = "";
      }
    });

    // Fetch full 400+ model catalog in background
    fetchOpenRouterModels().then((models) => {
      store.setState({ availableModels: models });
    });

    // Keyboard Shortcuts (Undo, Redo, Esc)
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          this.handleRedo();
        } else {
          e.preventDefault();
          this.handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.handleRedo();
      } else if (e.key === "Escape") {
        if (store.getState().isModelPickerOpen) {
          this.closeModelPicker();
        } else if (store.getState().settingsOpen) {
          this.closeSettings();
        }
      }
    });

    // Initial render
    this.landingView.render();
  }

  private openModelPicker(): void {
    store.setState({ isModelPickerOpen: true });
    this.modelPicker.render();
  }

  private closeModelPicker(): void {
    store.setState({ isModelPickerOpen: false });
    this.modelPickerContainer.innerHTML = "";
  }

  private handleSelectModel(modelId: string): void {
    store.setState({ selectedModel: modelId, isModelPickerOpen: false });
    this.modelPickerContainer.innerHTML = "";
    this.showStatusOverlay(`🤖 Active Model: ${modelId}`, false, 2000);
  }

  private switchView(view: "landing" | "runtime"): void {
    store.setState({ currentView: view });
    if (view === "landing") {
      this.landingContainer.classList.remove("hidden");
      this.runtimeContainer.classList.add("hidden");
      this.landingView.render();
    } else {
      this.landingContainer.classList.add("hidden");
      this.runtimeContainer.classList.remove("hidden");
      this.topBar.render();
    }
  }

  private openSettings(): void {
    store.setState({ settingsOpen: true });
    this.settingsModal.render();
  }

  private closeSettings(): void {
    store.setState({ settingsOpen: false });
    this.modalContainer.innerHTML = "";
  }

  /**
   * Flow 1: Pre-Flight (Jev) -> Streaming Synthesis (OpenRouter) -> Render (Tailwind JIT)
   */
  private async handleGenerateSite(userPrompt: string): Promise<void> {
    const trimmed = userPrompt.trim();
    if (!trimmed) return;

    store.setState({
      prompt: trimmed,
      isGenerating: true,
      statusMessage: "Running TypeSafe Jev Pre-Flight analysis...",
      streamedTokenCount: 0,
    });

    this.showStatusOverlay("⚡ Jev Pre-Flight: Classifying Archetype & Aesthetics...", true);

    try {
      // Step 1: TypeSafe Jev Pre-Flight Speculative Fan-out (<150ms)
      const jevResult = await runJevPreflight(trimmed);
      store.setState({ jevPreflight: jevResult });

      this.showStatusOverlay(
        `⚡ Jev (${jevResult.latencyMs}ms): ${jevResult.archetype} • ${jevResult.theme} • ${jevResult.complexity}`,
        false
      );

      // Step 2: Switch to Runtime View and initialize Sandboxed Iframe
      this.switchView("runtime");
      const iframeEl = this.sandbox.init(
        (event) => this.handleIframeUIEvent(event),
        () => console.log("Sandboxed Iframe Ready")
      );
      this.streamProcessor.setIframe(iframeEl);
      this.streamProcessor.reset();

      // Step 3: Stream Page Generation via @openrouter/sdk
      const state = store.getState();
      await streamPageGeneration({
        model: state.selectedModel,
        userPrompt: trimmed,
        jevGuidance: jevResult,
        sessionContext: state.session.persistedData,
        onToken: (token) => {
          this.streamProcessor.appendToken(token);
        },
        onComplete: (fullHtml) => {
          this.streamProcessor.finalize();
          const designSystem = extractDesignSystemFromHtml(fullHtml, trimmed, jevResult);
          store.setState((prev) => ({
            isGenerating: false,
            currentHtml: fullHtml,
            statusMessage: "Generation complete",
            session: {
              ...prev.session,
              lockedDesignSystem: designSystem,
            },
          }));
          store.pushHistory(`Generate: ${trimmed.slice(0, 30)}`, fullHtml);
          this.hideStatusOverlay();
        },
        onError: (err) => {
          store.setState({ isGenerating: false, statusMessage: err.message });
          this.showStatusOverlay(`⚠️ Generation Error: ${err.message}`, false, 6000);
          console.error("Site generation failed:", err);
        },
      });
    } catch (err: any) {
      store.setState({ isGenerating: false, statusMessage: err.message });
      this.showStatusOverlay(`⚠️ ${err.message}`, false, 5000);
      console.error("Pre-flight failed:", err);
    }
  }

  /**
   * Flow 2: Micro-Proxy UI_EVENT -> TypeSafe Jev Reflex -> Local Toggle / DOM Patch / Nav
   */
  private async handleIframeUIEvent(event: InteractionPayload): Promise<void> {
    console.log("Captured UI_EVENT from Sandboxed Iframe:", event);

    const state = store.getState();
    store.setState({ isReflexEvaluating: true });

    const siteContext: SiteContext = {
      originalGoal: state.prompt,
      activePage: state.session.currentRoute,
      totalItemsInCart: state.session.persistedData.totalItemsInCart || 1,
      cartItems: state.session.persistedData.cartItems,
    };

    try {
      // Fast System One Categorical Routing (~80-120ms)
      const reflex = await runJevReflex(event, siteContext);
      store.setState({
        lastReflexDecision: reflex,
        isReflexEvaluating: false,
      });

      this.showStatusOverlay(
        `⚡ Jev Reflex (${reflex.latencyMs}ms): ${reflex.actionPathway} [${reflex.mutationIntent}]`,
        false,
        2500
      );

      // Route execution according to Jev decision rubric
      switch (reflex.actionPathway) {
        case "local_toggle": {
          if (event.action === "navigate_home" || event.href === "#/" || event.href === "#") {
            const first = store.getState().domHistory[0];
            if (first) {
              this.sandbox.replaceRootHtml(first.domSnapshot);
              store.setState((prev) => ({
                currentHtml: first.domSnapshot,
                session: { ...prev.session, currentRoute: "#/" },
              }));
              store.pushHistory("Navigate: Home", first.domSnapshot);
              this.showStatusOverlay("Returned to Homepage", false, 1500);
            }
          } else {
            this.sandbox.toggleClass(reflex.targetSelector, "hidden");
          }
          break;
        }

        case "partial_dom_patch": {
          // Targeted component regeneration
          this.showStatusOverlay(`Surgically updating ${reflex.targetSelector}...`, true);
          const currentHtml = state.currentHtml;

          // Update persisted session data (e.g. cart count)
          if (reflex.mutationIntent.includes("cart") || reflex.mutationIntent.includes("add")) {
            const currentItems = state.session.persistedData.cartItems || [];
            const newItem = {
              id: `item-${Date.now()}`,
              name: event.text.replace("+", "").replace("Add", "").trim() || "Artisan Selection",
              price: 38,
              qty: 1,
            };
            store.setState((prev) => ({
              session: {
                ...prev.session,
                persistedData: {
                  ...prev.session.persistedData,
                  cartItems: [...currentItems, newItem],
                  totalItemsInCart: (prev.session.persistedData.totalItemsInCart || 0) + 1,
                },
              },
            }));
          }

          const patchHtml = await generateComponentPatch({
            model: state.selectedModel,
            targetSelector: reflex.targetSelector,
            actionIntent: reflex.mutationIntent,
            existingElementHtml: event.contextSnippet || currentHtml.slice(0, 500),
            sessionContext: store.getState().session.persistedData,
          });

          this.sandbox.patchElement(reflex.targetSelector, patchHtml);
          store.pushHistory(`Patch: ${reflex.mutationIntent}`, state.currentHtml);
          this.hideStatusOverlay();
          break;
        }

        case "full_page_transition": {
          // Full page screen transition with design system & shell lock
          const newRoute = reflex.mutationIntent.includes("checkout") ? "#/checkout" : "#/" + reflex.mutationIntent;
          await this.handlePageTransition(reflex.mutationIntent, newRoute);
          break;
        }

        case "form_feedback": {
          // Form submission confirmation
          const banner = `
            <div class="p-6 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl shadow-sm text-center space-y-2 animate-fade-in">
              <span class="text-3xl">✓</span>
              <h3 class="font-bold text-lg">Thank You!</h3>
              <p class="text-xs text-emerald-700">Your submission has been securely processed by the AI runtime.</p>
            </div>
          `;
          this.sandbox.patchElement(reflex.targetSelector, banner);
          store.pushHistory("Form Submission", state.currentHtml);
          break;
        }

        case "external_link": {
          if (event.href) {
            window.open(event.href, "_blank", "noopener,noreferrer");
          }
          break;
        }

        case "inert_click":
        default:
          break;
      }
    } catch (err: any) {
      store.setState({ isReflexEvaluating: false });
      console.error("Reflex routing error:", err);
    }
  }

  private handleUndo(): void {
    const entry = store.undo();
    if (entry) {
      this.sandbox.replaceRootHtml(entry.domSnapshot);
      this.showStatusOverlay(`↶ Undo: ${entry.actionDescription}`, false, 1500);
    }
  }

  private handleRedo(): void {
    const entry = store.redo();
    if (entry) {
      this.sandbox.replaceRootHtml(entry.domSnapshot);
      this.showStatusOverlay(`↷ Redo: ${entry.actionDescription}`, false, 1500);
    }
  }

  private handleExport(): void {
    const state = store.getState();
    const exportHtml = this.sandbox.generateExportHtml(state.currentHtml);

    const blob = new Blob([exportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const archetype = state.jevPreflight?.archetype || "site";
    a.href = url;
    a.download = `hypersite-${archetype}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showStatusOverlay("💾 Standalone HTML Exported Successfully!", false, 2500);
  }

  private async handlePageTransition(targetIntent: string, newRoute: string): Promise<void> {
    const state = store.getState();
    const ds = state.session.lockedDesignSystem;

    if (!ds) {
      await this.handleGenerateSite(`${state.prompt} - ${targetIntent.replace("_", " ")}`);
      return;
    }

    this.showStatusOverlay(`Navigating to ${targetIntent.replace("_", " ")} (Reusing ${ds.brandName} Design)...`, true);
    store.setState({ isGenerating: true, statusMessage: "Transitioning page..." });
    this.streamProcessor.reset();

    await streamPageTransition({
      model: state.selectedModel,
      targetPage: targetIntent.replace("_", " "),
      intent: targetIntent,
      lockedDesignSystem: ds,
      sessionContext: state.session.persistedData,
      onToken: (token) => {
        this.streamProcessor.appendToken(token);
      },
      onComplete: (newPageHtml) => {
        this.streamProcessor.finalize();
        store.setState((prev) => ({
          isGenerating: false,
          currentHtml: newPageHtml,
          session: {
            ...prev.session,
            currentRoute: newRoute,
          },
        }));
        store.pushHistory(`Navigate: ${targetIntent.replace("_", " ")}`, newPageHtml);
        this.hideStatusOverlay();
      },
      onError: (err) => {
        store.setState({ isGenerating: false });
        this.showStatusOverlay(`⚠️ Navigation error: ${err.message}`, false, 3000);
      },
    });
  }

  private async handleRegenerateWholeSite(): Promise<void> {
    const prompt = store.getState().prompt;
    if (!prompt) return;

    this.showStatusOverlay("🔄 Redesigning entire website from scratch...", true);
    // Reset locked design system so a fresh design is synthesized
    store.setState((prev) => ({
      session: {
        ...prev.session,
        lockedDesignSystem: null,
      },
    }));

    await this.handleGenerateSite(prompt);
  }

  private handleRegeneratePrompt(): void {
    const newPrompt = prompt("Update website prompt:", store.getState().prompt);
    if (newPrompt && newPrompt.trim()) {
      this.handleGenerateSite(newPrompt.trim());
    }
  }

  private showStatusOverlay(text: string, isProgress = false, autoHideMs = 0): void {
    this.statusOverlay.classList.remove("hidden");
    this.statusOverlay.innerHTML = `
      <div class="px-4 py-2 rounded-full bg-slate-900/95 text-slate-100 shadow-2xl border border-slate-700/80 text-xs font-mono flex items-center space-x-2.5 backdrop-blur-md animate-slide-down">
        ${isProgress ? '<span class="w-2.5 h-2.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></span>' : '<span class="text-indigo-400 font-bold">⚡</span>'}
        <span>${text}</span>
      </div>
    `;

    if (autoHideMs > 0) {
      setTimeout(() => {
        this.hideStatusOverlay();
      }, autoHideMs);
    }
  }

  private updateStatusOverlay(text: string): void {
    const span = this.statusOverlay.querySelector("span:last-child");
    if (span) {
      span.textContent = text;
    }
  }

  private hideStatusOverlay(): void {
    this.statusOverlay.classList.add("hidden");
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new HyperSiteApp();
  app.init();
});
