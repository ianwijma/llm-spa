# System Architecture Document: Fully LLM-Powered Zero-Backend Web Runtime

**Project Name:** AI-Native Dynamic Web Runtime (Codename: *HyperSite / Prompt2Web*)  
**Core Technologies:** TypeSafe Jev (System One), OpenRouter (System Two LLMs), Tailwind CSS (Client-side JIT/Play CDN), Sandboxed Browser Iframe  
**Deployment Model:** 100% Client-Side Static Single-Page Application (Zero Server Backend, $0 Cloud Hosting Costs)  
**Security Model:** Bring Your Own Key (BYOK) with Sandboxed PostMessage Isolation  

---

## 1. Executive Summary & Vision

Traditional web applications ship megabytes of pre-compiled JavaScript, static templates, client-side routing logic, and complex state management frameworks. 

This project explores a radical paradigm shift: **The Zero-Code / AI-Native Web Runtime**.
In this paradigm:
1. **The Application Code is Ephemeral and AI-Generated:** The user begins with an austere, Google-style minimalist search interface where they describe the website they desire in natural language.
2. **Dual-AI Engine Architecture:**
   - **TypeSafe Jev (colloquially referred to as "Jeff"):** Acts as the **System One** reflex engine. Jev does not generate streaming text or long code; instead, it evaluates state against typed questions and returns structured decisions (Choice, Score, Noul) within milliseconds. It dictates intent routing, action classification, change scoping, and UI state mutations.
   - **OpenRouter (Any Foundation LLM):** Acts as the **System Two** generative engine (Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash, Llama 3.3, DeepSeek, etc.). It generates semantic HTML markup decorated exclusively with Tailwind CSS utility classes.
3. **Zero / Minimal Host JavaScript:** The host container ships only the bare minimum orchestration harness (~10–15 KB of vanilla JS/TS). The generated site contains zero application JavaScript; all visual styling is handled dynamically via Tailwind CSS, and all interactions are proxied through an event delegation bus back to Jev.
4. **100% Client-Side BYOK (Bring-Your-Own-Key):** The application runs entirely inside the user's browser (e.g., GitHub Pages, Cloudflare Pages). Users provide their own TypeSafe and OpenRouter API keys. The host operator incurs $0 in compute or AI inference costs.

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------------------------------+
|                                         USER'S BROWSER (HOST WINDOW)                                     |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  | HOST SHELL / ORCHESTRATOR (~15 KB Vanilla JS / TypeScript)                                        |  |
|  | - BYOK Key Vault (localStorage / Memory Session, never exposed to generated content)             |  |
|  | - OpenRouter Model Picker & Profile State Machine                                                 |  |
|  | - Minimalist Google-Style Search Interface (Initial State)                                        |  |
|  | - Generation Progress Overlay & Stream Processor                                                  |  |
|  | - PostMessage Bridge & Security Gateway                                                            |  |
|  +-----------------------------------+-----------------------------------+---------------------------+  |
|                                      |                                   |                              |
|                       Direct CORS    |                    Direct CORS    |                              |
|                       API Requests   |                    API Requests   |                              |
|                                      v                                   v                              |
|                       +-----------------------------+     +-----------------------------+               |
|                       |   TypeSafe AI (Jev API)     |     |       OpenRouter API        |               |
|                       |   https://api.typesafe.ai   |     |   https://openrouter.ai     |               |
|                       |                             |     |                             |               |
|                       | - Fast System One Judgments |     | - Any Model (Claude/GPT/etc)|               |
|                       | - Choice: Intent / Route    |     | - Streaming HTML Generation |               |
|                       | - Score: Scope of Change    |     | - Targeted DOM Frag Patches |               |
|                       | - Noul: Validity / Safety   |     +-----------------------------+               |
|                       +--------------+--------------+                    |                              |
|                                      |                                   |                              |
|                                      | Typed Action Decisions            | Streaming HTML Tokens        |
|                                      v                                   v                              |
|  +---------------------------------------------------------------------------------------------------+  |
|  | ISOLATED SANDBOX BOUNDARY (Cross-Origin / Non-Same-Origin Iframe)                                 |  |
|  | <iframe sandbox="allow-scripts allow-forms" srcdoc="...">                                         |  |
|  |                                                                                                   |  |
|  |  +---------------------------------------------------------------------------------------------+  |  |
|  |  | GENERATED WEB PAGE                                                                          |  |  |
|  |  | - Semantic HTML5 (No application JS frameworks: No React, No Vue, No Svelte)               |  |  |
|  |  | - Styling: Dynamic Tailwind CSS via standalone Client JIT Engine (cdn.tailwindcss.com)     |  |  |
|  |  | - Semantic Data Attributes: data-action, data-state, data-target                             |  |  |
|  |  |                                                                                             |  |  |
|  |  | +-----------------------------------------------------------------------------------------+  |  |
|  |  | | INJECTED MICRO-PROXY (~35 lines of vanilla JS)                                         |  |  |
|  |  | | - Global Event Delegation: clicks, form submits, select/input changes                     |  |  |
|  |  | | - Extracts event signature (target, data-action, form values, DOM context)              |  |  |
|  |  | | - window.parent.postMessage(eventPayload, '*')                                           |  |  |
|  |  | | - Listens for DOM patch updates from Host                                              |  |  |
|  |  | +-----------------------------------------------------------------------------------------+  |  |
|  |  +---------------------------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack & Design Decisions

### 3.1 Host Environment: Front-End Only Single-Page Application
| Dimension | Selection | Rationale |
| :--- | :--- | :--- |
| **Hosting Platform** | Static File Host (GitHub Pages, Cloudflare Pages, Vercel Static) | Zero running cost, static CDN asset delivery, infinite scalability. |
| **Host Language** | Vanilla TypeScript / ES2024 (bundled via Vite) | Eliminates framework runtime overhead. Keeps the bundle under 25 KB gzipped. |
| **State Management** | Light single-file reactive store | Stores API keys, current prompt, generation history, and active page DOM snapshots. |

### 3.2 Dual-AI Intelligence Layer
| Layer | Model / Service | Responsibility |
| :--- | :--- | :--- |
| **System One (Reflex / Router)** | **TypeSafe Jev (`jev-latest`)** | High-speed, structured categorical judgments. Evaluates natural language user prompts and runtime UI events. Returns calibrated probabilities, confidence levels, and categorical routing decisions in <150ms. |
| **System Two (Generator)** | **OpenRouter SDK (`@openrouter/sdk`)** | Code and UI generation via the official `@openrouter/sdk`. Supports any selected model (Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash, DeepSeek, etc.). Generates semantic HTML and Tailwind CSS snippets or full pages using streaming async iterables (`for await (const chunk of result)`). |

### 3.3 Styling Engine: Dynamic Full-Binary Tailwind CSS
- **The Challenge:** Traditional Tailwind setups rely on a Node.js build-time scanner (`tailwind build`) to purge unused classes. In an AI-native runtime, the HTML classes are not known until the LLM generates them at runtime.
- **The Solution:** The generated page loads the standalone Tailwind CSS Play CDN runtime:
  ```html
  <script src="https://cdn.tailwindcss.com"></script>
  ```
- **How it Works:** The Play CDN contains the full Tailwind JIT compiler running in the browser. When the LLM streams HTML tokens or updates DOM elements, the Play CDN observer detects newly added class names and injects the corresponding CSS rules into an internal `<style>` tag on the fly.
- **Dynamic Selectors Support:** Because the JIT engine runs client-side, the LLM has unrestricted access to the entire Tailwind utility dictionary: arbitrary values (`top-[117px]`), hover/focus states (`hover:bg-violet-700`), responsive breakpoints (`md:grid-cols-3`), dark mode (`dark:bg-slate-900`), gradients, flexbox, and grid layouts.

---

## 4. Security Architecture & Threat Model (BYOK)

Because users input private API keys (TypeSafe and OpenRouter) that grant access to paid inference quotas, and because an LLM can generate untrusted arbitrary HTML, the security model must be uncompromising.

### 4.1 Strict Cross-Origin Sandbox Boundary
The host page and the generated website **must never share execution context**:
1. **Iframe Isolation:** The generated site is mounted inside an `<iframe>` configured with:
   ```html
   <iframe 
     id="site-viewport"
     sandbox="allow-scripts allow-forms"
     srcdoc="..."
   ></iframe>
   ```
2. **Omission of `allow-same-origin`:**
   - Without `allow-same-origin`, the iframe is treated as an opaque, unique null origin.
   - The iframe script **cannot access**:
     - `window.parent.localStorage`
     - `window.parent.sessionStorage`
     - `window.parent.document`
     - Host cookies, tokens, or API keys.
3. **Communication Protocol:**
   - Communication between the host and the iframe is strictly limited to an explicit `postMessage` protocol with JSON-schema-validated event payloads.
   - Any malicious prompt injection (e.g., an LLM generating `<script>stealKeys(window.parent.localStorage)</script>`) fails immediately because the browser sandbox blocks cross-window property access.

### 4.2 Client-Side Key Storage & Direct CORS
- **Storage:** Keys are stored in `localStorage` under keys `typesafe_api_key` and `openrouter_api_key`.
- **CORS Verification:** Both `https://api.typesafe.ai` and `https://openrouter.ai` expose permissive CORS headers (`Access-Control-Allow-Origin: *` or browser origin reflection), allowing direct browser-to-API communication.
- **Privacy:** No user prompt, API key, or generated code ever touches a third-party server owned by the project author. All data flow is strictly `Browser <-> TypeSafe` and `Browser <-> OpenRouter`.

---

## 5. Architectural Trade-Offs & Mitigations

| Trade-Off | Constraint | Architectural Mitigation |
| :--- | :--- | :--- |
| **No Server-Side Session Storage** | Browser refresh loses server state | The Host maintains an in-memory session stack and serializes the current site state (system prompt, page DOM snapshot, interaction log) into `sessionStorage` or IndexedDB. |
| **LLM Output Hallucination** | LLM might output Markdown wrappers (```html) or broken syntax | Host implements a streaming sanitizer that strips markdown fences, repairs unclosed tags, and validates DOM structure before postMessage ingestion. |
| **Interaction Latency** | Calling a large LLM on every button click is sluggish (2–4 seconds) | **Two-Tier Reaction Architecture:** TypeSafe Jev evaluates the click in ~100ms. If the action is a simple state toggle or local filter, Jev routes to a localized micro-patch rather than a slow full-page regeneration. |
| **Tailwind JIT Script Size** | `cdn.tailwindcss.com` is ~350KB uncompressed | Loaded asynchronously inside the sandboxed iframe; browser caches the script after initial load. |
