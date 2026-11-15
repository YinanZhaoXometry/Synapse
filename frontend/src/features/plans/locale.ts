/**
 * Locale-tag helper (review dedup): the one place deciding the BCP-47 tag for
 * `toLocaleDateString` — previously duplicated as a ternary in Plans Home and
 * Plan Home.
 */
import type { UiLanguage } from "@/ai/types";

export function localeTag(language: UiLanguage): "zh-CN" | "zh-Hant" | "en-US" {
  // zh-TW formats through the traditional-Chinese locale (owner bug round
  // 2026-11-15) — date/number shaping follows the script, not the region.
  if (language === "zh") return "zh-CN";
  if (language === "zh-TW") return "zh-Hant";
  return "en-US";
}
