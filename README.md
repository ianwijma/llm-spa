# AI-Native Dynamic Web Runtime (HyperSite)

> A purely client-side, zero-backend, AI-powered web runtime. Generates complete websites on the fly from natural language descriptions with dynamic Tailwind CSS and reactive interactions orchestrated by **TypeSafe Jev** and **OpenRouter**.

---

## Technical Documentation Suite

This repository contains comprehensive architectural and technical specifications for building the AI-Native Web Runtime:

| Document | Description |
| :--- | :--- |
| **[1. System Architecture Document](docs/ARCHITECTURE.md)** | Core system design, zero-backend philosophy, BYOK security model, cross-origin iframe sandboxing, and direct CORS communication. |
| **[2. Interaction & Lifecycle Flow Specification](docs/FLOW_SPECIFICATION.md)** | Detailed event flows: Landing to first generated page, and the two-tier reactive interaction loop (event delegation -> Jev routing -> DOM patching). |
| **[3. TypeSafe Jev (System One) Integration Spec](docs/TYPESAFE_JEV_SPEC.md)** | Deep dive into TypeSafe Jev (`jev-latest`, colloquially "Jeff"), System One primitives (`choice`, `score`, `noul`), speculative fan-out, and sub-150ms interaction routing. |
| **[4. OpenRouter SDK Integration Spec](docs/OPENROUTER_SDK_SPEC.md)** | Using `@openrouter/sdk` in a client-side TypeScript runtime, async streaming iterables, targeted component fragment patches, model catalog, and tree-shaking. |
| **[5. Frontend Runtime & Dynamic Tailwind CSS Spec](docs/FRONTEND_RUNTIME_SPEC.md)** | Minimal host container, dynamic browser JIT compilation with the Tailwind Play CDN, injected micro-proxy event bus, and postMessage contract. |
| **[6. Implementation Roadmap & Build Guide](docs/ROADMAP_AND_IMPLEMENTATION.md)** | Step-by-step phased engineering roadmap, project file tree, test verification matrix, and $0 static deployment guidelines. |

---

## Core Technical Decisions Summary

### 1. Front-End Only Architecture (Zero Backend)
- **Question:** Can this run completely client-side without a backend server?
- **Decision:** **Yes, 100% front-end only.** Both the **OpenRouter API** (`openrouter.ai`) and the **TypeSafe AI API** (`api.typesafe.ai`) provide direct browser CORS headers (`Access-Control-Allow-Origin: *` and allowed authorization headers).
- **Hosting Cost:** $0.00. The demo can be hosted as static files on GitHub Pages, Cloudflare Pages, Vercel, or Netlify.

### 2. BYOK (Bring Your Own Key) Security & Sandboxing
- **Risk:** An arbitrary LLM-generated webpage might attempt to read the user's API keys from `localStorage`.
- **Solution:** Strict isolation via an opaque sandboxed `<iframe>` (`sandbox="allow-scripts allow-forms"`, omitting `allow-same-origin`). 
  - The iframe has a null origin and cannot access parent window memory, cookies, or `localStorage`.
  - All data exchange between the host shell and the generated site is strictly mediated over typed `postMessage` envelopes.

### 3. Jev ("Jeff") as the System One Reflex Engine
- **Role:** Rather than calling a slow, expensive generative LLM (2000ms latency) on every button click, **TypeSafe Jev** acts as a sub-150ms System One reflex engine:
  - Classifies user intent and assigns interaction pathways (`local_toggle`, `partial_dom_patch`, `full_page_transition`).
  - Evaluates form validation rules and prompt safety flags.
  - Directs targeted partial DOM replacements so OpenRouter only generates small component fragments rather than re-rendering the entire page.

### 4. Zero / Minimal JavaScript & Full-Binary Tailwind CSS
- **Host Codebase:** Ultra-lean Vanilla TypeScript shell (< 20 KB total).
- **Generated Code:** Zero JavaScript frameworks. Only pure semantic HTML5 markup.
- **Styling Engine:** Uses the standalone Tailwind CSS Play CDN (`cdn.tailwindcss.com`). The browser JIT engine parses DOM mutations in real time, giving the LLM unrestricted access to the complete Tailwind utility class system (gradients, responsive grids, hover/focus states, arbitrary values).
