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
import { DebugModal } from "./components/debugModal";
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
  private debugModalContainer!: HTMLElement;

  private landingView!: LandingView;
  private topBar!: TopBar;
  private settingsModal!: SettingsModal;
  private modelPicker!: ModelPicker;
  private debugModal!: DebugModal;
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
    this.debugModalContainer = document.getElementById("debug-modal-container")!;

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
      onOpenDebug: () => this.openDebugModal(),
    });

    this.settingsModal = new SettingsModal(this.modalContainer, {
      onClose: () => this.closeSettings(),
    });

    this.modelPicker = new ModelPicker(this.modelPickerContainer, {
      onSelect: (modelId) => this.handleSelectModel(modelId),
      onClose: () => this.closeModelPicker(),
    });

    this.debugModal = new DebugModal(this.debugModalContainer, {
      onClose: () => this.closeDebugModal(),
    });

    this.sandbox = new IframeSandbox(this.iframeContainer);
    this.streamProcessor = new StreamProcessor(null, (tokens) => {
      store.setState({ streamedTokenCount: tokens });
      this.updateStatusOverlay(`Streaming HTML... (${tokens} tokens)`);
    });

    // Subscribe to Store updates
    let prevSettingsOpen = false;
    let prevModelPickerOpen = false;
    let prevDebugModalOpen = false;

    store.subscribe((state) => {
      this.topBar.render();
      if (state.currentView === "landing") {
        this.landingView.updateModelAndMode();
      }

      // Settings Modal
      if (state.settingsOpen !== prevSettingsOpen) {
        if (state.settingsOpen) {
          this.settingsModal.render();
        } else {
          this.modalContainer.innerHTML = "";
        }
        prevSettingsOpen = state.settingsOpen;
      }

      // Model Picker Modal
      if (state.isModelPickerOpen !== prevModelPickerOpen) {
        if (state.isModelPickerOpen) {
          this.modelPicker.render();
        } else {
          this.modelPickerContainer.innerHTML = "";
        }
        prevModelPickerOpen = state.isModelPickerOpen;
      }

      // Diagnostics & Telemetry Modal
      if (state.debugModalOpen !== prevDebugModalOpen) {
        if (state.debugModalOpen) {
          this.debugModal.render();
        } else {
          this.debugModalContainer.innerHTML = "";
        }
        prevDebugModalOpen = state.debugModalOpen;
      } else if (state.debugModalOpen) {
        // If already open, update content in place without re-rendering backdrop or modal window
        this.debugModal.updateContentOnly();
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
        if (store.getState().debugModalOpen) {
          this.closeDebugModal();
        } else if (store.getState().isModelPickerOpen) {
          this.closeModelPicker();
        } else if (store.getState().settingsOpen) {
          this.closeSettings();
        }
      }
    });

    // Initial render
    this.landingView.render();
  }

  private openDebugModal(): void {
    store.setState({ debugModalOpen: true });
    this.debugModal.render();
  }

  private closeDebugModal(): void {
    store.setState({ debugModalOpen: false });
    this.debugModalContainer.innerHTML = "";
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

      store.recordTelemetry({
        type: "preflight",
        title: `TypeSafe Jev Pre-Flight: ${jevResult.archetype} / ${jevResult.theme}`,
        latencyMs: jevResult.latencyMs,
        summary: `Prompt classified into ${jevResult.archetype} (${jevResult.theme}, ${jevResult.complexity}) in ${jevResult.latencyMs}ms with ${Math.round(jevResult.confidence * 100)}% confidence`,
        details: {
          userPrompt: trimmed,
          archetype: jevResult.archetype,
          theme: jevResult.theme,
          complexity: jevResult.complexity,
          constructiveScore: jevResult.constructiveScore,
          confidence: jevResult.confidence,
          latencyMs: jevResult.latencyMs,
        },
      });

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
          const estTokens = Math.max(1, Math.round(fullHtml.length / 4));

          store.recordTelemetry({
            type: "generation",
            title: `OpenRouter Synthesis: ${state.selectedModel}`,
            tokens: estTokens,
            model: state.selectedModel,
            summary: `Synthesized initial page (${estTokens.toLocaleString()} tokens, ${fullHtml.length} chars) using ${state.selectedModel}`,
            details: {
              model: state.selectedModel,
              estimatedTokens: estTokens,
              characterCount: fullHtml.length,
              lockedDesignSystem: designSystem,
            },
          });

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

    // Immediately show high-visibility action feedback with loader
    const targetLabel = event.text ? `"${event.text.slice(0, 35)}"` : `<${event.tagName.toLowerCase()}>`;
    this.showStatusOverlay(
      `Action: ${targetLabel}`,
      true,
      0,
      "TypeSafe Jev reflex evaluating intent..."
    );

    const state = store.getState();
    store.setState({ isReflexEvaluating: true });

    // Record UI event in telemetry timeline
    store.recordTelemetry({
      type: "ui_event",
      title: `UI Interaction: ${event.eventType.toUpperCase()} <${event.tagName.toLowerCase()}>`,
      summary: `Target: "${event.text || event.id || event.tagName}" (Action: ${event.action || "none"}, Target: ${event.target || "none"})`,
      details: {
        eventType: event.eventType,
        tagName: event.tagName,
        id: event.id,
        className: event.className,
        text: event.text,
        action: event.action,
        target: event.target,
        href: event.href,
        formData: event.formData,
        contextSnippet: event.contextSnippet,
      },
    });

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

      // Record Jev reflex decision
      store.recordTelemetry({
        type: "reflex_routing",
        title: `TypeSafe Jev Reflex: ${reflex.actionPathway}`,
        latencyMs: reflex.latencyMs,
        summary: `Pathway: ${reflex.actionPathway} -> ${reflex.targetSelector} (Intent: ${reflex.mutationIntent}, Confidence: ${Math.round(reflex.confidence * 100)}%)`,
        details: {
          actionPathway: reflex.actionPathway,
          targetSelector: reflex.targetSelector,
          mutationIntent: reflex.mutationIntent,
          latencyMs: reflex.latencyMs,
          confidence: reflex.confidence,
          siteContext,
        },
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
              store.recordTelemetry({
                type: "dom_patch",
                title: "Restored Homepage Snapshot",
                summary: "Replaced view with initial homepage snapshot",
                details: { route: "#/" },
              });
              this.showStatusOverlay("Returned to Homepage", false, 1500);
            }
          } else {
            this.sandbox.toggleClass(reflex.targetSelector, "hidden");
            store.recordTelemetry({
              type: "dom_patch",
              title: `Class Toggle: ${reflex.targetSelector}`,
              summary: `Toggled "hidden" class on selector "${reflex.targetSelector}"`,
              details: {
                selector: reflex.targetSelector,
                actionPathway: "local_toggle",
              },
            });
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

          const patchTokens = Math.max(1, Math.round(patchHtml.length / 4));
          store.recordTelemetry({
            type: "dom_patch",
            title: `Surgical DOM Patch: ${reflex.targetSelector}`,
            tokens: patchTokens,
            summary: `Replaced ${reflex.targetSelector} with ~${patchTokens} tokens of updated HTML`,
            details: {
              selector: reflex.targetSelector,
              mutationIntent: reflex.mutationIntent,
              patchHtmlSnippet: patchHtml.slice(0, 300),
              estimatedTokens: patchTokens,
            },
          });

          this.sandbox.patchElement(reflex.targetSelector, patchHtml);
          store.pushHistory(`Patch: ${reflex.mutationIntent}`, state.currentHtml);
          this.hideStatusOverlay();
          break;
        }

        case "full_page_transition": {
          // Full page screen transition with design system & shell lock
          const newRoute = reflex.mutationIntent.includes("checkout") ? "#/checkout" : "#/" + reflex.mutationIntent.replace("navigate_", "");
          await this.handlePageTransition(
            reflex.mutationIntent,
            newRoute,
            reflex.targetPageTitle,
            reflex.contentHint
          );
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
          store.recordTelemetry({
            type: "dom_patch",
            title: "Form Submission Feedback",
            summary: "Mounted success confirmation banner",
            details: { selector: reflex.targetSelector },
          });
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
      store.recordTelemetry({
        type: "undo_redo",
        title: "Undo Action",
        summary: `Rolled back to snapshot: "${entry.actionDescription}"`,
        details: { action: entry.actionDescription, timestamp: entry.timestamp },
      });
      this.showStatusOverlay(`↶ Undo: ${entry.actionDescription}`, false, 1500);
    }
  }

  private handleRedo(): void {
    const entry = store.redo();
    if (entry) {
      this.sandbox.replaceRootHtml(entry.domSnapshot);
      store.recordTelemetry({
        type: "undo_redo",
        title: "Redo Action",
        summary: `Advanced forward to snapshot: "${entry.actionDescription}"`,
        details: { action: entry.actionDescription, timestamp: entry.timestamp },
      });
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

  private async handlePageTransition(
    targetIntent: string,
    newRoute: string,
    targetTitle?: string,
    contentHint?: string
  ): Promise<void> {
    const state = store.getState();
    const ds = state.session.lockedDesignSystem;

    if (!ds) {
      await this.handleGenerateSite(`${state.prompt} - ${targetIntent.replace("_", " ")}`);
      return;
    }

    const pageTitle = targetTitle || targetIntent.replace("navigate_", "").replace("_", " ");
    this.showStatusOverlay(
      `Navigating to ${pageTitle}`,
      true,
      0,
      `Reusing ${ds.brandName} design system & layout shell...`
    );
    store.setState({ isGenerating: true, statusMessage: `Transitioning to ${pageTitle}...` });
    this.streamProcessor.reset();

    await streamPageTransition({
      model: state.selectedModel,
      targetPage: pageTitle,
      intent: targetIntent,
      contentHint,
      lockedDesignSystem: ds,
      sessionContext: state.session.persistedData,
      onToken: (token) => {
        this.streamProcessor.appendToken(token);
      },
      onComplete: (newPageHtml) => {
        this.streamProcessor.finalize();
        const tokens = Math.max(1, Math.round(newPageHtml.length / 4));
        store.recordTelemetry({
          type: "generation",
          title: `Page Transition: ${pageTitle}`,
          tokens,
          model: state.selectedModel,
          summary: `Transitioned to "${pageTitle}" (~${tokens} tokens) preserving ${ds.brandName} design system & layout shell`,
          details: {
            targetPage: pageTitle,
            route: newRoute,
            contentHint,
            brandName: ds.brandName,
            theme: ds.theme,
            model: state.selectedModel,
            tokens,
          },
        });

        store.setState((prev) => ({
          isGenerating: false,
          currentHtml: newPageHtml,
          session: {
            ...prev.session,
            currentRoute: newRoute,
          },
        }));
        store.pushHistory(`Navigate: ${pageTitle}`, newPageHtml);
        this.showStatusOverlay(`✓ Loaded ${pageTitle}`, false, 2000, `Preserved ${ds.brandName} navigation & styling`);
      },
      onError: (err) => {
        store.setState({ isGenerating: false });
        this.showStatusOverlay(`⚠️ Navigation error: ${err.message}`, false, 3500);
      },
    });
  }

  private async handleRegenerateWholeSite(): Promise<void> {
    const prompt = store.getState().prompt;
    if (!prompt) return;

    store.recordTelemetry({
      type: "regenerate",
      title: "Whole Site Redesign Requested",
      summary: `Cleared locked design system to synthesize fresh layout from scratch for prompt: "${prompt.slice(0, 40)}"`,
      details: { prompt },
    });

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

  private showStatusOverlay(text: string, isProgress = false, autoHideMs = 0, subtext = ""): void {
    this.statusOverlay.classList.remove("hidden");
    this.statusOverlay.innerHTML = `
      <div class="px-5 py-3 rounded-2xl bg-slate-900/95 text-slate-100 shadow-2xl border border-indigo-500/50 text-xs font-mono flex items-center space-x-3.5 backdrop-blur-xl animate-slide-down pointer-events-auto ring-1 ring-indigo-500/20">
        ${
          isProgress
            ? `<span class="relative flex h-3.5 w-3.5 flex-shrink-0">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-indigo-400 border-t-transparent animate-spin"></span>
               </span>`
            : `<span class="w-4 h-4 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-[10px] text-indigo-300 font-bold flex-shrink-0">⚡</span>`
        }
        <div class="space-y-0.5">
          <div class="font-bold text-white text-xs tracking-wide">
            ${text}
          </div>
          ${subtext ? `<div class="text-[11px] text-indigo-300/90 font-sans">${subtext}</div>` : ""}
        </div>
      </div>
    `;

    if (autoHideMs > 0) {
      setTimeout(() => {
        this.hideStatusOverlay();
      }, autoHideMs);
    }
  }

  private updateStatusOverlay(text: string, subtext?: string): void {
    const titleEl = this.statusOverlay.querySelector(".font-bold.text-white");
    if (titleEl) {
      titleEl.textContent = text;
    }
    if (subtext) {
      const subEl = this.statusOverlay.querySelector(".font-sans");
      if (subEl) subEl.textContent = subtext;
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
