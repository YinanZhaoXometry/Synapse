/**
 * The BYOK injection seam (epic 39 T2): every AI-invoking mutation — the
 * nine direct-call ops plus the SSE stream ticket mint — carries an optional
 * `provider` input (the caller's own OpenAI-compatible endpoint). This ONE
 * apollo link injects it into any of those operations when the desktop
 * shell's model config is complete (lib/model-config.ts), so no consumer
 * (hooks layer, companion service, sse client) knows BYOK exists.
 *
 * Injected values replace nothing the caller set — `provider` is a new input
 * field no consumer constructs today — and the variables object is copied,
 * never mutated in place. On the wire the key rides only the request body
 * (and, for streamed ops, the ≤60s single-use ticket payload server-side).
 */
import { ApolloLink } from "@apollo/client";
import { getCompleteProviderInput } from "@/lib/model-config";

const AI_MUTATIONS = new Set([
  "GenerateQuiz",
  "GenerateFlashcards",
  "GradeOpenAnswer",
  "GenerateNote",
  "GenerateStudyFocus",
  "GenerateTodaySuggestion",
  "MapMaterialSections",
  "ProposeLessonOutline",
  "CreateLesson",
  "CreateStreamTicket",
]);

export function providerOverrideLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const provider = getCompleteProviderInput();
    const input = (operation.variables as Record<string, unknown> | undefined)?.input;
    if (provider && AI_MUTATIONS.has(operation.operationName) && input && typeof input === "object") {
      operation.variables = {
        ...operation.variables,
        input: { ...(input as Record<string, unknown>), provider },
      };
    }
    return forward(operation);
  });
}
