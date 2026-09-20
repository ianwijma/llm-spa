/**
 * Searchable OpenRouter Model Picker Modal
 * Supports browsing and searching across all 400+ OpenRouter models by name, slug, and provider.
 */

import { store } from "../state/store";
import type { OpenRouterModel } from "../services/openrouter";

export interface ModelPickerCallbacks {
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export class ModelPicker {
  private container: HTMLElement;
  private callbacks: ModelPickerCallbacks;
  private searchQuery: string = "";
  private selectedProvider: string = "All";
  private searchInputEl: HTMLInputElement | null = null;

  constructor(container: HTMLElement, callbacks: ModelPickerCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(): void {
    const state = store.getState();
    const models = state.availableModels || [];
    const currentModelId = state.selectedModel;

    // Filter models by search query and provider
    const filtered = this.filterModels(models);

    // Extract top providers for filter chips
    const providers = ["All", "Featured", "Anthropic", "OpenAI", "Google", "DeepSeek", "Meta", "Qwen", "Mistral"];

    this.container.innerHTML = `
      <div id="model-picker-backdrop" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl max-w-2xl w-full h-[85vh] max-h-[720px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-slide-down">
          
          <!-- Header -->
          <div class="p-6 pb-4 border-b border-slate-100 flex-shrink-0 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg">
                  🌐
                </span>
                <div>
                  <h2 class="text-xl font-bold text-slate-900">Select OpenRouter Model</h2>
                  <p class="text-xs text-slate-500">Access 400+ models with universal multi-provider routing</p>
                </div>
              </div>
              <button id="btn-close-picker" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
                ✕
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                🔍
              </span>
              <input
                id="model-search-input"
                type="text"
                placeholder="Search models by name or slug (e.g. claude, gpt-4o, gemini, deepseek, llama)..."
                value="${this.searchQuery}"
                class="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder:text-slate-400"
                autofocus
              />
              ${
                this.searchQuery
                  ? `<button id="btn-clear-search" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-sm">✕</button>`
                  : ""
              }
            </div>

            <!-- Provider Filter Chips -->
            <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              ${providers
                .map(
                  (p) => `
                <button
                  class="provider-chip px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap ${
                    this.selectedProvider === p
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }"
                  data-provider="${p}"
                >
                  ${p}
                </button>
              `
                )
                .join("")}
            </div>

            <div class="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>Showing ${filtered.length} of ${models.length} models</span>
              <span class="text-indigo-600 font-sans font-medium">Click any model to select</span>
            </div>
          </div>

          <!-- Models Scrollable List -->
          <div id="models-list" class="flex-1 overflow-y-auto p-4 space-y-2">
            ${
              filtered.length === 0
                ? `
              <div class="py-16 text-center space-y-2 text-slate-400">
                <span class="text-4xl block">🔍</span>
                <p class="font-medium text-slate-600">No models match "${this.searchQuery}"</p>
                <p class="text-xs">Try searching by company name, slug fragment, or select another provider.</p>
              </div>
            `
                : filtered
                    .map((m) => {
                      const isSelected = m.id === currentModelId;
                      const ctxFormatted = m.context_length
                        ? m.context_length >= 1000000
                          ? `${(m.context_length / 1000000).toFixed(1)}M ctx`
                          : `${Math.round(m.context_length / 1000)}K ctx`
                        : "";

                      return `
                <div
                  class="model-item group p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/50"
                      : "bg-white hover:bg-slate-50 border-slate-200/80 hover:border-indigo-200"
                  }"
                  data-id="${m.id}"
                >
                  <div class="space-y-1 min-w-0 pr-3">
                    <div class="flex items-center space-x-2">
                      <h4 class="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition">
                        ${m.name}
                      </h4>
                      ${
                        m.badge
                          ? `<span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">${m.badge}</span>`
                          : ""
                      }
                      ${
                        m.isFeatured && !m.badge
                          ? `<span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">★ Featured</span>`
                          : ""
                      }
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] truncate max-w-xs">
                        ${m.id}
                      </span>
                      <span class="text-slate-400 text-[11px] font-medium">${m.provider}</span>
                      ${
                        ctxFormatted
                          ? `<span class="text-slate-400 text-[11px] font-mono">• ${ctxFormatted}</span>`
                          : ""
                      }
                    </div>
                    ${
                      m.description
                        ? `<p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">${m.description}</p>`
                        : ""
                    }
                  </div>

                  <div class="flex items-center space-x-2 flex-shrink-0">
                    ${
                      isSelected
                        ? `<span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">✓</span>`
                        : `<span class="w-6 h-6 rounded-full border border-slate-300 group-hover:border-indigo-400 text-transparent group-hover:text-indigo-500 flex items-center justify-center text-xs transition">→</span>`
                    }
                  </div>
                </div>
              `;
                    })
                    .join("")
            }
          </div>

          <!-- Footer -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
            <span class="truncate">Active: <code class="font-mono text-indigo-600 font-semibold">${currentModelId}</code></span>
            <kbd class="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">ESC to close</kbd>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private filterModels(models: OpenRouterModel[]): OpenRouterModel[] {
    const query = this.searchQuery.trim().toLowerCase();

    return models.filter((m) => {
      // Provider filter
      if (this.selectedProvider === "Featured") {
        if (!m.isFeatured && !m.badge) return false;
      } else if (this.selectedProvider !== "All") {
        if (!m.provider.toLowerCase().includes(this.selectedProvider.toLowerCase())) {
          return false;
        }
      }

      // Search query filter: matches name, id (slug), or provider
      if (query) {
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesId = m.id.toLowerCase().includes(query);
        const matchesProvider = m.provider.toLowerCase().includes(query);
        return matchesName || matchesId || matchesProvider;
      }

      return true;
    });
  }

  private bindEvents(): void {
    const backdrop = this.container.querySelector("#model-picker-backdrop");
    const closeBtn = this.container.querySelector("#btn-close-picker");
    const clearBtn = this.container.querySelector("#btn-clear-search");
    this.searchInputEl = this.container.querySelector("#model-search-input");
    const providerChips = this.container.querySelectorAll(".provider-chip");
    const modelItems = this.container.querySelectorAll(".model-item");

    // Close on backdrop click
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        this.callbacks.onClose();
      }
    });

    closeBtn?.addEventListener("click", () => this.callbacks.onClose());

    clearBtn?.addEventListener("click", () => {
      this.searchQuery = "";
      if (this.searchInputEl) {
        this.searchInputEl.value = "";
        this.searchInputEl.focus();
      }
      const models = store.getState().availableModels || [];
      const filtered = this.filterModels(models);
      this.updateListOnly(filtered);
    });

    // Real-time search filter
    this.searchInputEl?.addEventListener("input", (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      const models = store.getState().availableModels || [];
      const filtered = this.filterModels(models);
      this.updateListOnly(filtered);
    });

    // Select provider chips (updates list and active class without re-rendering modal / backdrop)
    providerChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const prov = chip.getAttribute("data-provider") || "All";
        this.selectedProvider = prov;

        // Update chip active classes directly on DOM
        providerChips.forEach((c) => {
          const isCurrent = (c.getAttribute("data-provider") || "All") === prov;
          if (isCurrent) {
            c.className = "provider-chip px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap bg-indigo-600 text-white shadow-sm cursor-pointer";
          } else {
            c.className = "provider-chip px-3 py-1.5 rounded-full font-medium transition whitespace-nowrap bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer";
          }
        });

        const models = store.getState().availableModels || [];
        const filtered = this.filterModels(models);
        this.updateListOnly(filtered);
      });
    });

    // Select model item
    modelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        if (id) {
          this.callbacks.onSelect(id);
        }
      });
    });
  }

  private updateListOnly(filtered: OpenRouterModel[]): void {
    const listEl = this.container.querySelector("#models-list");
    const countEl = this.container.querySelector(".font-mono span");
    const currentModelId = store.getState().selectedModel;

    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${store.getState().availableModels.length} models`;
    }

    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="py-16 text-center space-y-2 text-slate-400">
          <span class="text-4xl block">🔍</span>
          <p class="font-medium text-slate-600">No models match "${this.searchQuery}"</p>
          <p class="text-xs">Try searching by model name, slug fragment, or select another provider.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered
      .map((m) => {
        const isSelected = m.id === currentModelId;
        const ctxFormatted = m.context_length
          ? m.context_length >= 1000000
            ? `${(m.context_length / 1000000).toFixed(1)}M ctx`
            : `${Math.round(m.context_length / 1000)}K ctx`
          : "";

        return `
          <div
            class="model-item group p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              isSelected
                ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/50"
                : "bg-white hover:bg-slate-50 border-slate-200/80 hover:border-indigo-200"
            }"
            data-id="${m.id}"
          >
            <div class="space-y-1 min-w-0 pr-3">
              <div class="flex items-center space-x-2">
                <h4 class="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition">
                  ${m.name}
                </h4>
                ${
                  m.badge
                    ? `<span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">${m.badge}</span>`
                    : ""
                }
                ${
                  m.isFeatured && !m.badge
                    ? `<span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">★ Featured</span>`
                    : ""
                }
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] truncate max-w-xs">
                  ${m.id}
                </span>
                <span class="text-slate-400 text-[11px] font-medium">${m.provider}</span>
                ${
                  ctxFormatted
                    ? `<span class="text-slate-400 text-[11px] font-mono">• ${ctxFormatted}</span>`
                    : ""
                }
              </div>
              ${
                m.description
                  ? `<p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">${m.description}</p>`
                  : ""
              }
            </div>

            <div class="flex items-center space-x-2 flex-shrink-0">
              ${
                isSelected
                  ? `<span class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">✓</span>`
                  : `<span class="w-6 h-6 rounded-full border border-slate-300 group-hover:border-indigo-400 text-transparent group-hover:text-indigo-500 flex items-center justify-center text-xs transition">→</span>`
              }
            </div>
          </div>
        `;
      })
      .join("");

    // Rebind items
    listEl.querySelectorAll(".model-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        if (id) {
          this.callbacks.onSelect(id);
        }
      });
    });
  }
}
