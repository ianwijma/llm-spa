# OpenRouter SDK (`@openrouter/sdk`) Integration Specification

**Package:** `@openrouter/sdk`  
**Runtime:** 100% Client-Side Browser (Vite / TypeScript)  
**Role:** System Two Generative Engine (Multi-model HTML/CSS synthesis, streaming SSE, and component fragment regeneration)

---

## 1. Overview & Rationale

Rather than manually managing raw `fetch` calls, authorization headers, and low-level Server-Sent Events (SSE) parsing, the application uses the official **`@openrouter/sdk`**.

### Key Benefits for this Architecture:
1. **First-Class TypeScript Support:** Strong typings for chat messages, models, provider routing options, and delta chunks.
2. **Native Streaming Async Iterables:** Built-in `for await (const chunk of result)` streaming interface that simplifies token buffering.
3. **Browser Compatibility:** Operates cleanly in modern browser runtimes without requiring Node.js polyfills.
4. **Provider Routing Controls:** Granular routing policies such as sorting by price, latency, or zero-data-retention (`zdr: true`).
5. **Tree-Shaking Options:** Supports modular imports via `@openrouter/sdk/core.js` and dedicated function modules to keep the host bundle lightweight.

---

## 2. Installation & Setup

Install the SDK along with TypeSafe's client SDK:

```bash
npm install @openrouter/sdk @typesafe-ai/sdk
```

---

## 3. Client Initialization (BYOK Pattern)

Because users provide their own OpenRouter API key stored in browser `localStorage`, the client is instantiated dynamically with user-provided credentials:

```typescript
// src/services/openrouter.ts
import { OpenRouter } from "@openrouter/sdk";
import { getStoredOpenRouterKey } from "../state/storage";

export function createOpenRouterClient(): OpenRouter {
  const apiKey = getStoredOpenRouterKey();
  if (!apiKey) {
    throw new Error("Missing OpenRouter API Key. Please configure your key in Settings.");
  }

  return new OpenRouter({
    apiKey: apiKey,
    httpReferer: window.location.origin,
    appTitle: "Prompt2Web AI-Native Runtime",
  });
}
```

---

## 4. Full-Page Streaming Generation (`chat.send`)

When generating the initial homepage (Flow 1) or performing a full-page transition (Flow 2, Path 3), the host initiates a streaming generation session.

### 4.1 System Prompt & Instructions
The system prompt strictly constrains OpenRouter to output pure HTML5 decorated with Tailwind CSS classes, without conversational markdown:

```typescript
export const SYSTEM_PROMPT_HTML_GENERATION = `
You are an expert UI engineer that generates production-grade, aesthetically stunning web pages.
Rules:
1. Return ONLY valid, semantic HTML markup for the page content inside <body>.
2. DO NOT output markdown code fences (\`\`\`html or \`\`\`). Output raw HTML directly.
3. Style ALL elements exclusively using Tailwind CSS utility classes. Take advantage of full Tailwind capabilities:
   - Modern palettes (slate, zinc, emerald, violet, amber, etc.)
   - Flexbox and CSS Grid layouts
   - Hover and focus states (e.g., hover:bg-slate-100, transition, duration-200)
   - Rounded corners, soft shadows, backdrop blur
4. DO NOT write any <script> tags. All interactivity is handled by the platform.
5. Add semantic data attributes on interactive elements:
   - data-action: concise action identifier (e.g., "add_to_cart", "filter_category", "open_modal")
   - data-target: CSS selector of the component to update or toggle (e.g., "#cart-drawer", "#item-modal")
   - data-state: initial state if relevant (e.g., "closed", "active")
6. Ensure responsive layout (mobile-first with md: and lg: breakpoints).
`;
```

### 4.2 Streaming Implementation with Async Iterables
```typescript
import { createOpenRouterClient, SYSTEM_PROMPT_HTML_GENERATION } from "./openrouter";

export interface GenerationOptions {
  model: string;            // e.g., "anthropic/claude-3.5-sonnet", "openai/gpt-4o"
  userPrompt: string;
  jevGuidance?: {
    archetype: string;
    theme: string;
    complexity: string;
  };
  onToken: (token: string) => void;
  onComplete: (fullHtml: string) => void;
  onError: (err: Error) => void;
}

export async function streamPageGeneration(options: GenerationOptions): Promise<void> {
  const client = createOpenRouterClient();

  const userContent = options.jevGuidance
    ? `Site Goal: ${options.userPrompt}\nArchetype: ${options.jevGuidance.archetype}\nVisual Theme: ${options.jevGuidance.theme}`
    : options.userPrompt;

  try {
    const stream = await client.chat.send({
      model: options.model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_HTML_GENERATION },
        { role: "user", content: userContent },
      ],
      // Optional provider routing controls
      provider: {
        sort: "price",
      },
    });

    let accumulatedHtml = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        accumulatedHtml += delta;
        options.onToken(delta);
      }
    }

    options.onComplete(accumulatedHtml);
  } catch (error: any) {
    options.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
```

---

## 5. Targeted Component Fragment Regeneration (Partial DOM Patch)

When TypeSafe Jev determines that an interaction requires a `partial_dom_patch` (e.g., updating a cart drawer, filtering a list, or updating a counter), the host does **not** regenerate the full page. Instead, it calls `@openrouter/sdk` with a concise, targeted request:

```typescript
export interface FragmentPatchOptions {
  model: string;
  targetSelector: string;
  actionIntent: string;
  existingElementHtml: string;
  sessionContext: Record<string, any>;
}

export async function generateComponentPatch(options: FragmentPatchOptions): Promise<string> {
  const client = createOpenRouterClient();

  const prompt = `
Target Element: ${options.targetSelector}
Action Required: ${options.actionIntent}
Current Element HTML:
${options.existingElementHtml}

Context Data:
${JSON.stringify(options.sessionContext, null, 2)}

Instructions:
Generate ONLY the replacement HTML for ${options.targetSelector}.
Use Tailwind CSS classes. Return raw HTML only, no markdown wrappers.
`;

  const response = await client.chat.send({
    model: options.model,
    stream: false,
    messages: [
      {
        role: "system",
        content: "You are a precise frontend component compiler. Output only the updated HTML element.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices?.[0]?.message?.content || "";
  // Strip any incidental markdown fences
  return content.replace(/^```html\s*/i, "").replace(/```$/, "").trim();
}
```

---

## 6. Popular Model Configurations

The host UI provides quick selection across top OpenRouter models:

| Model ID | Provider | Ideal For |
| :--- | :--- | :--- |
| `anthropic/claude-3.5-sonnet` | Anthropic | Highest aesthetic design fidelity and flawless Tailwind class usage. |
| `google/gemini-2.0-flash-001` | Google | Ultra-low latency streaming generation at very low cost. |
| `openai/gpt-4o` | OpenAI | Complex interactive logic, rich layout structures, and structured forms. |
| `meta-llama/llama-3.3-70b-instruct` | Meta (Open Weights) | High capability open model, budget-friendly. |
| `deepseek/deepseek-chat` | DeepSeek | Highly economical high-performance alternative. |

---

## 7. Bundle Optimization (Tree-Shaking with OpenRouterCore)

For production deployments where minimal host bundle size is critical, the host can optionally import `OpenRouterCore` and standalone functions:

```typescript
import { OpenRouterCore } from "@openrouter/sdk/core.js";
import { chatSend } from "@openrouter/sdk/funcs/chatSend.js";

const coreClient = new OpenRouterCore({
  apiKey: apiKey,
  httpReferer: window.location.origin,
  appTitle: "Prompt2Web",
});

// Sends chat request with optimal tree-shaking
const response = await chatSend(coreClient, {
  chatRequest: {
    model: "anthropic/claude-3.5-sonnet",
    messages: [{ role: "user", content: "..." }],
  },
});
```
This isolates only the chat completion pathways and avoids bundling unused agent or tool-calling modules.
