# Interaction & Lifecycle Flow Specification

**Document Version:** 1.0.0  
**Scope:** Complete End-to-End User Journeys and System Event Sequences

---

## 1. Flow 1: Landing to First Generated Homepage

### 1.1 Overview
When the user arrives at the application, they are greeted by an uncluttered, ultra-minimalist, "Google-style" landing screen. The screen centers around a prominent search/prompt input bar, a model selector, and an API configuration trigger.

### 1.2 Step-by-Step Sequence

```
[ User ]                  [ Host Shell ]                [ TypeSafe Jev ]           [ OpenRouter LLM ]         [ Sandboxed Iframe ]
   |                             |                             |                           |                           |
   |-- 1. Open Web App --------->|                             |                           |                           |
   |   (Minimal Google-style)    |-- Check API Keys stored?    |                           |                           |
   |                             |   (If missing, show modal)  |                           |                           |
   |                             |                             |                           |                           |
   |-- 2. Enter Prompt & Submit->|                             |                           |                           |
   |      "Artisan Bakery Site"  |                             |                           |                           |
   |                             |-- 3. Speculative Fan-out -->|                           |                           |
   |                             |   POST /v1/systemone        |                           |                           |
   |                             |   (archetype, layout, mood) |                           |                           |
   |                             |<-- 4. Fast Structured Resp -|                           |                           |
   |                             |   (JSON: archetype, schema) |                           |                           |
   |                             |                             |                           |                           |
   |                             |-- 5. Build Synthesized Prompt                           |                           |
   |                             |   (System Prompt + Rubric)  |                           |                           |
   |                             |                             |                           |                           |
   |                             |-- 6. Stream via @openrouter/sdk ----------------------->|                           |
   |                             |   openRouter.chat.send({stream: true})                  |                           |
   |                             |                                                         |                           |
   |<-- 7. Show Streaming UI ----|                                                         |                           |
   |    (Live tokens / skeleton) |<-- 8. Stream HTML Chunks --------------------------------|                           |
   |                             |-- 9. PostMessage / Stream Token Buffer -------------------------------------------->|
   |                             |                                                                                     |-- 10. JIT Tailwind Parse
   |                             |                                                                                     |   Inject CSS & Mount DOM
   |<-- 11. Interactive Page View======================================================================================|
```

#### Detailed Phase Breakdown

1. **Zero-State Landing Page:**
   - Visual presentation: Clean white or dark background, centered branding ("Prompt2Web"), and a search input with an auto-expanding textarea.
   - Secondary controls:
     - **LLM Selector dropdown:** Pre-populated with popular OpenRouter models (`anthropic/claude-3.5-sonnet`, `openai/gpt-4o`, `google/gemini-2.0-flash-001`, `meta-llama/llama-3.3-70b-instruct`, `deepseek/deepseek-chat`).
     - **Key Config indicator:** Green badge if TypeSafe + OpenRouter keys are present in `localStorage`; yellow badge opening a key configuration drawer if keys are missing.
   - Example prompt chips (e.g., *"Artisanal Sourdough Bakery"*, *"SaaS Analytics Dashboard"*, *"Cyberpunk Neon Arcade Leaderboard"*, *"Minimalist Portfolio"*).

2. **Submission & System One Pre-Flight Analysis (TypeSafe Jev):**
   - The user presses Enter or clicks "Generate Site".
   - The host issues a high-speed speculative call to `https://api.typesafe.ai/v1/systemone` using model `jev-latest`.
   - **Why Jev here?** Jev performs instant categorization (<150ms) to extract design archetypes, color palettes, component structures, and content requirements before invoking the heavier generative model.
   - State passed to Jev: `{ user_prompt: prompt }`
   - Questions asked in parallel:
     - `archetype`: Choice (`"ecommerce"`, `"portfolio"`, `"saas_landing"`, `"restaurant_menu"`, `"dashboard"`, `"editorial"`, `"utility_app"`)
     - `theme_style`: Choice (`"minimal_monochrome"`, `"warm_editorial"`, `"dark_cyberpunk"`, `"playful_vibrant"`, `"corporate_clean"`)
     - `interactivity_density`: Score (Scale: `"Static Showcase"`, `"Light (tabs/filters)"`, `"Rich (calculator/forms/cart)"`)
     - `is_safe`: Noul ("Is this prompt safe and constructive to generate?")

3. **Generative Synthesis & Streaming (OpenRouter):**
   - If `is_safe.noul < 0.2`, reject prompt with an informative message.
   - The host combines the user's natural language prompt with Jev's structured decisions into an optimized OpenRouter system prompt.
   - The prompt explicitly specifies:
     - Pure HTML5 body output.
     - 100% Tailwind CSS classes for every element (colors, spacing, typography, grid/flexbox, transitions).
     - Semantic data attributes on all interactive elements: `data-action="..."`, `data-target="..."`, `data-state="..."`.
     - Zero embedded `<script>` tags written by the model (all behavior is handled by the platform runtime).
   - The host initiates an SSE streaming fetch (`stream: true`) to OpenRouter.

4. **Live Progressive Mounting in Sandboxed Iframe:**
   - As tokens arrive from OpenRouter, the host buffers the HTML.
   - The host initializes the sandboxed `iframe` with a baseline template:
     ```html
     <!DOCTYPE html>
     <html lang="en">
     <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <script src="https://cdn.tailwindcss.com"></script>
       <script>
         tailwind.config = { darkMode: 'class', theme: { extend: {} } }
       </script>
       <!-- Injected Micro-Proxy Script (Details in Spec 4) -->
     </head>
     <body class="min-h-screen bg-slate-50 text-slate-900 antialiased">
       <div id="app-root"><!-- Generated HTML streams here --></div>
     </body>
     </html>
     ```
   - Progressive rendering: As complete HTML tags are streamed, the DOM updates in real-time. Tailwind JIT continuously watches `#app-root` and renders styles dynamically.

---

## 2. Flow 2: Web Interaction & Reactive Execution Loop

### 2.1 The Core Problem
When a user clicks a button like *"Add to Cart"*, submits a contact form, switches a pricing tab, or clicks a navigation link on an AI-generated page with **no pre-existing custom JavaScript**, how does the page respond?

### 2.2 The Solution: The Jev-Centric Two-Tier Reactive Loop

```
+---------------------------------------------------------------------------------------------------+
| 1. User interacts with generated element inside sandboxed <iframe> (e.g., Click "Add to Cart")    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. Injected Micro-Proxy intercepts event (Event Delegation Bus)                                    |
|    - Captures: event type ('click'), element tag ('button'), text ('Add to Cart'),               |
|      data-action ('add_item_3'), form fields, and surrounding component HTML snippet             |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v  (via window.parent.postMessage)
+---------------------------------------------------------------------------------------------------+
| 3. Host Shell receives UI_EVENT payload                                                           |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 4. TypeSafe Jev (Reflex Decision Engine) Evaluates Interaction (~100ms)                          |
|    Questions asked in parallel:                                                                   |
|    - route_type: Choice [local_toggle, partial_regen, full_regen, form_feedback, no_op]           |
|    - target_selector: Choice [modal_container, cart_drawer, list_view, active_tab, whole_page]    |
|    - confidence: How certain is the decision?                                                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                     +----------------------------+----------------------------+
                     |                                                         |
                     v (route_type = 'local_toggle')                           v (route_type = 'partial_regen'
+-------------------------------------------------------+                        or 'full_regen')
| 5A. Declarative Micro-Patch (Host Native Runtime)     |  +----------------------------------------------------+
| - Toggles Tailwind classes (e.g., 'hidden' <-> 'flex')|  | 5B. Targeted OpenRouter Invocation                 |
| - Updates badge counts / tab active states            |  | - Focused prompt: "Update component X for action Y"|
| - Completed in < 10ms with ZERO LLM API cost          |  | - Returns concise HTML fragment replacement        |
+-------------------------------------------------------+  +----------------------------------------------------+
                     |                                                         |
                     +----------------------------+----------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 6. Host sends DOM_PATCH / RENDER_UPDATE to Iframe via postMessage                                 |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 7. Iframe Micro-Proxy swaps targeted DOM element with CSS crossfade; Tailwind JIT re-evaluates.   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Interaction Routing Classifications (Jev Decision Rubric)

TypeSafe Jev evaluates every intercepted event using the following four discrete operational pathways:

| Pathway | Trigger Examples | Jev Decision | Processing Model | Latency |
| :--- | :--- | :--- | :--- | :--- |
| **Path 1: Declarative Micro-Toggle** | Accordion collapse/expand, mobile menu open/close, light/dark theme switch, modal backdrop click | `route_type: "local_toggle"` | Handled entirely by the injected micro-proxy in the iframe without making an external LLM call. Reads `data-target` and toggles Tailwind `hidden` class. | **< 16ms** (instant) |
| **Path 2: Targeted Partial DOM Patch** | "Add to Cart" button (increments count, opens cart drawer), "Filter by Category", "Sort by Price" | `route_type: "partial_regen"` | Jev extracts target selector and semantic mutation. Host calls OpenRouter with a short prompt asking ONLY for the updated HTML snippet of the target component (e.g., `<div id="cart">...</div>`), which is surgically swapped into the DOM. | **400ms – 1s** |
| **Path 3: Full-Page Transition / Navigation** | User clicks main navigation link ("About Us", "Pricing", "Checkout"), or triggers a fundamental page redesign | `route_type: "full_regen"` | Jev identifies new page intent. Host updates application URL hash (e.g. `#/checkout`) and triggers a full-page generation via OpenRouter while preserving global session state. | **1.5s – 3s** |
| **Path 4: Form Submission & State Validation** | User fills an order form, contact form, or newsletter signup | `route_type: "form_feedback"` | Jev validates the form fields (`is_valid.noul`). If valid, OpenRouter generates a success confirmation banner or order receipt card. If invalid, returns localized error states. | **500ms – 1.2s** |

---

## 4. State Management Across Interactions

Even though the generated page contains no bespoke framework state, the **Host Shell** maintains a structured **Session State Store**:

```typescript
interface SessionState {
  originalPrompt: string;           // e.g., "A retro neon sushi bar menu"
  currentRoute: string;            // e.g., "#/", "#/menu", "#/cart"
  designTokens: {
    archetype: string;             // e.g., "restaurant_menu"
    theme: string;                 // e.g., "dark_cyberpunk"
    primaryColor: string;          // e.g., "emerald"
  };
  persistedData: {
    cartItems?: Array<{ id: string; name: string; price: number; qty: number }>;
    formSubmissions?: Record<string, any>;
    activeFilters?: Record<string, string>;
  };
  domHistory: Array<{
    timestamp: number;
    actionDescription: string;
    domSnapshot: string;
  }>;
}
```

Whenever OpenRouter generates or updates a component, the host passes `persistedData` in the system prompt so the LLM renders persistent state accurately (e.g., maintaining the 3 items already in the shopping cart when rendering the checkout page).

---

## 5. Error Handling & Edge Cases

1. **Missing or Invalid API Keys:**
   - On initial load or 401 HTTP response from either TypeSafe or OpenRouter:
   - A non-intrusive dialog pauses execution, displays the specific failing provider, and allows the user to re-input or test their API key with a ping request.
2. **OpenRouter Rate Limits (429) or Overloads (529):**
   - The host implements an automatic exponential backoff retry loop (1s, 2s, 4s).
   - If retries fail, a user toast displays the exact error message from the provider with a "Retry" button.
3. **Mismatched or Broken HTML Generation:**
   - In rare cases where the LLM produces malformed or unclosed HTML tags, the host passes the fragment through the browser's native `DOMParser().parseFromString()` prior to injecting it into the iframe, ensuring browser-safe syntax tree reconstruction.
4. **Undo / Redo Capability:**
   - Because the host records a `domHistory` array on every action, the user has instant access to an **Undo / Redo** button in the host top bar, allowing them to roll back any AI hallucination or unwanted page mutation instantaneously.
