/**
 * Stream Processor
 * Buffers streaming HTML tokens from OpenRouter and flushes them to the sandboxed
 * iframe at 60fps using requestAnimationFrame to prevent DOM thrashing and layout freezes.
 */

import { stripMarkdownFences } from "../services/openrouter";

export class StreamProcessor {
  private buffer: string = "";
  private updateFrameScheduled: boolean = false;
  private targetIframe: HTMLIFrameElement | null = null;
  private tokenCount: number = 0;
  private onTokenCallback?: (count: number, currentBuffer: string) => void;

  constructor(
    iframe: HTMLIFrameElement | null,
    onToken?: (count: number, currentBuffer: string) => void
  ) {
    this.targetIframe = iframe;
    this.onTokenCallback = onToken;
  }

  public setIframe(iframe: HTMLIFrameElement | null): void {
    this.targetIframe = iframe;
  }

  public appendToken(token: string): void {
    this.buffer += token;
    this.tokenCount += 1;

    if (this.onTokenCallback) {
      this.onTokenCallback(this.tokenCount, this.buffer);
    }

    this.scheduleRender();
  }

  public getCleanBuffer(): string {
    return stripMarkdownFences(this.buffer);
  }

  public getTokenCount(): number {
    return this.tokenCount;
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
    if (!this.targetIframe || !this.targetIframe.contentWindow) return;

    const cleanHtml = this.getCleanBuffer();
    this.targetIframe.contentWindow.postMessage(
      {
        type: "REPLACE_ROOT_HTML",
        html: cleanHtml,
      },
      "*"
    );
  }

  public finalize(): string {
    const finalHtml = this.getCleanBuffer();
    this.flushToIframe();
    return finalHtml;
  }

  public reset(): void {
    this.buffer = "";
    this.tokenCount = 0;
    this.updateFrameScheduled = false;
  }
}
