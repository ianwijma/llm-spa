/**
 * Top Bar Component
 * Persistent controls during runtime inspection:
 * - Brand & Navigation back to Landing
 * - Prompt pill
 * - Model picker
 * - TypeSafe Jev System One Reflex Pill (with latency and routing indicator)
 * - Undo / Redo controls
 * - Export HTML button
 * - Settings modal trigger
 */

import { store } from "../state/store";

export interface TopBarCallbacks {
  onGoHome: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
  onRegenerate: () => void;
  onOpenModelPicker: () => void;
  onRegenerateWholeSite: () => void;
}

export class TopBar {
  private container: HTMLElement;
  private callbacks: TopBarCallbacks;

  constructor(container: HTMLElement, callbacks: TopBarCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(): void {
    const state = store.getState();
    const canUndo = store.canUndo();
    const canRedo = store.canRedo();
    const promptShort = state.prompt.length > 38 ? state.prompt.slice(0, 38) + "…" : state.prompt;

    const currentModel = state.availableModels?.find((m) => m.id === state.selectedModel);
    const currentModelName = currentModel ? currentModel.name : state.selectedModel;

    const jev = state.jevPreflight;
    const reflex = state.lastReflexDecision;

    let jevBadgeHtml = "";
    if (reflex && state.isReflexEvaluating) {
      jevBadgeHtml = `
        <div class="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 text-xs font-mono animate-pulse">
          <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>Jev Reflex Routing...</span>
        </div>
      `;
    } else if (reflex) {
      jevBadgeHtml = `
        <div class="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700/80 text-xs font-mono" title="Last interaction routed by TypeSafe Jev System One in ${reflex.latencyMs}ms">
          <span class="text-indigo-400 font-bold">⚡ Jev</span>
          <span class="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[10px] font-semibold">${reflex.actionPathway}</span>
          <span class="text-slate-400 text-[11px]">${reflex.latencyMs}ms</span>
        </div>
      `;
    } else if (jev) {
      jevBadgeHtml = `
        <div class="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700/80 text-xs font-mono" title="Archetype: ${jev.archetype} | Theme: ${jev.theme} | Evaluated in ${jev.latencyMs}ms">
          <span class="text-indigo-400 font-bold">⚡ Jev</span>
          <span class="text-slate-300 capitalize">${jev.archetype.replace("_", " ")}</span>
          <span class="text-slate-400 text-[11px]">${jev.latencyMs}ms</span>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-200 select-none">
        <!-- Left: Logo & Prompt Pill -->
        <div class="flex items-center space-x-3">
          <button id="topbar-logo" class="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-slate-800 transition group" title="Return to Landing">
            <span class="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-white text-xs shadow-sm">
              H
            </span>
            <span class="font-bold text-sm tracking-tight text-white group-hover:text-indigo-300 transition">HyperSite</span>
          </button>

          <span class="text-slate-700">|</span>

          <!-- Prompt Pill -->
          <button id="topbar-prompt-pill" class="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 transition max-w-xs md:max-w-md truncate" title="${state.prompt}">
            <span class="text-slate-500">Prompt:</span>
            <span class="font-medium text-slate-200 truncate">${promptShort || "Untitled"}</span>
            <span class="text-slate-400 text-[10px]">✏</span>
          </button>
        </div>

        <!-- Center: Jev Reflex Status Badge -->
        <div class="hidden lg:flex items-center space-x-3">
          ${jevBadgeHtml}
        </div>

        <!-- Right: Controls (Undo/Redo, Model, Export, Settings) -->
        <div class="flex items-center space-x-2">
          <!-- Undo / Redo Buttons -->
          <div class="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              id="btn-undo"
              class="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Undo DOM Mutation (Ctrl+Z)"
              ${canUndo ? "" : "disabled"}
            >
              ↶
            </button>
            <button
              id="btn-redo"
              class="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Redo DOM Mutation (Ctrl+Y)"
              ${canRedo ? "" : "disabled"}
            >
              ↷
            </button>
          </div>

          <!-- Searchable Model Picker Button -->
          <button
            id="topbar-model-picker-btn"
            type="button"
            class="hidden sm:inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer max-w-[220px] group"
            title="Search and select from 400+ OpenRouter models"
          >
            <span class="text-violet-400 group-hover:scale-110 transition">🤖</span>
            <span class="truncate">${currentModelName}</span>
            <span class="text-slate-500 text-[9px]">▼</span>
          </button>

          <!-- Regenerate Whole Site Button -->
          <button
            id="btn-regenerate-site"
            type="button"
            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer group"
            title="Regenerate whole site from scratch with a fresh layout & design"
          >
            <span class="group-hover:rotate-180 transition-transform duration-500">🔄</span>
            <span class="hidden md:inline">Regenerate</span>
          </button>

          <!-- Export HTML Button -->
          <button
            id="btn-export"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
            title="Download Standalone HTML File with Tailwind"
          >
            <span>💾</span>
            <span class="hidden sm:inline">Export</span>
          </button>

          <!-- Settings Button -->
          <button
            id="btn-topbar-settings"
            class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="Configure BYOK API Keys & Options"
          >
            ⚙
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const logoBtn = this.container.querySelector("#topbar-logo");
    const promptPill = this.container.querySelector("#topbar-prompt-pill");
    const undoBtn = this.container.querySelector("#btn-undo");
    const redoBtn = this.container.querySelector("#btn-redo");
    const exportBtn = this.container.querySelector("#btn-export");
    const settingsBtn = this.container.querySelector("#btn-topbar-settings");
    const modelPickerBtn = this.container.querySelector("#topbar-model-picker-btn");
    const regenerateSiteBtn = this.container.querySelector("#btn-regenerate-site");

    logoBtn?.addEventListener("click", () => this.callbacks.onGoHome());
    promptPill?.addEventListener("click", () => this.callbacks.onRegenerate());
    undoBtn?.addEventListener("click", () => this.callbacks.onUndo());
    redoBtn?.addEventListener("click", () => this.callbacks.onRedo());
    exportBtn?.addEventListener("click", () => this.callbacks.onExport());
    settingsBtn?.addEventListener("click", () => this.callbacks.onOpenSettings());
    modelPickerBtn?.addEventListener("click", () => this.callbacks.onOpenModelPicker());
    regenerateSiteBtn?.addEventListener("click", () => this.callbacks.onRegenerateWholeSite());
  }
}
