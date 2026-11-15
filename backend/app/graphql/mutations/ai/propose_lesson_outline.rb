# frozen_string_literal: true

module Mutations
  module Ai
    # proposeLessonOutline (epic-36 T1, spec decision 5 — ① 材料讲义's
    # outline gate): a parsed, section-bearing material becomes a chapter
    # outline preview — STATELESS (nothing persists), one cap-counted
    # provider call. The reply carries the outline (title + sourceSectionIds
    # per chapter) and the EXACT estimate for the proposed size (derived
    # from the template constants — the confirm page's number, shared with
    # the lessonEstimate query). The client confirms by echoing the outline
    # into createLesson.
    class ProposeLessonOutline < BaseMutation
      description "Propose a generated-lesson chapter outline for one parsed material (epic-36 ①'s gate) — stateless, one AI call per proposal (the daily cap counts it); the client confirms by echoing the outline into createLesson."

      argument :material_id, String,
               required: true,
               description: "The source material's uuid — parsed with ≥1 section, never a generated lesson itself (uniform NOT_FOUND for foreign/malformed ids)."
      argument :language, String,
               required: true,
               description: "The reply language: \"zh\" | \"en\" (AD-16 — one parameter, one policy)."

      argument :provider, Types::Ai::ProviderOverrideInput,
               required: false,
               description: "BYOK (epic 39): the caller's own OpenAI-compatible provider — overrides the server's for THIS call (their key pays it; no shared daily cap)."

      field :outline, [ Types::LessonOutlineChapterType ],
            null: false,
            description: "The proposed chapters (title + sourceSectionIds) — at most the material template cap (8)."

      field :estimated_calls, Int,
            null: false,
            description: "The exact expected call count for THIS outline (1 + chapters, from the template constants) — the confirm page shares the lessonEstimate query's source of truth."

      def resolve(material_id:, language:, provider: nil)
        result = command_result(::Ai::ProposeLessonOutlineCommand.call(
          current_user: current_user!,
          material_id: material_id,
          language: language,
          provider_override: provider&.to_h
        ))
        { outline: result[:outline], estimated_calls: result[:estimated_calls] }
      end
    end
  end
end
