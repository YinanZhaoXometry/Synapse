import "./landing.css";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isMacDesktopShell } from "@/lib/desktop";
import { useTheme } from "@/contexts/ThemeContext";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingCapabilities, LandingFaq, LandingScenarios, LandingStatement, LandingWorkflow, type DemoTabId } from "./LandingSections";
import { LandingPreview } from "./LandingPreview";
import { LandingDownloadSection } from "./LandingDownload";
import { LandingFooter } from "./LandingFooter";

/**
 * The marketing landing page (epic-37) — the root route's face for logged-out
 * visitors (AD-8 amendment: a token at `/` still goes straight to Plans Home).
 * Ported from the Open Design deliverable with an `lp-` namespace (see
 * landing.css); the page keeps its fixed dark palette regardless of the app
 * theme, and carries the only piece of global state it touches: the demo tab
 * shared by the capability links + preview stage. Download CTAs leave for the
 * GitHub releases page (owner round 2026-11-15).
 */
export default function LandingPage() {
  const { t } = useLanguage();
  const { reduceMotion } = useTheme();
  const [activeDemo, setActiveDemo] = useState<DemoTabId>("organize");

  // Smooth-scroll + header scroll-padding live on <html> (the page's scroll
  // container), gated behind a landing-only class so the app is untouched.
  // lp-boot-dark is the index.html boot script's anti-flash class: the landing
  // claims it while mounted, the warm app canvas resumes on the way out.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("lp-active");
    return () => {
      root.classList.remove("lp-active");
      root.classList.remove("lp-boot-dark");
    };
  }, []);

  // The landing owns its tab title (first per-page title in the app); restore
  // the app-wide title on unmount.
  useEffect(() => {
    const previous = document.title;
    document.title = t("meta.landingTitle");
    return () => {
      document.title = previous;
    };
  }, [t]);

  return (
    <div className={reduceMotion ? "lp-root lp-reduce-motion" : "lp-root"}>
      {/* Pre-login surfaces render outside AppLayout (no sidebar = no drag
          region): the desktop shell keeps a transparent top strip so the
          frameless window stays movable here too (epic 39 T1). */}
      {isMacDesktopShell && <div className="desktop-drag-strip" aria-hidden="true" />}
      <a className="lp-skip-link" href="#lp-main">
        {t("landing.skip")}
      </a>
      <LandingHeader />
      <main id="lp-main">
        <LandingHero />
        <LandingStatement />
        <LandingWorkflow />
        <LandingCapabilities onSelectDemo={setActiveDemo} />
        <LandingPreview activeTab={activeDemo} onSelectTab={setActiveDemo} />
        <LandingScenarios />
        <LandingDownloadSection />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
