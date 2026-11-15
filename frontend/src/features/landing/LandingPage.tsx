import "./landing.css";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingCapabilities, LandingFaq, LandingScenarios, LandingStatement, LandingWorkflow, type DemoTabId } from "./LandingSections";
import { LandingPreview } from "./LandingPreview";
import { DownloadDialog, LandingDownloadSection } from "./LandingDownload";
import { LandingFooter } from "./LandingFooter";

/**
 * The marketing landing page (epic-37) — the root route's face for logged-out
 * visitors (AD-8 amendment: a token at `/` still goes straight to Plans Home).
 * Ported from the Open Design deliverable with an `lp-` namespace (see
 * landing.css); the page keeps its fixed warm palette regardless of the app
 * theme, and carries the only two pieces of global state it touches: the demo
 * tab shared by the capability links + preview stage, and the download dialog
 * (any of its three triggers restores focus on close).
 */
export default function LandingPage() {
  const { t } = useLanguage();
  const { reduceMotion } = useTheme();
  const [activeDemo, setActiveDemo] = useState<DemoTabId>("organize");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadTriggerRef = useRef<HTMLElement | null>(null);

  // Smooth-scroll + header scroll-padding live on <html> (the page's scroll
  // container), gated behind a landing-only class so the app is untouched.
  useEffect(() => {
    document.documentElement.classList.add("lp-active");
    return () => document.documentElement.classList.remove("lp-active");
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

  const openDownload = (event: React.MouseEvent) => {
    downloadTriggerRef.current = event.currentTarget as HTMLElement;
    setDownloadOpen(true);
  };

  return (
    <div className={reduceMotion ? "lp-root lp-reduce-motion" : "lp-root"}>
      <a className="lp-skip-link" href="#lp-main">
        {t("landing.skip")}
      </a>
      <LandingHeader onOpenDownload={openDownload} />
      <main id="lp-main">
        <LandingHero onOpenDownload={openDownload} />
        <LandingStatement />
        <LandingWorkflow />
        <LandingCapabilities onSelectDemo={setActiveDemo} />
        <LandingPreview activeTab={activeDemo} onSelectTab={setActiveDemo} />
        <LandingScenarios />
        <LandingDownloadSection onOpen={openDownload} />
        <LandingFaq />
      </main>
      <LandingFooter />
      <DownloadDialog open={downloadOpen} onClose={() => setDownloadOpen(false)} triggerRef={downloadTriggerRef} />
    </div>
  );
}
