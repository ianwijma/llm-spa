/**
 * Google-Style Minimalist Landing View
 * Clean centered entry point with search bar, model selector, feeling lucky generator,
 * and inspiration chips.
 */

import { store } from "../state/store";

const LUCKY_PROMPTS = [
  "An ultra-minimalist Japanese tea house online store with organic matcha varieties, tasting notes, and a tranquil bamboo aesthetic.",
  "A cyberpunk neon arcade leaderboard with high scores, cyber-hardware upgrades, and glowing particle cards.",
  "A modern SaaS analytics dashboard with revenue charts, active user metrics, live visitor counter, and dark mode cards.",
  "An artisanal sourdough bakery pre-order menu with crust guides, flour provenance, and a fresh daily bread counter.",
  "A retro 80s analog synthesizer sound calculator with frequency sliders, oscilloscope visualizer, and patch presets.",
  "A minimalist Scandinavian architectural portfolio showcasing brutalist concrete pavilions and gallery lightboxes.",
];

export interface LandingViewCallbacks {
  onSubmit: (prompt: string) => void;
  onOpenSettings: () => void;
  onOpenModelPicker: () => void;
}

export class LandingView {
  private container: HTMLElement;
  private callbacks: LandingViewCallbacks;
  private textareaEl: HTMLTextAreaElement | null = null;

  constructor(container: HTMLElement, callbacks: LandingViewCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public render(): void {
    const state = store.getState();
    const hasKeys = Boolean(state.typeSafeKey && state.openRouterKey);
    const isDemo = state.demoMode || !hasKeys;

    const currentModel = state.availableModels?.find((m) => m.id === state.selectedModel);
    const currentModelName = currentModel ? currentModel.name : state.selectedModel;

    this.container.innerHTML = `
      <div class="landing-wrapper flex flex-col items-center justify-center min-h-full px-4 py-8 max-w-4xl mx-auto text-center animate-fade-in my-auto">
        <!-- Brand Header -->
        <div class="mb-6 space-y-2.5">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide">
            <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Zero-Backend AI-Native Web Runtime</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black tracking-tight text-slate-900 flex items-center justify-center space-x-2">
            <span>Hyper</span><span class="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Site</span>
          </h1>
          <p class="text-slate-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Generate living, interactive websites with dynamic Tailwind CSS.
            Guided by <strong class="text-slate-800 font-semibold">TypeSafe Jev</strong> for sub-150ms reflex interaction routing.
          </p>
        </div>

        <!-- Google-Style Prompt Search Box -->
        <div class="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 p-4 transition-all focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-500">
          <textarea
            id="prompt-input"
            rows="2"
            class="w-full resize-none border-0 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base md:text-lg leading-relaxed"
            placeholder="Describe any web app, store, menu, or tool to create..."
          >${state.prompt}</textarea>

          <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <!-- Searchable Model Picker Trigger -->
            <button
              id="landing-model-picker-btn"
              type="button"
              class="bg-slate-50 hover:bg-slate-100 active:scale-[0.98] border border-slate-200/90 hover:border-indigo-300 text-slate-700 rounded-xl px-3 py-1.5 font-medium transition flex items-center space-x-2 cursor-pointer text-xs group"
              title="Click to search 400+ OpenRouter models"
            >
              <span class="text-violet-600 font-bold group-hover:scale-110 transition">🤖</span>
              <span class="font-semibold text-slate-800">${currentModelName}</span>
              <span class="font-mono text-slate-400 text-[10px] hidden sm:inline">(${state.selectedModel})</span>
              <span class="text-slate-400 text-[10px]">▼</span>
            </button>

            <!-- Mode / API Key Status Trigger -->
            <button
              id="landing-key-trigger"
              type="button"
              class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                hasKeys
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                  : isDemo
                  ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              }"
              title="Click to configure Demo Mode or enter your TypeSafe & OpenRouter API keys"
            >
              <span class="w-2 h-2 rounded-full ${hasKeys ? "bg-emerald-500" : "bg-amber-500"}"></span>
              <span class="font-semibold">${hasKeys ? "Live BYOK Mode" : isDemo ? "Demo Mode (Active)" : "Configure Keys"}</span>
              <span class="text-slate-400 text-[10px]">⚙ Settings</span>
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            id="btn-generate"
            class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 transition flex items-center space-x-2 text-sm"
          >
            <span>✨ Generate Site</span>
            <kbd class="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-indigo-700 text-indigo-200 rounded font-mono">↵</kbd>
          </button>
          <button
            id="btn-lucky"
            class="px-5 py-2.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 font-semibold rounded-2xl shadow-sm transition flex items-center space-x-2 text-sm"
          >
            <span>🎲 Feeling Lucky</span>
          </button>
        </div>

        <!-- Suggestion Chips -->
        <div class="mt-6 max-w-2xl">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2.5">Try an inspiration prompt:</span>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button class="chip-btn px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/80 text-xs font-medium text-slate-600 transition" data-text="Organic Kyoto Matcha Tea House with tasting notes, tea tin catalog, and checkout">
              🍵 Kyoto Matcha Store
            </button>
            <button class="chip-btn px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/80 text-xs font-medium text-slate-600 transition" data-text="Cyberpunk neon hardware store with neural implants and quantum capacitors">
              ⚡ Cyberpunk Hardware
            </button>
            <button class="chip-btn px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/80 text-xs font-medium text-slate-600 transition" data-text="Modern SaaS Analytics Studio with conversion funnels, metric tables, and live active users">
              📊 SaaS Analytics Studio
            </button>
            <button class="chip-btn px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200/80 text-xs font-medium text-slate-600 transition" data-text="Artisanal Sourdough Bakery with loaf schedules, fermentation notes, and bakery cart">
              🥖 Sourdough Bakery
            </button>
          </div>
        </div>

        <!-- Creator Footer -->
        <footer class="mt-10 pt-6 border-t border-slate-200/60 text-xs text-slate-400">
          <span>Created by </span>
          <a
            href="https://ian.wij.ma"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-slate-700 hover:text-indigo-600 underline underline-offset-4 decoration-slate-300 hover:decoration-indigo-500 transition"
          >
            Ian Wijma
          </a>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.textareaEl = this.container.querySelector("#prompt-input");
    const generateBtn = this.container.querySelector("#btn-generate");
    const luckyBtn = this.container.querySelector("#btn-lucky");
    const modelPickerBtn = this.container.querySelector("#landing-model-picker-btn");
    const keyTrigger = this.container.querySelector("#landing-key-trigger");
    const chipBtns = this.container.querySelectorAll(".chip-btn");

    modelPickerBtn?.addEventListener("click", () => {
      this.callbacks.onOpenModelPicker();
    });

    if (this.textareaEl) {
      // Auto-expand textarea without triggering full store re-renders on keystrokes
      this.textareaEl.addEventListener("input", () => {
        if (!this.textareaEl) return;
        this.textareaEl.style.height = "auto";
        this.textareaEl.style.height = Math.min(180, this.textareaEl.scrollHeight) + "px";
        store.getState().prompt = this.textareaEl.value;
      });

      // Enter submits (Shift+Enter for new line)
      this.textareaEl.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.triggerSubmit();
        }
      });
    }

    generateBtn?.addEventListener("click", () => this.triggerSubmit());

    luckyBtn?.addEventListener("click", () => {
      const randomPrompt = LUCKY_PROMPTS[Math.floor(Math.random() * LUCKY_PROMPTS.length)];
      if (this.textareaEl) {
        this.textareaEl.value = randomPrompt;
        this.textareaEl.style.height = "auto";
        this.textareaEl.style.height = Math.min(180, this.textareaEl.scrollHeight) + "px";
      }
      store.setState({ prompt: randomPrompt });
    });

    keyTrigger?.addEventListener("click", () => {
      this.callbacks.onOpenSettings();
    });

    chipBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        if (text && this.textareaEl) {
          this.textareaEl.value = text;
          this.textareaEl.style.height = "auto";
          this.textareaEl.style.height = Math.min(180, this.textareaEl.scrollHeight) + "px";
          store.setState({ prompt: text });
          this.triggerSubmit();
        }
      });
    });
  }

  public updateModelAndMode(): void {
    const state = store.getState();
    const hasKeys = Boolean(state.typeSafeKey && state.openRouterKey);
    const isDemo = state.demoMode || !hasKeys;

    const currentModel = state.availableModels?.find((m) => m.id === state.selectedModel);
    const currentModelName = currentModel ? currentModel.name : state.selectedModel;

    const modelBtn = this.container.querySelector("#landing-model-picker-btn");
    if (modelBtn) {
      modelBtn.innerHTML = `
        <span class="text-violet-600 font-bold group-hover:scale-110 transition">🤖</span>
        <span class="font-semibold text-slate-800">${currentModelName}</span>
        <span class="font-mono text-slate-400 text-[10px] hidden sm:inline">(${state.selectedModel})</span>
        <span class="text-slate-400 text-[10px]">▼</span>
      `;
    }

    const keyTrigger = this.container.querySelector("#landing-key-trigger");
    if (keyTrigger) {
      keyTrigger.className = `inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
        hasKeys
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : isDemo
          ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
          : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
      }`;
      keyTrigger.innerHTML = `
        <span class="w-2 h-2 rounded-full ${hasKeys ? "bg-emerald-500" : "bg-amber-500"}"></span>
        <span class="font-semibold">${hasKeys ? "Live BYOK Mode" : isDemo ? "Demo Mode (Active)" : "Configure Keys"}</span>
        <span class="text-slate-400 text-[10px]">⚙ Settings</span>
      `;
    }
  }

  private triggerSubmit(): void {
    const text = this.textareaEl?.value.trim() || store.getState().prompt.trim();
    if (!text) {
      this.textareaEl?.focus();
      return;
    }
    store.setState({ prompt: text });
    this.callbacks.onSubmit(text);
  }
}
