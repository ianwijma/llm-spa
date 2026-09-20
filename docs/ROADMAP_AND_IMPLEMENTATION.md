# Implementation Roadmap & Step-by-Step Build Guide

**Project:** AI-Native Dynamic Web Runtime  
**Target Completion:** Production-Ready Static SPA

---

## 1. Project Directory Structure

```
llm-spa/
├── docs/
│   ├── ARCHITECTURE.md            # System architecture, BYOK security & CORS
│   ├── FLOW_SPECIFICATION.md      # Landing -> Generation and Interaction loops
│   ├── TYPESAFE_JEV_SPEC.md       # TypeSafe Jev System One questions and logic
│   ├── OPENROUTER_SDK_SPEC.md     # @openrouter/sdk streaming & component patching
│   ├── FRONTEND_RUNTIME_SPEC.md   # Dynamic Tailwind, Iframe sandbox, Micro-Proxy
│   └── ROADMAP_AND_IMPLEMENTATION.md # Implementation steps, file tree & roadmap
├── index.html                     # Host single-page application shell
├── package.json                   # Tooling & dependencies (@openrouter/sdk, @typesafe-ai/sdk, vite)
├── tsconfig.json                  # TypeScript compiler settings
├── src/
│   ├── main.ts                    # Application bootstrapper and view router
│   ├── state/
│   │   ├── store.ts               # Reactive state (keys, prompt, history, status)
│   │   └── storage.ts             # LocalStorage key manager
│   ├── services/
│   │   ├── typesafe.ts            # TypeSafe Jev client (@typesafe-ai/sdk)
│   │   └── openrouter.ts          # OpenRouter streaming client (@openrouter/sdk)
│   ├── runtime/
│   │   ├── iframeSandbox.ts       # Iframe lifecycle & postMessage communication
│   │   ├── microProxyScript.ts    # Stringified proxy injected into iframe
│   │   └── streamProcessor.ts     # 60fps buffered HTML stream parser
│   ├── components/
│   │   ├── landingView.ts         # Google-style minimalist search interface
│   │   ├── topBar.ts              # Model picker, prompt pill, Undo/Redo, Export
│   │   └── settingsModal.ts       # BYOK API keys configuration modal
│   └── styles/
│       └── host.css               # Minimal styling for host UI chrome
```

---

## 2. Phased Implementation Roadmap

### Phase 1: Host Shell & Google-Style Landing View
- **Objective:** Create the austere, Google-style landing interface.
- **Tasks:**
  1. Initialize Vite + TypeScript environment with zero external frontend frameworks.
  2. Build centered landing view:
     - Search input with auto-expanding textarea and `Enter` to submit.
     - "Generate Site" primary action button and "Feeling Lucky" random prompt generator.
     - Model selector dropdown connecting to OpenRouter's model catalog.
     - API Key status chip with modal trigger.

### Phase 2: BYOK Key Vault & SDK Service Clients
- **Objective:** Secure, client-only key persistence and SDK initialization.
- **Tasks:**
  1. Build `storage.ts` to manage `typesafe_api_key` and `openrouter_api_key` in `localStorage`.
  2. Implement `typesafe.ts`:
     - Initialize `TypeSafeClient` from `@typesafe-ai/sdk`.
     - Query `jev-latest` with batched `choice()`, `score()`, and `noul()` questions.
  3. Implement `openrouter.ts`:
     - Initialize `OpenRouter` client from `@openrouter/sdk`.
     - Implement async streaming via `openRouter.chat.send({ stream: true, ... })` with `for await (const chunk of result)`.
     - Implement non-streaming fragment patches via `generateComponentPatch()` (see `docs/OPENROUTER_SDK_SPEC.md`).
     - Graceful error handling for 401 (Invalid Key) and 429 (Rate Limited).

### Phase 3: Sandboxed Iframe & Micro-Proxy Ingestion
- **Objective:** Establish the secure execution boundary and event proxy.
- **Tasks:**
  1. Create `iframeSandbox.ts` that dynamically injects an `<iframe>` with `sandbox="allow-scripts allow-forms"`.
  2. Inject the Play CDN Tailwind script (`https://cdn.tailwindcss.com`) and Micro-Proxy script into the iframe `srcdoc`.
  3. Implement the `window.addEventListener('message')` listener on the host to capture `UI_EVENT` messages.

### Phase 4: Pre-Flight Analysis with TypeSafe Jev
- **Objective:** Use Jev to classify and enrich user prompts in <150ms.
- **Tasks:**
  1. Dispatch the 4-question batched query (`is_constructive`, `archetype`, `visual_theme`, `feature_density`).
  2. Synthesize results into an exact, constraint-bound OpenRouter system prompt.
  3. Add visual feedback in the host UI showing Jev's fast decisions (e.g. "⚡ Jev classified: E-Commerce / Dark Cyberpunk / Rich Interactivity").

### Phase 5: Streaming OpenRouter LLM Synthesis & Tailwind Render
- **Objective:** Stream real-time HTML into the sandboxed DOM.
- **Tasks:**
  1. Connect `openrouter.ts` SSE stream to `streamProcessor.ts`.
  2. Strip markdown code fences (` ```html `) on the fly.
  3. Post buffered chunks to the iframe via `REPLACE_ROOT_HTML`.
  4. Verify that Tailwind JIT parses newly generated classes instantly without flash.

### Phase 6: Reactive Interaction Loop (Jev Reflex Engine)
- **Objective:** Allow full interactivity on the generated site without bespoke JS.
- **Tasks:**
  1. Receive `UI_EVENT` from the micro-proxy when a button/form is clicked.
  2. Send event signature + current page context to Jev for categorical routing (`local_toggle` vs `partial_dom_patch` vs `full_page_transition`).
  3. Execute local class toggle if `local_toggle`.
  4. Invoke OpenRouter for a surgical component snippet if `partial_dom_patch`, and swap the DOM element with smooth animation.
  5. Update application history stack on every mutation.

### Phase 7: Undo/Redo & Standalone Export
- **Objective:** User control and portability.
- **Tasks:**
  1. Implement Undo/Redo by navigating the `domHistory` array in `store.ts`.
  2. Add an "Export HTML" button that packages the current iframe DOM + Tailwind script into a standalone `.html` file download.

---

## 3. Testing & Verification Matrix

| Area | Test Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **BYOK Security** | Script inside generated iframe attempts `window.parent.localStorage.getItem(...)` | Browser throws `SecurityError: Blocked a frame with origin "null" from accessing a cross-origin frame`. |
| **Direct CORS** | Host calls TypeSafe and OpenRouter directly from browser | Requests succeed without CORS pre-flight blockage or proxy server required. |
| **Tailwind JIT** | LLM generates complex arbitrary utility `bg-gradient-to-tr from-fuchsia-600 to-amber-500` | Tailwind Play CDN dynamically compiles CSS rules; visual gradient renders immediately. |
| **Micro-Interactions** | User clicks "Add to Cart" | Jev routes to `partial_dom_patch` in ~120ms; OpenRouter returns updated cart drawer; element updates without reloading page. |
| **Export Portability** | User clicks "Export" and opens saved `.html` file locally in Chrome/Safari | Entire page renders with all Tailwind styles intact without any build step. |

---

## 4. Deployment Instructions

1. **Build Artifacts:**
   ```bash
   npm run build
   ```
   Produces a purely static `dist/` directory containing `index.html`, one minified JS bundle (~18 KB), and one CSS file (~4 KB).
2. **Deploy to Static CDN:**
   - **GitHub Pages:** Push `dist/` branch or configure GitHub Actions.
   - **Cloudflare Pages:** Connect repository with build command `npm run build` and output directory `dist`.
   - **Vercel / Netlify:** Zero-config static deployment.
3. **Operational Cost:** $0.00 / month forever.
