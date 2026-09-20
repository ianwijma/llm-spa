# Frontend Runtime & Dynamic Tailwind CSS Specification

**Host Bundle Size:** < 20 KB (Gzipped)  
**Dependencies:** Zero client frameworks (No React, Vue, Angular, or Solid on the host)  
**CSS Engine:** Tailwind CSS Play CDN Standalone Runtime (`https://cdn.tailwindcss.com`)  
**Sandboxing:** Opaque Cross-Origin Iframe (`sandbox="allow-scripts allow-forms"`)

---

## 1. Architectural Philosophy: The "Zero-JS" Target

The fundamental technical goal set forward in the prompt is to **ship the minimum possible JavaScript**, allowing the LLMs to generate all user-visible markup and styling.

To achieve this:
1. **The Host Container is a Thin Orchestrator:**
   The host application provides only:
   - A single-screen Google-style search input and settings modal.
   - The API communication layers (TypeSafe Jev + OpenRouter SSE).
   - An `<iframe>` viewport that hosts the generated application.
2. **The Generated Application Contains Zero Framework Code:**
   The generated website does not import React, Vue, Svelte, or even jQuery. It consists of pure, semantic HTML5 tags:
   - `<nav>`, `<header>`, `<main>`, `<section>`, `<article>`, `<button>`, `<form>`, `<input>`, `<table>`.
   - All visual design is encoded directly into **Tailwind CSS utility classes**.
   - All interactive hooks are encoded into **semantic HTML attributes** (`data-action`, `data-target`, `name`, `id`).

---

## 2. Dynamic Tailwind CSS Architecture

### 2.1 The Challenge of Dynamic Utility Classes
Standard Tailwind CSS relies on an offline Node.js build process (`tailwindcss -i input.css -o output.css --watch`) that parses code files with regular expressions and generates a purged static CSS stylesheet.
In our runtime:
- The website HTML is created dynamically on the fly by OpenRouter.
- Any valid Tailwind utility might appear at any second (e.g., `backdrop-blur-md`, `bg-gradient-to-r`, `grid-cols-4`, `hover:rotate-1`).
- A pre-compiled static CSS bundle cannot predict these arbitrary classes.

### 2.2 The Solution: The Tailwind CSS Browser JIT Runtime
Inside the sandboxed `<iframe>`, the document loads:
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          serif: ['Merriweather', 'serif']
        }
      }
    }
  }
</script>
```

#### How the Browser JIT Engine Operates:
1. **DOM Mutation Observer:** The Play CDN script attaches a native `MutationObserver` to the `document.documentElement`.
2. **On-the-Fly Compilation:** Whenever the host injects new HTML or patches an existing element, the observer extracts all tokens from the `class` attributes.
3. **Internal Stylesheet Injection:** The runtime computes the exact CSS rules (including pseudo-classes, media queries, CSS variables, and arbitrary values) and inserts them into an internal `<style id="tailwindcss">` tag.
4. **Sub-millisecond Performance:** The JIT compilation happens in sub-millisecond time directly inside the browser's JavaScript execution thread, providing instantaneous styling with zero network latency.

---

## 3. The Injected Micro-Proxy (Event Delegation Bus)

To enable interactions without writing bespoke application JavaScript, the host injects a tiny (~35-line) **Micro-Proxy script** into the iframe's `<head>`.

### 3.1 Micro-Proxy Source Code
```javascript
(function () {
  // Global event delegation for all user actions
  function serializeEvent(e, eventType) {
    var el = e.target.closest('button, a, input, select, form, [data-action]');
    if (!el) return null;

    // Collect parent context for richer LLM understanding
    var parentSection = el.closest('section, card, [id]') || el.parentElement;
    var contextSnippet = parentSection ? parentSection.outerHTML.slice(0, 400) : '';

    var form = el.closest('form');
    var formData = {};
    if (form) {
      new FormData(form).forEach(function (value, key) {
        formData[key] = value;
      });
    }

    return {
      eventType: eventType,
      tagName: el.tagName,
      id: el.id || null,
      className: el.className || null,
      text: (el.innerText || el.value || '').trim().slice(0, 100),
      action: el.getAttribute('data-action') || null,
      target: el.getAttribute('data-target') || null,
      href: el.getAttribute('href') || null,
      formData: Object.keys(formData).length > 0 ? formData : null,
      contextSnippet: contextSnippet
    };
  }

  // Intercept Clicks
  document.addEventListener('click', function (e) {
    var payload = serializeEvent(e, 'click');
    if (payload) {
      if (payload.tagName === 'A' && payload.href && payload.href.startsWith('#')) {
        e.preventDefault();
      }
      window.parent.postMessage({ type: 'UI_EVENT', payload: payload }, '*');
    }
  }, true);

  // Intercept Form Submissions
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = serializeEvent(e, 'submit');
    if (payload) {
      window.parent.postMessage({ type: 'UI_EVENT', payload: payload }, '*');
    }
  }, true);

  // Intercept Dynamic Updates from Host
  window.addEventListener('message', function (e) {
    var data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'REPLACE_ROOT_HTML') {
      var root = document.getElementById('app-root');
      if (root) root.innerHTML = data.html;
    } else if (data.type === 'PATCH_ELEMENT') {
      var target = document.querySelector(data.selector);
      if (target) {
        target.outerHTML = data.newHtml;
      }
    } else if (data.type === 'TOGGLE_CLASS') {
      var target = document.querySelector(data.selector);
      if (target) {
        target.classList.toggle(data.className);
      }
    }
  });
})();
```

---

## 4. The PostMessage Protocol (Host <-> Iframe Contract)

Because the iframe has no direct access to the parent window's state or credentials, communication occurs strictly through strongly typed message envelopes:

### 4.1 Iframe to Host Messages (`IFRAME_TO_PARENT`)

```typescript
type IframeToParentMessage = 
  | {
      type: "UI_EVENT";
      payload: {
        eventType: "click" | "submit" | "change";
        tagName: string;
        id: string | null;
        className: string | null;
        text: string;
        action: string | null;
        target: string | null;
        href: string | null;
        formData: Record<string, any> | null;
        contextSnippet: string;
      };
    }
  | {
      type: "IFRAME_READY";
      timestamp: number;
    };
```

### 4.2 Host to Iframe Messages (`PARENT_TO_IFRAME`)

```typescript
type ParentToIframeMessage =
  | {
      type: "REPLACE_ROOT_HTML";
      html: string;
    }
  | {
      type: "PATCH_ELEMENT";
      selector: string;
      newHtml: string;
    }
  | {
      type: "TOGGLE_CLASS";
      selector: string;
      className: string;
    }
  | {
      type: "APPEND_STREAM_CHUNK";
      chunk: string;
    };
```

---

## 5. Streaming DOM Mounting Engine

When OpenRouter streams HTML tokens via Server-Sent Events (SSE), streaming raw unclosed HTML directly into `innerHTML` causes visual layout thrashing, flashing unstyled elements, and broken DOM hierarchies.

The Host implements a **Buffered DOM Streaming Engine**:

```typescript
class StreamProcessor {
  private buffer: string = "";
  private updateFrameScheduled: boolean = false;
  private targetIframe: HTMLIFrameElement;

  constructor(iframe: HTMLIFrameElement) {
    this.targetIframe = iframe;
  }

  public appendToken(token: string): void {
    this.buffer += token;
    this.scheduleRender();
  }

  private scheduleRender(): void {
    if (this.updateFrameScheduled) return;
    this.updateFrameScheduled = true;

    requestAnimationFrame(() => {
      this.flushToIframe();
      this.updateFrameScheduled = false;
    });
  }

  private flushToIframe(): void {
    // 1. Sanitize Markdown backticks if LLM wrapped output in ```html
    let cleanHtml = this.buffer.replace(/^```html\s*/i, "").replace(/```$/, "");

    // 2. Transmit cleanly buffered HTML to sandboxed iframe
    this.targetIframe.contentWindow?.postMessage(
      { type: "REPLACE_ROOT_HTML", html: cleanHtml },
      "*"
    );
  }

  public finalize(): void {
    this.flushToIframe();
    this.buffer = "";
  }
}
```

This guarantees 60fps rendering during token generation, preventing DOM freezes even on lower-end devices.
