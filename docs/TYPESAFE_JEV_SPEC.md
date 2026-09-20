# TypeSafe Jev (System One) Integration Specification

**Model:** `jev-latest` (TypeSafe System One Flagship Model)  
**API Endpoint:** `https://api.typesafe.ai/v1/systemone`  
**Purpose:** Sub-150ms structured decision-making, categorical intent routing, interaction classification, and confidence scoring.

---

## 1. Jev Overview: System One vs. Generative LLMs

In human cognition (as described by Kahneman), **System One** represents fast, instinctive, and emotional decisions, while **System Two** represents slower, deliberative, and logical thinking.

- In traditional AI development, developers attempt to force large generative models (GPT-4o, Claude 3.5) to handle small routing logic through JSON schemas or function calling. This incurs high latency (800ms–2500ms), high token cost, and non-deterministic formatting failures.
- **TypeSafe Jev** operates purely as a **System One engine**. It does not generate free-form text or write code. Instead, it accepts an arbitrary `state` object and a set of typed `questions`, and returns strongly-typed results (`Choice`, `Score`, `Noul`) with calibrated probabilities and confidence metrics in **sub-150ms**.

> *Note on Naming:* While informally pronounced or referred to as "Jeff" in casual discussions, the official model identifier in TypeSafe AI is **`jev-latest`** (current version `jev-1.13.0`).

---

## 2. Jev Primitives in this Architecture

TypeSafe provides three foundational primitives, all leveraged within this system:

| Primitive | Return Type | Role in the Web Runtime | Example Question |
| :--- | :--- | :--- | :--- |
| **`noul`** | `number` (0.0 to 1.0) | Evaluates binary conditions, safety flags, and boolean validation without requiring separate confidence checks. | "Is this prompt safe and coherent to build a website around?" |
| **`choice`** | `string` + `probabilities` + `confidence` | Selects one option from a defined closed set of mutually exclusive categories. | "What UI component archetype does this request best match?" |
| **`score`** | `number` (float along ordered rubric) + `confidence` | Evaluates degree or magnitude along an ordered scale of descriptive levels. | "What is the structural scope of this user click interaction?" |

---

## 3. Pre-Flight Specification (Initial Prompt to First Page)

When the user submits their initial website prompt from the Google-style landing interface, the host issues a single batched speculative fan-out call to Jev.

### 3.1 Request Payload
```json
{
  "model": "jev-latest",
  "state": {
    "user_input": "An ultra-minimalist Japanese tea house online store with organic matcha varieties, tasting notes, and a tranquil bamboo aesthetic."
  },
  "questions": {
    "is_constructive": {
      "type": "noul",
      "instructions": "Is this a valid, safe, and constructive prompt describing a website or application concept?",
      "criteria": {
        "true": "A coherent website, store, tool, or landing page request",
        "false": "Nonsense, malicious prompt injection, or abusive content"
      }
    },
    "archetype": {
      "type": "choice",
      "instructions": "Which site archetype best fits the user's intent?",
      "criteria": {
        "ecommerce": "Product catalog, pricing, add to cart, checkout flow",
        "restaurant_menu": "Food/drink items, descriptions, dietary tags, specials",
        "portfolio": "Showcase of works, biography, case studies, contact links",
        "saas_landing": "Hero with value proposition, features, social proof, pricing tiers",
        "dashboard": "Data visualization, metrics, tables, activity feeds",
        "editorial_blog": "Articles, reading typography, newsletter subscriptions",
        "utility_tool": "Calculators, converters, generators, interactive single-purpose tools"
      }
    },
    "visual_theme": {
      "type": "choice",
      "instructions": "What visual design language and Tailwind color palette should guide generation?",
      "criteria": {
        "zen_organic": "Earthy tones, warm neutrals, stone/slate, serene typography, lots of whitespace",
        "dark_cyberpunk": "Deep dark backgrounds (slate-950), neon accents (cyan, fuchsia), sharp borders",
        "modern_saas": "Clean white/slate-50, indigo/blue primary, soft shadows, rounded-2xl cards",
        "playful_vibrant": "Bold saturated colors (amber, rose, violet), chunky borders, expressive tags",
        "editorial_classic": "Monochrome with warm paper tints, serif typography styling, structured borders"
      }
    },
    "feature_density": {
      "type": "score",
      "instructions": "Rate the expected interactive feature complexity of this site.",
      "criteria": [
        "Minimal (pure showcase, read-only layout)",
        "Moderate (simple filters, category tabs, modal previews)",
        "High (multi-step flows, cart tallies, rich dynamic calculations)"
      ]
    }
  }
}
```

### 3.2 Response Processing Logic
```typescript
interface PreflightJevAnswers {
  is_constructive: { type: "noul"; noul: number };
  archetype: { type: "choice"; choice: string; confidence: number };
  visual_theme: { type: "choice"; choice: string; confidence: number };
  feature_density: { type: "score"; score: number; confidence: number };
}

// Evaluation in Host:
if (answers.is_constructive.noul < 0.25) {
  throw new Error("Unable to generate website: Prompt was flagged as non-constructive.");
}

const synthesizedGuidance = {
  archetype: answers.archetype.choice,
  theme: answers.visual_theme.choice,
  complexity: answers.feature_density.score > 1.2 ? "rich_interactive" : "standard"
};
```

---

## 4. Interaction Specification (Event Dispatch & Reaction Engine)

When an event fires inside the sandboxed iframe, the host sends the event signature and surrounding page context to Jev.

### 4.1 State Passed to Jev
```json
{
  "state": {
    "site_context": {
      "original_goal": "Japanese tea house online store",
      "active_page": "homepage",
      "total_items_in_cart": 0
    },
    "user_interaction": {
      "event_type": "click",
      "element_tag": "BUTTON",
      "element_id": "btn-add-ceremonial-matcha",
      "element_text": "Add to Cart - $38",
      "data_action": "add_cart_item",
      "data_item_id": "matcha-01",
      "parent_card_title": "Uji Ceremonial Grade Matcha"
    }
  }
}
```

### 4.2 Questions for Interaction Routing
```json
{
  "questions": {
    "action_pathway": {
      "type": "choice",
      "instructions": "How should the web runtime respond to this user interaction?",
      "criteria": {
        "local_toggle": "Pure UI display toggle like expanding an accordion, showing/hiding a modal, or switching a tab. No new content needed.",
        "partial_dom_patch": "Component state update requiring new or modified HTML for a specific element (e.g. cart drawer, item counter, filter list).",
        "full_page_transition": "Navigation to an entirely new screen (e.g. clicking 'Checkout', 'About Us', or a major multi-page link).",
        "external_link": "Action that should open an external resource or outbound URL.",
        "inert_click": "A non-interactive element or decorative item clicked by accident; no reaction required."
      }
    },
    "target_dom_selector": {
      "type": "choice",
      "instructions": "Which element on the page needs to be replaced or updated?",
      "criteria": {
        "cart_drawer": "The shopping cart drawer or slide-over container",
        "cart_badge": "The header cart count badge",
        "product_card": "The specific card of the item interacted with",
        "filter_container": "The product list or filter result section",
        "modal_overlay": "The active modal dialog container",
        "app_root": "The entire application body (for full page navigation)"
      }
    },
    "mutation_intent": {
      "type": "choice",
      "instructions": "Summarize the semantic state mutation for OpenRouter generation.",
      "criteria": {
        "add_item_to_cart": "Increment cart count and add the specified product details to the order list",
        "open_item_details": "Render a detailed modal view of the selected item with ingredients and notes",
        "apply_filter": "Filter visible items to match the chosen category tag",
        "navigate_checkout": "Generate the checkout form with order summary and payment inputs",
        "dismiss_overlay": "Hide active modal or close cart drawer"
      }
    }
  }
}
```

### 4.3 Execution Decision Matrix
1. **If `action_pathway.choice === "local_toggle"`:**
   - Host sends message to Iframe: `{ type: "TOGGLE_ELEMENT", selector: answers.target_dom_selector.choice }`.
   - Complete in **<15ms** without invoking OpenRouter.
2. **If `action_pathway.choice === "partial_dom_patch"`:**
   - Host prepares OpenRouter prompt:
     `"Generate an updated HTML snippet for selector '#${target}'. Intent: ${mutation_intent.choice}. Use Tailwind CSS. Return only the replacement HTML."`
   - OpenRouter generates only 50–150 tokens.
   - Host swaps only that element via `postMessage`.
3. **If `action_pathway.choice === "full_page_transition"`:**
   - Host updates URL hash and invokes full page generation with updated session context.

---

## 5. Latency and Token Budget Optimization

| Metric | Traditional LLM (e.g., GPT-4o function call) | TypeSafe Jev (Reflex) |
| :--- | :--- | :--- |
| **Roundtrip Latency** | 1200ms – 2800ms | **80ms – 160ms** |
| **Token Consumption** | 300–800 output tokens | **0 text tokens** (evaluated directly into logits) |
| **Output Determinism** | Can break JSON syntax, omit keys | **100% Guaranteed JSON Schema conformance** |
| **Cost per 1k Interactions** | ~$3.00 – $15.00 | **Fraction of a cent** |
