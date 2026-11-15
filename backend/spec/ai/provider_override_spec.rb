# frozen_string_literal: true

require "rails_helper"

# Ai::ProviderOverride (epic 39 T2, BYOK): the caller-supplied
# OpenAI-compatible config — all-three-or-none coercion, https-only baseUrl,
# length bounds, and the ticket payload round-trip the stream path trusts.
RSpec.describe Ai::ProviderOverride do
  let(:valid) do
    { baseUrl: "https://api.example.com/v1", model: "gpt-4o-mini", apiKey: "sk-caller" }
  end

  describe ".coerce" do
    it "accepts a complete https config" do
      result = described_class.coerce(valid)
      expect(result).to be_success
      override = result.value!
      expect(override.configuration).to eq(
        base_url: "https://api.example.com/v1",
        api_key: "sk-caller",
        model: "gpt-4o-mini",
        timeout_seconds: Ai::Provider::DEFAULT_TIMEOUT_SECONDS
      )
    end

    it "strips surrounding whitespace" do
      result = described_class.coerce(
        baseUrl: "  https://api.example.com/v1 ", model: " m ", apiKey: " k "
      )
      expect(result.value!.configuration[:base_url]).to eq("https://api.example.com/v1")
      expect(result.value!.configuration[:model]).to eq("m")
    end

    it "refuses a partial config — any of the three blank (never a hybrid)" do
      aggregate_failures do
        [ { baseUrl: "", model: "m", apiKey: "k" },
         { baseUrl: "https://api.example.com/v1", model: "", apiKey: "k" },
         { baseUrl: "https://api.example.com/v1", model: "m", apiKey: "" } ].each do |input|
          result = described_class.coerce(input)
          expect(result).to be_failure
          expect(result.failure.code).to eq(:VALIDATION_FAILED)
          expect(result.failure.context[:field]).to eq(:provider)
        end
      end
    end

    it "refuses a non-https baseUrl" do
      result = described_class.coerce(valid.merge(baseUrl: "http://api.example.com/v1"))
      expect(result).to be_failure
      expect(result.failure.context[:message]).to include("https")
    end

    it "refuses beyond the length bounds" do
      aggregate_failures do
        expect(described_class.coerce(valid.merge(baseUrl: "https://x.com/#{"a" * 2100}"))).to be_failure
        expect(described_class.coerce(valid.merge(model: "m" * 201))).to be_failure
        expect(described_class.coerce(valid.merge(apiKey: "k" * 4001))).to be_failure
      end
    end

    it "refuses a non-hash input" do
      expect(described_class.coerce("nope")).to be_failure
    end
  end

  describe "the ticket payload round-trip" do
    it "to_payload → from_payload preserves the configuration" do
      override = described_class.coerce(valid).value!
      restored = described_class.from_payload(override.to_payload)
      expect(restored.configuration).to eq(override.configuration)
    end
  end
end
