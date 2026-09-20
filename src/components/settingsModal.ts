/**
 * BYOK Settings Modal Component
 * Manages TypeSafe API Key, OpenRouter API Key, Demo Mode, and security verifications.
 */

import { store } from "../state/store";
import { getTypeSafeEndpoint } from "../services/typesafe";

export interface SettingsModalCallbacks {
  onClose: () => void;
}

export class SettingsModal {
  private container: HTMLElement;
  private callbacks: SettingsModalCallbacks;

  constructor(container: HTMLElement, callbacks: SettingsModalCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(): void {
    const state = store.getState();

    this.container.innerHTML = `
      <div id="settings-backdrop" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 text-slate-800">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div class="flex items-center space-x-3">
              <span class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                ⚙
              </span>
              <div>
                <h2 class="text-xl font-bold text-slate-900">API Credentials & Settings</h2>
                <p class="text-xs text-slate-500">Bring Your Own Key (BYOK) Client-Side Vault</p>
              </div>
            </div>
            <button id="btn-modal-close" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
              ✕
            </button>
          </div>

          <!-- Operating Mode Selector -->
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-500 block">Runtime Operating Mode</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Mode 1: Demo Mode -->
              <div
                id="mode-card-demo"
                class="p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  state.demoMode
                    ? "bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }"
              >
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <span>⚡</span><span>Demo Mode</span>
                    </span>
                    ${state.demoMode ? `<span class="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">ACTIVE</span>` : ""}
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Test immediately with simulated sub-100ms reflex routing & realistic site generation. <strong>No API keys required.</strong>
                  </p>
                </div>
              </div>

              <!-- Mode 2: Live BYOK Mode -->
              <div
                id="mode-card-byok"
                class="p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  !state.demoMode
                    ? "bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                }"
              >
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <span>🔑</span><span>Live BYOK Mode</span>
                    </span>
                    ${!state.demoMode ? `<span class="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">ACTIVE</span>` : ""}
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Directly calls live <strong>TypeSafe Jev</strong> and <strong>OpenRouter</strong> APIs using your private keys.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- TypeSafe Jev API Key Input -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <label for="input-typesafe-key" class="font-semibold text-slate-700 flex items-center space-x-1.5">
                <span class="text-indigo-600">⚡</span>
                <span>TypeSafe API Key</span>
              </label>
              <a href="https://typesafe.ai" target="_blank" rel="noopener" class="text-indigo-600 hover:underline">
                Get TypeSafe Key →
              </a>
            </div>
            <div class="flex space-x-2">
              <input
                id="input-typesafe-key"
                type="password"
                placeholder="ts_..."
                value="${state.typeSafeKey}"
                class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                id="btn-test-typesafe"
                type="button"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                Test Ping
              </button>
            </div>
            <p id="typesafe-status" class="text-[11px] text-slate-400">
              Powers sub-150ms System One reflex interaction routing and prompt pre-flight.
            </p>
          </div>

          <!-- OpenRouter API Key Input -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <label for="input-openrouter-key" class="font-semibold text-slate-700 flex items-center space-x-1.5">
                <span class="text-violet-600">🌐</span>
                <span>OpenRouter API Key</span>
              </label>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" class="text-indigo-600 hover:underline">
                Get OpenRouter Key →
              </a>
            </div>
            <div class="flex space-x-2">
              <input
                id="input-openrouter-key"
                type="password"
                placeholder="sk-or-..."
                value="${state.openRouterKey}"
                class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                id="btn-test-openrouter"
                type="button"
                class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                Test Ping
              </button>
            </div>
            <p id="openrouter-status" class="text-[11px] text-slate-400">
              Powers generative HTML synthesis via Claude 3.5 Sonnet, GPT-4o, Gemini 2.0, or DeepSeek.
            </p>
          </div>

          <!-- Security Assurance Box -->
          <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
            <div class="font-bold flex items-center space-x-1.5 text-indigo-900">
              <span>🔒 Strict BYOK Isolation</span>
            </div>
            <p class="text-indigo-800/90 leading-relaxed">
              Keys are stored exclusively in your browser's <code class="font-mono bg-indigo-100/80 px-1 py-0.5 rounded">localStorage</code>.
              The generated site runs inside an opaque cross-origin sandbox (<code class="font-mono bg-indigo-100/80 px-1 py-0.5 rounded">sandbox="allow-scripts allow-forms"</code>) with no access to parent memory or storage.
            </p>
          </div>

          <!-- Modal Footer Actions -->
          <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              id="btn-save-settings"
              class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
            >
              Save Credentials
            </button>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const backdrop = this.container.querySelector("#settings-backdrop");
    const closeBtn = this.container.querySelector("#btn-modal-close");
    const saveBtn = this.container.querySelector("#btn-save-settings");
    const typeSafeInput = this.container.querySelector("#input-typesafe-key") as HTMLInputElement | null;
    const openRouterInput = this.container.querySelector("#input-openrouter-key") as HTMLInputElement | null;

    const modeDemoCard = this.container.querySelector("#mode-card-demo");
    const modeByokCard = this.container.querySelector("#mode-card-byok");

    let isDemoSelected = store.getState().demoMode;

    const updateModeCards = () => {
      if (modeDemoCard && modeByokCard) {
        if (isDemoSelected) {
          modeDemoCard.className = "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20";
          modeByokCard.className = "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between bg-slate-50 border-slate-200 hover:border-slate-300";
        } else {
          modeDemoCard.className = "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between bg-slate-50 border-slate-200 hover:border-slate-300";
          modeByokCard.className = "p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20";
        }
      }
    };

    modeDemoCard?.addEventListener("click", () => {
      isDemoSelected = true;
      updateModeCards();
    });

    modeByokCard?.addEventListener("click", () => {
      isDemoSelected = false;
      updateModeCards();
    });

    const testTypeSafeBtn = this.container.querySelector("#btn-test-typesafe");
    const testOpenRouterBtn = this.container.querySelector("#btn-test-openrouter");

    const typeSafeStatus = this.container.querySelector("#typesafe-status");
    const openRouterStatus = this.container.querySelector("#openrouter-status");

    // Close on backdrop click outside modal
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        this.callbacks.onClose();
      }
    });

    closeBtn?.addEventListener("click", () => this.callbacks.onClose());

    saveBtn?.addEventListener("click", () => {
      const typeSafeKey = typeSafeInput?.value.trim() || "";
      const openRouterKey = openRouterInput?.value.trim() || "";

      store.setState({
        typeSafeKey,
        openRouterKey,
        demoMode: isDemoSelected,
        settingsOpen: false,
      });

      this.callbacks.onClose();
    });

    // Test TypeSafe Ping
    testTypeSafeBtn?.addEventListener("click", async () => {
      const key = typeSafeInput?.value.trim();
      if (!key) {
        if (typeSafeStatus) {
          typeSafeStatus.innerHTML = `<span class="text-amber-600">⚠️ Enter a key first to test connection.</span>`;
        }
        return;
      }

      if (typeSafeStatus) {
        typeSafeStatus.innerHTML = `<span class="text-indigo-600">Pinging TypeSafe API (jev-latest)...</span>`;
      }

      try {
        const endpoint = getTypeSafeEndpoint();
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "jev-latest",
            state: "ping test",
            questions: {
              ping: {
                type: "noul",
                instructions: "Is this a connection ping?",
              },
            },
          }),
        });

        if (res.ok) {
          if (typeSafeStatus) {
            typeSafeStatus.innerHTML = `<span class="text-emerald-600 font-semibold">✓ TypeSafe connection verified! (jev-latest responded)</span>`;
          }
        } else if (res.status === 401) {
          if (typeSafeStatus) {
            typeSafeStatus.innerHTML = `<span class="text-rose-600 font-semibold">✗ Invalid TypeSafe API Key. Please verify key.</span>`;
          }
        } else if (res.status === 422) {
          // Authentication succeeded, body format reached model
          if (typeSafeStatus) {
            typeSafeStatus.innerHTML = `<span class="text-emerald-600 font-semibold">✓ TypeSafe authenticated successfully!</span>`;
          }
        } else {
          const err = await res.text();
          if (typeSafeStatus) {
            typeSafeStatus.innerHTML = `<span class="text-rose-600">✗ Failed (${res.status}): ${err.slice(0, 80)}</span>`;
          }
        }
      } catch (err: any) {
        if (typeSafeStatus) {
          typeSafeStatus.innerHTML = `<span class="text-rose-600">✗ Network error: ${err.message}. If in production, ensure CORS or proxy is enabled.</span>`;
        }
      }
    });

    // Test OpenRouter Ping
    testOpenRouterBtn?.addEventListener("click", async () => {
      const key = openRouterInput?.value.trim();
      if (!key) {
        if (openRouterStatus) {
          openRouterStatus.innerHTML = `<span class="text-amber-600">⚠️ Enter an OpenRouter key first to test connection.</span>`;
        }
        return;
      }

      if (openRouterStatus) {
        openRouterStatus.innerHTML = `<span class="text-indigo-600">Pinging OpenRouter API...</span>`;
      }

      try {
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const label = data.data?.label || "Valid";
          if (openRouterStatus) {
            openRouterStatus.innerHTML = `<span class="text-emerald-600 font-semibold">✓ OpenRouter key valid (${label})</span>`;
          }
        } else {
          if (openRouterStatus) {
            openRouterStatus.innerHTML = `<span class="text-rose-600">✗ OpenRouter returned status ${res.status}</span>`;
          }
        }
      } catch (err: any) {
        if (openRouterStatus) {
          openRouterStatus.innerHTML = `<span class="text-rose-600">✗ Network error: ${err.message}</span>`;
        }
      }
    });
  }
}
