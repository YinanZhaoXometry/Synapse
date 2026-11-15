import { afterEach, describe, expect, it, vi } from "vitest";
import { getModelConfig, getCompleteProviderInput, setModelConfig } from "./model-config";

/** Epic 39 T2: the local model config — lazy storage, and the wire shape only
 * for COMPLETE configs (an incomplete draft never rides). */
describe("model-config", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reads empty defaults when nothing is stored", () => {
    expect(getModelConfig()).toEqual({ baseUrl: "", modelName: "", apiKey: "" });
    expect(getCompleteProviderInput()).toBeNull();
  });

  it("persists through setModelConfig and answers the wire shape when complete", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "gpt-4o-mini", apiKey: "sk-x" });
    expect(getModelConfig().modelName).toBe("gpt-4o-mini");
    expect(getCompleteProviderInput()).toEqual({
      baseUrl: "https://api.example.com/v1",
      model: "gpt-4o-mini",
      apiKey: "sk-x",
    });
  });

  it("never answers the wire shape for incomplete or non-https configs", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "", apiKey: "sk-x" });
    expect(getCompleteProviderInput()).toBeNull();
    setModelConfig({ baseUrl: "http://insecure.example/v1", modelName: "m", apiKey: "k" });
    expect(getCompleteProviderInput()).toBeNull();
    setModelConfig({ baseUrl: "https://", modelName: "m", apiKey: "k" });
    expect(getCompleteProviderInput()).toBeNull();
  });

  it("survives corrupt storage as the empty default", () => {
    localStorage.setItem("synapse-ai-config", "{not json");
    expect(getModelConfig()).toEqual({ baseUrl: "", modelName: "", apiKey: "" });
  });
});
