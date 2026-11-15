/**
 * i18n dictionary — FULL zh/en/zhTW parity (epic P3-17 ticket 04; zhTW added
 * owner bug round 2026-11-15): the whole translations table must have
 * identical key sets in all three languages with non-empty copy on every
 * key. The four namespace-scoped parity walks (tasks.*, the T5 namespaces,
 * quiz/flashcards) predate this and stay as documentation of when each was
 * added; this walk closes what they couldn't — a one-sided key under
 * dashboard.*, reader.*, planner.*, hub.* or anywhere else now fails here
 * instead of surfacing as raw key text in one language.
 */
import { describe, expect, it } from "vitest";
import { translations } from "./i18n-dictionary";

describe("i18n dictionary — full zh/en/zhTW parity", () => {
  it("zh, en and zhTW carry the exact same key sets, all directions", () => {
    const zh = Object.keys(translations.zh);
    const en = Object.keys(translations.en);
    const zhTW = Object.keys(translations.zhTW);

    // Anti-vacuity: the walk must actually be looking at the whole table —
    // a structural accident that emptied any side would otherwise pass
    // the set equality below with three empty arrays. The dictionary is
    // hundreds of keys; 300 is a floor far under the real count, not a cap.
    expect(zh.length).toBeGreaterThanOrEqual(300);
    expect(en.length).toBeGreaterThanOrEqual(300);
    expect(zhTW.length).toBeGreaterThanOrEqual(300);

    expect(zh.filter((key) => !(key in translations.en)), "keys missing from en").toEqual([]);
    expect(en.filter((key) => !(key in translations.zh)), "keys missing from zh").toEqual([]);
    expect(zh.filter((key) => !(key in translations.zhTW)), "keys missing from zhTW").toEqual([]);
    expect(zhTW.filter((key) => !(key in translations.zh)), "keys in zhTW missing from zh").toEqual([]);
  });

  it("every key has non-empty copy in ALL THREE languages", () => {
    for (const key of Object.keys(translations.zh)) {
      expect(translations.zh[key as keyof typeof translations.zh], `zh copy for ${key}`).toBeTruthy();
      expect(translations.en[key as keyof typeof translations.en], `en copy for ${key}`).toBeTruthy();
      expect(translations.zhTW[key as keyof typeof translations.zhTW], `zhTW copy for ${key}`).toBeTruthy();
    }
  });

  it("zhTW is script-converted zh, not a second simplified table (spot anchors)", () => {
    // Cheap drift detector: the traditional forms of a few load-bearing
    // strings. If the generator's source column ever gets re-pointed at en
    // (or the table regenerated from the wrong block), these break.
    expect(translations.zhTW["brand.sub"]).toBe("學習夥伴");
    expect(translations.zhTW["quiz.hint"]).toBe("✦ 提示（不計分）");
    expect(translations.zhTW["auth.loginTitle"]).toBe("歡迎回來");
    expect(translations.zhTW["common.langName"]).toBe("中文");
  });
});
