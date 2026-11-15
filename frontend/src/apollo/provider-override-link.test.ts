import { afterEach, describe, expect, it, vi } from "vitest";
import { Observable, type NormalizedExecutionResult, type Operation } from "@apollo/client";
import { providerOverrideLink } from "./provider-override-link";
import { setModelConfig } from "@/lib/model-config";

/** Epic 39 T2: the BYOK injection seam — a complete local config rides the
 * `provider` input of every AI mutation (and the stream-ticket mint), and
 * nothing else is touched. */
describe("providerOverrideLink", () => {
  afterEach(() => {
    localStorage.clear();
  });

  function run(operationName: string, variables: Record<string, unknown>): Operation {
    const seen: Operation[] = [];
    const link = providerOverrideLink();
    const forward = (op: Operation) => {
      seen.push(op);
      return new Observable<NormalizedExecutionResult>((subscriber) => {
        subscriber.complete();
      });
    };
    const operation = {
      operationName,
      variables,
      query: null,
    } as unknown as Operation;
    link.request(operation, forward).subscribe(() => {});
    return seen[0];
  }

  it("injects provider into an AI mutation's input when the config is complete", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "m", apiKey: "k" });
    const seen = run("GenerateQuiz", { input: { clientUuid: "u", language: "zh", mode: "open" } });
    expect(seen.variables).toEqual({
      input: { clientUuid: "u", language: "zh", mode: "open", provider: { baseUrl: "https://api.example.com/v1", model: "m", apiKey: "k" } },
    });
  });

  it("injects into the stream-ticket mint too", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "m", apiKey: "k" });
    const seen = run("CreateStreamTicket", { input: { op: "companion", language: "zh" } });
    expect((seen.variables.input as Record<string, unknown>).provider).toBeDefined();
  });

  it("touches nothing when the config is incomplete", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "", apiKey: "k" });
    const seen = run("GenerateQuiz", { input: { clientUuid: "u" } });
    expect(seen.variables).toEqual({ input: { clientUuid: "u" } });
  });

  it("touches nothing for non-AI mutations", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "m", apiKey: "k" });
    const seen = run("ChangePassword", { input: { currentPassword: "a", newPassword: "b" } });
    expect(seen.variables).toEqual({ input: { currentPassword: "a", newPassword: "b" } });
  });

  it("does not mutate the caller's variables object", () => {
    setModelConfig({ baseUrl: "https://api.example.com/v1", modelName: "m", apiKey: "k" });
    const input = { clientUuid: "u" };
    const variables = { input };
    run("GenerateQuiz", variables);
    expect(variables).toEqual({ input: { clientUuid: "u" } });
  });
});
