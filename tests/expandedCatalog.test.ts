import { describe, it, expect } from "vitest";
import {
  SUPPORTED_ARCHETYPES,
  SUPPORTED_VISUAL_THEMES,
  runJevPreflight,
} from "../src/services/typesafe";
import { POPULAR_MODELS, fetchOpenRouterModels } from "../src/services/openrouter";

describe("Expanded Archetypes & Visual Themes Catalog", () => {
  it("provides at least 20 diverse site archetypes", () => {
    const keys = Object.keys(SUPPORTED_ARCHETYPES);
    expect(keys.length).toBeGreaterThanOrEqual(20);
    expect(keys).toContain("crypto_web3");
    expect(keys).toContain("gaming_hub");
    expect(keys).toContain("educational_course");
    expect(keys).toContain("real_estate");
    expect(keys).toContain("medical_health");
    expect(keys).toContain("booking_service");
    expect(keys).toContain("media_streaming");
    expect(keys).toContain("crowdfunding_charity");
  });

  it("provides at least 14 rich visual design languages", () => {
    const keys = Object.keys(SUPPORTED_VISUAL_THEMES);
    expect(keys.length).toBeGreaterThanOrEqual(14);
    expect(keys).toContain("brutalist_neo");
    expect(keys).toContain("glassmorphism_luxury");
    expect(keys).toContain("minimalist_nordic");
    expect(keys).toContain("tech_terminal");
    expect(keys).toContain("retro_arcade_80s");
    expect(keys).toContain("warm_terracotta");
    expect(keys).toContain("sunset_gradient");
    expect(keys).toContain("corporate_navy");
    expect(keys).toContain("pastel_dream");
  });

  it("classifies crypto & web3 prompt correctly", async () => {
    const result = await runJevPreflight("Solana token swap staking pool and NFT gallery");
    expect(result.archetype).toBe("crypto_web3");
  });

  it("classifies tech terminal prompt correctly", async () => {
    const result = await runJevPreflight("Linux hacker terminal CLI cloud devops monitoring tool");
    expect(result.theme).toBe("tech_terminal");
  });

  it("classifies gaming hub prompt correctly", async () => {
    const result = await runJevPreflight("Esports gaming tournament brackets with player leaderboard");
    expect(result.archetype).toBe("gaming_hub");
  });

  it("classifies brutalist design prompt correctly", async () => {
    const result = await runJevPreflight("Brutalist design studio portfolio with raw black borders");
    expect(result.theme).toBe("brutalist_neo");
  });
});

describe("Searchable OpenRouter Model Catalog", () => {
  it("loads models catalog with slugs and names", async () => {
    const models = await fetchOpenRouterModels();
    expect(models.length).toBeGreaterThanOrEqual(10);

    const first = models[0];
    expect(first.id).toBeDefined();
    expect(first.name).toBeDefined();
    expect(first.provider).toBeDefined();
  });

  it("supports slug filtering for popular model families", () => {
    const claudeModels = POPULAR_MODELS.filter(
      (m) => m.id.toLowerCase().includes("claude") || m.name.toLowerCase().includes("claude")
    );
    expect(claudeModels.length).toBeGreaterThanOrEqual(2);

    const gptModels = POPULAR_MODELS.filter(
      (m) => m.id.toLowerCase().includes("gpt") || m.name.toLowerCase().includes("gpt")
    );
    expect(gptModels.length).toBeGreaterThanOrEqual(2);

    const deepseekModels = POPULAR_MODELS.filter(
      (m) => m.id.toLowerCase().includes("deepseek") || m.name.toLowerCase().includes("deepseek")
    );
    expect(deepseekModels.length).toBeGreaterThanOrEqual(2);
  });
});
