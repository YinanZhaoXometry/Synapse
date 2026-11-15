/**
 * Desktop-shell detection (epic 39): the Electron shell keeps its default
 * user agent, which contains "Electron" plus Chromium's platform token. No
 * preload bridge exists by design — the SPA stays a pure web app, and the
 * user agent is the only channel. Detected ONCE at module load; jsdom's
 * default agent contains neither token, so tests default to the web shell.
 */
export type DesktopPlatform = "mac" | "win";

export function detectDesktop(userAgent: string): {
  isDesktop: boolean;
  platform: DesktopPlatform | null;
} {
  if (!userAgent.includes("Electron")) return { isDesktop: false, platform: null };
  return { isDesktop: true, platform: userAgent.includes("Macintosh") ? "mac" : "win" };
}

const detected = detectDesktop(typeof navigator === "undefined" ? "" : navigator.userAgent);

/** True inside the Electron desktop shell (either platform). */
export const isDesktopShell = detected.isDesktop;

/** The shell's platform, or null on the web — gates macOS-only title-bar CSS. */
export const desktopPlatform: DesktopPlatform | null = detected.platform;

export const isMacDesktopShell = desktopPlatform === "mac";
