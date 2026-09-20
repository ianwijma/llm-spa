/**
 * Sandboxed Iframe Manager
 * Instantiates the cross-origin opaque execution environment with dynamic Tailwind JIT
 * and the injected micro-proxy event bus.
 */

import { MICRO_PROXY_SOURCE } from "./microProxyScript";
import type { InteractionPayload } from "../services/typesafe";

export type IframeEventHandler = (event: InteractionPayload) => void;
export type IframeReadyHandler = (timestamp: number) => void;

export class IframeSandbox {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;
  private onUIEventCallback?: IframeEventHandler;
  private onReadyCallback?: IframeReadyHandler;
  private messageListenerBound: ((e: MessageEvent) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public init(onUIEvent?: IframeEventHandler, onReady?: IframeReadyHandler): HTMLIFrameElement {
    this.onUIEventCallback = onUIEvent;
    this.onReadyCallback = onReady;

    this.destroy();

    const iframe = document.createElement("iframe");
    iframe.id = "site-viewport";
    // BYOK Security Requirement: strictly NO allow-same-origin
    iframe.setAttribute("sandbox", "allow-scripts allow-forms");
    iframe.className = "w-full h-full border-0 bg-white shadow-inner";
    iframe.title = "AI-Generated Application Runtime";

    const baseHtml = this.getBootstrapHtml();
    iframe.srcdoc = baseHtml;

    this.container.appendChild(iframe);
    this.iframe = iframe;

    this.bindMessageListener();

    return iframe;
  }

  public getIframeElement(): HTMLIFrameElement | null {
    return this.iframe;
  }

  private getBootstrapHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HyperSite Generated Viewport</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            serif: ['Merriweather', 'Charter', 'Georgia', 'serif'],
            mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace']
          }
        }
      }
    };
  </script>
  <script>
    ${MICRO_PROXY_SOURCE}
  </script>
</head>
<body class="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
  <div id="app-root"></div>
</body>
</html>`;
  }

  private bindMessageListener(): void {
    if (this.messageListenerBound) {
      window.removeEventListener("message", this.messageListenerBound);
    }

    this.messageListenerBound = (e: MessageEvent) => {
      // Security: verify event origin matches current iframe contentWindow
      if (this.iframe && e.source !== this.iframe.contentWindow) {
        return;
      }

      const data = e.data;
      if (!data || !data.type) return;

      if (data.type === "UI_EVENT" && this.onUIEventCallback) {
        this.onUIEventCallback(data.payload as InteractionPayload);
      } else if (data.type === "IFRAME_READY" && this.onReadyCallback) {
        this.onReadyCallback(data.timestamp || Date.now());
      }
    };

    window.addEventListener("message", this.messageListenerBound);
  }

  public postMessage(message: Record<string, any>): void {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, "*");
    }
  }

  public replaceRootHtml(html: string): void {
    this.postMessage({
      type: "REPLACE_ROOT_HTML",
      html,
    });
  }

  public patchElement(selector: string, newHtml: string): void {
    this.postMessage({
      type: "PATCH_ELEMENT",
      selector,
      newHtml,
    });
  }

  public toggleClass(selector: string, className: string): void {
    this.postMessage({
      type: "TOGGLE_CLASS",
      selector,
      className,
    });
  }

  /**
   * Generates a portable, standalone HTML document suitable for file export
   */
  public generateExportHtml(appHtml: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Web Application - HyperSite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            serif: ['Merriweather', 'Georgia', 'serif'],
            mono: ['JetBrains Mono', 'monospace']
          }
        }
      }
    };
  </script>
</head>
<body class="min-h-screen bg-slate-50 text-slate-900 antialiased">
  <div id="app-root">
    ${appHtml}
  </div>
</body>
</html>`;
  }

  public destroy(): void {
    if (this.messageListenerBound) {
      window.removeEventListener("message", this.messageListenerBound);
      this.messageListenerBound = null;
    }
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
  }
}
