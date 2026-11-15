import { createContext, useContext, type ReactNode } from "react";

/**
 * The shell-chrome seam (owner bug round 2026-11-15): a route can ask the
 * AppLayout shell to get out of the way — hide the sidebars, the mobile
 * header, and the bottom nav so the route owns the whole viewport. The one
 * consumer is the reader's immersive mode (the shell previously had no
 * collapse mechanism at all, so immersive reading kept the left sidebar
 * standing). Exiting immersive or unmounting the route restores the chrome.
 *
 * The default is a NO-OP, not a throw (unlike useLanguage/useTheme): hiding
 * the chrome is a courtesy ask — a component rendered outside the shell
 * (standalone component tests) must not crash for missing shell context.
 */
export interface ShellChrome {
  chromeHidden: boolean;
  setChromeHidden(hidden: boolean): void;
}

const ShellChromeContext = createContext<ShellChrome>({
  chromeHidden: false,
  setChromeHidden: () => {},
});

export function useShellChrome(): ShellChrome {
  return useContext(ShellChromeContext);
}

/** The shell mounts it with its own state (AppLayout owns chromeHidden). */
export function ShellChromeProvider({ value, children }: { value: ShellChrome; children: ReactNode }) {
  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
}
