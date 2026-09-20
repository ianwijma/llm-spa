/**
 * Reactive Application Store
 * Zero-framework single-file reactive state container for HyperSite.
 */

import {
  getStoredTypeSafeKey,
  getStoredOpenRouterKey,
  getStoredModel,
  getStoredDemoMode,
  setStoredTypeSafeKey,
  setStoredOpenRouterKey,
  setStoredModel,
  setStoredDemoMode,
} from "./storage";
import { POPULAR_MODELS, type OpenRouterModel } from "../services/openrouter";

export interface JevPreflightResult {
  isConstructive: boolean;
  constructiveScore: number;
  archetype: string;
  theme: string;
  complexity: "minimal" | "moderate" | "high";
  latencyMs: number;
  confidence: number;
}

export interface JevReflexResult {
  actionPathway: "local_toggle" | "partial_dom_patch" | "full_page_transition" | "external_link" | "inert_click" | "form_feedback";
  targetSelector: string;
  mutationIntent: string;
  latencyMs: number;
  confidence: number;
  summary: string;
  timestamp: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface LockedDesignSystem {
  brandName: string;
  brandTagline?: string;
  brandIcon: string;
  archetype: string;
  theme: string;
  headerHtml: string;
  footerHtml?: string;
  wrapperClasses: string;
  colorScheme: {
    backgroundClass: string;
    textClass: string;
    primaryButtonClass: string;
    secondaryButtonClass: string;
    cardClass: string;
    fontFamilyClass: string;
  };
}

export interface SessionData {
  originalPrompt: string;
  currentRoute: string;
  lockedDesignSystem: LockedDesignSystem | null;
  designTokens: {
    archetype: string;
    theme: string;
    primaryColor: string;
  };
  persistedData: {
    cartItems?: CartItem[];
    formSubmissions?: Record<string, any>;
    activeFilters?: Record<string, string>;
    totalItemsInCart?: number;
    [key: string]: any;
  };
}

export interface HistoryEntry {
  timestamp: number;
  actionDescription: string;
  domSnapshot: string;
}

export interface AppState {
  currentView: "landing" | "runtime";
  prompt: string;
  selectedModel: string;
  typeSafeKey: string;
  openRouterKey: string;
  demoMode: boolean;
  isGenerating: boolean;
  isStreaming: boolean;
  isReflexEvaluating: boolean;
  statusMessage: string;
  streamedTokenCount: number;
  currentHtml: string;
  jevPreflight: JevPreflightResult | null;
  lastReflexDecision: JevReflexResult | null;
  session: SessionData;
  domHistory: HistoryEntry[];
  historyIndex: number;
  settingsOpen: boolean;
  availableModels: OpenRouterModel[];
  isModelPickerOpen: boolean;
}

type Listener = (state: AppState) => void;

const initialState: AppState = {
  currentView: "landing",
  prompt: "",
  selectedModel: getStoredModel(),
  typeSafeKey: getStoredTypeSafeKey(),
  openRouterKey: getStoredOpenRouterKey(),
  demoMode: getStoredDemoMode(),
  isGenerating: false,
  isStreaming: false,
  isReflexEvaluating: false,
  statusMessage: "",
  streamedTokenCount: 0,
  currentHtml: "",
  jevPreflight: null,
  lastReflexDecision: null,
  session: {
    originalPrompt: "",
    currentRoute: "#/",
    lockedDesignSystem: null,
    designTokens: {
      archetype: "saas_landing",
      theme: "modern_saas",
      primaryColor: "indigo",
    },
    persistedData: {
      cartItems: [],
      totalItemsInCart: 0,
      activeFilters: {},
      formSubmissions: {},
    },
  },
  domHistory: [],
  historyIndex: -1,
  settingsOpen: false,
  availableModels: POPULAR_MODELS,
  isModelPickerOpen: false,
};

class Store {
  private state: AppState = { ...initialState };
  private listeners: Set<Listener> = new Set();

  public getState(): AppState {
    return this.state;
  }

  public setState(partial: Partial<AppState> | ((prev: AppState) => Partial<AppState>)): void {
    const updates = typeof partial === "function" ? partial(this.state) : partial;
    this.state = { ...this.state, ...updates };

    // Sync persistent keys if modified
    if (updates.typeSafeKey !== undefined) {
      setStoredTypeSafeKey(updates.typeSafeKey);
    }
    if (updates.openRouterKey !== undefined) {
      setStoredOpenRouterKey(updates.openRouterKey);
    }
    if (updates.selectedModel !== undefined) {
      setStoredModel(updates.selectedModel);
    }
    if (updates.demoMode !== undefined) {
      setStoredDemoMode(updates.demoMode);
    }

    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error("Store listener error:", err);
      }
    }
  }

  public pushHistory(actionDescription: string, domSnapshot: string): void {
    // Truncate any forward redo history if we are branched
    const newHistory = this.state.domHistory.slice(0, this.state.historyIndex + 1);
    newHistory.push({
      timestamp: Date.now(),
      actionDescription,
      domSnapshot,
    });

    this.setState({
      domHistory: newHistory,
      historyIndex: newHistory.length - 1,
      currentHtml: domSnapshot,
    });
  }

  public canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.state.historyIndex < this.state.domHistory.length - 1;
  }

  public undo(): HistoryEntry | null {
    if (!this.canUndo()) return null;
    const newIndex = this.state.historyIndex - 1;
    const entry = this.state.domHistory[newIndex];
    this.setState({
      historyIndex: newIndex,
      currentHtml: entry.domSnapshot,
    });
    return entry;
  }

  public redo(): HistoryEntry | null {
    if (!this.canRedo()) return null;
    const newIndex = this.state.historyIndex + 1;
    const entry = this.state.domHistory[newIndex];
    this.setState({
      historyIndex: newIndex,
      currentHtml: entry.domSnapshot,
    });
    return entry;
  }
}

export const store = new Store();
