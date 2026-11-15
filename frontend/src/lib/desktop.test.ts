import { describe, expect, it } from "vitest";
import { detectDesktop } from "./desktop";

/** Epic 39 T1: the Electron user agent is the desktop-shell signal. */
describe("detectDesktop", () => {
  it("recognizes the macOS shell agent", () => {
    const agent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Synapse/0.3.0 Chrome/146.0.0.0 Electron/45.3.2 Safari/537.36";
    expect(detectDesktop(agent)).toEqual({ isDesktop: true, platform: "mac" });
  });

  it("recognizes the Windows shell agent", () => {
    const agent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Synapse/0.3.0 Chrome/146.0.0.0 Electron/45.3.2 Safari/537.36";
    expect(detectDesktop(agent)).toEqual({ isDesktop: true, platform: "win" });
  });

  it("a plain browser (and jsdom) is the web shell", () => {
    expect(detectDesktop("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toEqual({
      isDesktop: false,
      platform: null,
    });
    expect(detectDesktop("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toEqual({
      isDesktop: false,
      platform: null,
    });
  });
});
