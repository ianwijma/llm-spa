/**
 * Diagnostics & Telemetry Debug Modal
 * Comprehensive inspectable timeline tracking:
 * - TypeSafe Jev System One questions, answers, probabilities, and confidence
 * - OpenRouter token generation timings, token counts, and models
 * - Injected micro-proxy UI events, target signatures, and DOM context snippets
 * - Full-page transitions, partial DOM patches, and Undo/Redo history
 */

import { store, type TelemetryEvent } from "../state/store";

export interface DebugModalCallbacks {
  onClose: () => void;
}

export class DebugModal {
  private container: HTMLElement;
  private callbacks: DebugModalCallbacks;
  private activeFilter: string = "all";
  private expandedEventIds: Set<string> = new Set();

  constructor(container: HTMLElement, callbacks: DebugModalCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(): void {
    const state = store.getState();
    const events = state.telemetryEvents || [];
    const totalTokens = state.totalTokensUsed || 0;

    // Calculate latency metrics
    const jevLatencies = events
      .filter((e) => (e.type === "reflex_routing" || e.type === "preflight") && e.latencyMs)
      .map((e) => e.latencyMs as number);
    const avgJevLatency =
      jevLatencies.length > 0
        ? Math.round(jevLatencies.reduce((a, b) => a + b, 0) / jevLatencies.length)
        : 0;

    const filtered = this.getFilteredEvents(events);

    const ds = state.session.lockedDesignSystem;

    this.container.innerHTML = `
      <div id="debug-backdrop" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
        <div class="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full h-[90vh] max-h-[820px] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-slide-down">
          
          <!-- Header -->
          <div class="p-6 pb-4 border-b border-slate-800 flex-shrink-0 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                  ⚡
                </span>
                <div>
                  <h2 class="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                    <span>System Telemetry & Reflex Timeline</span>
                  </h2>
                  <p class="text-xs text-slate-400">Live inspection of TypeSafe Jev System One judgments, OpenRouter streaming, and DOM reactivity</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  id="btn-copy-telemetry"
                  type="button"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-xl text-xs font-mono transition flex items-center space-x-1.5"
                  title="Copy full telemetry JSON log to clipboard"
                >
                  <span>📋</span>
                  <span>Copy Log</span>
                </button>
                <button
                  id="btn-clear-telemetry"
                  type="button"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-mono transition"
                  title="Clear telemetry timeline"
                >
                  Clear
                </button>
                <button id="btn-close-debug" class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
                  ✕
                </button>
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                <span class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Recorded Events</span>
                <span class="text-lg font-black text-white font-mono block">${events.length}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                <span class="text-[10px] text-indigo-400 uppercase tracking-widest font-mono">Avg Jev Latency</span>
                <span class="text-lg font-black text-indigo-300 font-mono block">${avgJevLatency > 0 ? `${avgJevLatency}ms` : "—"}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                <span class="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Total Tokens</span>
                <span class="text-lg font-black text-cyan-300 font-mono block">${totalTokens.toLocaleString()}</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                <span class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Design Lock</span>
                <span class="text-xs font-bold text-slate-200 truncate block mt-1">
                  ${ds ? `${ds.brandName} (${ds.theme})` : "Unlocked (Initial)"}
                </span>
              </div>
            </div>

            <!-- Filter Tabs -->
            <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              ${[
                { id: "all", label: `All (${events.length})` },
                { id: "jev", label: "⚡ Jev Decisions" },
                { id: "generation", label: "🌐 OpenRouter LLM" },
                { id: "ui", label: "🖱️ UI Interactions" },
                { id: "dom", label: "🎨 DOM Mutations" },
              ]
                .map(
                  (tab) => `
                <button
                  class="filter-tab px-3 py-1.5 rounded-full font-mono text-xs transition whitespace-nowrap ${
                    this.activeFilter === tab.id
                      ? "bg-indigo-600 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
                  }"
                  data-filter="${tab.id}"
                >
                  ${tab.label}
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Timeline List -->
          <div id="timeline-list" class="flex-1 overflow-y-auto p-6 space-y-3">
            ${
              filtered.length === 0
                ? `
              <div class="py-20 text-center space-y-3 text-slate-500 font-mono">
                <span class="text-4xl block">⚡</span>
                <p class="text-sm font-semibold text-slate-400">No events recorded matching this filter.</p>
                <p class="text-xs">Interact with the generated site or type a prompt to record live telemetry.</p>
              </div>
            `
                : filtered.map((e) => this.renderEventCard(e)).join("")
            }
          </div>

          <!-- Footer -->
          <div class="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono flex-shrink-0">
            <span>Model: <code class="text-indigo-400">${state.selectedModel}</code></span>
            <kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400">ESC to close</kbd>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private getFilteredEvents(events: TelemetryEvent[]): TelemetryEvent[] {
    if (this.activeFilter === "jev") {
      return events.filter((e) => e.type === "preflight" || e.type === "reflex_routing");
    }
    if (this.activeFilter === "generation") {
      return events.filter((e) => e.type === "generation" || e.type === "regenerate");
    }
    if (this.activeFilter === "ui") {
      return events.filter((e) => e.type === "ui_event");
    }
    if (this.activeFilter === "dom") {
      return events.filter((e) => e.type === "dom_patch" || e.type === "undo_redo");
    }
    return events;
  }

  private renderEventCard(e: TelemetryEvent): string {
    const isExpanded = this.expandedEventIds.has(e.id);
    const timeStr = new Date(e.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });

    let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
    let icon = "◈";

    if (e.type === "preflight") {
      badgeColor = "bg-indigo-950/80 text-indigo-300 border-indigo-500/40";
      icon = "⚡ JEV PRE-FLIGHT";
    } else if (e.type === "reflex_routing") {
      badgeColor = "bg-violet-950/80 text-violet-300 border-violet-500/40";
      icon = "⚡ JEV REFLEX";
    } else if (e.type === "generation") {
      badgeColor = "bg-cyan-950/80 text-cyan-300 border-cyan-500/40";
      icon = "🌐 OPENROUTER";
    } else if (e.type === "ui_event") {
      badgeColor = "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
      icon = "🖱️ UI EVENT";
    } else if (e.type === "dom_patch") {
      badgeColor = "bg-amber-950/80 text-amber-300 border-amber-500/40";
      icon = "🎨 DOM PATCH";
    } else if (e.type === "undo_redo") {
      badgeColor = "bg-pink-950/80 text-pink-300 border-pink-500/40";
      icon = "↶ TIME-TRAVEL";
    } else if (e.type === "regenerate") {
      badgeColor = "bg-rose-950/80 text-rose-300 border-rose-500/40";
      icon = "🔄 REGENERATE";
    }

    return `
      <div class="event-card rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition overflow-hidden" data-id="${e.id}">
        <!-- Card Header -->
        <div class="p-4 flex items-center justify-between cursor-pointer select-none card-toggle" data-id="${e.id}">
          <div class="flex items-center space-x-3 min-w-0">
            <span class="px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold tracking-wider ${badgeColor} whitespace-nowrap">
              ${icon}
            </span>
            <div class="min-w-0 space-y-0.5">
              <h4 class="text-sm font-bold text-white truncate">${e.title}</h4>
              <p class="text-xs text-slate-400 font-mono truncate">${e.summary}</p>
            </div>
          </div>

          <div class="flex items-center space-x-3 flex-shrink-0">
            ${
              e.latencyMs !== undefined
                ? `<span class="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-semibold">${e.latencyMs}ms</span>`
                : ""
            }
            ${
              e.tokens
                ? `<span class="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono">${e.tokens} tok</span>`
                : ""
            }
            <span class="text-[11px] font-mono text-slate-500 hidden sm:inline">${timeStr}</span>
            <span class="text-slate-400 text-xs font-mono transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}">
              ▼
            </span>
          </div>
        </div>

        <!-- Expanded Details Accordion -->
        ${
          isExpanded
            ? `
          <div class="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-slate-950/90 text-xs font-mono space-y-3">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto text-slate-300 max-h-64 leading-relaxed">
              <pre class="text-[11px]">${JSON.stringify(e.details, null, 2)}</pre>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private bindEvents(): void {
    const backdrop = this.container.querySelector("#debug-backdrop");
    const closeBtn = this.container.querySelector("#btn-close-debug");
    const copyBtn = this.container.querySelector("#btn-copy-telemetry");
    const clearBtn = this.container.querySelector("#btn-clear-telemetry");
    const filterTabs = this.container.querySelectorAll(".filter-tab");
    const cardToggles = this.container.querySelectorAll(".card-toggle");

    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        this.callbacks.onClose();
      }
    });

    closeBtn?.addEventListener("click", () => this.callbacks.onClose());

    copyBtn?.addEventListener("click", () => {
      const json = JSON.stringify(store.getState().telemetryEvents, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        if (copyBtn) {
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = `<span>✓</span><span>Copied!</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = original;
          }, 1500);
        }
      });
    });

    clearBtn?.addEventListener("click", () => {
      store.clearTelemetry();
      this.render();
    });

    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const f = tab.getAttribute("data-filter") || "all";
        this.activeFilter = f;
        this.render();
      });
    });

    cardToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const id = toggle.getAttribute("data-id");
        if (!id) return;
        if (this.expandedEventIds.has(id)) {
          this.expandedEventIds.delete(id);
        } else {
          this.expandedEventIds.add(id);
        }
        this.render();
      });
    });
  }
}
