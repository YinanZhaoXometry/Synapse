# frozen_string_literal: true

module Types
  module Ai
    # ProviderOverrideInput (epic 39 T2, BYOK): the desktop shell's own
    # OpenAI-compatible model config — baseUrl + model + apiKey, sent with
    # any AI-invoking mutation. All three fields must ride together (the
    # seam refuses a partial config); the key pays the CALLER's calls and
    # bypasses the server's shared daily cap. Never logged, never persisted
    # beyond the ≤60s single-use stream ticket.
    class ProviderOverrideInput < Types::BaseInputObject
      description "BYOK (epic 39): the caller's own OpenAI-compatible provider — baseUrl, model and apiKey together; calls on it skip the server's shared provider and daily cap."

      argument :base_url, String,
               required: true,
               description: "The provider's https:// base URL (the chat-completions API root, e.g. https://api.openai.com/v1)."
      argument :model, String,
               required: true,
               description: "The model name the provider serves (e.g. gpt-4o-mini)."
      argument :api_key, String,
               required: true,
               description: "The caller's API key — pays their own calls; never logged or persisted (the stream ticket carries it ≤60s, single-use)."
    end
  end
end
