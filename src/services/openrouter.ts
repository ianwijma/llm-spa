/**
 * OpenRouter SDK Integration Service
 * Multi-model HTML/Tailwind generation via @openrouter/sdk with async streaming iterables.
 */

import { OpenRouter } from "@openrouter/sdk";
import { getStoredOpenRouterKey, getStoredDemoMode } from "../state/storage";
import type { JevPreflightResult, LockedDesignSystem } from "../state/store";

export interface OpenRouterModel {
  id: string;              // model slug / identifier (e.g., "anthropic/claude-3.5-sonnet")
  name: string;            // model display name (e.g., "Anthropic: Claude 3.5 Sonnet")
  provider: string;        // company / family (e.g., "Anthropic", "OpenAI", "Google", "DeepSeek", "Meta")
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string | number;
    completion: string | number;
  };
  badge?: string;
  isFeatured?: boolean;
}

export const POPULAR_MODELS: OpenRouterModel[] = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    badge: "Recommended",
    description: "Highest aesthetic design fidelity & flawless Tailwind usage",
    context_length: 200000,
    isFeatured: true,
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    badge: "Flagship",
    description: "Latest hybrid reasoning model with superior UI synthesis",
    context_length: 200000,
    isFeatured: true,
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    badge: "Fastest",
    description: "Ultra-low latency streaming generation at very low cost",
    context_length: 1048576,
    isFeatured: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    badge: "Balanced",
    description: "Complex interactive logic, rich layout structures, and forms",
    context_length: 128000,
    isFeatured: true,
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    badge: "Economical",
    description: "Highly economical high-performance alternative",
    context_length: 64000,
    isFeatured: true,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    badge: "Reasoning",
    description: "High-level reasoning model with chain-of-thought",
    context_length: 64000,
    isFeatured: true,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    badge: "Open Weights",
    description: "High capability open model, budget-friendly",
    context_length: 131072,
    isFeatured: true,
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    provider: "Qwen",
    badge: "Code Specialist",
    description: "Exceptional frontend code generation and semantic markup",
    context_length: 32768,
    isFeatured: true,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    badge: "Lightweight",
    description: "Fast, highly affordable multimodal model",
    context_length: 128000,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    badge: "High Speed",
    description: "Lightning-fast responses with Claude's signature formatting",
    context_length: 200000,
  },
  {
    id: "mistralai/mistral-large-2411",
    name: "Mistral Large 2411",
    provider: "Mistral",
    badge: "Enterprise",
    description: "Top-tier flagship reasoning model from Mistral AI",
    context_length: 128000,
  },
  {
    id: "x-ai/grok-2-1212",
    name: "Grok 2",
    provider: "xAI",
    badge: "Frontier",
    description: "State-of-the-art vision and language reasoning model",
    context_length: 131072,
  },
  {
    id: "google/gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    badge: "Long Context",
    description: "Massive 2M token context window with strong reasoning",
    context_length: 2097152,
  },
  {
    id: "cohere/command-r-plus",
    name: "Command R+",
    provider: "Cohere",
    badge: "Business",
    description: "Optimized for structured UI actions and citations",
    context_length: 128000,
  },
];

let cachedModels: OpenRouterModel[] | null = null;

/**
 * Fetches the entire public model catalog from OpenRouter (400+ models)
 * Caches in memory and localStorage for instantaneous repeated loads.
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  if (cachedModels && cachedModels.length > 0) {
    return cachedModels;
  }

  // Check localStorage cache (valid for 4 hours)
  if (typeof localStorage !== "undefined") {
    try {
      const rawCache = localStorage.getItem("openrouter_models_cache");
      const cacheTime = localStorage.getItem("openrouter_models_cache_time");
      if (rawCache && cacheTime && Date.now() - Number(cacheTime) < 1000 * 60 * 60 * 4) {
        const parsed = JSON.parse(rawCache) as OpenRouterModel[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedModels = parsed;
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Failed reading model cache:", err);
    }
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) {
      throw new Error(`OpenRouter models API returned ${res.status}`);
    }
    const data = await res.json();
    const rawList = data.data || [];

    const mapped: OpenRouterModel[] = rawList.map((m: any) => {
      const parts = (m.id || "").split("/");
      let provider = parts.length > 1 ? parts[0] : "Other";
      if (provider === "anthropic") provider = "Anthropic";
      else if (provider === "openai") provider = "OpenAI";
      else if (provider === "google") provider = "Google";
      else if (provider === "deepseek") provider = "DeepSeek";
      else if (provider === "meta-llama" || provider === "meta") provider = "Meta";
      else if (provider === "qwen") provider = "Qwen";
      else if (provider === "mistralai" || provider === "mistral") provider = "Mistral";
      else if (provider === "x-ai") provider = "xAI";
      else if (provider === "cohere") provider = "Cohere";
      else if (provider === "microsoft") provider = "Microsoft";
      else provider = provider.charAt(0).toUpperCase() + provider.slice(1);

      const isFeatured = POPULAR_MODELS.some((p) => p.id === m.id);

      return {
        id: m.id,
        name: m.name || m.id,
        provider,
        description: m.description || "",
        context_length: m.context_length,
        pricing: m.pricing,
        isFeatured,
      };
    });

    if (mapped.length > 0) {
      cachedModels = mapped;
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem("openrouter_models_cache", JSON.stringify(mapped));
          localStorage.setItem("openrouter_models_cache_time", String(Date.now()));
        } catch (e) {}
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Failed fetching live OpenRouter models list, using curated fallback list:", err);
  }

  cachedModels = POPULAR_MODELS;
  return POPULAR_MODELS;
}

export const SYSTEM_PROMPT_HTML_GENERATION = `
You are an elite, world-class UI/UX engineer and Tailwind CSS master craftsman.
You generate production-grade, stunning, responsive web pages.

STRICT OPERATIONAL RULES:
1. Return ONLY valid, semantic HTML markup for the page content inside <body>.
2. DO NOT output markdown code fences (\`\`\`html or \`\`\`). Output raw HTML directly.
3. NEVER write any <script> tags. All behavior and reactivity is handled by the platform runtime.
4. Style ALL elements exclusively using Tailwind CSS utility classes. Take advantage of full Tailwind capabilities:
   - Modern color palettes (slate, zinc, stone, emerald, violet, amber, rose, sky, cyan, fuchsia)
   - CSS Grid and Flexbox layouts (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
   - Interactive hover, focus, and active states (hover:scale-105, hover:shadow-lg, transition-all duration-200)
   - Subtle gradients, frosted glass (backdrop-blur-md bg-white/80 or bg-slate-900/80)
   - Rounded corners (rounded-2xl, rounded-3xl), refined borders, and soft shadows
5. Interactive elements MUST include semantic data attributes:
   - data-action: action name (e.g., "add_to_cart", "filter_category", "open_modal", "close_modal", "checkout", "tab_select")
   - data-target: CSS selector of the component to update or toggle (e.g., "#cart-drawer", "#modal", "#items-container")
   - data-state: initial state if relevant (e.g., "closed", "active")
   - id: provide clear descriptive IDs on interactive cards, drawers, and modal containers (e.g. id="cart-drawer", id="modal", id="cart-badge")
6. Include complete, rich, realistic content, copy, and UI sections:
   - Header with brand name, navigation links, and action buttons / cart badge
   - Hero section with engaging typography, badges, and call-to-actions
   - Main content grid or showcase with multiple rich cards, pricing, features, or menu items
   - Interactive modal or slide-over drawer (initially hidden with class "hidden" or styled appropriately)
   - Footer with links and copyright
7. Ensure mobile-first responsiveness with md: and lg: breakpoints.
`;

export function createOpenRouterClient(): OpenRouter {
  const apiKey = getStoredOpenRouterKey();
  if (!apiKey && !getStoredDemoMode()) {
    throw new Error("Missing OpenRouter API Key. Configure in Settings or enable Demo Mode.");
  }

  return new OpenRouter({
    apiKey: apiKey || "demo-key",
    httpReferer: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
    appTitle: "HyperSite AI-Native Web Runtime",
  });
}

export interface StreamGenerationOptions {
  model: string;
  userPrompt: string;
  jevGuidance?: JevPreflightResult | null;
  sessionContext?: Record<string, any>;
  onToken: (token: string) => void;
  onComplete: (fullHtml: string) => void;
  onError: (err: Error) => void;
}

export interface FragmentPatchOptions {
  model: string;
  targetSelector: string;
  actionIntent: string;
  existingElementHtml: string;
  sessionContext: Record<string, any>;
}

/**
 * Stream full page generation using @openrouter/sdk async iterables
 */
export async function streamPageGeneration(options: StreamGenerationOptions): Promise<void> {
  const apiKey = getStoredOpenRouterKey();
  const isDemo = getStoredDemoMode() || !apiKey;

  if (isDemo) {
    return simulateStreamingGeneration(options);
  }

  let client: OpenRouter;
  try {
    client = createOpenRouterClient();
  } catch (err: any) {
    options.onError(err);
    return;
  }

  const archetype = options.jevGuidance?.archetype || "general";
  const theme = options.jevGuidance?.theme || "modern_saas";
  const complexity = options.jevGuidance?.complexity || "moderate";

  const userInstruction = `
User Website Goal: ${options.userPrompt}
System One (Jev) Architectural Guidance:
- Archetype: ${archetype}
- Visual Design Language: ${theme}
- Complexity Level: ${complexity}
${options.sessionContext ? `Persisted Session State:\n${JSON.stringify(options.sessionContext, null, 2)}` : ""}

Generate the complete, fully formed HTML body content following all rules.
`;

  try {
    const responseStream = await client.chat.send({
      chatRequest: {
        model: options.model,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT_HTML_GENERATION },
          { role: "user", content: userInstruction },
        ],
        provider: {
          sort: "price",
        },
      },
    });

    let accumulatedHtml = "";

    // Consume async iterable stream from SDK
    const stream = responseStream as unknown as AsyncIterable<any>;
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        accumulatedHtml += delta;
        options.onToken(delta);
      }
    }

    // Clean any accidental markdown fences
    const cleanHtml = stripMarkdownFences(accumulatedHtml);
    options.onComplete(cleanHtml);
  } catch (error: any) {
    console.error("OpenRouter streaming error:", error);
    let message = error instanceof Error ? error.message : String(error);
    if (message.includes("401") || message.includes("auth")) {
      message = "OpenRouter authentication failed: Please check your API key in Settings.";
    } else if (message.includes("429")) {
      message = "OpenRouter rate limit reached. Retrying or switch to another model.";
    }
    options.onError(new Error(message));
  }
}

/**
 * Extracts and locks the design system, header, footer, and styling tokens from generated HTML
 */
export function extractDesignSystemFromHtml(
  html: string,
  _prompt: string,
  jev?: JevPreflightResult | null
): LockedDesignSystem {
  const Parser =
    typeof DOMParser !== "undefined"
      ? DOMParser
      : typeof window !== "undefined"
      ? window.DOMParser
      : null;

  let doc: Document | null = null;
  if (Parser) {
    try {
      const parser = new Parser();
      doc = parser.parseFromString(html, "text/html");
    } catch {}
  }

  // 1. Extract Header & Footer HTML via DOM or Regex fallback
  let headerHtml = "";
  let footerHtml = "";
  let brandName = "HyperSite";
  let brandIcon = "⚡";
  let wrapperClasses = "min-h-screen bg-slate-50 text-slate-900 font-sans";
  let primaryButtonClass = "px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium";
  let cardClass = "bg-white rounded-2xl border border-slate-200 p-6 shadow-sm";

  if (doc) {
    const headerEl = doc.querySelector("header, nav");
    headerHtml = headerEl ? headerEl.outerHTML : "";
    const footerEl = doc.querySelector("footer");
    footerHtml = footerEl ? footerEl.outerHTML : "";

    if (headerEl) {
      const candidates = headerEl.querySelectorAll("h1, h2, span.font-bold, span.font-black, span.text-xl, a");
      for (const el of candidates) {
        const text = el.textContent?.trim() || "";
        if (text.length > 2 && !text.toLowerCase().includes("cart") && !text.toLowerCase().includes("basket") && !text.toLowerCase().includes("order")) {
          brandName = text;
          break;
        }
      }
      const iconEl = headerEl.querySelector("div.w-10, div.w-9, div.w-8, span.text-2xl, span.text-lg, span.text-xl");
      if (iconEl && iconEl.textContent) {
        brandIcon = iconEl.textContent.trim().slice(0, 4);
      }
    }

    const rootDiv = doc.querySelector("div");
    if (rootDiv && rootDiv.getAttribute("class")) {
      wrapperClasses = rootDiv.getAttribute("class") || wrapperClasses;
    }

    const primaryBtn = doc.querySelector(
      "button[data-action*='add'], button[data-action*='order'], button[data-action*='checkout'], button.bg-indigo-600, button.bg-emerald-900, button.bg-cyan-500, main button"
    );
    if (primaryBtn && primaryBtn.getAttribute("class")) {
      primaryButtonClass = primaryBtn.getAttribute("class") || primaryButtonClass;
    }

    const cardEl = doc.querySelector("div[id*='card'], div[id*='item'], div.rounded-2xl, div.rounded-3xl");
    if (cardEl && cardEl.getAttribute("class")) {
      cardClass = cardEl.getAttribute("class") || cardClass;
    }
  } else {
    // Regex fallback for non-DOM environments
    const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
    headerHtml = headerMatch ? headerMatch[0] : "";
    const brandMatch = html.match(/class=["\'][^"\']*font-bold[^"\']*["\']>([^<]+)<\//i);
    if (brandMatch) brandName = brandMatch[1].trim();
    const wrapperMatch = html.match(/<div[^>]*class=["\']([^"\']+)["\']/i);
    if (wrapperMatch) wrapperClasses = wrapperMatch[1];
    const btnMatch = html.match(/<button[^>]*class=["\']([^"\']+)["\']/i);
    if (btnMatch) primaryButtonClass = btnMatch[1];
  }

  const archetype = jev?.archetype || "ecommerce";
  const theme = jev?.theme || "modern_saas";

  return {
    brandName,
    brandIcon,
    archetype,
    theme,
    headerHtml,
    footerHtml,
    wrapperClasses,
    colorScheme: {
      backgroundClass: wrapperClasses.split(" ").find((c) => c.startsWith("bg-")) || "bg-slate-50",
      textClass: wrapperClasses.split(" ").find((c) => c.startsWith("text-")) || "text-slate-900",
      primaryButtonClass,
      secondaryButtonClass: "px-5 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl",
      cardClass,
      fontFamilyClass: wrapperClasses.includes("font-serif")
        ? "font-serif"
        : wrapperClasses.includes("font-mono")
        ? "font-mono"
        : "font-sans",
    },
  };
}

export interface PageTransitionOptions {
  model: string;
  targetPage: string;
  intent: string;
  lockedDesignSystem: LockedDesignSystem;
  sessionContext?: Record<string, any>;
  onToken: (token: string) => void;
  onComplete: (fullHtml: string) => void;
  onError: (err: Error) => void;
}

/**
 * Reuses locked design system, header, and styling to generate consistent follow-up pages
 */
export async function streamPageTransition(options: PageTransitionOptions): Promise<void> {
  const apiKey = getStoredOpenRouterKey();
  const isDemo = getStoredDemoMode() || !apiKey;

  if (isDemo) {
    const mockTransition = generateTransitionMockHtml(
      options.lockedDesignSystem,
      options.intent,
      options.sessionContext
    );
    const chunkSize = 35;
    let accumulated = "";
    for (let i = 0; i < mockTransition.length; i += chunkSize) {
      const chunk = mockTransition.slice(i, i + chunkSize);
      accumulated += chunk;
      options.onToken(chunk);
      await new Promise((r) => setTimeout(r, 10));
    }
    options.onComplete(accumulated);
    return;
  }

  const client = createOpenRouterClient();
  const ds = options.lockedDesignSystem;

  const prompt = `
Generate the <main id="page-content"> for page: "${options.targetPage}".
Intent: ${options.intent}

STRICT DESIGN SYSTEM LOCK (DO NOT DEVIATE):
- Brand Name: ${ds.brandName}
- Visual Theme: ${ds.theme}
- Primary Button Styling: ${ds.colorScheme.primaryButtonClass}
- Card Styling: ${ds.colorScheme.cardClass}
- Typography / Font Family: ${ds.colorScheme.fontFamilyClass}

Session Context Data:
${JSON.stringify(options.sessionContext, null, 2)}

Instructions:
1. Generate ONLY the <main id="page-content">...</main> HTML block.
2. DO NOT output <header> or <footer> (they are already locked and persisted by the host container).
3. Match the visual aesthetic, color palette, button shapes, and typography exactly.
4. Output raw HTML only, no markdown wrappers (\`\`\`html).
`;

  try {
    const responseStream = await client.chat.send({
      chatRequest: {
        model: options.model,
        stream: true,
        messages: [
          {
            role: "system",
            content: "You are a precise frontend UI compiler. Generate only the matching <main id=\"page-content\"> content adhering strictly to the design system.",
          },
          { role: "user", content: prompt },
        ],
      },
    });

    let mainContent = "";
    const stream = responseStream as unknown as AsyncIterable<any>;
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        mainContent += delta;
        options.onToken(delta);
      }
    }

    const cleanMain = stripMarkdownFences(mainContent);
    const assembledHtml = `
<div class="${ds.wrapperClasses}">
  ${ds.headerHtml}
  ${cleanMain}
  ${ds.footerHtml || ""}
</div>`.trim();

    options.onComplete(assembledHtml);
  } catch (err: any) {
    console.warn("Live page transition failed, using design-locked fallback:", err);
    const mock = generateTransitionMockHtml(ds, options.intent, options.sessionContext);
    options.onComplete(mock);
  }
}

/**
 * Generates an exact design-locked subpage layout matching the existing site
 */
export function generateTransitionMockHtml(
  ds: LockedDesignSystem,
  intent: string,
  sessionContext?: Record<string, any>
): string {
  const isDark = ds.colorScheme.backgroundClass.includes("950") || ds.colorScheme.backgroundClass.includes("900");
  const cartItems = sessionContext?.cartItems || [
    { id: "1", name: "Artisanal Selection", price: 38, qty: 1 },
  ];
  const total = cartItems.reduce((acc: number, item: any) => acc + item.price * (item.qty || 1), 0);

  // 1. Checkout / Order Subpage
  if (intent.includes("checkout") || intent.includes("order") || intent.includes("cart")) {
    return `
<div class="${ds.wrapperClasses}">
  ${ds.headerHtml}

  <main id="page-content" class="max-w-5xl mx-auto px-6 py-12 space-y-10 animate-fade-in">
    <!-- Breadcrumb & Back -->
    <div class="flex items-center justify-between border-b ${isDark ? "border-slate-800" : "border-slate-200"} pb-4">
      <div class="flex items-center space-x-2 text-xs text-slate-400">
        <a href="#/" data-action="navigate_home" data-target="#app-root" class="hover:underline">Home</a>
        <span>/</span>
        <span class="${isDark ? "text-slate-200" : "text-slate-800"} font-bold">Secure Checkout</span>
      </div>
      <span class="text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}">SSL 256-Bit Encrypted</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- Checkout Form -->
      <div class="lg:col-span-7 space-y-6">
        <div class="${ds.colorScheme.cardClass} space-y-5">
          <h2 class="text-xl font-bold ${ds.colorScheme.fontFamilyClass}">1. Shipping & Delivery Address</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div class="space-y-1">
              <label class="text-slate-400">First Name</label>
              <input type="text" value="Jane" class="w-full px-3.5 py-2.5 rounded-xl ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"} border focus:outline-none" />
            </div>
            <div class="space-y-1">
              <label class="text-slate-400">Last Name</label>
              <input type="text" value="Doe" class="w-full px-3.5 py-2.5 rounded-xl ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"} border focus:outline-none" />
            </div>
            <div class="md:col-span-2 space-y-1">
              <label class="text-slate-400">Street Address</label>
              <input type="text" value="742 Evergreen Terrace" class="w-full px-3.5 py-2.5 rounded-xl ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"} border focus:outline-none" />
            </div>
          </div>
        </div>

        <div class="${ds.colorScheme.cardClass} space-y-5">
          <h2 class="text-xl font-bold ${ds.colorScheme.fontFamilyClass}">2. Payment Details</h2>
          <div class="p-4 rounded-xl ${isDark ? "bg-slate-900/80 border border-slate-700" : "bg-slate-50 border border-slate-200"} flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2">
              <span>💳</span>
              <span class="font-bold">Card ending in 4242</span>
            </div>
            <span class="text-emerald-500 font-bold">Expires 12/28</span>
          </div>
          <button data-action="submit_order" data-target="#order-confirmation" class="w-full py-4 ${ds.colorScheme.primaryButtonClass} text-center shadow-lg transition active:scale-[0.99] flex items-center justify-center space-x-2">
            <span>Place Order ($${total})</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <!-- Order Summary Card -->
      <div class="lg:col-span-5">
        <div id="order-confirmation" class="${ds.colorScheme.cardClass} space-y-6">
          <div class="flex items-center justify-between border-b ${isDark ? "border-slate-800" : "border-slate-100"} pb-3">
            <h3 class="font-bold text-base ${ds.colorScheme.fontFamilyClass}">Order Summary</h3>
            <span class="text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"} font-mono">${cartItems.length} items</span>
          </div>

          <div class="space-y-3">
            ${cartItems
              .map(
                (item: any) => `
              <div class="flex justify-between items-center text-xs">
                <div>
                  <span class="font-medium block">${item.name}</span>
                  <span class="text-slate-400">Qty: ${item.qty || 1}</span>
                </div>
                <span class="font-bold font-mono">$${item.price * (item.qty || 1)}</span>
              </div>`
              )
              .join("")}
          </div>

          <div class="pt-4 border-t ${isDark ? "border-slate-800" : "border-slate-100"} space-y-2 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Standard Shipping</span>
              <span class="text-emerald-500 font-bold">FREE</span>
            </div>
            <div class="flex justify-between text-base font-bold pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-100"}">
              <span>Total Due</span>
              <span class="font-mono">$${total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  ${ds.footerHtml || ""}
</div>`.trim();
  }

  // 2. Default Navigation Subpage (Heritage, Teaware, Specs, About)
  return `
<div class="${ds.wrapperClasses}">
  ${ds.headerHtml}

  <main id="page-content" class="max-w-5xl mx-auto px-6 py-14 space-y-12 animate-fade-in">
    <div class="border-b ${isDark ? "border-slate-800" : "border-slate-200"} pb-6">
      <span class="text-xs font-semibold uppercase tracking-wider text-indigo-500">${ds.brandName} • Extended View</span>
      <h1 class="text-3xl md:text-5xl font-bold ${ds.colorScheme.fontFamilyClass} mt-2 capitalize">${intent.replace("_", " ")}</h1>
      <p class="text-slate-400 text-base mt-2 max-w-2xl leading-relaxed">
        Adhering to our design identity with matching typography, color harmony, and dedicated components.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="${ds.colorScheme.cardClass} space-y-4">
        <h3 class="text-xl font-bold ${ds.colorScheme.fontFamilyClass}">Origin & Philosophy</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          Every element is handcrafted to maintain aesthetic cohesion across user journeys, preserving navigation state and brand loyalty.
        </p>
        <button data-action="toggle_cart" data-target="#cart-drawer" class="${ds.colorScheme.primaryButtonClass} text-xs">
          Open In-Memory Basket
        </button>
      </div>

      <div class="${ds.colorScheme.cardClass} space-y-4">
        <h3 class="text-xl font-bold ${ds.colorScheme.fontFamilyClass}">Technical Specifications</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          Zero external runtime drift. Unified Tailwind CSS utility tokens compiled on the fly with sub-150ms Jev reflex routing.
        </p>
        <a href="#/" data-action="navigate_home" data-target="#app-root" class="${ds.colorScheme.secondaryButtonClass} text-xs inline-block text-center">
          ← Return to Main Page
        </a>
      </div>
    </div>
  </main>

  ${ds.footerHtml || ""}
</div>`.trim();
}

/**
 * Targeted component fragment regeneration (Partial DOM Patch)
 */
export async function generateComponentPatch(options: FragmentPatchOptions): Promise<string> {
  const apiKey = getStoredOpenRouterKey();
  const isDemo = getStoredDemoMode() || !apiKey;

  if (isDemo) {
    return simulateComponentPatch(options);
  }

  const client = createOpenRouterClient();

  const prompt = `
Target Element Selector: ${options.targetSelector}
Action Required: ${options.actionIntent}
Current Element HTML:
${options.existingElementHtml}

Current Session Data:
${JSON.stringify(options.sessionContext, null, 2)}

Instructions:
Generate ONLY the replacement HTML for ${options.targetSelector}.
Use Tailwind CSS classes matching the design language.
Return raw semantic HTML only. Absolutely NO markdown wrappers (\`\`\`html).
`;

  try {
    const response = (await client.chat.send({
      chatRequest: {
        model: options.model,
        stream: false,
        messages: [
          {
            role: "system",
            content: "You are a precise frontend component compiler. Output only the updated HTML element.",
          },
          { role: "user", content: prompt },
        ],
      },
    })) as any;

    const content = response.choices?.[0]?.message?.content || "";
    return stripMarkdownFences(content).trim();
  } catch (err: any) {
    console.warn("Live fragment patch failed, using fallback patch generator:", err);
    return simulateComponentPatch(options);
  }
}

/**
 * Strips markdown code fences from LLM responses
 */
export function stripMarkdownFences(html: string): string {
  let cleaned = html.trim();
  if (cleaned.startsWith("```html")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * High-fidelity streaming simulator for Demo Mode / instant offline testing
 */
async function simulateStreamingGeneration(options: StreamGenerationOptions): Promise<void> {
  const mockHtml = generateMockHtml(options.userPrompt, options.jevGuidance);
  const chunkSize = 28;
  let accumulated = "";

  for (let i = 0; i < mockHtml.length; i += chunkSize) {
    const chunk = mockHtml.slice(i, i + chunkSize);
    accumulated += chunk;
    options.onToken(chunk);
    // Simulate real SSE streaming rate (~30-50 tokens/sec)
    await new Promise((r) => setTimeout(r, 12));
  }

  options.onComplete(accumulated);
}

function simulateComponentPatch(options: FragmentPatchOptions): string {
  const selector = options.targetSelector;
  const intent = options.actionIntent;

  if (selector.includes("cart-drawer") || intent.includes("add_item") || intent.includes("cart")) {
    const items = options.sessionContext.cartItems || [
      { id: "item-1", name: "Artisanal Selection", price: 28, qty: 1 },
    ];
    const total = items.reduce((acc: number, item: any) => acc + item.price * (item.qty || 1), 0);

    return `
<div id="cart-drawer" class="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50 transition-all duration-300">
  <div class="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
    <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div class="flex items-center space-x-2">
        <span class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">🛒</span>
        <h2 class="text-lg font-bold text-slate-900">Your Cart (${items.length})</h2>
      </div>
      <button data-action="dismiss_overlay" data-target="#cart-drawer" class="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
        ✕
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      ${items
        .map(
          (it: any) => `
        <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <div>
            <h4 class="font-medium text-slate-900 text-sm">${it.name}</h4>
            <span class="text-xs text-indigo-600 font-semibold">$${it.price} × ${it.qty || 1}</span>
          </div>
          <span class="text-sm font-bold text-slate-900">$${it.price * (it.qty || 1)}</span>
        </div>`
        )
        .join("")}
    </div>
    <div class="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
      <div class="flex justify-between items-center text-sm font-medium text-slate-600">
        <span>Subtotal</span>
        <span class="text-lg font-bold text-slate-900">$${total}</span>
      </div>
      <button data-action="checkout" data-target="#app-root" class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition active:scale-[0.99] flex items-center justify-center space-x-2">
        <span>Proceed to Checkout</span>
        <span>→</span>
      </button>
    </div>
  </div>
</div>`.trim();
  }

  if (selector.includes("modal") || intent.includes("modal") || intent.includes("details")) {
    return `
<div id="modal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
  <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
    <div class="flex justify-between items-center pb-3 border-b border-slate-100">
      <h3 class="text-lg font-bold text-slate-900">Item Specifications</h3>
      <button data-action="dismiss_overlay" data-target="#modal" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">✕</button>
    </div>
    <p class="text-sm text-slate-600 leading-relaxed">
      Specially crafted with precision and sustainably sourced ingredients. Certified organic and single-origin.
    </p>
    <div class="pt-3 flex justify-end space-x-3">
      <button data-action="dismiss_overlay" data-target="#modal" class="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
      <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm">Add to Order</button>
    </div>
  </div>
</div>`.trim();
  }

  // Fallback patch
  return `
<div id="filter-container" class="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-between">
  <span class="text-sm font-medium">✓ State successfully updated via surgical DOM patch.</span>
  <span class="text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-mono">100ms reflex</span>
</div>`.trim();
}

/**
 * Generates aesthetic mock HTML matching prompt parameters
 */
function generateMockHtml(prompt: string, jev?: JevPreflightResult | null): string {
  const p = prompt.toLowerCase();
  const archetype = jev?.archetype || "ecommerce";
  const theme = jev?.theme || "zen_organic";

  // 1. Crypto / Web3 with Glassmorphism
  if (archetype === "crypto_web3" || theme === "glassmorphism_luxury" || p.includes("crypto") || p.includes("token") || p.includes("web3") || p.includes("swap")) {
    return `
<div class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white font-sans selection:bg-cyan-500 selection:text-black">
  <header class="border-b border-white/10 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-cyan-500/20">
          ◈
        </div>
        <div>
          <span class="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">AURA.SWAP</span>
          <span class="block text-[10px] font-mono tracking-widest text-cyan-400 uppercase">Solana High-Yield Protocol</span>
        </div>
      </div>
      <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
        <a href="#swap" class="hover:text-cyan-400 transition">Swap</a>
        <a href="#pools" class="hover:text-cyan-400 transition">Liquidity Pools</a>
        <a href="#staking" class="hover:text-cyan-400 transition">Staking (18.4% APR)</a>
        <a href="#analytics" class="hover:text-cyan-400 transition">Analytics</a>
      </nav>
      <div class="flex items-center space-x-3">
        <button id="cart-badge" data-action="toggle_cart" data-target="#cart-drawer" class="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-mono text-cyan-300 backdrop-blur-md transition flex items-center space-x-2">
          <span>Active Orders</span>
          <span class="px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300 text-[11px] font-bold">2</span>
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-12 space-y-12">
    <!-- Swap & Staking Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Swap Card -->
      <div class="lg:col-span-7 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-mono text-cyan-400 uppercase tracking-widest">Instant DEX Router</span>
            <h2 class="text-2xl font-bold tracking-tight">Decentralized Token Exchange</h2>
          </div>
          <div class="flex space-x-1.5 p-1 bg-white/5 rounded-xl border border-white/10 text-xs font-mono">
            <button class="px-3 py-1 bg-cyan-500 text-slate-950 rounded-lg font-bold">Swap</button>
            <button class="px-3 py-1 text-slate-400 hover:text-white transition">Limit</button>
          </div>
        </div>

        <div class="space-y-3">
          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div class="flex justify-between text-xs text-slate-400">
              <span>You Pay</span>
              <span>Balance: 42.5 SOL</span>
            </div>
            <div class="flex items-center justify-between">
              <input type="text" value="10.0" class="bg-transparent text-3xl font-black font-mono focus:outline-none w-1/2" />
              <div class="flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 font-bold text-sm">
                <span>◎ SOL</span>
              </div>
            </div>
          </div>

          <div class="flex justify-center -my-2 relative z-10">
            <button class="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-sm shadow-lg border border-indigo-400/30 transition transform hover:rotate-180 duration-300">
              ⇅
            </button>
          </div>

          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div class="flex justify-between text-xs text-slate-400">
              <span>You Receive</span>
              <span>1 SOL = $184.20 USDC</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-3xl font-black font-mono text-cyan-400">1,842.00</span>
              <div class="flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 font-bold text-sm">
                <span>💵 USDC</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button data-action="add_item_to_cart" data-target="#cart-drawer" class="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-black text-slate-950 text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition active:scale-[0.99]">
            EXECUTE SWAP TRANSACTION
          </button>
        </div>
      </div>

      <!-- Live Pools Info -->
      <div class="lg:col-span-5 space-y-6">
        <div class="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-base">Top Staking Vaults</h3>
            <button data-action="open_item_details" data-target="#modal" class="text-xs text-cyan-400 hover:underline font-mono">View Specs →</button>
          </div>

          <div class="space-y-3">
            <div class="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
              <div class="space-y-1">
                <span class="font-bold text-sm">SOL-USDC Pool</span>
                <span class="block text-xs text-slate-400 font-mono">TVL: $48.2M</span>
              </div>
              <div class="text-right">
                <span class="text-emerald-400 font-bold font-mono text-base">24.2% APR</span>
                <span class="block text-[10px] text-slate-400 uppercase">Auto-compounding</span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
              <div class="space-y-1">
                <span class="font-bold text-sm">JTO-SOL Pool</span>
                <span class="block text-xs text-slate-400 font-mono">TVL: $19.4M</span>
              </div>
              <div class="text-right">
                <span class="text-emerald-400 font-bold font-mono text-base">31.8% APR</span>
                <span class="block text-[10px] text-slate-400 uppercase">Reward Vault</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <div id="cart-drawer" class="hidden fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
    <div class="w-screen max-w-md bg-slate-900 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl text-white">
      <div>
        <div class="flex justify-between items-center pb-4 border-b border-white/10">
          <h3 class="font-bold text-lg">Active DEX Orders</h3>
          <button data-action="dismiss_overlay" data-target="#cart-drawer" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>
        <div class="py-6 space-y-3">
          <div class="p-4 bg-black/40 border border-white/10 rounded-2xl flex justify-between items-center">
            <div>
              <div class="text-sm font-bold text-cyan-400">Swap 10.0 SOL → USDC</div>
              <div class="text-xs text-slate-400">Order #8921 • Slippage 0.5%</div>
            </div>
            <span class="font-mono text-emerald-400 font-bold">1,842.00 USDC</span>
          </div>
        </div>
      </div>
      <button data-action="checkout" data-target="#app-root" class="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-sm transition">
        CONFIRM PROTOCOL TRANSACTION
      </button>
    </div>
  </div>

  <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
    <div class="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center pb-3 border-b border-white/10">
        <h3 class="font-bold text-lg text-white">Automated Market Maker Metrics</h3>
        <button data-action="dismiss_overlay" data-target="#modal" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <p class="text-sm text-slate-300 leading-relaxed font-mono text-xs">
        Constant-product invariant: x * y = k. Dynamic routing calculates lowest price-impact paths across 12 distributed liquidity sources.
      </p>
      <div class="flex justify-end space-x-2 pt-2">
        <button data-action="dismiss_overlay" data-target="#modal" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold">Close</button>
      </div>
    </div>
  </div>
</div>`.trim();
  }

  // 2. SaaS Dashboard with Analytics
  if (archetype === "dashboard" || p.includes("dashboard") || p.includes("analytics") || p.includes("crm")) {
    return `
<div class="min-h-screen bg-slate-900 text-slate-100 font-sans">
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between hidden md:flex">
      <div class="space-y-8">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">📊</div>
          <span class="font-bold text-base tracking-tight text-white">Nexus Metrics</span>
        </div>
        <nav class="space-y-1.5 text-xs font-medium text-slate-400">
          <a href="#overview" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20">
            <span>📈</span><span>Overview</span>
          </a>
          <a href="#conversions" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition">
            <span>🎯</span><span>Conversions</span>
          </a>
          <a href="#customers" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition">
            <span>👥</span><span>Customer LTV</span>
          </a>
          <a href="#settings" class="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition">
            <span>⚙️</span><span>Telemetry</span>
          </a>
        </nav>
      </div>
      <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
        <span class="text-slate-400 block text-[10px] uppercase font-mono">Real-Time Ingestion</span>
        <span class="text-emerald-400 font-bold font-mono">● 2,410 events/sec</span>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-8 space-y-8">
      <header class="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <span class="text-xs font-mono text-indigo-400 uppercase tracking-widest">Executive Workspace</span>
          <h1 class="text-2xl font-black text-white mt-1">Growth & Revenue Velocity</h1>
        </div>
        <div class="flex items-center space-x-3">
          <button id="cart-badge" data-action="toggle_cart" data-target="#cart-drawer" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition flex items-center space-x-2">
            <span>Active Alerts</span>
            <span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">3</span>
          </button>
        </div>
      </header>

      <!-- Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
          <div class="flex justify-between items-center text-xs text-slate-400">
            <span>Monthly Recurring Revenue</span>
            <span class="text-emerald-400 font-mono font-bold">+14.2%</span>
          </div>
          <span class="text-3xl font-black text-white font-mono">$128,450</span>
          <span class="text-xs text-slate-500 block">vs $112,400 prior period</span>
        </div>

        <div class="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
          <div class="flex justify-between items-center text-xs text-slate-400">
            <span>Active Paying Workspaces</span>
            <span class="text-emerald-400 font-mono font-bold">+8.1%</span>
          </div>
          <span class="text-3xl font-black text-white font-mono">1,894</span>
          <span class="text-xs text-slate-500 block">98.4% retention rate</span>
        </div>

        <div class="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
          <div class="flex justify-between items-center text-xs text-slate-400">
            <span>Average Order Value</span>
            <span class="text-indigo-400 font-mono font-bold">+4.6%</span>
          </div>
          <span class="text-3xl font-black text-white font-mono">$67.80</span>
          <span class="text-xs text-slate-500 block">Across 18 geographic zones</span>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-white text-base">Recent Conversion Events</h3>
          <button data-action="open_item_details" data-target="#modal" class="text-xs text-indigo-400 hover:underline">Inspection Log →</button>
        </div>
        <div class="space-y-2 text-xs font-mono">
          <div class="p-3 bg-slate-900 rounded-xl flex justify-between items-center text-slate-300">
            <span>Acme Corp upgraded to Enterprise Tier ($4,200/mo)</span>
            <span class="text-slate-500">2m ago</span>
          </div>
          <div class="p-3 bg-slate-900 rounded-xl flex justify-between items-center text-slate-300">
            <span>Stripe webhook: Invoice #8410 paid successfully</span>
            <span class="text-slate-500">6m ago</span>
          </div>
        </div>
      </div>
    </main>
  </div>

  <div id="cart-drawer" class="hidden fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
    <div class="w-screen max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
      <div>
        <div class="flex justify-between items-center pb-4 border-b border-slate-800">
          <h3 class="font-bold text-white text-lg">System Alerts (3)</h3>
          <button data-action="dismiss_overlay" data-target="#cart-drawer" class="text-slate-400 hover:text-white">✕</button>
        </div>
        <div class="py-6 space-y-3">
          <div class="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span class="font-bold text-emerald-400">High Conversion Velocity</span>
            <p class="text-slate-400">Signups spiked by 34% in the European availability zone.</p>
          </div>
        </div>
      </div>
      <button data-action="checkout" data-target="#app-root" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
        DISMISS ALL ALERTS
      </button>
    </div>
  </div>

  <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
      <div class="flex justify-between items-center pb-3 border-b border-slate-800">
        <h3 class="font-bold text-white">Telemetry Log Inspector</h3>
        <button data-action="dismiss_overlay" data-target="#modal" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <p class="text-xs text-slate-400 font-mono">
        Aggregated ingestion throughput: 2.4k req/sec across 18 edge datacenters. Zero query degradation.
      </p>
      <div class="flex justify-end pt-2">
        <button data-action="dismiss_overlay" data-target="#modal" class="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-700">Close</button>
      </div>
    </div>
  </div>
</div>`.trim();
  }

  // 3. Brutalist Neo Studio
  if (theme === "brutalist_neo" || p.includes("brutalist")) {
    return `
<div class="min-h-screen bg-amber-50 text-black font-mono selection:bg-black selection:text-white p-6 md:p-12">
  <header class="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000] mb-10 flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 bg-black text-white font-black text-2xl flex items-center justify-center">■</div>
      <span class="text-2xl font-black tracking-tight">RAW.STUDIO</span>
    </div>
    <button id="cart-badge" data-action="toggle_cart" data-target="#cart-drawer" class="px-4 py-2 border-2 border-black bg-yellow-300 font-black text-xs uppercase shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition">
      WORKS CART [1]
    </button>
  </header>

  <main class="space-y-10">
    <div class="border-4 border-black bg-white p-8 md:p-14 shadow-[8px_8px_0px_#000] space-y-6">
      <span class="px-3 py-1 bg-black text-white text-xs font-bold uppercase">MANIFESTO 2026</span>
      <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
        FORM FOLLOWS NO ONE.
      </h1>
      <p class="text-base font-bold max-w-2xl leading-relaxed">
        Brutalist industrial design, physical computing installations, and uncompromising visual architecture.
      </p>
      <div class="flex gap-4 pt-4">
        <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-8 py-4 bg-emerald-400 border-4 border-black font-black text-sm uppercase shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition">
          COMMISSION MONOGRAPH ($120)
        </button>
        <button data-action="open_item_details" data-target="#modal" class="px-8 py-4 bg-white border-4 border-black font-black text-sm uppercase shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition">
          VIEW SPEC SHEET
        </button>
      </div>
    </div>
  </main>

  <div id="cart-drawer" class="hidden fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
    <div class="w-screen max-w-md bg-white border-4 border-black p-6 flex flex-col justify-between shadow-[10px_10px_0px_#000]">
      <div class="space-y-4">
        <div class="flex justify-between items-center pb-4 border-b-4 border-black">
          <h3 class="font-black text-xl uppercase">ACTIVE COMMISSIONS</h3>
          <button data-action="dismiss_overlay" data-target="#cart-drawer" class="font-black text-xl">✕</button>
        </div>
        <div class="p-4 bg-yellow-200 border-2 border-black">
          <span class="font-black text-sm block">MONOGRAPH HARDCOVER</span>
          <span class="font-bold text-xs">$120 × 1</span>
        </div>
      </div>
      <button data-action="checkout" data-target="#app-root" class="w-full py-4 bg-black text-white font-black text-sm uppercase">
        CONFIRM ORDER ($120)
      </button>
    </div>
  </div>

  <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0px_#000] space-y-4">
      <h3 class="font-black text-lg uppercase">SPECIFICATION SHEET</h3>
      <p class="text-xs font-bold leading-relaxed">Cast concrete casing, tactile mechanical switches, industrial laser etching.</p>
      <div class="flex justify-end pt-2">
        <button data-action="dismiss_overlay" data-target="#modal" class="px-4 py-2 border-2 border-black font-black text-xs uppercase bg-yellow-300">DISMISS</button>
      </div>
    </div>
  </div>
</div>`.trim();
  }

  // 4. Dark Cyberpunk (as before)
  if (theme === "dark_cyberpunk" || p.includes("cyberpunk") || p.includes("dark") || p.includes("neon")) {
    return `
<div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-fuchsia-500 selection:text-white">
  <!-- Navigation -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center font-black text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          ⚡
        </div>
        <span class="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">NEON.PULSE</span>
      </div>
      <nav class="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-wide text-slate-400">
        <a href="#featured" class="hover:text-cyan-400 transition">Featured</a>
        <a href="#specs" class="hover:text-cyan-400 transition">Hardware</a>
        <a href="#leaderboard" class="hover:text-cyan-400 transition">Leaderboard</a>
      </nav>
      <div class="flex items-center space-x-4">
        <button id="cart-badge" data-action="toggle_cart" data-target="#cart-drawer" class="relative px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition text-sm font-mono flex items-center space-x-2">
          <span>CART</span>
          <span class="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/40">1</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="max-w-7xl mx-auto px-6 py-16">
    <div class="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-950 to-purple-950/30 p-8 md:p-14 mb-16 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
      <div class="max-w-2xl space-y-6">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Next-Gen Cyber Hardware</span>
        </div>
        <h1 class="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          OVERCLOCK YOUR <span class="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">REALITY</span>
        </h1>
        <p class="text-slate-400 text-base md:text-lg leading-relaxed">
          Zero-latency neural interfaces and photonic synthesizers engineered for high-bandwidth operations.
        </p>
        <div class="flex flex-wrap gap-4 pt-2">
          <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm tracking-wide">
            EXPLORE INVENTORY
          </button>
          <button data-action="open_item_details" data-target="#modal" class="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl transition text-sm">
            VIEW SPECS
          </button>
        </div>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span class="text-cyan-400">//</span>
          <span>Neural Artifacts</span>
        </h2>
        <div class="flex space-x-2">
          <button data-action="apply_filter" data-target="#product-grid" class="px-3 py-1.5 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition">ALL</button>
          <button data-action="apply_filter" data-target="#product-grid" class="px-3 py-1.5 text-xs font-mono bg-slate-900 text-slate-400 border border-slate-800 rounded-lg hover:text-slate-200 transition">IMPLANTS</button>
          <button data-action="apply_filter" data-target="#product-grid" class="px-3 py-1.5 text-xs font-mono bg-slate-900 text-slate-400 border border-slate-800 rounded-lg hover:text-slate-200 transition">MODULES</button>
        </div>
      </div>

      <div id="product-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div id="card-01" class="group bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between">
          <div class="space-y-4">
            <div class="w-full h-44 rounded-xl bg-gradient-to-tr from-cyan-950 to-slate-900 border border-cyan-500/20 flex items-center justify-center text-4xl">
              🔮
            </div>
            <div>
              <span class="text-xs font-mono text-cyan-400">SYNAPSE-v4</span>
              <h3 class="text-lg font-bold text-white group-hover:text-cyan-300 transition">Cortex Neural Link</h3>
              <p class="text-xs text-slate-400 mt-1">Direct wireless optic link with 120Hz retinal projection.</p>
            </div>
          </div>
          <div class="pt-6 flex items-center justify-between border-t border-slate-800/80 mt-4">
            <span class="text-xl font-black text-white font-mono">$490</span>
            <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              + ADD
            </button>
          </div>
        </div>

        <div id="card-02" class="group bg-slate-900/60 border border-slate-800 hover:border-fuchsia-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col justify-between">
          <div class="space-y-4">
            <div class="w-full h-44 rounded-xl bg-gradient-to-tr from-fuchsia-950 to-slate-900 border border-fuchsia-500/20 flex items-center justify-center text-4xl">
              ⚡
            </div>
            <div>
              <span class="text-xs font-mono text-fuchsia-400">CORE-TITAN</span>
              <h3 class="text-lg font-bold text-white group-hover:text-fuchsia-300 transition">Photonic Quantum Cell</h3>
              <p class="text-xs text-slate-400 mt-1">Continuous zero-point energy capacitor for portable deck rigs.</p>
            </div>
          </div>
          <div class="pt-6 flex items-center justify-between border-t border-slate-800/80 mt-4">
            <span class="text-xl font-black text-white font-mono">$820</span>
            <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-[0_0_15px_rgba(217,70,239,0.3)]">
              + ADD
            </button>
          </div>
        </div>

        <div id="card-03" class="group bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col justify-between">
          <div class="space-y-4">
            <div class="w-full h-44 rounded-xl bg-gradient-to-tr from-amber-950 to-slate-900 border border-amber-500/20 flex items-center justify-center text-4xl">
              🛡️
            </div>
            <div>
              <span class="text-xs font-mono text-amber-400">SHIELD-IX</span>
              <h3 class="text-lg font-bold text-white group-hover:text-amber-300 transition">ICE Firewall Lattice</h3>
              <p class="text-xs text-slate-400 mt-1">Dynamic counter-intrusion matrix preventing unauthorized telemetry.</p>
            </div>
          </div>
          <div class="pt-6 flex items-center justify-between border-t border-slate-800/80 mt-4">
            <span class="text-xl font-black text-white font-mono">$340</span>
            <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              + ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Interactive Slide-over Cart (Initially Hidden) -->
  <div id="cart-drawer" class="hidden fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
    <div class="w-screen max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-center pb-4 border-b border-slate-800">
          <h3 class="font-bold text-white text-lg">Neural Cart (1)</h3>
          <button data-action="dismiss_overlay" data-target="#cart-drawer" class="text-slate-400 hover:text-white">✕</button>
        </div>
        <div class="py-6">
          <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
            <div>
              <div class="text-sm font-bold text-cyan-400">Cortex Neural Link</div>
              <div class="text-xs text-slate-500">$490 × 1</div>
            </div>
            <span class="font-mono text-white">$490</span>
          </div>
        </div>
      </div>
      <button data-action="checkout" data-target="#app-root" class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-sm transition">
        INITIATE TRANSFER ($490)
      </button>
    </div>
  </div>

  <!-- Interactive Modal (Initially Hidden) -->
  <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
      <div class="flex justify-between items-center pb-3 border-b border-slate-800">
        <h3 class="text-lg font-bold text-white">System Specification</h3>
        <button data-action="dismiss_overlay" data-target="#modal" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <p class="text-sm text-slate-400 leading-relaxed">
        Engineered with sub-atomic tolerance, biocompatible titanium casing, and quantum entanglement sync.
      </p>
      <div class="flex justify-end space-x-3 pt-2">
        <button data-action="dismiss_overlay" data-target="#modal" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700">Dismiss</button>
      </div>
    </div>
  </div>
</div>`.trim();
  }

  // Default Organic / Zen Clean Store Template
  return `
<div class="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
  <!-- Top Navigation -->
  <header class="border-b border-stone-200/80 bg-stone-50/90 backdrop-blur sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-serif text-lg shadow-sm">
          🍃
        </div>
        <div>
          <span class="font-serif text-xl font-bold tracking-tight text-stone-900">Komorebi Botanical</span>
          <span class="block text-[10px] tracking-widest text-emerald-700 font-medium uppercase">Artisan Tea & Herbs</span>
        </div>
      </div>
      <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-600">
        <a href="#harvest" class="hover:text-emerald-800 transition">Harvest 2026</a>
        <a href="#ceremony" class="hover:text-emerald-800 transition">Matcha Ceremony</a>
        <a href="#teaware" class="hover:text-emerald-800 transition">Teaware</a>
        <a href="#philosophy" class="hover:text-emerald-800 transition">Philosophy</a>
      </nav>
      <div class="flex items-center space-x-3">
        <button id="cart-badge" data-action="toggle_cart" data-target="#cart-drawer" class="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-700 hover:border-emerald-600 hover:text-emerald-800 transition shadow-sm flex items-center space-x-2">
          <span>Basket</span>
          <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">1</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Banner -->
  <main class="max-w-6xl mx-auto px-6 py-14">
    <div class="rounded-3xl bg-stone-100/90 border border-stone-200/90 p-8 md:p-14 mb-16 flex flex-col md:flex-row items-center justify-between gap-10">
      <div class="max-w-xl space-y-5">
        <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-medium">
          <span>Single-Origin Uji Spring Pluck</span>
        </div>
        <h1 class="font-serif text-4xl md:text-5xl font-normal tracking-tight text-stone-900 leading-tight">
          Stillness poured into <span class="italic text-emerald-900">every single cup</span>.
        </h1>
        <p class="text-stone-600 text-base leading-relaxed">
          Cultivated on shaded mist-covered hills in Kyoto. Hand-ground on granite mills to preserve volatile umami notes.
        </p>
        <div class="flex flex-wrap gap-3 pt-2">
          <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-6 py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-medium rounded-full text-xs tracking-wide transition shadow-sm active:scale-95">
            Order Ceremonial Tin ($38)
          </button>
          <button data-action="open_item_details" data-target="#modal" class="px-5 py-3 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 font-medium rounded-full text-xs transition">
            Tasting Notes
          </button>
        </div>
      </div>
      <div class="w-full md:w-80 h-72 rounded-2xl bg-gradient-to-tr from-emerald-950 via-stone-800 to-emerald-900 p-8 flex flex-col justify-between text-white shadow-xl relative overflow-hidden">
        <div class="text-5xl">🍵</div>
        <div>
          <span class="text-xs uppercase tracking-widest text-emerald-300">Spring First Harvest</span>
          <h3 class="font-serif text-xl font-bold mt-1">Uji Hikari Reserve</h3>
          <p class="text-xs text-stone-300 mt-1">Deep velvety crema with lingering sweet spinach undertones.</p>
        </div>
      </div>
    </div>

    <!-- Collection Showcase -->
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-emerald-800">Curated Offerings</span>
          <h2 class="font-serif text-2xl md:text-3xl font-medium text-stone-900 mt-1">Seasonal Harvest & Teaware</h2>
        </div>
        <div class="flex space-x-2">
          <button data-action="apply_filter" data-target="#product-grid" class="px-4 py-1.5 rounded-full text-xs font-medium bg-emerald-900 text-white">All Teas</button>
          <button data-action="apply_filter" data-target="#product-grid" class="px-4 py-1.5 rounded-full text-xs font-medium bg-stone-200/70 text-stone-700 hover:bg-stone-300/70 transition">Matcha</button>
          <button data-action="apply_filter" data-target="#product-grid" class="px-4 py-1.5 rounded-full text-xs font-medium bg-stone-200/70 text-stone-700 hover:bg-stone-300/70 transition">Ceramic Ware</button>
        </div>
      </div>

      <div id="product-grid" class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Card 1 -->
        <div id="item-01" class="bg-white rounded-2xl border border-stone-200/80 p-6 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-4">
            <div class="h-48 rounded-xl bg-stone-100 flex items-center justify-center text-4xl">
              🌿
            </div>
            <div>
              <span class="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Ceremonial Grade</span>
              <h3 class="font-serif text-lg font-bold text-stone-900 mt-0.5">Kyoto Asahi Matcha</h3>
              <p class="text-xs text-stone-500 mt-1 leading-relaxed">Stone-milled tencha with bright vibrant emerald color and buttery mouthfeel.</p>
            </div>
          </div>
          <div class="pt-6 flex items-center justify-between border-t border-stone-100 mt-6">
            <div>
              <span class="text-xs text-stone-400 block">30g Tin</span>
              <span class="font-serif text-lg font-bold text-stone-900">$38</span>
            </div>
            <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-stone-900 hover:bg-emerald-900 text-white text-xs font-medium rounded-full transition shadow-sm">
              + Add to Basket
            </button>
          </div>
        </div>

        <!-- Card 2 -->
        <div id="item-02" class="bg-white rounded-2xl border border-stone-200/80 p-6 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-4">
            <div class="h-48 rounded-xl bg-stone-100 flex items-center justify-center text-4xl">
              🍂
            </div>
            <div>
              <span class="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Wood-Fired Roast</span>
              <h3 class="font-serif text-lg font-bold text-stone-900 mt-0.5">Kyobancha Roasted Leaves</h3>
              <p class="text-xs text-stone-500 mt-1 leading-relaxed">Smoky, comforting aroma with exceptionally low caffeine for evening contemplation.</p>
            </div>
          </div>
          <div class="pt-6 flex items-center justify-between border-t border-stone-100 mt-6">
            <div>
              <span class="text-xs text-stone-400 block">100g Bag</span>
              <span class="font-serif text-lg font-bold text-stone-900">$22</span>
            </div>
            <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-stone-900 hover:bg-emerald-900 text-white text-xs font-medium rounded-full transition shadow-sm">
              + Add to Basket
            </button>
          </div>
        </div>

        <!-- Card 3 -->
        <div id="item-03" class="bg-white rounded-2xl border border-stone-200/80 p-6 flex flex-col justify-between hover:shadow-md transition">
          <div class="space-y-4">
            <div class="h-48 rounded-xl bg-stone-100 flex items-center justify-center text-4xl">
              🏺
            </div>
            <div>
              <span class="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Handmade Shigaraki</span>
              <h3 class="font-serif text-lg font-bold text-stone-900 mt-0.5">Kohiki Whisking Chawan</h3>
              <p class="text-xs text-stone-500 mt-1 leading-relaxed">Textured clay bowl with white slip glaze crafted by 4th generation Kyoto potter.</p>
            </div>
          </div>
          <div class="pt-6 flex items-center justify-between border-t border-stone-100 mt-6">
            <div>
              <span class="text-xs text-stone-400 block">Unique Piece</span>
              <span class="font-serif text-lg font-bold text-stone-900">$75</span>
            </div>
            <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-stone-900 hover:bg-emerald-900 text-white text-xs font-medium rounded-full transition shadow-sm">
              + Add to Basket
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Interactive Slide-over Cart (Initially Hidden) -->
  <div id="cart-drawer" class="hidden fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
    <div class="w-screen max-w-md bg-white border-l border-stone-200 p-6 flex flex-col justify-between shadow-2xl">
      <div>
        <div class="flex justify-between items-center pb-4 border-b border-stone-200">
          <div class="flex items-center space-x-2">
            <span class="text-lg">🛒</span>
            <h3 class="font-serif font-bold text-stone-900 text-lg">Your Tea Basket (1)</h3>
          </div>
          <button data-action="dismiss_overlay" data-target="#cart-drawer" class="text-stone-400 hover:text-stone-700 p-1">✕</button>
        </div>
        <div class="py-6 space-y-3">
          <div class="p-4 bg-stone-50 border border-stone-200/80 rounded-xl flex justify-between items-center">
            <div>
              <div class="text-sm font-medium text-stone-900">Kyoto Asahi Matcha</div>
              <div class="text-xs text-emerald-800 font-semibold">$38 × 1</div>
            </div>
            <span class="font-serif text-stone-900 font-bold">$38</span>
          </div>
        </div>
      </div>
      <div class="pt-4 border-t border-stone-200 space-y-3">
        <div class="flex justify-between text-sm font-medium text-stone-600">
          <span>Subtotal</span>
          <span class="font-serif text-lg font-bold text-stone-900">$38</span>
        </div>
        <button data-action="checkout" data-target="#app-root" class="w-full py-3 bg-emerald-900 hover:bg-emerald-800 text-white font-medium rounded-full text-xs tracking-wide transition shadow-sm">
          Proceed to Checkout
        </button>
      </div>
    </div>
  </div>

  <!-- Interactive Modal (Initially Hidden) -->
  <div id="modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
      <div class="flex justify-between items-center pb-3 border-b border-stone-100">
        <h3 class="font-serif text-lg font-bold text-stone-900">Tasting & Terroir Notes</h3>
        <button data-action="dismiss_overlay" data-target="#modal" class="text-stone-400 hover:text-stone-700">✕</button>
      </div>
      <p class="text-sm text-stone-600 leading-relaxed">
        Grown at 450m elevation in volcanic soils. Shaded with reed screens for 24 days prior to harvest to maximize L-theanine amino acids.
      </p>
      <div class="flex justify-end space-x-2 pt-2">
        <button data-action="dismiss_overlay" data-target="#modal" class="px-4 py-2 border border-stone-200 text-stone-700 rounded-full text-xs font-medium hover:bg-stone-50">Dismiss</button>
        <button data-action="add_item_to_cart" data-target="#cart-drawer" class="px-4 py-2 bg-emerald-900 text-white rounded-full text-xs font-medium hover:bg-emerald-800">Add to Basket</button>
      </div>
    </div>
  </div>
</div>`.trim();
}
