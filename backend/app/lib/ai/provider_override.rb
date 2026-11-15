# frozen_string_literal: true

module Ai
  # ProviderOverride (epic 39 T2, BYOK): a caller-supplied OpenAI-compatible
  # provider config — the desktop shell's "model integration" (baseUrl +
  # model + apiKey, all three or none; a partial config is an honest refusal,
  # never a half-server half-client hybrid). Coerced ONCE at the seam
  # boundary — inside Ai::Provider.complete/.stream, or at stream-ticket mint
  # where the validated shape rides the ticket payload jsonb for its ≤60s
  # single-use TTL. The api key never lands anywhere else: not in logs, not
  # persisted beyond the consumed ticket.
  class ProviderOverride
    MAX_URL_CHARS = 2048
    MAX_MODEL_CHARS = 200
    MAX_KEY_CHARS = 4000

    attr_reader :base_url, :model, :api_key

    def initialize(base_url:, model:, api_key:)
      @base_url = base_url
      @model = model
      @api_key = api_key
    end

    class << self
      include Dry::Monads[:result]

      # GraphQL input (symbol-keyed hash from the input object's to_h) →
      # Success(override) | Failure(:VALIDATION_FAILED). baseUrl must be
      # https:// — the desktop settings help text says the same. An already
      # coerced instance passes through (the stream controller hands a
      # from_payload build, not a raw hash — one validation authority).
      def coerce(input)
        return Success(input) if input.is_a?(ProviderOverride)
        return coercion_failure("provider override must be an input object") unless input.is_a?(Hash)

        # Two key shapes cross this seam: a graphql-ruby InputObject#to_h uses
        # the RUBY argument names (:base_url, :api_key — underscored), while
        # direct command callers (specs) may pass the schema's camelCase
        # names. Accept both; never a silent partial read.
        base_url = (input[:baseUrl] || input[:base_url]).to_s.strip
        model = input[:model].to_s.strip
        api_key = (input[:apiKey] || input[:api_key]).to_s.strip

        if base_url.empty? || model.empty? || api_key.empty?
          return coercion_failure("provider override needs baseUrl, model and apiKey together")
        end
        unless base_url.start_with?("https://") && base_url.length <= MAX_URL_CHARS
          return coercion_failure("provider override baseUrl must be an https:// URL")
        end
        if model.length > MAX_MODEL_CHARS || api_key.length > MAX_KEY_CHARS
          return coercion_failure("provider override exceeds the length bounds")
        end

        Success(new(base_url: base_url, model: model, api_key: api_key))
      end

      # Ticket payload (string-keyed jsonb) → override. Trusted input: the
      # payload was minted by #to_payload on this server and the ticket is
      # single-use (redeemed atomically).
      def from_payload(payload)
        new(base_url: payload["base_url"], model: payload["model"], api_key: payload["api_key"])
      end

      private

      def coercion_failure(message)
        Failure(ApplicationErrors::Failure.new(
          code: :VALIDATION_FAILED, context: { message: message, field: :provider }
        ))
      end
    end

    def to_payload
      { "base_url" => base_url, "model" => model, "api_key" => api_key }
    end

    # The Ai::Provider.configuration shape (timeout stays the server default:
    # the caller's endpoint gets the same bounded patience, not their own
    # knob — a hanging endpoint must surface, not stall forever).
    def configuration
      { base_url: base_url, api_key: api_key, model: model, timeout_seconds: Provider::DEFAULT_TIMEOUT_SECONDS }
    end
  end
end
