import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { BrandMark, CloseIcon, DownloadIcon, MenuIcon } from "./landing-icons";

// The five in-page anchors the header nav + scrollspy share (landing sections).
export const LANDING_SECTIONS = ["lp-workflow", "lp-features", "lp-preview", "lp-scenarios", "lp-faq"] as const;

export function LandingHeader({ onOpenDownload }: { onOpenDownload: (event: React.MouseEvent) => void }) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const headerRef = useRef<HTMLElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  // Scrollspy (ported from the design's rAF-throttled scroll handler): the last
  // section whose top passes 38% of the viewport is the current one.
  useEffect(() => {
    let frameRequested = false;
    const update = () => {
      frameRequested = false;
      let currentId = "";
      LANDING_SECTIONS.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.38) currentId = id;
      });
      setCurrentSection(currentId);
    };
    const onScroll = () => {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Mobile menu: outside click closes, Escape closes + restores focus, and
  // crossing back over the desktop breakpoint closes (matchMedia, as designed).
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    document.addEventListener("click", onPointerDown);
    document.addEventListener("keydown", onKey);
    desktopQuery.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("click", onPointerDown);
      document.removeEventListener("keydown", onKey);
      desktopQuery.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  const navItems = [
    { href: "#lp-workflow", key: "landing.nav.workflow" },
    { href: "#lp-features", key: "landing.nav.features" },
    { href: "#lp-preview", key: "landing.nav.preview" },
    { href: "#lp-scenarios", key: "landing.nav.scenarios" },
    { href: "#lp-faq", key: "landing.nav.faq" },
  ];
  const navLink = useCallback(
    (item: { href: string; key: string }) => (
      <a
        key={item.href}
        className="lp-nav-link"
        href={item.href}
        aria-current={currentSection === item.href.slice(1) ? "true" : undefined}
      >
        {t(item.key)}
      </a>
    ),
    [currentSection, t],
  );

  return (
    <header className="lp-header" ref={headerRef}>
      <div className="lp-container lp-header-inner">
        <a className="lp-brand" href="#lp-top" aria-label={t("landing.header.brandAria")}>
          <BrandMark />
          <span className="lp-brand-name">Synapse</span>
          <span className="lp-brand-tag">{t("brand.sub")}</span>
        </a>
        <nav className="lp-primary-nav" aria-label={t("landing.header.primaryNavAria")}>
          {navItems.map(navLink)}
        </nav>
        <div className="lp-header-actions">
          <Link className="lp-login-link" to="/login">
            {t("landing.header.login")}
          </Link>
          <button className="lp-btn lp-btn-primary lp-btn-sm" type="button" onClick={(event) => onOpenDownload(event)}>
            <DownloadIcon />
            {t("landing.header.download")}
          </button>
          <button
            className="lp-menu-toggle"
            type="button"
            ref={menuToggleRef}
            aria-expanded={menuOpen}
            aria-controls="lp-mobile-nav"
            aria-label={menuOpen ? t("landing.header.closeMenu") : t("landing.header.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        {menuOpen && (
          <nav className="lp-mobile-nav" id="lp-mobile-nav" aria-label={t("landing.header.mobileNavAria")}>
            {navItems.map((item) => (
              <a key={item.href} className="lp-nav-link" href={item.href} onClick={() => setMenuOpen(false)}>
                {t(item.key)}
              </a>
            ))}
            <Link className="lp-nav-link" to="/login" onClick={() => setMenuOpen(false)}>
              {t("landing.header.login")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
